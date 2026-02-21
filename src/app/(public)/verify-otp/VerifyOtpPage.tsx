"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import PostcodeModal from "@/components/PostcodeModal";
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Footer from "@/components/layout/Footer";
import { getStorageUrl } from '@/utils/urlHelpers';
import { AuthButton, AuthTitle } from "@/components/auth";
import StepBar from "@/components/StepBar";
 
export default function VerifyOtpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [address, setAddress] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  
  const email = searchParams.get("email") || localStorage.getItem("signupEmail") || "";
  const userType = searchParams.get("userType") || localStorage.getItem("signupUserType") || "seller";

  // Load address from localStorage on mount
  React.useEffect(() => {
    const savedAddress = localStorage.getItem("deliveryAddress");
    if (savedAddress) {
      setAddress(savedAddress);
    }
  }, []);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Send OTP automatically when page loads (if email is available and not already sent)
  useEffect(() => {
    const sendInitialOtp = async () => {
      if (!email) return;
      
      // Normalize email to match how it was stored
      const normalizedEmail = email.trim().toLowerCase();
      
      // Check if OTP was already sent (stored in sessionStorage)
      const otpSent = sessionStorage.getItem(`otp_sent_${normalizedEmail}`);
      if (otpSent) {
        // OTP already sent, set countdown to prevent immediate resend
        setCountdown(60);
        return; // Already sent, don't send again
      }
      
      try {
        // Try to get CSRF cookie first
        try {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/sanctum/csrf-cookie`, {
            credentials: 'include',
          }).catch(() => {
            console.log('CSRF cookie endpoint not available, continuing anyway');
          });
        } catch (csrfError) {
          console.log('CSRF cookie request failed, continuing:', csrfError);
        }

        // Send OTP to email (use normalized email)
        const res = await fetch('/api/send-code', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ email: normalizedEmail }),
        });

        if (res.ok) {
          // Mark as sent
          sessionStorage.setItem(`otp_sent_${normalizedEmail}`, 'true');
          // Set countdown to 60 seconds
          setCountdown(60);
        } else {
          console.error('Failed to send initial OTP:', res.status, res.statusText);
        }
      } catch (error) {
        console.error('Error sending initial OTP:', error);
      }
    };

    sendInitialOtp();
  }, [email]);

  const handleOtpChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Move to next input
    if (value && index < 3) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join("");
    console.log('handleVerify called with code:', code);
    
    if (code.length === 4) {
      setIsSubmitting(true);
      setErrorMessage("");
      
      try {
        // Try to get CSRF cookie first
        try {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/sanctum/csrf-cookie`, {
            credentials: 'include',
          }).catch(() => {
            console.log('CSRF cookie endpoint not available, continuing anyway');
          });
        } catch (csrfError) {
          console.log('CSRF cookie request failed, continuing:', csrfError);
        }

        // Normalize the code - ensure it's exactly 4 digits
        const normalizedCode = code.trim().replace(/\s+/g, '').replace(/[^0-9]/g, '');
        // Normalize email to lowercase to match how it was sent
        const normalizedEmail = email.trim().toLowerCase();

        // Validate code length
        if (!normalizedCode || normalizedCode.length !== 4) {
          setErrorMessage('Please enter a valid 4-digit verification code.');
          setIsSubmitting(false);
          return;
        }

        console.log('Verifying code:', {
          email: normalizedEmail,
          code_original: code,
          code_normalized: normalizedCode,
          code_length: normalizedCode.length,
        });

        // Verify OTP
        console.log('Making request to:', '/api/verify-code');
        console.log('Request body:', { email: normalizedEmail, code: normalizedCode });
        
        const res = await fetch('/api/verify-code', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            email: normalizedEmail,
            code: normalizedCode,
          }),
        });

        console.log('Response status:', res.status);
        console.log('Response headers:', Object.fromEntries(res.headers.entries()));

        if (!res.ok) {
          const contentType = res.headers.get('content-type');
          let errorMessage = 'Invalid verification code. Please try again.';
          let errorDetails = null;

          if (contentType && contentType.includes('application/json')) {
            try {
              const errorData = await res.json();
              errorMessage = errorData.message || errorMessage;
              errorDetails = errorData.debug || errorData.errors || null;
              
              console.error('Verification error:', {
                status: res.status,
                message: errorMessage,
                details: errorDetails,
                full_response: errorData,
              });
            } catch (jsonError) {
              console.error('Failed to parse error response as JSON:', jsonError);
            }
          } else {
            const text = await res.text();
            console.error('Non-JSON error response:', {
              status: res.status,
              statusText: res.statusText,
              preview: text.substring(0, 200),
            });
          }

          setErrorMessage(errorMessage);
          setIsSubmitting(false);
          return;
        }

        const responseData = await res.json();
        console.log('Verification successful:', responseData);
        console.log('About to redirect to:', `/store-setup/step-2?email=${encodeURIComponent(normalizedEmail)}&userType=${userType}`);

        // OTP verified successfully - navigate to store setup step 2
        console.log('About to call router.push...');
        const cleanEmail = normalizedEmail.trim();
        const cleanUserType = userType.trim();
        const targetUrl = `/store-setup/step-2?email=${encodeURIComponent(cleanEmail)}&userType=${encodeURIComponent(cleanUserType)}`;
        console.log('Navigating to:', targetUrl);
        router.push(targetUrl);
        console.log('router.push called');
      } catch (error: any) {
        console.error('Error verifying OTP:', error);
        setErrorMessage(error.message || 'An error occurred while verifying the code. Please try again.');
        setIsSubmitting(false);
      }
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || isResending) return;
    
    setIsResending(true);
    setErrorMessage("");
    
    try {
      // Normalize email to lowercase for consistency
      const normalizedEmail = email.trim().toLowerCase();
      
      // Try to get CSRF cookie first
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/sanctum/csrf-cookie`, {
          credentials: 'include',
        }).catch(() => {
          console.log('CSRF cookie endpoint not available, continuing anyway');
        });
      } catch (csrfError) {
        console.log('CSRF cookie request failed, continuing:', csrfError);
      }

      // Send OTP to email (use normalized email)
      const res = await fetch('/api/send-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email: normalizedEmail }),
      });

      if (!res.ok) {
        const contentType = res.headers.get('content-type');
        let errorMessage = 'Failed to resend verification code. Please try again.';

        if (contentType && contentType.includes('application/json')) {
          try {
            const errorData = await res.json();
            errorMessage = errorData.message || errorMessage;
          } catch (jsonError) {
            console.error('Failed to parse error response as JSON:', jsonError);
          }
        }

        setErrorMessage(errorMessage);
        setIsResending(false);
        return;
      }

      // Small delay to ensure code is stored
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mark as sent in sessionStorage (use normalized email)
      sessionStorage.setItem(`otp_sent_${normalizedEmail}`, 'true');
      
      // Set countdown to 60 seconds
      setCountdown(60);
      setErrorMessage("");
    } catch (error: any) {
      console.error('Error resending OTP:', error);
      setErrorMessage(error.message || 'An error occurred while resending the code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const handleSaveAddress = (selectedAddress: string) => {
    setAddress(selectedAddress);
    localStorage.setItem("deliveryAddress", selectedAddress);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header - Orange Background */}
     <header className="bg-[#F44322] w-full">
             <nav className="container mx-auto flex justify-between items-center h-16 px-4">
               {/* Logo - Left Side */}
               <Link href="/home">
                 <img 
                   src={getStorageUrl('/assets/images/MultiKonnect.svg')}
                   alt="MultiKonnect" 
                   className="h-4 w-auto object-contain cursor-pointer brightness-0 invert"
                 />
               </Link>
     
               {/* Right Side Buttons */}
               <div className="flex items-center gap-3">
                 {/* Address Button */}
                 <button 
                   onClick={() => setIsModalOpen(true)} 
                   className="flex items-center gap-2 rounded-full border border-white bg-transparent text-white px-4 py-2 h-10 hover:bg-white/10 transition-colors"
                 >
                   <LocationOnIcon className="w-5 h-5 text-white" />
                   <span className="text-sm font-medium whitespace-nowrap">
                     {address || 'Enter Delivery Address'}
                   </span>
                   <ExpandMoreIcon className="w-5 h-5 text-white" />
                 </button>
                 {/* Login Button */}
                 <Link href="/sign-in">
                   <button className="border border-white bg-transparent text-white px-6 py-2 rounded-full h-10 font-medium hover:bg-white/10 transition-colors">
                     Log in
                   </button>
                 </Link>
               </div>
             </nav>
           </header>

      {/* Main Content Area - Dark Gray Background */}
      <main className="flex-1 flex justify-center items-center py-12 px-4 bg-white">
        {/* White Card */}
        <div className="w-full max-w-[512px] mx-auto md:py-[30px] md:px-8 px-5 py-4 bg-white !rounded-lg border border-[#D8DADC] relative">
          {/* Back Button - Top Left */}
          <button 
            onClick={() => router.back()}
            className="absolute top-8 left-8 p-2 z-30 rounded-full border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-colors"
          >
            <ArrowBackIcon className="h-5 w-5 text-black" />
          </button>

          {/* Brand Name - Centered */}
          <div className="text-center mb-8 z-20 flex justify-center items-center">
            <img src={'/assets/images/MultiKonnect.svg'} alt="MultiKonnect" className="h-8 w-36 object-contain cursor-pointer" />
          </div>

          <StepBar currentStep={1} totalSteps={4} />

          {/* Heading - Left Aligned */}
          <AuthTitle
           heading="Enter the 4 Digit code Sent to you"
           subtitle={email || "rajasaifali125@gmail.com"}
           align="left"
          />
          

          {/* OTP Inputs */}
          <style>{`
            .otp-input:focus {
              border-color: #F44322 !important;
              outline: none !important;
              border-width: 2px !important;
            }
          `}</style>
          <div className="flex justify-between gap-4 mb-6">
            {otp.map((digit, index) => {
              const isFirstInput = index === 0;
              const hasValue = digit.length > 0;
              return (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  inputMode="numeric"
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-20 h-16 text-center rounded-md focus:outline-none focus:ring-0 focus:ring-vivid-red border-0 bg-gray-100"
                  maxLength={1}
                  placeholder=""
                />
              );
            })}
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errorMessage}</p>
            </div>
          )}

          {/* Tip - Left Aligned */}
          <p className="text-xs text-left text-gray-500 mb-2">
            <span className="font-semibold">Tip :</span> Make Sure to check your inbox and spam folder
          </p>
          {/* Buttons - Resend left, Verify Code right */}
          <div className="flex gap-4 mb-6">
            <AuthButton 
              onClick={handleResend}
              disabled={countdown > 0 || isResending}
              variant="secondary"
              fullWidth={true}
            >
              Resend
            </AuthButton>
            <AuthButton 
              onClick={handleVerify}
              disabled={otp.join("").length !== 4 || isSubmitting}
              variant="primary"
              fullWidth={true}
            >
              Verify Code
            </AuthButton>
          </div>

          {/* Footer Link */}
          <div className="text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <Link href="/sign-up" className="text-[#FF6B35] underline">
              Sign Up
            </Link>
          </div>
        </div>
      </main>

      {/* Footer - Dark Gray Background */}
      <Footer />

      {/* Postcode Modal */}
      <PostcodeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveAddress}
      />
    </div>
  );
}


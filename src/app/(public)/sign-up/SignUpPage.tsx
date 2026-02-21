"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Footer from "@/components/layout/Footer";
import PostcodeModal from "@/components/PostcodeModal";
import { AuthInput, AuthTitle, AuthButton } from "@/components/auth";
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

import { getStorageUrl } from '@/utils/urlHelpers';

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [userType, setUserType] = useState("seller");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [address, setAddress] = useState("");

  // Load address from localStorage on mount
  React.useEffect(() => {
    const savedAddress = localStorage.getItem("deliveryAddress");
    if (savedAddress) {
      setAddress(savedAddress);
    }
  }, []);

  const handleContinue = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (isSubmitting) return;

    // Handle continue logic here
    if (email.trim()) {
      setIsSubmitting(true);

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

        // Normalize email to lowercase for consistency
        const normalizedEmail = email.trim().toLowerCase();

        // Send OTP to email
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
          let errorMessage = 'Failed to send verification code. Please try again.';

          if (contentType && contentType.includes('application/json')) {
            try {
              const errorData = await res.json();
              errorMessage = errorData.message || errorMessage;
            } catch (jsonError) {
              console.error('Failed to parse error response as JSON:', jsonError);
            }
          }

          alert(errorMessage);
          setIsSubmitting(false);
          return;
        }

        // Small delay to ensure code is stored
        await new Promise(resolve => setTimeout(resolve, 500));

        // Store email (normalized) and userType for next step
        localStorage.setItem("signupEmail", normalizedEmail);
        localStorage.setItem("signupUserType", userType);
        // Mark OTP as sent to prevent duplicate sending
        sessionStorage.setItem(`otp_sent_${normalizedEmail}`, 'true');

        // Navigate to verify-otp page with email as query parameter
        router.push(`/verify-otp?email=${encodeURIComponent(normalizedEmail)}&userType=${userType}`);
      } catch (error: any) {
        console.error('Error sending OTP:', error);
        alert(error.message || 'An error occurred while sending the code. Please try again.');
        setIsSubmitting(false);
      }
    }
  };

  const handleUserTypeChange = (type: string) => {
    setUserType(type);
  };

  const handleSaveAddress = (selectedAddress: string) => {
    setAddress(selectedAddress);
    localStorage.setItem("deliveryAddress", selectedAddress);
  };

  return (
    <div className="min-h-screen flex flex-col ">
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
        <div className="w-full max-w-[512px] mx-auto md:py-[30px] md:px-8 px-5 py-4 bg-white !rounded-lg border border-[#D8DADC]">
          {/* Brand Name - Orange */}
          <div className="text-center mb-8 flex justify-center items-center">
            <img src='/assets/images/MultiKonnect.svg' alt="MultiKonnect" className="h-[39px] w-[137px] object-contain cursor-pointer" />
          </div>

          {/* Heading & Subtitle */}
          <AuthTitle
            heading="What your Phone Number or Email?"
            subtitle="Get food, drinks, groceries, and more delivered."
          />

          {/* Radio Buttons */}
          <div className="flex gap-12 mb-6">
            <label
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => handleUserTypeChange("seller")}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${userType === "seller"
                  ? "border-[#F44322] bg-white"
                  : "border-gray-400 bg-white"
                }`}>
                {userType === "seller" && (
                  <div className="w-2.5 h-2.5 rounded-full bg-[#F44322]"></div>
                )}
              </div>
              <span className={`text-base ${userType === "seller"
                  ? "text-gray-800 font-semibold"
                  : "text-gray-500 font-normal"
                }`}>
                Seller
              </span>
            </label>
            <label
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => handleUserTypeChange("supplier")}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${userType === "supplier"
                  ? "border-[#F44322] bg-white"
                  : "border-gray-400 bg-white"
                }`}>
                {userType === "supplier" && (
                  <div className="w-2.5 h-2.5 rounded-full bg-[#F44322]"></div>
                )}
              </div>
              <span className={`text-base ${userType === "supplier"
                  ? "text-gray-800 font-semibold"
                  : "text-gray-500 font-normal"
                }`}>
                Supplier
              </span>
            </label>
          </div>

          {/* Input Section */}
          <AuthInput
            label="Enter phone or Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email"
            className="mb-6"
          />

          {/* Continue Button */}
          <AuthButton
            variant="primary"
            fullWidth
            loading={isSubmitting}
            disabled={!email.trim()}
            onClick={handleContinue}
            className="mb-6"
          >
            Continue
          </AuthButton>

          {/* Divider */}
          <div className="flex items-center mb-4">
            <div className="flex-auto border-t border-gray-200" />
            <span className="mx-2 text-[15.22px] font-normal text-[#6B6B6B]">Or continue with</span>
            <div className="flex-auto border-t border-gray-200" />
          </div>

          {/* Social Buttons */}
          <div className="flex flex-col gap-4 mb-6">
            {/* Google Button */}
            <button className="flex items-center justify-center gap-3 w-full h-14 rounded-2xl border border-[#DCDEE0] bg-white text-[#DCDEE0] transition-colors px-4">
              <img src= '/assets/images/google.svg' alt="Google" className="w-6 h-6 flex-shrink-0" />
              <span className="text-[#111111] text-base">
                Continue with Google
              </span>
            </button>

            {/* Apple Button */}
            <button className="flex items-center justify-center gap-3 w-full h-14 rounded-2xl border border-[#DCDEE0] bg-white text-[#DCDEE0] transition-colors px-4">
                <img src= '/assets/images/apple.svg' alt="Apple" className="w-6 h-6 flex-shrink-0" />
              <span className="text-[#111111] text-base">
                Continue with Apple
              </span>
            </button>
            <button className="flex items-center justify-center gap-3 w-full h-14 rounded-2xl border border-[#DCDEE0] bg-white text-[#DCDEE0] transition-colors px-4">
                <img src= '/assets/images/qrcode.svg' alt="Apple" className="w-6 h-6 flex-shrink-0" />
              <span className="text-[#111111] text-base">
                Continue with QR Code
              </span>
            </button>
          </div>

          {/* Footer Link */}
          <div className="text-center text-sm text-gray-600">
              <span className="mt-2 text-center text-[#000000B2]">
              Don't have an account? <Link href="/sign-up" className="text-vivid-red !font-semibold">Sign up</Link>
            </span>
            
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

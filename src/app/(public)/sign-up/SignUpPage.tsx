"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Footer from "@/components/layout/Footer";
import PostcodeModal from "@/components/PostcodeModal";
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
              src={getStorageUrl('/storage/images/logo/MultiKonnect.png')}
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
                {address || 'Enter Delivery Address'  }
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
        <div className="bg-white rounded-2xl w-full max-w-[449px] p-8 shadow-lg">
          {/* Brand Name - Orange */}
          <div className="text-center mb-8">
            <h1 className="text-[#FF6B35] text-2xl font-bold">
              MultiKonnect
            </h1>
          </div>

          {/* Heading - Dark Gray */}
          <h2 className="text-[#2A2A2A] text-3xl font-bold mb-3 leading-tight text-left">
            What your Phone Number or Email?
          </h2>

          {/* Subtitle - Light Gray */}
          <p className="text-gray-500 text-base mb-6 text-left">
            Get food, drinks, groceries, and more delivered.
          </p>

          {/* Radio Buttons */}
          <div className="flex gap-12 mb-6">
            <label 
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => handleUserTypeChange("seller")}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                userType === "seller" 
                  ? "border-[#F44322] bg-white" 
                  : "border-gray-400 bg-white"
              }`}>
                {userType === "seller" && (
                  <div className="w-2.5 h-2.5 rounded-full bg-[#F44322]"></div>
                )}
              </div>
              <span className={`text-base ${
                userType === "seller" 
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
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                userType === "supplier" 
                  ? "border-[#F44322] bg-white" 
                  : "border-gray-400 bg-white"
              }`}>
                {userType === "supplier" && (
                  <div className="w-2.5 h-2.5 rounded-full bg-[#F44322]"></div>
                )}
              </div>
              <span className={`text-base ${
                userType === "supplier" 
                  ? "text-gray-800 font-semibold" 
                  : "text-gray-500 font-normal"
              }`}>
                Supplier
              </span>
            </label>
          </div>

          {/* Input Section */}
          <div className="mb-6">
            <label className="block text-[#2A2A2A] text-base mb-2 font-medium text-left">
              Enter phone or Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email"
              className="w-full h-14 px-4 rounded-lg bg-[#F5F5F5] text-gray-500 text-base border-none outline-none placeholder:text-gray-400"
            />
          </div>

          {/* Continue Button - Orange */}
          <button
            onClick={handleContinue}
            disabled={!email.trim() || isSubmitting}
            className={`w-full h-14 rounded-lg text-white text-base font-bold mb-6 transition-colors ${
              email.trim() && !isSubmitting
                ? 'bg-[#FF6B35] hover:bg-[#FF5722]'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? 'Processing...' : 'Continue'}
          </button>

          {/* Divider */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="text-gray-500 text-sm">
              Or continue with
            </span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          {/* Social Buttons */}
          <div className="flex flex-col gap-4 mb-6">
            {/* Google Button */}
            <button className="flex items-center justify-start gap-3 w-full h-12 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors px-4">
              <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="text-gray-700 text-base">
                Continue with Google
              </span>
            </button>

            {/* Apple Button */}
            <button className="flex items-center justify-start gap-3 w-full h-12 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors px-4">
              <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 24 24" fill="#000000">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.04 3.81-.72 1.57.32 2.5 1.96 3.45 3.48.08.13.07.28-.07.31-2.2-.47-3.5-1.49-4.08-2.63z"/>
                <path d="M13.44 2.53c.73-.83 1.94-1.33 2.94-1.39.13 1.21-.35 2.38-1.04 3.19-.69.81-1.83 1.38-2.85 1.33-.15-1.23.41-2.44.95-3.13z"/>
              </svg>
              <span className="text-gray-700 text-base">
                Continue with Apple
              </span>
            </button>
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

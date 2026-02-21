"use client";

import { AuthButton, AuthInput, AuthTitle } from '@/components/auth';
import StepBar from '@/components/StepBar';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Link from "next/link";
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

export default function StoreSetupStep2() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [storeName, setStoreName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const email = searchParams.get("email") || localStorage.getItem("signupEmail") || "";
  const userType = searchParams.get("userType") || localStorage.getItem("signupUserType") || "seller";

  console.log('StoreSetupStep2 loaded with:', { email, userType });

  const handleContinue = () => {
    if (!storeName.trim() || !ownerName.trim()) return;
    
    setIsSubmitting(true);
    
    // Store data
    localStorage.setItem("storeName", storeName.trim());
    localStorage.setItem("ownerName", ownerName.trim());
    
    // Navigate to next step
    setTimeout(() => {
      const cleanEmail = email.trim();
      const cleanUserType = userType.trim();
      const targetUrl = `/store-setup/step-3?email=${encodeURIComponent(cleanEmail)}&userType=${encodeURIComponent(cleanUserType)}`;
      console.log('Navigating to:', targetUrl);
      router.push(targetUrl);
    }, 300);
  };

  return (
    <div className="min-h-screen flex flex-col ">
      {/* Main Content Area - Dark Gray Background */}
      <main className="flex-1 flex justify-center items-center py-12 px-4 bg-white">
        {/* White Card */}
        <div className="w-full max-w-[512px] mx-auto md:py-[30px] md:px-8 px-5 py-4 bg-white !rounded-lg border border-[#D8DADC] relative">
          {/* Back Button - Top Left */}
          <button 
            onClick={() => router.back()}
            className="absolute top-8 left-8 p-2 z-50 rounded-full border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-colors"
          >
            <ArrowBackIcon className="h-5 w-5 text-black" />
          </button>

          {/* Brand Name - Centered */}
          <div className="relative flex z-20 items-center justify-center mb-8 mt-2">
            <img src={'/assets/images/MultiKonnect.svg'} alt="MultiKonnect" className="h-8 w-36 object-contain cursor-pointer" />
          </div>
          <StepBar currentStep={2} totalSteps={4} />

          <AuthTitle
            heading="Setup Your Store Name Here"
            subtitle="Enter the name of your store"
            align="center"
          />

          {/* Form Fields */}
          <div className="space-y-4 mb-6">
            <div>
              
              <AuthInput
                label="Store Name"
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="Your name"
                  />
            </div>

            <div>
              
              <AuthInput
                label="Name"
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Your name"
                  />
            </div>
          </div>

          {/* Continue Button */}
          <AuthButton
            variant="primary"
            fullWidth={true}
            onClick={handleContinue}
            disabled={!storeName.trim() || !ownerName.trim() || isSubmitting}
            className={`w-full py-3 font-semibold rounded-lg text-white transition-colors ${
              storeName.trim() && ownerName.trim() && !isSubmitting
                ? "bg-[#FF6B35] hover:bg-[#FF5722]"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            Continue
          </AuthButton>

          {/* Footer Link */}
          <div className="text-center text-sm text-gray-600 mt-6">
            Don't have an account?{" "}
            <Link href="/sign-up" className="text-[#FF6B35] underline">
              Sign Up
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}



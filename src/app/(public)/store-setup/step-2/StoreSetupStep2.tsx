"use client";

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from "next/link";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

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
        <div className="bg-white rounded-2xl w-full max-w-[449px] p-8 shadow-lg relative">
          {/* Back Button - Top Left */}
          <button 
            onClick={() => router.back()}
            className="absolute top-8 left-8 p-2 rounded-full border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-colors"
          >
            <ArrowBackIcon className="h-5 w-5 text-black" />
          </button>

          {/* Brand Name - Centered */}
          <div className="text-center mb-8">
            <h1 className="text-[#FF6B35] text-2xl font-bold">
              MultiKonnect
            </h1>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {/* Step 1 - Completed */}
            <div className="h-8 w-8 rounded-full bg-[#FF6B35] text-white flex items-center justify-center text-sm font-medium">
              1
            </div>
            {/* Dashed Line */}
            <div className="h-1 w-6 border-t-2 border-dashed border-gray-300"></div>
            {/* Step 2 - Active (Red/Orange) */}
            <div className="h-8 w-8 rounded-full bg-[#FF6B35] text-white flex items-center justify-center text-sm font-medium">
              2
            </div>
            {/* Dashed Line */}
            <div className="h-1 w-6 border-t-2 border-dashed border-gray-300"></div>
            {/* Step 3 - Inactive (Red outline with gray dot) */}
            <div className="h-8 w-8 rounded-full border-2 border-[#FF6B35] bg-white flex items-center justify-center relative">
              <div className="h-2 w-2 rounded-full bg-gray-400"></div>
            </div>
            {/* Dashed Line */}
            <div className="h-1 w-6 border-t-2 border-dashed border-gray-300"></div>
            {/* Step 4 - Inactive (Red outline with gray dot) */}
            <div className="h-8 w-8 rounded-full border-2 border-[#FF6B35] bg-white flex items-center justify-center relative">
              <div className="h-2 w-2 rounded-full bg-gray-400"></div>
            </div>
          </div>

          {/* Heading - Left Aligned */}
          <h2 className="text-[#2A2A2A] text-2xl font-bold mb-6 text-left">
            Setup Your Store Name Here
          </h2>

          {/* Form Fields */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 ml-1 text-left">
                Store Name
              </label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="Your name"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-lg focus:ring-0 focus:border-gray-200 outline-none transition-colors text-gray-800 placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 ml-1 text-left">
                Name
              </label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Your name"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-lg focus:ring-0 focus:border-gray-200 outline-none transition-colors text-gray-800 placeholder-gray-400"
              />
            </div>
          </div>

          {/* Continue Button */}
          <button
            onClick={handleContinue}
            disabled={!storeName.trim() || !ownerName.trim() || isSubmitting}
            className={`w-full py-3 font-semibold rounded-lg text-white transition-colors ${
              storeName.trim() && ownerName.trim() && !isSubmitting
                ? "bg-[#FF6B35] hover:bg-[#FF5722]"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            Continue
          </button>

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



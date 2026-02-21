"use client";

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from "next/link";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { AuthButton, AuthInput, AuthTitle } from '@/components/auth';
import StepBar from '@/components/StepBar';
 
export default function StoreSetupStep3() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const email = searchParams.get("email") || localStorage.getItem("signupEmail") || "";
  const userType = searchParams.get("userType") || localStorage.getItem("signupUserType") || "seller";

  const handleContinue = () => {
    if (!phone.trim()) return;

    setIsSubmitting(true);

    localStorage.setItem("phone", phone.trim());
    localStorage.setItem("address", address.trim());
    localStorage.setItem("city", city.trim());
    localStorage.setItem("zipCode", zipCode.trim());

    setTimeout(() => {
      const cleanEmail = email.trim();
      const cleanUserType = userType.trim();
      router.push(`/store-setup/step-4?email=${encodeURIComponent(cleanEmail)}&userType=${encodeURIComponent(cleanUserType)}`);
      setIsSubmitting(false);
    }, 300);
  };

  return (
    <div className="min-h-screen flex flex-col ">
      <main className="flex-1 flex justify-center items-center py-12 px-4 bg-white">
        <div className="w-full max-w-[512px] mx-auto md:py-[30px] md:px-8 px-5 py-4 bg-white !rounded-lg border border-[#D8DADC] relative">
          <button
            onClick={() => router.back()}
            className="absolute top-8 left-8 p-2 rounded-full border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-colors"
          >
            <ArrowBackIcon className="h-5 w-5 text-black" />
          </button>

          <div className="text-center mb-8 flex justify-center items-center">
            <img src={'/assets/images/MultiKonnect.svg'} alt="MultiKonnect" className="h-8 w-36 object-contain cursor-pointer" />
          </div>

          <StepBar currentStep={3} totalSteps={4} />

          <AuthTitle
            heading="Add Your Contact & Address"
            align="center"
          />

          <div className="space-y-4 mb-6">
            <div>
              <AuthInput
                label="Phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Your phone number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 ml-1 text-left">Address</label>
              <AuthInput
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street address"
              />
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                 <AuthInput
                  label="City"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City"
                />
              </div>
              <div className="flex-1">
                 <AuthInput
                  label="Zip Code"
                  type="text"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  placeholder="Zip code"
                />
              </div>
            </div>
          </div>

          <AuthButton
            variant="primary"
            fullWidth={true}
            onClick={handleContinue}
            loading={isSubmitting}
            disabled={!phone.trim() || isSubmitting}
          >
            Continue
          </AuthButton>

          <div className="text-center text-sm text-gray-600 mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/sign-up" className="text-[#FF6B35] underline">
              Sign Up
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

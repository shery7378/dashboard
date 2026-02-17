"use client";

import { useState, useRef, useEffect } from "react";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

interface OtpVerificationProps {
  onBack: () => void;
  onVerify: (code: string) => void;
  email?: string;
}

export default function OtpVerification({ onBack, onVerify, email }: OtpVerificationProps) {
  const [otp, setOtp] = useState(["", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Move to next input
    if (value && index < 3 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = () => {
    const code = otp.join("");
    if (code.length === 4) {
      onVerify(code);
    }
  };

  return (
    <div className="w-full px-4">
      {/* Top Row: Back Button and Logo */}
      <div className="relative flex items-center justify-center mb-8">
        <button 
          onClick={onBack}
          className="absolute left-0 p-2 rounded-full border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-colors"
          aria-label="Go back"
        >
          <ArrowBackIcon className="h-5 w-5 text-gray-600" />
        </button>
        <h1 className="text-2xl font-bold text-red-600">MultiKonnect</h1>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-center gap-2 mb-8">
        <div className="h-8 w-8 rounded-full bg-red-600 text-white flex items-center justify-center text-sm font-medium">1</div>
        <div className="h-1 w-6 border-t-2 border-dashed border-gray-300"></div>
        <div className="h-8 w-8 rounded-full border-2 border-red-500 flex items-center justify-center bg-white"></div>
        <div className="h-1 w-6 border-t-2 border-dashed border-gray-300"></div>
        <div className="h-8 w-8 rounded-full border-2 border-red-500 flex items-center justify-center bg-white"></div>
        <div className="h-1 w-6 border-t-2 border-dashed border-gray-300"></div>
        <div className="h-8 w-8 rounded-full border-2 border-red-500 flex items-center justify-center bg-white"></div>
      </div>

      {/* Title */}
      <div className="text-center mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Enter the 4 Digit code Sent to you</h2>
        <p className="text-sm text-gray-500">{email || "your email address"}</p>
      </div>

      {/* Inputs */}
      <div className="flex justify-center gap-4 mb-4">
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(el) => { if (el) inputRefs.current[index] = el }}
            type="text"
            inputMode="numeric"
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            className="w-14 h-14 bg-gray-100 rounded-lg text-center text-xl font-semibold border-none focus:ring-2 focus:ring-red-500 outline-none transition-shadow"
            maxLength={1}
            placeholder=""
          />
        ))}
      </div>

      {/* Tip */}
      <p className="text-xs text-center text-gray-500 mb-8">
        <span className="font-semibold">Tip :</span> Make Sure to check your inbox and spam folder
      </p>

      {/* Buttons */}
      <div className="flex gap-4 mb-8">
        <button 
          className="flex-1 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
          onClick={() => {/* Impl Resend Logic */}}
        >
          Resend
        </button>
        <button 
          onClick={handleVerify}
          className={`flex-1 py-3 font-medium rounded-lg transition-colors ${
            otp.join("").length === 4 
              ? "bg-red-600 text-white hover:bg-red-700" 
              : "bg-red-300 text-white cursor-not-allowed"
          }`}
          disabled={otp.join("").length !== 4}
        >
          Verify Code
        </button>
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-gray-600">
        Don't have an account? <a href="/sign-up" className="text-red-600 font-semibold hover:underline">Sign Up</a>
      </div>
    </div>
  );
}

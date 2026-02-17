"use client";

import { useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { signIn, getSession } from "next-auth/react";
import Footer from "@/components/layout/Footer";

export default function StoreSetupStep4() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [kycFileBase64, setKycFileBase64] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const email =
    searchParams.get("email") || localStorage.getItem("signupEmail") || "";
  const userType =
    searchParams.get("userType") ||
    localStorage.getItem("signupUserType") ||
    "seller";

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setSelectedFileName(file.name);

      // Convert to Base64
      const reader = new FileReader();
      reader.onloadend = () => {
        setKycFileBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleContinue = async () => {
    if (!password.trim() || !confirmPassword.trim()) {
      alert("Please enter a password and confirm it.");
      return;
    }
    
    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Get data from localStorage
      const storeName = localStorage.getItem("storeName");
      const ownerName = localStorage.getItem("ownerName");
      const phone = localStorage.getItem("phone");
      const city = localStorage.getItem("city");
      const zipCode = localStorage.getItem("zipCode");
      const address = localStorage.getItem("address");
      
      console.log("📦 LocalStorage data check:", {
        storeName,
        ownerName,
        phone,
        city,
        zipCode,
        address,
        email,
        userType,
      });

      if (!storeName || !ownerName || !phone) {
         alert("Missing setup information. Please go back and ensure all steps are completed.");
         setIsSubmitting(false);
         return;
      }

      // Map userType from 'seller' to 'vendor' if needed
      let role = userType;
      if (role === 'seller') {
        role = 'vendor';
      }

      // Collect all form data
      const formData = {
        name: ownerName,
        email: email,
        password: password,
        password_confirmation: confirmPassword,
        role: role,
        storeName: storeName,
        phone: phone,
        city: city || "",
        address: address || "",
        zip_code: zipCode || "",
        ...(kycFileBase64 && { kycDocument: kycFileBase64 }),
      };

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
      console.log("🌐 API URL:", apiUrl);
      console.log("📤 Submitting registration data:", { ...formData, password: '***', password_confirmation: '***', kycDocument: kycFileBase64 ? 'present' : 'missing' });

      // Get CSRF cookie first (Sanctum)
      try {
        console.log("🔐 Fetching CSRF cookie...");
        await fetch(`${apiUrl}/sanctum/csrf-cookie`, {
          credentials: 'include',
        });
        console.log("✅ CSRF cookie fetched");
      } catch (e) {
        console.warn('⚠️ CSRF fetch failed (continuing anyway):', e);
      }

      const registerUrl = `${apiUrl}/api/register`;
      console.log("📡 POST to:", registerUrl);

      const response = await fetch(registerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      console.log("📥 Response status:", response.status, response.statusText);

      // Read response text first, then try to parse as JSON
      const responseText = await response.text();
      console.log("📥 Raw response:", responseText.substring(0, 500));

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("❌ Failed to parse response as JSON:", parseError);
        throw new Error(`Server returned non-JSON response (status ${response.status}). Check the backend logs.`);
      }

      if (!response.ok) {
        console.error("❌ Registration error data:", data);
        const errorMsg = data.message || data.error || 'Registration failed';
        const errorDetails = data.errors ? '\n' + Object.entries(data.errors).map(([field, msgs]: [string, any]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`).join('\n') : '';
        throw new Error(errorMsg + errorDetails);
      }

      console.log("✅ Registration success:", data);
      
      // Clear localStorage setup data
      localStorage.removeItem("storeName");
      localStorage.removeItem("ownerName");
      localStorage.removeItem("phone");
      localStorage.removeItem("city");
      localStorage.removeItem("zipCode");
      localStorage.removeItem("address");
      localStorage.removeItem("signupEmail");
      localStorage.removeItem("signupUserType");
      localStorage.removeItem("deliveryAddress");
      
      // Auto sign-in after registration using NextAuth
      console.log("🔐 Auto signing in after registration...");
      const signInResult = await signIn('credentials', {
        email: email,
        password: password,
        formType: 'signin',
        redirect: false,
      });

      if (signInResult && !signInResult.error) {
        // Get the session to store the token in localStorage
        const session = await getSession();
        if (session?.accessAuthToken && typeof window !== 'undefined') {
          localStorage.setItem('auth_token', session.accessAuthToken);
          localStorage.setItem('token', session.accessAuthToken);
        }

        console.log("✅ Auto sign-in successful, redirecting to dashboard...");
        // Navigate to dashboard
        window.location.href = '/dashboards';
      } else {
        console.warn("⚠️ Auto sign-in failed, redirecting to sign-in page...", signInResult?.error);
        alert("Account created successfully! Please sign in.");
        router.push("/sign-in");
      }
    } catch (error: any) {
      console.error("❌ Error submitting form:", error);
      alert(error.message || "An error occurred during registration");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col ">
      {/* Main Content Area - Dark Gray Background */}
      <main className="flex-1 flex justify-center items-center py-12 px-4 ">
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
            <h1 className="text-[#FF6B35] text-2xl font-bold">MultiKonnect</h1>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {/* Step 1 - Completed */}
            <div className="h-8 w-8 rounded-full bg-[#FF6B35] text-white flex items-center justify-center text-sm font-medium">
              1
            </div>
            {/* Dashed Line */}
            <div className="h-1 w-6 border-t-2 border-dashed border-gray-300"></div>
            {/* Step 2 - Completed */}
            <div className="h-8 w-8 rounded-full bg-[#FF6B35] text-white flex items-center justify-center text-sm font-medium">
              2
            </div>
            {/* Dashed Line */}
            <div className="h-1 w-6 border-t-2 border-dashed border-gray-300"></div>
            {/* Step 3 - Completed */}
            <div className="h-8 w-8 rounded-full bg-[#FF6B35] text-white flex items-center justify-center text-sm font-medium">
              3
            </div>
            {/* Dashed Line */}
            <div className="h-1 w-6 border-t-2 border-dashed border-gray-300"></div>
            {/* Step 4 - Active (Red/Orange) */}
            <div className="h-8 w-8 rounded-full bg-[#FF6B35] text-white flex items-center justify-center text-sm font-medium">
              4
            </div>
          </div>

          {/* Heading - Left Aligned */}
          <h2 className="text-[#2A2A2A] text-2xl font-bold mb-6 text-left">
            Setup Your Store Password!
          </h2>

          {/* Form Fields */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 ml-1 text-left">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-lg focus:ring-0 focus:border-gray-200 outline-none transition-colors text-gray-800 placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 ml-1 text-left">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-lg focus:ring-0 focus:border-gray-200 outline-none transition-colors text-gray-800 placeholder-gray-400"
              />
            </div>
          </div>

          {/* Hidden File Input */}
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: "none" }}
          />

          {/* Action Buttons */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={handleFileUpload}
              className="flex-1 py-3 font-semibold rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors truncate px-2"
              title={selectedFileName || "Upload KYC Verification"}
            >
              {selectedFileName || "Upload KYC Verification"}
            </button>
            <button
              onClick={handleContinue}
              disabled={
                !password.trim() ||
                !confirmPassword.trim() ||
                password !== confirmPassword ||
                isSubmitting
              }
              className={`flex-1 py-3 font-semibold rounded-lg text-white transition-colors ${
                password.trim() &&
                confirmPassword.trim() &&
                password === confirmPassword &&
                !isSubmitting
                  ? "bg-[#FF6B35] hover:bg-[#FF5722]"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {isSubmitting ? "Creating..." : "Continue"}
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
    </div>
  );
}

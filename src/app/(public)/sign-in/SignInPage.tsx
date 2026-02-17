"use client";

import AuthJsForm from "@auth/forms/AuthJsForm";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
          
          {/* Logo */}
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-bold text-red-600">
              MultiKonnect
            </h1>
          </div>

          {/* Heading */}
          <h2 className="mb-2 text-center text-2xl font-bold">
            Welcome back 👋
          </h2>

          {/* Subtitle */}
          <p className="mb-6 text-center text-sm text-gray-500">
            Sign in to your account to continue
          </p>

          {/* Form */}
          <AuthJsForm formType="signin" />

          {/* Footer Link */}
          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">
              Don’t have an account?
            </span>
            <a
              href="/sign-up"
              className="ml-1 font-semibold text-red-600 hover:text-red-700"
            >
              Sign up
            </a>
          </div>

        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

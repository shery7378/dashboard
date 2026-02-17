//src/components/SignUpPageHeader.jsx
'use client';
import Link from 'next/link';
import PostcodeModal from "@/components/PostcodeModal";
import { useState, useEffect } from "react";
import Button from './UI/Button';

export default function LandingPageHeader() {
  // Force re-render
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [postcode, setPostcode] = useState("");

  useEffect(() => {
    // Check if postcode is saved in localStorage
    const savedPostcode = localStorage.getItem("postcode");
    if (!savedPostcode) {
      setIsModalOpen(false); // ask for postcode if not saved
    } else {
      setPostcode(savedPostcode);
    }
  }, []);

  const handleSavePostcode = (code) => {
    setPostcode(code);
    localStorage.setItem("postcode", code);
  };

  return (
    <>
      <header className="bg-red-600 border-b border-gray-200">
        <nav className="container mx-auto flex justify-between items-center h-16 px-4">
          {/* Logo */}
          <Link href="/home">
            <span className="text-base font-normal text-white">MultiKonnect</span>

          </Link>

          {/* Right Side Buttons */}
          <div className="md:flex items-center gap-3 hidden">
            {/* Address Button */}
           

            {/* Login Button */}
            <Link href={`/sign-in`}>
              <Button variant="transparent" className="border border-white/90 text-white rounded-full !h-10 !px-4">
                Log in
              </Button>
            </Link>

          </div>
        </nav>
      </header>

      <PostcodeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSavePostcode}
      />
    </>
  );
}

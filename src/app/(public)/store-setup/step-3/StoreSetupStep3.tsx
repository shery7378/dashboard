"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from "next/link";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

declare global {
  interface Window {
    google: any;
  }
}

export default function StoreSetupStep3() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const addressInputRef = useRef<HTMLInputElement | null>(null);
  
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [address, setAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [apiKey, setApiKey] = useState<string>('');
  
  const email = searchParams.get("email") || (typeof window !== 'undefined' ? localStorage.getItem("signupEmail") : "") || "";
  const userType = searchParams.get("userType") || (typeof window !== 'undefined' ? localStorage.getItem("signupUserType") : "seller") || "seller";

  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const envKey = process.env.NEXT_PUBLIC_MAP_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
        const response = await fetch(`${apiUrl}/api/google-maps-api-key`, {
          headers: { Accept: 'application/json' }
        });
        if (response.ok) {
          const data = await response.json();
          const fetchedKey = data?.data?.google_maps_api_key || '';
          if (fetchedKey) {
            setApiKey(fetchedKey);
            return;
          }
        }
        setApiKey(envKey);
      } catch (err) {
        setApiKey(process.env.NEXT_PUBLIC_MAP_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '');
      }
    };
    fetchApiKey();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.google?.maps?.places) {
      setMapsLoaded(true);
      return;
    }
    if (!apiKey || mapsLoaded) return;

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setMapsLoaded(true);
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [apiKey, mapsLoaded]);

  useEffect(() => {
    if (!mapsLoaded || !addressInputRef.current || !window.google?.maps?.places) return;

    const autocomplete = new window.google.maps.places.Autocomplete(addressInputRef.current, {
      types: ['address'],
      fields: ['address_components', 'formatted_address', 'geometry']
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      const components = place?.address_components || [];
      const formattedAddress = place?.formatted_address || '';
      
      let foundCity = '';
      let foundZip = '';
      let street = '';
      let route = '';

      for (const c of components) {
        const types = c.types || [];
        if (types.includes('street_number')) street = c.long_name;
        if (types.includes('route')) route = c.long_name;
        if (types.includes('locality')) foundCity = c.long_name;
        if (types.includes('postal_code')) foundZip = c.long_name;
      }

      const addressLine = street || route ? `${street} ${route}`.trim() : (formattedAddress.split(',')[0] || '');
      setAddress(addressLine);
      if (foundCity) setCity(foundCity);
      if (foundZip) setZipCode(foundZip);
    });
  }, [mapsLoaded]);

  const handleContinue = () => {
    if (!phone.trim() || !city.trim() || !address.trim()) return;
    
    setIsSubmitting(true);
    
    localStorage.setItem("phone", phone.trim());
    localStorage.setItem("city", city.trim());
    localStorage.setItem("zipCode", zipCode.trim());
    localStorage.setItem("address", address.trim());
    
    setTimeout(() => {
      const targetUrl = `/store-setup/step-4?email=${encodeURIComponent(email)}&userType=${encodeURIComponent(userType)}`;
      router.push(targetUrl);
    }, 300);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <main className="flex-1 flex justify-center items-center py-12 px-4 shadow-sm">
        <div className="bg-white rounded-2xl w-full max-w-[449px] p-8 shadow-lg relative">
          <button 
            onClick={() => router.back()}
            className="absolute top-8 left-8 p-2 rounded-full border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-colors"
          >
            <ArrowBackIcon className="h-5 w-5 text-black" />
          </button>

          <div className="text-center mb-8">
            <h1 className="text-[#FF6B35] text-2xl font-bold">MultiKonnect</h1>
          </div>

          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="h-8 w-8 rounded-full bg-[#FF6B35] text-white flex items-center justify-center text-sm font-medium">1</div>
            <div className="h-1 w-6 border-t-2 border-dashed border-gray-300"></div>
            <div className="h-8 w-8 rounded-full bg-[#FF6B35] text-white flex items-center justify-center text-sm font-medium">2</div>
            <div className="h-1 w-6 border-t-2 border-dashed border-gray-300"></div>
            <div className="h-8 w-8 rounded-full bg-[#FF6B35] text-white flex items-center justify-center text-sm font-medium">3</div>
            <div className="h-1 w-6 border-t-2 border-dashed border-gray-300"></div>
            <div className="h-8 w-8 rounded-full border-2 border-[#FF6B35] bg-white flex items-center justify-center relative">
              <div className="h-2 w-2 rounded-full bg-gray-400"></div>
            </div>
          </div>

          <h2 className="text-[#2A2A2A] text-2xl font-bold mb-6 text-left">Setup Your Contact Details</h2>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 ml-1 text-left">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Your phone number"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-lg focus:ring-0 focus:border-gray-200 outline-none transition-colors text-gray-800 placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 ml-1 text-left">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Your city"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-lg focus:ring-0 focus:border-gray-200 outline-none transition-colors text-gray-800 placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 ml-1 text-left">Zip Code</label>
              <input
                type="text"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                placeholder="Your zip code"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-lg focus:ring-0 focus:border-gray-200 outline-none transition-colors text-gray-800 placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 ml-1 text-left">Address</label>
              <input
                type="text"
                ref={addressInputRef}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Your address"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-lg focus:ring-0 focus:border-gray-200 outline-none transition-colors text-gray-800 placeholder-gray-400"
              />
            </div>
          </div>

          <button
            onClick={handleContinue}
            disabled={!phone.trim() || !city.trim() || !address.trim() || isSubmitting}
            className={`w-full py-3 font-semibold rounded-lg text-white transition-colors ${
              phone.trim() && city.trim() && address.trim() && !isSubmitting
                ? "bg-[#FF6B35] hover:bg-[#FF5722]"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            Continue
          </button>
          <div className="text-center text-sm text-gray-600 mt-6">
              Already have an account? <Link href="/sign-in" className="text-[#FF6B35] underline">Log in</Link>
          </div>
        </div>
      </main>
    </div>
  );
}

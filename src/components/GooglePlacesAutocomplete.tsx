'use client';

import React, { useState, useRef, useEffect } from 'react';

interface GooglePlacesAutocompleteProps {
  onAddressSelect: (address: string, place: google.maps.places.PlaceResult) => void;
  placeholder?: string;
  className?: string;
}

declare global {
  interface Window {
    google: any;
  }
}

export default function GooglePlacesAutocomplete({ 
  onAddressSelect, 
  placeholder = "Enter your address", 
  className = "" 
}: GooglePlacesAutocompleteProps) {
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    console.log('GooglePlacesAutocomplete - Environment check:', {
      hasApiKey: !!process.env.NEXT_PUBLIC_MAP_KEY,
      apiKey: process.env.NEXT_PUBLIC_MAP_KEY ? process.env.NEXT_PUBLIC_MAP_KEY.substring(0, 10) + '...' : 'NOT_FOUND',
      apiKeyLength: process.env.NEXT_PUBLIC_MAP_KEY?.length || 0,
      googleExists: !!window.google,
      googleMapsExists: !!(window.google && window.google.maps),
      allEnvVars: Object.keys(process.env).filter(key => key.includes('MAP') || key.includes('GOOGLE'))
    });

    // Check if we're in browser
    if (typeof window === 'undefined') {
      console.log('GooglePlacesAutocomplete - Not in browser environment');
      return;
    }

    const loadGoogleMapsScript = () => {
      console.log('Loading Google Maps script...');
      
      if (window.google && window.google.maps) {
        console.log('Google Maps already loaded, initializing autocomplete');
        initializeAutocomplete();
        return;
      }

      const apiKey = process.env.NEXT_PUBLIC_MAP_KEY;
      if (!apiKey) {
        console.error('GooglePlacesAutocomplete - No API key found in environment');
        return;
      }

      console.log('GooglePlacesAutocomplete - Using API key:', apiKey.substring(0, 10) + '...');

      // Create script element with proper error handling
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps`;
      script.async = true;
      script.defer = true;
      
      // Set up global callback for Google Maps initialization
      (window as any).initGoogleMaps = () => {
        console.log('Google Maps script loaded successfully via callback');
        initializeAutocomplete();
      };

      script.onload = () => {
        console.log('Google Maps script loaded successfully');
        // Small delay to ensure Google Maps is fully loaded
        setTimeout(() => {
          if (window.google && window.google.maps) {
            initializeAutocomplete();
          } else {
            console.error('Google Maps loaded but not available in window.google');
          }
        }, 100);
      };

      script.onerror = (error) => {
        console.error('Failed to load Google Maps script:', error);
        console.error('Check if the API key is valid and has Places API enabled');
        // Clean up the global callback
        delete (window as any).initGoogleMaps;
      };

      // Add script to head
      document.head.appendChild(script);
    };

    const initializeAutocomplete = () => {
      console.log('Initializing autocomplete...', {
        hasInput: !!inputRef.current,
        hasGoogle: !!window.google,
        hasGoogleMaps: !!(window.google && window.google.maps),
        hasPlaces: !!(window.google && window.google.maps && window.google.maps.places)
      });
      
      if (!inputRef.current || !window.google) {
        console.error('Missing required elements for autocomplete');
        return;
      }

      setIsLoading(false);
      
      try {
        const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
          types: ['address'],
          fields: ['formatted_address', 'place_id', 'geometry', 'address_components', 'name']
        });

        console.log('Autocomplete created successfully');

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          console.log('Place selected:', place);
          if (place && place.formatted_address) {
            setAddress(place.formatted_address);
            onAddressSelect(place.formatted_address, place);
          }
        });

        autocompleteRef.current = autocomplete;
        console.log('Autocomplete listener attached');
      } catch (error) {
        console.error('Error initializing autocomplete:', error);
      }
    };

    const apiKey = process.env.NEXT_PUBLIC_MAP_KEY;
    console.log('GooglePlacesAutocomplete - Final API key check:', {
      hasApiKey: !!apiKey,
      keyLength: apiKey?.length || 0,
      keyPreview: apiKey?.substring(0, 10) + '...' || 'NONE'
    });

    if (apiKey && apiKey !== '') {
      console.log('GooglePlacesAutocomplete - Loading Google Maps...');
      setIsLoading(true);
      loadGoogleMapsScript();
    } else {
      console.error('GooglePlacesAutocomplete - No API key available, skipping Google Maps load');
    }
  }, [onAddressSelect]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAddress(value);
  };

  if (!process.env.NEXT_PUBLIC_MAP_KEY || process.env.NEXT_PUBLIC_MAP_KEY === '') {
    return (
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={address}
          onChange={handleInputChange}
          placeholder={placeholder}
          className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${className}`}
        />
        <p className="text-xs text-red-500 mt-1">
          Google Maps API key not configured. Please add NEXT_PUBLIC_MAP_KEY to your environment variables.
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={address}
        onChange={handleInputChange}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${className}`}
        disabled={isLoading}
      />
      {isLoading && (
        <div className="absolute right-3 top-2.5">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
        </div>
      )}
    </div>
  );
}

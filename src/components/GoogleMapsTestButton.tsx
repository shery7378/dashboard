'use client';

import React from 'react';

export default function GoogleMapsTestButton() {
  const testGoogleMapsAPI = async () => {
    const apiKey = process.env.NEXT_PUBLIC_MAP_KEY;
    console.log('Testing Google Maps API with key:', apiKey?.substring(0, 10) + '...');
    
    if (!apiKey) {
      alert('No API key found');
      return;
    }

    try {
      // Test direct API call to validate the key
      const response = await fetch(`https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`);
      console.log('Google Maps API test response status:', response.status);
      
      if (response.status === 200) {
        alert('Google Maps API key is valid! ✅');
      } else {
        const text = await response.text();
        console.error('Google Maps API error:', text);
        alert(`Google Maps API error: ${response.status} - ${text.substring(0, 100)}...`);
      }
    } catch (error) {
      console.error('Google Maps API test error:', error);
      alert(`Google Maps API test failed: ${error}`);
    }
  };

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
      <h3 className="font-bold mb-2">Google Maps API Test</h3>
      <p className="text-sm text-gray-600 mb-2">
        API Key: {process.env.NEXT_PUBLIC_MAP_KEY ? process.env.NEXT_PUBLIC_MAP_KEY.substring(0, 20) + '...' : 'NOT_FOUND'}
      </p>
      <button 
        onClick={testGoogleMapsAPI}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Test Google Maps API
      </button>
    </div>
  );
}

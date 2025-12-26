'use client';

import { useEffect, useState } from 'react';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);

  useEffect(() => {
    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      setShowInstallButton(true);
      console.log('[PWA] Install prompt available');
    };

    // Check if app is already installed
    const checkIfInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        console.log('[PWA] App is already installed');
        return;
      }
      
      // Check if running as PWA
      if ((window.navigator as any).standalone === true) {
        console.log('[PWA] App is running as standalone (iOS)');
        return;
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
    checkIfInstalled();

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App was installed');
      setDeferredPrompt(null);
      setShowInstallButton(false);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    // Show the install prompt
    (deferredPrompt as any).prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await (deferredPrompt as any).userChoice;
    console.log(`[PWA] User response to install prompt: ${outcome}`);

    // Clear the deferredPrompt
    setDeferredPrompt(null);
    setShowInstallButton(false);
  };

  if (!showInstallButton) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '16px',
      right: '16px',
      zIndex: 9999,
      backgroundColor: 'white',
      border: '2px solid #000',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      padding: '16px',
      maxWidth: '384px'
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontWeight: 'bold', color: '#000', marginBottom: '4px', margin: 0, fontSize: '16px' }}>
            Install MultiKonnect Admin
          </h3>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '12px', margin: '4px 0 12px 0' }}>
            Install our app for a better experience and offline access.
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleInstallClick}
              style={{
                padding: '8px 16px',
                backgroundColor: '#000',
                color: 'white',
                borderRadius: '6px',
                border: 'none',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Install Now
            </button>
            <button
              onClick={() => setShowInstallButton(false)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#f5f5f5',
                color: '#333',
                borderRadius: '6px',
                border: 'none',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Later
            </button>
          </div>
        </div>
        <button
          onClick={() => setShowInstallButton(false)}
          style={{
            color: '#999',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px'
          }}
          aria-label="Close"
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}


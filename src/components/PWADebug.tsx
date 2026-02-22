'use client';

import { useEffect, useState } from 'react';

interface DebugInfo {
	serviceWorkerSupported: boolean;
	serviceWorkerRegistered: boolean;
	serviceWorkerActive: boolean;
	manifestExists: boolean;
	isInstalled: boolean;
	isHTTPS: boolean;
	currentURL: string;
	hostname: string;
	protocol: string;
	icons: any[];
}

export default function PWADebug() {
	const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
	const [showDebug, setShowDebug] = useState(false);

	useEffect(() => {
		if (typeof window === 'undefined') return;

		const checkPWAStatus = async () => {
			const hostname = window.location.hostname;
			const protocol = window.location.protocol;
			const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
			const isHTTPS = protocol === 'https:';
			const isSecureContext = isHTTPS || isLocalhost;

			const info: DebugInfo = {
				serviceWorkerSupported: 'serviceWorker' in navigator && isSecureContext,
				serviceWorkerRegistered: false,
				serviceWorkerActive: false,
				manifestExists: false,
				isInstalled:
					window.matchMedia('(display-mode: standalone)').matches ||
					(window.navigator as any).standalone === true,
				isHTTPS: isSecureContext,
				currentURL: window.location.href,
				hostname: hostname,
				protocol: protocol,
				icons: []
			};

			// Check service worker
			if ('serviceWorker' in navigator) {
				try {
					const registration = await navigator.serviceWorker.getRegistration();

					if (registration) {
						info.serviceWorkerRegistered = true;
						info.serviceWorkerActive = registration.active !== null;
					}
				} catch (e) {
					console.error('Error checking service worker:', e);
				}
			}

			// Check manifest
			try {
				const response = await fetch('/manifest.json');

				if (response.ok) {
					info.manifestExists = true;
					const manifest = await response.json();
					info.icons = manifest.icons || [];
				}
			} catch (e) {
				console.error('Error checking manifest:', e);
			}

			setDebugInfo(info);
		};

		checkPWAStatus();

		// Show debug panel if there are issues (only in development)
		if (process.env.NODE_ENV === 'development') {
			setTimeout(() => {
				if (!debugInfo?.serviceWorkerActive || !debugInfo?.manifestExists) {
					setShowDebug(true);
				}
			}, 2000);
		}
	}, []);

	if (!debugInfo || !showDebug) return null;

	return (
		<div
			style={{
				position: 'fixed',
				top: '16px',
				right: '16px',
				zIndex: 9999,
				backgroundColor: 'white',
				border: '2px solid #3b82f6',
				borderRadius: '8px',
				boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
				padding: '16px',
				maxWidth: '384px',
				fontSize: '12px'
			}}
		>
			<div
				style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}
			>
				<h3 style={{ fontWeight: 'bold', color: '#3b82f6', margin: 0 }}>PWA Debug Info</h3>
				<button
					onClick={() => setShowDebug(false)}
					style={{
						color: '#999',
						background: 'none',
						border: 'none',
						cursor: 'pointer',
						fontSize: '18px'
					}}
				>
					×
				</button>
			</div>
			<div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
				<div style={{ fontSize: '11px', color: '#666', marginBottom: '8px' }}>URL: {debugInfo.currentURL}</div>
				<div style={{ color: debugInfo.serviceWorkerSupported ? '#10b981' : '#ef4444' }}>
					✓ Service Worker Supported: {debugInfo.serviceWorkerSupported ? 'Yes' : 'No'}
				</div>
				<div style={{ color: debugInfo.serviceWorkerRegistered ? '#10b981' : '#ef4444' }}>
					✓ Service Worker Registered: {debugInfo.serviceWorkerRegistered ? 'Yes' : 'No'}
				</div>
				<div style={{ color: debugInfo.serviceWorkerActive ? '#10b981' : '#f59e0b' }}>
					✓ Service Worker Active: {debugInfo.serviceWorkerActive ? 'Yes' : 'No'}
				</div>
				<div style={{ color: debugInfo.manifestExists ? '#10b981' : '#ef4444' }}>
					✓ Manifest Exists: {debugInfo.manifestExists ? 'Yes' : 'No'}
				</div>
				<div style={{ color: debugInfo.isHTTPS ? '#10b981' : '#ef4444' }}>
					✓ HTTPS/Localhost: {debugInfo.isHTTPS ? 'Yes' : 'No'}
				</div>
				<div style={{ color: debugInfo.isInstalled ? '#10b981' : '#666' }}>
					✓ Already Installed: {debugInfo.isInstalled ? 'Yes' : 'No'}
				</div>
				<div style={{ color: '#666' }}>Icons: {debugInfo.icons.length} found</div>
				{!debugInfo.isHTTPS && (
					<div
						style={{
							marginTop: '12px',
							padding: '8px',
							backgroundColor: '#fef3c7',
							border: '1px solid #fbbf24',
							borderRadius: '4px',
							fontSize: '11px'
						}}
					>
						<strong style={{ color: '#92400e' }}>⚠️ Service Workers require HTTPS or localhost!</strong>
						<p style={{ color: '#78350f', margin: '4px 0 0 0' }}>
							Access via:{' '}
							<code style={{ backgroundColor: '#fde68a', padding: '2px 4px', borderRadius: '2px' }}>
								https://vendor.multikonnect.test:3001
							</code>
						</p>
					</div>
				)}
			</div>
			<div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
				<button
					onClick={() => {
						navigator.serviceWorker.getRegistrations().then((registrations) => {
							registrations.forEach((reg) => reg.unregister());
							window.location.reload();
						});
					}}
					style={{
						fontSize: '11px',
						color: '#3b82f6',
						background: 'none',
						border: 'none',
						cursor: 'pointer',
						textDecoration: 'underline'
					}}
				>
					Clear Service Workers & Reload
				</button>
			</div>
		</div>
	);
}

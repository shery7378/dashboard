'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistration() {
	useEffect(() => {
		if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {


			// Register service worker
			navigator.serviceWorker
				.register('/service-worker.js', {
					scope: '/'
				})
				.then((registration) => {


					// Check for updates every hour
					setInterval(
						() => {
							registration.update();
						},
						60 * 60 * 1000
					);

					// Handle updates
					registration.addEventListener('updatefound', () => {
						const newWorker = registration.installing;

						if (newWorker) {
							newWorker.addEventListener('statechange', () => {
								if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
									// New service worker available


									// Optional: Show update notification to user
									if (window.confirm('A new version is available. Reload to update?')) {
										window.location.reload();
									}
								}
							});
						}
					});
				})
				.catch((error) => {
					console.error('[Service Worker] Registration failed:', error);
				});

			// Handle service worker controller change (page refresh after update)
			let refreshing = false;
			navigator.serviceWorker.addEventListener('controllerchange', () => {
				if (!refreshing) {
					refreshing = true;
					window.location.reload();
				}
			});
		}
	}, []);

	return null;
}

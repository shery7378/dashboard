'use client';

import { useParams } from 'next/navigation';
import { useEffect } from 'react';

export default function ProductLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const params = useParams<{ productId: string }>();
	const productId = params?.productId;

	// Hide sidebar navigation for all product edit pages (both new and existing)
	// This hides the main app sidebar (Dashboard, Analytics, etc.) only on listing edit page
	const shouldHideSidebar = true; // Always hide for product edit pages

	useEffect(() => {
		if (!shouldHideSidebar) return;

		// Hide main sidebar navigation elements
		const hideSidebar = () => {
			const selectors = [
				'#fuse-navbar',
				'[id*="fuse-navbar"]',
				'[class*="NavbarStyle"]',
				'[class*="navbar"]',
			];

			selectors.forEach(selector => {
				const elements = document.querySelectorAll(selector);
				elements.forEach(el => {
					(el as HTMLElement).style.display = 'none';
				});
			});
		};

		// Hide immediately
		hideSidebar();

		// Also hide after a short delay to catch any dynamically rendered elements
		const timeout = setTimeout(hideSidebar, 100);

		// Use MutationObserver to catch any elements added dynamically
		const observer = new MutationObserver(hideSidebar);
		observer.observe(document.body, {
			childList: true,
			subtree: true
		});

		return () => {
			clearTimeout(timeout);
			observer.disconnect();
		};
	}, [shouldHideSidebar]);

	return (
		<>
			{shouldHideSidebar && (
				<style dangerouslySetInnerHTML={{
					__html: `
						#fuse-navbar,
						[id*="fuse-navbar"],
						[class*="NavbarStyle"],
						[class*="navbar"] {
							display: none !important;
						}
					`
				}} />
			)}
			{children}
		</>
	);
}


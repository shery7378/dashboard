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

	// Hide sidebar navigation and toolbar for all product edit pages (both new and existing)
	// This hides the main app sidebar (Dashboard, Analytics, etc.) and top toolbar only on listing edit page
	const shouldHideUI = true; // Always hide for product edit pages

	useEffect(() => {
		if (!shouldHideUI) return;

		// Hide main sidebar navigation and toolbar elements
		const hideUI = () => {
			const selectors = [
				'#fuse-navbar',
				'#fuse-toolbar',
				'[id*="fuse-navbar"]',
				'[id*="fuse-toolbar"]',
				'[class*="NavbarStyle"]',
				'[class*="ToolbarLayout"]',
				'[class*="navbar"]',
				'[class*="toolbar"]',
				'.MuiToolbar-root',
			];

			selectors.forEach(selector => {
				const elements = document.querySelectorAll(selector);
				elements.forEach(el => {
					(el as HTMLElement).style.display = 'none';
				});
			});
		};

		// Hide immediately
		hideUI();

		// Also hide after a short delay to catch any dynamically rendered elements
		const timeout = setTimeout(hideUI, 100);

		// Use MutationObserver to catch any elements added dynamically
		const observer = new MutationObserver(hideUI);
		observer.observe(document.body, {
			childList: true,
			subtree: true
		});

		return () => {
			clearTimeout(timeout);
			observer.disconnect();
		};
	}, [shouldHideUI]);

	return (
		<>
			{shouldHideUI && (
				<style dangerouslySetInnerHTML={{
					__html: `
						#fuse-navbar,
						#fuse-toolbar,
						[id*="fuse-navbar"],
						[id*="fuse-toolbar"],
						[class*="NavbarStyle"],
						[class*="ToolbarLayout"],
						[class*="navbar"],
						[class*="toolbar"],
						.MuiToolbar-root {
							display: none !important;
						}
					`
				}} />
			)}
			{children}
		</>
	);
}


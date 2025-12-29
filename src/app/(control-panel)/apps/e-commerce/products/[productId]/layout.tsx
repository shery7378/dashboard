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

	// Only hide toolbar for new product page
	const shouldHideToolbar = productId === 'new';

	useEffect(() => {
		if (!shouldHideToolbar) return;

		// Hide all toolbar and navbar elements
		const hideToolbar = () => {
			const selectors = [
				'#fuse-toolbar',
				'.MuiToolbar-root',
				'[class*="MuiToolbar"]',
				'[class*="toolbar"]',
				'#fuse-navbar',
				'#fuse-navbar-side-panel',
				'#fuse-navbar-panel',
				'[class*="NavbarStyle"]',
				'[class*="navbar"]',
				'.logo-text',
				'.logo-icon',
				'[class*="logo"]'
			];

			selectors.forEach(selector => {
				const elements = document.querySelectorAll(selector);
				elements.forEach(el => {
					(el as HTMLElement).style.display = 'none';
				});
			});
		};

		// Hide immediately
		hideToolbar();

		// Also hide after a short delay to catch any dynamically rendered toolbars
		const timeout = setTimeout(hideToolbar, 100);

		// Use MutationObserver to catch any toolbar elements added dynamically
		const observer = new MutationObserver(hideToolbar);
		observer.observe(document.body, {
			childList: true,
			subtree: true
		});

		return () => {
			clearTimeout(timeout);
			observer.disconnect();
		};
	}, [shouldHideToolbar]);

	return (
		<>
			{shouldHideToolbar && (
				<style dangerouslySetInnerHTML={{
					__html: `
						#fuse-toolbar,
						.MuiToolbar-root,
						[class*="MuiToolbar"],
						[class*="toolbar"],
						#fuse-navbar,
						#fuse-navbar-side-panel,
						#fuse-navbar-panel,
						[class*="NavbarStyle"],
						[class*="navbar"],
						.logo-text,
						.logo-icon,
						[class*="logo"] {
							display: none !important;
						}
					`
				}} />
			)}
			{children}
		</>
	);
}


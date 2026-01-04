'use client';

import { useParams, usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

export default function ProductLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const params = useParams<{ productId: string }>();
	const pathname = usePathname();
	const productId = params?.productId;
	const hiddenElementsRef = useRef<Map<HTMLElement, string>>(new Map());
	const styleElementRef = useRef<HTMLStyleElement | null>(null);

	// Hide sidebar navigation and toolbar for all product edit pages (both new and existing)
	// This hides the main app sidebar (Dashboard, Analytics, etc.) and top toolbar only on listing edit page
	const shouldHideUI = true; // Always hide for product edit pages

	useEffect(() => {
		if (!shouldHideUI) {
			// If we shouldn't hide UI, make sure it's restored
			const restoreUI = () => {
				hiddenElementsRef.current.forEach((originalDisplay, element) => {
					if (element && element.parentNode) {
						element.style.display = '';
						if (originalDisplay && originalDisplay !== 'none') {
							element.style.display = originalDisplay;
						}
					}
				});
				hiddenElementsRef.current.clear();

				if (styleElementRef.current && styleElementRef.current.parentNode) {
					styleElementRef.current.parentNode.removeChild(styleElementRef.current);
					styleElementRef.current = null;
				}
			};
			restoreUI();
			return;
		}

		// Check if we're on a product edit page
		const isProductPage = pathname && (
			pathname.includes('/products/') && 
			(pathname.includes('/listing') || pathname.match(/\/products\/[^\/]+$/))
		);

		// Store original display values and hide main sidebar navigation and toolbar elements
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
					const htmlEl = el as HTMLElement;
					// Store original display value if not already stored
					if (!hiddenElementsRef.current.has(htmlEl)) {
						const computedStyle = window.getComputedStyle(htmlEl);
						hiddenElementsRef.current.set(htmlEl, computedStyle.display || '');
					}
					htmlEl.style.display = 'none';
				});
			});
		};

		// Restore original display values
		const restoreUI = () => {
			hiddenElementsRef.current.forEach((originalDisplay, element) => {
				if (element && element.parentNode) {
					// Remove inline style to restore original
					element.style.display = '';
					// If original was not empty, set it back
					if (originalDisplay && originalDisplay !== 'none') {
						element.style.display = originalDisplay;
					}
				}
			});
			hiddenElementsRef.current.clear();

			// Remove the style element if it exists
			if (styleElementRef.current && styleElementRef.current.parentNode) {
				styleElementRef.current.parentNode.removeChild(styleElementRef.current);
				styleElementRef.current = null;
			}
		};

		// Only hide if we're on the product page
		if (isProductPage) {
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

			// Add style element
			if (!styleElementRef.current) {
				const styleEl = document.createElement('style');
				styleEl.id = 'product-layout-hide-ui';
				styleEl.innerHTML = `
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
				`;
				document.head.appendChild(styleEl);
				styleElementRef.current = styleEl;
			}

			return () => {
				clearTimeout(timeout);
				observer.disconnect();
				// Restore UI when component unmounts or pathname changes (navigating away)
				restoreUI();
			};
		} else {
			// If not on product page, make sure UI is restored
			restoreUI();
			return;
		}
	}, [shouldHideUI, pathname]);

	return (
		<>
			{children}
		</>
	);
}



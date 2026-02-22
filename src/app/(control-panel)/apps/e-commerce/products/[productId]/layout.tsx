'use client';

import { useParams, usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

export default function ProductLayout({ children }: { children: React.ReactNode }) {
	const params = useParams<{ productId: string }>();
	const pathname = usePathname();
	const productId = params?.productId;
	const hiddenElementsRef = useRef<Map<HTMLElement, string>>(new Map());
	const styleElementRef = useRef<HTMLStyleElement | null>(null);

	// Check if we're on the product listing/creation/update page
	// Hide sidebar on:
	// - Listing routes: /listing/[productId] or /products/[id]/listing
	// - Product creation pages: /apps/e-commerce/products/new
	// - Product edit/update pages: /apps/e-commerce/products/[productId] (when productId exists)
	// - Product creation with /s suffix: /apps/e-commerce/products/[id]/s
	const isProductPage =
		pathname &&
		(pathname.match(/\/products\/[^\/]+\/s$/) ||
			(pathname.includes('/products/') && pathname.includes('/listing')) ||
			pathname.includes('/listing/') ||
			// Hide sidebar on product creation and edit/update pages
			(pathname.includes('/apps/e-commerce/products/') && productId));

	useEffect(() => {
		// Add style element with comprehensive selectors to hide sidebar
		if (!styleElementRef.current) {
			const styleEl = document.createElement('style');
			styleEl.id = 'product-layout-hide-ui';
			styleEl.innerHTML = `
				/* Hide main navigation sidebar */
				#fuse-navbar,
				#fuse-toolbar,
				[id*="fuse-navbar"],
				[id*="fuse-toolbar"],
				[class*="NavbarStyle"],
				[class*="ToolbarLayout"],
				[class*="navbar"],
				[class*="toolbar"],
				.MuiToolbar-root,
				/* Hide Fuse navigation sidebar */
				[class*="FuseNavigation"],
				[class*="FuseNavVertical"],
				[class*="FuseNavHorizontal"],
				[class*="FuseNavVerticalLayout"],
				[class*="FuseNavVerticalCollapse"],
				[class*="navigation"],
				.navigation,
				[data-testid*="navigation"],
				/* Hide sidebar container */
				aside[class*="sidebar"],
				aside[class*="Sidebar"],
				aside[class*="Navigation"],
				nav[class*="sidebar"],
				nav[class*="Sidebar"],
				/* Hide NavbarWrapper components */
				[class*="NavbarWrapper"],
				/* Hide left side panel */
				[class*="LeftSidePanel"],
				[class*="leftSidePanel"],
				[class*="FuseLeftSidePanel"] {
					display: none !important;
					visibility: hidden !important;
					width: 0 !important;
					height: 0 !important;
					opacity: 0 !important;
					position: absolute !important;
					left: -9999px !important;
				}
				/* Adjust main content to take full width */
				main[class*="content"],
				[class*="MainContent"],
				[class*="FuseLayout"] > div:not([class*="sidebar"]):not([class*="Sidebar"]):not([class*="Navigation"]) {
					margin-left: 0 !important;
					padding-left: 0 !important;
				}
				/* Hide any element containing navigation class */
				*[class*="navigation"] {
					display: none !important;
				}
			`;
			document.head.appendChild(styleEl);
			styleElementRef.current = styleEl;
		}

		// Cleanup function
		return () => {
			// Remove the style element
			if (styleElementRef.current && styleElementRef.current.parentNode) {
				try {
					styleElementRef.current.parentNode.removeChild(styleElementRef.current);
				} catch (e) {
					// Element might already be removed
				}
				styleElementRef.current = null;
			}

			// Remove any other matching style elements (cleanup)
			const existingStyleElements = document.querySelectorAll('style#product-layout-hide-ui');
			existingStyleElements.forEach((el) => {
				if (el.parentNode) {
					el.parentNode.removeChild(el);
				}
			});

			// Restore inline styles for any elements that might have been modified by previous logic
			// (Though with this clean version, we shouldn't be modifying inline styles anymore)
			const selectors = [
				'#fuse-navbar',
				'#fuse-toolbar',
				'[id*="fuse-navbar"]',
				'[id*="fuse-toolbar"]',
				'aside[class*="sidebar"]',
				'nav[class*="sidebar"]'
			];

			selectors.forEach((selector) => {
				const elements = document.querySelectorAll(selector);
				elements.forEach((el) => {
					const htmlEl = el as HTMLElement;

					if (htmlEl.style.display === 'none') {
						htmlEl.style.display = '';
					}
				});
			});

			// Force reflow
			void document.body.offsetHeight;
		};
	}, [isProductPage, pathname]);

	return <>{children}</>;
}

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

	// Check if we're on the product listing/creation/update page
	// Hide sidebar on:
	// - Listing routes: /listing/[productId] or /products/[id]/listing
	// - Product creation pages: /apps/e-commerce/products/new
	// - Product edit/update pages: /apps/e-commerce/products/[productId] (when productId exists)
	// - Product creation with /s suffix: /apps/e-commerce/products/[id]/s
	const isProductPage = pathname && (
		pathname.match(/\/products\/[^\/]+\/s$/) || 
		pathname.includes('/products/') && pathname.includes('/listing') ||
		pathname.includes('/listing/') ||
		// Hide sidebar on product creation and edit/update pages
		(pathname.includes('/apps/e-commerce/products/') && productId)
	);

	useEffect(() => {
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
				// Fuse navigation sidebar
				'[class*="FuseNavigation"]',
				'[class*="FuseNavVertical"]',
				'[class*="FuseNavHorizontal"]',
				'[class*="FuseNavVerticalLayout"]',
				'[class*="FuseNavVerticalCollapse"]',
				// Sidebar containers
				'aside[class*="sidebar"]',
				'aside[class*="Sidebar"]',
				'aside[class*="Navigation"]',
				'nav[class*="sidebar"]',
				'nav[class*="Sidebar"]',
				// Left side panel
				'[class*="LeftSidePanel"]',
				'[class*="leftSidePanel"]',
				'[class*="FuseLeftSidePanel"]',
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
			// First, remove ALL style elements that hide the sidebar (including any orphaned ones)
			const existingStyleElements = document.querySelectorAll('style#product-layout-hide-ui');
			existingStyleElements.forEach(el => {
				if (el.parentNode) {
					el.parentNode.removeChild(el);
				}
			});
			
			if (styleElementRef.current && styleElementRef.current.parentNode) {
				try {
					styleElementRef.current.parentNode.removeChild(styleElementRef.current);
				} catch (e) {
					// Element might already be removed
				}
				styleElementRef.current = null;
			}

			// Query all potentially hidden elements and restore them
			const selectors = [
				'#fuse-navbar',
				'#fuse-toolbar',
				'[id*="fuse-navbar"]',
				'[id*="fuse-toolbar"]',
				'[class*="NavbarStyle"]',
				'[class*="ToolbarLayout"]',
				'[class*="FuseNavigation"]',
				'[class*="FuseNavVertical"]',
				'[class*="FuseNavHorizontal"]',
				'[class*="NavbarWrapper"]',
				'aside[class*="Navigation"]',
				'nav[class*="Navigation"]',
			];

			selectors.forEach(selector => {
				const elements = document.querySelectorAll(selector);
				elements.forEach(el => {
					const htmlEl = el as HTMLElement;
					// Remove all inline styles we might have added
					htmlEl.style.display = '';
					htmlEl.style.visibility = '';
					htmlEl.style.width = '';
					htmlEl.style.height = '';
					htmlEl.style.opacity = '';
					htmlEl.style.position = '';
					htmlEl.style.left = '';
				});
			});

			// Then restore inline styles for tracked elements
			hiddenElementsRef.current.forEach((originalDisplay, element) => {
				if (element && element.parentNode) {
					// Remove inline style to restore original
					element.style.display = '';
					element.style.visibility = '';
					element.style.width = '';
					element.style.height = '';
					element.style.opacity = '';
					element.style.position = '';
					element.style.left = '';
					// If original was not empty, set it back
					if (originalDisplay && originalDisplay !== 'none') {
						element.style.display = originalDisplay;
					}
				}
			});
			hiddenElementsRef.current.clear();

			// Force a reflow to ensure styles are applied
			void document.body.offsetHeight;
		};

		// Hide sidebar only if we're on a product page, otherwise restore it
		if (isProductPage) {
			// Hide immediately
			hideUI();

			// Also hide after multiple delays to catch any dynamically rendered elements
			const timeout1 = setTimeout(hideUI, 50);
			const timeout2 = setTimeout(hideUI, 100);
			const timeout3 = setTimeout(hideUI, 300);
			const timeout4 = setTimeout(hideUI, 500);

			// Use MutationObserver to catch any elements added dynamically
			const observer = new MutationObserver(() => {
				hideUI();
			});
			observer.observe(document.body, {
				childList: true,
				subtree: true,
				attributes: true,
				attributeFilter: ['class', 'style']
			});

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

			return () => {
				clearTimeout(timeout1);
				clearTimeout(timeout2);
				clearTimeout(timeout3);
				clearTimeout(timeout4);
				observer.disconnect();
				// Restore UI when component unmounts or pathname changes (navigating away)
				restoreUI();
			};
		} else {
			// If not on product page, make sure UI is restored immediately
			restoreUI();
			return undefined;
		}
	}, [isProductPage, pathname]);

	return (
		<>
			{children}
		</>
	);
}



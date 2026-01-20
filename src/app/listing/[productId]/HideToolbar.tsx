'use client';

import { useEffect } from 'react';

export default function HideToolbar() {
	useEffect(() => {
		// Hide all toolbar, navbar, and sidebar elements
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
				'[class*="logo"]',
				// Sidebar navigation elements
				'[class*="FuseNavigation"]',
				'[class*="FuseNavVertical"]',
				'[class*="FuseNavHorizontal"]',
				'[class*="FuseNavVerticalLayout"]',
				'[class*="FuseNavVerticalCollapse"]',
				'[class*="navigation"]',
				'.navigation',
				'[data-testid*="navigation"]',
				// Sidebar container elements
				'aside[class*="sidebar"]',
				'aside[class*="Sidebar"]',
				'aside[class*="Navigation"]',
				'nav[class*="sidebar"]',
				'nav[class*="Sidebar"]',
				'[class*="NavbarWrapper"]',
				'[class*="LeftSidePanel"]',
				'[class*="leftSidePanel"]',
				'[class*="FuseLeftSidePanel"]'
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
	}, []);

	return null;
}



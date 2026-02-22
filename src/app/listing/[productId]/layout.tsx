import HideToolbar from './HideToolbar';

export default function ListingLayout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<HideToolbar />
			<style
				dangerouslySetInnerHTML={{
					__html: `
					/* Hide toolbar */
					#fuse-toolbar,
					.MuiToolbar-root,
					[class*="MuiToolbar"],
					[class*="toolbar"] {
						display: none !important;
					}
					/* Hide navbar and logo */
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
					/* Hide sidebar navigation */
					[class*="FuseNavigation"],
					[class*="FuseNavVertical"],
					[class*="FuseNavHorizontal"],
					[class*="FuseNavVerticalLayout"],
					[class*="FuseNavVerticalCollapse"],
					[class*="navigation"],
					.navigation,
					[data-testid*="navigation"] {
						display: none !important;
						visibility: hidden !important;
						width: 0 !important;
						height: 0 !important;
						opacity: 0 !important;
						position: absolute !important;
						left: -9999px !important;
					}
					/* Hide sidebar container */
					aside[class*="sidebar"],
					aside[class*="Sidebar"],
					aside[class*="Navigation"],
					nav[class*="sidebar"],
					nav[class*="Sidebar"],
					[class*="NavbarWrapper"],
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
						width: 100% !important;
					}
					/* Hide any element containing navigation class */
					*[class*="navigation"] {
						display: none !important;
					}
				`
				}}
			/>
			<div
				style={{
					width: '100%',
					height: '100vh',
					margin: 0,
					padding: 0,
					overflow: 'auto',
					position: 'relative',
					top: 0,
					left: 0,
					zIndex: 1,
					pointerEvents: 'auto'
				}}
			>
				{children}
			</div>
		</>
	);
}

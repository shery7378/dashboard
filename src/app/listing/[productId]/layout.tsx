import HideToolbar from './HideToolbar';

export default function ListingLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<>
			<HideToolbar />
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
			<div style={{ width: '100%', height: '100vh', margin: 0, padding: 0, overflow: 'auto', position: 'relative', top: 0, left: 0, zIndex: 1, pointerEvents: 'auto' }}>
				{children}
			</div>
		</>
	);
}


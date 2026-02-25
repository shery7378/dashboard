import clsx from 'clsx';
import 'src/styles/splash-screen.css';
import 'src/styles/index.css';
import '../../public/assets/fonts/material-design-icons/MaterialIconsOutlined.css';
import '../../public/assets/fonts/meteocons/style.css';
import '../../public/assets/styles/prism.css';
import { SessionProvider } from 'next-auth/react';
import { auth } from '@auth/authJs';
import generateMetadata from '../utils/generateMetadata';
import App from './App';
import Script from 'next/script';
import GA4Tracker from './GA4Tracker';
import { interVar } from 'src/fonts/inter';

// eslint-disable-next-line react-refresh/only-export-components
export const metadata = await generateMetadata({
	title: 'MultiKonnect',
	description: 'MultiKonnect  by MultiKonnect',
	cardImage: '/card.png',
	robots: 'follow, index',
	favicon: '/favicon.ico',
	url: 'https://react-material.fusetheme.com'
});

export default async function RootLayout({
	children
}: Readonly<{
	children: React.ReactNode;
}>) {
	const session = await auth();

	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta
					name="viewport"
					content="width=device-width, initial-scale=1, shrink-to-fit=no"
				/>
				<meta
					name="theme-color"
					content="#000000"
				/>
				<meta
					name="application-name"
					content="MultiKonnect Admin"
				/>
				<meta
					name="apple-mobile-web-app-capable"
					content="yes"
				/>
				<meta
					name="apple-mobile-web-app-status-bar-style"
					content="default"
				/>
				<meta
					name="apple-mobile-web-app-title"
					content="MultiKonnect Admin"
				/>
				<meta
					name="mobile-web-app-capable"
					content="yes"
				/>
				<meta
					name="msapplication-TileColor"
					content="#000000"
				/>
				<meta
					name="msapplication-tap-highlight"
					content="no"
				/>
				<base href="/" />
				{/*
					manifest.json provides metadata used when your web app is added to the
					homescreen on Android. See https://developers.google.com/web/fundamentals/engage-and-retain/web-app-manifest/
				*/}
				<link
					rel="manifest"
					href="/manifest.json"
				/>
				<link
					rel="apple-touch-icon"
					href="/icons/apple-touch-icon.png"
				/>
				<link
					rel="icon"
					type="image/png"
					sizes="192x192"
					href="/icons/icon-192x192.png"
				/>
				<link
					rel="icon"
					type="image/png"
					sizes="512x512"
					href="/icons/icon-512x512.png"
				/>
				{/* Font preloads for faster first paint */}
				<link
					rel="preload"
					as="font"
					href="/assets/fonts/material-design-icons/MaterialIconsOutlined-Regular.woff2"
					type="font/woff2"
					crossOrigin="anonymous"
				/>
				<link
					rel="shortcut icon"
					href="/favicon.ico"
				/>
				{/* GA preconnects to speed up DNS/TLS */}
				<link
					rel="preconnect"
					href="https://www.googletagmanager.com"
					crossOrigin="anonymous"
				/>
				<link
					rel="preconnect"
					href="https://www.google-analytics.com"
					crossOrigin="anonymous"
				/>
				<link
					rel="dns-prefetch"
					href="https://www.googletagmanager.com"
				/>
				<link
					rel="dns-prefetch"
					href="https://www.google-analytics.com"
				/>
{/* <link
					rel="prefetch"
					href="/dashboards/analytics"
					as="document"
				/> */}
				<noscript id="emotion-insertion-point" />
			</head>
			<body
				id="root"
				className={clsx(interVar.className)}
			>
				{/* Google Analytics 4 */}
				<Script
					src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
					strategy="afterInteractive"
				/>
				<Script
					id="ga4-init"
					strategy="afterInteractive"
				>
					{`
					  window.dataLayer = window.dataLayer || [];
					  function gtag(){dataLayer.push(arguments);} 
					  gtag('js', new Date());
					  if ('${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}') {
					    gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}', { anonymize_ip: true });
					  }
					`}
				</Script>
				{/* Chunk loading error handler */}
				<Script
					id="chunk-error-handler"
					strategy="beforeInteractive"
				>
					{`
					  window.addEventListener('error', function(e) {
					    if (e.target && e.target.tagName === 'SCRIPT' && e.target.src.includes('/_next/static/chunks/')) {
					      console.warn('Chunk loading failed, attempting reload...');
					      setTimeout(() => {
					        window.location.reload();
					      }, 1000);
					    }
					  });
					  window.addEventListener('unhandledrejection', function(e) {
					    if (e.reason && e.reason.message && e.reason.message.includes('Loading chunk')) {
					      console.warn('Chunk loading failed, attempting reload...');
					      setTimeout(() => {
					        window.location.reload();
					      }, 1000);
					    }
					  });
					`}
				</Script>
				<SessionProvider
					basePath="/auth"
					session={session}
				>
					<App>
						<GA4Tracker>{children}</GA4Tracker>
					</App>
				</SessionProvider>
			</body>
		</html>
	);
}

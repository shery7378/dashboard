import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	reactStrictMode: false,
	typescript: {
		// Dangerously allow production builds to successfully complete even if
		// your project has type errors.
		ignoreBuildErrors: true
	},
	// Image optimization
	images: {
		formats: ['image/avif', 'image/webp'],
		deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
		imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
		minimumCacheTTL: 60,
	},

	// Compression
	compress: true,

	// HTTP Cache Headers - CDN Ready
	async headers() {
		return [
			{
				source: '/_next/static/:path*',
				headers: [
					{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }
				]
			},
			{
				source: '/_next/image/:path*',
				headers: [
					{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }
				]
			},
			{
				source: '/assets/:path*',
				headers: [
					{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }
				]
			},
			{
				source: '/icons/:path*',
				headers: [
					{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }
				]
			},
			{
				source: '/favicon.ico',
				headers: [
					{ key: 'Cache-Control', value: 'public, max-age=86400' }
				]
			},
			{
				source: '/manifest.json',
				headers: [
					{ key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=86400' }
				]
			},
			{
				source: '/service-worker.js',
				headers: [
					{ key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' }
				]
			},
		];
	},

	// Rewrites for API proxy to avoid CORS issues
	async rewrites() {
		const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://vendor.multikonnect.test';
		return [
			{
				source: '/api/admin/maps-radius-settings',
				destination: `${backendUrl}/api/admin/maps-radius-settings`
			}
		];
	},
	async redirects() {
		return [
			{
				source: '/dashboards/vendor',
				destination: '/dashboards/seller',
				permanent: true,
			},
			{
				source: '/dashboards/vendor-analytics',
				destination: '/dashboards/seller-analytics',
				permanent: true,
			},
		];
	},
	webpack: (config) => {
		if (config.module && config.module.rules) {
			config.module.rules.push({
				test: /\.(json|js|ts|tsx|jsx)$/,
				resourceQuery: /raw/,
				use: 'raw-loader'
			});
		}

		return config;
	}
};

export default nextConfig;

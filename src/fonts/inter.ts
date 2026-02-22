import localFont from 'next/font/local';

export const interVar = localFont({
	src: [
		{ path: '../../public/assets/fonts/inter/Inter-roman.var.woff2', style: 'normal', weight: '100 900' },
		{ path: '../../public/assets/fonts/inter/Inter-italic.var.woff2', style: 'italic', weight: '100 900' }
	],
	variable: '--font-inter',
	display: 'swap',
	preload: true
});

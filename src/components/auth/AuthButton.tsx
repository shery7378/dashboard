'use client';

import React from 'react';

export interface AuthButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: 'primary' | 'secondary' | 'outline';
	fullWidth?: boolean;
	loading?: boolean;
	children: React.ReactNode;
	className?: string;
}

export default function AuthButton({
	variant = 'primary',
	fullWidth = false,
	loading = false,
	children,
	className = '',
	disabled,
	...rest
}: AuthButtonProps) {
	const baseClasses =
		'h-14 rounded-lg text-base font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/30 disabled:cursor-not-allowed';

	const variantClasses = {
		primary: 'bg-[#FF6B35] text-white hover:bg-[#FF5722] disabled:bg-gray-300 disabled:text-gray-500',
		secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:bg-gray-200 disabled:text-gray-400',
		outline:
			'border-2 border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:bg-gray-50 disabled:text-gray-400 disabled:border-gray-100'
	};

	const widthClass = fullWidth ? 'w-full' : '';

	return (
		<button
			className={`${baseClasses} ${variantClasses[variant]} ${widthClass} ${className}`}
			disabled={disabled || loading}
			{...rest}
		>
			{loading ? 'Processing...' : children}
		</button>
	);
}

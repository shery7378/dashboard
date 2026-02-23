import React from 'react';

interface ButtonProps {
	variant?: 'primary' | 'transparent';
	className?: string;
	children: React.ReactNode;
	onClick?: () => void;
}

export default function Button({ variant = 'primary', className = '', children, onClick }: ButtonProps) {
	const baseClasses =
    'inline-flex items-center justify-center px-6 py-2 text-sm font-medium rounded-full';

  const variantClasses = {
    primary: 'border-white border-white text-white',
    transparent: 'bg-transparent border-white border-white text-white hover:bg-white/10 focus:ring-white'
  };

	return (
		<button
			className={`${baseClasses} ${variantClasses[variant]} ${className}`}
			onClick={onClick}
		>
			{children}
		</button>
	);
}

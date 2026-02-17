import React from 'react';

interface ButtonProps {
  variant?: 'primary' | 'transparent';
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}

export default function Button({ variant = 'primary', className = '', children, onClick }: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    transparent: 'bg-transparent text-white hover:bg-white/10 focus:ring-white'
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

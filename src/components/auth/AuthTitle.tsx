'use client';

export interface AuthTitleProps {
	heading: string;
	subtitle?: string;
	align?: 'left' | 'center';
	headingClassName?: string;
	subtitleClassName?: string;
	className?: string;
}

export default function AuthTitle({
	heading,
	subtitle,
	align = 'left',
	headingClassName = '',
	subtitleClassName = '',
	className = ''
}: AuthTitleProps) {
	const alignClass = align === 'center' ? 'text-center' : 'text-left';

	return (
		<div className={`mb-6 ${alignClass} ${className}`}>
			<h2
				className={`font-medium leading-[1.25] tracking-tight text-left text-[#092E3B] mb-2.5 text-2xl ${headingClassName}`}
			>
				{heading}
			</h2>
			{subtitle && <p className={`mb-6 text-left text-[#00000080] text-base ${subtitleClassName}`}>{subtitle}</p>}
		</div>
	);
}

'use client';

import { Breadcrumbs, Typography } from '@mui/material';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';

type PageBreadcrumbProps = {
	className?: string;
	skipHome?: boolean;
};

function PageBreadcrumb({ className, skipHome = false }: PageBreadcrumbProps) {
	const pathname = usePathname();
	const pathArray = pathname.split('/').filter(Boolean);

	return (
		<Breadcrumbs
			aria-label="breadcrumb"
			className={className}
			separator={<FuseSvgIcon size={14}>heroicons-outline:chevron-right</FuseSvgIcon>}
			sx={{
				'& .MuiBreadcrumbs-separator': {
					marginX: 1,
					opacity: 0.5,
				},
			}}
		>
			{!skipHome && (
				<Link
					href="/"
					className="flex items-center hover:underline text-text-secondary"
				>
					<FuseSvgIcon size={16}>heroicons-outline:home</FuseSvgIcon>
				</Link>
			)}
			{pathArray.map((path, index) => {
				const href = `/${pathArray.slice(0, index + 1).join('/')}`;
				const isLast = index === pathArray.length - 1;
				const label = path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ');

				return isLast ? (
					<Typography
						key={href}
						className="text-text-primary font-medium text-13"
					>
						{label}
					</Typography>
				) : (
					<Link
						key={href}
						href={href}
						className="hover:underline text-text-secondary text-13"
					>
						{label}
					</Link>
				);
			})}
		</Breadcrumbs>
	);
}

export default PageBreadcrumb;

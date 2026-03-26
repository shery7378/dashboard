'use client';

import { Typography, Button } from '@mui/material';
import { motion } from 'motion/react';
import useThemeMediaQuery from '@fuse/hooks/useThemeMediaQuery';
import PageBreadcrumb from './PageBreadcrumb';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import Link from '@fuse/core/Link';
import { ReactNode, memo } from 'react';

type ActionButton = {
	label: string;
	href?: string;
	onClick?: () => void;
	icon?: string;
	color?: 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error' | 'inherit';
	variant?: 'text' | 'outlined' | 'contained';
	hidden?: boolean;
};

type PageHeaderProps = {
	title: string;
	subtitle?: string;
	actions?: ReactNode | ActionButton[];
};

function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
	const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down('lg'));

	const renderActions = () => {
		if (!actions) return null;
		if (Array.isArray(actions)) {
			return actions
				.filter((action) => !action.hidden)
				.map((action, index) => (
					<motion.div
						key={index}
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0, transition: { delay: 0.1 * (index + 1) } }}
					>
						<Button
							variant={action.variant || 'contained'}
							color={action.color || 'primary'}
							component={action.href ? Link : 'button'}
							to={action.href}
							onClick={action.onClick}
							size={isMobile ? 'small' : 'medium'}
							startIcon={action.icon ? <FuseSvgIcon size={20}>{action.icon}</FuseSvgIcon> : undefined}
						>
							<span className="mx-1 sm:mx-2 uppercase">{action.label}</span>
						</Button>
					</motion.div>
				));
		}
		return actions;
	};

	return (
		<div className="flex grow-0 flex-1 w-full items-center justify-between space-y-2 sm:space-y-0 py-6 sm:py-8 px-4">
			<motion.div
				initial={{ x: -20, opacity: 0 }}
				animate={{ x: 0, opacity: 1, transition: { delay: 0.1 } }}
				className="flex flex-col"
			>
				<PageBreadcrumb className="mb-2" />
				<div className="flex items-center space-x-4">
					<Typography className="text-3xl md:text-4xl font-extrabold leading-none tracking-tight text-text-primary">
						{title}
					</Typography>
					{subtitle && (
						<Typography className="text-14 md:text-16 font-medium text-text-secondary mt-1">
							{subtitle}
						</Typography>
					)}
				</div>
			</motion.div>

			<div className="flex flex-1 items-center justify-end space-x-3">
				{renderActions()}
			</div>
		</div>
	);
}

export default memo(PageHeader);

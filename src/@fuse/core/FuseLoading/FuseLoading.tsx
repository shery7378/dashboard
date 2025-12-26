import { useEffect, useState } from 'react';
import clsx from 'clsx';
import Box from '@mui/material/Box';

export type FuseLoadingProps = {
	delay?: number;
	className?: string;
};

/**
 * FuseLoading displays a loading state with an optional delay.
 * Safe for SSR hydration by avoiding mismatched rendering.
 */
function FuseLoading({ delay = 0, className }: FuseLoadingProps) {
	const [showLoading, setShowLoading] = useState(false);

	useEffect(() => {
		// Only run after component mounts (client-side)
		if (delay === 0) {
			setShowLoading(true);
		} else {
			const timer = setTimeout(() => setShowLoading(true), delay);
			return () => clearTimeout(timer);
		}
	}, [delay]);

	// ⛔️ Don't render anything until the delay is complete (SSR-safe)
	if (!showLoading) return null;

	return (
		<div
			className={clsx(
				className,
				'flex flex-1 min-h-full h-full w-full self-center flex-col items-center justify-center p-6'
			)}
		>
			<Box
				id="spinner"
				sx={{
					'& > div': {
						backgroundColor: 'palette.secondary.main'
					}
				}}
			>
				<div className="bounce1" />
				<div className="bounce2" />
				<div className="bounce3" />
			</Box>
		</div>
	);
}

export default FuseLoading;

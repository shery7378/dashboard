'use client';

import { Button, Box } from '@mui/material';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import Typography from '@mui/material/Typography';
import { motion } from 'motion/react';

interface LiveSellingHeaderProps {
	onCreateSession: () => void;
}

function LiveSellingHeader({ onCreateSession }: LiveSellingHeaderProps) {
	return (
		<Box
			sx={{
				background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
				borderRadius: 3,
				padding: { xs: 3, sm: 4, md: 5 },
				marginBottom: 4,
				position: 'relative',
				overflow: 'hidden',
				boxShadow: '0 10px 40px rgba(102, 126, 234, 0.3)'
			}}
		>
			{/* Decorative background elements */}
			<Box
				sx={{
					position: 'absolute',
					top: -50,
					right: -50,
					width: 300,
					height: 300,
					borderRadius: '50%',
					background: 'rgba(255, 255, 255, 0.1)',
					filter: 'blur(60px)'
				}}
			/>
			<Box
				sx={{
					position: 'absolute',
					bottom: -30,
					left: -30,
					width: 200,
					height: 200,
					borderRadius: '50%',
					background: 'rgba(255, 255, 255, 0.1)',
					filter: 'blur(40px)'
				}}
			/>

			<Box
				sx={{
					display: 'flex',
					flexDirection: { xs: 'column', sm: 'row' },
					alignItems: { xs: 'flex-start', sm: 'center' },
					justifyContent: 'space-between',
					position: 'relative',
					zIndex: 1,
					gap: 3
				}}
			>
				<Box sx={{ flex: 1 }}>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
						<Box
							sx={{
								width: 48,
								height: 48,
								borderRadius: 2,
								background: 'rgba(255, 255, 255, 0.2)',
								backdropFilter: 'blur(10px)',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center'
							}}
						>
							<FuseSvgIcon sx={{ color: 'white', fontSize: 28 }}>
								heroicons-solid:video-camera
							</FuseSvgIcon>
						</Box>
						<Typography
							sx={{
								fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
								fontWeight: 800,
								color: 'white',
								letterSpacing: '-0.02em',
								lineHeight: 1.2
							}}
						>
							Live Selling
						</Typography>
					</Box>
					<Typography
						sx={{
							fontSize: '1.1rem',
							color: 'rgba(255, 255, 255, 0.9)',
							fontWeight: 400,
							ml: { xs: 0, sm: 10 },
							maxWidth: 600
						}}
					>
						Create and manage your live selling sessions to engage with customers in real-time
					</Typography>
				</Box>

				<motion.div
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
				>
					<Button
						variant="contained"
						size="large"
						startIcon={<FuseSvgIcon sx={{ fontSize: 20 }}>heroicons-solid:plus</FuseSvgIcon>}
						onClick={onCreateSession}
						sx={{
							background: 'white',
							color: '#667eea',
							fontWeight: 700,
							fontSize: '1rem',
							padding: '12px 32px',
							borderRadius: 2,
							textTransform: 'none',
							boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
							'&:hover': {
								background: 'rgba(255, 255, 255, 0.95)',
								boxShadow: '0 6px 25px rgba(0, 0, 0, 0.2)'
							}
						}}
					>
						Create Session
					</Button>
				</motion.div>
			</Box>
		</Box>
	);
}

export default LiveSellingHeader;

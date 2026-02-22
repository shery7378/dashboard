import Typography from '@mui/material/Typography';
import { motion } from 'motion/react';
import PageBreadcrumb from 'src/components/PageBreadcrumb';
import Button from '@mui/material/Button';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { Box } from '@mui/material';

interface LoyaltyPointsHeaderProps {
	onSettingsClick?: () => void;
}

/**
 * The loyalty points header.
 */
function LoyaltyPointsHeader({ onSettingsClick }: LoyaltyPointsHeaderProps) {
	return (
		<div className="flex grow-0 flex-1 w-full items-center justify-between space-y-2 sm:space-y-0 py-6 sm:py-8">
			<motion.span
				initial={{ x: -20, opacity: 0 }}
				animate={{
					x: 0,
					opacity: 1,
					transition: { delay: 0.2, duration: 0.5 }
				}}
			>
				<div>
					<PageBreadcrumb className="mb-2" />
					<Box
						display="flex"
						alignItems="center"
						gap={2}
						mb={1}
					>
						<Box
							sx={{
								width: 56,
								height: 56,
								borderRadius: 2,
								background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								boxShadow: '0 4px 14px 0 rgba(102, 126, 234, 0.39)'
							}}
						>
							<FuseSvgIcon
								className="text-white"
								size={32}
							>
								heroicons-outline:star
							</FuseSvgIcon>
						</Box>
						<Box>
							<Typography className="flex text-4xl font-extrabold leading-none tracking-tight bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
								Loyalty Points
							</Typography>
							<Typography className="mt-2 text-base text-gray-600">
								Manage loyalty points system, view transactions, and adjust user points
							</Typography>
						</Box>
					</Box>
				</div>
			</motion.span>

			<div className="flex w-full sm:w-auto flex-1 items-center justify-end space-x-2">
				{onSettingsClick && (
					<Button
						variant="contained"
						color="primary"
						onClick={onSettingsClick}
						startIcon={<FuseSvgIcon>heroicons-outline:cog-6-tooth</FuseSvgIcon>}
						sx={{
							borderRadius: 2,
							px: 3,
							py: 1.5,
							fontWeight: 600,
							boxShadow: '0 4px 14px 0 rgba(102, 126, 234, 0.39)',
							'&:hover': {
								boxShadow: '0 6px 20px 0 rgba(102, 126, 234, 0.5)',
								transform: 'translateY(-2px)',
								transition: 'all 0.3s ease'
							}
						}}
					>
						Settings
					</Button>
				)}
			</div>
		</div>
	);
}

export default LoyaltyPointsHeader;

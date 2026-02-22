'use client';

import { Typography, Box } from '@mui/material';
import FusePageCardedHeader from '@fuse/core/FusePageCarded/FusePageCardedHeader';
import Icon from '@mui/material/Icon';
import { useTheme, alpha } from '@mui/material/styles';

function MessagesAppHeader() {
	const theme = useTheme();

	return (
		<FusePageCardedHeader>
			<div className="flex flex-col sm:flex-row flex-1 w-full items-center justify-between py-12 px-24">
				<div className="flex items-center gap-16">
					<Box
						sx={{
							width: 48,
							height: 48,
							borderRadius: 2,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
							boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`
						}}
					>
						<Icon sx={{ color: theme.palette.primary.contrastText, fontSize: 28 }}>chat_bubble</Icon>
					</Box>
					<div>
						<Typography
							component="h2"
							className="text-2xl font-semibold tracking-tight"
							sx={{
								background: `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${theme.palette.primary.main} 100%)`,
								backgroundClip: 'text',
								WebkitBackgroundClip: 'text',
								WebkitTextFillColor: 'transparent'
							}}
						>
							Messages
						</Typography>
						<Typography
							variant="caption"
							color="text.secondary"
							className="mt-4 block"
						>
							Communicate with your customers
						</Typography>
					</div>
				</div>
			</div>
		</FusePageCardedHeader>
	);
}

export default MessagesAppHeader;

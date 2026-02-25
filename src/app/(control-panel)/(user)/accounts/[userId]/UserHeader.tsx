'use client';

import { useFormContext } from 'react-hook-form';
import { useSession } from 'next-auth/react';
import { Button, Typography, Avatar, Box, Chip } from '@mui/material';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import _ from 'lodash';
import { styled } from '@mui/material/styles';

const StyledAvatar = styled(Avatar)(({ theme }) => ({
	width: 80,
	height: 80,
	border: `4px solid ${theme.palette.background.paper}`,
	boxShadow: theme.shadows[3],
	[theme.breakpoints.down('sm')]: {
		width: 64,
		height: 64
	}
}));

export interface UserHeaderProps {
	onSubmit: (e?: React.BaseSyntheticEvent) => void;
	loading: boolean;
	handleRemoveUser: () => void;
	isDeleting: boolean;
	profileId: string;
}

function UserHeader({ onSubmit, loading, handleRemoveUser, isDeleting, profileId }: UserHeaderProps) {
	const { data: session } = useSession();
	const user = session?.user;
	const methods = useFormContext();
	const { formState, watch } = methods;
	const { isValid, dirtyFields } = formState;
	const { name, image, first_name, user_type } = watch();

	return (
		<div className="flex flex-col sm:flex-row flex-1 w-full items-center justify-between space-y-4 sm:space-y-0 py-8 sm:py-12 px-4 sm:px-0">
			{/* Left: Name + Avatar */}
			<div className="flex flex-col sm:flex-row items-center sm:space-x-6 text-center sm:text-left">
				<StyledAvatar
					src={image || '/assets/images/apps/profile/profile-placeholder.jpg'}
					alt={name || user?.name || 'User'}
				/>
				<div className="flex flex-col min-w-0 mt-4 sm:mt-0">
					<div className="flex items-center justify-center sm:justify-start space-x-2">
						<Typography className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-none">
							{name || first_name || user?.name || 'User Profile'}
						</Typography>
						{user_type && (
							<Chip
								label={user_type === 'vendor' ? 'SELLER' : user_type.toUpperCase()}
								size="small"
								color="primary"
								variant="filled"
								className="font-bold text-10 px-2"
							/>
						)}
					</div>
					<Typography
						variant="body1"
						className="font-medium text-text-secondary mt-1"
					>
						Manage your account settings and profile information
					</Typography>
				</div>
			</div>

			{/* Right: Buttons */}
			<div className="flex items-center gap-3 w-full sm:w-auto justify-center">
				{profileId ? (
					<Button
						className="rounded-xl px-6"
						variant="outlined"
						color="error"
						onClick={handleRemoveUser}
						disabled={isDeleting}
						startIcon={<FuseSvgIcon size={20}>heroicons-outline:trash</FuseSvgIcon>}
					>
						{isDeleting ? 'Removing...' : 'Delete Account'}
					</Button>
				) : null}
				<Button
					className="rounded-xl px-8"
					variant="contained"
					color="secondary"
					disabled={loading || _.isEmpty(dirtyFields) || !isValid}
					onClick={onSubmit}
					startIcon={!loading && <FuseSvgIcon size={20}>heroicons-outline:check</FuseSvgIcon>}
				>
					{loading ? 'Saving...' : 'Save Changes'}
				</Button>
			</div>
		</div>
	);
}

export default UserHeader;

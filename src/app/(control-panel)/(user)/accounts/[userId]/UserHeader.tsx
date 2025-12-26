'use client';

import { useFormContext } from 'react-hook-form';
import { useSession } from 'next-auth/react';
import { Button, Typography } from '@mui/material';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import _ from 'lodash';

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
	const { name, image, first_name } = watch();

	return (
		<div className="flex flex-col sm:flex-row flex-1 w-full items-center justify-between space-y-2 sm:space-y-0 py-6 sm:py-8">
			{/* Left: Name + Avatar */}
			<div className="flex items-center space-x-3 max-w-full">
				<img
					className="w-10 sm:w-12 rounded-full"
					src={image || '/assets/images/apps/profile/profile-placeholder.jpg'}
					alt={name || user?.name || 'User'}
				/>
				<div className="flex flex-col min-w-0">
					<Typography className="text-lg sm:text-2xl truncate font-semibold">
						{name || first_name || user?.name || 'User Profile'}
					</Typography>
					<Typography variant="caption" className="font-medium text-gray-500">
						Account Settings
					</Typography>
				</div>
			</div>

			{/* Right: Buttons */}
			<div className="flex items-center gap-2">
				{profileId ? (
					<Button
						className="whitespace-nowrap"
						variant="contained"
						color="secondary"
						onClick={handleRemoveUser}
						disabled={isDeleting}
						startIcon={
							<FuseSvgIcon className="hidden sm:flex">heroicons-outline:trash</FuseSvgIcon>
						}
					>
						{isDeleting ? 'Removing...' : 'Remove'}
					</Button>
				) : null}
				<Button
					className="whitespace-nowrap"
					variant="contained"
					color="secondary"
					disabled={loading || _.isEmpty(dirtyFields) || !isValid}
					onClick={onSubmit}
				>
					{loading ? 'Saving...' : 'Save'}
				</Button>
			</div>
		</div>
	);
}

export default UserHeader;
'use client';

import { Button, Typography } from '@mui/material';
import { useFormContext } from 'react-hook-form';
import { useSession } from 'next-auth/react';
import _ from 'lodash';
import { useEffect, useState } from 'react';

type ProfileHeaderProps = {
	onSubmit: () => void;
	tabValue: string;
};

function ProfileHeader({ onSubmit, tabValue }: ProfileHeaderProps) {
	const { data: session } = useSession();
	const user = session?.user;
	const methods = useFormContext();
	const { formState, watch } = methods;
	const { isValid, dirtyFields, errors } = formState;
	const [isSaveDisabled, setIsSaveDisabled] = useState(true);

	const { name, image, new_password, confirm_password, current_password } = watch();

	useEffect(() => {
		if (tabValue === 'change-password') {
			const hasPasswordErrors = errors.current_password || errors.new_password || errors.confirm_password;
			setIsSaveDisabled(
				!(
					current_password &&
					new_password &&
					confirm_password &&
					new_password === confirm_password &&
					!hasPasswordErrors
				)
			);
		} else {
			setIsSaveDisabled(_.isEmpty(dirtyFields) || !isValid);
		}
	}, [new_password, confirm_password, current_password, errors, dirtyFields, isValid, tabValue]);

	return (
		<div className="flex flex-col sm:flex-row flex-1 w-full items-center justify-between space-y-2 sm:space-y-0 py-6 sm:py-8">
			{/* Breadcrumb + Name */}
			<div className="flex flex-col items-start space-y-2 sm:space-y-0 w-full sm:max-w-full min-w-0">
				{/* ...motion/PageBreadcrumb code */}
				<div className="flex items-center max-w-full space-x-3">
					<img
						className="w-8 sm:w-12 rounded-full"
						src={image || '/assets/images/apps/profile/profile-placeholder.jpg'}
						alt={name || user?.name || 'User'}
					/>
					<div className="flex flex-col min-w-0">
						<Typography className="text-lg sm:text-2xl truncate font-semibold">
							{name || user?.name || 'User Profile'}
						</Typography>
						<Typography
							variant="caption"
							className="font-medium"
						>
							Account Settings
						</Typography>
					</div>
				</div>
			</div>

			<div className="flex flex-1 w-full">
				<Button
					className="whitespace-nowrap mx-1"
					variant="contained"
					color="secondary"
					disabled={isSaveDisabled}
					onClick={onSubmit}
				>
					Save
				</Button>
			</div>
		</div>
	);
}

export default ProfileHeader;

import { useFormContext } from 'react-hook-form';
import { useSession } from 'next-auth/react';
import { Button, Typography } from '@mui/material';
import _ from 'lodash';

type ProfileHeaderProps = {
	onSubmit: () => void;
};

function ProfileHeader({ onSubmit }: ProfileHeaderProps) {
	const { data: session } = useSession();
	const user = session?.user;
	const methods = useFormContext();
	const { formState, watch } = methods;
	const { isValid, dirtyFields } = formState;

	const { name, image } = watch();

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

			{/* Save button */}
			<div className="flex flex-1 w-full">
				<Button
					className="whitespace-nowrap mx-1"
					variant="contained"
					color="secondary"
					disabled={_.isEmpty(dirtyFields) || !isValid}
					onClick={onSubmit} // Directly calls ProfilePage submit
				>
					Save
				</Button>
			</div>
		</div>
	);
}

export default ProfileHeader;

import { orange } from '@mui/material/colors';
import { lighten, styled } from '@mui/material/styles';
import { Controller, useFormContext } from 'react-hook-form';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';

const Root = styled('div')(({ theme }) => ({
	'& .productImageFeaturedStar': {
		position: 'absolute',
		top: 0,
		right: 0,
		color: orange[400],
		opacity: 0
	},
	'& .productImageUpload': {
		transitionProperty: 'box-shadow',
		transitionDuration: theme.transitions.duration.short,
		transitionTimingFunction: theme.transitions.easing.easeInOut
	},
	'& .productImageItem': {
		transitionProperty: 'box-shadow',
		transitionDuration: theme.transitions.duration.short,
		transitionTimingFunction: theme.transitions.easing.easeInOut,
		'&:hover': {
			'& .productImageFeaturedStar': {
				opacity: 0.8
			}
		},
		'&.featured': {
			pointerEvents: 'none',
			boxShadow: theme.shadows[3],
			'& .productImageFeaturedStar': {
				opacity: 1
			},
			'&:hover .productImageFeaturedStar': {
				opacity: 1
			}
		}
	}
}));

/**
 * The product images tab.
 */
function ProfileImagesTab() {
	const methods = useFormContext();
	const { control, watch } = methods;

	const image = watch('image') as string | null;

	return (
		<Root>
			<div className="flex justify-center sm:justify-start flex-wrap -mx-3">
				<Controller
					name="image"
					control={control}
					render={({ field: { onChange, value } }) => (
						<>
							<Box
								component="label"
								htmlFor="button-file"
								className="productImageUpload relative mx-3 mb-6 cursor-pointer"
								sx={{ display: 'inline-block' }}
							>
								<input
									accept="image/*"
									className="hidden"
									id="button-file"
									type="file"
									onChange={async (e) => {
										const file = e?.target?.files?.[0];

										if (!file) return;

										const reader = new FileReader();
										reader.onload = () => {
											const base64 = `data:${file.type};base64,${btoa(reader.result as string)}`;
											onChange(base64);
										};
										reader.readAsBinaryString(file);
									}}
								/>
								{/* Default avatar — same as profile header */}
								<Avatar
									src={value || '/assets/images/apps/profile/profile-placeholder.jpg'}
									alt="Profile"
									sx={{
										width: 128,
										height: 128,
										borderRadius: '50%',
										boxShadow: 3,
										border: '3px solid',
										borderColor: 'divider',
										transition: 'opacity 0.2s',
										'&:hover': { opacity: 0.85 }
									}}
								/>
								{/* Camera overlay badge */}
								<Box
									sx={(theme) => ({
										position: 'absolute',
										bottom: 4,
										right: 4,
										width: 32,
										height: 32,
										borderRadius: '50%',
										backgroundColor: theme.palette.background.paper,
										border: `2px solid ${theme.palette.divider}`,
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										boxShadow: theme.shadows[2]
									})}
								>
									<FuseSvgIcon size={16} color="action">
										heroicons-outline:camera
									</FuseSvgIcon>
								</Box>
							</Box>

							{/* Preview label below avatar */}
							<Box className="mt-2 text-center" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
								{value ? 'Click to change photo' : 'Click to upload photo'}
							</Box>
						</>
					)}
				/>
			</div>
		</Root>
	);
}

export default ProfileImagesTab;

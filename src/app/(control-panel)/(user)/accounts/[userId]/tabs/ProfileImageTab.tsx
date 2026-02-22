import { orange } from '@mui/material/colors';
import { lighten, styled } from '@mui/material/styles';
import { Controller, useFormContext } from 'react-hook-form';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import Box from '@mui/material/Box';

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
								sx={(theme) => ({
									backgroundColor: lighten(theme.palette.background.default, 0.02),
									...theme.applyStyles('light', {
										backgroundColor: lighten(theme.palette.background.default, 0.2)
									})
								})}
								component="label"
								htmlFor="button-file"
								className="productImageUpload flex items-center justify-center relative w-32 h-32 rounded-lg mx-3 mb-6 overflow-hidden cursor-pointer shadow-sm hover:shadow-lg"
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
								<FuseSvgIcon
									size={32}
									color="action"
								>
									heroicons-outline:arrow-up-on-square
								</FuseSvgIcon>
							</Box>

							{value && (
								<Box
									sx={(theme) => ({
										backgroundColor: lighten(theme.palette.background.default, 0.02),
										...theme.applyStyles('light', {
											backgroundColor: lighten(theme.palette.background.default, 0.2)
										})
									})}
									className="productImageItem flex items-center justify-center relative w-32 h-32 rounded-lg mx-3 mb-6 overflow-hidden shadow-sm"
								>
									<img
										className="max-w-none w-auto h-full"
										src={value}
										alt="category"
									/>
								</Box>
							)}
						</>
					)}
				/>
			</div>
		</Root>
	);
}

export default ProfileImagesTab;

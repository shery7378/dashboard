import { useEffect, useRef } from 'react';
import { orange } from '@mui/material/colors';
import { lighten, styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import { Controller, useFormContext } from 'react-hook-form';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';

const Root = styled('div')(({ theme }) => ({
	'& .imageUploadBox': {
		transition: theme.transitions.create('box-shadow', {
			duration: theme.transitions.duration.short,
			easing: theme.transitions.easing.easeInOut
		})
	},
	'& .imagePreviewBox': {
		transition: theme.transitions.create('box-shadow', {
			duration: theme.transitions.duration.short,
			easing: theme.transitions.easing.easeInOut
		}),
		boxShadow: theme.shadows[1]
	}
}));

function StoreImagesTab() {
	const { control, watch, setValue } = useFormContext();

	const logo = watch('logo') as string | null;
	const bannerImage = watch('banner_image') as string | null;

	// Store original values to detect changes
	const originalLogoRef = useRef<string | null>(null);
	const originalBannerRef = useRef<string | null>(null);

	useEffect(() => {
		originalLogoRef.current = logo;
		originalBannerRef.current = bannerImage;
	}, []);

	const handleFileUpload = (
		file: File,
		fieldName: 'logo' | 'banner_image'
	) => {
		const reader = new FileReader();
		reader.onload = () => {
			const base64 = `data:${file.type};base64,${btoa(reader.result as string)}`;
			setValue(fieldName, base64, { shouldDirty: true });
		};
		reader.readAsBinaryString(file);
	};

	const renderImageField = (
		fieldName: 'logo' | 'banner_image',
		label: string,
		value: string | null,
		onChange: (val: string) => void
	) => (
		<div className="flex flex-col items-start mx-3 mb-6">
			<span className="font-semibold text-sm mb-2">{label}</span>
			<Box
				sx={(theme) => ({
					backgroundColor: lighten(theme.palette.background.default, 0.02),
					...theme.applyStyles('light', {
						backgroundColor: lighten(theme.palette.background.default, 0.2)
					})
				})}
				component="label"
				htmlFor={`file-input-${fieldName}`}
				className="imageUploadBox flex items-center justify-center relative w-32 h-32 rounded-lg overflow-hidden cursor-pointer shadow-sm hover:shadow-lg"
			>
				<input
					accept="image/*"
					className="hidden"
					id={`file-input-${fieldName}`}
					type="file"
					onChange={(e) => {
						const file = e.target.files?.[0];
						if (file) {
							handleFileUpload(file, fieldName);
						}
					}}
				/>
				<FuseSvgIcon size={32} color="action">
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
					className="imagePreviewBox flex items-center justify-center relative w-32 h-32 mt-2 rounded-lg overflow-hidden"
				>
					<img className="max-w-none w-auto h-full" src={value} alt={label} />
				</Box>
			)}
		</div>
	);

	return (
		<Root>
			<div className="flex justify-start flex-wrap -mx-3">
				<Controller
					name="logo"
					control={control}
					render={({ field: { onChange, value } }) =>
						renderImageField('logo', 'Store Logo', value, onChange)
					}
				/>

				<Controller
					name="banner_image"
					control={control}
					render={({ field: { onChange, value } }) =>
						renderImageField('banner_image', 'Banner Image', value, onChange)
					}
				/>
			</div>
		</Root>
	);
}

export default StoreImagesTab;
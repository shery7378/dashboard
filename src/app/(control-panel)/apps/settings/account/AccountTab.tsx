'use client';

import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import { z } from 'zod';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { useEffect, useCallback, memo } from 'react';
import { useGetAccountSettingsQuery, useUpdateAccountSettingsMutation } from '../SettingsApi';

const schema = z.object({
	id: z.string().min(1, 'ID is required'),
	name: z.string().min(1, 'Name is required'),
	username: z.string().min(1, 'Username is required'),
	title: z.string().min(1, 'Title is required'),
	company: z.string().min(1, 'Company is required'),
	about: z.string().min(1, 'About is required'),
	email: z.string().email('Invalid email').min(1, 'Email is required'),
	phone: z.string().min(1, 'Phone is required'),
	country: z.string().min(1, 'Country is required'),
	language: z.string().min(1, 'Language is required'),
});

type FormType = z.infer<typeof schema>;

const defaultValues: FormType = {
	id: '', name: '', username: '', title: '', company: '',
	about: '', email: '', phone: '', country: '', language: '',
};

// Memoized adornment — prevents new JSX object on every Controller render
const Adornment = memo(({ icon }: { icon: string }) => (
	<InputAdornment position="start">
		<FuseSvgIcon size={20}>{icon}</FuseSvgIcon>
	</InputAdornment>
));
Adornment.displayName = 'Adornment';

// Memoized field — only re-renders when its own value/error changes
const FormField = memo(({
	control, name, label, placeholder, id, error, helperText, icon, multiline, minRows, maxRows, colSpan,
}: {
	control: any; name: keyof FormType; label: string; placeholder: string;
	id?: string; error?: any; helperText?: React.ReactNode; icon: string;
	multiline?: boolean; minRows?: number; maxRows?: number; colSpan?: string;
}) => (
	<div className={colSpan ?? 'sm:col-span-2'}>
		<Controller
			control={control}
			name={name}
			render={({ field }) => (
				<TextField
					{...field}
					label={label}
					placeholder={placeholder}
					id={id}
					error={!!error}
					helperText={helperText}
					variant="outlined"
					fullWidth
					multiline={multiline}
					minRows={minRows}
					maxRows={maxRows}
					slotProps={{
						input: {
							className: multiline ? 'max-h-min h-min items-start' : undefined,
							startAdornment: multiline
								? <InputAdornment className="mt-4" position="start"><FuseSvgIcon size={20}>{icon}</FuseSvgIcon></InputAdornment>
								: <Adornment icon={icon} />,
						},
					}}
				/>
			)}
		/>
	</div>
));
FormField.displayName = 'FormField';

function AccountTab() {
	const { data: accountSettings } = useGetAccountSettingsQuery();
	const [updateAccountSettings] = useUpdateAccountSettingsMutation();

	const { control, reset, handleSubmit, formState: { isValid, dirtyFields, errors } } = useForm<FormType>({
		defaultValues,
		mode: 'all',
		resolver: zodResolver(schema),
	});

	useEffect(() => {
		if (accountSettings) reset(accountSettings);
	}, [accountSettings, reset]);

	// useCallback — stable reference, doesn't recreate on every render
	const onSubmit = useCallback((formData: FormType) => {
		updateAccountSettings(formData);
	}, [updateAccountSettings]);

	const handleReset = useCallback(() => {
		reset(accountSettings);
	}, [reset, accountSettings]);

	const isDirty = Object.keys(dirtyFields).length > 0;

	return (
		<div className="w-full max-w-5xl">
			<form onSubmit={handleSubmit(onSubmit)}>
				<div className="w-full">
					<Typography className="text-xl">Profile</Typography>
					<Typography color="text.secondary">Following information is publicly displayed, be careful!</Typography>
				</div>

				<div className="mt-8 grid w-full gap-6 sm:grid-cols-4">
					<FormField control={control} name="name" label="Name" placeholder="Name" id="name" error={errors.name} helperText={errors.name?.message} icon="heroicons-solid:user-circle" colSpan="sm:col-span-4" />
					<FormField
						control={control} name="username" label="Username" placeholder="Username" id="user-name"
						error={errors.username} helperText={errors.username?.message} icon=""
						colSpan="sm:col-span-4"
					/>
					<FormField control={control} name="title" label="Title" placeholder="Job title" id="title" error={errors.title} helperText={errors.title?.message} icon="heroicons-solid:briefcase" />
					<FormField control={control} name="company" label="Company" placeholder="Company" id="company" error={errors.company} helperText={errors.company?.message} icon="heroicons-solid:building-office-2" />
					<FormField
						control={control} name="about" label="Notes" placeholder="Notes" id="notes"
						error={errors.about} icon="heroicons-solid:bars-3-bottom-left"
						multiline minRows={5} maxRows={10} colSpan="sm:col-span-4"
						helperText={
							<span className="flex flex-col">
								<span>Brief description for your profile. Basic HTML and Emoji are allowed.</span>
								<span>{errors.about?.message}</span>
							</span>
						}
					/>
				</div>

				<div className="my-10 border-t" />

				<div className="w-full">
					<Typography className="text-xl">Personal Information</Typography>
					<Typography color="text.secondary">Communication details in case we want to connect with you. These will be kept private.</Typography>
				</div>

				<div className="grid w-full gap-6 sm:grid-cols-4 mt-8">
					<FormField control={control} name="email" label="Email" placeholder="Email" error={errors.email} helperText={errors.email?.message} icon="heroicons-solid:envelope" />
					<FormField control={control} name="phone" label="Phone Number" placeholder="Phone Number" error={errors.phone} helperText={errors.phone?.message} icon="heroicons-solid:phone" />
					<FormField control={control} name="country" label="Country" placeholder="Country" error={errors.country} helperText={errors.country?.message} icon="heroicons-solid:flag" />
					<FormField control={control} name="language" label="Language" placeholder="Language" error={errors.language} helperText={errors.language?.message} icon="heroicons-solid:globe-alt" />
				</div>

				<Divider className="mb-10 mt-11 border-t" />

				<div className="flex items-center justify-end space-x-2">
					<Button variant="outlined" disabled={!isDirty} onClick={handleReset}>Cancel</Button>
					<Button variant="contained" color="secondary" disabled={!isDirty || !isValid} type="submit">Save</Button>
				</div>
			</form>
		</div>
	);
}

export default AccountTab;
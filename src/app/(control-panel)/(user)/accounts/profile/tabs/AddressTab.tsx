'use client';

import { Controller, useFormContext } from 'react-hook-form';
import { TextField, Typography } from '@mui/material';

function AddressTab() {
	const { control, formState } = useFormContext();
	const { errors } = formState;

	return (
		<>
			<div className="space-y-6">
				<Controller
					name="address"
					control={control}
					render={({ field }) => (
						<TextField
							{...field}
							label="Address"
							fullWidth
							error={!!errors.address}
							helperText={errors.address?.message as string}
						/>
					)}
				/>
				<Controller
					name="city"
					control={control}
					render={({ field }) => (
						<TextField
							{...field}
							label="City"
							fullWidth
							error={!!errors.city}
							helperText={errors.city?.message as string}
						/>
					)}
				/>
				<Controller
					name="state"
					control={control}
					render={({ field }) => (
						<TextField
							{...field}
							label="State"
							fullWidth
							error={!!errors.state}
							helperText={errors.state?.message as string}
						/>
					)}
				/>
				<Controller
					name="country"
					control={control}
					render={({ field }) => (
						<TextField
							{...field}
							label="Country"
							fullWidth
							error={!!errors.country}
							helperText={errors.country?.message as string}
						/>
					)}
				/>
				<Controller
					name="postal_code"
					control={control}
					render={({ field }) => (
						<TextField
							{...field}
							label="Postal Code"
							fullWidth
							error={!!errors.postal_code}
							helperText={errors.postal_code?.message as string}
						/>
					)}
				/>
			</div>

			<div className="space-y-6 mt-6">
				<Typography
					variant="h6"
					component="h2"
				>
					Coordinates
				</Typography>
				<Controller
					name="lat"
					control={control}
					render={({ field }) => (
						<TextField
							{...field}
							label="Latitude"
							type="number"
							fullWidth
							error={!!errors.lat}
							helperText={errors.lat?.message as string}
							inputProps={{ step: 'any' }} // Allow decimal values
						/>
					)}
				/>
				<Controller
					name="lng"
					control={control}
					render={({ field }) => (
						<TextField
							{...field}
							label="Longitude"
							type="number"
							fullWidth
							error={!!errors.lng}
							helperText={errors.lng?.message as string}
							inputProps={{ step: 'any' }} // Allow decimal values
						/>
					)}
				/>
			</div>
		</>
	);
}

export default AddressTab;

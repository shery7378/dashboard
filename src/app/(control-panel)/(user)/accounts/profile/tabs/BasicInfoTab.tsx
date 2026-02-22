'use client';

import { Controller, useFormContext } from 'react-hook-form';
import { TextField, MenuItem } from '@mui/material';

function BasicInfoTab() {
	const { control, formState } = useFormContext();
	const { errors } = formState;

	return (
		<div className="space-y-6">
			<Controller
				name="name"
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						label="Username"
						fullWidth
						error={!!errors.name}
						helperText={errors.name?.message as string}
						required
						disabled
					/>
				)}
			/>
			<Controller
				name="first_name"
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						label="First Name"
						fullWidth
						error={!!errors.first_name}
						helperText={errors.first_name?.message as string}
						required
					/>
				)}
			/>
			<Controller
				name="last_name"
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						label="Last Name"
						fullWidth
						error={!!errors.last_name}
						helperText={errors.last_name?.message as string}
						required
					/>
				)}
			/>
			<Controller
				name="phone"
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						label="Phone Number"
						fullWidth
						error={!!errors.phone}
						helperText={errors.phone?.message as string}
						required
					/>
				)}
			/>
			<Controller
				name="email"
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						label="Email"
						type="email"
						fullWidth
						error={!!errors.email}
						helperText={errors.email?.message as string}
						required
						disabled
					/>
				)}
			/>

			<Controller
				name="dob"
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						label="Date of Birth"
						type="date"
						fullWidth
						value={field.value || ''} // ✅ controlled even if empty
						onChange={field.onChange}
						error={!!errors.dob}
						helperText={errors.dob?.message as string}
						InputLabelProps={{ shrink: true }}
					/>
				)}
			/>

			{/* ---------------- Gender Field ---------------- */}
			<Controller
				name="gender"
				control={control}
				defaultValue={''} // ensures controlled
				render={({ field }) => (
					<TextField
						{...field}
						select
						label="Gender"
						fullWidth
						value={field.value || ''} // ✅ controlled even if empty
						onChange={field.onChange}
						error={!!errors.gender}
						helperText={errors.gender?.message as string}
					>
						<MenuItem value="">Select Gender</MenuItem> {/* optional blank */}
						<MenuItem value="male">Male</MenuItem>
						<MenuItem value="female">Female</MenuItem>
						<MenuItem value="other">Other</MenuItem>
					</TextField>
				)}
			/>

			<Controller
				name="status"
				control={control}
				defaultValue="active" // ensures "active" is always the value
				render={({ field }) => (
					<TextField
						{...field}
						select
						label="Status"
						fullWidth
						value="active" // always shows Active
						InputProps={{
							readOnly: true // prevents user input
						}}
						error={!!errors.status}
						helperText={errors.status?.message as string}
					>
						<MenuItem value="active">Active</MenuItem>
					</TextField>
				)}
			/>
		</div>
	);
}

export default BasicInfoTab;

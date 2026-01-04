'use client';

import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { TextField, MenuItem, Divider, Typography } from '@mui/material';

function BasicInfoTab() {
	const { control, formState } = useFormContext();
	const { errors } = formState;

	const userType = useWatch({ control, name: 'user_type' });
	const isCustomer = userType === 'customer';
	const isSellerOrSupplier = userType === 'seller' || userType === 'supplier';

	return (
		<div className="space-y-6">
			{/* ---------- USER TYPE ---------- */}
			<Controller
				name="user_type"
				control={control}
				defaultValue="customer"
				render={({ field }) => (
					<TextField
						{...field}
						select
						label="User Type"
						fullWidth
						error={!!errors.user_type}
						helperText={errors.user_type?.message as string}
						required
					>
						<MenuItem value="customer">Customer</MenuItem>
						<MenuItem value="seller">Seller</MenuItem>
						<MenuItem value="supplier">Supplier</MenuItem>
					</TextField>
				)}
			/>

			{/* ---------- SELLER / SUPPLIER FIELDS ---------- */}
			{isSellerOrSupplier && (
				<>
					<Controller
						name="store_name"
						control={control}
						render={({ field }) => (
							<TextField
								{...field}
								label="Store Name"
								fullWidth
								error={!!errors.store_name}
								helperText={errors.store_name?.message as string}
								required
							/>
						)}
					/>

					<Controller
						name="name"
						control={control}
						render={({ field }) => (
							<TextField
								{...field}
								label="Owner Name"
								fullWidth
								error={!!errors.name}
								helperText={errors.name?.message as string}
								required
							/>
						)}
					/>
				</>
			)}

			{/* ---------- CUSTOMER FIELDS ---------- */}
			{isCustomer && (
				<>
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
						name="address"
						control={control}
						render={({ field }) => (
							<TextField
								{...field}
								label="Address"
								fullWidth
								multiline
								rows={3}
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
				</>
			)}

			{/* ---------- COMMON FIELDS ---------- */}
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
					/>
				)}
			/>

			<Controller
				name="status"
				control={control}
				defaultValue="active"
				render={({ field }) => (
					<TextField
						{...field}
						select
						label="Status"
						fullWidth
						error={!!errors.status}
						helperText={errors.status?.message as string}
					>
						<MenuItem value="active">Active</MenuItem>
						<MenuItem value="in_active">In active</MenuItem>
						<MenuItem value="suspend">Suspend</MenuItem>
					</TextField>
				)}
			/>

			{/* ---------- PASSWORD SECTION ---------- */}
			<Divider className="!my-8" />
			<Typography variant="h6" className="font-semibold text-gray-700">
				Security Settings
			</Typography>

			<Controller
				name="password"
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						label="Password"
						type="password"
						fullWidth
						error={!!errors.password}
						helperText={errors.password?.message as string}
					/>
				)}
			/>

			<Controller
				name="confirm_password"
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						label="Confirm Password"
						type="password"
						fullWidth
						error={!!errors.confirm_password}
						helperText={errors.confirm_password?.message as string}
					/>
				)}
			/>
		</div>
	);
}

export default BasicInfoTab;

'use client';

import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { TextField, MenuItem, Divider, Typography, Grid, InputAdornment } from '@mui/material';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';

function BasicInfoTab() {
	const { control, formState } = useFormContext();
	const { errors } = formState;

	const userType = useWatch({ control, name: 'user_type' });
	const isCustomer = userType === 'customer';

	return (
		<div className="space-y-8 py-4">
			{/* ---------- ACCOUNT TYPE & STATUS ---------- */}
			<section>
				<Typography variant="overline" className="font-bold text-secondary mb-4 block">
					Account Identity
				</Typography>
				<Grid container spacing={3}>
					<Grid item xs={12} md={6}>
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
									InputProps={{
										startAdornment: (
											<InputAdornment position="start">
												<FuseSvgIcon size={20}>heroicons-outline:user-group</FuseSvgIcon>
											</InputAdornment>
										)
									}}
									InputLabelProps={{ shrink: true }}
								>
									<MenuItem value="customer">Customer</MenuItem>
									<MenuItem value="vendor">Seller</MenuItem>
									<MenuItem value="supplier">Supplier</MenuItem>
								</TextField>
							)}
						/>
					</Grid>
					<Grid item xs={12} md={6}>
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
									InputProps={{
										startAdornment: (
											<InputAdornment position="start">
												<FuseSvgIcon size={20}>heroicons-outline:check-circle</FuseSvgIcon>
											</InputAdornment>
										)
									}}
									InputLabelProps={{ shrink: true }}
								>
									<MenuItem value="active">Active</MenuItem>
									<MenuItem value="in_active">In active</MenuItem>
									<MenuItem value="suspend">Suspend</MenuItem>
								</TextField>
							)}
						/>
					</Grid>
				</Grid>
			</section>

			<Divider />

			{/* ---------- VENDOR / SUPPLIER FIELDS ---------- */}
			{(userType === 'vendor' || userType === 'supplier') && (
				<section>
					<Typography variant="overline" className="font-bold text-secondary mb-4 block">
						Business Details
					</Typography>
					<Grid container spacing={3}>
						<Grid item xs={12} md={6}>
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
										InputProps={{
											startAdornment: (
												<InputAdornment position="start">
													<FuseSvgIcon size={20}>heroicons-outline:building-storefront</FuseSvgIcon>
												</InputAdornment>
											)
										}}
										InputLabelProps={{ shrink: true }}
									/>
								)}
							/>
						</Grid>

						<Grid item xs={12} md={6}>
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
										InputProps={{
											startAdornment: (
												<InputAdornment position="start">
													<FuseSvgIcon size={20}>heroicons-outline:identification</FuseSvgIcon>
												</InputAdornment>
											)
										}}
										InputLabelProps={{ shrink: true }}
									/>
								)}
							/>
						</Grid>
					</Grid>
				</section>
			)}

			{/* ---------- CUSTOMER FIELDS ---------- */}
			{isCustomer && (
				<section>
					<Typography variant="overline" className="font-bold text-secondary mb-4 block">
						Personal Information
					</Typography>
					<Grid container spacing={3}>
						<Grid item xs={12} md={6}>
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
										InputProps={{
											startAdornment: (
												<InputAdornment position="start">
													<FuseSvgIcon size={20}>heroicons-outline:user</FuseSvgIcon>
												</InputAdornment>
											)
										}}
										InputLabelProps={{ shrink: true }}
									/>
								)}
							/>
						</Grid>

						<Grid item xs={12} md={6}>
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
										InputProps={{
											startAdornment: (
												<InputAdornment position="start">
													<FuseSvgIcon size={20}>heroicons-outline:user</FuseSvgIcon>
												</InputAdornment>
											)
										}}
										InputLabelProps={{ shrink: true }}
									/>
								)}
							/>
						</Grid>

						<Grid item xs={12}>
							<Controller
								name="address"
								control={control}
								render={({ field }) => (
									<TextField
										{...field}
										label="Address"
										fullWidth
										multiline
										rows={2}
										error={!!errors.address}
										helperText={errors.address?.message as string}
										InputProps={{
											startAdornment: (
												<InputAdornment position="start" className="self-start mt-3">
													<FuseSvgIcon size={20}>heroicons-outline:map-pin</FuseSvgIcon>
												</InputAdornment>
											)
										}}
										InputLabelProps={{ shrink: true }}
									/>
								)}
							/>
						</Grid>

						<Grid item xs={12} md={6}>
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
										InputProps={{
											startAdornment: (
												<InputAdornment position="start">
													<FuseSvgIcon size={20}>heroicons-outline:building-office</FuseSvgIcon>
												</InputAdornment>
											)
										}}
										InputLabelProps={{ shrink: true }}
									/>
								)}
							/>
						</Grid>
					</Grid>
				</section>
			)}

			<Divider />

			{/* ---------- CONTACT DETAILS ---------- */}
			<section>
				<Typography variant="overline" className="font-bold text-secondary mb-4 block">
					Contact Details
				</Typography>
				<Grid container spacing={3}>
					<Grid item xs={12} md={6}>
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
									InputProps={{
										startAdornment: (
											<InputAdornment position="start">
												<FuseSvgIcon size={20}>heroicons-outline:phone</FuseSvgIcon>
											</InputAdornment>
										)
									}}
									InputLabelProps={{ shrink: true }}
								/>
							)}
						/>
					</Grid>

					<Grid item xs={12} md={6}>
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
									InputProps={{
										startAdornment: (
											<InputAdornment position="start">
												<FuseSvgIcon size={20}>heroicons-outline:envelope</FuseSvgIcon>
											</InputAdornment>
										)
									}}
									InputLabelProps={{ shrink: true }}
								/>
							)}
						/>
					</Grid>
				</Grid>
			</section>

			<Divider />

			{/* ---------- PASSWORD SECTION ---------- */}
			<section>
				<Typography variant="overline" className="font-bold text-secondary mb-4 block">
					Security Settings
				</Typography>
				<Grid container spacing={3}>
					<Grid item xs={12} md={6}>
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
									InputProps={{
										startAdornment: (
											<InputAdornment position="start">
												<FuseSvgIcon size={20}>heroicons-outline:lock-closed</FuseSvgIcon>
											</InputAdornment>
										)
									}}
									InputLabelProps={{ shrink: true }}
								/>
							)}
						/>
					</Grid>

					<Grid item xs={12} md={6}>
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
									InputProps={{
										startAdornment: (
											<InputAdornment position="start">
												<FuseSvgIcon size={20}>heroicons-outline:lock-closed</FuseSvgIcon>
											</InputAdornment>
										)
									}}
									InputLabelProps={{ shrink: true }}
								/>
							)}
						/>
					</Grid>
				</Grid>
			</section>
		</div>
	);
}

export default BasicInfoTab;

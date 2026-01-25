import { useMemo } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Autocomplete from '@mui/material/Autocomplete';
import Chip from '@mui/material/Chip';

/**
 * Contact info and toggle options (pickup/delivery).
 */
function StoreContactTab() {
	const { control, formState, watch } = useFormContext();
	const { errors } = formState;
	const deliveryEnabled = watch('offers_delivery');

	const deliverySlotPresets = useMemo(
		() => ['12-3pm', '3-6pm', '6-9pm', '9am-12pm', '12pm-3pm', '3pm-6pm', '6pm-9pm'],
		[]
	);

	return (
		<Box sx={{ display: 'grid', gap: 2 }}>
			<Paper variant="outlined" sx={{ borderRadius: 2, p: 2 }}>
				<Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
					Contact
				</Typography>
				<Box
					sx={{
						display: 'grid',
						gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
						gap: 2,
					}}
				>
					<Controller
						name="contact_email"
						control={control}
						render={({ field }) => (
							<TextField
								{...field}
								label="Contact Email"
								fullWidth
								variant="outlined"
								error={!!errors.contact_email}
								helperText={errors?.contact_email?.message as string}
							/>
						)}
					/>
					<Controller
						name="contact_phone"
						control={control}
						render={({ field }) => (
							<TextField
								{...field}
								label="Contact Phone"
								fullWidth
								variant="outlined"
								error={!!errors.contact_phone}
								helperText={errors?.contact_phone?.message as string}
							/>
						)}
					/>
				</Box>
			</Paper>

			<Paper variant="outlined" sx={{ borderRadius: 2, p: 2 }}>
				<Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
					Availability
				</Typography>
				<Stack spacing={1}>
					<Controller
						name="active"
						control={control}
						render={({ field }) => (
							<FormControlLabel control={<Switch {...field} checked={field.value} />} label="Store Active" />
						)}
					/>
					<Controller
						name="offers_pickup"
						control={control}
						render={({ field }) => (
							<FormControlLabel control={<Switch {...field} checked={field.value} />} label="Offers Pickup" />
						)}
					/>
					<Controller
						name="offers_delivery"
						control={control}
						render={({ field }) => (
							<FormControlLabel control={<Switch {...field} checked={field.value} />} label="Offers Delivery" />
						)}
					/>
				</Stack>
			</Paper>

			<Paper variant="outlined" sx={{ borderRadius: 2, p: 2 }}>
				<Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
					Delivery
				</Typography>
				<Box
					sx={{
						display: 'grid',
						gridTemplateColumns: { xs: '1fr', md: '1.5fr 1fr' },
						gap: 2,
					}}
				>
					<Controller
						name="delivery_slots"
						control={control}
						render={({ field }) => (
							<Autocomplete
								multiple
								freeSolo
								options={deliverySlotPresets}
								value={Array.isArray(field.value) ? field.value : []}
								onChange={(_, value) => {
									const next = (value || [])
										.map((v) => String(v).trim())
										.filter(Boolean);
									field.onChange(next);
								}}
								renderTags={(value, getTagProps) =>
									value.map((option, index) => (
										<Chip variant="outlined" label={option} {...getTagProps({ index })} key={`${option}-${index}`} />
									))
								}
								renderInput={(params) => (
									<TextField
										{...params}
										label="Delivery Slots"
										placeholder="Add slot (e.g. 12-3pm)"
										error={Boolean((errors as any)?.delivery_slots)}
										helperText={(errors as any)?.delivery_slots?.message as string}
									/>
								)}
								disabled={!deliveryEnabled}
							/>
						)}
					/>

					<Controller
						name="delivery_radius"
						control={control}
						render={({ field }) => (
							<TextField
								{...field}
								label="Delivery Radius (km)"
								fullWidth
								variant="outlined"
								type="number"
								inputProps={{ min: 0, step: 0.1 }}
								disabled={!deliveryEnabled}
								error={!!errors.delivery_radius}
								helperText={errors?.delivery_radius?.message as string}
								value={field.value ?? ''}
							/>
						)}
					/>
				</Box>
			</Paper>
		</Box>
	);
}

export default StoreContactTab;

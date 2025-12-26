import { Controller, useFormContext } from 'react-hook-form';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';

/**
 * Contact info and toggle options (pickup/delivery).
 */
function StoreContactTab() {
	const { control, formState, watch } = useFormContext();
	const { errors } = formState;

	return (
		<div className="grid gap-4">
			{/* Contact Email */}
			<Controller
				name="contact_email"
				control={control}
				render={({ field }) => (
					<TextField {...field} label="Contact Email" fullWidth variant="outlined"
						error={!!errors.contact_email}
						helperText={errors?.contact_email?.message as string} />
				)}
			/>

			{/* Contact Phone */}
			<Controller
				name="contact_phone"
				control={control}
				render={({ field }) => (
					<TextField {...field} label="Contact Phone" fullWidth variant="outlined"
						error={!!errors.contact_phone}
						helperText={errors?.contact_phone?.message as string} />
				)}
			/>

			{/* Active Status */}
			<Controller
				name="active"
				control={control}
				render={({ field }) => (
					<FormControlLabel control={<Switch {...field} checked={field.value} />} label="Store Active" />
				)}
			/>

			{/* Offers Pickup */}
			<Controller
				name="offers_pickup"
				control={control}
				render={({ field }) => (
					<FormControlLabel control={<Switch {...field} checked={field.value} />} label="Offers Pickup" />
				)}
			/>

			{/* Offers Delivery */}
			<Controller
				name="offers_delivery"
				control={control}
				render={({ field }) => (
					<FormControlLabel control={<Switch {...field} checked={field.value} />} label="Offers Delivery" />
				)}
			/>
		</div>
	);
}

export default StoreContactTab;

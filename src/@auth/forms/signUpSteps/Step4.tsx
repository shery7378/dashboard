import { Controller, Control, FieldErrors, UseFormSetValue } from 'react-hook-form';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { FormType } from '../AuthJsCredentialsSignUpForm';
import { useEffect, useRef, useState } from 'react';

declare global {
	interface Window {
		google: any;
	}
}

interface Step4Props {
    control: Control<FormType>;
    errors: FieldErrors<FormType>;
	setValue: UseFormSetValue<FormType>;
    handleNextStep: () => void;
    handleBackStep: () => void;
}

export default function Step4({
    control,
    errors,
	setValue,
    handleNextStep,
    handleBackStep,
}: Step4Props) {
	const addressInputRef = useRef<HTMLInputElement | null>(null);
	const [mapsLoaded, setMapsLoaded] = useState(false);
	const [apiKey, setApiKey] = useState<string>('');

	useEffect(() => {
		const fetchApiKey = async () => {
			try {
				const envKey = process.env.NEXT_PUBLIC_MAP_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
				const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
				const response = await fetch(`${apiUrl}/api/google-maps-api-key`, {
					headers: { Accept: 'application/json' }
				});
				if (response.ok) {
					const data = await response.json();
					const fetchedKey = data?.data?.google_maps_api_key || '';
					if (fetchedKey) {
						console.log('[Step4] Using API key from backend');
						setApiKey(fetchedKey);
						return;
					}
				}
				console.log('[Step4] Backend key not found, using env fallback');
				setApiKey(envKey);
			} catch (err) {
				console.warn('[Step4] Failed to fetch API key, using env fallback:', err);
				setApiKey(process.env.NEXT_PUBLIC_MAP_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '');
			}
		};
		fetchApiKey();
	}, []);

	useEffect(() => {
		if (typeof window === 'undefined') return;
		if (window.google?.maps?.places) {
			setMapsLoaded(true);
			return;
		}
		if (!apiKey || mapsLoaded) return;

		const script = document.createElement('script');
		script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
		script.async = true;
		script.defer = true;
		script.onload = () => {
			console.log('[Step4] Google Maps script loaded');
			setMapsLoaded(true);
		};
		script.onerror = () => {
			console.error('[Step4] Failed to load Google Maps script');
		};
		document.head.appendChild(script);

		return () => {
			if (document.head.contains(script)) {
				document.head.removeChild(script);
			}
		};
	}, [apiKey, mapsLoaded]);

	useEffect(() => {
		if (!mapsLoaded) {
			console.log('[Step4] Maps not loaded yet');
			return;
		}
		if (!addressInputRef.current) {
			console.log('[Step4] addressInputRef not ready');
			return;
		}
		if (!window.google?.maps?.places) {
			console.error('[Step4] window.google.maps.places not available');
			return;
		}

		console.log('[Step4] Initializing Places Autocomplete');
		const autocomplete = new window.google.maps.places.Autocomplete(addressInputRef.current, {
			types: ['address'],
			fields: ['address_components', 'formatted_address', 'geometry']
		});

		autocomplete.addListener('place_changed', () => {
			console.log('[Step4] place_changed triggered');
			const place = autocomplete.getPlace();
			const components = place?.address_components || [];
			const formattedAddress = place?.formatted_address || '';
			const geometry = place?.geometry;

			let city = '';
			let postalCode = '';
			let street = '';
			let route = '';

			for (const c of components) {
				const types: string[] = c.types || [];
				if (types.includes('street_number')) street = c.long_name;
				if (types.includes('route')) route = c.long_name;
				if (types.includes('locality')) city = c.long_name;
				if (types.includes('postal_town') && !city) city = c.long_name;
				if (types.includes('administrative_area_level_2') && !city) city = c.long_name;
				if (types.includes('postal_code')) postalCode = c.long_name;
			}

			const addressLine = street || route ? `${street}${street && route ? ' ' : ''}${route}`.trim() : (formattedAddress.split(',')[0]?.trim() || '');
			
			// Extract latitude and longitude from geometry
			let latitude = null;
			let longitude = null;
			if (geometry && geometry.location) {
				latitude = geometry.location.lat();
				longitude = geometry.location.lng();
				console.log('[Step4] Extracted coordinates:', { latitude, longitude });
			}

			console.log('[Step4] Setting form fields:', { addressLine, city, postalCode, latitude, longitude });
			setValue('address', addressLine, { shouldValidate: true, shouldDirty: true });
			if (city) setValue('city', city, { shouldValidate: true, shouldDirty: true });
			if (postalCode) setValue('zipCode', postalCode, { shouldValidate: true, shouldDirty: true });
			if (latitude !== null && longitude !== null) {
				setValue('latitude', latitude, { shouldValidate: false, shouldDirty: true });
				setValue('longitude', longitude, { shouldValidate: false, shouldDirty: true });
			}
		});
	}, [mapsLoaded, setValue]);

	// Retry mechanism: if input appears after mapsLoaded, reinitialize
	useEffect(() => {
		if (!mapsLoaded) return;
		if (!window.google?.maps?.places) return;
		if (!addressInputRef.current) return;

		const interval = setInterval(() => {
			if (addressInputRef.current && !addressInputRef.current.hasAttribute('data-autocomplete-attached')) {
				console.log('[Step4] Retrying autocomplete attachment');
				const autocomplete = new window.google.maps.places.Autocomplete(addressInputRef.current, {
					types: ['address'],
					fields: ['address_components', 'formatted_address', 'geometry']
				});
				autocomplete.addListener('place_changed', () => {
					console.log('[Step4] place_changed (retry) triggered');
					const place = autocomplete.getPlace();
					const components = place?.address_components || [];
					const formattedAddress = place?.formatted_address || '';
					const geometry = place?.geometry;

					let city = '';
					let postalCode = '';
					let street = '';
					let route = '';

					for (const c of components) {
						const types: string[] = c.types || [];
						if (types.includes('street_number')) street = c.long_name;
						if (types.includes('route')) route = c.long_name;
						if (types.includes('locality')) city = c.long_name;
						if (types.includes('postal_town') && !city) city = c.long_name;
						if (types.includes('administrative_area_level_2') && !city) city = c.long_name;
						if (types.includes('postal_code')) postalCode = c.long_name;
					}

					const addressLine = street || route ? `${street}${street && route ? ' ' : ''}${route}`.trim() : (formattedAddress.split(',')[0]?.trim() || '');
					
					// Extract latitude and longitude from geometry
					let latitude = null;
					let longitude = null;
					if (geometry && geometry.location) {
						latitude = geometry.location.lat();
						longitude = geometry.location.lng();
						console.log('[Step4] Extracted coordinates (retry):', { latitude, longitude });
					}

					console.log('[Step4] Setting form fields (retry):', { addressLine, city, postalCode, latitude, longitude });
					setValue('address', addressLine, { shouldValidate: true, shouldDirty: true });
					if (city) setValue('city', city, { shouldValidate: true, shouldDirty: true });
					if (postalCode) setValue('zipCode', postalCode, { shouldValidate: true, shouldDirty: true });
					if (latitude !== null && longitude !== null) {
						setValue('latitude', latitude, { shouldValidate: false, shouldDirty: true });
						setValue('longitude', longitude, { shouldValidate: false, shouldDirty: true });
					}
				});
				addressInputRef.current.setAttribute('data-autocomplete-attached', 'true');
				clearInterval(interval);
			}
		}, 500);

		return () => clearInterval(interval);
	}, [mapsLoaded, setValue]);

    return (
        <>
            <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                    <TextField
                        {...field}
                        className="mb-6"
                        label="Phone Number"
                        type="tel"
                        error={!!errors.phone}
                        helperText={errors?.phone?.message}
                        variant="outlined"
                        required
                        fullWidth
                        autoFocus
                    />
                )}
            />

            <Controller
                name="city"
                control={control}
                render={({ field }) => (
                    <TextField
                        {...field}
                        className="mb-6"
                        label="City"
                        type="text"
                        error={!!errors.city}
                        helperText={errors?.city?.message}
                        variant="outlined"
                        required
                        fullWidth
                    />
                )}
            />

			<Controller
				name="zipCode"
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						className="mb-6"
						label="Zip Code"
						type="text"
						error={!!(errors as any).zipCode}
						helperText={(errors as any)?.zipCode?.message}
						variant="outlined"
						required
						fullWidth
					/>
				)}
			/>

            <Controller
                name="address"
                control={control}
                render={({ field }) => (
                    <TextField
                        {...field}
                        inputRef={(el) => {
							addressInputRef.current = el;
							if (typeof field.ref === 'function') {
								field.ref(el);
							}
						}}
                        className="mb-6"
                        label="Address"
                        type="text"
                        error={!!errors.address}
                        helperText={errors?.address?.message}
                        variant="outlined"
                        required
                        fullWidth
                    />
                )}
            />

            <div className="flex flex-col space-y-4">
                <Button
                    variant="outlined"
                    className="w-full font-bold"
                    onClick={handleBackStep}
                    startIcon={<FuseSvgIcon>heroicons-outline:arrow-left</FuseSvgIcon>}
                    sx={{
                        borderColor: '#ff6b35',
                        color: '#ff6b35',
                        fontWeight: 600,
                        py: 1.5,
                        borderRadius: 2,
                        textTransform: 'none',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                            borderColor: '#ff8555',
                            backgroundColor: 'rgba(255, 107, 53, 0.08)',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 12px rgba(255, 107, 53, 0.3)',
                        },
                        '&:active': {
                            transform: 'translateY(0)',
                        },
                    }}
                >
                    Back
                </Button>
                <Button
                    variant="contained"
                    color="secondary"
                    className="w-full font-bold"
                    onClick={handleNextStep}
					disabled={!!errors.phone || !!errors.city || !!(errors as any).zipCode || !!errors.address}
                >
                    Next
                </Button>
            </div>
        </>
    );
}
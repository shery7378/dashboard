import { Controller, Control, FieldErrors, UseFormSetValue } from 'react-hook-form';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { FormType } from '../AuthJsCredentialsSignUpForm';
import { useEffect, useRef, useState } from 'react';
import { AuthTitle, AuthInput, AuthButton } from '@/components/auth';

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

			// Extract address components
			for (const c of components) {
				const types: string[] = c.types || [];
				if (types.includes('street_number')) street = c.long_name;
				if (types.includes('route')) route = c.long_name;
				if (types.includes('locality')) city = c.long_name;
				if (types.includes('postal_town') && !city) city = c.long_name;
				if (types.includes('administrative_area_level_2') && !city) city = c.long_name;
				
				// Try multiple ways to get postal code
				if (!postalCode) {
					if (types.includes('postal_code')) {
						postalCode = c.long_name || c.short_name || '';
					} else if (types.includes('postal_code_prefix')) {
						postalCode = c.long_name || c.short_name || '';
					}
				}
			}

			// Fallback: Try to extract postal code from formatted address using regex
			if (!postalCode && formattedAddress) {
				// Common patterns: UK (SW1A 1AA), US (12345 or 12345-6789), Canada (A1A 1A1), etc.
				const postalCodePatterns = [
					/\b([A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2})\b/i, // UK format
					/\b(\d{5}(?:-\d{4})?)\b/, // US format
					/\b([A-Z]\d[A-Z]\s?\d[A-Z]\d)\b/i, // Canadian format
					/\b(\d{4,6})\b/, // Generic numeric (4-6 digits)
					/\b([A-Z]{1,2}\d{1,4})\b/i, // Generic alphanumeric
				];

				for (const pattern of postalCodePatterns) {
					const match = formattedAddress.match(pattern);
					if (match && match[1]) {
						postalCode = match[1].trim();
						console.log('[Step4] Extracted postal code from formatted address:', postalCode);
						break;
					}
				}
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

			// If postal code is still missing but we have coordinates, try reverse geocoding
			if (!postalCode && latitude !== null && longitude !== null && window.google?.maps && typeof window.google.maps.Geocoder === 'function') {
				const geocoder = new window.google.maps.Geocoder();
				geocoder.geocode({ location: { lat: latitude, lng: longitude } }, (results: any[], status: string) => {
					if (status === 'OK' && results && results.length > 0) {
						let foundPostalCode = '';
						for (const result of results) {
							const resultComponents = result.address_components || [];
							for (const c of resultComponents) {
								const types: string[] = c.types || [];
								if (types.includes('postal_code')) {
									const pc = c.long_name || c.short_name || '';
									if (pc) {
										foundPostalCode = pc;
										break;
									}
								}
							}
							if (foundPostalCode) break;
						}

						if (foundPostalCode) {
							console.log('[Step4] Found postal code via reverse geocoding:', foundPostalCode);
							setValue('zipCode', foundPostalCode, { shouldValidate: true, shouldDirty: true });
						}
					}
				});
			}

			console.log('[Step4] Setting form fields:', { addressLine, city, postalCode, latitude, longitude });
			setValue('address', addressLine, { shouldValidate: true, shouldDirty: true });
			if (city) setValue('city', city, { shouldValidate: true, shouldDirty: true });
			if (postalCode) {
				setValue('zipCode', postalCode, { shouldValidate: true, shouldDirty: true });
			} else {
				console.warn('[Step4] Postal code not found in address components or formatted address');
			}
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

					// Extract address components
					for (const c of components) {
						const types: string[] = c.types || [];
						if (types.includes('street_number')) street = c.long_name;
						if (types.includes('route')) route = c.long_name;
						if (types.includes('locality')) city = c.long_name;
						if (types.includes('postal_town') && !city) city = c.long_name;
						if (types.includes('administrative_area_level_2') && !city) city = c.long_name;
						
						// Try multiple ways to get postal code
						if (!postalCode) {
							if (types.includes('postal_code')) {
								postalCode = c.long_name || c.short_name || '';
							} else if (types.includes('postal_code_prefix')) {
								postalCode = c.long_name || c.short_name || '';
							}
						}
					}

					// Fallback: Try to extract postal code from formatted address using regex
					if (!postalCode && formattedAddress) {
						// Common patterns: UK (SW1A 1AA), US (12345 or 12345-6789), Canada (A1A 1A1), etc.
						const postalCodePatterns = [
							/\b([A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2})\b/i, // UK format
							/\b(\d{5}(?:-\d{4})?)\b/, // US format
							/\b([A-Z]\d[A-Z]\s?\d[A-Z]\d)\b/i, // Canadian format
							/\b(\d{4,6})\b/, // Generic numeric (4-6 digits)
							/\b([A-Z]{1,2}\d{1,4})\b/i, // Generic alphanumeric
						];

						for (const pattern of postalCodePatterns) {
							const match = formattedAddress.match(pattern);
							if (match && match[1]) {
								postalCode = match[1].trim();
								console.log('[Step4] Extracted postal code from formatted address (retry):', postalCode);
								break;
							}
						}
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

					// If postal code is still missing but we have coordinates, try reverse geocoding
					if (!postalCode && latitude !== null && longitude !== null && window.google?.maps && typeof window.google.maps.Geocoder === 'function') {
						const geocoder = new window.google.maps.Geocoder();
						geocoder.geocode({ location: { lat: latitude, lng: longitude } }, (results: any[], status: string) => {
							if (status === 'OK' && results && results.length > 0) {
								let foundPostalCode = '';
								for (const result of results) {
									const resultComponents = result.address_components || [];
									for (const c of resultComponents) {
										const types: string[] = c.types || [];
										if (types.includes('postal_code')) {
											const pc = c.long_name || c.short_name || '';
											if (pc) {
												foundPostalCode = pc;
												break;
											}
										}
									}
									if (foundPostalCode) break;
								}

								if (foundPostalCode) {
									console.log('[Step4] Found postal code via reverse geocoding (retry):', foundPostalCode);
									setValue('zipCode', foundPostalCode, { shouldValidate: true, shouldDirty: true });
								}
							}
						});
					}

					console.log('[Step4] Setting form fields (retry):', { addressLine, city, postalCode, latitude, longitude });
					setValue('address', addressLine, { shouldValidate: true, shouldDirty: true });
					if (city) setValue('city', city, { shouldValidate: true, shouldDirty: true });
					if (postalCode) {
						setValue('zipCode', postalCode, { shouldValidate: true, shouldDirty: true });
					} else {
						console.warn('[Step4] Postal code not found in address components or formatted address (retry)');
					}
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

    const BRAND_COLOR = "text-red-600";
    const BG_BRAND = "bg-red-600";
    const BORDER_BRAND = "border-red-600";



    return (
        <div className="w-full px-2 sm:px-4">
             {/* Header: Back Button & Logo */}
             <div className="relative flex items-center justify-center mb-8 mt-2">
                <button 
                    onClick={handleBackStep}
                    className="absolute left-0 p-2 rounded-full border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-colors group"
                    aria-label="Go back"
                    type="button"
                >
                    <ArrowBackIcon className="h-5 w-5 text-gray-400 group-hover:text-gray-600" />
                </button>
                <h1 className={`text-2xl font-bold ${BRAND_COLOR}`}>MultiKonnect</h1>
            </div>

            {/* Stepper */}
            <div className="flex items-center justify-center gap-2 mb-8">
                 {/* Step 1: Filled */}
                <div className={`h-8 w-8 rounded-full ${BG_BRAND} text-white flex items-center justify-center text-sm font-medium shadow-sm`}>1</div>
                <div className="h-0.5 w-8 border-t-2 border-dashed border-gray-300"></div>
                
                 {/* Step 2: Filled */}
                <div className={`h-8 w-8 rounded-full ${BG_BRAND} text-white flex items-center justify-center text-sm font-medium shadow-sm`}>2</div>
                <div className="h-0.5 w-8 border-t-2 border-dashed border-gray-300"></div>
                
                 {/* Step 3: Filled */}
                <div className={`h-8 w-8 rounded-full ${BG_BRAND} text-white flex items-center justify-center text-sm font-medium shadow-sm`}>3</div>
                <div className="h-0.5 w-8 border-t-2 border-dashed border-gray-300"></div>
                
                 {/* Step 4: Outlined (Active) */}
                <div className={`h-8 w-8 rounded-full border-2 ${BORDER_BRAND} flex items-center justify-center bg-white`}></div>
            </div>

            {/* Title */}
            <AuthTitle
                heading="Setup Your Store Location"
                align="center"
            />

             {/* Form Fields */}
             <div className="space-y-4 mb-6">
                <Controller
                    name="phone"
                    control={control}
                    render={({ field }) => (
                        <AuthInput
                            {...field}
                            label="Phone Number"
                            type="tel"
                            placeholder="Your phone number"
                            error={errors.phone?.message}
                        />
                    )}
                />
                <Controller
                    name="city"
                    control={control}
                    render={({ field }) => (
                        <AuthInput
                            {...field}
                            label="City"
                            type="text"
                            placeholder="Your city"
                            error={errors.city?.message}
                        />
                    )}
                />
                <Controller
                    name="zipCode"
                    control={control}
                    render={({ field }) => (
                        <AuthInput
                            {...field}
                            label="Zip Code"
                            type="text"
                            placeholder="Your zip code"
                            error={(errors as any).zipCode?.message}
                        />
                    )}
                />
                <Controller
                    name="address"
                    control={control}
                    render={({ field }) => (
                        <AuthInput
                            {...field}
                            ref={(el) => {
                                addressInputRef.current = el;
                                field.ref(el);
                            }}
                            label="Address"
                            type="text"
                            placeholder="Start typing your address"
                            error={errors.address?.message}
                        />
                    )}
                />
            </div>

             {/* Continue Button */}
             <AuthButton
                variant="primary"
                fullWidth
                onClick={handleNextStep}
                disabled={!!errors.phone || !!errors.city || !!(errors as any).zipCode || !!errors.address}
                className="h-12 py-3"
            >
                Continue
            </AuthButton>


        </div>
    );
}
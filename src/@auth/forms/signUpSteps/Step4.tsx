import { Controller, Control, FieldErrors, UseFormSetValue } from 'react-hook-form';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
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
            <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Setup Your Store Name Here</h2>
            </div>

             {/* Form Fields */}
             <div className="space-y-4 mb-6">
                {/* Phone */}
                <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">Phone Number</label>
                    <Controller
                        name="phone"
                        control={control}
                        render={({ field }) => (
                            <input
                                {...field}
                                type="tel"
                                placeholder="Your name" // Placeholder from image
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-lg focus:ring-0 focus:border-gray-200 outline-none transition-colors text-gray-800 placeholder-gray-400"
                            />
                        )}
                    />
                    {errors.phone && <p className="mt-1 text-xs text-red-500 ml-1">{errors.phone.message}</p>}
                </div>

                {/* City */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">City</label>
                    <Controller
                        name="city"
                        control={control}
                        render={({ field }) => (
                            <input
                                {...field}
                                type="text"
                                placeholder="Your name"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-lg focus:ring-0 focus:border-gray-200 outline-none transition-colors text-gray-800 placeholder-gray-400"
                            />
                        )}
                    />
                    {errors.city && <p className="mt-1 text-xs text-red-500 ml-1">{errors.city.message}</p>}
                </div>

                {/* Zip Code */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">Zip Code</label>
                    <Controller
                        name="zipCode"
                        control={control}
                        render={({ field }) => (
                            <input
                                {...field}
                                type="text"
                                placeholder="Your name"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-lg focus:ring-0 focus:border-gray-200 outline-none transition-colors text-gray-800 placeholder-gray-400"
                            />
                        )}
                    />
                    {(errors as any).zipCode && <p className="mt-1 text-xs text-red-500 ml-1">{(errors as any).zipCode.message}</p>}
                </div>

                 {/* Address */}
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">Address</label>
                    <Controller
                        name="address"
                        control={control}
                        render={({ field }) => (
                            <input
                                {...field}
                                ref={(el) => {
                                    addressInputRef.current = el;
                                    field.ref(el);
                                }}
                                type="text"
                                placeholder="Your name"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-lg focus:ring-0 focus:border-gray-200 outline-none transition-colors text-gray-800 placeholder-gray-400"
                            />
                        )}
                    />
                     {errors.address && <p className="mt-1 text-xs text-red-500 ml-1">{errors.address.message}</p>}
                </div>
            </div>

             {/* Continue Button */}
             <Button
                className={`w-full py-3 font-semibold rounded-lg normal-case shadow-none text-white bg-[#FF4500] hover:bg-[#FF3000]`}
                onClick={handleNextStep}
                disabled={!!errors.phone || !!errors.city || !!(errors as any).zipCode || !!errors.address}
                variant="contained"
                disableElevation
                 sx={{
                    bgcolor: '#EF4444', 
                    '&:hover': { bgcolor: '#DC2626' },
                    textTransform: 'none',
                    fontSize: '1rem',
                    py: 1.5
                }}
            >
                Continue
            </Button>


        </div>
    );
}
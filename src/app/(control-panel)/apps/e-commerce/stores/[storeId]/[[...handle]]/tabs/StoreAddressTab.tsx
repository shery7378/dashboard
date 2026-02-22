//src/app/(control-panel)/apps/e-commerce/stores/[storeId]/[[...handle]]/tabs/StoreAddressTab.tsx
'use client';

import TextField from '@mui/material/TextField';
import { Controller, useFormContext } from 'react-hook-form';
import { GoogleMap, Marker, useJsApiLoader, InfoWindow, Autocomplete } from '@react-google-maps/api';
import { useState, useCallback, useEffect, useMemo, useRef } from 'react';

/**
 * Type definition for map position (latitude + longitude)
 */
interface Position {
	lat: number;
	lng: number;
}

/**
 * Default map container style
 */
const containerStyle = {
	width: '100%',
	height: '400px'
};

/**
 * Fallback position (Karachi) used when:
 * - Geolocation is not available
 * - User denies location access
 * - No initial data exists
 */
const FALLBACK_POSITION: Position = { lat: 24.8607, lng: 67.0011 };

function StoreAddressTab() {
	// React Hook Form helpers
	const { control, setValue, watch, getValues } = useFormContext();

	// Local state
	const [position, setPosition] = useState<Position>(FALLBACK_POSITION); // Current marker/map position
	const [errorMessage, setErrorMessage] = useState<string>(''); // Error messages for UI
	const [infoWindowOpen, setInfoWindowOpen] = useState<boolean>(false); // InfoWindow toggle
	const [locationDetails, setLocationDetails] = useState<string>(''); // Displayed location details
	const initDoneRef = useRef(false); // Prevent duplicate initialization

	// Autocomplete refs
	const countryAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
	const cityAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
	const addressAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

	// Watch form values
	const latitude = watch('latitude');
	const longitude = watch('longitude');
	const address = watch('address');
	const zipCode = watch('zip_code');
	const city = watch('city');
	const country = watch('country');

	// Load Google Maps script with Places library
	// Use unique ID to avoid conflicts with other loaders
	const { isLoaded, loadError } = useJsApiLoader({
		id: 'google-map-script-store-address',
		googleMapsApiKey: process.env.NEXT_PUBLIC_MAP_KEY as string,
		libraries: ['places']
	});

	// Create geocoder instance when Google Maps is loaded
	const geocoder = useMemo(() => (isLoaded ? new google.maps.Geocoder() : null), [isLoaded]);

	/**
	 * Reverse Geocoding:
	 * Convert lat/lng position → Address fields (address, zip, city, country)
	 * Called when:
	 * - Marker is dragged
	 * - User clicks on the map
	 * - Fallback or geolocation position is set
	 */
	const reverseGeocode = useCallback(
		(pos: Position) => {
			if (!geocoder) return;

			geocoder.geocode({ location: pos }, (results, status) => {
				if (status === 'OK' && results?.length > 0) {
					// Try to find a result that has proper address components (not Plus Code)
					let bestResult = results[0];
					for (const result of results) {
						const components = result.address_components || [];
						const formatted = result.formatted_address || '';
						// Check if this result has street-level information (not just a Plus Code)
						const hasStreetInfo = components.some(
							(c) =>
								c.types.includes('street_number') ||
								c.types.includes('route') ||
								c.types.includes('sublocality') ||
								c.types.includes('neighborhood')
						);
						// Avoid Plus Code format (e.g., J4RH+VM8)
						const isPlusCode = formatted.match(/^[A-Z0-9]{6}\+[A-Z0-9]{2,3}/);

						if (hasStreetInfo && !isPlusCode) {
							bestResult = result;
							break;
						}
					}

					const components = bestResult.address_components || [];
					const formatted = bestResult.formatted_address || '';

					// Extract structured address parts in order: house number, street, area/neighborhood
					const streetNumber = components.find((c) => c.types.includes('street_number'))?.long_name || '';
					const route = components.find((c) => c.types.includes('route'))?.long_name || '';

					// Extract area/neighborhood name
					const area =
						components.find((c) => c.types.includes('sublocality'))?.long_name ||
						components.find((c) => c.types.includes('sublocality_level_1'))?.long_name ||
						components.find((c) => c.types.includes('neighborhood'))?.long_name ||
						components.find((c) => c.types.includes('premise'))?.long_name ||
						'';

					// Build address in format: "House Street, Area" or "Street, Area" or "Area"
					let newAddress = '';

					if (streetNumber && route) {
						newAddress = `${streetNumber} ${route}`.trim();

						if (area) {
							newAddress = `${newAddress}, ${area}`;
						}
					} else if (route) {
						newAddress = route;

						if (area) {
							newAddress = `${newAddress}, ${area}`;
						}
					} else if (area) {
						newAddress = area;
					} else {
						// Fallback: use first part of formatted address if not Plus Code
						const firstPart = formatted.split(',')[0] || '';

						if (firstPart && !firstPart.match(/^[A-Z0-9]{6}\+[A-Z0-9]{2,3}/i)) {
							newAddress = firstPart;
						}
					}

					// Extract postal code - try both postal_code and postal_code_prefix
					const newZip =
						components.find((c) => c.types.includes('postal_code'))?.long_name ||
						components.find((c) => c.types.includes('postal_code_prefix'))?.long_name ||
						'';

					// Prioritize locality over administrative_area_level_1 for city
					const newCity =
						components.find((c) => c.types.includes('locality'))?.long_name ||
						components.find((c) => c.types.includes('administrative_area_level_2'))?.long_name ||
						'';
					const newCountry = components.find((c) => c.types.includes('country'))?.long_name || '';

					// Only update address if we got a valid formatted address (not Plus Code)
					if (newAddress && !newAddress.match(/^[A-Z0-9]{6}\+[A-Z0-9]{2,3}/i)) {
						setValue('address', newAddress, { shouldValidate: true, shouldDirty: true });
					}

					if (newZip) {
						setValue('zip_code', newZip, { shouldValidate: true, shouldDirty: true });
					}

					setValue('city', newCity, { shouldValidate: true, shouldDirty: true });
					setValue('country', newCountry, { shouldValidate: true, shouldDirty: true });

					// Update local state
					setLocationDetails(formatted);
					setInfoWindowOpen(true);
					setErrorMessage('');
				} else {
					setErrorMessage(`Reverse geocoding failed: ${status}.`);
					setLocationDetails('');
				}
			});
		},
		[geocoder, setValue]
	);

	/**
	 * Reverse Geocoding for City selection:
	 * Only updates postal code and country, NOT address (to prevent highways/routes from being set)
	 * Preserves the selected city name instead of overriding it
	 */
	const reverseGeocodeForCity = useCallback(
		(pos: Position, preserveCityName?: string) => {
			if (!geocoder) return;

			geocoder.geocode({ location: pos }, (results, status) => {
				if (status === 'OK' && results?.[0]) {
					const components = results[0].address_components;
					const formatted = results[0].formatted_address;

					// Only extract postal code and country, NOT address components or city
					// Try both postal_code and postal_code_prefix
					const newZip =
						components.find((c) => c.types.includes('postal_code'))?.long_name ||
						components.find((c) => c.types.includes('postal_code_prefix'))?.long_name ||
						'';
					const newCountry = components.find((c) => c.types.includes('country'))?.long_name || '';

					// Only update postal code and country - NOT address, NOT city (preserve the selected city name)
					if (newZip) setValue('zip_code', newZip, { shouldValidate: true, shouldDirty: true });

					if (newCountry) setValue('country', newCountry, { shouldValidate: true, shouldDirty: true });
					// Don't update city - use the preserved city name from the selection

					// Update local state
					setLocationDetails(formatted);
					setInfoWindowOpen(true);
					setErrorMessage('');
				} else {
					setErrorMessage(`Reverse geocoding failed: ${status}.`);
					setLocationDetails('');
				}
			});
		},
		[geocoder, setValue]
	);

	/**
	 * Forward Geocoding:
	 * Convert address fields → lat/lng
	 * Called when:
	 * - User types address, zip, city, or country
	 * - Form blur on these fields
	 * - Initialization when saved address exists
	 */
	const geocodeAddress = useCallback(() => {
		if (!geocoder) {
			setErrorMessage('Google Maps API not loaded for geocoding.');
			return;
		}

		const { address, zip_code, city, country } = getValues();
		const fullAddress = [address, zip_code, city, country].filter(Boolean).join(', ');

		if (!fullAddress) return;

		geocoder.geocode({ address: fullAddress }, (results, status) => {
			if (status === 'OK' && results?.[0]) {
				const loc = results[0].geometry.location;
				const newLat = loc.lat();
				const newLng = loc.lng();
				const pos = { lat: newLat, lng: newLng };

				// Update position + form values
				setPosition(pos);
				setValue('latitude', newLat, { shouldValidate: true });
				setValue('longitude', newLng, { shouldValidate: true });
				setLocationDetails(results[0].formatted_address);
				setInfoWindowOpen(true);
				setErrorMessage('');

				// Ensure other fields also sync from Google
				reverseGeocode(pos);
			} else {
				setErrorMessage(`Geocoding failed: ${status}. Please check the address.`);
			}
		});
	}, [geocoder, getValues, setValue, reverseGeocode]);

	/**
	 * Initialization:
	 * - Use saved lat/lng if available
	 * - Otherwise geocode saved address
	 * - Otherwise try browser geolocation
	 * - Otherwise fallback to Karachi
	 */
	useEffect(() => {
		if (!isLoaded || initDoneRef.current) return;

		initDoneRef.current = true;

		const {
			latitude: latValRaw,
			longitude: lngValRaw,
			address: addrVal,
			zip_code: zipVal,
			city: cityVal,
			country: countryVal
		} = getValues();

		const latVal = Number(latValRaw);
		const lngVal = Number(lngValRaw);

		// Case 1: Existing lat/lng
		if (!isNaN(latVal) && !isNaN(lngVal) && latValRaw && lngValRaw) {
			const pos = { lat: latVal, lng: lngVal };
			setPosition(pos);

			if (!addrVal && !zipVal && !cityVal && !countryVal) {
				reverseGeocode(pos);
			}

			return;
		}

		// Case 2: Existing textual address
		if (zipVal || addrVal || cityVal || countryVal) {
			geocodeAddress();
			return;
		}

		// Case 3: HTTPS restriction (Geolocation requires HTTPS, except localhost)
		if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
			setErrorMessage('Geolocation requires HTTPS. Using fallback location.');
			setPosition(FALLBACK_POSITION);
			setValue('latitude', FALLBACK_POSITION.lat, { shouldValidate: true });
			setValue('longitude', FALLBACK_POSITION.lng, { shouldValidate: true });
			reverseGeocode(FALLBACK_POSITION);
			return;
		}

		// Case 4: Browser doesn’t support geolocation
		if (!navigator.geolocation) {
			setErrorMessage('Geolocation not supported. Using fallback location.');
			setPosition(FALLBACK_POSITION);
			setValue('latitude', FALLBACK_POSITION.lat, { shouldValidate: true });
			setValue('longitude', FALLBACK_POSITION.lng, { shouldValidate: true });
			reverseGeocode(FALLBACK_POSITION);
			return;
		}

		// Case 5: Ask browser for geolocation
		navigator.permissions
			?.query({ name: 'geolocation' as PermissionName })
			.then((perm) => {
				if (perm.state === 'denied') {
					// Permission denied → fallback
					setErrorMessage('Location access denied. Using fallback location.');
					setPosition(FALLBACK_POSITION);
					setValue('latitude', FALLBACK_POSITION.lat, { shouldValidate: true });
					setValue('longitude', FALLBACK_POSITION.lng, { shouldValidate: true });
					reverseGeocode(FALLBACK_POSITION);
				} else {
					// Try to get user’s actual position
					navigator.geolocation.getCurrentPosition(
						(pos) => {
							const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
							setPosition(newPos);
							setValue('latitude', newPos.lat, { shouldValidate: true });
							setValue('longitude', newPos.lng, { shouldValidate: true });
							setErrorMessage('');
							reverseGeocode(newPos);
						},
						() => {
							// Error → fallback
							setErrorMessage('Unable to get your location. Using fallback.');
							setPosition(FALLBACK_POSITION);
							setValue('latitude', FALLBACK_POSITION.lat, { shouldValidate: true });
							setValue('longitude', FALLBACK_POSITION.lng, { shouldValidate: true });
							reverseGeocode(FALLBACK_POSITION);
						},
						{ timeout: 10000 }
					);
				}
			})
			.catch(() => {
				// Permission API not supported → fallback
				setErrorMessage('Cannot verify permissions. Using fallback location.');
				setPosition(FALLBACK_POSITION);
				setValue('latitude', FALLBACK_POSITION.lat, { shouldValidate: true });
				setValue('longitude', FALLBACK_POSITION.lng, { shouldValidate: true });
				reverseGeocode(FALLBACK_POSITION);
			});
	}, [isLoaded, geocodeAddress, reverseGeocode, getValues, setValue]);

	/**
	 * Auto-update marker when user edits address or postal code fields
	 * Debounced to avoid excessive API calls
	 */
	useEffect(() => {
		if (!isLoaded) return;

		// Trigger geocoding when address or postal code changes
		if (address || zipCode) {
			const timeout = setTimeout(() => {
				geocodeAddress();
			}, 800); // debounce 800ms
			return () => clearTimeout(timeout);
		}
	}, [address, zipCode, isLoaded, geocodeAddress]);

	/**
	 * Map click handler:
	 * - Moves marker
	 * - Updates lat/lng
	 * - Reverse geocodes new position
	 */
	const handleMapClick = useCallback(
		(event: google.maps.MapMouseEvent) => {
			if (!event.latLng) return;

			const newPos = { lat: event.latLng.lat(), lng: event.latLng.lng() };
			setPosition(newPos);
			setValue('latitude', newPos.lat, { shouldValidate: true });
			setValue('longitude', newPos.lng, { shouldValidate: true });
			reverseGeocode(newPos);
			setInfoWindowOpen(true);
		},
		[setValue, reverseGeocode]
	);

	/**
	 * Handle place selection from Autocomplete
	 * Extracts address components and updates form fields
	 */
	const handlePlaceSelect = useCallback(
		(place: google.maps.places.PlaceResult, fieldName: string) => {
			if (!place) return;

			const components = place.address_components || [];
			const geometry = place.geometry;

			// Extract components
			const streetNumber = components.find((c) => c.types.includes('street_number'))?.long_name || '';
			const route = components.find((c) => c.types.includes('route'))?.long_name || '';
			// Try both postal_code and postal_code_prefix for better postal code extraction
			const postalCode =
				components.find((c) => c.types.includes('postal_code'))?.long_name ||
				components.find((c) => c.types.includes('postal_code_prefix'))?.long_name ||
				'';
			const cityName =
				components.find((c) => c.types.includes('locality'))?.long_name ||
				components.find((c) => c.types.includes('administrative_area_level_2'))?.long_name ||
				components.find((c) => c.types.includes('administrative_area_level_1'))?.long_name ||
				'';
			const countryName = components.find((c) => c.types.includes('country'))?.long_name || '';
			const formattedAddress = place.formatted_address || '';

			// Handle based on field type
			if (fieldName === 'address') {
				// Extract area/neighborhood/sublocality for complete address
				const area =
					components.find((c) => c.types.includes('sublocality'))?.long_name ||
					components.find((c) => c.types.includes('sublocality_level_1'))?.long_name ||
					components.find((c) => c.types.includes('neighborhood'))?.long_name ||
					components.find((c) => c.types.includes('premise'))?.long_name ||
					'';

				// Strategy 1: Use place.name if it's available and looks like an address (contains street keywords or numbers)
				// This is often the most complete address format from Google Places
				let fullAddress = '';

				if (place.name && place.name.trim() && !place.name.match(/^[A-Z0-9]{6}\+[A-Z0-9]{2,3}$/i)) {
					const nameLower = place.name.toLowerCase();

					// Check if place.name looks like an address (contains street keywords, has numbers, or is longer than 10 chars)
					if (
						nameLower.includes('street') ||
						nameLower.includes('road') ||
						nameLower.includes('avenue') ||
						nameLower.includes('lane') ||
						nameLower.includes('drive') ||
						nameLower.includes('boulevard') ||
						/\d/.test(place.name) ||
						place.name.length > 10
					) {
						fullAddress = place.name.trim();
					}
				}

				// Strategy 2: If place.name didn't work, build from components
				if (!fullAddress || fullAddress.length < 5) {
					// Build complete address: "Street Number Street Name, Area" or "Street Name, Area"
					const addressParts: string[] = [];

					if (streetNumber) {
						addressParts.push(streetNumber);
					}

					if (route) {
						addressParts.push(route);
					}

					// Combine street number and route
					if (addressParts.length > 0) {
						fullAddress = addressParts.join(' ').trim();
					}

					// Add area/neighborhood if available
					if (area) {
						if (fullAddress) {
							fullAddress = `${fullAddress}, ${area}`;
						} else {
							fullAddress = area;
						}
					}

					// Strategy 3: Fallback to formatted_address if we still don't have a good address
					if (!fullAddress || fullAddress.length < 3) {
						// Take first part of formatted address (before first comma)
						const firstPart = formattedAddress.split(',')[0]?.trim() || '';

						if (firstPart && !firstPart.match(/^[A-Z0-9]{6}\+[A-Z0-9]{2,3}$/i)) {
							fullAddress = firstPart;
						}
					}
				}

				// Ensure we have a valid address before setting
				if (fullAddress && fullAddress.trim() && !fullAddress.match(/^[A-Z0-9]{6}\+[A-Z0-9]{2,3}$/i)) {
					setValue('address', fullAddress.trim(), { shouldValidate: true, shouldDirty: true });
				}

				// Auto-fill other fields from selected address
				if (postalCode) setValue('zip_code', postalCode, { shouldValidate: true, shouldDirty: true });

				if (cityName) setValue('city', cityName, { shouldValidate: true, shouldDirty: true });

				if (countryName) setValue('country', countryName, { shouldValidate: true, shouldDirty: true });

				// Update map position
				if (geometry?.location) {
					const pos = { lat: geometry.location.lat(), lng: geometry.location.lng() };
					setPosition(pos);
					setValue('latitude', pos.lat, { shouldValidate: true, shouldDirty: true });
					setValue('longitude', pos.lng, { shouldValidate: true, shouldDirty: true });
					setLocationDetails(formattedAddress);
					setInfoWindowOpen(true);
					setErrorMessage('');

					// Don't trigger reverse geocode here - we already have the address from place selection
					// Reverse geocode would overwrite our properly extracted address
				}
			} else if (fieldName === 'city') {
				// Extract city name properly - prioritize place.name first (most reliable from selection)
				// Then try locality, avoid administrative_area_level_1 (which would be "Punjab")
				const properCityName =
					place.name || // Use the selected place name first (e.g., "Islamabad")
					components.find((c) => c.types.includes('locality'))?.long_name ||
					components.find((c) => c.types.includes('administrative_area_level_2'))?.long_name ||
					'';

				// Only set city if we have a proper city name (not state/province)
				if (properCityName) {
					setValue('city', properCityName, { shouldValidate: true, shouldDirty: true });
				}

				// Extract country if available
				if (countryName) setValue('country', countryName, { shouldValidate: true, shouldDirty: true });

				// Update map if geometry available
				if (geometry?.location) {
					const pos = { lat: geometry.location.lat(), lng: geometry.location.lng() };
					setPosition(pos);
					setValue('latitude', pos.lat, { shouldValidate: true, shouldDirty: true });
					setValue('longitude', pos.lng, { shouldValidate: true, shouldDirty: true });

					// Reverse geocode but only update postal code and country, NOT city (already set correctly above)
					// and NOT address (to prevent highways/routes from being added)
					reverseGeocodeForCity(pos, properCityName); // Pass city name to preserve it
				}
			} else if (fieldName === 'country') {
				setValue('country', place.name || countryName, { shouldValidate: true, shouldDirty: true });
			}
		},
		[setValue, reverseGeocode]
	);

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
			{/* Error message UI */}
			{errorMessage && (
				<div className="col-span-1 md:col-span-2 p-2 bg-red-100 text-red-800 rounded">{errorMessage}</div>
			)}

			{/* Country Field with Autocomplete */}
			<Controller
				name="country"
				control={control}
				render={({ field }) => {
					if (!isLoaded) {
						return (
							<TextField
								{...field}
								value={field.value ?? ''}
								label="Country"
								fullWidth
								variant="outlined"
								type="text"
							/>
						);
					}

					return (
						<Autocomplete
							onLoad={(autocomplete) => {
								countryAutocompleteRef.current = autocomplete;
							}}
							onPlaceChanged={() => {
								const place = countryAutocompleteRef.current?.getPlace();

								if (place) {
									handlePlaceSelect(place, 'country');
									const countryName = place.name || place.formatted_address || '';
									field.onChange(countryName);
								}
							}}
							options={{
								types: ['(regions)'],
								fields: ['name', 'formatted_address', 'address_components', 'geometry']
							}}
						>
							<TextField
								{...field}
								value={field.value ?? ''}
								label="Country"
								fullWidth
								variant="outlined"
								type="text"
								onChange={(e) => {
									field.onChange(e.target.value);
								}}
								onBlur={() => {
									field.onBlur();

									if (field.value) {
										geocodeAddress();
									}
								}}
							/>
						</Autocomplete>
					);
				}}
			/>

			{/* City Field with Autocomplete */}
			<Controller
				name="city"
				control={control}
				render={({ field }) => {
					if (!isLoaded) {
						return (
							<TextField
								{...field}
								value={field.value ?? ''}
								label="City"
								fullWidth
								variant="outlined"
								type="text"
							/>
						);
					}

					return (
						<Autocomplete
							onLoad={(autocomplete) => {
								cityAutocompleteRef.current = autocomplete;
							}}
							onPlaceChanged={() => {
								const place = cityAutocompleteRef.current?.getPlace();

								if (place) {
									handlePlaceSelect(place, 'city');
									const cityName = place.name || place.formatted_address || '';
									field.onChange(cityName);
								}
							}}
							options={{
								types: ['(cities)'],
								fields: ['name', 'formatted_address', 'address_components', 'geometry']
							}}
						>
							<TextField
								{...field}
								value={field.value ?? ''}
								label="City"
								fullWidth
								variant="outlined"
								type="text"
								onChange={(e) => {
									field.onChange(e.target.value);
								}}
								onBlur={() => {
									field.onBlur();

									if (field.value) {
										geocodeAddress();
									}
								}}
							/>
						</Autocomplete>
					);
				}}
			/>

			{/* Postal Code Field */}
			<Controller
				name="zip_code"
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						value={field.value ?? ''}
						label="Postal Code"
						fullWidth
						variant="outlined"
						type="text"
						onBlur={() => {
							field.onBlur();

							if (field.value) {
								geocodeAddress();
							}
						}}
					/>
				)}
			/>

			{/* Address Field with Autocomplete */}
			<Controller
				name="address"
				control={control}
				render={({ field }) => {
					if (!isLoaded) {
						return (
							<TextField
								{...field}
								value={field.value ?? ''}
								label="Address"
								fullWidth
								variant="outlined"
								type="text"
								autoComplete="off"
								InputProps={{
									autoComplete: 'off'
								}}
								inputProps={{
									autoComplete: 'off'
								}}
							/>
						);
					}

					return (
						<Autocomplete
							onLoad={(autocomplete) => {
								addressAutocompleteRef.current = autocomplete;
							}}
							onPlaceChanged={() => {
								const place = addressAutocompleteRef.current?.getPlace();

								// Only update if place is actually selected (has geometry and is not just a partial match)
								if (
									place &&
									place.geometry &&
									place.geometry.location &&
									place.address_components &&
									place.address_components.length > 0
								) {
									// Extract address components directly here to set field immediately
									const components = place.address_components || [];
									const streetNumber =
										components.find((c) => c.types.includes('street_number'))?.long_name || '';
									const route = components.find((c) => c.types.includes('route'))?.long_name || '';
									const area =
										components.find((c) => c.types.includes('sublocality'))?.long_name ||
										components.find((c) => c.types.includes('sublocality_level_1'))?.long_name ||
										components.find((c) => c.types.includes('neighborhood'))?.long_name ||
										components.find((c) => c.types.includes('premise'))?.long_name ||
										'';

									// Build address - prefer place.name if it looks like a complete address
									let extractedAddress = '';

									if (
										place.name &&
										place.name.trim() &&
										!place.name.match(/^[A-Z0-9]{6}\+[A-Z0-9]{2,3}$/i)
									) {
										const nameLower = place.name.toLowerCase();

										if (
											nameLower.includes('street') ||
											nameLower.includes('road') ||
											nameLower.includes('avenue') ||
											nameLower.includes('lane') ||
											nameLower.includes('drive') ||
											/\d/.test(place.name)
										) {
											extractedAddress = place.name.trim();
										}
									}

									// If place.name didn't work, build from components
									if (!extractedAddress) {
										const parts: string[] = [];

										if (streetNumber) parts.push(streetNumber);

										if (route) parts.push(route);

										extractedAddress = parts.join(' ').trim();

										if (area) {
											extractedAddress = extractedAddress ? `${extractedAddress}, ${area}` : area;
										}
									}

									// Fallback to formatted address first part
									if (!extractedAddress) {
										extractedAddress = place.formatted_address?.split(',')[0]?.trim() || '';
									}

									// Set the address immediately if we have a valid one
									if (extractedAddress && !extractedAddress.match(/^[A-Z0-9]{6}\+[A-Z0-9]{2,3}$/i)) {
										field.onChange(extractedAddress);
									}

									// Now call handlePlaceSelect to fill other fields (city, country, postal code)
									handlePlaceSelect(place, 'address');

									// Only trigger reverse geocode if we need missing fields (postal code, city)
									setTimeout(() => {
										const currentZip = getValues('zip_code');
										const currentCity = getValues('city');

										if ((!currentZip || !currentCity) && place.geometry?.location) {
											const pos = {
												lat: place.geometry.location.lat(),
												lng: place.geometry.location.lng()
											};
											// Only update postal code and country/city, preserve address
											reverseGeocodeForCity(pos);
										}
									}, 200);
								}
							}}
							options={{
								types: ['address'],
								fields: ['geometry', 'formatted_address', 'address_components', 'name']
							}}
						>
							<TextField
								{...field}
								value={field.value ?? ''}
								label="Address"
								fullWidth
								variant="outlined"
								type="text"
								autoComplete="off"
								InputProps={{
									autoComplete: 'off'
								}}
								inputProps={{
									autoComplete: 'off'
								}}
								onChange={(e) => {
									// Allow user to type freely without interference
									field.onChange(e.target.value);
								}}
								onBlur={() => {
									field.onBlur();

									// Only geocode on blur if there's a value and it's not a Plus Code
									if (field.value && !field.value.match(/^[A-Z0-9]{6}\+[A-Z0-9]{2,3}$/i)) {
										geocodeAddress();
									}
								}}
							/>
						</Autocomplete>
					);
				}}
			/>

			{/* Latitude and Longitude Fields (Read-only) */}
			{['latitude', 'longitude'].map((fieldName) => (
				<Controller
					key={fieldName}
					name={fieldName}
					control={control}
					render={({ field }) => (
						<TextField
							{...field}
							value={field.value ?? 0}
							label={fieldName.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
							fullWidth
							variant="outlined"
							type="number"
							InputProps={{
								disabled: true
							}}
							sx={{
								backgroundColor: '#f5f5f5'
							}}
							onBlur={() => {
								field.onBlur();
								const newLat = Number(fieldName === 'latitude' ? field.value : watch('latitude'));
								const newLng = Number(fieldName === 'longitude' ? field.value : watch('longitude'));

								if (!isNaN(newLat) && !isNaN(newLng)) {
									const pos = { lat: newLat, lng: newLng };
									setPosition(pos);
									reverseGeocode(pos);
									setInfoWindowOpen(true);
								}
							}}
						/>
					)}
				/>
			))}

			{/* Google Map + Marker */}
			<div className="col-span-1 md:col-span-2">
				{isLoaded ? (
					<GoogleMap
						mapContainerStyle={containerStyle}
						center={position}
						zoom={14}
						onClick={handleMapClick}
					>
						<Marker
							position={position}
							draggable
							onDragEnd={(e) => {
								if (!e.latLng) return;

								const newPos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
								setPosition(newPos);
								setValue('latitude', newPos.lat, { shouldValidate: true });
								setValue('longitude', newPos.lng, { shouldValidate: true });
								reverseGeocode(newPos);
								setInfoWindowOpen(true);
							}}
							onClick={() => setInfoWindowOpen(true)}
						>
							{/* InfoWindow popup */}
							{infoWindowOpen && locationDetails && (
								<InfoWindow
									position={position}
									onCloseClick={() => setInfoWindowOpen(false)}
								>
									<div className="p-2 max-w-xs">
										<h3 className="font-bold">Location Details</h3>
										<p>{locationDetails}</p>
									</div>
								</InfoWindow>
							)}
						</Marker>
					</GoogleMap>
				) : loadError ? (
					<div className="p-2 bg-red-100 text-red-800 rounded">
						Failed to load Google Maps. Check your API key or connection.
					</div>
				) : (
					<div>Loading map...</div>
				)}
			</div>
		</div>
	);
}

export default StoreAddressTab;

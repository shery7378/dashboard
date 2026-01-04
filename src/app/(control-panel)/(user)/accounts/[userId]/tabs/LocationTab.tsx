'use client';

import { useEffect, useRef, useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { TextField, Box, Typography, Paper, Grid } from '@mui/material';

declare global {
    interface Window {
        google: any;
        initMap: () => void;
    }
}

function LocationTab() {
    const { control, setValue, watch, formState } = useFormContext();
    const { errors } = formState;
    const userType = watch('user_type');
    
    // Only show location tab for seller and supplier, not for customers
    if (userType === 'customer') {
        return null;
    }
    const mapRef = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<any>(null);
    const [marker, setMarker] = useState<any>(null);
    const [circle, setCircle] = useState<any>(null);
    const [mapsLoaded, setMapsLoaded] = useState(false);
    const [apiKey, setApiKey] = useState<string>('');

    const latitude = watch('latitude');
    const longitude = watch('longitude');
    const radius = watch('delivery_radius') || 10;

    // Fetch Google Maps API key from settings or environment
    useEffect(() => {
        const fetchApiKey = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
                
                // Try to fetch from public API endpoint first
                const response = await fetch(`${apiUrl}/api/google-maps-api-key`, {
                    headers: {
                        'Accept': 'application/json',
                    },
                });
                
                if (response.ok) {
                    const data = await response.json();
                    const fetchedKey = data.data?.google_maps_api_key || '';
                    if (fetchedKey) {
                        setApiKey(fetchedKey);
                        return;
                    }
                }
                
                // Fallback: Try admin endpoint if user is authenticated
                const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
                if (token) {
                    const adminResponse = await fetch(`${apiUrl}/api/admin/maps-radius-settings`, {
                        headers: {
                            'Accept': 'application/json',
                            'Authorization': `Bearer ${token}`,
                        },
                    });
                    
                    if (adminResponse.ok) {
                        const adminData = await adminResponse.json();
                        const adminKey = adminData.data?.google_maps_api_key || '';
                        if (adminKey) {
                            setApiKey(adminKey);
                            return;
                        }
                    }
                }
                
                // Final fallback to environment variable
                setApiKey(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '');
            } catch (error) {
                // Fallback to environment variable on error
                console.warn('Could not fetch Google Maps API key, using environment variable:', error);
                setApiKey(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '');
            }
        };
        fetchApiKey();
    }, []);

    // Load Google Maps script
    useEffect(() => {
        if (!apiKey || mapsLoaded) return;

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
            setMapsLoaded(true);
            initMap();
        };
        document.head.appendChild(script);

        return () => {
            // Cleanup
            if (document.head.contains(script)) {
                document.head.removeChild(script);
            }
        };
    }, [apiKey, mapsLoaded]);

    // Initialize map
    const initMap = () => {
        if (!mapRef.current || !window.google || map) return;

        const defaultLat = latitude || 51.5074; // London default
        const defaultLng = longitude || -0.1278;
        const defaultRadius = radius || 10;

        const mapInstance = new window.google.maps.Map(mapRef.current, {
            center: { lat: defaultLat, lng: defaultLng },
            zoom: 13,
            mapTypeControl: true,
            streetViewControl: true,
        });

        const markerInstance = new window.google.maps.Marker({
            position: { lat: defaultLat, lng: defaultLng },
            map: mapInstance,
            draggable: true,
            title: 'Store Location',
        });

        const circleInstance = new window.google.maps.Circle({
            strokeColor: '#FF0000',
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: '#FF0000',
            fillOpacity: 0.35,
            map: mapInstance,
            center: { lat: defaultLat, lng: defaultLng },
            radius: defaultRadius * 1000, // Convert km to meters
        });

        setMap(mapInstance);
        setMarker(markerInstance);
        setCircle(circleInstance);

        // Update location when marker is dragged
        markerInstance.addListener('dragend', () => {
            const position = markerInstance.getPosition();
            updateLocation(position.lat(), position.lng());
        });

        // Update location when map is clicked
        mapInstance.addListener('click', (event: any) => {
            markerInstance.setPosition(event.latLng);
            updateLocation(event.latLng.lat(), event.latLng.lng());
        });
    };

    // Update location and perform reverse geocoding
    const updateLocation = (lat: number, lng: number) => {
        setValue('latitude', lat, { shouldValidate: true });
        setValue('longitude', lng, { shouldValidate: true });

        if (circle) {
            circle.setCenter({ lat, lng });
        }

        // Perform reverse geocoding
        if (window.google && window.google.maps) {
            const geocoder = new window.google.maps.Geocoder();
            const latlng = { lat, lng };

            geocoder.geocode({ location: latlng }, (results: any[], status: string) => {
                if (status === 'OK' && results && results[0]) {
                    const components = results[0].address_components;
                    const formattedAddress = results[0].formatted_address;

                    let address = '';
                    let city = '';
                    let state = '';
                    let country = '';
                    let postalCode = '';

                    // First pass: collect all components
                    for (let i = 0; i < components.length; i++) {
                        const component = components[i];
                        const types = component.types;

                        if (types.includes('street_number')) {
                            address = component.long_name;
                        } else if (types.includes('route')) {
                            address += (address ? ' ' : '') + component.long_name;
                        } else if (types.includes('locality')) {
                            city = component.long_name;
                        } else if (types.includes('administrative_area_level_1')) {
                            state = component.long_name;
                        } else if (types.includes('country')) {
                            country = component.long_name;
                        } else if (types.includes('postal_code')) {
                            postalCode = component.long_name;
                        }
                    }

                    // Second pass: fallback for city if not found
                    if (!city) {
                        for (let i = 0; i < components.length; i++) {
                            const component = components[i];
                            const types = component.types;
                            
                            if (types.includes('administrative_area_level_2')) {
                                city = component.long_name;
                                break;
                            } else if (types.includes('sublocality_level_1') || types.includes('sublocality')) {
                                city = component.long_name;
                                break;
                            } else if (types.includes('postal_town')) {
                                city = component.long_name;
                                break;
                            }
                        }
                    }

                    // Fallback for address
                    if (!address && formattedAddress) {
                        address = formattedAddress.split(',')[0].trim();
                    }

                    // Final fallback for city - try to extract from formatted address
                    if (!city && formattedAddress) {
                        const addressParts = formattedAddress.split(',');
                        // Usually city is the second part (after street address)
                        // Format: "Street, City, State, Country"
                        if (addressParts.length >= 2) {
                            city = addressParts[1]?.trim() || '';
                        }
                        // If still empty, try third part
                        if (!city && addressParts.length >= 3) {
                            city = addressParts[2]?.trim() || '';
                        }
                    }

                    // Update form fields
                    setValue('address', address, { shouldValidate: true });
                    setValue('city', city, { shouldValidate: true });
                    setValue('state', state, { shouldValidate: true });
                    setValue('country', country, { shouldValidate: true });
                    setValue('postal_code', postalCode, { shouldValidate: true });
                }
            });
        }
    };

    // Update circle radius when radius input changes
    useEffect(() => {
        if (circle && radius) {
            circle.setRadius(radius * 1000); // Convert km to meters
        }
    }, [radius, circle]);

    return (
        <Box sx={{ width: '100%', py: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary', mb: 2 }}>
                Store Location & Delivery Radius
            </Typography>

            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                Click on the map or drag the marker to set the store location. The red circle shows the delivery radius.
            </Typography>

            {/* Google Maps Container */}
            <Paper elevation={2} sx={{ p: 2, borderRadius: 2, mb: 3 }}>
                {apiKey ? (
                    <Box
                        ref={mapRef}
                        sx={{
                            width: '100%',
                            height: '400px',
                            borderRadius: 1,
                            overflow: 'hidden',
                        }}
                    />
                ) : (
                    <Box
                        sx={{
                            width: '100%',
                            height: '400px',
                            borderRadius: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#f5f5f5',
                            border: '2px dashed #ccc',
                        }}
                    >
                        <Box sx={{ textAlign: 'center', p: 3 }}>
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                Google Maps API Key Required
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                To use the location picker, please configure the Google Maps API key:
                            </Typography>
                            <Typography variant="body2" color="text.secondary" component="div">
                                1. Go to <strong>Settings → Maps Radius Settings</strong>
                            </Typography>
                            <Typography variant="body2" color="text.secondary" component="div">
                                2. Enter your Google Maps API Key
                            </Typography>
                            <Typography variant="body2" color="text.secondary" component="div">
                                3. Save the settings
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontSize: '0.75rem' }}>
                                Or set <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> in your environment variables
                            </Typography>
                        </Box>
                    </Box>
                )}
            </Paper>

            {/* Location Input Fields */}
            <Box sx={{ mb: 3 }}>
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            name="latitude"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="Latitude"
                                    type="number"
                                    fullWidth
                                    inputProps={{ step: '0.000001' }}
                                    error={!!errors.latitude}
                                    helperText={errors.latitude?.message as string}
                                />
                            )}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            name="longitude"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="Longitude"
                                    type="number"
                                    fullWidth
                                    inputProps={{ step: '0.000001' }}
                                    error={!!errors.longitude}
                                    helperText={errors.longitude?.message as string}
                                />
                            )}
                        />
                    </Grid>
                </Grid>
            </Box>

            {/* Delivery Radius */}
            <Box sx={{ mb: 3 }}>
                <Controller
                    name="delivery_radius"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label="Delivery Radius (KM)"
                            type="number"
                            fullWidth
                            inputProps={{ min: 0.1, max: 1000, step: 0.1 }}
                            error={!!errors.delivery_radius}
                            helperText={errors.delivery_radius?.message as string || 'Set the delivery radius in kilometers'}
                        />
                    )}
                />
            </Box>

            {/* Address Fields (Auto-populated from reverse geocoding) */}
            <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary', mb: 2 }}>
                    Address Details (Auto-populated)
                </Typography>
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 6 }}>
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
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
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
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
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
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
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
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
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
                    </Grid>
                </Grid>
            </Box>
        </Box>
    );
}

export default LocationTab;


//src/app/(control-panel)/apps/e-commerce/stores/[storeId]/[[...handle]]/tabs/StoreAddressTab.tsx
"use client";

import TextField from "@mui/material/TextField";
import { Controller, useFormContext } from "react-hook-form";
import { GoogleMap, Marker, useJsApiLoader, InfoWindow } from "@react-google-maps/api";
import { useState, useCallback, useEffect, useMemo, useRef } from "react";

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
    width: "100%",
    height: "400px",
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
    const [errorMessage, setErrorMessage] = useState<string>(""); // Error messages for UI
    const [infoWindowOpen, setInfoWindowOpen] = useState<boolean>(false); // InfoWindow toggle
    const [locationDetails, setLocationDetails] = useState<string>(""); // Displayed location details
    const initDoneRef = useRef(false); // Prevent duplicate initialization

    // Watch form values
    const latitude = watch("latitude");
    const longitude = watch("longitude");
    const address = watch("address");
    const zipCode = watch("zip_code");
    const city = watch("city");
    const country = watch("country");

    // Load Google Maps script
    const { isLoaded, loadError } = useJsApiLoader({
        id: "google-map-script",
        googleMapsApiKey: process.env.NEXT_PUBLIC_MAP_KEY as string,
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
                if (status === "OK" && results?.[0]) {
                    const components = results[0].address_components;
                    const formatted = results[0].formatted_address;

                    // Extract structured address parts
                    const streetNumber =
                        components.find((c) => c.types.includes("street_number"))?.long_name || "";
                    const route = components.find((c) => c.types.includes("route"))?.long_name || "";
                    const newAddress = `${streetNumber} ${route}`.trim() || formatted.split(",")[0] || "";

                    const newZip = components.find((c) => c.types.includes("postal_code"))?.long_name || "";
                    const newCity =
                        components.find((c) => c.types.includes("locality"))?.long_name ||
                        components.find((c) => c.types.includes("administrative_area_level_1"))?.long_name ||
                        "";
                    const newCountry = components.find((c) => c.types.includes("country"))?.long_name || "";

                    // Update form values
                    setValue("address", newAddress, { shouldValidate: true, shouldDirty: true });
                    setValue("zip_code", newZip, { shouldValidate: true, shouldDirty: true });
                    setValue("city", newCity, { shouldValidate: true, shouldDirty: true });
                    setValue("country", newCountry, { shouldValidate: true, shouldDirty: true });

                    // setValue("latitude", newPos.lat, { shouldValidate: true, shouldDirty: true });
                    // setValue("longitude", newPos.lng, { shouldValidate: true, shouldDirty: true });


                    // Update local state
                    setLocationDetails(formatted);
                    setInfoWindowOpen(true);
                    setErrorMessage("");
                } else {
                    setErrorMessage(`Reverse geocoding failed: ${status}.`);
                    setLocationDetails("");
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
            setErrorMessage("Google Maps API not loaded for geocoding.");
            return;
        }

        const { address, zip_code, city, country } = getValues();
        const fullAddress = [address, zip_code, city, country].filter(Boolean).join(", ");

        if (!fullAddress) return;

        geocoder.geocode({ address: fullAddress }, (results, status) => {
            if (status === "OK" && results?.[0]) {
                const loc = results[0].geometry.location;
                const newLat = loc.lat();
                const newLng = loc.lng();
                const pos = { lat: newLat, lng: newLng };

                // Update position + form values
                setPosition(pos);
                setValue("latitude", newLat, { shouldValidate: true });
                setValue("longitude", newLng, { shouldValidate: true });
                setLocationDetails(results[0].formatted_address);
                setInfoWindowOpen(true);
                setErrorMessage("");

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
            country: countryVal,
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
        if (location.protocol !== "https:" && location.hostname !== "localhost") {
            setErrorMessage("Geolocation requires HTTPS. Using fallback location.");
            setPosition(FALLBACK_POSITION);
            setValue("latitude", FALLBACK_POSITION.lat, { shouldValidate: true });
            setValue("longitude", FALLBACK_POSITION.lng, { shouldValidate: true });
            reverseGeocode(FALLBACK_POSITION);
            return;
        }

        // Case 4: Browser doesn’t support geolocation
        if (!navigator.geolocation) {
            setErrorMessage("Geolocation not supported. Using fallback location.");
            setPosition(FALLBACK_POSITION);
            setValue("latitude", FALLBACK_POSITION.lat, { shouldValidate: true });
            setValue("longitude", FALLBACK_POSITION.lng, { shouldValidate: true });
            reverseGeocode(FALLBACK_POSITION);
            return;
        }

        // Case 5: Ask browser for geolocation
        navigator.permissions?.query({ name: "geolocation" as PermissionName })
            .then((perm) => {
                if (perm.state === "denied") {
                    // Permission denied → fallback
                    setErrorMessage("Location access denied. Using fallback location.");
                    setPosition(FALLBACK_POSITION);
                    setValue("latitude", FALLBACK_POSITION.lat, { shouldValidate: true });
                    setValue("longitude", FALLBACK_POSITION.lng, { shouldValidate: true });
                    reverseGeocode(FALLBACK_POSITION);
                } else {
                    // Try to get user’s actual position
                    navigator.geolocation.getCurrentPosition(
                        (pos) => {
                            const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                            setPosition(newPos);
                            setValue("latitude", newPos.lat, { shouldValidate: true });
                            setValue("longitude", newPos.lng, { shouldValidate: true });
                            setErrorMessage("");
                            reverseGeocode(newPos);
                        },
                        () => {
                            // Error → fallback
                            setErrorMessage("Unable to get your location. Using fallback.");
                            setPosition(FALLBACK_POSITION);
                            setValue("latitude", FALLBACK_POSITION.lat, { shouldValidate: true });
                            setValue("longitude", FALLBACK_POSITION.lng, { shouldValidate: true });
                            reverseGeocode(FALLBACK_POSITION);
                        },
                        { timeout: 10000 }
                    );
                }
            })
            .catch(() => {
                // Permission API not supported → fallback
                setErrorMessage("Cannot verify permissions. Using fallback location.");
                setPosition(FALLBACK_POSITION);
                setValue("latitude", FALLBACK_POSITION.lat, { shouldValidate: true });
                setValue("longitude", FALLBACK_POSITION.lng, { shouldValidate: true });
                reverseGeocode(FALLBACK_POSITION);
            });
    }, [isLoaded, geocodeAddress, reverseGeocode, getValues, setValue]);

    /**
     * Auto-update marker when user edits address fields
     * Debounced to avoid excessive API calls
     */
    useEffect(() => {
        if (!isLoaded) return;
        // if (address || zipCode || city || country) {
        if (zipCode) {
            const timeout = setTimeout(() => {
                geocodeAddress();
            }, 800); // debounce 800ms
            return () => clearTimeout(timeout);
        }
    }, [zipCode, isLoaded, geocodeAddress]);
    // }, [address, zipCode, city, country, isLoaded, geocodeAddress]);

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
            setValue("latitude", newPos.lat, { shouldValidate: true });
            setValue("longitude", newPos.lng, { shouldValidate: true });
            reverseGeocode(newPos);
            setInfoWindowOpen(true);
        },
        [setValue, reverseGeocode]
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Error message UI */}
            {errorMessage && (
                <div className="col-span-1 md:col-span-2 p-2 bg-red-100 text-red-800 rounded">
                    {errorMessage}
                </div>
            )}

            {/* Form fields: address, zip, city, country, lat, lng */}
            {["country", "city", "zip_code", "address", "latitude", "longitude"].map((fieldName) => (
                <Controller
                    key={fieldName}
                    name={fieldName}
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            value={field.value ?? (["latitude", "longitude"].includes(fieldName) ? 0 : "")} // ✅ Fix uncontrolled -> controlled
                            label={fieldName.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                            fullWidth
                            variant="outlined"
                            type={["latitude", "longitude"].includes(fieldName) ? "number" : "text"}
                            InputProps={{
                                disabled: ["latitude", "longitude"].includes(fieldName), // read-only for lat/lng
                            }}
                            sx={{
                                backgroundColor: ["latitude", "longitude"].includes(fieldName) ? "#f5f5f5" : "inherit", // grey look
                            }}

                            onBlur={() => {
                                field.onBlur();

                                // Trigger geocode when address-related fields blur
                                // if (["address", "zip_code", "city", "country"].includes(fieldName)) {
                                //     geocodeAddress();
                                // }

                                if (fieldName === "zip_code") {
                                    geocodeAddress();
                                }

                                // Trigger reverse geocode when lat/lng fields blur (optional)
                                if (["latitude", "longitude"].includes(fieldName)) {
                                    const newLat = Number(fieldName === "latitude" ? field.value : watch("latitude"));
                                    const newLng = Number(fieldName === "longitude" ? field.value : watch("longitude"));
                                    if (!isNaN(newLat) && !isNaN(newLng)) {
                                        const pos = { lat: newLat, lng: newLng };
                                        setPosition(pos);
                                        reverseGeocode(pos);
                                        setInfoWindowOpen(true);
                                    }
                                }
                            }}
                        />
                    )}
                />
            ))}

            {/* Google Map + Marker */}
            <div className="col-span-1 md:col-span-2">
                {isLoaded ? (
                    <GoogleMap mapContainerStyle={containerStyle} center={position} zoom={14} onClick={handleMapClick}>
                        <Marker
                            position={position}
                            draggable
                            onDragEnd={(e) => {
                                if (!e.latLng) return;
                                const newPos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
                                setPosition(newPos);
                                setValue("latitude", newPos.lat, { shouldValidate: true });
                                setValue("longitude", newPos.lng, { shouldValidate: true });
                                reverseGeocode(newPos);
                                setInfoWindowOpen(true);
                            }}
                            onClick={() => setInfoWindowOpen(true)}
                        >
                            {/* InfoWindow popup */}
                            {infoWindowOpen && locationDetails && (
                                <InfoWindow position={position} onCloseClick={() => setInfoWindowOpen(false)}>
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

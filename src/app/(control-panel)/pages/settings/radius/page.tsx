'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  TextField,
  Button,
  Typography,
  Grid,
  Alert,
  Box,
  Container,
  Stack,
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Avatar,
  Snackbar,
  Divider,
  Paper,
  CircularProgress,
} from '@mui/material';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import RestartAltOutlinedIcon from '@mui/icons-material/RestartAltOutlined';
import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import {
  useGetAdminMapsRadiusSettingsQuery,
  useUpdateAdminMapsRadiusSettingsMutation,
} from './MapsRadiusAdminApi';

type MapsRadiusFormType = {
  default_location_latitude: number;
  default_location_longitude: number;
  search_radius_km: number;
  google_maps_api_key: string;
};

declare global {
  interface Window {
    initMapsRadiusMap: () => void;
    google: any;
  }
}

export default function MapsRadiusSettingsPage() {
  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
  } = useForm<MapsRadiusFormType>({
    defaultValues: {
      default_location_latitude: 51.5074,
      default_location_longitude: -0.1278,
      search_radius_km: 10,
      google_maps_api_key: '',
    },
  });

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);
  const [circle, setCircle] = useState<any>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const [updateSettings, { isLoading }] = useUpdateAdminMapsRadiusSettingsMutation();
  const {
    data: settingsData,
    isFetching: isFetchingSettings,
    isError: isSettingsError,
    error: settingsError,
    refetch,
  } = useGetAdminMapsRadiusSettingsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  const apiKey = watch('google_maps_api_key');
  const latitude = watch('default_location_latitude');
  const longitude = watch('default_location_longitude');
  const radius = watch('search_radius_km');

  // Load settings into form
  useEffect(() => {
    const d = settingsData?.data;
    if (!d) return;

    reset({
      default_location_latitude: d.default_location_latitude ?? 51.5074,
      default_location_longitude: d.default_location_longitude ?? -0.1278,
      search_radius_km: d.search_radius_km ?? 10,
      google_maps_api_key: d.google_maps_api_key ?? '',
    });
  }, [settingsData, reset]);

  // Error handling
  useEffect(() => {
    if (isSettingsError && settingsError) {
      const anyErr = settingsError as any;
      setError(anyErr?.data?.message || 'Failed to load settings.');
    }
  }, [isSettingsError, settingsError]);

  // Cleanup map instance
  const cleanupMap = useCallback(() => {
    try {
      // Store references before clearing state
      const currentMap = map;
      const currentMarker = marker;
      const currentCircle = circle;
      
      if (currentMarker) {
        try {
          currentMarker.setMap(null);
        } catch (e) {
          console.warn('Error removing marker:', e);
        }
        setMarker(null);
      }
      
      if (currentCircle) {
        try {
          currentCircle.setMap(null);
        } catch (e) {
          console.warn('Error removing circle:', e);
        }
        setCircle(null);
      }
      
      if (currentMap) {
        try {
          // Clear all listeners first
          if (window.google?.maps?.event?.clearInstanceListeners) {
            window.google.maps.event.clearInstanceListeners(currentMap);
          }
        } catch (e) {
          console.warn('Error clearing map listeners:', e);
        }
        setMap(null);
      }
      
      setMapLoaded(false);
      // Note: We don't clear innerHTML here - let Google Maps handle its own DOM cleanup
      // We'll clear it only when we're about to create a new map instance
    } catch (e) {
      console.error('Error cleaning up map:', e);
    }
  }, [map, marker, circle]);

  // Initialize map
  const initMapsRadiusMap = useCallback(() => {
    if (isInitializing) {
      return; // Prevent multiple simultaneous initializations
    }

    setIsInitializing(true);
    
    try {
      if (typeof window.google === 'undefined' || !window.google.maps) {
        // Don't manipulate innerHTML - causes React reconciliation errors
        setIsInitializing(false);
        return;
      }

      // Use ref instead of getElementById to avoid React reconciliation issues
      const mapDiv = mapContainerRef.current;
      if (!mapDiv) {
        setIsInitializing(false);
        return;
      }

      // Don't clear innerHTML - this causes React reconciliation errors
      // Google Maps Map constructor can handle reinitializing on the same container
      // It will replace the content itself. We just need to ensure the old map
      // instance is destroyed (which cleanupMap already did)
      
      // Use requestAnimationFrame to ensure we're not interfering with React's render cycle
      requestAnimationFrame(() => {
        initializeMapOnDiv(mapDiv);
      });
      
      return;
    } catch (e) {
      console.error('Error in initMapsRadiusMap:', e);
      setError('Error initializing map. Please check your API key.');
      setIsInitializing(false);
    }
  }, [latitude, longitude, radius, setValue, isInitializing]);

  // Separate function to initialize map on a div
  const initializeMapOnDiv = useCallback((mapDiv: HTMLDivElement) => {
    try {
      const currentLat = latitude || 51.5074;
      const currentLng = longitude || -0.1278;
      const currentRadius = radius || 10;

      // Initialize map - Google Maps will handle replacing any existing content
      const newMap = new window.google.maps.Map(mapDiv, {
        center: { lat: currentLat, lng: currentLng },
        zoom: 12,
      });

      // Create marker
      const newMarker = new window.google.maps.Marker({
        position: { lat: currentLat, lng: currentLng },
        map: newMap,
        draggable: true,
      });

      // Create circle for radius visualization
      const newCircle = new window.google.maps.Circle({
        map: newMap,
        radius: currentRadius * 1000, // Convert km to meters
        fillColor: '#AA0000',
        fillOpacity: 0.2,
        strokeColor: '#AA0000',
        strokeOpacity: 0.8,
        strokeWeight: 2,
      });
      newCircle.bindTo('center', newMarker, 'position');

      // Update inputs when marker is dragged
      newMarker.addListener('dragend', () => {
        const position = newMarker.getPosition();
        setValue('default_location_latitude', position.lat());
        setValue('default_location_longitude', position.lng());
        if (newCircle) {
          newCircle.setCenter({ lat: position.lat(), lng: position.lng() });
        }
      });

      // Update location when map is clicked
      newMap.addListener('click', (event: any) => {
        newMarker.setPosition(event.latLng);
        setValue('default_location_latitude', event.latLng.lat());
        setValue('default_location_longitude', event.latLng.lng());
        if (newCircle) {
          newCircle.setCenter({ lat: event.latLng.lat(), lng: event.latLng.lng() });
        }
      });

      setMap(newMap);
      setMarker(newMarker);
      setCircle(newCircle);
      setMapLoaded(true);
      setIsInitializing(false);
    } catch (e) {
      console.error('Error initializing map:', e);
      setError('Error initializing map. Please check your API key.');
      setIsInitializing(false);
    }
  }, [latitude, longitude, radius, setValue]);

  // Load Google Maps
  const loadGoogleMaps = useCallback(() => {
    if (isInitializing) {
      // Don't load if already initializing
      return;
    }

    if (!apiKey || apiKey.trim() === '') {
      cleanupMap();
      // Don't manipulate innerHTML directly - let React handle it
      return;
    }

    // Cleanup existing map before loading new one
    cleanupMap();

    // Wait a bit for cleanup to complete before proceeding
    setTimeout(() => {
      // Check if script already exists and Google Maps is loaded
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript && window.google && window.google.maps) {
        // Google Maps is already loaded, just reinitialize
        if (window.initMapsRadiusMap) {
          window.initMapsRadiusMap();
        }
        return;
      }

      // Only remove script if we're loading a new one with a different key
      // Check if the existing script has a different API key
      if (existingScript) {
        const scriptSrc = existingScript.getAttribute('src') || '';
        const scriptKeyMatch = scriptSrc.match(/[?&]key=([^&]+)/);
        const scriptKey = scriptKeyMatch ? decodeURIComponent(scriptKeyMatch[1]) : '';
        
        // Only remove if the API key is different
        if (scriptKey !== apiKey) {
          try {
            // Check if script is still in the DOM and has a parent before removing
            if (existingScript.parentNode && existingScript.parentNode.contains(existingScript)) {
              existingScript.parentNode.removeChild(existingScript);
            } else if (existingScript.parentElement && existingScript.parentElement.contains(existingScript)) {
              existingScript.parentElement.removeChild(existingScript);
            }
          } catch (e) {
            // Script might already be removed or in the process of being removed
            console.warn('Could not remove existing script (may already be removed):', e);
          }
        } else {
          // Same API key, script is already loading/loaded, just wait for callback
          return;
        }
      }

      // Load Google Maps API dynamically
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&callback=initMapsRadiusMap`;
      script.async = true;
      script.defer = true;
    script.onerror = () => {
      // Don't manipulate innerHTML - causes React reconciliation errors
      // Just set the error state and let React handle the UI
      setError('Failed to load Google Maps. Please check your API key.');
      setIsInitializing(false);
    };
      
      // Check if script with same src already exists before adding
      const duplicateScript = Array.from(document.querySelectorAll('script[src*="maps.googleapis.com"]'))
        .find((s: HTMLScriptElement) => s.src === script.src);
      
      if (!duplicateScript) {
        document.head.appendChild(script);
      } else {
        // Script is already loading, just wait for callback
        if (window.google && window.google.maps && window.initMapsRadiusMap) {
          window.initMapsRadiusMap();
        }
      }
    }, 100);
  }, [apiKey, cleanupMap, isInitializing]);

  // Assign to window for callback
  useEffect(() => {
    window.initMapsRadiusMap = initMapsRadiusMap;
    return () => {
      // Cleanup on unmount
      cleanupMap();
      delete window.initMapsRadiusMap;
    };
  }, [initMapsRadiusMap, cleanupMap]);

  // Load map when API key changes
  useEffect(() => {
    if (apiKey && apiKey.trim() !== '') {
      // Cleanup first, then load with delay to ensure cleanup completes
      cleanupMap();
      const timeoutId = setTimeout(() => {
        loadGoogleMaps();
      }, 300);
      
      return () => {
        clearTimeout(timeoutId);
      };
    } else {
      cleanupMap();
    }
  }, [apiKey, loadGoogleMaps, cleanupMap]);

  // Update circle radius when radius changes
  useEffect(() => {
    if (circle && radius) {
      circle.setRadius(radius * 1000);
    }
  }, [radius, circle]);

  // Update circle center when lat/lng changes
  useEffect(() => {
    if (circle && latitude && longitude) {
      circle.setCenter({ lat: latitude, lng: longitude });
      if (marker) {
        marker.setPosition({ lat: latitude, lng: longitude });
        if (map) {
          map.setCenter({ lat: latitude, lng: longitude });
        }
      }
    }
  }, [latitude, longitude, circle, marker, map]);

  // Form submit
  const onSave = async (form: MapsRadiusFormType) => {
    try {
      await updateSettings(form).unwrap();
      setMessage('Maps & Radius settings saved successfully!');
      await refetch();
    } catch (e: any) {
      setError(e?.data?.message || 'Failed to save settings.');
    }
  };

  const handleReload = async () => {
    try {
      await refetch();
      setMessage('Settings reloaded successfully.');
    } catch {
      setError('Failed to reload settings.');
    }
  };

  return (
    <>
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          py: 6,
        }}
      >
        <Container maxWidth="lg">
          <Stack spacing={4}>
            {/* Header */}
            <Paper
              elevation={8}
              sx={{
                p: 5,
                textAlign: 'center',
                borderRadius: 4,
                background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.9) 100%)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.3)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)',
                  }}
                >
                  <MapOutlinedIcon sx={{ fontSize: 40 }} />
                </Avatar>
              </Box>
              <Typography
                variant="h3"
                fontWeight="bold"
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 1,
                }}
              >
                Maps & Radius Search Settings
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Configure default location and search radius for product filtering
              </Typography>
            </Paper>

            {/* Main Settings Card */}
            <Card
              elevation={6}
              sx={{
                borderRadius: 4,
                overflow: 'hidden',
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.3)',
              }}
            >
              <CardHeader
                avatar={
                  <Avatar
                    sx={{
                      bgcolor: 'primary.main',
                      width: 56,
                      height: 56,
                      boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                    }}
                  >
                    <LocationOnOutlinedIcon />
                  </Avatar>
                }
                title={
                  <Typography variant="h5" fontWeight={600}>
                    Location & Radius Configuration
                  </Typography>
                }
                subheader={
                  <Typography variant="body2" color="text.secondary">
                    Set the default location and search radius. This location will be used when users don't provide their location.
                  </Typography>
                }
                sx={{ pb: 1 }}
              />

              <Divider />

              <form onSubmit={handleSubmit(onSave)}>
                <CardContent sx={{ pt: 3 }}>
                  <Grid container spacing={3}>
                    {/* Google Maps API Key */}
                    <Grid item xs={12}>
                      <Controller
                        name="google_maps_api_key"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="Google Maps API Key"
                            placeholder="Enter your Google Maps API Key"
                            fullWidth
                            variant="outlined"
                            helperText="Required to display the map and select location"
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                              },
                            }}
                          />
                        )}
                      />
                    </Grid>

                    {/* Map */}
                    <Grid item xs={12}>
                      <Box>
                        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                          Select Default Location on Map
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          Click on the map or drag the marker to set the default location
                        </Typography>
                        <Box
                          ref={mapContainerRef}
                          id="maps-radius-map"
                          sx={{
                            height: 400,
                            width: '100%',
                            borderRadius: 2,
                            border: '1px solid #ddd',
                            overflow: 'hidden',
                          }}
                        >
                          {isFetchingSettings && (
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '100%',
                              }}
                            >
                              <CircularProgress />
                            </Box>
                          )}
                        </Box>
                      </Box>
                    </Grid>

                    {/* Latitude */}
                    <Grid item xs={12} md={6}>
                      <Controller
                        name="default_location_latitude"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="Default Latitude"
                            type="number"
                            fullWidth
                            variant="outlined"
                            InputProps={{
                              readOnly: true,
                            }}
                            helperText="Automatically updated when you select location on map"
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                              },
                            }}
                          />
                        )}
                      />
                    </Grid>

                    {/* Longitude */}
                    <Grid item xs={12} md={6}>
                      <Controller
                        name="default_location_longitude"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="Default Longitude"
                            type="number"
                            fullWidth
                            variant="outlined"
                            InputProps={{
                              readOnly: true,
                            }}
                            helperText="Automatically updated when you select location on map"
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                              },
                            }}
                          />
                        )}
                      />
                    </Grid>

                    {/* Search Radius */}
                    <Grid item xs={12} md={6}>
                      <Controller
                        name="search_radius_km"
                        control={control}
                        rules={{
                          min: { value: 0.1, message: 'Radius must be at least 0.1 km' },
                          max: { value: 1000, message: 'Radius cannot exceed 1000 km' },
                        }}
                        render={({ field, fieldState: { error } }) => (
                          <TextField
                            {...field}
                            label="Search Radius (km)"
                            type="number"
                            inputProps={{ min: 0.1, max: 1000, step: 0.5 }}
                            fullWidth
                            variant="outlined"
                            error={!!error}
                            helperText={error?.message || 'Radius in kilometers for product search'}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                              },
                            }}
                          />
                        )}
                      />
                    </Grid>
                  </Grid>
                </CardContent>

                <Divider />

                <CardActions
                  sx={{
                    justifyContent: 'flex-end',
                    p: 3,
                    gap: 2,
                    flexWrap: 'wrap',
                  }}
                >
                  <Button
                    variant="outlined"
                    startIcon={<RestartAltOutlinedIcon />}
                    onClick={handleReload}
                    disabled={isFetchingSettings}
                    sx={{
                      borderRadius: 2,
                      px: 3,
                      textTransform: 'none',
                      fontWeight: 600,
                    }}
                  >
                    Reload
                  </Button>

                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<SaveOutlinedIcon />}
                    disabled={isLoading}
                    sx={{
                      borderRadius: 2,
                      px: 4,
                      py: 1.5,
                      textTransform: 'none',
                      fontWeight: 600,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 20px rgba(102, 126, 234, 0.5)',
                        background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                      },
                    }}
                  >
                    {isLoading ? 'Saving…' : 'Save Settings'}
                  </Button>
                </CardActions>
              </form>
            </Card>
          </Stack>
        </Container>
      </Box>

      {/* Notification Toast */}
      <Snackbar
        open={!!message}
        autoHideDuration={3000}
        onClose={() => setMessage(null)}
      >
        <Alert severity="success" variant="filled">
          {message}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!error}
        autoHideDuration={4000}
        onClose={() => setError(null)}
      >
        <Alert severity="error" variant="filled">
          {error}
        </Alert>
      </Snackbar>
    </>
  );
}



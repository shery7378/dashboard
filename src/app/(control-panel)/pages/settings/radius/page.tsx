'use client';
import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { GoogleMap, Marker, Circle, useJsApiLoader } from '@react-google-maps/api';
import {
  TextField,
  Box,
  CircularProgress,
  Typography,
  Slider,
  Button,
  Alert,
} from '@mui/material';
import apiFetchLaravel from '@/utils/apiFetchLaravel';

type FormType = {
  google_maps_api_key: string;
  default_location_latitude: number;
  default_location_longitude: number;
  search_radius_km: number;
};

const mapContainerStyle = {
  width: '100%',
  height: '480px',
};

export default function MapsRadiusPicker() {
  const { control, watch, setValue } = useForm<FormType>({
    defaultValues: {
      google_maps_api_key: '',
      default_location_latitude: 51.5074,
      default_location_longitude: -0.1278,
      search_radius_km: 5,
    },
  });

  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  const apiKey = watch('google_maps_api_key');
  const latitude = watch('default_location_latitude');
  const longitude = watch('default_location_longitude');
  const radius = watch('search_radius_km');

  // Load Google Maps using the library
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey || process.env.NEXT_PUBLIC_MAP_KEY || '',
  });

  // Load existing settings from backend
  const loadSettings = async () => {
    try {
      // Get token from API route (server-side)
      const sessionRes = await fetch('/api/auth/session', { credentials: 'include' });
      const sessionData = await sessionRes.json();
      const token = sessionData?.token;
      
      const response = await apiFetchLaravel(`/api/admin/maps-radius-settings`, {
        credentials: 'include',
        ...(token && {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to load settings');
      }

      const data = await response.json();
      if (data.status === 200 && data.data) {
        setValue('google_maps_api_key', data.data.google_maps_api_key || '');
        setValue('default_location_latitude', data.data.default_location_latitude || 51.5074);
        setValue('default_location_longitude', data.data.default_location_longitude || -0.1278);
        setValue('search_radius_km', data.data.search_radius_km || 5);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Map click handler
  const handleMapClick = (event: google.maps.MapMouseEvent) => {
    if (event.latLng) {
      setValue('default_location_latitude', event.latLng.lat());
      setValue('default_location_longitude', event.latLng.lng());
    }
  };

  // Marker drag handler
  const handleMarkerDrag = (event: google.maps.MapMouseEvent) => {
    if (event.latLng) {
      setValue('default_location_latitude', event.latLng.lat());
      setValue('default_location_longitude', event.latLng.lng());
    }
  };

  // Save handler to send data to backend
  const handleSave = async () => {
    setSaving(true);
    setSaveStatus(null);
    try {
      // Get token from API route (server-side)
      const sessionRes = await fetch('/api/auth/session', { credentials: 'include' });
      const sessionData = await sessionRes.json();
      const token = sessionData?.token;
      
      const response = await apiFetchLaravel(`/api/admin/maps-radius-settings`, {
        method: 'PUT',
        credentials: 'include',
        ...(token && {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        body: JSON.stringify({
          default_location_latitude: latitude,
          default_location_longitude: longitude,
          search_radius_km: radius,
          google_maps_api_key: apiKey,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Failed to save data');
      }

      const data = await response.json();
      setSaveStatus({ type: 'success', message: data.message || 'Location saved successfully!' });
    } catch (error: any) {
      setSaveStatus({ type: 'error', message: error.message || 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
        p: 4,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Box
        sx={{
          width: 850,
          bgcolor: 'white',
          borderRadius: 4,
          boxShadow: '0 16px 40px rgba(59,130,246,0.25)',
          p: 5,
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
        }}
      >
        <Typography
          variant="h4"
          sx={{ color: '#1e40af', fontWeight: 'bold', textAlign: 'center' }}
        >
          Maps Radius Picker
        </Typography>

        {initialLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Loading settings...</Typography>
          </Box>
        )}

        <Controller
          name="google_maps_api_key"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Google Maps API Key"
              fullWidth
              size="medium"
              disabled={initialLoading}
              sx={{
                '& .MuiInputBase-root': {
                  borderRadius: 3,
                  backgroundColor: '#f3f4f6',
                  boxShadow: 'inset 0 1px 3px rgb(0 0 0 / 0.1)',
                },
                '& .MuiInputBase-root.Mui-focused': {
                  boxShadow: '0 0 0 3px #3b82f6',
                  backgroundColor: 'white',
                },
              }}
            />
          )}
        />

        <Box sx={{ px: 1 }}>
          <Typography
            sx={{ mb: 1, fontWeight: 600, color: '#1e40af' }}
            id="radius-slider-label"
          >
            Search Radius: {radius} km
          </Typography>
          <Controller
            name="search_radius_km"
            control={control}
            render={({ field }) => (
              <Slider
                {...field}
                value={field.value}
                min={1}
                max={50}
                step={1}
                valueLabelDisplay="auto"
                onChange={(_, value) => setValue('search_radius_km', value as number)}
                disabled={initialLoading}
                aria-labelledby="radius-slider-label"
                sx={{
                  color: '#3b82f6',
                  '& .MuiSlider-thumb': {
                    boxShadow: '0 0 0 8px rgb(59 130 246 / 0.16)',
                  },
                }}
              />
            )}
          />
        </Box>

        <Box
          sx={{
            height: 480,
            borderRadius: 4,
            overflow: 'hidden',
            position: 'relative',
            border: '3px solid #3b82f6',
            boxShadow: '0 8px 24px rgb(59 130 246 / 0.3)',
          }}
        >
          {!isLoaded && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.85)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 20,
                gap: 2,
                fontWeight: 600,
                color: '#3b82f6',
              }}
            >
              <CircularProgress color="primary" size={36} />
              <Typography>Loading Map…</Typography>
            </Box>
          )}
          
          {isLoaded && (
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={{ lat: latitude, lng: longitude }}
              zoom={12}
              onClick={handleMapClick}
              options={{
                styles: [
                  { elementType: 'geometry', stylers: [{ color: '#e0e7ff' }] },
                  { elementType: 'labels.text.fill', stylers: [{ color: '#1e293b' }] },
                  { elementType: 'labels.text.stroke', stylers: [{ color: '#e0e7ff' }] },
                ],
              }}
            >
              <Marker
                position={{ lat: latitude, lng: longitude }}
                draggable={true}
                onDragEnd={handleMarkerDrag}
              />
              <Circle
                center={{ lat: latitude, lng: longitude }}
                radius={radius * 1000}
                options={{
                  fillColor: '#2563eb',
                  fillOpacity: 0.15,
                  strokeColor: '#2563eb',
                  strokeOpacity: 0.7,
                  strokeWeight: 3,
                }}
              />
            </GoogleMap>
          )}
        </Box>

        <Typography
          sx={{
            textAlign: 'center',
            fontWeight: 700,
            fontSize: '1.1rem',
            color: '#1e293b',
          }}
        >
          Latitude: {latitude.toFixed(6)}, Longitude: {longitude.toFixed(6)}, Radius:{' '}
          {radius} km
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 1 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSave}
            disabled={saving || !isLoaded || !apiKey || initialLoading}
            size="large"
            sx={{ minWidth: 150, fontWeight: 'bold' }}
          >
            {saving ? 'Saving...' : 'Save Location'}
          </Button>
        </Box>

        {saveStatus && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Alert severity={saveStatus.type}>{saveStatus.message}</Alert>
          </Box>
        )}
      </Box>
    </Box>
  );
}

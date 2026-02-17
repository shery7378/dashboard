# Google Maps API Setup Guide

## 1. Get a Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - **Places API**
   - **Geocoding API**
   - **Maps JavaScript API**

4. Create an API Key:
   - Go to "Credentials" → "Create Credentials" → "API Key"
   - Restrict the API key for security:
     - Application restrictions: HTTP referrers (your domain)
     - API restrictions: Only enable the APIs listed above

## 2. Configure Environment Variables

1. Open the `----.env.local` file in your project root
2. Replace the placeholder with your actual API key:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_actual_google_maps_api_key_here
```

## 3. Restart the Development Server

After updating the environment variables, restart your development server:

```bash
npm run dev
```

## 4. Test the Integration

1. Open your application at `http://localhost:3001`
2. Click on the "Enter Delivery Address" button
3. Start typing an address in the input field
4. You should see Google Places autocomplete suggestions

## Features

- ✅ Google Places Autocomplete
- ✅ Address validation
- ✅ Full address selection
- ✅ Fallback to manual input if API key is not configured

## Troubleshooting

### API Key Not Working
- Ensure the API key is correctly set in `----.env.local`
- Check that the required APIs are enabled in Google Cloud Console
- Verify API key restrictions (if any)

### No Suggestions Appearing
- Check browser console for API errors
- Ensure you have an active internet connection
- Verify the Places API is enabled

### Development vs Production
- The API key should work in both development and production
- Make sure to add your production domain to API key restrictions

## Security Notes

- Never commit your API key to version control
- Use environment variables for API key storage
- Restrict your API key to specific domains and APIs
- Monitor your API usage in Google Cloud Console

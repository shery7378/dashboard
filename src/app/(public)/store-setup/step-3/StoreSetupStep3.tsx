'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { AuthButton, AuthInput, AuthTitle } from '@/components/auth';
import StepBar from '@/components/StepBar';

declare global {
	interface Window {
		google: any;
	}
}

export default function StoreSetupStep3() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const addressInputRef = useRef<HTMLInputElement | null>(null);

	const [phone, setPhone] = useState('');
	const [city, setCity] = useState('');
	const [zipCode, setZipCode] = useState('');
	const [address, setAddress] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [mapsLoaded, setMapsLoaded] = useState(false);
	const [apiKey, setApiKey] = useState<string>('');

	const email =
		searchParams.get('email') || (typeof window !== 'undefined' ? localStorage.getItem('signupEmail') : '') || '';
	const userType =
		searchParams.get('userType') ||
		(typeof window !== 'undefined' ? localStorage.getItem('signupUserType') : 'seller') ||
		'seller';

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
						setApiKey(fetchedKey);
						return;
					}
				}

				setApiKey(envKey);
			} catch (err) {
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
		script.onload = () => setMapsLoaded(true);
		document.head.appendChild(script);

		return () => {
			if (script && document.head.contains(script)) {
				document.head.removeChild(script);
			}
		};
	}, [apiKey, mapsLoaded]);

	useEffect(() => {
		if (!mapsLoaded || !addressInputRef.current || !window.google?.maps?.places) return;

		const autocomplete = new window.google.maps.places.Autocomplete(addressInputRef.current, {
			types: ['address'],
			fields: ['address_components', 'formatted_address', 'geometry']
		});

		autocomplete.addListener('place_changed', () => {
			const place = autocomplete.getPlace();
			const components = place?.address_components || [];
			const formattedAddress = place?.formatted_address || '';

			let foundCity = '';
			let foundZip = '';
			let street = '';
			let route = '';

			for (const c of components) {
				const types = c.types || [];

				if (types.includes('street_number')) street = c.long_name;
				if (types.includes('route')) route = c.long_name;

				if (types.includes('locality')) {
					foundCity = c.long_name;
				} else if (!foundCity && types.includes('postal_town')) {
					foundCity = c.long_name;
				} else if (!foundCity && types.includes('sublocality_level_1')) {
					foundCity = c.long_name;
				}

				if (types.includes('postal_code')) {
					foundZip = c.long_name;
				}
			}

			// Fallback: Places API sometimes omits postal_code (e.g. for Indian addresses).
			// Use Geocoding API to reverse-geocode lat/lng for postal code.
			if (!foundZip && place?.geometry?.location) {
				const geocoder = new window.google.maps.Geocoder();
				const latlng = {
					lat: place.geometry.location.lat(),
					lng: place.geometry.location.lng()
				};
				geocoder.geocode({ location: latlng }, (results: google.maps.GeocoderResult[] | null, status: google.maps.GeocoderStatus) => {
					if (status === window.google.maps.GeocoderStatus.OK && results?.[0]) {
						const comp = results[0].address_components?.find((ac) => ac.types?.includes('postal_code'));
						if (comp?.long_name) {
							setZipCode(comp.long_name);
							return;
						}
					}
				});
			}

			const addressLine = street || route ? `${street} ${route}`.trim() : formattedAddress.split(',')[0] || '';
			console.log('📍 Place Selected:', { addressLine, foundCity, foundZip, components });

			setAddress(addressLine);
			setCity(foundCity);
			setZipCode(foundZip);
		});
	}, [mapsLoaded]);

	const handleContinue = () => {
		if (!phone.trim() || !city.trim() || !address.trim()) return;

		setIsSubmitting(true);

		localStorage.setItem('phone', phone.trim());
		localStorage.setItem('city', city.trim());
		localStorage.setItem('zipCode', zipCode.trim());
		localStorage.setItem('address', address.trim());

		setTimeout(() => {
			const targetUrl = `/store-setup/step-4?email=${encodeURIComponent(email)}&userType=${encodeURIComponent(userType)}`;
			router.push(targetUrl);
			setIsSubmitting(false);
		}, 300);
	};

	return (
		<div className="min-h-screen flex flex-col bg-white">
			<Header />
			<main className="flex-1 flex justify-center items-center py-12 px-4 shadow-sm bg-white">
				<div className="bg-white rounded-2xl w-full max-w-[512px] p-8 !rounded-lg border border-[#D8DADC] relative">
					<button
						onClick={() => router.back()}
						className="absolute top-8 left-8 p-2 rounded-full border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-colors"
					>
						<ArrowBackIcon className="h-5 w-5 text-black" />
					</button>

					<div className="text-center mb-8 flex justify-center items-center">
						<img
							src={'/assets/images/MultiKonnect.svg'}
							alt="MultiKonnect"
							className="h-8 w-36 object-contain cursor-pointer"
						/>
					</div>

					<StepBar
						currentStep={3}
						totalSteps={4}
					/>

					<AuthTitle
						heading="Add Your Contact & Address"
						align="center"
					/>

					<div className="space-y-4 mb-6">
						<div>
							<AuthInput
								label="Phone Number"
								type="tel"
								value={phone}
								onChange={(e) => setPhone(e.target.value)}
								placeholder="Your phone number"
							/>
						</div>

						<div>
							<AuthInput
								label="Address"
								type="text"
								ref={addressInputRef}
								value={address}
								onChange={(e) => setAddress(e.target.value)}
								placeholder="Your address"
							/>
						</div>

						<div className="flex gap-4">
							<div className="flex-1">
								<AuthInput
									label="City"
									type="text"
									value={city}
									onChange={(e) => setCity(e.target.value)}
									placeholder="Your city"
								/>
							</div>
							<div className="flex-1">
								<AuthInput
									label="Zip Code"
									type="text"
									value={zipCode}
									onChange={(e) => setZipCode(e.target.value)}
									placeholder="Your zip code"
								/>
							</div>
						</div>
					</div>

					<AuthButton
						onClick={handleContinue}
						disabled={!phone.trim() || !city.trim() || !address.trim() || isSubmitting}
						variant="primary"
						fullWidth={true}
						loading={isSubmitting}
					>
						Continue
					</AuthButton>

					<div className="text-center text-sm text-gray-600 mt-6">
						Already have an account?{' '}
						<Link
							href="/sign-in"
							className="text-[#FF6B35] underline"
						>
							Log in
						</Link>
					</div>
				</div>
			</main>
			<Footer />
		</div>
	);
}

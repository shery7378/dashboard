'use client';

import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { signIn, getSession } from 'next-auth/react';
import Footer from '@/components/layout/Footer';
import Header from '@/components/layout/Header';
import { AuthButton, AuthInput, AuthTitle } from '@/components/auth';
import StepBar from '@/components/StepBar';

export default function StoreSetupStep4() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');

	const email = searchParams.get('email') || localStorage.getItem('signupEmail') || '';
	const userType = searchParams.get('userType') || localStorage.getItem('signupUserType') || 'seller';

	const handleContinue = async () => {
		if (!password.trim() || !confirmPassword.trim()) {
			alert('Please enter a password and confirm it.');
			return;
		}

		if (password !== confirmPassword) {
			alert('Passwords do not match.');
			return;
		}

		setIsSubmitting(true);

		try {
			// Get data from localStorage
			const storeName = localStorage.getItem('storeName');
			const ownerName = localStorage.getItem('ownerName');
			const phone = localStorage.getItem('phone');
			const city = localStorage.getItem('city');
			const zipCode = localStorage.getItem('zipCode');
			const address = localStorage.getItem('address');
			const storeLatitude = localStorage.getItem('storeLatitude');
			const storeLongitude = localStorage.getItem('storeLongitude');

			console.error('📍 Retrieved from localStorage:', { storeLatitude, storeLongitude });

			console.log('📦 LocalStorage data check:', {
				storeName,
				ownerName,
				phone,
				city,
				zipCode,
				address,
				storeLatitude,
				storeLongitude,
				email,
				userType
			});

			if (!storeName || !ownerName || !phone) {
				alert('Missing setup information. Please go back and ensure all steps are completed.');
				setIsSubmitting(false);
				return;
			}

			// Map userType from 'seller' to 'vendor' if needed
			let role = userType;

			if (role === 'seller') {
				role = 'vendor';
			}

			const latNum = storeLatitude ? parseFloat(storeLatitude) : null;
			const lngNum = storeLongitude ? parseFloat(storeLongitude) : null;
			const hasValidCoords = latNum != null && !isNaN(latNum) && lngNum != null && !isNaN(lngNum);

			console.error('📍 Coordinate check:', {
				storeLatitude,
				storeLongitude,
				latNum,
				lngNum,
				hasValidCoords
			});

			// Collect all form data
			const formData: Record<string, unknown> = {
				name: ownerName,
				email: email,
				password: password,
				password_confirmation: confirmPassword,
				role: role,
				storeName: storeName,
				phone: phone,
				city: city || '',
				address: address || '',
				zip_code: zipCode || ''
			};

			if (hasValidCoords) {
				formData.latitude = latNum;
				formData.longitude = lngNum;
				console.error('📍 Adding coordinates to form data:', { latitude: latNum, longitude: lngNum });
			} else {
				console.error('📍 No valid coordinates to add to form data');
			}

			const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
			console.log('🌐 API URL:', apiUrl);
			console.log('📤 Submitting registration data:', {
				...formData,
				password: '***',
				password_confirmation: '***',
				kycDocument: 'not collected'
			});

			// Get CSRF cookie first (Sanctum)
			try {
				console.log('🔐 Fetching CSRF cookie...');
				await fetch(`${apiUrl}/sanctum/csrf-cookie`, {
					credentials: 'include'
				});
				console.log('✅ CSRF cookie fetched');
			} catch (e) {
				console.warn('⚠️ CSRF fetch failed (continuing anyway):', e);
			}

			const registerUrl = `${apiUrl}/api/register`;
			console.log('📡 POST to:', registerUrl);

			const response = await fetch(registerUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json'
				},
				credentials: 'include',
				body: JSON.stringify(formData)
			});

			console.log('📥 Response status:', response.status, response.statusText);

			// Read response text first, then try to parse as JSON
			const responseText = await response.text();
			console.log('📥 Raw response:', responseText.substring(0, 500));

			let data;
			try {
				data = JSON.parse(responseText);
			} catch (parseError) {
				console.error('❌ Failed to parse response as JSON:', parseError);
				throw new Error(
					`Server returned non-JSON response (status ${response.status}). Check the backend logs.`
				);
			}

			if (!response.ok) {
				console.error('❌ Registration error data:', data);
				const errorMsg = data.message || data.error || 'Registration failed';
				const errorDetails = data.errors
					? '\n' +
					Object.entries(data.errors)
						.map(
							([field, msgs]: [string, any]) =>
								`${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`
						)
						.join('\n')
					: '';
				throw new Error(errorMsg + errorDetails);
			}

			console.log('✅ Registration success:', data);

			// Clear localStorage setup data
			localStorage.removeItem('storeName');
			localStorage.removeItem('ownerName');
			localStorage.removeItem('phone');
			localStorage.removeItem('city');
			localStorage.removeItem('zipCode');
			localStorage.removeItem('address');
			localStorage.removeItem('storeLatitude');
			localStorage.removeItem('storeLongitude');
			localStorage.removeItem('signupEmail');
			localStorage.removeItem('signupUserType');
			localStorage.removeItem('deliveryAddress');

			// Auto sign-in after registration using NextAuth
			console.log('🔐 Auto signing in after registration...');
			const signInResult = await signIn('credentials', {
				email: email,
				password: password,
				formType: 'signin',
				redirect: false
			});

			if (signInResult && !signInResult.error) {
				// Get the session to store the token in localStorage
				const session = await getSession();

				if (session?.accessAuthToken && typeof window !== 'undefined') {
					localStorage.setItem('auth_token', session.accessAuthToken);
					localStorage.setItem('token', session.accessAuthToken);
				}

				console.log('✅ Auto sign-in successful, redirecting to dashboard...');
				// Navigate to dashboard
				window.location.href = '/dashboards';
			} else {
				console.warn('⚠️ Auto sign-in failed, redirecting to sign-in page...', signInResult?.error);
				setErrorMessage('Account created successfully! Please sign in.');
				setTimeout(() => router.push('/sign-in'), 2000);
			}
		} catch (error: any) {
			console.error('❌ Error submitting form:', error);
			setErrorMessage(error.message || 'An error occurred during registration');
			setIsSubmitting(false);
		}
	};

	return (
		<div className="min-h-screen flex flex-col ">
			<Header />
			{/* Main Content Area - Dark Gray Background */}
			<main className="flex-1 flex justify-center items-center py-12 px-4 ">
				{/* White Card */}
				<div className="w-full max-w-[512px] mx-auto md:py-[30px] md:px-8 px-5 py-4 bg-white !rounded-lg border border-[#D8DADC] relative">
					{/* Back Button - Top Left */}
					<button
						onClick={() => router.back()}
						className="absolute top-8 left-8 p-2 rounded-full border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-colors"
					>
						<ArrowBackIcon className="h-5 w-5 text-black" />
					</button>

					{/* Brand Name - Centered */}
					<div className="text-center mb-8 flex justify-center items-center">
						<img
							src={'/assets/images/MultiKonnect.svg'}
							alt="MultiKonnect"
							className="h-8 w-36 object-contain cursor-pointer"
						/>
					</div>

					<StepBar
						currentStep={4}
						totalSteps={4}
					/>

					{/* Heading - Left Aligned */}
					<AuthTitle
						heading="Setup Your Store Password!"
						align="center"
					/>

					{/* Form Fields */}
					<div className="space-y-4 mb-6">
						<div>
							<AuthInput
								label="Password"
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder="Enter password"
							/>

							{/* Password strength indicator */}
							<div className="mt-2">
								{/** Compute strength using memoized helper */}
								{(() => {
									function evaluate(pw: string) {
										const length = pw.length;
										let score = 0;
										const suggestions: string[] = [];

										if (length >= 12) score += 2;
										else if (length >= 8) score += 1;

										if (/[a-z]/.test(pw)) score += 1; else suggestions.push('Add lowercase letters');
										if (/[A-Z]/.test(pw)) score += 1; else suggestions.push('Add uppercase letters');
										if (/[0-9]/.test(pw)) score += 1; else suggestions.push('Add numbers');
										if (/[^a-zA-Z0-9]/.test(pw)) score += 1; else suggestions.push('Add symbols');

										if (length < 6) { score = Math.max(0, score - 1); suggestions.push('Make it longer (8+ chars)'); }

										let level: 'weak' | 'medium' | 'strong' = 'weak';
										if (score <= 2) level = 'weak'; else if (score <= 4) level = 'medium'; else level = 'strong';

										return { length, score, level, suggestions };
									}

									const s = evaluate(password);

									const pct = Math.min(100, (s.score / 6) * 100);
									const barColor = s.level === 'weak' ? '#ef4444' : s.level === 'medium' ? '#f59e0b' : '#10b981';
									return (
										<div>
											<div className="w-full bg-[#F3F4F6] rounded-full h-2 overflow-hidden">
												<div style={{ width: `${pct}%`, background: barColor, height: '100%', transition: 'width 150ms ease' }} />
											</div>
											<div className="mt-1 text-sm font-semibold" style={{ color: barColor }}>{s.level.charAt(0).toUpperCase() + s.level.slice(1)}</div>
											{s.suggestions.length > 0 && (
												<div id="pw-suggestions" className="mt-2 text-xs text-gray-600">
													{s.suggestions.slice(0, 3).map((sg, i) => <div key={i}>• {sg}</div>)}
												</div>
											)}
										</div>
									);
								})()}
							</div>
						</div>

						<div>
							<AuthInput
								label="Confirm Password"
								type="password"
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								placeholder="Confirm password"
							/>
						</div>
					</div>

					{/* Error Message Display */}
					{errorMessage && (
						<div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
							<p className="text-sm text-red-600 font-bold">{errorMessage}</p>
						</div>
					)}

					{/* Action Buttons */}
					<div className="flex gap-4 mb-6">
						<AuthButton
							onClick={handleContinue}
							disabled={
								!password.trim() ||
								!confirmPassword.trim() ||
								password !== confirmPassword ||
								isSubmitting
							}
							className={`flex-1 py-3 font-semibold rounded-lg text-white transition-colors ${password.trim() &&
									confirmPassword.trim() &&
									password === confirmPassword &&
									!isSubmitting
									? 'bg-[#FF6B35] hover:bg-[#FF5722]'
									: 'bg-gray-300 text-gray-500 cursor-not-allowed'
								}`}
						>
							{isSubmitting ? 'Creating...' : 'Continue'}
						</AuthButton>
					</div>

					{/* Footer Link */}
					<div className="text-center text-sm text-gray-600">
						Don't have an account?{' '}
						<Link
							href="/sign-up"
							className="text-[#FF6B35] underline"
						>
							Sign Up
						</Link>
					</div>
				</div>
			</main>

			{/* Footer - Dark Gray Background */}
			<Footer />
		</div>
	);
}

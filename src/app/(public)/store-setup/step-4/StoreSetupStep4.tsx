'use client';

import { useState, useCallback, useTransition, useMemo, memo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { signIn, getSession } from 'next-auth/react';
import Footer from '@/components/layout/Footer';
import Header from '@/components/layout/Header';
import { AuthButton, AuthInput, AuthTitle } from '@/components/auth';
import StepBar from '@/components/StepBar';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

// Inline SVG — removes MUI icons bundle
const BackArrow = memo(() => (
	<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
		<path d="M19 12H5M12 5l-7 7 7 7" />
	</svg>
));
BackArrow.displayName = 'BackArrow';

// Extracted outside component — was re-created on every keystroke inside an IIFE
function evaluatePassword(pw: string): { score: number; level: 'weak' | 'medium' | 'strong'; suggestions: string[]; pct: number; color: string } {
	let score = 0;
	const suggestions: string[] = [];

	if (pw.length >= 12) score += 2;
	else if (pw.length >= 8) score += 1;
	else suggestions.push('Make it longer (8+ chars)');

	if (/[a-z]/.test(pw)) score += 1; else suggestions.push('Add lowercase letters');
	if (/[A-Z]/.test(pw)) score += 1; else suggestions.push('Add uppercase letters');
	if (/[0-9]/.test(pw)) score += 1; else suggestions.push('Add numbers');
	if (/[^a-zA-Z0-9]/.test(pw)) score += 1; else suggestions.push('Add symbols');
	if (pw.length < 6) score = Math.max(0, score - 1);

	const level = score <= 2 ? 'weak' : score <= 4 ? 'medium' : 'strong';
	const color = level === 'weak' ? '#ef4444' : level === 'medium' ? '#f59e0b' : '#10b981';

	return { score, level, suggestions, pct: Math.min(100, (score / 6) * 100), color };
}

// Memoized strength bar — only re-renders when password changes
const PasswordStrength = memo(({ password }: { password: string }) => {
	const { pct, color, level, suggestions } = evaluatePassword(password);
	if (!password) return null;
	return (
		<div className="mt-2">
			<div className="w-full bg-[#F3F4F6] rounded-full h-2 overflow-hidden">
				<div style={{ width: `${pct}%`, background: color, height: '100%', transition: 'width 150ms ease' }} />
			</div>
			<div className="mt-1 text-sm font-semibold" style={{ color }}>{level.charAt(0).toUpperCase() + level.slice(1)}</div>
			{suggestions.length > 0 && (
				<div className="mt-2 text-xs text-gray-600">
					{suggestions.slice(0, 3).map((s, i) => <div key={i}>• {s}</div>)}
				</div>
			)}
		</div>
	);
});
PasswordStrength.displayName = 'PasswordStrength';

// Batch-remove localStorage keys in one pass
const STORAGE_KEYS = ['storeName', 'ownerName', 'phone', 'city', 'zipCode', 'address', 'storeLatitude', 'storeLongitude', 'signupEmail', 'signupUserType', 'deliveryAddress'];

export default function StoreSetupStep4() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [errorMessage, setErrorMessage] = useState('');
	const [isPending, startTransition] = useTransition();

	const email = searchParams.get('email') || localStorage.getItem('signupEmail') || '';
	const userType = searchParams.get('userType') || localStorage.getItem('signupUserType') || 'seller';

	// Memoized so button disabled check doesn't recompute on unrelated renders
	const isValid = useMemo(() =>
		password.trim().length > 0 && confirmPassword.trim().length > 0 && password === confirmPassword,
		[password, confirmPassword]
	);

	const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value), []);
	const handleConfirmChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value), []);

	const handleContinue = useCallback(() => {
		if (!isValid) return;

		startTransition(async () => {
			setErrorMessage('');

			const storeName = localStorage.getItem('storeName');
			const ownerName = localStorage.getItem('ownerName');
			const phone = localStorage.getItem('phone');

			if (!storeName || !ownerName || !phone) {
				setErrorMessage('Missing setup information. Please go back and ensure all steps are completed.');
				return;
			}

			const role = userType === 'seller' ? 'vendor' : userType;
			const latNum = parseFloat(localStorage.getItem('storeLatitude') || '');
			const lngNum = parseFloat(localStorage.getItem('storeLongitude') || '');
			const hasValidCoords = !isNaN(latNum) && !isNaN(lngNum);

			const formData: Record<string, unknown> = {
				name: ownerName,
				email,
				password,
				password_confirmation: confirmPassword,
				role,
				storeName,
				phone,
				city: localStorage.getItem('city') || '',
				address: localStorage.getItem('address') || '',
				zip_code: localStorage.getItem('zipCode') || '',
				...(hasValidCoords && { latitude: latNum, longitude: lngNum }),
			};

			try {
				// Fire CSRF best-effort, don't block registration on it
				fetch(`${API_URL}/sanctum/csrf-cookie`, { credentials: 'include' }).catch(() => { });

				const response = await fetch(`${API_URL}/api/register`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
					credentials: 'include',
					body: JSON.stringify(formData),
				});

				const responseText = await response.text();
				let data: any;
				try { data = JSON.parse(responseText); } catch {
					throw new Error(`Server returned non-JSON response (status ${response.status}).`);
				}

				if (!response.ok) {
					const errorDetails = data.errors
						? '\n' + Object.entries(data.errors).map(([f, m]: [string, any]) => `${f}: ${Array.isArray(m) ? m.join(', ') : m}`).join('\n')
						: '';
					throw new Error((data.message || data.error || 'Registration failed') + errorDetails);
				}

				// Batch-clear localStorage in one loop
				STORAGE_KEYS.forEach((k) => localStorage.removeItem(k));

				const signInResult = await signIn('credentials', {
					email,
					password,
					formType: 'signin',
					redirect: false,
				});

				if (signInResult && !signInResult.error) {
					const session = await getSession();
					if (session?.accessAuthToken) {
						localStorage.setItem('auth_token', session.accessAuthToken);
						localStorage.setItem('token', session.accessAuthToken);
					}
					window.location.href = '/apps/e-commerce/my-store';
				} else {
					setErrorMessage('Account created successfully! Please sign in.');
					setTimeout(() => router.push('/sign-in'), 2000);
				}
			} catch (error: any) {
				setErrorMessage(error.message || 'An error occurred during registration');
			}
		});
	}, [isValid, email, userType, password, confirmPassword, router]);

	return (
		<div className="min-h-screen flex flex-col">
			<Header />
			<main className="flex-1 flex justify-center items-center py-12 px-4">
				<div className="w-full max-w-[512px] mx-auto md:py-[30px] md:px-8 px-5 py-4 bg-white rounded-lg border border-[#D8DADC] relative">
					<button onClick={() => history.back()} className="absolute top-8 left-8 p-2 rounded-full border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-colors" aria-label="Go back" type="button">
						<BackArrow />
					</button>

					<div className="text-center mb-8 flex justify-center items-center">
						<Image src="/assets/images/MultiKonnect.svg" alt="MultiKonnect" width={144} height={32} priority className="h-8 w-36 object-contain cursor-pointer" />
					</div>

					<StepBar currentStep={4} totalSteps={4} />

					<AuthTitle heading="Setup Your Store Password!" align="center" />

					<div className="space-y-4 mb-6">
						<div>
							<AuthInput label="Password" type="password" value={password} onChange={handlePasswordChange} placeholder="Enter password" />
							<PasswordStrength password={password} />
						</div>
						<AuthInput label="Confirm Password" type="password" value={confirmPassword} onChange={handleConfirmChange} placeholder="Confirm password" />
					</div>

					{errorMessage && (
						<div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
							<p className="text-sm text-red-600 font-bold">{errorMessage}</p>
						</div>
					)}

					<div className="flex gap-4 mb-6">
						<AuthButton onClick={handleContinue} disabled={!isValid || isPending} variant="primary" fullWidth>
							{isPending ? 'Creating...' : 'Continue'}
						</AuthButton>
					</div>

					<div className="text-center text-sm text-gray-600">
						Don't have an account?{' '}
						<Link href="/sign-up" className="text-[#FF6B35] underline">Sign Up</Link>
					</div>
				</div>
			</main>
			<Footer />
		</div>
	);
}
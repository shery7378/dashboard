'use client';

import React, { useState, useCallback, useTransition, memo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Footer from '@/components/layout/Footer';
import Header from '@/components/layout/Header';
import { AuthInput, AuthTitle, AuthButton } from '@/components/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

// Memoized radio option to prevent re-renders on email change
const UserTypeRadio = memo(({ type, label, selected, onSelect }: {
	type: string;
	label: string;
	selected: boolean;
	onSelect: (type: string) => void;
}) => (
	<label className="flex items-center gap-3 cursor-pointer" onClick={() => onSelect(type)}>
		<div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${selected ? 'border-[#F44322] bg-white' : 'border-gray-400 bg-white'}`}>
			{selected && <div className="w-2.5 h-2.5 rounded-full bg-[#F44322]" />}
		</div>
		<span className={`text-base ${selected ? 'text-gray-800 font-semibold' : 'text-gray-500 font-normal'}`}>{label}</span>
	</label>
));
UserTypeRadio.displayName = 'UserTypeRadio';

// Memoized social button to prevent re-renders
const SocialButton = memo(({ src, alt, label }: { src: string; alt: string; label: string }) => (
	<button className="flex items-center justify-center gap-3 w-full h-14 rounded-2xl border border-[#DCDEE0] bg-white transition-colors px-4">
		<Image src={src} alt={alt} width={24} height={24} className="w-6 h-6 flex-shrink-0" />
		<span className="text-[#111111] text-base">{label}</span>
	</button>
));
SocialButton.displayName = 'SocialButton';

export default function SignUpPage() {
	const router = useRouter();
	const [email, setEmail] = useState('');
	const [userType, setUserType] = useState('seller');
	const [errorMessage, setErrorMessage] = useState('');
	const [isPending, startTransition] = useTransition();

	// useCallback prevents recreation on every render
	const handleUserTypeChange = useCallback((type: string) => {
		setUserType(type);
	}, []);

	const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		setEmail(e.target.value);
		if (errorMessage) setErrorMessage('');
	}, [errorMessage]);

	const handleContinue = useCallback(async (e: React.MouseEvent<HTMLButtonElement>) => {
		e.preventDefault();
		const trimmed = email.trim();
		if (!trimmed || isPending) return;

		const normalizedEmail = trimmed.toLowerCase();

		startTransition(async () => {
			try {
				// Fire CSRF and OTP requests — CSRF is best-effort, don't await sequentially
				fetch(`${API_URL}/sanctum/csrf-cookie`, { credentials: 'include' }).catch(() => { });

				const res = await fetch(`${API_URL}/api/send-code`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					credentials: 'include',
					body: JSON.stringify({ email: normalizedEmail }),
				});

				if (!res.ok) {
					const contentType = res.headers.get('content-type');
					let msg = 'Failed to send verification code. Please try again.';
					if (contentType?.includes('application/json')) {
						try { msg = (await res.json()).message || msg; } catch { }
					}
					setErrorMessage(msg);
					return;
				}

				// Batch storage writes
				localStorage.setItem('signupEmail', normalizedEmail);
				localStorage.setItem('signupUserType', userType);
				sessionStorage.setItem(`otp_sent_${normalizedEmail}`, 'true');

				// Remove artificial 500ms delay — unnecessary with proper backend
				router.push(`/verify-otp?email=${encodeURIComponent(normalizedEmail)}&userType=${userType}`);
			} catch (error: any) {
				setErrorMessage(error.message || 'An error occurred. Please try again.');
			}
		});
	}, [email, userType, isPending, router]);

	return (
		<div className="min-h-screen flex flex-col">
			<Header />
			<main className="flex-1 flex justify-center items-center py-12 px-4 bg-white">
				<div className="w-full max-w-[512px] mx-auto md:py-[30px] md:px-8 px-5 py-4 bg-white rounded-lg border border-[#D8DADC]">
					<div className="text-center mb-8 flex justify-center items-center">
						<Image src="/assets/images/MultiKonnect.svg" alt="MultiKonnect" width={137} height={39} className="h-[39px] w-[137px] object-contain cursor-pointer" priority />
					</div>

					<AuthTitle heading="What your Phone Number or Email?" subtitle="Get food, drinks, groceries, and more delivered." />

					<div className="flex gap-12 mb-6">
						<UserTypeRadio type="seller" label="Seller" selected={userType === 'seller'} onSelect={handleUserTypeChange} />
						<UserTypeRadio type="supplier" label="Supplier" selected={userType === 'supplier'} onSelect={handleUserTypeChange} />
					</div>

					<div className="mb-6">
						<AuthInput label="Enter phone (7700 900123) or Email" type="email" value={email} onChange={handleEmailChange} placeholder="Your email" className={errorMessage ? 'mb-2' : ''} />
						{errorMessage && <p className="text-red-600 text-sm font-bold mt-2">{errorMessage}</p>}
					</div>

					<AuthButton variant="primary" fullWidth loading={isPending} disabled={!email.trim() || isPending} onClick={handleContinue} className="mb-6">
						Continue
					</AuthButton>

					<div className="flex items-center mb-4">
						<div className="flex-auto border-t border-gray-200" />
						<span className="mx-2 text-[15.22px] font-normal text-[#6B6B6B]">Or continue with</span>
						<div className="flex-auto border-t border-gray-200" />
					</div>

					<div className="flex flex-col gap-4 mb-6">
						<SocialButton src="/assets/images/google.svg" alt="Google" label="Continue with Google" />
						<SocialButton src="/assets/images/apple.svg" alt="Apple" label="Continue with Apple" />
					</div>

					<div className="text-center text-sm text-gray-600">
						<span className="mt-2 text-center text-[#000000B2]">
							Don't have an account?{' '}
							<Link href="/sign-up" className="text-vivid-red font-semibold">Sign up</Link>
						</span>
					</div>
				</div>
			</main>
			<Footer />
		</div>
	);
}
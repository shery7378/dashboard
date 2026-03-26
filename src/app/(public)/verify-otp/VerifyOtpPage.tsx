'use client';

import React, { useState, useEffect, useCallback, useRef, useTransition, memo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Footer from '@/components/layout/Footer';
import Header from '@/components/layout/Header';
import { AuthButton, AuthTitle } from '@/components/auth';
import StepBar from '@/components/StepBar';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

// Extracted + memoized to prevent re-renders on every OTP keystroke
const BackArrow = memo(() => (
	<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
		<path d="M19 12H5M12 5l-7 7 7 7" />
	</svg>
));
BackArrow.displayName = 'BackArrow';

// Shared helper — deduplicates 4 identical fetch blocks into one
async function verifyCode(email: string, code: string): Promise<{ ok: boolean; error?: string; data?: any }> {
	fetch(`${API_URL}/sanctum/csrf-cookie`, { credentials: 'include' }).catch(() => { });

	const res = await fetch(`${API_URL}/api/verify-code`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
		credentials: 'include',
		body: JSON.stringify({ email, code }),
	});

	if (!res.ok) {
		let msg = 'Invalid verification code. Please try again.';
		if (res.headers.get('content-type')?.includes('application/json')) {
			try {
				const { message = msg } = await res.json();
				if (message.includes('expired') || message.includes('Expired')) msg = 'Code has expired. Please request a new code.';
				else if (message.includes('No verification code found')) msg = 'No verification code found. Please request a new code.';
				else if (message.includes('invalid') || message.includes('Invalid') || message.includes('mismatch')) msg = 'Invalid code. Please try again.';
				else msg = message;
			} catch { }
		}
		return { ok: false, error: msg };
	}

	return { ok: true, data: await res.json() };
}

export default function VerifyOtpPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [otp, setOtp] = useState(['', '', '', '']);
	const [isResending, setIsResending] = useState(false);
	const [countdown, setCountdown] = useState(0);
	const [errorMessage, setErrorMessage] = useState('');
	const [isPending, startTransition] = useTransition();
	// Refs for direct DOM focus — no getElementById needed
	const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

	const email = searchParams.get('email') || (typeof window !== 'undefined' ? localStorage.getItem('signupEmail') : '') || '';
	const userType = searchParams.get('userType') || (typeof window !== 'undefined' ? localStorage.getItem('signupUserType') : '') || 'seller';
	const normalizedEmail = email.trim().toLowerCase();

	// Countdown timer
	useEffect(() => {
		if (countdown <= 0) return;
		const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
		return () => clearTimeout(timer);
	}, [countdown]);

	// Send OTP on mount if not already sent
	useEffect(() => {
		if (!normalizedEmail) return;
		if (sessionStorage.getItem(`otp_sent_${normalizedEmail}`)) {
			setCountdown(60);
			return;
		}
		fetch(`${API_URL}/sanctum/csrf-cookie`, { credentials: 'include' }).catch(() => { });
		fetch(`${API_URL}/api/send-code`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'include',
			body: JSON.stringify({ email: normalizedEmail }),
		}).then((res) => {
			if (res.ok) {
				sessionStorage.setItem(`otp_sent_${normalizedEmail}`, 'true');
				setCountdown(60);
			}
		}).catch(() => { });
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const navigateNext = useCallback((email: string, userType: string) => {
		router.push(`/store-setup/step-2?email=${encodeURIComponent(email)}&userType=${encodeURIComponent(userType)}`);
	}, [router]);

	const submitVerify = useCallback((otpArr: string[]) => {
		const code = otpArr.join('');
		if (code.length !== 4) return;

		startTransition(async () => {
			setErrorMessage('');
			const result = await verifyCode(normalizedEmail, code);
			if (!result.ok) {
				setErrorMessage(result.error || 'Verification failed.');
				return;
			}
			navigateNext(normalizedEmail, userType);
		});
	}, [normalizedEmail, userType, navigateNext]);

	const handleOtpChange = useCallback((index: number, value: string) => {
		if (isNaN(Number(value))) return;
		const digit = value.slice(-1);

		setOtp((prev) => {
			const next = [...prev];
			next[index] = digit;

			// Auto-focus next
			if (digit && index < 3) {
				inputRefs.current[index + 1]?.focus();
			}

			// Auto-verify on last digit
			if (index === 3 && digit) {
				setTimeout(() => submitVerify(next), 200);
			}

			return next;
		});
	}, [submitVerify]);

	const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Backspace' && !otp[index] && index > 0) {
			inputRefs.current[index - 1]?.focus();
		}
	}, [otp]);

	const handleResend = useCallback(async () => {
		if (countdown > 0 || isResending) return;
		setIsResending(true);
		setErrorMessage('');

		try {
			fetch(`${API_URL}/sanctum/csrf-cookie`, { credentials: 'include' }).catch(() => { });
			const res = await fetch(`${API_URL}/api/send-code`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ email: normalizedEmail }),
			});

			if (!res.ok) {
				let msg = 'Failed to resend verification code. Please try again.';
				if (res.headers.get('content-type')?.includes('application/json')) {
					try { msg = (await res.json()).message || msg; } catch { }
				}
				setErrorMessage(msg);
				return;
			}

			sessionStorage.setItem(`otp_sent_${normalizedEmail}`, 'true');
			setCountdown(60);
			setOtp(['', '', '', '']);
			inputRefs.current[0]?.focus();
		} catch (error: any) {
			setErrorMessage(error.message || 'An error occurred. Please try again.');
		} finally {
			setIsResending(false);
		}
	}, [countdown, isResending, normalizedEmail]);

	return (
		<div className="min-h-screen flex flex-col bg-white">
			<Header />
			<main className="flex-1 flex justify-center items-center py-12 px-4 bg-white">
				<div className="w-full max-w-[512px] mx-auto md:py-[30px] md:px-8 px-5 py-4 bg-white rounded-lg border border-[#D8DADC] relative">
					<button onClick={() => history.back()} className="absolute top-8 left-8 p-2 z-30 rounded-full border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-colors" aria-label="Go back" type="button">
						<BackArrow />
					</button>

					<div className="text-center mb-8 z-20 flex justify-center items-center">
						<Image src="/assets/images/MultiKonnect.svg" alt="MultiKonnect" width={144} height={32} priority className="h-8 w-36 object-contain cursor-pointer" />
					</div>

					<StepBar currentStep={1} totalSteps={4} />

					<AuthTitle heading="Enter the 4 Digit code Sent to you" subtitle={normalizedEmail || 'your email'} align="left" />

					{/* OTP inputs — inline style removed, replaced with Tailwind focus-visible */}
					<div className="flex justify-between gap-4 mb-6">
						{otp.map((digit, index) => (
							<input
								key={index}
								ref={(el) => { inputRefs.current[index] = el; }}
								id={`otp-${index}`}
								type="text"
								inputMode="numeric"
								value={digit}
								onChange={(e) => handleOtpChange(index, e.target.value)}
								onKeyDown={(e) => handleKeyDown(index, e)}
								className="w-20 h-16 text-center rounded-md bg-gray-100 border-2 border-transparent focus:border-[#F44322] focus:outline-none transition-colors"
								maxLength={1}
							/>
						))}
					</div>

					{errorMessage && (
						<div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
							<p className="text-sm text-red-600 font-bold">{errorMessage}</p>
						</div>
					)}

					<p className="text-xs text-left text-gray-500 mb-2">
						<span className="font-semibold">Tip:</span> Make sure to check your inbox and spam folder
					</p>

					<div className="flex gap-4 mb-6">
						<AuthButton onClick={handleResend} disabled={countdown > 0 || isResending} variant="secondary" fullWidth>
							{countdown > 0 ? `Resend (${countdown}s)` : 'Resend'}
						</AuthButton>
						<AuthButton onClick={() => submitVerify(otp)} disabled={otp.join('').length !== 4 || isPending} variant="primary" fullWidth>
							Verify Code
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
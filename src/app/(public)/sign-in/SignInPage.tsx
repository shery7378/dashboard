'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { Suspense, memo } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { AuthTitle } from '@/components/auth';

const AuthJsForm = dynamic(() => import('@auth/forms/AuthJsForm'), {
	loading: () => (
		<div className="mt-4 space-y-3 animate-pulse">
			<div className="h-10 bg-gray-100 rounded-md" />
			<div className="h-10 bg-gray-100 rounded-md" />
			<div className="h-10 bg-red-100 rounded-md" />
		</div>
	),
	ssr: false,
});

const BackArrow = memo(() => (
	<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
		<path d="M19 12H5M12 5l-7 7 7 7" />
	</svg>
));
BackArrow.displayName = 'BackArrow';

export default function SignInPage() {
	return (
		<div className="min-h-screen flex flex-col bg-gray-50">
			<Header />
			<main className="flex flex-1 items-center justify-center px-4 py-12">
				<div className="w-full max-w-[512px] mx-auto md:py-[30px] md:px-8 px-5 py-4 bg-white rounded-lg border border-[#D8DADC] relative">
					<button onClick={() => history.back()} className="absolute top-8 left-8 p-2 rounded-full border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-colors z-10" aria-label="Go back" type="button">
						<BackArrow />
					</button>
					<div className="mb-6 text-center flex justify-center items-center">
						<Image src="/assets/images/MultiKonnect.svg" alt="MultiKonnect" width={144} height={32} priority className="object-contain cursor-pointer" />
					</div>
					<AuthTitle heading="Welcome back 👋" subtitle="Sign in to your account to continue" align="center" />
					<Suspense fallback={
						<div className="mt-4 space-y-3 animate-pulse">
							<div className="h-10 bg-gray-100 rounded-md" />
							<div className="h-10 bg-gray-100 rounded-md" />
							<div className="h-10 bg-red-100 rounded-md" />
						</div>
					}>
						<AuthJsForm formType="signin" />
					</Suspense>
					<div className="mt-6 text-center text-sm">
						<span className="text-gray-600">Don't have an account?</span>
						<a href="/sign-up" className="ml-1 font-semibold text-red-600 hover:text-red-700">Sign up</a>
					</div>
				</div>
			</main>
			<Footer />
		</div>
	);
}
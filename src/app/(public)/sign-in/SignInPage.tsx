'use client';

import { useRouter } from 'next/navigation';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AuthJsForm from '@auth/forms/AuthJsForm';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { AuthTitle } from '@/components/auth';

export default function SignInPage() {
	const router = useRouter();

	return (
		<div className="min-h-screen flex flex-col bg-gray-50">
			{/* Header */}
			<Header />

			{/* Main Content */}
			<main className="flex flex-1 items-center justify-center px-4 py-12">
				<div className="w-full max-w-[512px] mx-auto md:py-[30px] md:px-8 px-5 py-4 bg-white !rounded-lg border border-[#D8DADC] relative">
					{/* Back Button */}
					<button
						onClick={() => router.back()}
						className="absolute top-8 left-8 p-2 rounded-full border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-colors z-10"
						aria-label="Go back"
						type="button"
					>
						<ArrowBackIcon className="h-5 w-5 text-black" />
					</button>
					{/* Logo */}
					<div className="mb-6 text-center flex justify-center items-center">
						<img
							src={'/assets/images/MultiKonnect.svg'}
							alt="MultiKonnect"
							className="h-8 w-36 object-contain cursor-pointer"
						/>
					</div>

					<AuthTitle
						heading="Welcome back 👋"
						subtitle="Sign in to your account to continue"
						align="center"
					/>

					{/* Form */}
					<AuthJsForm formType="signin" />

					{/* Footer Link */}
					<div className="mt-6 text-center text-sm">
						<span className="text-gray-600">Don’t have an account?</span>
						<a
							href="/sign-up"
							className="ml-1 font-semibold text-red-600 hover:text-red-700"
						>
							Sign up
						</a>
					</div>
				</div>
			</main>

			{/* Footer */}
			<Footer />
		</div>
	);
}

'use client';

import { Controller, useForm } from 'react-hook-form';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import _ from 'lodash';
import Paper from '@mui/material/Paper';
import Link from '@fuse/core/Link';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CardContent, Alert } from '@mui/material';
import { useState, memo } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Image from 'next/image';
import { AuthTitle } from '@/components/auth';

/**
 * Form Validation Schema
 */
const schema = z.object({
	email: z.string().email('You must enter a valid email').nonempty('You must enter an email')
});

const defaultValues = {
	email: ''
};

const BackArrow = memo(() => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="20"
		height="20"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		aria-hidden="true"
	>
		<path d="M19 12H5M12 5l-7 7 7 7" />
	</svg>
));
BackArrow.displayName = 'BackArrow';

/**
 * The classic forgot password page.
 */
function ClassicForgotPasswordPage() {
	const { control, formState, handleSubmit, reset } = useForm({
		mode: 'onChange',
		defaultValues,
		resolver: zodResolver(schema)
	});

	const { isValid, dirtyFields, errors } = formState;
	const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

	async function onSubmit({ email }: { email: string }) {
		try {
			// Fetch CSRF cookie
			await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sanctum/csrf-cookie`, {
				credentials: 'include'
			});

			const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/forgot-password`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				credentials: 'include',
				body: JSON.stringify({ email })
			});

			if (!res.ok) {
				const errorData = await res.json();
				throw new Error(errorData.message || 'Failed to send password reset link.');
			}

			setAlert({
				type: 'success',
				message: 'Password reset link sent to your email.'
			});
			reset(defaultValues);
		} catch (error) {
			setAlert({
				type: 'error',
				message: error.message || 'An error occurred while sending the reset link.'
			});
		}
	}

	return (
		<div className="min-h-screen flex flex-col bg-gray-50">
			<Header />

			<main className="flex flex-1 items-center justify-center px-4 py-12">
				<div className="w-full max-w-[512px] mx-auto md:py-[30px] md:px-8 px-5 py-4 bg-white rounded-lg border border-[#D8DADC] relative">
					<button
						onClick={() => history.back()}
						className="absolute top-8 left-8 p-2 rounded-full border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-colors z-10"
						aria-label="Go back"
						type="button"
					>
						<BackArrow />
					</button>

					<div className="mb-6 text-center flex justify-center items-center">
						<Image
							src="/assets/images/MultiKonnect.svg"
							alt="MultiKonnect"
							width={144}
							height={32}
							priority
							className="object-contain cursor-pointer"
						/>
					</div>

					<AuthTitle
						heading="Forgot password?"
						subtitle="Fill the email to reset your password"
						align="center"
					/>

					{alert && (
						<Alert
							className="mb-4 w-full"
							severity={alert.type}
							sx={(theme) => ({
								backgroundColor:
									alert.type === 'success' ? theme.palette.success.light : theme.palette.error.light,
								color: alert.type === 'success' ? theme.palette.success.dark : theme.palette.error.dark
							})}
						>
							{alert.message}
						</Alert>
					)}

					<form
						name="registerForm"
						noValidate
						className="mt-8 flex w-full flex-col justify-center"
						onSubmit={handleSubmit(onSubmit)}
					>
						<Controller
							name="email"
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									className="mb-6"
									label="Email"
									type="email"
									error={!!errors.email}
									helperText={errors?.email?.message}
									variant="outlined"
									required
									fullWidth
								/>
							)}
						/>

						<Button
							variant="contained"
							color="secondary"
							className="mt-1 w-full"
							aria-label="Register"
							disabled={_.isEmpty(dirtyFields) || !isValid}
							type="submit"
							size="large"
						>
							Send Reset Link
						</Button>

						<div className="mt-6 flex items-center justify-center gap-1 font-medium">
							<Typography
								className="text-gray-600"
								variant="body2"
							>
								Return to
							</Typography>
							<Link
								className="font-semibold text-red-600 hover:text-red-700"
								to="/sign-in"
							>
								Sign in
							</Link>
						</div>
					</form>
				</div>
			</main>

			<Footer />
		</div>
	);
}

export default ClassicForgotPasswordPage;

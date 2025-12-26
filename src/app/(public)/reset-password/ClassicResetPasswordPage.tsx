'use client';

import { Controller, useForm } from 'react-hook-form';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Link from '@fuse/core/Link';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, CardContent } from '@mui/material';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

/**
 * Form Validation Schema
 */
const schema = z
	.object({
		password: z
			.string()
			.nonempty('Please enter your password.')
			.min(8, 'Password is too short - should be 8 chars minimum.')
			.regex(/[0-9]/, 'Password must contain at least one digit.')
			.regex(/[^0-9]/, 'Password must contain at least one non-digit.'),
		passwordConfirm: z.string().nonempty('Password confirmation is required'),
	})
	.refine((data) => data.password === data.passwordConfirm, {
		message: 'Passwords must match',
		path: ['passwordConfirm'],
	});

const defaultValues = {
	password: '',
	passwordConfirm: '',
};

/**
 * The classic reset password page.
 */
function ClassicResetPasswordPage() {
	const { control, formState, handleSubmit, reset, setError } = useForm({
		mode: 'onChange',
		defaultValues,
		resolver: zodResolver(schema),
	});

	const { isValid, dirtyFields, errors } = formState;
	const router = useRouter();
	const searchParams = useSearchParams();
	const [serverError, setServerError] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);

	const token = searchParams.get('token');
	const email = searchParams.get('email');

	async function onSubmit(formData: z.infer<typeof schema>) {
		try {
			// Fetch CSRF cookie
			await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sanctum/csrf-cookie`, {
				credentials: 'include',
			});

			// Send password reset request to the backend
			const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reset-password`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include',
				body: JSON.stringify({
					email,
					token,
					new_password: formData.password,
					new_password_confirmation: formData.passwordConfirm,
				}),
			});

			const data = await res.json();

			if (!res.ok) {
				throw new Error(data.message || 'Failed to reset password. Please try again.');
			}

			setSuccessMessage('Password reset successfully. Redirecting to sign-in...');
			setServerError(null);
			reset(defaultValues);

			// Redirect to sign-in page after a short delay
			setTimeout(() => {
				router.push('/sign-in');
			}, 5000);
		} catch (error) {
			setServerError(error.message || 'An unexpected error occurred. Please try again.');
			setSuccessMessage(null);
		}
	}

	return (
		<div className="flex min-w-0 flex-auto flex-col items-center sm:justify-center bg-[#F7F7F8]">
			<Paper className="min-h-full w-full rounded-none px-4 py-8 sm:min-h-auto sm:w-[420px] sm:rounded-xl sm:p-7.5 sm:shadow-sm border border-gray-200 bg-white">
				<CardContent className="w-full flex flex-col items-center p-0">
					{/* <img
            className="w-12"
            src="/assets/images/logo/logo.svg"
            alt="logo"
          /> */}
					<Typography color="primary" className="text-4xl font-extrabold leading-[1.25] tracking-tight text-center">
						MultiKonnect
					</Typography>
					<Typography className="text-3xl font-bold tracking-tight text-center">
						Reset your password
					</Typography>
					<Typography color="textSecondary" className="mt-2 text-sm text-center">
						Create a new password for your account
					</Typography>

					<form
						name="resetPasswordForm"
						noValidate
						className="mt-8 flex w-full flex-col justify-center"
						onSubmit={handleSubmit(onSubmit)}
					>
						{(serverError || successMessage) && (
							<Alert
								className="mb-4"
								severity={successMessage ? 'success' : 'error'}
								sx={(theme) => ({
									backgroundColor: successMessage
										? theme.palette.success.light
										: theme.palette.error.light,
									color: successMessage ? theme.palette.success.dark : theme.palette.error.dark,
								})}
							>
								{successMessage || serverError}
							</Alert>
						)}

						<Controller
							name="password"
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									className="mb-6"
									label="Password"
									type="password"
									error={!!errors.password}
									helperText={errors?.password?.message}
									variant="outlined"
									required
									fullWidth
								/>
							)}
						/>

						<Controller
							name="passwordConfirm"
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									className="mb-6"
									label="Password (Confirm)"
									type="password"
									error={!!errors.passwordConfirm}
									helperText={errors?.passwordConfirm?.message}
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
							aria-label="Reset Password"
							disabled={!isValid || !token || !email}
							type="submit"
							size="large"
						>
							Reset Your Password
						</Button>

						<div className="mt-6 flex items-center justify-center gap-1 font-medium">
							<Typography className="text-gray-600" variant="body2">
								Return to
							</Typography>
							<Link className="font-semibold" to="/sign-in">
								Sign in
							</Link>
						</div>
					</form>
				</CardContent>
			</Paper>
		</div>
	);
}

export default ClassicResetPasswordPage;
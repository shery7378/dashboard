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
import { useState } from 'react';

/**
 * Form Validation Schema
 */
const schema = z.object({
	email: z.string().email('You must enter a valid email').nonempty('You must enter an email')
});

const defaultValues = {
	email: ''
};

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
				credentials: 'include',
			});

			const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/forgot-password`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include',
				body: JSON.stringify({ email }),
			});

			if (!res.ok) {
				const errorData = await res.json();
				throw new Error(errorData.message || 'Failed to send password reset link.');
			}

			setAlert({
				type: 'success',
				message: 'Password reset link sent to your email.',
			});
			reset(defaultValues);
		} catch (error) {
			setAlert({
				type: 'error',
				message: error.message || 'An error occurred while sending the reset link.',
			});
		}
	}

	return (
		<div className="flex min-w-0 flex-auto flex-col items-center sm:justify-center bg-[#F7F7F8]">
			<Paper className="min-h-full w-full rounded-none px-4 py-8 sm:min-h-auto sm:w-[420px] sm:rounded-xl sm:p-7.5 sm:shadow-sm border border-gray-200 bg-white">
				<CardContent className="w-full flex flex-col items-center p-0">
					<Typography color="primary" className="text-4xl font-extrabold leading-[1.25] tracking-tight text-center">
						MultiKonnect
					</Typography>

					<Typography className="text-3xl font-bold tracking-tight text-center">
						Forgot password?
					</Typography>

					<Typography color="textSecondary" className="mt-2 text-sm text-center">
						Fill the email to reset your password
					</Typography>

					{alert && (
						<Alert
							className="mb-4 w-full"
							severity={alert.type}
							sx={(theme) => ({
								backgroundColor: alert.type === 'success'
									? theme.palette.success.light
									: theme.palette.error.light,
								color: alert.type === 'success'
									? theme.palette.success.dark
									: theme.palette.error.dark,
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

export default ClassicForgotPasswordPage;
//src/@auth/forms/AuthJsCredentialsSignInForm.jsx
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { z } from 'zod';
import _ from 'lodash';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Link from '@fuse/core/Link';
import Button from '@mui/material/Button';
import { signIn, getSession } from 'next-auth/react';
import { Alert } from '@mui/material';
import signinErrors from './signinErrors';
// import { useSnackbar } from 'notistack';

/**
 * Form Validation Schema
 */
const schema = z.object({
	email: z.string().email('You must enter a valid email').nonempty('You must enter an email'),
	password: z
		.string()
		.min(4, 'Password is too short - must be at least 4 chars.')
		.nonempty('Please enter your password.'),
	remember: z.boolean().optional()
});

type FormType = z.infer<typeof schema>;

const defaultValues = {
	email: '',
	password: '',
	remember: true
};

function AuthJsCredentialsSignInForm() {
	const { control, formState, handleSubmit, setValue, setError } = useForm<FormType>({
		mode: 'onChange',
		defaultValues,
		resolver: zodResolver(schema)
	});

	const { isValid, dirtyFields, errors } = formState;

	// useEffect(() => {
	// 	setValue('email', 'admin@fusetheme.com', {
	// 		shouldDirty: true,
	// 		shouldValidate: true
	// 	});
	// 	setValue('password', '5;4+0IOx:\\Dy', {
	// 		shouldDirty: true,
	// 		shouldValidate: true
	// 	});
	// }, [setValue]);

async function onSubmit(formData: FormType) {
	const { email, password } = formData;
	// const { enqueueSnackbar } = useSnackbar(); // ✅ useSnackbar inside component

	const result = await signIn('credentials', {
		email,
		password,
		formType: 'signin',
		redirect: false
	});

	if (!result?.error) {
		// After successful sign-in, get the session to retrieve the token and store it in localStorage as fallback
		const session = await getSession();
		if (session?.accessAuthToken && typeof window !== 'undefined') {
			localStorage.setItem('auth_token', session.accessAuthToken);
			localStorage.setItem('token', session.accessAuthToken);
		}
		
		// enqueueSnackbar('Successfully signed in!', { variant: 'success' }); // ✅ success toast
		window.location.href = '/dashboards';
	} else {

		setError('root', {
			type: 'manual',
			message: signinErrors[result.error]
		});
		// enqueueSnackbar(signinErrors[result.error] || 'Sign-in failed.', { variant: 'error' }); // ✅ error toast
	}

	return true;
}

	return (
		<form
			name="loginForm"
			noValidate
			className="mt-4 flex w-full flex-col justify-center"
			onSubmit={handleSubmit(onSubmit)}
		>
			{errors?.root?.message && (
				<Alert
					className="mb-4"
					severity="error"
					sx={(theme) => ({
						backgroundColor: theme.palette.error.light,
						color: theme.palette.error.dark
					})}
				>
					{errors?.root?.message}
				</Alert>
			)}
			<Controller
				name="email"
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						className="mb-6"
						label="Email"
						autoFocus
						type="email"
						error={!!errors.email}
						helperText={errors?.email?.message}
						variant="outlined"
						required
						fullWidth
					/>
				)}
			/>
			<Controller
				name="password"
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						className="mb-1"
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
			<div className="flex flex-col items-center justify-center sm:flex-row sm:justify-between">
				<Controller
					name="remember"
					control={control}
					render={({ field }) => (
						<FormControl>
							<FormControlLabel
								label="Remember me"
								control={
									<Checkbox
										size="small"
										{...field}
									/>
								}
							/>
						</FormControl>
					)}
				/>

				<Link
					className="text-md font-medium"
					to="/forgot-password"
				>
					Forgot password?
				</Link>
			</div>
			<Button
				variant="contained"
				color="secondary"
				className="mt-4 w-full font-bold"
				aria-label="Sign in"
				disabled={_.isEmpty(dirtyFields) || !isValid}
				type="submit"
				size="large"
			>
				Sign in
			</Button>
		</form>
	);
}

export default AuthJsCredentialsSignInForm;

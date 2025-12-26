import Typography from '@mui/material/Typography';
import Link from '@fuse/core/Link';
import Paper from '@mui/material/Paper';
import CardContent from '@mui/material/CardContent';
import AuthJsForm from '@auth/forms/AuthJsForm';

/**
 * The sign up page.
 */
function SignUpPage() {
	return (
		<div className="flex min-h-screen w-full items-center justify-center bg-[#F7F7F8]">
			<Paper className="w-full max-w-[420px] rounded-[20px] p-7.5 shadow-sm border border-gray-200 bg-white">
				<CardContent className="w-full flex flex-col items-center p-0">
					{/* Logo */}
					{/* <img
						src="/assets/images/logo/logo.svg"
						alt="MultiKonnect Logo"
						className="w-16 mb-4"
					/> */}

					{/* Header */}
					<Typography color="primary" className="text-4xl font-extrabold leading-[1.25] tracking-tight text-center">
						MultiKonnect
					</Typography>

					{/* Heading */}
					<Typography className="text-3xl font-bold tracking-tight text-center">
						Sign up
					</Typography>

					{/* Subtitle */}
					<Typography color="textSecondary" className="mt-2 text-sm text-center">
						Create your account to start
					</Typography>

					{/* Form */}
					<div className="w-full">
						<AuthJsForm formType="signup" />
					</div>

					{/* Footer link */}
					<div className="mt-6 flex items-center justify-center gap-1 font-medium">
						<Typography className="text-gray-600" variant="body2">
							Already have an account?
						</Typography>
						<Link className="font-semibold" to="/sign-in">
							Sign in
						</Link>
					</div>
				</CardContent>
			</Paper>
		</div>
	);
}

export default SignUpPage;

import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Link from '@fuse/core/Link';

function SignOutPage() {
	return (
		<div className="flex min-w-0 flex-auto flex-col items-center sm:justify-center">
			<Paper className="flex min-h-full w-full items-center rounded-none px-4 py-8 sm:min-h-auto sm:w-auto sm:rounded-xl sm:p-12 sm:shadow-sm">
				<div className="flex flex-col items-center mx-auto w-full max-w-80 sm:mx-0 sm:w-80">
					<Typography component="h1" className="mt-8 text-center text-4xl font-extrabold leading-[1.25] tracking-tight text-blue-400">
						MultiKonnect
					</Typography>
					<Typography component="h2" className="mt-8 text-center text-4xl font-extrabold leading-[1.25] tracking-tight">
						You have signed out!
					</Typography>
					<Typography component="p" className="mt-8 text-md font-medium" color="text.secondary">
						<span>Return to </span>
						<Link className="text-primary-500 hover:underline" to="/sign-in">sign in</Link>
					</Typography>
				</div>
			</Paper>
		</div>
	);
}

export default SignOutPage;
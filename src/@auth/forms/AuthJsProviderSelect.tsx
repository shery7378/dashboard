import { Box, Button, Typography } from '@mui/material';
import { signIn } from 'next-auth/react';
import { authJsProviderMap } from '@auth/authJs';

const providerLogoPath = 'https://authjs.dev/img/providers';

function AuthJsProviderSelect() {
	function handleSignIn(providerId: string) {
		try {
			signIn(providerId);
		} catch (error) {
			console.error(error);
		}
	}

	if (!authJsProviderMap || Object.keys(authJsProviderMap).length === 0) {
		return null;
	}

	return (
		<div className="w-full">
			{/* Divider */}
			<div className="flex items-center mb-4">
				<div className="mt-px flex-auto border-t" />
				<Typography className="mx-2" color="text.secondary">
					Or continue with
				</Typography>
				<div className="mt-px flex-auto border-t" />
			</div>

			{/* Social Login Buttons */}
			<div className="flex flex-col gap-3">
				{Object.values(authJsProviderMap)
					.filter((provider) => provider.id !== 'credentials')
					.map((provider) => (
						<Button
							key={provider.id}
							onClick={() => handleSignIn(provider.id)}
							fullWidth
							variant="outlined"
							size="large"
							sx={{
								backgroundColor: '#ffffff',
								borderColor: '#e5e7eb', // Tailwind's gray-200
								color: 'text.primary',
								justifyContent: 'space-between',
								textTransform: 'none',
								fontSize: '0.95rem',
								'&:hover': {
									backgroundColor: '#f9fafb', // light hover
									borderColor: '#d1d5db', // slightly darker border on hover
								},
							}}
							endIcon={
								<Box className="rounded-full flex items-center justify-center w-8 h-8 bg-white">
									<img
										className="w-5 h-5"
										src={`${providerLogoPath}/${provider.id}.svg`}
										alt={provider.name}
									/>
								</Box>
							}
						>
							Sign in with {provider.name}
						</Button>
					))}
				{/* <Button
					className="text-md"
					href="https://authjs.dev/getting-started#official-providers"
					target="_blank"
				>
					+ more auth providers
				</Button> */}
			</div>
		</div>
	);
}

export default AuthJsProviderSelect;

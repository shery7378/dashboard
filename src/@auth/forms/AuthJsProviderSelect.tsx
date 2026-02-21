import { signIn } from 'next-auth/react';
import { authJsProviderMap } from '@auth/authJs';

const providerConfig = [
	{ id: 'google', name: 'Google', logo: '/assets/images/google.svg' },
	{ id: 'apple', name: 'Apple', logo: '/assets/images/apple.svg' }
];

function AuthJsProviderSelect() {
	function handleSignIn(providerId: string) {
		try {
			signIn(providerId);
		} catch (error) {
			console.error(error);
		}
	}

	// Show only Google & Apple (from providerConfig) that are enabled in authJs
	const enabledIds = new Set(authJsProviderMap?.map((p) => p.id) ?? []);
	const providersToShow = providerConfig.filter((p) => enabledIds.has(p.id));

	if (providersToShow.length === 0) {
		return null;
	}

	return (
		<div className="w-full">
			{/* Divider */}
			<div className="flex items-center mb-4">
            <div className="flex-auto border-t border-gray-200" />
            <span className="mx-2 text-[15.22px] font-normal text-[#6B6B6B]">Or continue with</span>
            <div className="flex-auto border-t border-gray-200" />
          </div>

			{/* Social Login Buttons */}
			<div className="flex flex-col gap-3">
				{providersToShow.map((provider) => (
					<button
						key={provider.id}
						type="button"
						onClick={() => handleSignIn(provider.id)}
						className="flex items-center justify-center gap-3 w-full h-14 rounded-2xl border border-[#DCDEE0] bg-white text-[#DCDEE0] transition-colors px-4 hover:bg-gray-50 hover:border-gray-300"
					>
						<img
							src={provider.logo}
							alt={provider.name}
							className="w-6 h-6 shrink-0"
						/>
						<span className="text-[#111111] text-base">
							Continue with {provider.name}
						</span>
					</button>
				))}
			</div>
		</div>
	);
}

export default AuthJsProviderSelect;

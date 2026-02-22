import { SettingsAccount } from '@/app/(control-panel)/apps/settings/SettingsApi';
import { headers } from 'next/headers';
import { cookies } from 'next/headers';

/**
 * GET api/mock/app-account-settings/{id}
 * Fetches authenticated user's profile and transforms it to account settings format
 */
export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
	const { id } = await props.params;

	try {
		// Get token from Authorization header or cookies
		const headersList = await headers();
		const authHeader = headersList.get('authorization');
		let token = authHeader?.replace('Bearer ', '') || null;

		// If no token in header, try to get from cookies (next-auth stores tokens in cookies)
		if (!token) {
			const cookieStore = await cookies();
			token =
				cookieStore.get('next-auth.session-token')?.value ||
				cookieStore.get('auth_token')?.value ||
				cookieStore.get('token')?.value ||
				null;
		}

		if (!token) {
			return new Response(JSON.stringify({ message: 'Unauthenticated' }), { status: 401 });
		}

		const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

		// Fetch user profile from Laravel backend
		const userResponse = await fetch(`${API_BASE_URL}/api/user`, {
			headers: {
				Accept: 'application/json',
				Authorization: `Bearer ${token}`
			},
			credentials: 'include'
		});

		if (!userResponse.ok) {
			// If user endpoint fails, try to get profile
			const profileResponse = await fetch(`${API_BASE_URL}/api/profiles`, {
				headers: {
					Accept: 'application/json',
					Authorization: `Bearer ${token}`
				},
				credentials: 'include'
			});

			if (!profileResponse.ok) {
				return new Response(JSON.stringify({ message: 'Failed to fetch user data' }), {
					status: profileResponse.status
				});
			}

			const profileData = await profileResponse.json();
			const profile = Array.isArray(profileData?.data) ? profileData.data[0] : profileData?.data;

			// Transform profile to account settings format
			const accountSettings: SettingsAccount = {
				id: profile?.id || id,
				name:
					profile?.user?.name || (profile?.first_name && profile?.last_name)
						? `${profile.first_name} ${profile.last_name}`
						: '',
				username: profile?.user?.email?.split('@')[0] || '',
				title: '',
				company: profile?.company_name || '',
				about: '',
				email: profile?.user?.email || '',
				phone: profile?.phone || '',
				country: profile?.country || '',
				language: 'English'
			};

			return new Response(JSON.stringify(accountSettings), { status: 200 });
		}

		const userData = await userResponse.json();

		// Try to fetch profile for additional info like company_name
		let profile = null;
		try {
			const profileResponse = await fetch(`${API_BASE_URL}/api/profiles`, {
				headers: {
					Accept: 'application/json',
					Authorization: `Bearer ${token}`
				},
				credentials: 'include'
			});

			if (profileResponse.ok) {
				const profileData = await profileResponse.json();
				profile = Array.isArray(profileData?.data) ? profileData.data[0] : profileData?.data;
			}
		} catch (e) {
			// Profile fetch is optional
		}

		// Transform user data to account settings format
		const accountSettings: SettingsAccount = {
			id: userData?.id || id,
			name: userData?.name || userData?.displayName || '',
			username: userData?.email?.split('@')[0] || '',
			title: '',
			company: profile?.company_name || '',
			about: '',
			email: userData?.email || '',
			phone: profile?.phone || userData?.phone || '',
			country: profile?.country || '',
			language: 'English'
		};

		return new Response(JSON.stringify(accountSettings), { status: 200 });
	} catch (error) {
		console.error('Error fetching account settings:', error);
		return new Response(JSON.stringify({ message: 'Internal server error' }), { status: 500 });
	}
}

/**
 * PUT api/mock/app-account-settings/{id}
 * Updates authenticated user's profile with account settings data
 */
export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
	const { id } = await props.params;
	const data = (await req.json()) as SettingsAccount;

	try {
		// Get token from Authorization header or cookies
		const headersList = await headers();
		const authHeader = headersList.get('authorization');
		let token = authHeader?.replace('Bearer ', '') || null;

		// If no token in header, try to get from cookies (next-auth stores tokens in cookies)
		if (!token) {
			const cookieStore = await cookies();
			token =
				cookieStore.get('next-auth.session-token')?.value ||
				cookieStore.get('auth_token')?.value ||
				cookieStore.get('token')?.value ||
				null;
		}

		if (!token) {
			return new Response(JSON.stringify({ message: 'Unauthenticated' }), { status: 401 });
		}

		const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

		// Fetch current profile to get profile ID
		const profileResponse = await fetch(`${API_BASE_URL}/api/profiles`, {
			headers: {
				Accept: 'application/json',
				Authorization: `Bearer ${token}`
			},
			credentials: 'include'
		});

		if (!profileResponse.ok) {
			return new Response(JSON.stringify({ message: 'Failed to fetch profile' }), {
				status: profileResponse.status
			});
		}

		const profileData = await profileResponse.json();
		const profile = Array.isArray(profileData?.data) ? profileData.data[0] : profileData?.data;

		if (!profile?.id) {
			return new Response(JSON.stringify({ message: 'Profile not found' }), { status: 404 });
		}

		// Update profile with account settings data
		const updateData: any = {
			company_name: data.company || profile.company_name,
			phone: data.phone || profile.phone,
			country: data.country || profile.country
		};

		// Update user name if provided
		if (data.name) {
			const nameParts = data.name.split(' ');
			updateData.first_name = nameParts[0] || profile.first_name;
			updateData.last_name = nameParts.slice(1).join(' ') || profile.last_name;
		}

		const updateResponse = await fetch(`${API_BASE_URL}/api/profiles/${profile.id}`, {
			method: 'PUT',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			},
			credentials: 'include',
			body: JSON.stringify(updateData)
		});

		if (!updateResponse.ok) {
			const errorData = await updateResponse.json().catch(() => ({}));
			return new Response(JSON.stringify({ message: errorData.message || 'Failed to update profile' }), {
				status: updateResponse.status
			});
		}

		const updatedProfile = await updateResponse.json();
		const updatedProfileData = updatedProfile?.data || updatedProfile;

		// Return updated account settings format
		const updatedAccountSettings: SettingsAccount = {
			id: updatedProfileData?.id || id,
			name:
				data.name ||
				updatedProfileData?.user?.name ||
				(updatedProfileData?.first_name && updatedProfileData?.last_name
					? `${updatedProfileData.first_name} ${updatedProfileData.last_name}`
					: ''),
			username: data.username || updatedProfileData?.user?.email?.split('@')[0] || '',
			title: data.title || '',
			company: updatedProfileData?.company_name || data.company || '',
			about: data.about || '',
			email: data.email || updatedProfileData?.user?.email || '',
			phone: updatedProfileData?.phone || data.phone || '',
			country: updatedProfileData?.country || data.country || '',
			language: data.language || 'English'
		};

		return new Response(JSON.stringify(updatedAccountSettings), { status: 200 });
	} catch (error) {
		console.error('Error updating account settings:', error);
		return new Response(JSON.stringify({ message: 'Internal server error' }), { status: 500 });
	}
}

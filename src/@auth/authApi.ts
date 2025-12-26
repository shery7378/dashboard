
import { User } from '@auth/user';
import { PartialDeep } from 'type-fest';
import apiFetch from '@/utils/apiFetch';
import apiFetchLaravel from '@/utils/apiFetchLaravel';
import Cookies from 'js-cookie';

// function getXsrfToken() {
//   console.log(Cookies.get('XSRF-TOKEN', 'check from logout or in token'));
//   return Cookies.get('XSRF-TOKEN');
// }


export async function authGetDbUserByEmail(email: string, accessToken: string): Promise<Response> {


  return apiFetchLaravel(`/api/user`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      // 'X-XSRF-TOKEN': getXsrfToken(),
    },
    credentials: 'include'
  });
}

export async function authUserSignOut(accessToken: string): Promise<Response> {

  // console.log('at logout XSRF-TOKEN:', Cookies.get('XSRF-TOKEN')); // 🔥 Should print token

  if (!accessToken) {
    throw new Error('Access token is required for logout');
  }

  try {
    const response = await apiFetchLaravel(`/api/logout`, {
      method: 'POST', // Explicitly set to POST
      headers: {
        'Content-Type': 'application/json',
        // 'X-XSRF-TOKEN': Cookies.get('XSRF-TOKEN') || '', // Laravel checks this
        Authorization: `Bearer ${accessToken}` // Optional if using bearer (but don’t mix if using Sanctum session)
      },
      // credentials: 'include' // Include cookies (e.g., CSRF token)
    });

    return response;
  } catch (error) {
    console.error('Logout request failed:', error);
    throw new Error('Failed to send logout request to the server');
  }
}

export function authUpdateDbUser(user: PartialDeep<User>) {
  return apiFetch(`/api/user/${user.id}`, {
    method: 'PUT',
    body: JSON.stringify(user)
  });
}

export async function authCreateDbUser(user: PartialDeep<User>) {
  return apiFetch('/api/users', {
    method: 'POST',
    body: JSON.stringify(user)
  });
}

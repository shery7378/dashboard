import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Make Pusher available globally for Laravel Echo
if (typeof window !== 'undefined') {
	(window as any).Pusher = Pusher;
}

// Get Pusher credentials from environment
const pusherKey = process.env.NEXT_PUBLIC_PUSHER_APP_KEY || '72b4d79a107dcff8d833';
const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER || 'ap2';
const pusherHost = process.env.NEXT_PUBLIC_PUSHER_HOST;
const pusherPort = process.env.NEXT_PUBLIC_PUSHER_PORT;
const pusherEncrypted = process.env.NEXT_PUBLIC_PUSHER_ENCRYPTED !== 'false';

// Create Echo instance with dynamic auth
const createEcho = () => {
	const token =
		typeof window !== 'undefined' ? localStorage.getItem('auth_token') || localStorage.getItem('token') || '' : '';

	return new Echo({
		broadcaster: 'pusher',
		key: pusherKey,
		cluster: pusherCluster,
		forceTLS: pusherEncrypted,
		encrypted: pusherEncrypted,
		...(pusherHost && { host: pusherHost }),
		...(pusherPort && { port: pusherPort }),
		authEndpoint: `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/broadcasting/auth`,
		auth: {
			headers: {
				Authorization: `Bearer ${token}`
			}
		}
	});
};

// Create singleton instance
let echoInstance: Echo | null = null;

const getEcho = () => {
	if (typeof window === 'undefined') {
		return null;
	}

	if (!echoInstance) {
		echoInstance = createEcho();
	}

	return echoInstance;
};

export default getEcho;

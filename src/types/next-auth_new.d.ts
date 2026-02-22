//src/types/next-auth.d.ts

declare module 'next-auth' {
	interface Session {
		user: {
			id: string;
			email: string;
			name: string;
			role: string | string[];
			image?: string;
		};
		accessToken: string;
		accessAuthToken?: string;
		db?: any;
	}

	interface User {
		id: string;
		email: string;
		name: string;
		role: string | string[];
		accessToken: string;
		image?: string;
	}
}

declare module 'next-auth/jwt' {
	interface JWT {
		id: string;
		email: string;
		name: string;
		role: string | string[];
		accessToken: string;
	}
}

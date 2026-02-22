import { auth } from '@/@auth/authJs';
import { NextResponse } from 'next/server';

export async function GET() {
	try {
		const session = await auth();
		const token = session?.accessAuthToken || session?.accessToken;

		return NextResponse.json({
			token: token || null,
			hasSession: !!session
		});
	} catch (error) {
		return NextResponse.json({ token: null, hasSession: false, error: 'Failed to get session' }, { status: 500 });
	}
}

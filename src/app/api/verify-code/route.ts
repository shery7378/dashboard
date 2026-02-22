import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { email, code } = body;

		console.error('Mock OTP verification request:', { email, code });

		// Simple mock validation - accept the specific code "1234" for testing
		if (!email || !code || code.length !== 4) {
			return NextResponse.json({ message: 'Invalid verification code. Please try again.' }, { status: 400 });
		}

		// Check if the code matches our mock code
		if (code !== '1234') {
			return NextResponse.json({ message: 'Invalid verification code. Use 1234 for testing.' }, { status: 400 });
		}

		// Mock successful verification
		return NextResponse.json({
			message: 'Code verified successfully',
			success: true,
			user: {
				id: 'mock-user-id',
				email: email,
				name: 'Test User'
			}
		});
	} catch (error) {
		console.error('Mock OTP verification error:', error);
		return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
	}
}

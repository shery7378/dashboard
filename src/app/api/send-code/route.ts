import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { email } = body;

		console.error('Mock OTP send request:', { email });

		if (!email) {
			return NextResponse.json({ message: 'Email is required' }, { status: 400 });
		}

		// Mock successful OTP sending - in real scenario this would send email
		// For testing, we'll use a fixed code: 1234
		const mockOtpCode = '1234';

		// Store the mock OTP in session storage simulation (in a real app, this would be in a database)
		// For now, we'll just log it for testing purposes
		console.error(`Mock OTP sent to ${email}: ${mockOtpCode}`);
		console.error('Use this code for testing: 1234');

		return NextResponse.json({
			message: 'Verification code sent successfully',
			success: true,
			// Include the mock code in development for easier testing
			...(process.env.NODE_ENV === 'development' && { mockCode: mockOtpCode })
		});
	} catch (error) {
		console.error('Mock OTP send error:', error);
		return NextResponse.json({ message: 'Failed to send verification code' }, { status: 500 });
	}
}

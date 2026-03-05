import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { email } = body;

		if (!email) {
			return NextResponse.json({ message: 'Email is required' }, { status: 400 });
		}

		// Forward the request to the real backend API
		const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
		const apiEndpoint = `${backendUrl}/api/send-code`;

		console.error('Forwarding send-code request to backend:', { email, endpoint: apiEndpoint });

		const response = await fetch(apiEndpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json'
			},
			body: JSON.stringify({ email })
		});

		const responseData = await response.json();

		// If backend returns an error, pass it along to the frontend
		if (!response.ok) {
			console.error('Backend API error:', {
				status: response.status,
				message: responseData.message,
				errors: responseData.errors
			});
			return NextResponse.json(responseData, { status: response.status });
		}

		console.error('OTP sent successfully:', { email });
		return NextResponse.json(responseData);
	} catch (error) {
		console.error('Send code error:', error);
		return NextResponse.json({ message: 'Failed to send verification code' }, { status: 500 });
	}
}

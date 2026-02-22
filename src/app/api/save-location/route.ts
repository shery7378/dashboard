import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
	try {
		// Enable CORS for all origins
		const headers = {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Authorization'
		};

		// Handle preflight requests
		if (request.method === 'OPTIONS') {
			return new NextResponse(null, { status: 200, headers });
		}

		const body = await request.json();
		const { latitude, longitude, radius } = body;

		// Validate the input
		if (typeof latitude !== 'number' || typeof longitude !== 'number' || typeof radius !== 'number') {
			return NextResponse.json(
				{ error: 'Invalid input. Latitude, longitude, and radius must be numbers.' },
				{ status: 400, headers }
			);
		}

		// Here you would typically save this data to your database
		// For now, we'll just log it and return success
		console.log('Saving location data:', { latitude, longitude, radius });

		// Example: Save to database (uncomment and modify as needed)
		// await db.locationSettings.create({
		//   data: {
		//     latitude,
		//     longitude,
		//     radius,
		//     updatedAt: new Date()
		//   }
		// });

		return NextResponse.json(
			{
				success: true,
				message: 'Location saved successfully!',
				data: { latitude, longitude, radius }
			},
			{ status: 200, headers }
		);
	} catch (error) {
		console.error('Error saving location:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}

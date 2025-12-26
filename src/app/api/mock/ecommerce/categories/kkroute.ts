///api/mock/ecommerce/categories/route.ts
import { NextResponse } from 'next/server';
import { API_BASE_URL, globalHeaders } from '@/utils/apiFetchLaravel';

export async function GET(req: Request) {
	const response = await fetch(`${API_BASE_URL}/api/categories`, {
		method: 'GET',
		headers: {
			...globalHeaders,
			'Authorization': `Bearer ${await getAuthToken()}`,
		},
		credentials: 'include',
	});

	const data = await response.json();
	return NextResponse.json(data, { status: response.status });
}

export async function POST(req: Request) {
	const requestData = await req.json();
	const response = await fetch(`${API_BASE_URL}/api/categories`, {
		method: 'POST',
		headers: {
			...globalHeaders,
			'Authorization': `Bearer ${await getAuthToken()}`,
		},
		credentials: 'include',
		body: JSON.stringify(requestData),
	});

	const data = await response.json();
	return NextResponse.json(data, { status: response.status });
}

async function getAuthToken() {
	const session = await import('next-auth/react').then(({ getSession }) => getSession());
	return session?.accessToken || '';
}
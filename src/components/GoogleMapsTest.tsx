'use client';

export default function GoogleMapsTest() {
	const apiKey = process.env.NEXT_PUBLIC_MAP_KEY;

	return (
		<div className="p-4 bg-yellow-100 border border-yellow-300 rounded">
			<h3 className="font-bold mb-2">Google Maps API Debug</h3>
			<p>
				<strong>API Key exists:</strong> {apiKey ? '✅ Yes' : '❌ No'}
			</p>
			<p>
				<strong>API Key (first 10 chars):</strong> {apiKey?.substring(0, 10) + '...' || 'Not found'}
			</p>
			<p>
				<strong>Environment:</strong> {process.env.NODE_ENV}
			</p>
			<details className="mt-2">
				<summary className="cursor-pointer">Full Environment Variables</summary>
				<pre className="text-xs mt-2 bg-white p-2 rounded overflow-auto max-h-40">
					{JSON.stringify(process.env, null, 2)}
				</pre>
			</details>
		</div>
	);
}

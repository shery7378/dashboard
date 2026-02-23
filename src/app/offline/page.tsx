'use client';

export default function OfflinePage() {
	return (
		<div
			style={{
				minHeight: '100vh',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				backgroundColor: '#f5f5f5',
				padding: '16px'
			}}
		>
			<div
				style={{
					maxWidth: '512px',
					width: '100%',
					textAlign: 'center'
				}}
			>
				<div style={{ marginBottom: '32px' }}>
					<svg
						style={{ margin: '0 auto', height: '96px', width: '96px', color: '#999' }}
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
						/>
					</svg>
				</div>
				<h1
					style={{
						fontSize: '32px',
						fontWeight: 'bold',
						color: '#000',
						marginBottom: '16px',
						margin: '0 0 16px 0'
					}}
				>
					You're Offline
				</h1>
				<p style={{ color: '#666', marginBottom: '32px', margin: '0 0 32px 0' }}>
					It looks like you've lost your internet connection. Please check your network settings and try
					again.
				</p>
				<button
					onClick={() => window.location.reload()}
					style={{
						backgroundColor: '#000',
						color: 'white',
						padding: '12px 24px',
						borderRadius: '8px',
						fontWeight: 600,
						border: 'none',
						cursor: 'pointer',
						fontSize: '16px'
					}}
				>
					Try Again
				</button>
			</div>
		</div>
	);
}

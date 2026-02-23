//src/components/SignUpPageHeader.jsx
'use client';
import Link from 'next/link';
import PostcodeModal from '@/components/PostcodeModal';
import { useState, useEffect } from 'react';
import Button from './UI/Button';

export default function LandingPageHeader() {
	// Force re-render
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [postcode, setPostcode] = useState('');

	useEffect(() => {
		// Check if postcode is saved in localStorage
		const savedPostcode = localStorage.getItem('postcode');

		if (!savedPostcode) {
			setIsModalOpen(false); // ask for postcode if not saved
		} else {
			setPostcode(savedPostcode);
		}
	}, []);

	const handleSavePostcode = (code) => {
		setPostcode(code);
		localStorage.setItem('postcode', code);
	};

	return (
		<>
			<header className="bg-[#f44322] border-b border-gray-200">
				<nav className="container mx-auto flex justify-between items-center h-16 px-4">
					{/* Logo */}
					<Link href="/">
						<img
							src={'/assets/images/MultiKonnect.svg'}
							alt="MultiKonnect"
							className="h-4 w-auto object-contain cursor-pointer brightness-0 invert"
						/>
					</Link>

					{/* Right Side Buttons */}
					<div className="md:flex items-center gap-3 hidden">
						{/* Address Button */}
		
						{/* Login Button */}
						<Link href="/sign-in">
							<Button
								className="border border-white text-white rounded-full px-6 py-2 text-sm font-semibold whitespace-nowrap focus:outline-none focus:ring-0"
								style={{ borderRadius: "16px", borderColor: "white" }} >
								Log in
							</Button>
						</Link>
					</div>
				</nav>
			</header>

			<PostcodeModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				onSave={handleSavePostcode}
			/>
		</>
	);
}

import React, { useState } from 'react';
import GooglePlacesAutocomplete from './GooglePlacesAutocomplete';

interface PostcodeModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSave: (address: string) => void;
}

export default function PostcodeModal({ isOpen, onClose, onSave }: PostcodeModalProps) {
	const [address, setAddress] = useState('');

	// Debug environment variables
	React.useEffect(() => {
		if (isOpen) {
			console.log('PostcodeModal - Environment Variables Debug:', {
				NEXT_PUBLIC_MAP_KEY: process.env.NEXT_PUBLIC_MAP_KEY
					? process.env.NEXT_PUBLIC_MAP_KEY.substring(0, 10) + '...'
					: 'NOT_FOUND',
				NEXT_PUBLIC_MAP_KEY_LENGTH: process.env.NEXT_PUBLIC_MAP_KEY?.length || 0,
				ALL_MAP_VARS: Object.keys(process.env).filter((key) => key.includes('MAP') || key.includes('GOOGLE')),
				NODE_ENV: process.env.NODE_ENV
			});
		}
	}, [isOpen]);

	const handleSave = () => {
		if (address.trim()) {
			onSave(address.trim());
			onClose();
		}
	};

	const handleAddressSelect = (selectedAddress: string, place: any) => {
		setAddress(selectedAddress);
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div className="bg-white rounded-lg p-6 w-full max-w-md">
				<h2 className="text-xl font-bold mb-4">Enter Delivery Address</h2>

				<div className="mb-4">
					<label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
					<GooglePlacesAutocomplete
						onAddressSelect={handleAddressSelect}
						placeholder="Start typing your address..."
						className="mb-2"
					/>
				</div>

				<div className="flex justify-end space-x-3">
					<button
						onClick={onClose}
						className="px-4 py-2 text-gray-600 hover:text-gray-800"
					>
						Cancel
					</button>
					<button
						onClick={handleSave}
						disabled={!address.trim()}
						className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
					>
						Save
					</button>
				</div>
			</div>
		</div>
	);
}

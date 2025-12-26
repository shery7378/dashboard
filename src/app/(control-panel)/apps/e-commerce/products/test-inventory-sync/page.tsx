'use client';

/**
 * Test Page for Inventory Sync Feature
 * 
 * This page allows you to test the inventory sync functionality
 * Navigate to: /apps/e-commerce/products/test-inventory-sync
 */
import InventorySyncTab from '../[productId]/[[...handle]]/tabs/InventorySyncTab';

export default function TestInventorySyncPage() {
	// You can get productId from URL params or hardcode for testing
	const productId = '1'; // Change this to test with different products
	const userRole = 'supplier'; // Change to 'vendor' or 'admin' to test different roles

	return (
		<div className="p-24">
			<h1 className="text-3xl font-bold mb-4">Inventory Sync Test Page</h1>
			<p className="mb-6 text-gray-600">
				Use this page to test the inventory sync feature. Change the productId and userRole in the code to test different scenarios.
			</p>
			<InventorySyncTab productId={productId} userRole={userRole} />
		</div>
	);
}


import { apiServiceLaravel as api } from '@/store/apiServiceLaravel';

// Tags for cache invalidation
export const addTagTypes = ['inventory_sync'] as const;

// Enhance base API with tag support
const InventorySyncApi = api.enhanceEndpoints({ addTagTypes }).injectEndpoints({
	endpoints: (build) => ({
		/** ------------------------------
		 *  INVENTORY SYNC ENDPOINTS
		 * ------------------------------ */

		// Enable inventory sync
		enableInventorySync: build.mutation<EnableInventorySyncApiResponse, EnableInventorySyncApiArg>({
			query: (data) => ({
				url: `/api/inventory-sync/enable`,
				method: 'POST',
				body: data
			}),
			invalidatesTags: ['inventory_sync']
		}),

		// Disable inventory sync
		disableInventorySync: build.mutation<DisableInventorySyncApiResponse, DisableInventorySyncApiArg>({
			query: (data) => ({
				url: `/api/inventory-sync/disable`,
				method: 'POST',
				body: data
			}),
			invalidatesTags: ['inventory_sync']
		}),

		// Sync from supplier to vendor
		syncFromSupplier: build.mutation<SyncFromSupplierApiResponse, SyncFromSupplierApiArg>({
			query: (data) => ({
				url: `/api/inventory-sync/sync-from-supplier`,
				method: 'POST',
				body: data
			}),
			invalidatesTags: ['inventory_sync']
		}),

		// Sync from vendor to supplier
		syncFromVendor: build.mutation<SyncFromVendorApiResponse, SyncFromVendorApiArg>({
			query: (data) => ({
				url: `/api/inventory-sync/sync-from-vendor`,
				method: 'POST',
				body: data
			}),
			invalidatesTags: ['inventory_sync']
		}),

		// Get sync status for a product
		getInventorySyncStatus: build.query<GetInventorySyncStatusApiResponse, GetInventorySyncStatusApiArg>({
			query: ({ productId, role = 'supplier' }) => ({
				url: `/api/inventory-sync/status/${productId}`,
				params: { role }
			}),
			providesTags: ['inventory_sync']
		}),

		// Get products for dropdown selection
		getProductsForSync: build.query<GetProductsForSyncApiResponse, GetProductsForSyncApiArg>({
			query: ({ role = 'supplier', search = '' }) => ({
				url: `/api/inventory-sync/products`,
				params: { role, search }
			})
		})
	}),
	overrideExisting: false
});

export default InventorySyncApi;

/** -----------------------------------------------------------------
 * INVENTORY SYNC TYPES
 * ----------------------------------------------------------------- */

export type EnableInventorySyncApiResponse = {
	success: boolean;
	message: string;
	data: InventorySync;
};

export type EnableInventorySyncApiArg = {
	supplier_product_id: number;
	vendor_product_id: number;
	allow_vendor_to_supplier_sync?: boolean;
	sync_direction?: 'supplier_to_vendor' | 'vendor_to_supplier' | 'bidirectional';
};

export type DisableInventorySyncApiResponse = {
	success: boolean;
	message: string;
};

export type DisableInventorySyncApiArg = {
	supplier_product_id: number;
	vendor_product_id: number;
};

export type SyncFromSupplierApiResponse = {
	success: boolean;
	message: string;
	data: {
		vendor_product_id: number;
		status: 'success' | 'error';
		message: string;
	}[];
};

export type SyncFromSupplierApiArg = {
	supplier_product_id: number;
	vendor_product_id?: number;
};

export type SyncFromVendorApiResponse = {
	success: boolean;
	message: string;
};

export type SyncFromVendorApiArg = {
	vendor_product_id: number;
	supplier_product_id: number;
};

export type GetInventorySyncStatusApiResponse = {
	success: boolean;
	data: InventorySync[];
};

export type GetInventorySyncStatusApiArg = {
	productId: string | number;
	role?: 'supplier' | 'vendor';
};

export type GetProductsForSyncApiResponse = {
	success: boolean;
	data: {
		id: number;
		name: string;
		sku: string | null;
		store_id: number | null;
	}[];
};

export type GetProductsForSyncApiArg = {
	role?: 'supplier' | 'vendor';
	search?: string;
};

export type InventorySync = {
	id: number;
	supplier_product_id: number;
	vendor_product_id: number;
	sync_enabled: boolean;
	allow_vendor_to_supplier_sync: boolean;
	sync_direction: 'supplier_to_vendor' | 'vendor_to_supplier' | 'bidirectional';
	last_synced_at: string | null;
	created_at: string;
	updated_at: string;
	supplierProduct?: {
		id: number;
		name: string;
		sku: string;
	};
	vendorProduct?: {
		id: number;
		name: string;
		sku: string;
	};
};

/** -----------------------------------------------------------------
 * RTK HOOK EXPORTS
 * ----------------------------------------------------------------- */

export const {
	useEnableInventorySyncMutation,
	useDisableInventorySyncMutation,
	useSyncFromSupplierMutation,
	useSyncFromVendorMutation,
	useGetInventorySyncStatusQuery,
	useGetProductsForSyncQuery
} = InventorySyncApi;

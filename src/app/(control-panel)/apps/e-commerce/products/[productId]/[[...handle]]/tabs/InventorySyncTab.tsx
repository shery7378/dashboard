'use client';

import { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    FormControl,
    FormControlLabel,
    FormLabel,
    Radio,
    RadioGroup,
    Switch,
    TextField,
    Typography,
    Alert,
    CircularProgress,
    Chip,
    Divider,
    MenuItem,
    Select,
    InputLabel,
    Autocomplete,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { useSession } from 'next-auth/react';
import {
    useEnableInventorySyncMutation,
    useDisableInventorySyncMutation,
    useSyncFromSupplierMutation,
    useSyncFromVendorMutation,
    useGetInventorySyncStatusQuery,
    useGetProductsForSyncQuery,
} from '@/app/(control-panel)/apps/e-commerce/apis/InventorySyncApi';

interface InventorySyncTabProps {
    productId: string;
    userRole?: 'supplier' | 'vendor' | 'admin';
}

/**
 * Inventory Sync Tab Component
 * Allows suppliers and sellers to manage inventory synchronization
 */
function InventorySyncTab({ productId, userRole: propUserRole }: InventorySyncTabProps) {
    const { enqueueSnackbar } = useSnackbar();
    const { data: session } = useSession();
    
    // Get user role from session or prop
    const user = session?.user || session?.db;
    const userRoles = user?.role || session?.db?.role || [];
    const sessionRole = Array.isArray(userRoles) ? userRoles[0] : userRoles;
    const userRole = propUserRole || (sessionRole as 'supplier' | 'vendor' | 'admin') || 'supplier';
    
    const [supplierProductId, setSupplierProductId] = useState<string>('');
    const [vendorProductId, setVendorProductId] = useState<string>('');
    const [syncDirection, setSyncDirection] = useState<'supplier_to_vendor' | 'vendor_to_supplier' | 'bidirectional'>('supplier_to_vendor');
    const [allowVendorToSupplier, setAllowVendorToSupplier] = useState(false);
    const [supplierSearch, setSupplierSearch] = useState('');
    const [vendorSearch, setVendorSearch] = useState('');
    const [debouncedSupplierSearch, setDebouncedSupplierSearch] = useState('');
    const [debouncedVendorSearch, setDebouncedVendorSearch] = useState('');

    // Debounce search inputs
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSupplierSearch(supplierSearch);
        }, 300);
        return () => clearTimeout(timer);
    }, [supplierSearch]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedVendorSearch(vendorSearch);
        }, 300);
        return () => clearTimeout(timer);
    }, [vendorSearch]);

    // RTK Query hooks
    const { data: syncStatus, isLoading: isLoadingStatus, refetch } = useGetInventorySyncStatusQuery({
        productId,
        role: userRole,
    });

    // Fetch products for dropdowns with debounced search
    const { data: supplierProducts, isLoading: isLoadingSupplierProducts } = useGetProductsForSyncQuery({
        role: 'supplier',
        search: debouncedSupplierSearch,
    }, {
        skip: false, // Always fetch, but with debounced search
    });

    const { data: vendorProducts, isLoading: isLoadingVendorProducts } = useGetProductsForSyncQuery({
        role: 'vendor',
        search: debouncedVendorSearch,
    }, {
        skip: false, // Always fetch, but with debounced search
    });

    // Memoize selected products to prevent unnecessary re-renders
    const selectedSupplierProduct = useMemo(() => {
        return supplierProducts?.data?.find(p => p.id.toString() === supplierProductId) || null;
    }, [supplierProducts?.data, supplierProductId]);

    const selectedVendorProduct = useMemo(() => {
        return vendorProducts?.data?.find(p => p.id.toString() === vendorProductId) || null;
    }, [vendorProducts?.data, vendorProductId]);

    const [enableSync, { isLoading: isEnabling }] = useEnableInventorySyncMutation();
    const [disableSync, { isLoading: isDisabling }] = useDisableInventorySyncMutation();
    const [syncFromSupplier, { isLoading: isSyncingFromSupplier }] = useSyncFromSupplierMutation();
    const [syncFromVendor, { isLoading: isSyncingFromVendor }] = useSyncFromVendorMutation();

    const handleEnableSync = async () => {
        if (!supplierProductId || !vendorProductId) {
            enqueueSnackbar('Please enter both supplier and vendor product IDs', { variant: 'error' });
            return;
        }

        try {
            const result = await enableSync({
                supplier_product_id: parseInt(supplierProductId),
                vendor_product_id: parseInt(vendorProductId),
                allow_vendor_to_supplier_sync: allowVendorToSupplier,
                sync_direction: syncDirection,
            }).unwrap();

            enqueueSnackbar(result.message || 'Inventory sync enabled successfully', { variant: 'success' });
            setSupplierProductId('');
            setVendorProductId('');
            refetch();
        } catch (error: any) {
            enqueueSnackbar(error?.data?.message || 'Failed to enable sync', { variant: 'error' });
        }
    };

    const handleDisableSync = async (supplierId: number, vendorId: number) => {
        try {
            const result = await disableSync({
                supplier_product_id: supplierId,
                vendor_product_id: vendorId,
            }).unwrap();

            enqueueSnackbar(result.message || 'Inventory sync disabled successfully', { variant: 'success' });
            refetch();
        } catch (error: any) {
            enqueueSnackbar(error?.data?.message || 'Failed to disable sync', { variant: 'error' });
        }
    };

    const handleSyncFromSupplier = async (supplierId: number, vendorId?: number) => {
        try {
            const result = await syncFromSupplier({
                supplier_product_id: supplierId,
                ...(vendorId && { vendor_product_id: vendorId }),
            }).unwrap();

            enqueueSnackbar(result.message || 'Inventory synced successfully', { variant: 'success' });
            refetch();
        } catch (error: any) {
            enqueueSnackbar(error?.data?.message || 'Failed to sync inventory', { variant: 'error' });
        }
    };

    const handleSyncFromVendor = async (vendorId: number, supplierId: number) => {
        try {
            const result = await syncFromVendor({
                vendor_product_id: vendorId,
                supplier_product_id: supplierId,
            }).unwrap();

            enqueueSnackbar(result.message || 'Inventory synced successfully', { variant: 'success' });
            refetch();
        } catch (error: any) {
            enqueueSnackbar(error?.data?.message || 'Failed to sync inventory', { variant: 'error' });
        }
    };

    return (
        <Box className="flex flex-col gap-4 p-4">
            <Typography variant="h6" className="mb-2">
                Inventory Sync Management
            </Typography>

            {/* Enable Sync Section */}
            <Card>
                <CardContent>
                    <Typography variant="subtitle1" className="mb-4">
                        Enable Inventory Sync
                    </Typography>

                    <Box className="flex flex-col gap-4">
                        <FormControl fullWidth variant="outlined">
                            <Autocomplete
                                options={supplierProducts?.data || []}
                                getOptionLabel={(option) => `${option.name} (SKU: ${option.sku || 'N/A'})`}
                                value={selectedSupplierProduct}
                                onChange={(event, newValue) => {
                                    setSupplierProductId(newValue ? newValue.id.toString() : '');
                                    setSupplierSearch(''); // Clear search when selection is made
                                }}
                                onInputChange={(event, newInputValue, reason) => {
                                    // Only update search on user input, not on programmatic changes
                                    if (reason === 'input') {
                                        setSupplierSearch(newInputValue);
                                    }
                                }}
                                loading={isLoadingSupplierProducts}
                                isOptionEqualToValue={(option, value) => option.id === value.id}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Supplier Product"
                                        variant="outlined"
                                        placeholder="Search and select supplier product..."
                                    />
                                )}
                                renderOption={(props, option) => (
                                    <Box component="li" {...props} key={option.id}>
                                        <Box>
                                            <Typography variant="body1">{option.name}</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                SKU: {option.sku || 'N/A'} | ID: {option.id}
                                            </Typography>
                                        </Box>
                                    </Box>
                                )}
                            />
                        </FormControl>

                        <FormControl fullWidth variant="outlined">
                            <Autocomplete
                                options={vendorProducts?.data || []}
                                getOptionLabel={(option) => `${option.name} (SKU: ${option.sku || 'N/A'})`}
                                value={selectedVendorProduct}
                                onChange={(event, newValue) => {
                                    setVendorProductId(newValue ? newValue.id.toString() : '');
                                    setVendorSearch(''); // Clear search when selection is made
                                }}
                                onInputChange={(event, newInputValue, reason) => {
                                    // Only update search on user input, not on programmatic changes
                                    if (reason === 'input') {
                                        setVendorSearch(newInputValue);
                                    }
                                }}
                                loading={isLoadingVendorProducts}
                                isOptionEqualToValue={(option, value) => option.id === value.id}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Vendor Product"
                                        variant="outlined"
                                        placeholder="Search and select vendor product..."
                                    />
                                )}
                                renderOption={(props, option) => (
                                    <Box component="li" {...props} key={option.id}>
                                        <Box>
                                            <Typography variant="body1">{option.name}</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                SKU: {option.sku || 'N/A'} | ID: {option.id}
                                            </Typography>
                                        </Box>
                                    </Box>
                                )}
                            />
                        </FormControl>

                        <FormControl component="fieldset">
                            <FormLabel component="legend">Sync Direction</FormLabel>
                            <RadioGroup
                                value={syncDirection}
                                onChange={(e) => setSyncDirection(e.target.value as any)}
                                row
                            >
                                <FormControlLabel
                                    value="supplier_to_vendor"
                                    control={<Radio />}
                                    label="Supplier → Vendor"
                                />
                                <FormControlLabel
                                    value="vendor_to_supplier"
                                    control={<Radio />}
                                    label="Vendor → Supplier"
                                />
                                <FormControlLabel
                                    value="bidirectional"
                                    control={<Radio />}
                                    label="Bidirectional"
                                />
                            </RadioGroup>
                        </FormControl>

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={allowVendorToSupplier}
                                    onChange={(e) => setAllowVendorToSupplier(e.target.checked)}
                                />
                            }
                            label="Allow Vendor to Supplier Sync"
                        />

                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleEnableSync}
                            disabled={isEnabling || !supplierProductId || !vendorProductId}
                            startIcon={isEnabling ? <CircularProgress size={20} /> : null}
                        >
                            {isEnabling ? 'Enabling...' : 'Enable Sync'}
                        </Button>
                    </Box>
                </CardContent>
            </Card>

            {/* Sync Status Section */}
            <Card>
                <CardContent>
                    <Typography variant="subtitle1" className="mb-4">
                        Current Sync Status
                    </Typography>

                    {isLoadingStatus ? (
                        <Box className="flex justify-center p-4">
                            <CircularProgress />
                        </Box>
                    ) : syncStatus?.data && syncStatus.data.length > 0 ? (
                        <Box className="flex flex-col gap-4">
                            {syncStatus.data.map((sync) => (
                                <Card key={sync.id} variant="outlined">
                                    <CardContent>
                                        <Box className="flex justify-between items-start mb-2">
                                            <Box>
                                                <Typography variant="body1" fontWeight="bold">
                                                    Sync #{sync.id}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Supplier Product: {sync.supplier_product_id} | Vendor Product: {sync.vendor_product_id}
                                                </Typography>
                                            </Box>
                                            <Chip
                                                label={sync.sync_enabled ? 'Enabled' : 'Disabled'}
                                                color={sync.sync_enabled ? 'success' : 'default'}
                                                size="small"
                                            />
                                        </Box>

                                        <Divider className="my-2" />

                                        <Box className="flex flex-col gap-2">
                                            <Typography variant="body2">
                                                <strong>Direction:</strong> {sync.sync_direction}
                                            </Typography>
                                            <Typography variant="body2">
                                                <strong>Allow Vendor→Supplier:</strong>{' '}
                                                {sync.allow_vendor_to_supplier_sync ? 'Yes' : 'No'}
                                            </Typography>
                                            {sync.last_synced_at && (
                                                <Typography variant="body2">
                                                    <strong>Last Synced:</strong>{' '}
                                                    {new Date(sync.last_synced_at).toLocaleString()}
                                                </Typography>
                                            )}
                                        </Box>

                                        <Box className="flex gap-2 mt-4">
                                            {sync.sync_enabled && (
                                                <>
                                                    {userRole === 'supplier' || userRole === 'admin' ? (
                                                        <Button
                                                            variant="outlined"
                                                            size="small"
                                                            onClick={() =>
                                                                handleSyncFromSupplier(
                                                                    sync.supplier_product_id,
                                                                    sync.vendor_product_id
                                                                )
                                                            }
                                                            disabled={isSyncingFromSupplier}
                                                        >
                                                            Sync Now
                                                        </Button>
                                                    ) : null}

                                                    {userRole === 'vendor' || userRole === 'admin' ? (
                                                        sync.allow_vendor_to_supplier_sync ||
                                                        sync.sync_direction === 'bidirectional' ? (
                                                            <Button
                                                                variant="outlined"
                                                                size="small"
                                                                onClick={() =>
                                                                    handleSyncFromVendor(
                                                                        sync.vendor_product_id,
                                                                        sync.supplier_product_id
                                                                    )
                                                                }
                                                                disabled={isSyncingFromVendor}
                                                            >
                                                                Sync to Supplier
                                                            </Button>
                                                        ) : null
                                                    ) : null}
                                                </>
                                            )}

                                            <Button
                                                variant="outlined"
                                                color="error"
                                                size="small"
                                                onClick={() =>
                                                    handleDisableSync(
                                                        sync.supplier_product_id,
                                                        sync.vendor_product_id
                                                    )
                                                }
                                                disabled={isDisabling}
                                            >
                                                Disable Sync
                                            </Button>
                                        </Box>
                                    </CardContent>
                                </Card>
                            ))}
                        </Box>
                    ) : (
                        <Alert severity="info">No active inventory syncs found for this product.</Alert>
                    )}
                </CardContent>
            </Card>

            {/* Info Section */}
            <Card>
                <CardContent>
                    <Typography variant="subtitle2" className="mb-2">
                        How It Works
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        • Enable sync between a supplier product and vendor product
                        <br />
                        • When supplier updates inventory, it automatically syncs to vendor (if enabled)
                        <br />
                        • You can manually trigger sync using the "Sync Now" button
                        <br />
                        • Bidirectional sync allows both parties to sync inventory to each other
                    </Typography>
                </CardContent>
            </Card>
        </Box>
    );
}

export default InventorySyncTab;


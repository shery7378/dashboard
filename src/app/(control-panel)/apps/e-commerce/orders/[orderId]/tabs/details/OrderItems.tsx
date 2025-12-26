'use client';

import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, FormControl, InputLabel, Select, MenuItem, Typography, } from '@mui/material';
import { Controller, useFormContext } from 'react-hook-form';
import { useUpdateECommerceProductShippingStatusMutation } from '../../../../apis/ECommerceOrdersApi';
import { SuccessDialog, WarningDialog } from '@/components/DialogComponents';
import { enqueueSnackbar } from 'notistack';
import { useState } from 'react'; 
import type { EcommerceOrder } from '../../../../apis/ECommerceOrdersApi';

interface OrderItemsProps {
    order: EcommerceOrder;
}

/**
 * OrderItems
 * - Displays list of products for the order
 * - Allows editing individual item shipping statuses
 * - Immediately updates on change with confirmation dialog
 */
export default function OrderItems({ order }: OrderItemsProps) {
    const { control } = useFormContext<EcommerceOrder>();

    /** API mutation for updating product shipping status */
    const [updateProductStatus, { isLoading: isUpdating }] = useUpdateECommerceProductShippingStatusMutation();

    /** Dialog states for confirmation */
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [pendingUpdate, setPendingUpdate] = useState<{ itemId: string | number; newStatus: string } | null>(null);

    /** Success dialog state */
    const [successDialogOpen, setSuccessDialogOpen] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    /** Handle status change - Show confirm dialog first */
    const handleStatusChange = (itemId: string | number, newStatus: string) => {
        setPendingUpdate({ itemId, newStatus });
        setConfirmDialogOpen(true);
    };

    /** Confirm update and send request - Minimal payload: only id and shipping_status */
    const handleConfirmUpdate = async () => {
        if (!pendingUpdate) return;

        const payload = { 
            id: pendingUpdate.itemId,
            shipping_status: pendingUpdate.newStatus,
        };

        try {
            await updateProductStatus(payload).unwrap();

            setSuccessMessage(`Item shipping status updated to "${pendingUpdate.newStatus}" successfully.`);
            setSuccessDialogOpen(true);
            enqueueSnackbar(`Item updated successfully`, { variant: 'success' });
        } catch (error: any) {
            console.error('Update error:', error);
            enqueueSnackbar(error?.data?.error ?? 'Failed to update item status', { variant: 'error' });
        } finally {
            setConfirmDialogOpen(false);
            setPendingUpdate(null);
        }
    };

    /** Close success dialog */
    const handleCloseSuccess = () => {
        setSuccessDialogOpen(false);
    };

    /** Close confirm dialog without updating */
    const handleCloseConfirm = () => {
        setConfirmDialogOpen(false);
        setPendingUpdate(null);
    };

    return (
        <>
            <TableContainer component={Paper}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Quantity</TableCell>
                            <TableCell>Color</TableCell>
                            <TableCell>Description</TableCell>
                            <TableCell>Price</TableCell>
                            <TableCell>Shipping Fee</TableCell>
                            <TableCell>Shipping Status</TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {order.items?.length ? (
                            order.items.map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell>{item.attributes?.name || '—'}</TableCell>
                                    <TableCell>{item.attributes?.quantity || '—'}</TableCell>
                                    <TableCell>{item.attributes?.color || '—'}</TableCell>
                                    <TableCell>{item.attributes?.description || '—'}</TableCell>
                                    <TableCell>£ {item?.product_price ?? '—'}</TableCell>
                                    <TableCell>£ {item.shipping_fee ?? '—'}</TableCell>

                                    {/* Shipping status dropdown per item */}
                                    <TableCell>
                                        <FormControl fullWidth size="small" disabled={isUpdating}>
                                            <InputLabel>Shipping Status</InputLabel>
                                            <Controller
                                                name={`items.${index}.shipping_status`}  // ✅ Updated to match new 'items' structure (assuming flat on item)
                                                control={control}
                                                defaultValue={item.shipping_status || 'pending'}
                                                render={({ field }) => (
                                                    <Select
                                                        {...field}
                                                        label="Shipping Status"
                                                        onChange={(e) => {
                                                            // Immediate action: Trigger confirm dialog
                                                            handleStatusChange(item.id, e.target.value as string);
                                                            // Optionally, update local form value immediately
                                                            field.onChange(e);
                                                        }}
                                                    >
                                                        <MenuItem value="pending">Pending</MenuItem>
                                                        <MenuItem value="processing">Processing</MenuItem>
                                                        <MenuItem value="delivered">Delivered</MenuItem>
                                                    </Select>
                                                )}
                                            />
                                        </FormControl>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={7} align="center">
                                    No products found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Confirmation Dialog - Using WarningDialog */}
            <WarningDialog
                open={confirmDialogOpen}
                onClose={handleCloseConfirm}
                onConfirm={handleConfirmUpdate}
                isLoading={isUpdating}  // Fixed prop name to match WarningDialog interface
                title="Confirm Status Update"  // Added custom title for better UX
                message={`Are you sure you want to update the shipping status to "${pendingUpdate?.newStatus}"?`}
                confirmText="Update"  // Customized button text
                cancelText="Cancel"  // Default, but explicit for clarity
            />

            {/* Success Dialog */}
            <SuccessDialog
                open={successDialogOpen}
                onClose={handleCloseSuccess}
                message={successMessage}
            />
        </>
    );
}
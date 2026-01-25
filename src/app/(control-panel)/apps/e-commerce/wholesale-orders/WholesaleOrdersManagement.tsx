'use client';

import { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    CircularProgress,
    Tooltip,
    Paper,
    Grid,
} from '@mui/material';
import FusePageSimple from '@fuse/core/FusePageSimple';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { useSnackbar } from 'notistack';
import { getSession } from 'next-auth/react';

interface Vendor {
    id: number;
    name: string;
    email: string;
}

interface SupplierProduct {
    id: number;
    name: string;
    sku: string;
}

interface WholesaleOrder {
    id: number;
    order_number: string;
    vendor_id: number;
    vendor?: Vendor;
    supplier_product_id: number;
    supplier_product?: SupplierProduct;
    vendor_product_id: number;
    vendor_product?: SupplierProduct;
    payment_method: 'instant' | 'credit';
    credit_days: number | null;
    due_date: string | null;
    quantity: number;
    unit_price: number;
    subtotal: number;
    total: number;
    payment_status: 'pending' | 'paid' | 'partial' | 'overdue';
    paid_amount: number;
    paid_at: string | null;
    order_status: 'pending' | 'processing' | 'completed' | 'cancelled';
    notes: string | null;
    shipping_name: string | null;
    shipping_phone: string | null;
    shipping_address: string | null;
    shipping_city: string | null;
    shipping_state: string | null;
    shipping_country: string | null;
    shipping_postal_code: string | null;
    created_at: string;
    updated_at: string;
}

interface Statistics {
    total_orders: number;
    pending_orders: number;
    completed_orders: number;
    total_revenue: number;
    pending_payment: number;
    overdue_payment: number;
}

function WholesaleOrdersManagement() {
    const { enqueueSnackbar } = useSnackbar();
    const [orders, setOrders] = useState<WholesaleOrder[]>([]);
    const [statistics, setStatistics] = useState<Statistics | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<WholesaleOrder | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        payment_status: 'pending' as 'pending' | 'paid' | 'partial' | 'overdue',
        order_status: 'pending' as 'pending' | 'processing' | 'completed' | 'cancelled',
        paid_amount: 0,
        notes: '',
    });
    const [filters, setFilters] = useState({
        payment_status: '',
        order_status: '',
    });

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

    useEffect(() => {
        fetchData();
        fetchStatistics();
    }, [filters]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const session = await getSession();
            const token = session?.accessAuthToken ||
                session?.accessToken ||
                (typeof window !== 'undefined' ? localStorage.getItem('token') || localStorage.getItem('auth_token') : null);

            const params = new URLSearchParams();
            if (filters.payment_status) params.append('payment_status', filters.payment_status);
            if (filters.order_status) params.append('order_status', filters.order_status);

            const response = await fetch(`${API_BASE_URL}/api/wholesale-orders?${params.toString()}`, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                setOrders(data.data || []);
            } else {
                const errorData = await response.json().catch(() => ({}));
                enqueueSnackbar(errorData.message || 'Failed to load orders', { variant: 'error' });
            }
        } catch (err) {
            console.error('Error fetching orders:', err);
            enqueueSnackbar('Error loading orders', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const fetchStatistics = async () => {
        try {
            const session = await getSession();
            const token = session?.accessAuthToken ||
                session?.accessToken ||
                (typeof window !== 'undefined' ? localStorage.getItem('token') || localStorage.getItem('auth_token') : null);

            const response = await fetch(`${API_BASE_URL}/api/wholesale-orders/statistics`, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                setStatistics(data.data);
            }
        } catch (err) {
            console.error('Error fetching statistics:', err);
        }
    };

    const handleViewOrder = (order: WholesaleOrder) => {
        setSelectedOrder(order);
        setDialogOpen(true);
    };

    const handleUpdateOrder = (order: WholesaleOrder) => {
        setSelectedOrder(order);
        setFormData({
            payment_status: order.payment_status,
            order_status: order.order_status,
            paid_amount: order.paid_amount || 0,
            notes: order.notes || '',
        });
        setUpdateDialogOpen(true);
    };

    const handleMarkAsPaid = async (order: WholesaleOrder) => {
        try {
            const session = await getSession();
            const token = session?.accessAuthToken ||
                session?.accessToken ||
                (typeof window !== 'undefined' ? localStorage.getItem('token') || localStorage.getItem('auth_token') : null);

            const response = await fetch(`${API_BASE_URL}/api/wholesale-orders/${order.id}/mark-paid`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    paid_amount: order.total,
                }),
                credentials: 'include',
            });

            if (response.ok) {
                enqueueSnackbar('Order marked as paid successfully', { variant: 'success' });
                fetchData();
                fetchStatistics();
            } else {
                const errorData = await response.json().catch(() => ({}));
                enqueueSnackbar(errorData.message || 'Failed to mark order as paid', { variant: 'error' });
            }
        } catch (err) {
            console.error('Error marking order as paid:', err);
            enqueueSnackbar('Error updating order', { variant: 'error' });
        }
    };

    const handleSaveUpdate = async () => {
        if (!selectedOrder) return;

        try {
            const session = await getSession();
            const token = session?.accessAuthToken ||
                session?.accessToken ||
                (typeof window !== 'undefined' ? localStorage.getItem('token') || localStorage.getItem('auth_token') : null);

            const response = await fetch(`${API_BASE_URL}/api/wholesale-orders/${selectedOrder.id}`, {
                method: 'PUT',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
                credentials: 'include',
            });

            if (response.ok) {
                enqueueSnackbar('Order updated successfully', { variant: 'success' });
                setUpdateDialogOpen(false);
                fetchData();
                fetchStatistics();
            } else {
                const errorData = await response.json().catch(() => ({}));
                enqueueSnackbar(errorData.message || 'Failed to update order', { variant: 'error' });
            }
        } catch (err) {
            console.error('Error updating order:', err);
            enqueueSnackbar('Error updating order', { variant: 'error' });
        }
    };

    const getPaymentStatusColor = (status: string) => {
        switch (status) {
            case 'paid': return 'success';
            case 'pending': return 'warning';
            case 'partial': return 'info';
            case 'overdue': return 'error';
            default: return 'default';
        }
    };

    const getOrderStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'success';
            case 'processing': return 'info';
            case 'pending': return 'warning';
            case 'cancelled': return 'error';
            default: return 'default';
        }
    };

    return (
        <FusePageSimple
            scroll="content"
            content={
                <Box className="w-full h-full flex flex-col p-24">
                    <Box className="mb-24">
                        <Typography variant="h4" fontWeight="bold" gutterBottom>
                            Wholesale Orders
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            View and manage orders from sellers
                        </Typography>
                    </Box>

                    {/* Statistics Cards */}
                    {statistics && (
                        <Grid container spacing={2} className="mb-24">
                            <Grid item xs={12} sm={6} md={4}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="body2" color="text.secondary">Total Orders</Typography>
                                        <Typography variant="h4">{statistics.total_orders}</Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} sm={6} md={4}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="body2" color="text.secondary">Total Revenue</Typography>
                                        <Typography variant="h4">£{Number(statistics.total_revenue).toFixed(2)}</Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} sm={6} md={4}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="body2" color="text.secondary">Pending Payment</Typography>
                                        <Typography variant="h4" color="warning.main">£{Number(statistics.pending_payment).toFixed(2)}</Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    )}

                    {/* Filters */}
                    <Card className="mb-24">
                        <CardContent>
                            <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
                                <FormControl size="small" sx={{ minWidth: 150 }}>
                                    <InputLabel>Payment Status</InputLabel>
                                    <Select
                                        value={filters.payment_status}
                                        label="Payment Status"
                                        onChange={(e) => setFilters({ ...filters, payment_status: e.target.value })}
                                    >
                                        <MenuItem value="">All</MenuItem>
                                        <MenuItem value="pending">Pending</MenuItem>
                                        <MenuItem value="paid">Paid</MenuItem>
                                        <MenuItem value="partial">Partial</MenuItem>
                                        <MenuItem value="overdue">Overdue</MenuItem>
                                    </Select>
                                </FormControl>
                                <FormControl size="small" sx={{ minWidth: 150 }}>
                                    <InputLabel>Order Status</InputLabel>
                                    <Select
                                        value={filters.order_status}
                                        label="Order Status"
                                        onChange={(e) => setFilters({ ...filters, order_status: e.target.value })}
                                    >
                                        <MenuItem value="">All</MenuItem>
                                        <MenuItem value="pending">Pending</MenuItem>
                                        <MenuItem value="processing">Processing</MenuItem>
                                        <MenuItem value="completed">Completed</MenuItem>
                                        <MenuItem value="cancelled">Cancelled</MenuItem>
                                    </Select>
                                </FormControl>
                                <Button
                                    variant="outlined"
                                    onClick={() => setFilters({ payment_status: '', order_status: '' })}
                                >
                                    Clear Filters
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>

                    {/* Orders Table */}
                    <Card>
                        <CardContent>
                            {loading ? (
                                <Box display="flex" justifyContent="center" py={4}>
                                    <CircularProgress />
                                </Box>
                            ) : orders.length === 0 ? (
                                <Alert severity="info">No orders found</Alert>
                            ) : (
                                <TableContainer>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Order #</TableCell>
                                                <TableCell>Seller</TableCell>
                                                <TableCell>Product</TableCell>
                                                <TableCell>Quantity</TableCell>
                                                <TableCell>Total</TableCell>
                                                <TableCell>Payment Status</TableCell>
                                                <TableCell>Order Status</TableCell>
                                                <TableCell>Due Date</TableCell>
                                                <TableCell>Actions</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {orders.map((order) => (
                                                <TableRow key={order.id}>
                                                    <TableCell>
                                                        <Typography variant="body2" fontWeight={600}>
                                                            {order.order_number}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        {order.vendor?.name || 'N/A'}
                                                        <br />
                                                        <Typography variant="caption" color="text.secondary">
                                                            {order.vendor?.email}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        {order.supplier_product?.name || 'N/A'}
                                                    </TableCell>
                                                    <TableCell>{order.quantity}</TableCell>
                                                    <TableCell>£{Number(order.total).toFixed(2)}</TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={order.payment_status}
                                                            color={getPaymentStatusColor(order.payment_status) as any}
                                                            size="small"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={order.order_status}
                                                            color={getOrderStatusColor(order.order_status) as any}
                                                            size="small"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        {order.due_date ? new Date(order.due_date).toLocaleDateString() : '-'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Box display="flex" gap={1}>
                                                            <Tooltip title="View Details">
                                                                <IconButton size="small" onClick={() => handleViewOrder(order)}>
                                                                    <FuseSvgIcon>heroicons-outline:eye</FuseSvgIcon>
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="Update Order">
                                                                <IconButton size="small" onClick={() => handleUpdateOrder(order)}>
                                                                    <FuseSvgIcon>heroicons-outline:pencil</FuseSvgIcon>
                                                                </IconButton>
                                                            </Tooltip>
                                                            {order.payment_status !== 'paid' && (
                                                                <Tooltip title="Mark as Paid">
                                                                    <IconButton
                                                                        size="small"
                                                                        color="success"
                                                                        onClick={() => handleMarkAsPaid(order)}
                                                                    >
                                                                        <FuseSvgIcon>heroicons-outline:check-circle</FuseSvgIcon>
                                                                    </IconButton>
                                                                </Tooltip>
                                                            )}
                                                        </Box>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </CardContent>
                    </Card>

                    {/* View Order Dialog */}
                    <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
                        <DialogTitle>
                            <Box display="flex" alignItems="center" gap={1}>
                                <FuseSvgIcon sx={{ color: 'primary.main' }}>heroicons-outline:shopping-cart</FuseSvgIcon>
                                <Typography variant="h6" fontWeight="bold">
                                    Order Details: {selectedOrder?.order_number}
                                </Typography>
                            </Box>
                        </DialogTitle>
                        <DialogContent>
                            {selectedOrder && (
                                <Box display="flex" flexDirection="column" gap={2} pt={2}>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="subtitle2" color="text.secondary">Seller</Typography>
                                            <Typography variant="body1">
                                                {selectedOrder.vendor?.name} ({selectedOrder.vendor?.email})
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="subtitle2" color="text.secondary">Product</Typography>
                                            <Typography variant="body1">{selectedOrder.supplier_product?.name}</Typography>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="subtitle2" color="text.secondary">Quantity</Typography>
                                            <Typography variant="body1">{selectedOrder.quantity}</Typography>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="subtitle2" color="text.secondary">Unit Price</Typography>
                                            <Typography variant="body1">£{Number(selectedOrder.unit_price).toFixed(2)}</Typography>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="subtitle2" color="text.secondary">Total</Typography>
                                            <Typography variant="body1" fontWeight={600}>£{Number(selectedOrder.total).toFixed(2)}</Typography>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="subtitle2" color="text.secondary">Payment Method</Typography>
                                            <Typography variant="body1">{selectedOrder.payment_method === 'instant' ? 'Instant Payment' : `Credit (${selectedOrder.credit_days} days)`}</Typography>
                                        </Grid>
                                        {selectedOrder.shipping_name && (
                                            <>
                                                <Grid item xs={12}>
                                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                        Shipping Address
                                                    </Typography>
                                                    <Typography variant="body2">
                                                        {selectedOrder.shipping_name}
                                                        {selectedOrder.shipping_phone && ` - ${selectedOrder.shipping_phone}`}
                                                        <br />
                                                        {selectedOrder.shipping_address}
                                                        <br />
                                                        {selectedOrder.shipping_city}
                                                        {selectedOrder.shipping_state && `, ${selectedOrder.shipping_state}`}
                                                        {selectedOrder.shipping_postal_code && ` ${selectedOrder.shipping_postal_code}`}
                                                        <br />
                                                        {selectedOrder.shipping_country}
                                                    </Typography>
                                                </Grid>
                                            </>
                                        )}
                                    </Grid>
                                </Box>
                            )}
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setDialogOpen(false)}>Close</Button>
                        </DialogActions>
                    </Dialog>

                    {/* Update Order Dialog */}
                    <Dialog open={updateDialogOpen} onClose={() => setUpdateDialogOpen(false)} maxWidth="sm" fullWidth>
                        <DialogTitle>Update Order</DialogTitle>
                        <DialogContent>
                            <Box display="flex" flexDirection="column" gap={3} pt={2}>
                                <FormControl fullWidth>
                                    <InputLabel>Payment Status</InputLabel>
                                    <Select
                                        value={formData.payment_status}
                                        label="Payment Status"
                                        onChange={(e) => setFormData({ ...formData, payment_status: e.target.value as any })}
                                    >
                                        <MenuItem value="pending">Pending</MenuItem>
                                        <MenuItem value="paid">Paid</MenuItem>
                                        <MenuItem value="partial">Partial</MenuItem>
                                        <MenuItem value="overdue">Overdue</MenuItem>
                                    </Select>
                                </FormControl>
                                <FormControl fullWidth>
                                    <InputLabel>Order Status</InputLabel>
                                    <Select
                                        value={formData.order_status}
                                        label="Order Status"
                                        onChange={(e) => setFormData({ ...formData, order_status: e.target.value as any })}
                                    >
                                        <MenuItem value="pending">Pending</MenuItem>
                                        <MenuItem value="processing">Processing</MenuItem>
                                        <MenuItem value="completed">Completed</MenuItem>
                                        <MenuItem value="cancelled">Cancelled</MenuItem>
                                    </Select>
                                </FormControl>
                                <TextField
                                    fullWidth
                                    label="Paid Amount"
                                    type="number"
                                    value={formData.paid_amount}
                                    onChange={(e) => setFormData({ ...formData, paid_amount: parseFloat(e.target.value) || 0 })}
                                    helperText={`Total: £${selectedOrder?.total || 0}`}
                                />
                                <TextField
                                    fullWidth
                                    label="Notes"
                                    multiline
                                    rows={3}
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                />
                            </Box>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setUpdateDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleSaveUpdate} variant="contained">Save</Button>
                        </DialogActions>
                    </Dialog>
                </Box>
            }
        />
    );
}

export default WholesaleOrdersManagement;



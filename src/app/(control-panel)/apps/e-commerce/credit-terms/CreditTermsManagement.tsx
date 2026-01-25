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

interface CreditTerm {
    id: number;
    vendor_id: number;
    vendor?: Vendor;
    payment_method: 'instant' | 'credit';
    credit_days: number | null;
    credit_limit: number;
    used_credit: number;
    is_active: boolean;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

function CreditTermsManagement() {
    const { enqueueSnackbar } = useSnackbar();
    const [creditTerms, setCreditTerms] = useState<CreditTerm[]>([]);
    const [vendors, setvendors] = useState<Vendor[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingTerm, setEditingTerm] = useState<CreditTerm | null>(null);
    const [formData, setFormData] = useState({
        vendor_id: '',
        payment_method: 'credit' as 'instant' | 'credit',
        credit_days: 30,
        credit_limit: 10000,
        notes: '',
    });

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

    // Fetch credit terms and vendors
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const session = await getSession();
            const token = session?.accessAuthToken ||
                session?.accessToken ||
                (typeof window !== 'undefined' ? localStorage.getItem('token') || localStorage.getItem('auth_token') : null);

            // Fetch credit terms
            const termsResponse = await fetch(`${API_BASE_URL}/api/credit-terms`, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                credentials: 'include',
            });

            if (termsResponse.ok) {
                const termsData = await termsResponse.json();
                setCreditTerms(termsData.data || []);
            }

            // Fetch sellers
            try {
                const sellersResponse = await fetch(`${API_BASE_URL}/api/credit-terms/sellers`, {
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    credentials: 'include',
                });

                const sellersData = await sellersResponse.json();
                console.log('Sellers API Response:', sellersResponse.status, sellersData); // Debug

                if (sellersResponse.ok && sellersData?.status === 200) {
                    setsellers(sellersData.data || []);
                    console.log('Sellers set:', sellersData.data); // Debug
                } else {
                    console.error('Failed to fetch sellers:', sellersData);
                    enqueueSnackbar(sellersData.message || 'Failed to load sellers', { variant: 'warning' });
                }
            } catch (err) {
                console.error('Error fetching sellers:', err);
                enqueueSnackbar('Error loading sellers', { variant: 'error' });
            }

        } catch (error) {
            console.error('Failed to fetch data:', error);
            enqueueSnackbar('Failed to load credit terms', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (term?: CreditTerm) => {
        if (term) {
            setEditingTerm(term);
            setFormData({
                seller_id: term.seller_id.toString(),
                payment_method: term.payment_method,
                credit_days: term.credit_days || 30,
                credit_limit: term.credit_limit,
                notes: term.notes || '',
            });
        } else {
            setEditingTerm(null);
            setFormData({
                seller_id: '',
                payment_method: 'credit',
                credit_days: 30,
                credit_limit: 10000,
                notes: '',
            });
        }
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setEditingTerm(null);
    };

    const handleSubmit = async () => {
        try {
            const session = await getSession();
            const token = session?.accessAuthToken ||
                session?.accessToken ||
                (typeof window !== 'undefined' ? localStorage.getItem('token') || localStorage.getItem('auth_token') : null);

            const response = await fetch(`${API_BASE_URL}/api/credit-terms`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                credentials: 'include',
                body: JSON.stringify({
                    seller_id: parseInt(formData.seller_id),
                    payment_method: formData.payment_method,
                    credit_days: formData.payment_method === 'credit' ? formData.credit_days : null,
                    credit_limit: formData.payment_method === 'credit' ? formData.credit_limit : 0,
                    notes: formData.notes,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                enqueueSnackbar(
                    editingTerm ? 'Credit terms updated successfully' : 'Credit terms created successfully',
                    { variant: 'success' }
                );
                handleCloseDialog();
                fetchData();
            } else {
                enqueueSnackbar(data.message || 'Failed to save credit terms', { variant: 'error' });
            }
        } catch (error) {
            console.error('Failed to save credit terms:', error);
            enqueueSnackbar('Failed to save credit terms', { variant: 'error' });
        }
    };

    const getAvailableCredit = (term: CreditTerm) => {
        return term.credit_limit - term.used_credit;
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <FusePageSimple
            scroll="content"
            content={
                <Box className="flex flex-col gap-4 p-4">
                    {/* Header */}
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box>
                            <Typography variant="h4" fontWeight="bold">
                                Credit Terms Management
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Manage credit terms for sellers who purchase from your wholesale catalog
                            </Typography>
                        </Box>
                        <Button
                            variant="contained"
                            startIcon={<FuseSvgIcon>heroicons-outline:plus</FuseSvgIcon>}
                            onClick={() => handleOpenDialog()}
                        >
                            Add Credit Terms
                        </Button>
                    </Box>

                    {/* Info Alert */}
                    <Alert severity="info">
                        <Typography variant="body2">
                            <strong>Credit Terms:</strong> Set credit limits and payment terms for sellers.
                            When sellers import products from your wholesale catalog, they can choose to pay instantly or use credit.
                        </Typography>
                    </Alert>

                    {/* Credit Terms Table */}
                    <Card>
                        <CardContent>
                            {creditTerms.length === 0 ? (
                                <Box p={6} textAlign="center">
                                    <FuseSvgIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }}>
                                        heroicons-outline:credit-card
                                    </FuseSvgIcon>
                                    <Typography variant="h6" color="text.secondary" gutterBottom>
                                        No credit terms found
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                        Create credit terms for sellers to enable credit payment option
                                    </Typography>
                                    <Button
                                        variant="contained"
                                        startIcon={<FuseSvgIcon>heroicons-outline:plus</FuseSvgIcon>}
                                        onClick={() => handleOpenDialog()}
                                    >
                                        Add Credit Terms
                                    </Button>
                                </Box>
                            ) : (
                                <TableContainer>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Seller</TableCell>
                                                <TableCell>Payment Method</TableCell>
                                                <TableCell>Credit Days</TableCell>
                                                <TableCell>Credit Limit</TableCell>
                                                <TableCell>Used Credit</TableCell>
                                                <TableCell>Available Credit</TableCell>
                                                <TableCell>Status</TableCell>
                                                <TableCell align="right">Actions</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {creditTerms.map((term) => (
                                                <TableRow key={term.id}>
                                                    <TableCell>
                                                        <Typography fontWeight={600}>
                                                            {term.vendor?.name || `Seller #${term.vendor_id}`}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {term.vendor?.email}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={term.payment_method === 'credit' ? 'Credit' : 'Instant'}
                                                            color={term.payment_method === 'credit' ? 'primary' : 'default'}
                                                            size="small"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        {term.credit_days ? `${term.credit_days} days` : '-'}
                                                    </TableCell>
                                                    <TableCell>£{Number(term.credit_limit).toFixed(2)}</TableCell>
                                                    <TableCell>£{term.used_credit.toFixed(2)}</TableCell>
                                                    <TableCell>
                                                        <Typography
                                                            fontWeight={600}
                                                            color={getAvailableCredit(term) > 0 ? 'success.main' : 'error.main'}
                                                        >
                                                            £{getAvailableCredit(term).toFixed(2)}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={term.is_active ? 'Active' : 'Inactive'}
                                                            color={term.is_active ? 'success' : 'default'}
                                                            size="small"
                                                        />
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Tooltip title="Edit">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleOpenDialog(term)}
                                                            >
                                                                <FuseSvgIcon>heroicons-outline:pencil</FuseSvgIcon>
                                                            </IconButton>
                                                        </Tooltip>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </CardContent>
                    </Card>

                    {/* Add/Edit Dialog */}
                    <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                        <DialogTitle>
                            <Box display="flex" alignItems="center" gap={1}>
                                <FuseSvgIcon sx={{ color: 'primary.main' }}>heroicons-outline:credit-card</FuseSvgIcon>
                                <Typography variant="h6" fontWeight="bold">
                                    {editingTerm ? 'Edit Credit Terms' : 'Add Credit Terms'}
                                </Typography>
                            </Box>
                        </DialogTitle>
                        <DialogContent>
                            <Box display="flex" flexDirection="column" gap={3} pt={2}>
                                <FormControl fullWidth>
                                    <InputLabel>Seller</InputLabel>
                                    <Select
                                        value={formData.vendor_id}
                                        label="Seller"
                                        onChange={(e) => setFormData({ ...formData, vendor_id: e.target.value })}
                                        disabled={!!editingTerm}
                                    >
                                        {sellers.length === 0 ? (
                                            <MenuItem disabled>
                                                <Typography variant="body2" color="text.secondary">
                                                    No vendors found. Please ensure vendors exist in the system.
                                                </Typography>
                                            </MenuItem>
                                        ) : (
                                            vendors.map((vendor) => (
                                                <MenuItem key={vendor.id} value={vendor.id.toString()}>
                                                    {vendor.name} ({vendor.email})
                                                </MenuItem>
                                            ))
                                        )}
                                    </Select>
                                    {sellers.length === 0 && (
                                        <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                                            No sellers available. Make sure sellers are registered in the system.
                                        </Typography>
                                    )}
                                </FormControl>

                                <FormControl fullWidth>
                                    <InputLabel>Payment Method</InputLabel>
                                    <Select
                                        value={formData.payment_method}
                                        label="Payment Method"
                                        onChange={(e) => setFormData({ ...formData, payment_method: e.target.value as 'instant' | 'credit' })}
                                    >
                                        <MenuItem value="instant">Instant Payment Only</MenuItem>
                                        <MenuItem value="credit">Credit Payment Available</MenuItem>
                                    </Select>
                                </FormControl>

                                {formData.payment_method === 'credit' && (
                                    <>
                                        <FormControl fullWidth>
                                            <InputLabel>Credit Days</InputLabel>
                                            <Select
                                                value={formData.credit_days}
                                                label="Credit Days"
                                                onChange={(e) => setFormData({ ...formData, credit_days: Number(e.target.value) })}
                                            >
                                                <MenuItem value={7}>7 Days</MenuItem>
                                                <MenuItem value={15}>15 Days</MenuItem>
                                                <MenuItem value={30}>30 Days</MenuItem>
                                                <MenuItem value={60}>60 Days</MenuItem>
                                            </Select>
                                        </FormControl>

                                        <TextField
                                            fullWidth
                                            label="Credit Limit"
                                            type="number"
                                            value={formData.credit_limit}
                                            onChange={(e) => setFormData({ ...formData, credit_limit: parseFloat(e.target.value) || 0 })}
                                            helperText="Maximum amount vendor can owe"
                                            inputProps={{ min: 0, step: 0.01 }}
                                        />
                                    </>
                                )}

                                <TextField
                                    fullWidth
                                    label="Notes"
                                    multiline
                                    rows={3}
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    helperText="Optional notes about these credit terms"
                                />
                            </Box>
                        </DialogContent>
                        <DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider' }}>
                            <Button onClick={handleCloseDialog}>Cancel</Button>
                            <Button
                                onClick={handleSubmit}
                                variant="contained"
                                disabled={!formData.seller_id}
                                startIcon={<FuseSvgIcon>heroicons-outline:check</FuseSvgIcon>}
                            >
                                {editingTerm ? 'Update' : 'Create'}
                            </Button>
                        </DialogActions>
                    </Dialog>
                </Box>
            }
        />
    );
}

export default CreditTermsManagement;


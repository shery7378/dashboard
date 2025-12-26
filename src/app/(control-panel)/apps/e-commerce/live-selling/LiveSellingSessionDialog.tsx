'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Stack,
    Chip,
    Autocomplete,
    CircularProgress,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useSnackbar } from 'notistack';
import axios from 'axios';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';

interface LiveSellingSession {
    id?: number;
    title: string;
    description?: string;
    scheduled_at?: string;
    featured_products?: number[];
    thumbnail?: string;
    store_id?: number;
}

interface LiveSellingSessionDialogProps {
    open: boolean;
    onClose: (refresh?: boolean) => void;
    session?: LiveSellingSession | null;
}

function LiveSellingSessionDialog({ open, onClose, session }: LiveSellingSessionDialogProps) {
    const { enqueueSnackbar } = useSnackbar();
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState<any[]>([]);
    const [formData, setFormData] = useState<LiveSellingSession>({
        title: '',
        description: '',
        scheduled_at: undefined,
        featured_products: [],
        thumbnail: '',
        store_id: undefined,
    });

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

    useEffect(() => {
        if (open) {
            if (session) {
                setFormData({
                    title: session.title || '',
                    description: session.description || '',
                    scheduled_at: session.scheduled_at,
                    featured_products: session.featured_products || [],
                    thumbnail: session.thumbnail || '',
                    store_id: session.store_id,
                });
            } else {
                setFormData({
                    title: '',
                    description: '',
                    scheduled_at: undefined,
                    featured_products: [],
                    thumbnail: '',
                    store_id: undefined,
                });
            }
            fetchProducts();
        }
    }, [open, session]);

    const fetchProducts = async () => {
        try {
            const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || localStorage.getItem('auth_token');
            const response = await axios.get(`${apiUrl}/api/products`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json',
                },
                params: {
                    per_page: 100,
                },
            });
            const data = response.data.data?.data || response.data.data || [];
            setProducts(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching products:', err);
        }
    };

    const handleSubmit = async () => {
        if (!formData.title.trim()) {
            enqueueSnackbar('Title is required', { variant: 'error' });
            return;
        }

        try {
            setLoading(true);
            const payload = {
                title: formData.title,
                description: formData.description,
                scheduled_at: formData.scheduled_at,
                featured_products: formData.featured_products,
                thumbnail: formData.thumbnail,
                store_id: formData.store_id,
            };

            const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || localStorage.getItem('auth_token');
            if (session?.id) {
                await axios.put(`${apiUrl}/api/live-selling/${session.id}`, payload, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: 'application/json',
                    },
                });
                enqueueSnackbar('Session updated successfully', { variant: 'success' });
            } else {
                await axios.post(`${apiUrl}/api/live-selling`, payload, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: 'application/json',
                    },
                });
                enqueueSnackbar('Session created successfully', { variant: 'success' });
            }
            onClose(true);
        } catch (err: any) {
            console.error('Error saving session:', err);
            enqueueSnackbar(err.response?.data?.message || 'Failed to save session', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const selectedProducts = products.filter((p) => formData.featured_products?.includes(p.id));

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Dialog open={open} onClose={() => onClose()} maxWidth="md" fullWidth>
                <DialogTitle>
                    {session?.id ? 'Edit Live Selling Session' : 'Create Live Selling Session'}
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={3} className="mt-16">
                        <TextField
                            label="Title"
                            required
                            fullWidth
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Enter session title"
                        />

                        <TextField
                            label="Description"
                            fullWidth
                            multiline
                            rows={4}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Enter session description"
                        />

                        <DateTimePicker
                            label="Scheduled At (Optional)"
                            value={formData.scheduled_at ? new Date(formData.scheduled_at) : null}
                            onChange={(date) =>
                                setFormData({
                                    ...formData,
                                    scheduled_at: date ? date.toISOString() : undefined,
                                })
                            }
                            slotProps={{
                                textField: {
                                    fullWidth: true,
                                },
                            }}
                        />

                        <TextField
                            label="Thumbnail URL (Optional)"
                            fullWidth
                            value={formData.thumbnail}
                            onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                            placeholder="https://example.com/image.jpg"
                        />

                        <Autocomplete
                            multiple
                            options={products}
                            getOptionLabel={(option) => option.name || option.title || `Product ${option.id}`}
                            value={selectedProducts}
                            onChange={(_, newValue) => {
                                setFormData({
                                    ...formData,
                                    featured_products: newValue.map((p) => p.id),
                                });
                            }}
                            renderInput={(params) => (
                                <TextField {...params} label="Featured Products" placeholder="Select products" />
                            )}
                            renderTags={(value, getTagProps) =>
                                value.map((option, index) => (
                                    <Chip
                                        label={option.name || option.title || `Product ${option.id}`}
                                        {...getTagProps({ index })}
                                        key={option.id}
                                    />
                                ))
                            }
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => onClose()} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleSubmit}
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={16} /> : <FuseSvgIcon>heroicons-outline:check</FuseSvgIcon>}
                    >
                        {session?.id ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>
        </LocalizationProvider>
    );
}

export default LiveSellingSessionDialog;


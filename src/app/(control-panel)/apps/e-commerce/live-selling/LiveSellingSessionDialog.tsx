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
    Box,
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
                    page: 1,
                },
            });
            
            // Handle different response structures
            let productsList = [];
            
            if (response.data) {
                // Try different response structures
                if (response.data.data?.data && Array.isArray(response.data.data.data)) {
                    // Paginated response: { data: { data: [...] } }
                    productsList = response.data.data.data;
                } else if (response.data.data && Array.isArray(response.data.data)) {
                    // Direct array: { data: [...] }
                    productsList = response.data.data;
                } else if (response.data.products?.data && Array.isArray(response.data.products.data)) {
                    // Alternative structure: { products: { data: [...] } }
                    productsList = response.data.products.data;
                } else if (Array.isArray(response.data)) {
                    // Direct array response
                    productsList = response.data;
                }
            }
            
            setProducts(productsList);
        } catch (err: any) {
            console.error('Error fetching products:', err);
            enqueueSnackbar(
                err.response?.data?.message || 'Failed to load products. Please try again.',
                { variant: 'error' }
            );
            setProducts([]);
        }
    };

    const handleSubmit = async () => {
        if (!formData.title.trim()) {
            enqueueSnackbar('Title is required', { variant: 'error' });
            return;
        }

        try {
            setLoading(true);
            // Build payload, only include defined values
            const payload: any = {
                title: formData.title,
            };
            
            if (formData.description) {
                payload.description = formData.description;
            }
            
            if (formData.scheduled_at) {
                payload.scheduled_at = formData.scheduled_at;
            }
            
            if (formData.featured_products && formData.featured_products.length > 0) {
                payload.featured_products = formData.featured_products;
            }
            
            if (formData.thumbnail) {
                payload.thumbnail = formData.thumbnail;
            }
            
            if (formData.store_id) {
                payload.store_id = formData.store_id;
            }

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

    // Add global style for date picker and autocomplete poppers
    useEffect(() => {
        if (open) {
            const style = document.createElement('style');
            style.id = 'dialog-poppers-zindex-fix';
            style.textContent = `
                .MuiPickersPopper-root[style*="z-index"] {
                    z-index: 9999 !important;
                }
                .MuiPickersPopper-root .MuiPaper-root {
                    z-index: 9999 !important;
                }
                .MuiDateCalendar-root {
                    z-index: 9999 !important;
                }
                .MuiAutocomplete-popper {
                    z-index: 9999 !important;
                }
                .MuiAutocomplete-popper .MuiPaper-root {
                    z-index: 9999 !important;
                }
                .MuiAutocomplete-listbox {
                    z-index: 9999 !important;
                }
            `;
            document.head.appendChild(style);
            
            return () => {
                const existingStyle = document.getElementById('dialog-poppers-zindex-fix');
                if (existingStyle) {
                    document.head.removeChild(existingStyle);
                }
            };
        }
    }, [open]);

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Dialog 
                open={open} 
                onClose={() => onClose()} 
                maxWidth="md" 
                fullWidth
                disablePortal={false}
                sx={{
                    '& .MuiDialog-container': {
                        zIndex: 1300,
                        overflow: 'visible',
                    },
                    '& .MuiDialog-paper': {
                        zIndex: 1300,
                        position: 'relative',
                        overflow: 'visible',
                        maxHeight: '90vh',
                        borderRadius: 4,
                        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
                    },
                    '& .MuiDialogContent-root': {
                        overflow: 'visible',
                        position: 'relative',
                    },
                    '& .MuiDialog-paperScrollPaper': {
                        overflow: 'visible',
                    },
                }}
            >
                <Box
                    sx={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        padding: 3,
                        position: 'relative',
                        overflow: 'hidden',
                    }}
                >
                    {/* Decorative elements */}
                    <Box
                        sx={{
                            position: 'absolute',
                            top: -30,
                            right: -30,
                            width: 150,
                            height: 150,
                            borderRadius: '50%',
                            background: 'rgba(255, 255, 255, 0.1)',
                            filter: 'blur(40px)',
                        }}
                    />
                    <Box
                        sx={{
                            position: 'absolute',
                            bottom: -20,
                            left: -20,
                            width: 100,
                            height: 100,
                            borderRadius: '50%',
                            background: 'rgba(255, 255, 255, 0.1)',
                            filter: 'blur(30px)',
                        }}
                    />
                    
                    <DialogTitle
                        sx={{
                            color: 'white',
                            fontSize: '1.75rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            position: 'relative',
                            zIndex: 1,
                            pb: 1,
                        }}
                    >
                        <Box
                            sx={{
                                width: 48,
                                height: 48,
                                borderRadius: 2,
                                background: 'rgba(255, 255, 255, 0.2)',
                                backdropFilter: 'blur(10px)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <FuseSvgIcon sx={{ color: 'white', fontSize: 28 }}>
                                {session?.id ? 'heroicons-solid:pencil' : 'heroicons-solid:video-camera'}
                            </FuseSvgIcon>
                        </Box>
                        {session?.id ? 'Edit Live Selling Session' : 'Create Live Selling Session'}
                    </DialogTitle>
                    <Box sx={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.95rem', position: 'relative', zIndex: 1, pl: 10 }}>
                        {session?.id ? 'Update your live selling session details' : 'Fill in the details below to create your live selling session'}
                    </Box>
                </Box>
                <DialogContent sx={{ overflow: 'visible', position: 'relative', p: 4 }}>
                    <Stack spacing={3} sx={{ position: 'relative', zIndex: 1 }}>
                        <TextField
                            label="Title"
                            required
                            fullWidth
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g., Summer Collection Showcase"
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                    '&:hover fieldset': {
                                        borderColor: '#667eea',
                                    },
                                    '&.Mui-focused fieldset': {
                                        borderColor: '#667eea',
                                        borderWidth: 2,
                                    },
                                },
                            }}
                            InputProps={{
                                startAdornment: (
                                    <FuseSvgIcon sx={{ mr: 1.5, color: 'text.secondary', fontSize: 20 }}>
                                        heroicons-outline:chat-bubble-left-right
                                    </FuseSvgIcon>
                                ),
                            }}
                        />

                        <TextField
                            label="Description"
                            fullWidth
                            multiline
                            rows={4}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Describe what you'll be showcasing in this live session..."
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                    '&:hover fieldset': {
                                        borderColor: '#667eea',
                                    },
                                    '&.Mui-focused fieldset': {
                                        borderColor: '#667eea',
                                        borderWidth: 2,
                                    },
                                },
                            }}
                            InputProps={{
                                startAdornment: (
                                    <Box sx={{ alignSelf: 'flex-start', mt: 1.5 }}>
                                        <FuseSvgIcon sx={{ mr: 1.5, color: 'text.secondary', fontSize: 20 }}>
                                            heroicons-outline:document-text
                                        </FuseSvgIcon>
                                    </Box>
                                ),
                            }}
                        />

                        <Box sx={{ position: 'relative', zIndex: 1 }}>
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
                                        sx: {
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2,
                                                '&:hover fieldset': {
                                                    borderColor: '#667eea',
                                                },
                                                '&.Mui-focused fieldset': {
                                                    borderColor: '#667eea',
                                                    borderWidth: 2,
                                                },
                                            },
                                        },
                                        InputProps: {
                                            startAdornment: (
                                                <FuseSvgIcon sx={{ mr: 1.5, color: 'text.secondary', fontSize: 20 }}>
                                                    heroicons-outline:calendar
                                                </FuseSvgIcon>
                                            ),
                                        },
                                    },
                                    popper: {
                                        disablePortal: false,
                                        container: typeof document !== 'undefined' ? document.body : undefined,
                                        sx: {
                                            zIndex: '9999 !important',
                                            '& .MuiPaper-root': {
                                                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                                                zIndex: '9999 !important',
                                                borderRadius: 3,
                                            },
                                            '& .MuiPickersPopper-root': {
                                                zIndex: '9999 !important',
                                            },
                                        },
                                        placement: 'bottom-start',
                                        style: {
                                            zIndex: 9999,
                                        },
                                        modifiers: [
                                            {
                                                name: 'offset',
                                                options: {
                                                    offset: [0, 8],
                                                },
                                            },
                                            {
                                                name: 'preventOverflow',
                                                options: {
                                                    boundary: 'viewport',
                                                    padding: 8,
                                                },
                                            },
                                            {
                                                name: 'flip',
                                                options: {
                                                    fallbackPlacements: ['top-start', 'bottom-start'],
                                                },
                                            },
                                        ],
                                    },
                                }}
                            />
                        </Box>

                        <TextField
                            label="Thumbnail URL (Optional)"
                            fullWidth
                            value={formData.thumbnail}
                            onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                            placeholder="https://example.com/image.jpg"
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                    '&:hover fieldset': {
                                        borderColor: '#667eea',
                                    },
                                    '&.Mui-focused fieldset': {
                                        borderColor: '#667eea',
                                        borderWidth: 2,
                                    },
                                },
                            }}
                            InputProps={{
                                startAdornment: (
                                    <FuseSvgIcon sx={{ mr: 1.5, color: 'text.secondary', fontSize: 20 }}>
                                        heroicons-outline:photo
                                    </FuseSvgIcon>
                                ),
                            }}
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
                            loading={products.length === 0}
                            noOptionsText={products.length === 0 ? "Loading products..." : "No products found"}
                            isOptionEqualToValue={(option, value) => option.id === value.id}
                            slotProps={{
                                popper: {
                                    disablePortal: false,
                                    container: typeof document !== 'undefined' ? document.body : undefined,
                                    sx: {
                                        zIndex: '9999 !important',
                                        '& .MuiPaper-root': {
                                            zIndex: '9999 !important',
                                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                                            borderRadius: 2,
                                            mt: 1,
                                        },
                                        '& .MuiAutocomplete-listbox': {
                                            maxHeight: 300,
                                        },
                                    },
                                    style: {
                                        zIndex: 9999,
                                    },
                                    modifiers: [
                                        {
                                            name: 'offset',
                                            options: {
                                                offset: [0, 8],
                                            },
                                        },
                                        {
                                            name: 'preventOverflow',
                                            options: {
                                                boundary: 'viewport',
                                                padding: 8,
                                            },
                                        },
                                    ],
                                },
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Featured Products"
                                    placeholder={products.length === 0 ? "Loading products..." : "Select products to feature in this session"}
                                    helperText={products.length === 0 ? "Fetching your products..." : `${products.length} products available`}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
                                            '&:hover fieldset': {
                                                borderColor: '#667eea',
                                            },
                                            '&.Mui-focused fieldset': {
                                                borderColor: '#667eea',
                                                borderWidth: 2,
                                            },
                                        },
                                    }}
                                    InputProps={{
                                        ...params.InputProps,
                                        startAdornment: (
                                            <>
                                                <FuseSvgIcon sx={{ mr: 1.5, color: 'text.secondary', fontSize: 20 }}>
                                                    heroicons-outline:sparkles
                                                </FuseSvgIcon>
                                                {params.InputProps.startAdornment}
                                            </>
                                        ),
                                    }}
                                />
                            )}
                            renderTags={(value, getTagProps) =>
                                value.map((option, index) => (
                                    <Chip
                                        label={option.name || option.title || `Product ${option.id}`}
                                        {...getTagProps({ index })}
                                        key={option.id}
                                        sx={{
                                            borderRadius: 2,
                                            background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
                                            border: '1px solid',
                                            borderColor: '#667eea30',
                                            '& .MuiChip-deleteIcon': {
                                                color: '#667eea',
                                            },
                                        }}
                                    />
                                ))
                            }
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 2, gap: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Button
                        onClick={() => onClose()}
                        disabled={loading}
                        sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 600,
                            px: 3,
                            py: 1,
                            color: 'text.secondary',
                            '&:hover': {
                                backgroundColor: 'action.hover',
                            },
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSubmit}
                        disabled={loading}
                        startIcon={
                            loading ? (
                                <CircularProgress size={16} color="inherit" />
                            ) : (
                                <FuseSvgIcon sx={{ fontSize: 18 }}>
                                    {session?.id ? 'heroicons-solid:check-circle' : 'heroicons-solid:plus-circle'}
                                </FuseSvgIcon>
                            )
                        }
                        sx={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 700,
                            px: 4,
                            py: 1,
                            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #5568d3 0%, #6a3d91 100%)',
                                boxShadow: '0 6px 20px rgba(102, 126, 234, 0.5)',
                            },
                            '&:disabled': {
                                background: 'rgba(102, 126, 234, 0.5)',
                            },
                        }}
                    >
                        {session?.id ? 'Update Session' : 'Create Session'}
                    </Button>
                </DialogActions>
            </Dialog>
        </LocalizationProvider>
    );
}

export default LiveSellingSessionDialog;


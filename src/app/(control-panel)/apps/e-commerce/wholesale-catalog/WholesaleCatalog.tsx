'use client';

import { useState, useMemo, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    Grid,
    Chip,
    CircularProgress,
    Alert,
    Pagination,
    InputAdornment,
    IconButton,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Tooltip,
    Skeleton,
} from '@mui/material';
import { motion, AnimatePresence } from 'motion/react';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { useSnackbar } from 'notistack';
import { useGetSupplierProductsQuery, useImportProductMutation, EcommerceProduct } from '../apis/ProductsLaravelApi';
import WholesaleCatalogHeader from './WholesaleCatalogHeader';
import PaymentMethodDialog from './PaymentMethodDialog';

function WholesaleCatalog() {
    const { enqueueSnackbar } = useSnackbar();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [sortBy, setSortBy] = useState<'latest' | 'name' | 'price'>('latest');
    const [categoryFilter, setCategoryFilter] = useState<string>('');
    const [inStockFilter, setInStockFilter] = useState<boolean | undefined>(undefined);
    const [importingId, setImportingId] = useState<string | null>(null);
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<{ id: string; supplierId?: string; price: number } | null>(null);

    const { data, isLoading, error, refetch } = useGetSupplierProductsQuery({
        page,
        perPage: 12,
        search: search || undefined,
        categoryId: categoryFilter || undefined,
        inStock: inStockFilter,
    }, {
        // Skip the query if we're not ready
        skip: false,
        // Better error handling
        errorPolicy: 'all',
    });

    // Debug logging for troubleshooting
    useEffect(() => {
        if (error) {
            console.error('Wholesale Catalog API Error:', {
                error,
                status: (error as any)?.status,
                data: (error as any)?.data,
                endpoint: '/api/products/suppliers',
                apiBaseUrl: process.env.NEXT_PUBLIC_API_URL,
            });
        }
        if (data) {
            console.log('Wholesale Catalog API Response:', {
                data,
                products: data?.products,
                productsData: data?.products?.data,
                dataArray: data?.data,
                total: data?.products?.meta?.total ?? data?.meta?.total,
            });
        }
    }, [error, data]);

    const [importProduct, { isLoading: isImporting }] = useImportProductMutation();

    const products = useMemo(() => {
        // Handle different response formats
        let productList: any[] = [];
        
        if (data) {
            // Try multiple possible response structures
            if (Array.isArray(data)) {
                productList = data;
            } else if (data.products?.data && Array.isArray(data.products.data)) {
                productList = data.products.data;
            } else if (data.data && Array.isArray(data.data)) {
                productList = data.data;
            } else if (data.products && Array.isArray(data.products)) {
                productList = data.products;
            }
        }
        
        // Ensure we have an array
        if (!Array.isArray(productList)) {
            productList = [];
        }
        
        // Sort products
        if (sortBy === 'name') {
            productList = [...productList].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        } else if (sortBy === 'price') {
            productList = [...productList].sort((a, b) => {
                const priceA = parseFloat((a.price_tax_incl || a.price || 0).toString());
                const priceB = parseFloat((b.price_tax_incl || b.price || 0).toString());
                return priceA - priceB;
            });
        }
        
        return productList;
    }, [data, sortBy]);

    const pagination = useMemo(() => {
        // Handle different pagination formats
        return data?.products?.meta ?? data?.meta ?? data?.pagination;
    }, [data]);

    const handleSearch = () => {
        setSearch(searchInput);
        setPage(1);
    };

    const handleImportClick = (product: EcommerceProduct) => {
        // Get supplier ID from product store
        const supplierId = (product as any).store?.user_id || (product as any).store_id;
        // Prioritize effective_price (includes flash sale pricing), then price_tax_incl, then price_tax_excl, then price
        let price = 0;
        if ((product as any).effective_price && (product as any).effective_price > 0) {
            price = parseFloat((product as any).effective_price.toString());
        } else if (product.price_tax_incl && product.price_tax_incl > 0) {
            price = parseFloat(product.price_tax_incl.toString());
        } else if (product.price_tax_excl && product.price_tax_excl > 0) {
            price = parseFloat(product.price_tax_excl.toString());
        } else if (product.price && product.price > 0) {
            price = parseFloat(product.price.toString());
        }
        
        setSelectedProduct({
            id: product.id,
            supplierId: supplierId?.toString(),
            price,
        });
        setPaymentDialogOpen(true);
    };

    const handleImportConfirm = async (paymentMethod: 'instant' | 'credit', quantity: number, creditDays?: number, paymentIntentId?: string) => {
        if (!selectedProduct) return;

        setPaymentDialogOpen(false);
        setImportingId(selectedProduct.id);
        
        try {
            const result = await importProduct({
                productId: selectedProduct.id,
                paymentMethod,
                quantity,
                creditDays,
                paymentIntentId, // Pass Stripe payment intent ID for instant payments
            }).unwrap();
            
            enqueueSnackbar(
                result.message || 
                (paymentMethod === 'instant' 
                    ? 'Product imported successfully. Payment processed. Inventory sync enabled.'
                    : 'Product imported successfully. Credit order created. Inventory sync enabled.'), 
                { 
                    variant: 'success',
                    anchorOrigin: { vertical: 'top', horizontal: 'right' }
                }
            );
            
            setImportingId(null);
            setSelectedProduct(null);
            refetch(); // Refresh the list
        } catch (error: any) {
            const errorMessage = error?.data?.message || error?.data?.error || error?.message || 'Failed to import product';
            enqueueSnackbar(errorMessage, { 
                variant: 'error',
                anchorOrigin: { vertical: 'top', horizontal: 'right' }
            });
            setImportingId(null);
            setSelectedProduct(null);
        }
    };

    const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
        setPage(value);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <Box className="flex flex-col gap-4 p-4">
            <WholesaleCatalogHeader />

            {/* Search and Filter Bar */}
            <Card>
                <CardContent>
                    <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
                        <TextField
                            fullWidth
                            placeholder="Search products by name or SKU..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    handleSearch();
                                }
                            }}
                            sx={{ flex: 1, minWidth: 200 }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <FuseSvgIcon>heroicons-outline:magnifying-glass</FuseSvgIcon>
                                    </InputAdornment>
                                ),
                                endAdornment: searchInput && (
                                    <InputAdornment position="end">
                                        <IconButton 
                                            size="small" 
                                            onClick={() => {
                                                setSearchInput('');
                                                setSearch('');
                                                setPage(1);
                                            }}
                                        >
                                            <FuseSvgIcon>heroicons-outline:x-mark</FuseSvgIcon>
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <Button
                            variant="contained"
                            onClick={handleSearch}
                            startIcon={<FuseSvgIcon>heroicons-outline:magnifying-glass</FuseSvgIcon>}
                            sx={{ minWidth: 120 }}
                        >
                            Search
                        </Button>
                        <FormControl size="small" sx={{ minWidth: 150 }}>
                            <InputLabel>Sort By</InputLabel>
                            <Select
                                value={sortBy}
                                label="Sort By"
                                onChange={(e) => setSortBy(e.target.value as any)}
                            >
                                <MenuItem value="latest">Latest</MenuItem>
                                <MenuItem value="name">Name A-Z</MenuItem>
                                <MenuItem value="price">Price Low-High</MenuItem>
                            </Select>
                        </FormControl>
                        <FormControl size="small" sx={{ minWidth: 150 }}>
                            <InputLabel>Stock Status</InputLabel>
                            <Select
                                value={inStockFilter === undefined ? 'all' : inStockFilter ? 'in_stock' : 'out_of_stock'}
                                label="Stock Status"
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setInStockFilter(value === 'all' ? undefined : value === 'in_stock');
                                    setPage(1);
                                }}
                            >
                                <MenuItem value="all">All Products</MenuItem>
                                <MenuItem value="in_stock">In Stock</MenuItem>
                                <MenuItem value="out_of_stock">Out of Stock</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </CardContent>
            </Card>

            {/* Info Alert */}
            <Alert severity="info" icon={<FuseSvgIcon>heroicons-outline:information-circle</FuseSvgIcon>}>
                <Typography variant="body2">
                    <strong>Wholesale Catalog:</strong> Browse products from suppliers. When you import a product, 
                    inventory sync will be automatically enabled, so stock updates from suppliers will sync to your store automatically.
                </Typography>
            </Alert>

            {/* Products Grid */}
            {error && (
                <Alert 
                    severity="error" 
                    action={
                        <Button color="inherit" size="small" onClick={() => refetch()}>
                            Retry
                        </Button>
                    }
                >
                    <Typography variant="body2" component="div">
                        <strong>Failed to load products.</strong>
                        <br />
                        {(() => {
                            // Extract error message from different error formats
                            let errorMessage = 'Please check your connection and try again.';
                            let errorStatus = null;
                            
                            if (error && 'data' in error) {
                                const errorData = error.data;
                                
                                // Handle object error data
                                if (typeof errorData === 'object' && errorData !== null) {
                                    if ('message' in errorData) {
                                        errorMessage = (errorData as any).message;
                                    } else if ('error' in errorData && typeof (errorData as any).error === 'object') {
                                        errorMessage = (errorData as any).error?.message || errorMessage;
                                    }
                                } else if (typeof errorData === 'string') {
                                    errorMessage = errorData;
                                }
                            }
                            
                            // Get status code
                            if (error && 'status' in error) {
                                errorStatus = (error as any).status;
                            }
                            
                            // Build detailed error message
                            let fullMessage = errorMessage;
                            
                            if (errorStatus) {
                                if (errorStatus === 404) {
                                    fullMessage = `Route not found (404). The API endpoint /api/products/suppliers may not be registered. Please check your backend routes.`;
                                } else if (errorStatus === 401) {
                                    fullMessage = `Unauthorized (401). Please ensure you are logged in and have the correct permissions.`;
                                } else if (errorStatus === 403) {
                                    fullMessage = `Forbidden (403). You don't have permission to access supplier products.`;
                                } else if (errorStatus === 500) {
                                    fullMessage = `Server error (500). ${errorMessage}`;
                                } else {
                                    fullMessage = `Error ${errorStatus}: ${errorMessage}`;
                                }
                            }
                            
                            return fullMessage;
                        })()}
                        <br />
                        <Typography variant="caption" sx={{ mt: 1, display: 'block', opacity: 0.8 }}>
                            API Endpoint: /api/products/suppliers
                            {error && 'status' in error && (
                                <> | Status: {(error as any).status}</>
                            )}
                        </Typography>
                    </Typography>
                </Alert>
            )}

            {isLoading ? (
                <Grid container spacing={3}>
                    {[...Array(6)].map((_, index) => (
                        <Grid item xs={12} sm={6} md={4} key={index}>
                            <Card>
                                <Skeleton variant="rectangular" height={200} />
                                <CardContent>
                                    <Skeleton height={24} width="80%" />
                                    <Skeleton height={20} width="60%" sx={{ mt: 1 }} />
                                    <Skeleton height={20} width="40%" sx={{ mt: 1 }} />
                                    <Box display="flex" gap={1} mt={2}>
                                        <Skeleton variant="rectangular" width={60} height={24} />
                                        <Skeleton variant="rectangular" width={60} height={24} />
                                    </Box>
                                </CardContent>
                                <Box p={2}>
                                    <Skeleton variant="rectangular" height={36} />
                                </Box>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            ) : products.length === 0 ? (
                <Card>
                    <CardContent>
                        <Box p={6} textAlign="center">
                            <FuseSvgIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }}>
                                heroicons-outline:inbox
                            </FuseSvgIcon>
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                No supplier products found
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {search ? 'Try adjusting your search criteria' : 'Suppliers haven\'t added any products yet'}
                            </Typography>
                        </Box>
                    </CardContent>
                </Card>
            ) : (
                <>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="body2" color="text.secondary">
                            Found {pagination?.total || products.length} supplier products
                        </Typography>
                        {search && (
                            <Chip 
                                label={`Search: "${search}"`} 
                                onDelete={() => {
                                    setSearch('');
                                    setSearchInput('');
                                    setPage(1);
                                }}
                                color="primary"
                                variant="outlined"
                            />
                        )}
                    </Box>
                    <Grid container spacing={3}>
                        <AnimatePresence>
                            {products.map((product: EcommerceProduct, index: number) => {
                                // Handle different image formats
                                const featuredImage = (product as any).featured_image;
                                const imageUrl = featuredImage?.url || featuredImage?.[0]?.url || product.image
                                    ? `${process.env.NEXT_PUBLIC_API_URL}/${featuredImage?.url || featuredImage?.[0]?.url || product.image}`
                                    : '/assets/images/apps/ecommerce/product-image-placeholder.png';
                                const isImporting = importingId === product.id;
                                // Prioritize effective_price, then price_tax_incl, then price_tax_excl, then price
                                // Use nullish coalescing and explicit checks to handle 0 values correctly
                                let priceTaxIncl = 0;
                                if ((product as any).effective_price && (product as any).effective_price > 0) {
                                    priceTaxIncl = parseFloat((product as any).effective_price.toString());
                                } else if (product.price_tax_incl && product.price_tax_incl > 0) {
                                    priceTaxIncl = parseFloat(product.price_tax_incl.toString());
                                } else if (product.price_tax_excl && product.price_tax_excl > 0) {
                                    priceTaxIncl = parseFloat(product.price_tax_excl.toString());
                                } else if (product.price && product.price > 0) {
                                    priceTaxIncl = parseFloat(product.price.toString());
                                }
                                
                                const quantity = product.quantity || product.stock_quantity || 0;

                                return (
                                    <Grid item xs={12} sm={6} md={4} key={product.id}>
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            transition={{ duration: 0.3, delay: index * 0.05 }}
                                        >
                                            <Card 
                                                elevation={2}
                                                sx={{ 
                                                    height: '100%', 
                                                    display: 'flex', 
                                                    flexDirection: 'column',
                                                    borderRadius: 3,
                                                    overflow: 'hidden',
                                                    position: 'relative',
                                                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                                    border: '1px solid',
                                                    borderColor: 'divider',
                                                    '&:hover': {
                                                        transform: 'translateY(-8px) scale(1.02)',
                                                        boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                                                        borderColor: 'primary.main',
                                                    }
                                                }}
                                            >
                                                {/* Image Section */}
                                                <Box 
                                                    position="relative"
                                                    sx={{
                                                        height: 280,
                                                        overflow: 'hidden',
                                                        background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
                                                    }}
                                                >
                                                    <Box
                                                        component="img"
                                                        src={imageUrl}
                                                        alt={product.name}
                                                        sx={{ 
                                                            height: '100%',
                                                            width: '100%',
                                                            objectFit: 'cover',
                                                            transition: 'transform 0.5s ease',
                                                            '&:hover': {
                                                                transform: 'scale(1.1)',
                                                            }
                                                        }}
                                                    />
                                                    
                                                    {/* Stock Badge */}
                                                    <Chip
                                                        label={quantity > 0 ? `In Stock (${quantity})` : 'Out of Stock'}
                                                        size="small"
                                                        color={quantity > 0 ? 'success' : 'error'}
                                                        sx={{
                                                            position: 'absolute',
                                                            top: 12,
                                                            left: 12,
                                                            fontWeight: 700,
                                                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                                        }}
                                                    />

                                                    {/* Price Badge */}
                                                    {priceTaxIncl > 0 && (
                                                        <Box
                                                            sx={{
                                                                position: 'absolute',
                                                                top: 12,
                                                                right: 12,
                                                                backgroundColor: 'rgba(102, 126, 234, 0.95)',
                                                                color: 'white',
                                                                px: 1.5,
                                                                py: 0.5,
                                                                borderRadius: 2,
                                                                fontWeight: 700,
                                                                fontSize: '0.875rem',
                                                                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                                                            }}
                                                        >
                                                            £{priceTaxIncl.toFixed(2)}
                                                        </Box>
                                                    )}
                                                    {priceTaxIncl === 0 && (
                                                        <Box
                                                            sx={{
                                                                position: 'absolute',
                                                                top: 12,
                                                                right: 12,
                                                                backgroundColor: 'rgba(255, 152, 0, 0.95)',
                                                                color: 'white',
                                                                px: 1.5,
                                                                py: 0.5,
                                                                borderRadius: 2,
                                                                fontWeight: 700,
                                                                fontSize: '0.75rem',
                                                                boxShadow: '0 4px 12px rgba(255, 152, 0, 0.4)',
                                                            }}
                                                        >
                                                            Price on Request
                                                        </Box>
                                                    )}

                                                    {/* Importing Overlay */}
                                                    {isImporting && (
                                                        <Box
                                                            sx={{
                                                                position: 'absolute',
                                                                top: 0,
                                                                left: 0,
                                                                right: 0,
                                                                bottom: 0,
                                                                backgroundColor: 'rgba(102, 126, 234, 0.9)',
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                gap: 2,
                                                            }}
                                                        >
                                                            <CircularProgress sx={{ color: 'white' }} size={48} />
                                                            <Typography variant="body1" sx={{ color: 'white', fontWeight: 600 }}>
                                                                Importing...
                                                            </Typography>
                                                        </Box>
                                                    )}
                                                </Box>

                                                {/* Content Section */}
                                                <CardContent sx={{ flexGrow: 1, p: 2.5, pb: 1 }}>
                                                    <Tooltip title={product.name} arrow>
                                                        <Typography 
                                                            variant="h6" 
                                                            component="h3" 
                                                            sx={{ 
                                                                mb: 1.5,
                                                                fontWeight: 700,
                                                                fontSize: '1.1rem',
                                                                display: '-webkit-box',
                                                                WebkitLineClamp: 2,
                                                                WebkitBoxOrient: 'vertical',
                                                                overflow: 'hidden',
                                                                minHeight: 56,
                                                            }}
                                                        >
                                                            {product.name}
                                                        </Typography>
                                                    </Tooltip>

                                                    {product.sku && (
                                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                            SKU: {product.sku}
                                                        </Typography>
                                                    )}

                                                    {product.description && (
                                                        <Typography 
                                                            variant="body2" 
                                                            color="text.secondary"
                                                            sx={{
                                                                display: '-webkit-box',
                                                                WebkitLineClamp: 2,
                                                                WebkitBoxOrient: 'vertical',
                                                                overflow: 'hidden',
                                                                mb: 1.5,
                                                            }}
                                                        >
                                                            {product.description}
                                                        </Typography>
                                                    )}
                                                </CardContent>

                                                {/* Action Button */}
                                                <Box p={2.5} pt={0}>
                                                    <Button
                                                        fullWidth
                                                        variant="contained"
                                                        onClick={() => handleImportClick(product)}
                                                        disabled={isImporting || importingId !== null || quantity === 0}
                                                        startIcon={
                                                            isImporting ? (
                                                                <CircularProgress size={18} color="inherit" />
                                                            ) : (
                                                                <FuseSvgIcon>heroicons-outline:arrow-down-tray</FuseSvgIcon>
                                                            )
                                                        }
                                                        sx={{
                                                            background: isImporting || quantity === 0
                                                                ? 'linear-gradient(135deg, #9e9e9e 0%, #757575 100%)'
                                                                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                            '&:hover': {
                                                                background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                                                                transform: 'translateY(-2px)',
                                                                boxShadow: '0 8px 16px rgba(102, 126, 234, 0.4)',
                                                            },
                                                            fontWeight: 700,
                                                            py: 1.5,
                                                            borderRadius: 2,
                                                            textTransform: 'none',
                                                        }}
                                                    >
                                                        {isImporting ? 'Importing...' : quantity === 0 ? 'Out of Stock' : 'Import Product'}
                                                    </Button>
                                                    <Typography 
                                                        variant="caption" 
                                                        color="text.secondary" 
                                                        sx={{ 
                                                            display: 'block', 
                                                            textAlign: 'center', 
                                                            mt: 1,
                                                            fontSize: '0.7rem',
                                                        }}
                                                    >
                                                        Inventory sync will be enabled automatically
                                                    </Typography>
                                                </Box>
                                            </Card>
                                        </motion.div>
                                    </Grid>
                                );
                            })}
                        </AnimatePresence>
                    </Grid>
                    {pagination && pagination.last_page > 1 && (
                        <Box display="flex" justifyContent="center" mt={4}>
                            <Pagination
                                count={pagination.last_page}
                                page={page}
                                onChange={handlePageChange}
                                color="primary"
                                size="large"
                                showFirstButton
                                showLastButton
                            />
                        </Box>
                    )}
                </>
            )}

            {/* Payment Method Dialog */}
            {selectedProduct && (
                <PaymentMethodDialog
                    open={paymentDialogOpen}
                    onClose={() => {
                        setPaymentDialogOpen(false);
                        setSelectedProduct(null);
                    }}
                    onConfirm={handleImportConfirm}
                    productId={selectedProduct.id}
                    supplierId={selectedProduct.supplierId}
                    productPrice={selectedProduct.price}
                    isLoading={isImporting && importingId === selectedProduct.id}
                />
            )}
        </Box>
    );
}

export default WholesaleCatalog;


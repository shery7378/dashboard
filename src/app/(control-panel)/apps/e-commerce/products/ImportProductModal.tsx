'use client';

import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  Pagination,
  InputAdornment,
  IconButton,
  Tooltip,
  Skeleton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { motion, AnimatePresence } from 'motion/react';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { useTranslation } from 'react-i18next';
import { useGetOtherSellersProductsQuery, useImportProductMutation, EcommerceProduct } from '../apis/ProductsLaravelApi';
import { useSnackbar } from 'notistack';
import './i18n';

interface ImportProductModalProps {
  open: boolean;
  onClose: () => void;
  onProductSelect?: (product: EcommerceProduct) => void; // Optional callback for form population mode
  mode?: 'import' | 'select'; // 'import' creates new product, 'select' just returns product data
}

function ImportProductModal({ open, onClose, onProductSelect, mode = 'import' }: ImportProductModalProps) {
  const { t } = useTranslation('products');
  const { enqueueSnackbar } = useSnackbar();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [sortBy, setSortBy] = useState<'latest' | 'name' | 'price'>('latest');
  const [importingId, setImportingId] = useState<string | null>(null);

  const { data, isLoading, error } = useGetOtherSellersProductsQuery({
    page,
    perPage: 12,
    search: search || undefined,
  });

  const [importProduct, { isLoading: isImporting }] = useImportProductMutation();

  const products = useMemo(() => {
    // Handle ProductCollection response structure: { products: { data: [...], meta: {...} } }
    let productList = data?.products?.data ?? data?.data ?? [];

    // Sort products
    if (sortBy === 'name') {
      productList = [...productList].sort((a, b) => a.name.localeCompare(b.name));
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
    return data?.products?.meta ?? data?.pagination;
  }, [data]);

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const handleImport = async (productId: string | number | undefined) => {
    if (!productId) {
      enqueueSnackbar('Invalid product ID', {
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'right' }
      });
      return;
    }

    const idString = String(productId);

    // If mode is 'select', find the product and call onProductSelect callback
    if (mode === 'select' && onProductSelect) {
      const product = products.find((p: EcommerceProduct) => String(p.id) === idString);
      if (product) {
        onProductSelect(product);
        onClose();
        return;
      } else {
        enqueueSnackbar('Product not found', {
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
        return;
      }
    }

    // Default mode: import product (create new product)
    setImportingId(idString);
    try {
      const result = await importProduct({
        productId: idString,
        paymentMethod: 'instant',
        quantity: 1,
        importFromOwn: false
      }).unwrap();

      // If import returns product data and we have a callback, populate the form
      if (result.data?.product && onProductSelect) {
        // Use the imported product data to populate the form with ALL fields
        onProductSelect(result.data.product);
        enqueueSnackbar('Product imported and form populated with all details', {
          variant: 'success',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
        onClose(); // Close modal after populating form
      } else if (result.data?.product_id && onProductSelect) {
        // If only product_id is returned, try to fetch the full product
        // Note: This would require importing useGetECommerceProductQuery
        // For now, just show success message
        enqueueSnackbar(result.message || t('product_imported_successfully'), {
          variant: 'success',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
        // Don't close modal, let user continue importing
      } else {
        enqueueSnackbar(result.message || t('product_imported_successfully'), {
          variant: 'success',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
        // Don't close modal, let user continue importing
      }
      setImportingId(null);
    } catch (error: any) {
      const errorMessage = error?.data?.message || error?.data?.error || error?.message || t('failed_to_import_product');
      enqueueSnackbar(errorMessage, {
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'right' }
      });
      setImportingId(null);

      // Log detailed error in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Product import error:', {
          error,
          productId: idString,
          details: error?.data?.details,
          message: error?.data?.message,
          fullError: error,
        });
      }
    }
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: '90vh',
        }
      }}
    >
      <DialogTitle sx={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        pb: 2,
        pt: 3
      }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <FuseSvgIcon sx={{ fontSize: 28 }}>heroicons-outline:arrow-down-tray</FuseSvgIcon>
            <Typography variant="h5" fontWeight="bold">
              {t('import_product_from_other_sellers')}
            </Typography>
          </Box>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              color: 'white',
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
            }}
          >
            <FuseSvgIcon>heroicons-outline:x-mark</FuseSvgIcon>
          </IconButton>
        </Box>
        <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
          Browse and import products from other sellers. Set your own prices!
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ p: 3 }}>
        {/* Search and Filter Bar */}
        <Box mb={3} display="flex" gap={2} flexWrap="wrap" alignItems="center">
          <TextField
            fullWidth
            placeholder={t('search_products')}
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
        </Box>

        {error && (
          <Alert
            severity="error"
            sx={{ mb: 2 }}
            action={
              <Button color="inherit" size="small" onClick={() => window.location.reload()}>
                Retry
              </Button>
            }
          >
            {t('failed_to_load_products')}
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
          <Box p={6} textAlign="center">
            <FuseSvgIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }}>
              heroicons-outline:inbox
            </FuseSvgIcon>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {t('no_products_found')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try adjusting your search criteria
            </Typography>
          </Box>
        ) : (
          <>
            <Box mb={2} display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary">
                Found {pagination?.total || products.length} products
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
                  // Debug: Log product if ID is missing
                  if (!product.id && process.env.NODE_ENV === 'development') {
                    console.warn('Product missing ID:', product);
                  }

                  const imageUrl = product.featured_image?.url
                    ? `${process.env.NEXT_PUBLIC_API_URL}/${product.featured_image.url}`
                    : '/assets/images/apps/ecommerce/product-image-placeholder.png';
                  const productId = product.id || product.data?.id || String(index);
                  const isImporting = importingId === productId;
                  const priceTaxIncl = parseFloat((product.price_tax_incl || product.price || 0).toString());
                  const comparedPrice = parseFloat((product.compared_price || 0).toString());

                  // Show strike-through if compared price is higher than current price
                  const showStrike = comparedPrice > 0 && comparedPrice > priceTaxIncl;

                  return (
                    <Grid item xs={12} sm={6} md={4} key={productId}>
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
                          {/* Image Section with Overlay */}
                          <Box
                            position="relative"
                            sx={{
                              height: 280,
                              overflow: 'hidden',
                              background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
                            }}
                          >
                            <CardMedia
                              component="img"
                              image={imageUrl}
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

                            {/* Gradient Overlay */}
                            <Box
                              sx={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                height: '40%',
                                background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)',
                              }}
                            />

                            {/* Category Badge */}
                            {product.main_category && (
                              <Chip
                                icon={<FuseSvgIcon sx={{ fontSize: 16 }}>heroicons-outline:tag</FuseSvgIcon>}
                                label={product.main_category.name}
                                size="small"
                                sx={{
                                  position: 'absolute',
                                  top: 12,
                                  left: 12,
                                  backgroundColor: 'rgba(255,255,255,0.95)',
                                  fontWeight: 700,
                                  fontSize: '0.75rem',
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                  backdropFilter: 'blur(10px)',
                                }}
                              />
                            )}

                            {/* Price Badge */}
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
                                backdropFilter: 'blur(10px)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-end',
                                gap: 0.25,
                              }}
                            >
                              {priceTaxIncl === 0 && comparedPrice > 0 ? (
                                <span style={{ textDecoration: 'line-through', opacity: 0.8 }}>
                                  £{comparedPrice.toFixed(2)}
                                </span>
                              ) : showStrike && priceTaxIncl > 0 ? (
                                <>
                                  <span>£{priceTaxIncl.toFixed(2)}</span>
                                  <span style={{ textDecoration: 'line-through', fontSize: '0.7rem', opacity: 0.8 }}>
                                    £{comparedPrice.toFixed(2)}
                                  </span>
                                </>
                              ) : (
                                <span>£{priceTaxIncl.toFixed(2)}</span>
                              )}
                            </Box>

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
                                  backdropFilter: 'blur(5px)',
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
                            {/* Product Name */}
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
                                  lineHeight: 1.4,
                                  color: 'text.primary',
                                }}
                              >
                                {product.name}
                              </Typography>
                            </Tooltip>

                            {/* Store Info */}
                            <Box
                              display="flex"
                              alignItems="center"
                              gap={1}
                              mb={2}
                              sx={{
                                p: 1,
                                borderRadius: 2,
                                backgroundColor: 'action.hover',
                              }}
                            >
                              <Box
                                sx={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: '50%',
                                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'white',
                                }}
                              >
                                <FuseSvgIcon sx={{ fontSize: 18 }}>
                                  heroicons-outline:building-storefront
                                </FuseSvgIcon>
                              </Box>
                              <Box flex={1}>
                                <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.7rem' }}>
                                  From Store
                                </Typography>
                                <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.85rem' }}>
                                  {(product.store as any)?.name || t('unknown_store')}
                                </Typography>
                              </Box>
                            </Box>

                            {/* Tags Section */}
                            {product.tags && product.tags.length > 0 && (
                              <Box mb={1.5}>
                                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block', fontSize: '0.7rem', fontWeight: 600 }}>
                                  TAGS
                                </Typography>
                                <Box display="flex" flexWrap="wrap" gap={0.5}>
                                  {product.tags.slice(0, 3).map((tag: any) => (
                                    <Chip
                                      key={tag.id}
                                      label={tag.name}
                                      size="small"
                                      sx={{
                                        height: 24,
                                        fontSize: '0.7rem',
                                        fontWeight: 500,
                                        backgroundColor: 'primary.light',
                                        color: 'primary.contrastText',
                                        '&:hover': {
                                          backgroundColor: 'primary.main',
                                        }
                                      }}
                                    />
                                  ))}
                                  {product.tags.length > 3 && (
                                    <Chip
                                      label={`+${product.tags.length - 3}`}
                                      size="small"
                                      sx={{
                                        height: 24,
                                        fontSize: '0.7rem',
                                        backgroundColor: 'action.selected',
                                      }}
                                    />
                                  )}
                                </Box>
                              </Box>
                            )}

                            {/* Attributes Section */}
                            {product.product_attributes && product.product_attributes.length > 0 && (
                              <Box>
                                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block', fontSize: '0.7rem', fontWeight: 600 }}>
                                  ATTRIBUTES
                                </Typography>
                                <Box display="flex" flexWrap="wrap" gap={0.5}>
                                  {product.product_attributes.slice(0, 3).map((attr: any) => (
                                    <Chip
                                      key={attr.id}
                                      label={
                                        <Box display="flex" alignItems="center" gap={0.5}>
                                          <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                            {attr.attribute_name}:
                                          </Typography>
                                          <Typography variant="caption">
                                            {attr.attribute_value || '-'}
                                          </Typography>
                                        </Box>
                                      }
                                      size="small"
                                      sx={{
                                        height: 24,
                                        fontSize: '0.65rem',
                                        backgroundColor: attr.attribute_name === 'Color' && attr.attribute_value
                                          ? attr.attribute_value
                                          : 'action.selected',
                                        color: attr.attribute_name === 'Color' && attr.attribute_value
                                          ? 'white'
                                          : 'text.primary',
                                        border: attr.attribute_name === 'Color' && attr.attribute_value
                                          ? 'none'
                                          : '1px solid',
                                        borderColor: 'divider',
                                      }}
                                    />
                                  ))}
                                </Box>
                              </Box>
                            )}
                          </CardContent>

                          {/* Action Button */}
                          <Box p={2.5} pt={0}>
                            <Button
                              fullWidth
                              variant="contained"
                              onClick={() => {
                                if (!productId) {
                                  console.error('Product ID is missing:', product);
                                  enqueueSnackbar('Product ID is missing. Cannot import.', {
                                    variant: 'error',
                                    anchorOrigin: { vertical: 'top', horizontal: 'right' }
                                  });
                                  return;
                                }
                                handleImport(productId);
                              }}
                              disabled={isImporting || importingId !== null || !productId}
                              startIcon={
                                isImporting ? (
                                  <CircularProgress size={18} color="inherit" />
                                ) : mode === 'select' ? (
                                  <FuseSvgIcon>heroicons-outline:check</FuseSvgIcon>
                                ) : (
                                  <FuseSvgIcon>heroicons-outline:arrow-down-tray</FuseSvgIcon>
                                )
                              }
                              sx={{
                                background: isImporting
                                  ? 'linear-gradient(135deg, #9e9e9e 0%, #757575 100%)'
                                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                '&:hover': {
                                  background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                                  transform: 'translateY(-2px)',
                                  boxShadow: '0 8px 16px rgba(102, 126, 234, 0.4)',
                                },
                                '&:disabled': {
                                  background: 'linear-gradient(135deg, #9e9e9e 0%, #757575 100%)',
                                },
                                fontWeight: 700,
                                py: 1.5,
                                fontSize: '0.95rem',
                                borderRadius: 2,
                                textTransform: 'none',
                                transition: 'all 0.3s ease',
                              }}
                            >
                              {isImporting
                                ? (mode === 'select' ? 'Selecting...' : t('importing'))
                                : (mode === 'select' ? 'Use This Product' : 'Import Product')
                              }
                            </Button>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{
                                display: 'block',
                                textAlign: 'center',
                                mt: 1,
                                fontSize: '0.7rem',
                                fontStyle: 'italic'
                              }}
                            >
                              You'll set your own price after import
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
              <Box display="flex" justifyContent="center" mt={4} mb={2}>
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
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider' }}>
        <Box display="flex" justifyContent="space-between" width="100%" alignItems="center">
          <Typography variant="body2" color="text.secondary">
            {pagination && `Page ${page} of ${pagination.last_page}`}
          </Typography>
          <Button
            onClick={onClose}
            variant="outlined"
            sx={{ minWidth: 100 }}
          >
            {t('close')}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}

export default ImportProductModal;


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
	Paper,
	alpha,
	useTheme
} from '@mui/material';
import { motion, AnimatePresence } from 'motion/react';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { useSnackbar } from 'notistack';
import { useGetSupplierProductsQuery, useImportProductMutation, EcommerceProduct } from '../apis/ProductsLaravelApi';
import WholesaleCatalogHeader from './WholesaleCatalogHeader';
import PaymentMethodDialog from './PaymentMethodDialog';
import FusePageSimple from '@fuse/core/FusePageSimple';

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
	const [selectedProduct, setSelectedProduct] = useState<{ id: string; supplierId?: string; price: number } | null>(
		null
	);

	const { data, isLoading, error, refetch } = useGetSupplierProductsQuery(
		{
			page,
			perPage: 12,
			search: search || undefined,
			categoryId: categoryFilter || undefined,
			inStock: inStockFilter
		},
		{
			// Skip the query if we're not ready
			skip: false,
			// Better error handling
			errorPolicy: 'all'
		}
	);

	// Debug logging for troubleshooting
	useEffect(() => {
		if (error) {
			console.error('Wholesale Catalog API Error:', {
				error,
				status: (error as any)?.status,
				data: (error as any)?.data,
				endpoint: '/api/products/suppliers',
				apiBaseUrl: process.env.NEXT_PUBLIC_API_URL
			});
		}

		if (data) {
			console.log('Wholesale Catalog API Response:', {
				data,
				products: data?.products,
				productsData: data?.products?.data,
				dataArray: data?.data,
				total: data?.products?.meta?.total ?? data?.meta?.total
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
			price
		});
		setPaymentDialogOpen(true);
	};

	const handleImportConfirm = async (
		paymentMethod: 'instant' | 'credit',
		quantity: number,
		creditDays?: number,
		paymentIntentId?: string
	) => {
		if (!selectedProduct) return;

		setPaymentDialogOpen(false);
		setImportingId(selectedProduct.id);

		try {
			const result = await importProduct({
				productId: selectedProduct.id,
				paymentMethod,
				quantity,
				creditDays,
				paymentIntentId // Pass Stripe payment intent ID for instant payments
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
			const errorMessage =
				error?.data?.message || error?.data?.error || error?.message || 'Failed to import product';
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

	const theme = useTheme();

	return (
		<FusePageSimple
			scroll="content"
			content={
				<Box
					sx={{
						flex: 1,
						display: 'flex',
						flexDirection: 'column',
						gap: 3,
						p: { xs: 2, sm: 3, md: 4 },
						background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
						minHeight: '100vh',
						width: '100%',
						maxWidth: '100%'
					}}
				>
					<WholesaleCatalogHeader />

					{/* Enhanced Search and Filter Bar */}
					<Paper
						elevation={0}
						sx={{
							p: 3,
							borderRadius: 4,
							background:
								'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.9) 100%)',
							backdropFilter: 'blur(10px)',
							border: '1px solid',
							borderColor: alpha(theme.palette.primary.main, 0.1)
						}}
					>
						<Box
							display="flex"
							gap={2}
							flexWrap="wrap"
							alignItems="center"
						>
							<TextField
								fullWidth
								placeholder="Search products by name, SKU, or description..."
								value={searchInput}
								onChange={(e) => setSearchInput(e.target.value)}
								onKeyPress={(e) => {
									if (e.key === 'Enter') {
										handleSearch();
									}
								}}
								sx={{
									flex: 1,
									minWidth: { xs: '100%', sm: 300 },
									'& .MuiOutlinedInput-root': {
										borderRadius: 3,
										background: 'white',
										'&:hover': {
											boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`
										},
										'&.Mui-focused': {
											boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.25)}`
										}
									}
								}}
								InputProps={{
									startAdornment: (
										<InputAdornment position="start">
											<FuseSvgIcon sx={{ color: 'primary.main' }}>
												heroicons-outline:magnifying-glass
											</FuseSvgIcon>
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
												sx={{
													'&:hover': {
														background: alpha(theme.palette.error.main, 0.1),
														color: 'error.main'
													}
												}}
											>
												<FuseSvgIcon>heroicons-outline:x-mark</FuseSvgIcon>
											</IconButton>
										</InputAdornment>
									)
								}}
							/>
							<Button
								variant="contained"
								onClick={handleSearch}
								startIcon={<FuseSvgIcon>heroicons-outline:magnifying-glass</FuseSvgIcon>}
								sx={{
									minWidth: 140,
									height: 56,
									borderRadius: 3,
									background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
									fontWeight: 700,
									textTransform: 'none',
									boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
									'&:hover': {
										background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
										boxShadow: '0 6px 20px rgba(102, 126, 234, 0.5)',
										transform: 'translateY(-2px)'
									}
								}}
							>
								Search
							</Button>
							<FormControl
								size="small"
								sx={{
									minWidth: { xs: '100%', sm: 160 },
									'& .MuiOutlinedInput-root': {
										borderRadius: 3,
										background: 'white'
									}
								}}
							>
								<InputLabel>Sort By</InputLabel>
								<Select
									value={sortBy}
									label="Sort By"
									onChange={(e) => setSortBy(e.target.value as any)}
								>
									<MenuItem value="latest">
										<Box
											display="flex"
											alignItems="center"
											gap={1}
										>
											<FuseSvgIcon sx={{ fontSize: 18 }}>heroicons-outline:clock</FuseSvgIcon>
											Latest
										</Box>
									</MenuItem>
									<MenuItem value="name">
										<Box
											display="flex"
											alignItems="center"
											gap={1}
										>
											<FuseSvgIcon sx={{ fontSize: 18 }}>heroicons-outline:bars-3</FuseSvgIcon>
											Name A-Z
										</Box>
									</MenuItem>
									<MenuItem value="price">
										<Box
											display="flex"
											alignItems="center"
											gap={1}
										>
											<FuseSvgIcon sx={{ fontSize: 18 }}>
												heroicons-outline:currency-pound
											</FuseSvgIcon>
											Price Low-High
										</Box>
									</MenuItem>
								</Select>
							</FormControl>
							<FormControl
								size="small"
								sx={{
									minWidth: { xs: '100%', sm: 160 },
									'& .MuiOutlinedInput-root': {
										borderRadius: 3,
										background: 'white'
									}
								}}
							>
								<InputLabel>Stock Status</InputLabel>
								<Select
									value={
										inStockFilter === undefined
											? 'all'
											: inStockFilter
												? 'in_stock'
												: 'out_of_stock'
									}
									label="Stock Status"
									onChange={(e) => {
										const value = e.target.value;
										setInStockFilter(value === 'all' ? undefined : value === 'in_stock');
										setPage(1);
									}}
								>
									<MenuItem value="all">All Products</MenuItem>
									<MenuItem value="in_stock">
										<Box
											display="flex"
											alignItems="center"
											gap={1}
										>
											<Box
												sx={{
													width: 8,
													height: 8,
													borderRadius: '50%',
													bgcolor: 'success.main'
												}}
											/>
											In Stock
										</Box>
									</MenuItem>
									<MenuItem value="out_of_stock">
										<Box
											display="flex"
											alignItems="center"
											gap={1}
										>
											<Box
												sx={{
													width: 8,
													height: 8,
													borderRadius: '50%',
													bgcolor: 'error.main'
												}}
											/>
											Out of Stock
										</Box>
									</MenuItem>
								</Select>
							</FormControl>
						</Box>
					</Paper>

					{/* Enhanced Info Banner */}
					<Alert
						severity="info"
						icon={<FuseSvgIcon>heroicons-outline:sparkles</FuseSvgIcon>}
						sx={{
							borderRadius: 3,
							background:
								'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
							border: '1px solid',
							borderColor: alpha(theme.palette.primary.main, 0.2),
							'& .MuiAlert-icon': {
								color: 'primary.main'
							}
						}}
					>
						<Typography
							variant="body2"
							sx={{ fontWeight: 500 }}
						>
							<strong>✨ Smart Inventory Sync:</strong> When you import a product, inventory sync is
							automatically enabled. Stock updates from suppliers will sync to your store in real-time,
							keeping your inventory always up-to-date.
						</Typography>
					</Alert>

					{/* Products Grid */}
					{error && (
						<Alert
							severity="error"
							action={
								<Button
									color="inherit"
									size="small"
									onClick={() => refetch()}
								>
									Retry
								</Button>
							}
						>
							<Typography
								variant="body2"
								component="div"
							>
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
											} else if (
												'error' in errorData &&
												typeof (errorData as any).error === 'object'
											) {
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
								<Typography
									variant="caption"
									sx={{ mt: 1, display: 'block', opacity: 0.8 }}
								>
									API Endpoint: /api/products/suppliers
									{error && 'status' in error && <> | Status: {(error as any).status}</>}
								</Typography>
							</Typography>
						</Alert>
					)}

					{isLoading ? (
						<Grid
							container
							spacing={3}
							sx={{ maxWidth: '100%' }}
						>
							{[...Array(6)].map((_, index) => (
								<Grid
									item
									xs={12}
									sm={6}
									md={4}
									lg={4}
									xl={4}
									key={index}
								>
									<motion.div
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										transition={{ delay: index * 0.1 }}
									>
										<Card
											sx={{
												borderRadius: 4,
												overflow: 'hidden',
												border: '2px solid',
												borderColor: alpha(theme.palette.divider, 0.1)
											}}
										>
											<Skeleton
												variant="rectangular"
												height={320}
												sx={{
													background:
														'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
													backgroundSize: '200% 100%',
													animation: 'shimmer 1.5s infinite',
													'@keyframes shimmer': {
														'0%': { backgroundPosition: '200% 0' },
														'100%': { backgroundPosition: '-200% 0' }
													}
												}}
											/>
											<CardContent sx={{ p: 3 }}>
												<Skeleton
													height={28}
													width="80%"
													sx={{ mb: 1.5 }}
												/>
												<Skeleton
													height={20}
													width="60%"
													sx={{ mb: 1 }}
												/>
												<Skeleton
													height={16}
													width="90%"
													sx={{ mb: 1 }}
												/>
												<Skeleton
													height={16}
													width="70%"
												/>
											</CardContent>
											<Box
												p={3}
												pt={0}
											>
												<Skeleton
													variant="rectangular"
													height={48}
													sx={{ borderRadius: 3 }}
												/>
											</Box>
										</Card>
									</motion.div>
								</Grid>
							))}
						</Grid>
					) : products.length === 0 ? (
						<motion.div
							initial={{ opacity: 0, scale: 0.9 }}
							animate={{ opacity: 1, scale: 1 }}
							transition={{ duration: 0.5 }}
						>
							<Paper
								elevation={0}
								sx={{
									p: 8,
									textAlign: 'center',
									borderRadius: 4,
									background:
										'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.9) 100%)',
									backdropFilter: 'blur(10px)',
									border: '2px dashed',
									borderColor: alpha(theme.palette.divider, 0.3)
								}}
							>
								<motion.div
									animate={{
										y: [0, -10, 0]
									}}
									transition={{
										duration: 2,
										repeat: Infinity,
										ease: 'easeInOut'
									}}
								>
									<Box
										sx={{
											width: 120,
											height: 120,
											borderRadius: '50%',
											background:
												'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											mx: 'auto',
											mb: 3
										}}
									>
										<FuseSvgIcon sx={{ fontSize: 64, color: 'text.secondary' }}>
											heroicons-outline:inbox
										</FuseSvgIcon>
									</Box>
								</motion.div>
								<Typography
									variant="h5"
									fontWeight={700}
									sx={{
										mb: 1.5,
										background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
										WebkitBackgroundClip: 'text',
										WebkitTextFillColor: 'transparent',
										backgroundClip: 'text'
									}}
								>
									No Products Found
								</Typography>
								<Typography
									variant="body1"
									color="text.secondary"
									sx={{
										mb: 3,
										maxWidth: 500,
										mx: 'auto'
									}}
								>
									{search
										? `We couldn't find any products matching "${search}". Try adjusting your search criteria or filters.`
										: "Suppliers haven't added any products to the catalog yet. Check back soon for new inventory!"}
								</Typography>
								{search && (
									<Button
										variant="outlined"
										onClick={() => {
											setSearch('');
											setSearchInput('');
											setPage(1);
										}}
										startIcon={<FuseSvgIcon>heroicons-outline:x-mark</FuseSvgIcon>}
										sx={{
											borderRadius: 3,
											textTransform: 'none',
											fontWeight: 600,
											px: 3,
											py: 1.5
										}}
									>
										Clear Search
									</Button>
								)}
							</Paper>
						</motion.div>
					) : (
						<>
							<Box
								display="flex"
								justifyContent="space-between"
								alignItems="center"
								flexWrap="wrap"
								gap={2}
								sx={{
									p: 2.5,
									borderRadius: 3,
									background:
										'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
									backdropFilter: 'blur(10px)'
								}}
							>
								<Box>
									<Typography
										variant="h6"
										fontWeight={700}
										sx={{ lineHeight: 1.2 }}
									>
										{pagination?.total || products.length} Products Found
									</Typography>
									<Typography
										variant="caption"
										color="text.secondary"
									>
										{search ? `Search results for "${search}"` : 'Available from suppliers'}
									</Typography>
								</Box>
							</Box>
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
									sx={{
										fontWeight: 600,
										borderRadius: 2,
										'& .MuiChip-deleteIcon': {
											color: 'primary.main'
										}
									}}
								/>
							)}
						</>
					)}
					<Grid
						container
						spacing={3}
						sx={{
							maxWidth: '100%',
							'& .MuiGrid-item': {
								display: 'flex'
							}
						}}
					>
						<AnimatePresence>
							{products.map((product: EcommerceProduct, index: number) => {
								// Handle different image formats
								const featuredImage = (product as any).featured_image;
								const imageUrl =
									featuredImage?.url || featuredImage?.[0]?.url || product.image
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
									<Grid
										item
										xs={12}
										sm={6}
										md={4}
										lg={4}
										xl={4}
										key={product.id}
										sx={{
											maxWidth: { md: '33.333%', lg: '33.333%', xl: '33.333%' },
											flexBasis: { md: '33.333%', lg: '33.333%', xl: '33.333%' }
										}}
									>
										<motion.div
											initial={{ opacity: 0, y: 30, scale: 0.95 }}
											animate={{ opacity: 1, y: 0, scale: 1 }}
											exit={{ opacity: 0, scale: 0.9 }}
											transition={{
												duration: 0.4,
												delay: index * 0.03,
												type: 'spring',
												stiffness: 100
											}}
											style={{ height: '100%' }}
										>
											<Card
												elevation={0}
												sx={{
													width: '100%',
													height: '100%',
													display: 'flex',
													flexDirection: 'column',
													borderRadius: 4,
													overflow: 'hidden',
													position: 'relative',
													transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
													border: '2px solid',
													borderColor: alpha(theme.palette.divider, 0.1),
													background:
														'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.95) 100%)',
													backdropFilter: 'blur(10px)',
													'&:hover': {
														transform: 'translateY(-12px) scale(1.01)',
														boxShadow: '0 24px 48px rgba(102, 126, 234, 0.25)',
														borderColor: theme.palette.primary.main,
														'& .product-image': {
															transform: 'scale(1.15)'
														},
														'& .import-button': {
															background:
																'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
															transform: 'translateY(-2px)',
															boxShadow: '0 12px 24px rgba(102, 126, 234, 0.5)'
														}
													}
												}}
											>
												{/* Enhanced Image Section */}
												<Box
													position="relative"
													sx={{
														height: 320,
														overflow: 'hidden',
														background:
															'linear-gradient(135deg, #667eea20 0%, #764ba220 100%)',
														position: 'relative',
														'&::before': {
															content: '""',
															position: 'absolute',
															top: 0,
															left: 0,
															right: 0,
															bottom: 0,
															background:
																'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.1) 100%)',
															zIndex: 1
														}
													}}
												>
													<Box
														component="img"
														className="product-image"
														src={imageUrl}
														alt={product.name}
														sx={{
															height: '100%',
															width: '100%',
															objectFit: 'cover',
															transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
														}}
													/>

													{/* Enhanced Stock Badge */}
													<Chip
														label={
															<Box
																display="flex"
																alignItems="center"
																gap={0.5}
															>
																<FuseSvgIcon sx={{ fontSize: 14 }}>
																	{quantity > 0
																		? 'heroicons-outline:check-circle'
																		: 'heroicons-outline:x-circle'}
																</FuseSvgIcon>
																{quantity > 0
																	? `In Stock (${quantity})`
																	: 'Out of Stock'}
															</Box>
														}
														size="small"
														color={quantity > 0 ? 'success' : 'error'}
														sx={{
															position: 'absolute',
															top: 16,
															left: 16,
															zIndex: 2,
															fontWeight: 700,
															fontSize: '0.75rem',
															boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
															backdropFilter: 'blur(10px)',
															border: '1px solid',
															borderColor: alpha(theme.palette.common.white, 0.3)
														}}
													/>

													{/* Enhanced Price Badge */}
													{priceTaxIncl > 0 && (
														<Box
															sx={{
																position: 'absolute',
																top: 16,
																right: 16,
																zIndex: 2,
																background:
																	'linear-gradient(135deg, rgba(102, 126, 234, 0.95) 0%, rgba(118, 75, 162, 0.95) 100%)',
																color: 'white',
																px: 2,
																py: 1,
																borderRadius: 3,
																fontWeight: 800,
																fontSize: '1rem',
																boxShadow: '0 6px 20px rgba(102, 126, 234, 0.5)',
																backdropFilter: 'blur(10px)',
																border: '1px solid',
																borderColor: alpha(theme.palette.common.white, 0.3),
																display: 'flex',
																alignItems: 'center',
																gap: 0.5
															}}
														>
															<FuseSvgIcon sx={{ fontSize: 16 }}>
																heroicons-outline:currency-pound
															</FuseSvgIcon>
															{priceTaxIncl.toFixed(2)}
														</Box>
													)}
													{priceTaxIncl === 0 && (
														<Box
															sx={{
																position: 'absolute',
																top: 16,
																right: 16,
																zIndex: 2,
																background:
																	'linear-gradient(135deg, rgba(255, 152, 0, 0.95) 0%, rgba(255, 193, 7, 0.95) 100%)',
																color: 'white',
																px: 2,
																py: 1,
																borderRadius: 3,
																fontWeight: 800,
																fontSize: '0.875rem',
																boxShadow: '0 6px 20px rgba(255, 152, 0, 0.5)',
																backdropFilter: 'blur(10px)',
																border: '1px solid',
																borderColor: alpha(theme.palette.common.white, 0.3)
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
																gap: 2
															}}
														>
															<CircularProgress
																sx={{ color: 'white' }}
																size={48}
															/>
															<Typography
																variant="body1"
																sx={{ color: 'white', fontWeight: 600 }}
															>
																Importing...
															</Typography>
														</Box>
													)}
												</Box>

												{/* Enhanced Content Section */}
												<CardContent sx={{ flexGrow: 1, p: 3, pb: 1 }}>
													<Tooltip
														title={product.name}
														arrow
													>
														<Typography
															variant="h6"
															component="h3"
															sx={{
																mb: 1.5,
																fontWeight: 800,
																fontSize: '1.15rem',
																display: '-webkit-box',
																WebkitLineClamp: 2,
																WebkitBoxOrient: 'vertical',
																overflow: 'hidden',
																minHeight: 56,
																background:
																	'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
																WebkitBackgroundClip: 'text',
																WebkitTextFillColor: 'transparent',
																backgroundClip: 'text'
															}}
														>
															{product.name}
														</Typography>
													</Tooltip>

													{product.sku && (
														<Box
															display="flex"
															alignItems="center"
															gap={1}
															sx={{
																mb: 1.5,
																p: 1,
																borderRadius: 2,
																background: alpha(theme.palette.primary.main, 0.05)
															}}
														>
															<FuseSvgIcon sx={{ fontSize: 16, color: 'primary.main' }}>
																heroicons-outline:hashtag
															</FuseSvgIcon>
															<Typography
																variant="body2"
																sx={{
																	fontWeight: 600,
																	color: 'text.secondary',
																	fontFamily: 'monospace'
																}}
															>
																{product.sku}
															</Typography>
														</Box>
													)}

													{product.description && (
														<Typography
															variant="body2"
															color="text.secondary"
															sx={{
																display: '-webkit-box',
																WebkitLineClamp: 3,
																WebkitBoxOrient: 'vertical',
																overflow: 'hidden',
																mb: 1.5,
																lineHeight: 1.6
															}}
														>
															{product.description}
														</Typography>
													)}
												</CardContent>

												{/* Enhanced Action Button */}
												<Box
													p={3}
													pt={1}
												>
													<Button
														className="import-button"
														fullWidth
														variant="contained"
														onClick={() => handleImportClick(product)}
														disabled={isImporting || importingId !== null || quantity === 0}
														startIcon={
															isImporting ? (
																<CircularProgress
																	size={18}
																	color="inherit"
																/>
															) : (
																<FuseSvgIcon>
																	heroicons-outline:arrow-down-tray
																</FuseSvgIcon>
															)
														}
														sx={{
															background:
																isImporting || quantity === 0
																	? 'linear-gradient(135deg, #9e9e9e 0%, #757575 100%)'
																	: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
															'&:hover:not(:disabled)': {
																background:
																	'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
																transform: 'translateY(-2px)',
																boxShadow: '0 12px 24px rgba(102, 126, 234, 0.5)'
															},
															fontWeight: 800,
															py: 1.75,
															borderRadius: 3,
															textTransform: 'none',
															fontSize: '0.95rem',
															transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
														}}
													>
														{isImporting
															? 'Importing...'
															: quantity === 0
																? 'Out of Stock'
																: 'Import Product'}
													</Button>
													<Box
														display="flex"
														alignItems="center"
														justifyContent="center"
														gap={0.5}
														sx={{
															mt: 1.5
														}}
													>
														<FuseSvgIcon sx={{ fontSize: 14, color: 'success.main' }}>
															heroicons-outline:check-circle
														</FuseSvgIcon>
														<Typography
															variant="caption"
															sx={{
																fontSize: '0.7rem',
																fontWeight: 600,
																color: 'text.secondary'
															}}
														>
															Auto inventory sync enabled
														</Typography>
													</Box>
												</Box>
											</Card>
										</motion.div>
									</Grid>
								);
							})}
						</AnimatePresence>
					</Grid>
					{pagination && pagination.last_page > 1 && (
						<Box
							display="flex"
							justifyContent="center"
							alignItems="center"
							gap={2}
							mt={4}
							sx={{
								p: 3,
								borderRadius: 3,
								background:
									'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
								backdropFilter: 'blur(10px)',
								border: '1px solid',
								borderColor: alpha(theme.palette.divider, 0.1)
							}}
						>
							<Pagination
								count={pagination.last_page}
								page={page}
								onChange={handlePageChange}
								color="primary"
								size="large"
								showFirstButton
								showLastButton
								sx={{
									'& .MuiPaginationItem-root': {
										fontWeight: 600,
										'&.Mui-selected': {
											background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
											color: 'white',
											boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
										}
									}
								}}
							/>
							<Typography
								variant="body2"
								color="text.secondary"
								sx={{ fontWeight: 600 }}
							>
								Page {page} of {pagination.last_page}
							</Typography>
						</Box>
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
			}
		/>
	);
}

export default WholesaleCatalog;

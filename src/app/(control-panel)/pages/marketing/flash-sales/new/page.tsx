'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/utils/api';
import { useRouter } from 'next/navigation';
import {
	Container,
	Grid,
	Typography,
	Paper,
	TextField,
	MenuItem,
	FormControlLabel,
	Switch,
	Divider,
	Stack,
	Button,
	Alert,
	Autocomplete,
	Chip,
	CircularProgress,
	Box,
	InputAdornment,
	Zoom
} from '@mui/material';
import {
	KeyboardArrowLeft,
	AccessTime,
	FlashOn,
	Percent,
	DateRange,
	Storefront,
	ShoppingBag,
	ArrowForward
} from '@mui/icons-material';
import { motion } from 'motion/react';

export default function NewFlashSalePage() {
	const r = useRouter();
	const [form, setForm] = useState<any>({
		name: '',
		discount_type: 'percent',
		discount_value: 10,
		starts_at: '',
		ends_at: '',
		is_active: true,
		product_ids: [] as number[]
	});
	const [err, setErr] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);

	// Fetch products for selection (try admin endpoint, then public)
	const [productsLoading, setProductsLoading] = useState(true);
	const [productsError, setProductsError] = useState<string | null>(null);
	const [productOptions, setProductOptions] = useState<{ id: string | number; label: string }[]>([]);
	const [stores, setStores] = useState<{ id: string | number; name: string }[]>([]);
	const [storeId, setStoreId] = useState<string | number | ''>('');
	const [productsSource, setProductsSource] = useState<string>('');

	useEffect(() => {
		let mounted = true;

		async function load() {
			setProductsLoading(true);
			setProductsError(null);
			try {
				// First, attempt to get stores (auth route), then fall back to public route
				try {
					const storesResp: any = await apiFetch(`/api/stores?per_page=50`);
					const storesList = (
						Array.isArray(storesResp?.data)
							? storesResp?.data
							: Array.isArray(storesResp?.data?.data)
								? storesResp?.data?.data
								: Array.isArray(storesResp)
									? storesResp
									: []
					) as any[];

					if (mounted) setStores(storesList.map((s: any) => ({ id: s.id, name: s.name })));

					if (mounted && storesList[0]?.id && !storeId) setStoreId(storesList[0].id);
				} catch {
					try {
						const storesRespPublic: any = await apiFetch(`/api/stores/getAllStores`);
						const storesList = (
							Array.isArray(storesRespPublic?.data)
								? storesRespPublic?.data
								: Array.isArray(storesRespPublic?.data?.data)
									? storesRespPublic?.data?.data
									: Array.isArray(storesRespPublic)
										? storesRespPublic
										: []
						) as any[];

						if (mounted) setStores(storesList.map((s: any) => ({ id: s.id, name: s.name })));

						if (mounted && storesList[0]?.id && !storeId) setStoreId(storesList[0].id);
					} catch {}
				}

				// If a store is chosen, try products for that store first
				if (storeId) {
					// Preferred: public store products route
					try {
						const byStoreAlt: any = await apiFetch(`/api/stores/${storeId}/products?per_page=100`);
						const listAlt = // Backend currently returns a single store object with a `products` array:
							// { status: 200, data: { ..., products: [...] }, others: [...] }
							(
								Array.isArray(byStoreAlt?.data?.products)
									? byStoreAlt.data.products
									: Array.isArray(byStoreAlt?.data)
										? byStoreAlt.data
										: Array.isArray(byStoreAlt?.data?.data)
											? byStoreAlt.data.data
											: Array.isArray(byStoreAlt?.products)
												? byStoreAlt.products
												: []
							) as any[];

						if (mounted) {
							setProductOptions(listAlt.map((p: any) => ({ id: p.id, label: p.name })));
							setProductsSource(`/api/stores/${storeId}/products?per_page=100`);
						}

						return; // done
					} catch {}

					// Fallback: query products with store_id filter
					try {
						const byStore: any = await apiFetch(`/api/products?store_id=${storeId}&per_page=100`);
						const list = (
							Array.isArray(byStore?.data)
								? byStore?.data
								: Array.isArray(byStore?.data?.data)
									? byStore?.data?.data
									: Array.isArray(byStore?.products)
										? byStore?.products
										: []
						) as any[];

						if (mounted) {
							setProductOptions(list.map((p: any) => ({ id: p.id, label: p.name })));
							setProductsSource(`/api/products?store_id=${storeId}&per_page=100`);
						}

						return; // done
					} catch {}
				}

				// Fallback to public all-products
				let resp: any;
				try {
					resp = await apiFetch(`/api/products/getAllProducts`);
				} catch {
					resp = await apiFetch(`/api/products?per_page=100`);
				}
				let list = (
					Array.isArray(resp?.data)
						? resp?.data
						: Array.isArray(resp?.data?.data)
							? resp?.data?.data
							: Array.isArray(resp?.products)
								? resp?.products
								: []
				) as any[];

				if (mounted && list.length > 0) {
					setProductOptions(list.map((p: any) => ({ id: p.id, label: p.name })));
					setProductsSource(resp?.source || `/api/products/getAllProducts`);
				} else {
					// Final fallback: use mock products to allow UI testing
					try {
						const mockResp: any = await fetch(`/api/mock/ecommerce/products`).then((r) => r.json());
						list = Array.isArray(mockResp) ? mockResp : [];

						if (mounted && list.length > 0) {
							setProductOptions(list.map((p: any) => ({ id: p.id, label: p.name })));
							setProductsSource(`/api/mock/ecommerce/products`);
						}
					} catch {}
				}
			} catch (e: any) {
				if (mounted) setProductsError(e.message || 'Failed to load products (check permissions)');
			} finally {
				if (mounted) setProductsLoading(false);
			}
		}

		load();
		return () => {
			mounted = false;
		};
	}, [storeId]);

	async function submit(e: React.FormEvent) {
		e.preventDefault();
		setSaving(true);
		setErr(null);
		try {
			const payload: any = { ...form };
			payload.discount_value = Number(payload.discount_value);
			// Ensure product_ids is an array of numbers
			payload.product_ids = (form.product_ids || []).map((v: any) => Number(v)).filter((n: number) => !isNaN(n));
			await apiFetch('/api/admin/flash-sales', { method: 'POST', body: JSON.stringify(payload) });
			r.push('/pages/marketing/flash-sales');
		} catch (e: any) {
			setErr(e.message);
		} finally {
			setSaving(false);
		}
	}

	const [currencyConfig, setCurrencyConfig] = useState({ code: 'USD', symbol: '$' });
	const CURRENCY_SYMBOLS: Record<string, string> = {
		USD: '$',
		GBP: '£',
		EUR: '€',
		JPY: '¥',
		CNY: '¥',
		INR: '₹',
		AUD: 'A$',
		CAD: 'C$',
		CHF: 'CHF',
		SEK: 'kr',
		NZD: 'NZ$',
		MXN: '$',
		SGD: 'S$',
		HKD: 'HK$',
		NOK: 'kr',
		TRY: '₺',
		RUB: '₽',
		ZAR: 'R',
		BRL: 'R$',
		AED: 'د.إ',
		SAR: '﷼',
		PKR: '₨',
		BDT: '৳',
		THB: '฿',
		MYR: 'RM',
		IDR: 'Rp',
		PHP: '₱',
		VND: '₫',
		KRW: '₩',
		NGN: '₦'
	};

	useEffect(() => {
		async function loadCurrency() {
			try {
				const res = await apiFetch('/api/currencies/rates');

				if (res?.default_currency) {
					const str = String(res.default_currency).trim();
					let code = 'USD';

					if (/^[A-Z]{3}$/.test(str)) code = str;
					else {
						const match = str.match(/s:\d+:"([A-Z]{3})"/i) || str.match(/\b([A-Z]{3})\b/);

						if (match && match[1]) code = match[1].toUpperCase();
					}

					setCurrencyConfig({ code, symbol: CURRENCY_SYMBOLS[code] || code });
				}
			} catch (e) {}
		}

		loadCurrency();
	}, []);

	// Timezone helper text for admins – we keep logic in UTC but make it explicit
	const now = new Date();
	const localTimeLabel = now.toLocaleString();
	const utcTimeLabel = now.toUTCString();

	return (
		<Container
			maxWidth="lg"
			sx={{ py: { xs: 4, md: 6 } }}
		>
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
			>
				<Stack spacing={4}>
					{/* Header Section */}
					<Box>
						<Stack
							direction="row"
							spacing={1}
							alignItems="center"
							sx={{ mb: 1, opacity: 0.7 }}
						>
							<Typography
								variant="body2"
								sx={{ fontWeight: 500 }}
							>
								Marketing
							</Typography>
							<Typography variant="body2">/</Typography>
							<Typography
								variant="body2"
								sx={{ fontWeight: 500 }}
							>
								Flash Sales
							</Typography>
						</Stack>
						<Stack
							direction="row"
							justifyContent="space-between"
							alignItems="center"
						>
							<Box>
								<Typography
									variant="h3"
									sx={{
										fontWeight: 800,
										background: 'linear-gradient(45deg, #FF8E53 30%, #FE6B8B 90%)',
										WebkitBackgroundClip: 'text',
										WebkitTextFillColor: 'transparent',
										mb: 1
									}}
								>
									Create Flash Sale
								</Typography>
								<Typography
									variant="body1"
									color="text.secondary"
								>
									Launch a high-impact promotional event with timed discounts.
								</Typography>
							</Box>
							<Button
								variant="text"
								startIcon={<KeyboardArrowLeft />}
								onClick={() => r.push('/pages/marketing/flash-sales')}
								sx={{ borderRadius: 2 }}
							>
								Back to List
							</Button>
						</Stack>
					</Box>

					{/* Timezone Info Card */}
					<motion.div
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ delay: 0.2 }}
					>
						<Paper
							elevation={0}
							sx={{
								p: 3,
								borderRadius: 4,
								background: (theme) =>
									`linear-gradient(135deg, ${theme.palette.info.light}15 0%, ${theme.palette.info.main}10 100%)`,
								border: '1px solid',
								borderColor: 'info.light',
								display: 'flex',
								gap: 2,
								alignItems: 'center'
							}}
						>
							<Box
								sx={{
									backgroundColor: 'info.main',
									borderRadius: '50%',
									p: 1.5,
									display: 'flex',
									color: 'white'
								}}
							>
								<AccessTime fontSize="medium" />
							</Box>
							<Box>
								<Typography
									variant="subtitle2"
									fontWeight={700}
									color="info.dark"
								>
									Timezone Synchronization
								</Typography>
								<Typography
									variant="body2"
									color="info.dark"
									sx={{ opacity: 0.8 }}
								>
									All sales are evaluated in <strong>UTC</strong>. (Local: {localTimeLabel} • UTC:{' '}
									{utcTimeLabel})
								</Typography>
							</Box>
						</Paper>
					</motion.div>

					{err && (
						<Zoom in={!!err}>
							<Alert
								severity="error"
								variant="filled"
								sx={{ borderRadius: 3 }}
							>
								{err}
							</Alert>
						</Zoom>
					)}

					{/* Form Content */}
					<Box
						component="form"
						onSubmit={submit}
					>
						<Grid
							container
							spacing={4}
						>
							{/* Left Column: Basic Settings */}
							<Grid
								item
								xs={12}
								md={7}
							>
								<Stack spacing={4}>
									<Paper
										elevation={0}
										sx={{ p: 4, borderRadius: 5, border: '1px solid', borderColor: 'divider' }}
									>
										<Stack spacing={3}>
											<Stack
												direction="row"
												spacing={1}
												alignItems="center"
											>
												<Box
													sx={{
														p: 1,
														bgcolor: 'primary.main',
														borderRadius: 2,
														display: 'flex',
														color: 'white'
													}}
												>
													<FlashOn fontSize="small" />
												</Box>
												<Typography
													variant="h6"
													fontWeight={700}
												>
													Sale Basics
												</Typography>
											</Stack>

											<TextField
												fullWidth
												label="Promotion Name"
												placeholder="e.g. Flash Frenzy Weekend"
												value={form.name}
												onChange={(e) => setForm({ ...form, name: e.target.value })}
												required
												variant="outlined"
												sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
											/>

											<Grid
												container
												spacing={2}
											>
												<Grid
													item
													xs={12}
													sm={6}
												>
													<TextField
														select
														fullWidth
														label="Discount Type"
														value={form.discount_type}
														onChange={(e) =>
															setForm({ ...form, discount_type: e.target.value })
														}
														sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
														InputProps={{
															startAdornment: (
																<InputAdornment position="start">
																	{form.discount_type === 'percent' ? (
																		<Percent
																			fontSize="small"
																			color="action"
																		/>
																	) : (
																		<Typography
																			variant="h6"
																			color="action"
																			sx={{ fontSize: '1.2rem', fontWeight: 600 }}
																		>
																			{currencyConfig.symbol}
																		</Typography>
																	)}
																</InputAdornment>
															)
														}}
													>
														<MenuItem value="percent">Percentage (%)</MenuItem>
														<MenuItem value="fixed">Fixed Amount</MenuItem>
													</TextField>
												</Grid>
												<Grid
													item
													xs={12}
													sm={6}
												>
													<TextField
														fullWidth
														type="number"
														inputProps={{ step: '0.01' }}
														label="Discount Value"
														placeholder="20"
														value={form.discount_value as any}
														helperText={
															form.discount_type === 'percent'
																? 'Percentage off price'
																: 'Amount off price'
														}
														onChange={(e) =>
															setForm({ ...form, discount_value: e.target.value as any })
														}
														sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
													/>
												</Grid>
											</Grid>

											<Divider sx={{ my: 1 }} />

											<Stack
												direction="row"
												spacing={1}
												alignItems="center"
											>
												<Box
													sx={{
														p: 1,
														bgcolor: 'secondary.main',
														borderRadius: 2,
														display: 'flex',
														color: 'white'
													}}
												>
													<DateRange fontSize="small" />
												</Box>
												<Typography
													variant="h6"
													fontWeight={700}
												>
													Schedule
												</Typography>
											</Stack>

											<Grid
												container
												spacing={2}
											>
												<Grid
													item
													xs={12}
													sm={6}
												>
													<TextField
														fullWidth
														type="datetime-local"
														label="Starts At (UTC)"
														InputLabelProps={{ shrink: true }}
														value={form.starts_at as any}
														onChange={(e) =>
															setForm({ ...form, starts_at: e.target.value as any })
														}
														sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
													/>
												</Grid>
												<Grid
													item
													xs={12}
													sm={6}
												>
													<TextField
														fullWidth
														type="datetime-local"
														label="Ends At (UTC)"
														InputLabelProps={{ shrink: true }}
														value={form.ends_at as any}
														onChange={(e) =>
															setForm({ ...form, ends_at: e.target.value as any })
														}
														sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
													/>
												</Grid>
											</Grid>
										</Stack>
									</Paper>

									<Paper
										elevation={0}
										sx={{ p: 4, borderRadius: 5, border: '1px solid', borderColor: 'divider' }}
									>
										<Stack spacing={3}>
											<Stack
												direction="row"
												spacing={1}
												alignItems="center"
											>
												<Box
													sx={{
														p: 1,
														bgcolor: 'warning.main',
														borderRadius: 2,
														display: 'flex',
														color: 'white'
													}}
												>
													<Storefront fontSize="small" />
												</Box>
												<Typography
													variant="h6"
													fontWeight={700}
												>
													Inventory Selection
												</Typography>
											</Stack>

											{stores.length > 0 && (
												<TextField
													select
													fullWidth
													label="Target Store"
													value={storeId as any}
													onChange={(e) => setStoreId(e.target.value)}
													sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
													helperText="Products will be filtered based on this store"
												>
													{stores.map((s) => (
														<MenuItem
															key={String(s.id)}
															value={s.id as any}
														>
															{s.name}
														</MenuItem>
													))}
												</TextField>
											)}

											<Autocomplete
												multiple
												options={productOptions}
												loading={productsLoading}
												value={productOptions.filter((o) =>
													(form.product_ids as number[]).includes(Number(o.id))
												)}
												onChange={(_, value) =>
													setForm({ ...form, product_ids: value.map((v) => Number(v.id)) })
												}
												getOptionLabel={(option) => option.label}
												renderTags={(value, getTagProps) =>
													value.map((option, index) => (
														<Chip
															variant="filled"
															color="primary"
															size="small"
															label={option.label}
															{...getTagProps({ index })}
															sx={{ borderRadius: 1.5, fontWeight: 600 }}
														/>
													))
												}
												renderInput={(params) => (
													<TextField
														{...params}
														label="Participating Products"
														placeholder="Add products..."
														variant="outlined"
														sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
														helperText={
															productsError
																? productsError
																: !productsLoading && productOptions.length === 0
																	? storeId
																		? 'No products found for the selected store'
																		: 'Select a store to load products'
																	: `Choose the products you want to feature in this sale`
														}
														InputProps={{
															...params.InputProps,
															startAdornment: (
																<>
																	<InputAdornment position="start">
																		<ShoppingBag
																			fontSize="small"
																			color="action"
																		/>
																	</InputAdornment>
																	{params.InputProps.startAdornment}
																</>
															),
															endAdornment: (
																<>
																	{productsLoading ? (
																		<CircularProgress
																			color="inherit"
																			size={20}
																		/>
																	) : null}
																	{params.InputProps.endAdornment}
																</>
															)
														}}
													/>
												)}
											/>
										</Stack>
									</Paper>
								</Stack>
							</Grid>

							{/* Right Column: Status & Preview */}
							<Grid
								item
								xs={12}
								md={5}
							>
								<Stack
									spacing={4}
									sx={{ position: { md: 'sticky' }, top: 24 }}
								>
									<Paper
										elevation={0}
										sx={{
											p: 4,
											borderRadius: 5,
											border: '1px solid',
											borderColor: 'divider',
											backgroundColor: (theme) =>
												theme.palette.mode === 'dark'
													? 'rgba(255,255,255,0.03)'
													: 'rgba(0,0,0,0.01)'
										}}
									>
										<Stack spacing={3}>
											<Typography
												variant="h6"
												fontWeight={700}
											>
												Event Status
											</Typography>

											<Box
												sx={{
													p: 3,
													borderRadius: 4,
													bgcolor: form.is_active
														? 'success.light'
														: 'action.disabledBackground',
													color: form.is_active ? 'success.dark' : 'text.disabled',
													transition: 'all 0.3s ease',
													opacity: form.is_active ? 0.9 : 0.6,
													textAlign: 'center',
													border: '2px dashed',
													borderColor: form.is_active ? 'success.main' : 'divider'
												}}
											>
												<Stack
													spacing={1}
													alignItems="center"
												>
													<Typography
														variant="h4"
														fontWeight={800}
													>
														{form.is_active ? 'ACTIVE' : 'INACTIVE'}
													</Typography>
													<Typography
														variant="caption"
														sx={{ textTransform: 'uppercase', letterSpacing: 1 }}
													>
														{form.is_active
															? 'Sale will launch as scheduled'
															: 'Sale is currently hidden'}
													</Typography>
												</Stack>
											</Box>

											<FormControlLabel
												control={
													<Switch
														checked={form.is_active}
														onChange={(e) =>
															setForm({ ...form, is_active: e.target.checked })
														}
														color="success"
													/>
												}
												label={<Typography fontWeight={600}>Enable Flash Sale</Typography>}
											/>

											<Divider />

											<Box>
												<Typography
													variant="subtitle2"
													gutterBottom
													fontWeight={700}
												>
													Promotion Summary
												</Typography>
												<Stack
													spacing={1.5}
													sx={{ mt: 2 }}
												>
													<Stack
														direction="row"
														justifyContent="space-between"
													>
														<Typography
															variant="body2"
															color="text.secondary"
														>
															Discount Type
														</Typography>
														<Typography
															variant="body2"
															fontWeight={600}
														>
															{form.discount_type === 'percent'
																? 'Percentage'
																: 'Fixed Amount'}
														</Typography>
													</Stack>
													<Stack
														direction="row"
														justifyContent="space-between"
													>
														<Typography
															variant="body2"
															color="text.secondary"
														>
															Discount Value
														</Typography>
														<Typography
															variant="body2"
															fontWeight={600}
															color="primary.main"
														>
															{form.discount_type === 'percent'
																? `${form.discount_value}%`
																: `${currencyConfig.symbol}${form.discount_value}`}
														</Typography>
													</Stack>
													<Stack
														direction="row"
														justifyContent="space-between"
													>
														<Typography
															variant="body2"
															color="text.secondary"
														>
															Target Products
														</Typography>
														<Typography
															variant="body2"
															fontWeight={600}
														>
															{form.product_ids?.length || 0} items
														</Typography>
													</Stack>
												</Stack>
											</Box>
										</Stack>
									</Paper>

									<Stack
										direction="row"
										spacing={2}
									>
										<Button
											fullWidth
											variant="outlined"
											onClick={() => r.push('/pages/marketing/flash-sales')}
											sx={{ py: 2, borderRadius: 4, fontWeight: 700 }}
										>
											Discard
										</Button>
										<Button
											fullWidth
											type="submit"
											variant="contained"
											disabled={saving}
											sx={{
												py: 2,
												borderRadius: 4,
												fontWeight: 700,
												boxShadow: '0 8px 16px -4px rgba(0,0,0,0.2)',
												background: 'linear-gradient(45deg, #FF8E53 30%, #FE6B8B 90%)',
												color: 'white',
												'&:hover': {
													background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)'
												}
											}}
											endIcon={
												saving ? (
													<CircularProgress
														size={20}
														color="inherit"
													/>
												) : (
													<ArrowForward />
												)
											}
										>
											{saving ? 'Creating...' : 'Launch Sale'}
										</Button>
									</Stack>
								</Stack>
							</Grid>
						</Grid>
					</Box>
				</Stack>
			</motion.div>
		</Container>
	);
}

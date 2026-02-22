'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/utils/api';
import {
	Container,
	Typography,
	Button,
	Paper,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Chip,
	Stack,
	LinearProgress,
	Box,
	Collapse,
	IconButton
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

export default function FlashSalesPage() {
	const [items, setItems] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

	async function load() {
		try {
			setLoading(true);
			const res = await apiFetch('/api/admin/flash-sales');
			const data = res?.data ?? res;
			// Process items to calculate discounted prices
			const processedItems = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
			setItems(
				processedItems.map((item: any) => ({
					...item,
					products: (item.products || []).map((product: any) => {
						// Prefer tax-exclusive price if available; fall back to other fields.
						const rawPrice =
							product.price_tax_excl != null && product.price_tax_excl !== ''
								? product.price_tax_excl
								: product.price_tax_incl != null && product.price_tax_incl !== ''
									? product.price_tax_incl
									: product.price;

						const originalPrice = Number(rawPrice || 0);
						let discountedPrice = originalPrice;

						if (item.discount_type === 'percent') {
							discountedPrice = Math.max(0, originalPrice * (1 - Number(item.discount_value) / 100));
						} else if (item.discount_type === 'fixed') {
							discountedPrice = Math.max(0, originalPrice - Number(item.discount_value));
						}

						return {
							...product,
							originalPrice,
							discountedPrice: Math.round(discountedPrice * 100) / 100
						};
					})
				}))
			);
		} catch (e: any) {
			setError(e.message);
		} finally {
			setLoading(false);
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

	function extractCurrencyCode(value: any): string {
		if (!value) return 'USD';

		const str = String(value).trim();

		if (/^[A-Z]{3}$/.test(str)) return str;

		const serializedMatch = str.match(/s:\d+:"([A-Z]{3})"/i);

		if (serializedMatch && serializedMatch[1]) return serializedMatch[1].toUpperCase();

		const codeMatch = str.match(/\b([A-Z]{3})\b/);

		if (codeMatch && codeMatch[1]) return codeMatch[1];

		return 'USD';
	}

	async function loadCurrency() {
		try {
			const res = await apiFetch('/api/currencies/rates');

			if (res?.default_currency) {
				const code = extractCurrencyCode(res.default_currency);
				setCurrencyConfig({ code, symbol: CURRENCY_SYMBOLS[code] || code });
			}
		} catch (e) {
			console.error('Failed to fetch currency rates', e);
		}
	}

	useEffect(() => {
		load();
		loadCurrency();
	}, []);

	async function remove(id: number) {
		if (!confirm('Delete flash sale?')) return;

		await apiFetch(`/api/admin/flash-sales/${id}`, { method: 'DELETE' });
		load();
	}

	const toggleRow = (id: number) => {
		const newExpanded = new Set(expandedRows);

		if (newExpanded.has(id)) {
			newExpanded.delete(id);
		} else {
			newExpanded.add(id);
		}

		setExpandedRows(newExpanded);
	};

	const formatPrice = (price: number) => {
		try {
			return new Intl.NumberFormat('en-US', {
				style: 'currency',
				currency: currencyConfig.code,
				minimumFractionDigits: 2
			}).format(price);
		} catch (e) {
			return `${currencyConfig.symbol}${Number(price).toFixed(2)}`;
		}
	};

	return (
		<Box
			sx={{
				background: (theme) =>
					theme.palette.mode === 'dark'
						? 'linear-gradient(180deg, rgba(23,23,23,1) 0%, rgba(30,30,30,1) 100%)'
						: 'linear-gradient(180deg, #fff 0%, #f7f9fc 100%)',
				py: { xs: 3, md: 6 }
			}}
		>
			<Container maxWidth="lg">
				<Stack
					direction="row"
					alignItems="center"
					justifyContent="space-between"
					sx={{ mb: 3 }}
				>
					<Box>
						<Typography
							variant="h4"
							fontWeight={700}
						>
							Flash Sales
						</Typography>
						<Typography
							variant="body2"
							color="text.secondary"
						>
							Schedule time-bound discounts for selected products.
						</Typography>
						<Typography
							variant="caption"
							color="text.secondary"
							sx={{ display: 'block', mt: 0.5 }}
						>
							Flash sale start/end times are evaluated on the server in <strong>UTC</strong>. Dates shown
							here use your browser&apos;s local time zone.
						</Typography>
					</Box>
					<Button
						component={Link as any}
						href="/pages/marketing/flash-sales/new"
						variant="contained"
					>
						New Flash Sale
					</Button>
				</Stack>
				{loading && <LinearProgress />}
				{error && (
					<Paper sx={{ p: 2, my: 2, bgcolor: 'error.light', color: 'error.contrastText', borderRadius: 2 }}>
						{error}
					</Paper>
				)}
				{!loading && items?.length === 0 && (
					<Paper
						sx={{
							p: 4,
							textAlign: 'center',
							borderRadius: 3,
							border: (t) => `1px dashed ${t.palette.divider}`
						}}
					>
						<Typography
							variant="h6"
							fontWeight={600}
						>
							No flash sales yet
						</Typography>
						<Typography
							variant="body2"
							color="text.secondary"
							sx={{ mt: 0.5 }}
						>
							Create your first flash sale to boost conversions.
						</Typography>
						<Button
							component={Link as any}
							href="/pages/marketing/flash-sales/new"
							sx={{ mt: 2 }}
							variant="outlined"
						>
							Create flash sale
						</Button>
					</Paper>
				)}
				{items?.length > 0 && (
					<TableContainer
						component={Paper}
						sx={{ borderRadius: 3, overflow: 'hidden', border: (t) => `1px solid ${t.palette.divider}` }}
					>
						<Table size="small">
							<TableHead>
								<TableRow>
									<TableCell width={50}></TableCell>
									<TableCell>Name</TableCell>
									<TableCell>Discount</TableCell>
									<TableCell>Window</TableCell>
									<TableCell>Products</TableCell>
									<TableCell align="right">Actions</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{items.map((x: any) => {
									const isExpanded = expandedRows.has(x.id);
									const products = x.products || [];

									return (
										<React.Fragment key={x.id}>
											<TableRow hover>
												<TableCell>
													{products.length > 0 && (
														<IconButton
															size="small"
															onClick={() => toggleRow(x.id)}
															sx={{ p: 0.5 }}
														>
															{isExpanded ? (
																<KeyboardArrowUpIcon />
															) : (
																<KeyboardArrowDownIcon />
															)}
														</IconButton>
													)}
												</TableCell>
												<TableCell>
													<Typography
														variant="body2"
														fontWeight={600}
													>
														{x.name}
													</Typography>
													{x.is_active ? (
														<Chip
															size="small"
															label="Active"
															color="success"
															sx={{ mt: 0.5, height: 20 }}
														/>
													) : (
														<Chip
															size="small"
															label="Inactive"
															color="default"
															sx={{ mt: 0.5, height: 20 }}
														/>
													)}
												</TableCell>
												<TableCell>
													<Chip
														size="small"
														label={
															x.discount_type === 'percent'
																? `${x.discount_value}% OFF`
																: `${formatPrice(parseFloat(x.discount_value))} OFF`
														}
														color="primary"
													/>
												</TableCell>
												<TableCell>
													<Typography
														variant="caption"
														display="block"
													>
														{x.starts_at ? new Date(x.starts_at).toLocaleString() : 'N/A'}
													</Typography>
													<Typography
														variant="caption"
														display="block"
														color="text.secondary"
													>
														{x.ends_at ? new Date(x.ends_at).toLocaleString() : 'N/A'}
													</Typography>
												</TableCell>
												<TableCell>
													<Chip
														size="small"
														color="info"
														label={`${products.length} ${products.length === 1 ? 'item' : 'items'}`}
														onClick={() => products.length > 0 && toggleRow(x.id)}
														sx={{ cursor: products.length > 0 ? 'pointer' : 'default' }}
													/>
												</TableCell>
												<TableCell align="right">
													<Stack
														direction="row"
														spacing={1}
														justifyContent="flex-end"
													>
														<Button
															size="small"
															color="error"
															variant="outlined"
															onClick={() => remove(x.id)}
														>
															Delete
														</Button>
													</Stack>
												</TableCell>
											</TableRow>
											{isExpanded && products.length > 0 && (
												<TableRow>
													<TableCell
														colSpan={6}
														sx={{ py: 0, border: 0 }}
													>
														<Collapse
															in={isExpanded}
															timeout="auto"
															unmountOnExit
														>
															<Box sx={{ margin: 2 }}>
																<Typography
																	variant="subtitle2"
																	fontWeight={600}
																	sx={{ mb: 2 }}
																>
																	Products in Flash Sale
																</Typography>
																<Table size="small">
																	<TableHead>
																		<TableRow>
																			<TableCell>Product Name</TableCell>
																			<TableCell align="right">
																				Original Price
																			</TableCell>
																			<TableCell align="right">
																				Discounted Price
																			</TableCell>
																			<TableCell align="right">Savings</TableCell>
																		</TableRow>
																	</TableHead>
																	<TableBody>
																		{products.map((product: any) => {
																			const savings =
																				product.originalPrice -
																				product.discountedPrice;
																			const savingsPercent =
																				product.originalPrice > 0
																					? (
																							(savings /
																								product.originalPrice) *
																							100
																						).toFixed(1)
																					: 0;

																			return (
																				<TableRow key={product.id}>
																					<TableCell>
																						<Typography
																							variant="body2"
																							fontWeight={500}
																						>
																							{product.name ||
																								`Product #${product.id}`}
																						</Typography>
																					</TableCell>
																					<TableCell align="right">
																						<Typography
																							variant="body2"
																							sx={{
																								textDecoration:
																									'line-through',
																								color: 'text.secondary'
																							}}
																						>
																							{formatPrice(
																								product.originalPrice
																							)}
																						</Typography>
																					</TableCell>
																					<TableCell align="right">
																						<Typography
																							variant="body2"
																							fontWeight={600}
																							color="primary"
																						>
																							{formatPrice(
																								product.discountedPrice
																							)}
																						</Typography>
																					</TableCell>
																					<TableCell align="right">
																						<Chip
																							size="small"
																							label={`${formatPrice(savings)} (${savingsPercent}%)`}
																							color="success"
																						/>
																					</TableCell>
																				</TableRow>
																			);
																		})}
																	</TableBody>
																</Table>
															</Box>
														</Collapse>
													</TableCell>
												</TableRow>
											)}
										</React.Fragment>
									);
								})}
							</TableBody>
						</Table>
					</TableContainer>
				)}
			</Container>
		</Box>
	);
}

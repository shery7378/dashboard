'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useGetSalesQuery, useGetVendorPerformanceQuery, useGetSalesHeatmapQuery } from './apis/AnalyticsApi';
import {
	Card,
	CardContent,
	CardHeader,
	Typography,
	Box,
	Table,
	TableHead,
	TableRow,
	TableCell,
	TableBody,
	TableContainer,
	Paper,
	Stack,
	Avatar
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import axios from 'axios';
// Using Box with CSS grid to avoid Grid import/version mismatches

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

// Currency symbols mapping
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
	KRW: '₩'
};

export default function ReportsPage() {
	const [defaultCurrency, setDefaultCurrency] = useState<string>('GBP'); // Default to GBP
	const [currencySymbol, setCurrencySymbol] = useState<string>('£');

	const { data: salesData } = useGetSalesQuery({ interval: 'day' });
	const { data: vendorPerf } = useGetVendorPerformanceQuery({ limit: 10 });
	const { data: heatmap } = useGetSalesHeatmapQuery({});

	const sales = Array.isArray(salesData?.data) ? salesData.data : [];
	const vendors = Array.isArray(vendorPerf?.data) ? vendorPerf.data : [];
	const heat = Array.isArray(heatmap?.data) ? heatmap.data : [];

	// Validate sales data format
	const validSales = sales.filter(
		(s: any) =>
			s &&
			typeof s.bucket === 'string' &&
			s.bucket.length > 0 &&
			(typeof s.total_sales === 'number' ||
				(typeof s.total_sales === 'string' && !isNaN(Number(s.total_sales)))) &&
			(typeof s.orders === 'number' || (typeof s.orders === 'string' && !isNaN(Number(s.orders))))
	);

	// Fetch default currency from API
	useEffect(() => {
		const fetchCurrency = async () => {
			try {
				const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
				const response = await axios.get(`${apiUrl}/api/currencies/rates`, {
					withCredentials: true,
					headers: { Accept: 'application/json' }
				});

				if (response.data?.default_currency) {
					const currency = response.data.default_currency;
					setDefaultCurrency(currency);
					setCurrencySymbol(CURRENCY_SYMBOLS[currency] || currency);
				}
			} catch (error) {
				console.warn('Failed to fetch default currency, using GBP as fallback', error);
				setDefaultCurrency('GBP');
				setCurrencySymbol('£');
			}
		};

		fetchCurrency();
	}, []);

	// Aggregates for KPIs - use validated sales data
	const totalSales = validSales.reduce((sum, s) => sum + (Number(s.total_sales) || 0), 0);
	const totalOrders = validSales.reduce((sum, s) => sum + (Number(s.orders) || 0), 0);
	const topvendor = vendors[0];

	const currency = new Intl.NumberFormat(undefined, {
		style: 'currency',
		currency: defaultCurrency,
		maximumFractionDigits: 0
	});
	const compactCurrency = new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 });
	const formatCompactCurrency = (v: number) => {
		if (!isFinite(v)) return `${currencySymbol}0`;

		const compact = compactCurrency.format(v).replace(/\s/g, '');
		return v >= 1000 ? `${currencySymbol}${compact}` : currency.format(v);
	};

	// Peaks for annotations - use validated sales data
	const salesValues = validSales.map((d) => Number(d.total_sales) || 0);
	const ordersValues = validSales.map((d) => Number(d.orders) || 0);
	const maxSales = salesValues.length ? Math.max(...salesValues) : 0;
	const maxSalesIdx = salesValues.indexOf(maxSales);
	const maxSalesBucket = maxSalesIdx >= 0 ? validSales[maxSalesIdx]?.bucket : undefined;
	const maxOrders = ordersValues.length ? Math.max(...ordersValues) : 0;
	const maxOrdersIdx = ordersValues.indexOf(maxOrders);
	const maxOrdersBucket = maxOrdersIdx >= 0 ? validSales[maxOrdersIdx]?.bucket : undefined;

	// Ensure data is properly formatted for ApexCharts
	const lineSeries = [
		{
			name: 'Total Sales',
			type: 'area',
			data: validSales.map((d) => {
				const y = Number(d.total_sales) || 0;
				return { x: String(d.bucket), y: isFinite(y) ? y : 0 };
			})
		},
		{
			name: 'Orders',
			type: 'column',
			data: validSales.map((d) => {
				const y = Number(d.orders) || 0;
				return { x: String(d.bucket), y: isFinite(y) ? y : 0 };
			})
		}
	];

	// Prepare chart data - filter out vendors with no name or zero sales
	const validvendors = vendors.filter((v) => v.vendor_name && Number(v.total_sales) > 0);

	const barSeries = [
		{
			name: 'Sales',
			data: validvendors.map((v) => Number(v.total_sales) || 0)
		}
	];

	const barCategories = validvendors.map((v) => v.vendor_name || 'Unknown Vendor');

	// Heatmap totals
	const totalHeatOrders = heat.reduce((sum: number, h: any) => sum + (Number(h.orders) || 0), 0);
	const totalHeatSales = heat.reduce((sum: number, h: any) => sum + (Number(h.total_sales) || 0), 0);

	return (
		<Box sx={{ p: { xs: 2, md: 3 }, bgcolor: 'background.default' }}>
			<Typography
				variant="h4"
				sx={{
					mb: 3,
					fontWeight: 800,
					letterSpacing: 0.2,
					background: 'linear-gradient(90deg, #111827 0%, #6366F1 40%, #06B6D4 80%)',
					WebkitBackgroundClip: 'text',
					backgroundClip: 'text',
					WebkitTextFillColor: 'transparent'
				}}
			>
				Admin Reports & Analytics
			</Typography>

			{/* KPI CARDS */}
			<Box
				sx={{
					mb: 1,
					display: 'grid',
					gap: 2,
					gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }
				}}
			>
				<Box>
					<Card
						sx={{
							height: '100%',
							boxShadow: 4,
							borderRadius: 3,
							background: 'linear-gradient(135deg, #6366F1 0%, #22C55E 100%)'
						}}
					>
						<CardContent>
							<Stack
								direction="row"
								spacing={2}
								alignItems="center"
							>
								<Avatar sx={{ bgcolor: 'rgba(255,255,255,0.18)', color: '#fff', boxShadow: 1 }}>
									<TrendingUpIcon />
								</Avatar>
								<Box>
									<Typography
										variant="overline"
										sx={{ color: 'rgba(255,255,255,0.85)' }}
									>
										Total Sales
									</Typography>
									<Typography
										variant="h4"
										sx={{ fontWeight: 800, color: 'common.white' }}
									>
										{currency.format(totalSales)}
									</Typography>
								</Box>
							</Stack>
						</CardContent>
					</Card>
				</Box>
				<Box>
					<Card
						sx={{
							height: '100%',
							boxShadow: 4,
							borderRadius: 3,
							background: 'linear-gradient(135deg, #06B6D4 0%, #22C55E 100%)'
						}}
					>
						<CardContent>
							<Stack
								direction="row"
								spacing={2}
								alignItems="center"
							>
								<Avatar sx={{ bgcolor: 'rgba(255,255,255,0.18)', color: '#fff', boxShadow: 1 }}>
									<ReceiptLongIcon />
								</Avatar>
								<Box>
									<Typography
										variant="overline"
										sx={{ color: 'rgba(255,255,255,0.85)' }}
									>
										Total Orders
									</Typography>
									<Typography
										variant="h4"
										sx={{ fontWeight: 800, color: 'common.white' }}
									>
										{totalOrders.toLocaleString()}
									</Typography>
								</Box>
							</Stack>
						</CardContent>
					</Card>
				</Box>
				<Box>
					<Card
						sx={{
							height: '100%',
							boxShadow: 4,
							borderRadius: 3,
							background: 'linear-gradient(135deg, #F59E0B 0%, #F43F5E 100%)'
						}}
					>
						<CardContent>
							<Stack
								direction="row"
								spacing={2}
								alignItems="center"
							>
								<Avatar sx={{ bgcolor: 'rgba(255,255,255,0.18)', color: '#fff', boxShadow: 1 }}>
									<EmojiEventsIcon />
								</Avatar>
								<Box>
									<Typography
										variant="overline"
										sx={{ color: 'rgba(255,255,255,0.85)' }}
									>
										Top Vendor
									</Typography>
									<Typography
										variant="h6"
										sx={{ fontWeight: 700, color: 'common.white' }}
									>
										{topvendor?.vendor_name || '—'}
									</Typography>
									<Typography
										variant="body2"
										sx={{ color: 'rgba(255,255,255,0.9)' }}
									>
										{topvendor ? currency.format(Number(topvendor.total_sales)) : ''}
									</Typography>
								</Box>
							</Stack>
						</CardContent>
					</Card>
				</Box>
			</Box>

			<Box
				sx={{
					display: 'grid',
					gap: 2,
					gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }
				}}
			>
				<Box>
					<Card sx={{ height: '100%', boxShadow: 6, borderRadius: 3 }}>
						<CardHeader
							title="Sales Over Time"
							subheader="Total sales and orders"
							titleTypographyProps={{ sx: { fontWeight: 700 } }}
							subheaderTypographyProps={{ sx: { color: 'text.secondary' } }}
						/>
						<CardContent>
							{validSales.length === 0 ? (
								<Box
									sx={{
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										height: 320
									}}
								>
									<Typography color="text.secondary">No sales data available</Typography>
								</Box>
							) : (
								<ReactApexChart
									type="line"
									height={320}
									options={{
										chart: {
											type: 'line',
											toolbar: { show: false },
											foreColor: '#6b7280',
											animations: { enabled: true, speed: 600 }
										},
										colors: ['#6366F1', '#22C55E'],
										xaxis: {
											type: 'category',
											categories: validSales.map((d) => String(d.bucket)),
											labels: { rotate: -15 }
										},
										stroke: {
											curve: 'smooth',
											width: [3, 2]
										},
										fill: {
											type: 'gradient',
											gradient: {
												shadeIntensity: 0.35,
												opacityFrom: 0.45,
												opacityTo: 0.05,
												stops: [0, 90, 100]
											}
										},
										markers: {
											size: 4,
											strokeWidth: 2,
											hover: { size: 7 }
										},
										grid: {
											borderColor: '#e5e7eb',
											strokeDashArray: 4,
											xaxis: { lines: { show: false } }
										},
										tooltip: {
											shared: true,
											intersect: false,
											y: [
												{ formatter: (val: number) => currency.format(val) },
												{ formatter: (val: number) => `${val} orders` }
											]
										},
										yaxis: [
											{
												title: { text: 'Sales' },
												labels: { formatter: (v: number) => formatCompactCurrency(v) }
											},
											{
												opposite: true,
												title: { text: 'Orders' }
											}
										],
										dataLabels: {
											enabled: false
										},
										legend: {
											position: 'top',
											horizontalAlign: 'left'
										}
									}}
									series={[
										{
											name: 'Total Sales',
											type: 'area',
											data: validSales.map((d) => {
												const y = Number(d.total_sales) || 0;
												return isFinite(y) ? y : 0;
											})
										},
										{
											name: 'Orders',
											type: 'column',
											data: validSales.map((d) => {
												const y = Number(d.orders) || 0;
												return isFinite(y) ? y : 0;
											})
										}
									]}
								/>
							)}
						</CardContent>
					</Card>
				</Box>

				<Box>
					<Card sx={{ height: '100%', boxShadow: 6, borderRadius: 3 }}>
						<CardHeader
							title="Top Vendors"
							subheader="By total sales"
							titleTypographyProps={{ sx: { fontWeight: 700 } }}
							subheaderTypographyProps={{ sx: { color: 'text.secondary' } }}
						/>
						<CardContent>
							{vendors.length === 0 ? (
								<Box
									sx={{
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										height: 320
									}}
								>
									<Typography color="text.secondary">No vendor data available</Typography>
								</Box>
							) : (
								<ReactApexChart
									type="bar"
									height={320}
									options={{
										theme: { mode: 'light' },
										chart: {
											toolbar: { show: false },
											animations: { enabled: true, speed: 600 }
										},
										colors: ['#22C55E'],
										xaxis: {
											categories: barCategories,
											labels: {
												rotateAlways: true,
												rotate: -25,
												trim: true,
												maxHeight: 60
											}
										},
										yaxis: {
											title: { text: 'Total Sales' },
											labels: { formatter: (v: number) => formatCompactCurrency(v) }
										},
										plotOptions: {
											bar: { horizontal: false, borderRadius: 6, columnWidth: '45%' }
										},
										dataLabels: {
											enabled: true,
											formatter: (val: number) => formatCompactCurrency(val),
											style: { fontSize: '11px', fontWeight: 600 }
										},
										legend: { show: false },
										tooltip: { y: { formatter: (val: number) => currency.format(val) } }
									}}
									series={barSeries}
								/>
							)}
						</CardContent>
					</Card>
				</Box>

				<Box sx={{ gridColumn: { xs: 'auto', lg: '1 / -1' } }}>
					<Card sx={{ boxShadow: 6, borderRadius: 3 }}>
						<CardHeader
							title="Sales Heatmap (by Store)"
							subheader={`Aggregated by store coordinates${totalHeatOrders < totalOrders ? ` (Only stores with coordinates: ${totalHeatOrders} of ${totalOrders} orders)` : ''}`}
							titleTypographyProps={{ sx: { fontWeight: 700 } }}
							subheaderTypographyProps={{ sx: { color: 'text.secondary' } }}
						/>
						<CardContent>
							<TableContainer
								component={Paper}
								variant="outlined"
								sx={{
									maxHeight: 360,
									borderRadius: 2,
									overflow: 'auto',
									background: 'linear-gradient(180deg, #ffffff 0%, #fafafa 100%)',
									borderColor: 'grey.200'
								}}
							>
								<Table
									size="small"
									stickyHeader
								>
									<TableHead>
										<TableRow>
											<TableCell
												sx={{
													fontWeight: 800,
													bgcolor: 'grey.50',
													textTransform: 'uppercase',
													letterSpacing: 0.4
												}}
											>
												Store ID
											</TableCell>
											<TableCell
												sx={{
													fontWeight: 800,
													bgcolor: 'grey.50',
													textTransform: 'uppercase',
													letterSpacing: 0.4
												}}
											>
												Latitude
											</TableCell>
											<TableCell
												sx={{
													fontWeight: 800,
													bgcolor: 'grey.50',
													textTransform: 'uppercase',
													letterSpacing: 0.4
												}}
											>
												Longitude
											</TableCell>
											<TableCell
												align="right"
												sx={{
													fontWeight: 800,
													bgcolor: 'grey.50',
													textTransform: 'uppercase',
													letterSpacing: 0.4
												}}
											>
												Orders
											</TableCell>
											<TableCell
												align="right"
												sx={{
													fontWeight: 800,
													bgcolor: 'grey.50',
													textTransform: 'uppercase',
													letterSpacing: 0.4
												}}
											>
												Total Sales
											</TableCell>
										</TableRow>
									</TableHead>
									<TableBody>
										{heat.map((h: any, i: number) => {
											const ts = Number(h.total_sales) || 0;
											return (
												<TableRow
													key={h.store_id}
													hover
													sx={{
														'&:nth-of-type(odd)': { bgcolor: 'grey.50' },
														transition: 'all .15s ease',
														'&:hover': { bgcolor: 'grey.100' }
													}}
												>
													<TableCell sx={{ fontWeight: 600 }}>{h.store_id}</TableCell>
													<TableCell sx={{ fontFamily: 'monospace' }}>
														{Number(h.latitude).toFixed(6)}
													</TableCell>
													<TableCell sx={{ fontFamily: 'monospace' }}>
														{Number(h.longitude).toFixed(6)}
													</TableCell>
													<TableCell align="right">
														<Box
															component="span"
															sx={{
																px: 1,
																py: 0.5,
																borderRadius: 1.5,
																fontWeight: 700,
																bgcolor: 'rgba(2,132,199,0.12)',
																color: 'info.main'
															}}
														>
															{h.orders}
														</Box>
													</TableCell>
													<TableCell align="right">
														<Box
															component="span"
															sx={{
																px: 1,
																py: 0.5,
																borderRadius: 1.5,
																fontWeight: 700,
																bgcolor:
																	ts >= 1000
																		? 'rgba(34,197,94,0.12)'
																		: 'rgba(99,102,241,0.12)',
																color: ts >= 1000 ? 'success.main' : 'primary.main'
															}}
														>
															{currency.format(ts)}
														</Box>
													</TableCell>
												</TableRow>
											);
										})}
										<TableRow>
											<TableCell sx={{ fontWeight: 800, textTransform: 'uppercase' }}>
												Total
											</TableCell>
											<TableCell colSpan={2} />
											<TableCell
												align="right"
												sx={{ fontWeight: 800 }}
											>
												{totalHeatOrders.toLocaleString()}
											</TableCell>
											<TableCell
												align="right"
												sx={{ fontWeight: 800 }}
											>
												{currency.format(totalHeatSales)}
											</TableCell>
										</TableRow>
									</TableBody>
								</Table>
							</TableContainer>
						</CardContent>
					</Card>
				</Box>
			</Box>
		</Box>
	);
}

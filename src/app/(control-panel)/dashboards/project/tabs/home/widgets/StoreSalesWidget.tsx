import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { memo, useEffect, useState } from 'react';
import { ApexOptions } from 'apexcharts';
import FuseLoading from '@fuse/core/FuseLoading';
import { useGetSalesQuery } from '@/app/(control-panel)/reports/apis/AnalyticsApi';
import dynamic from 'next/dynamic';
import axios from 'axios';

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

/**
 * Helper function to extract clean currency code from potentially serialized format.
 * Handles PHP serialized strings like s:3:"GBP"; and ensures clean currency codes.
 */
function extractCurrencyCode(value: any): string {
	if (!value) return 'GBP';

	const str = String(value).trim();

	// If it's already a clean 3-letter currency code, return it
	if (/^[A-Z]{3}$/.test(str)) {
		return str;
	}

	// Try to extract from PHP serialized format: s:3:"GBP"; or : s:3:"GBP";
	const serializedMatch = str.match(/s:\d+:"([A-Z]{3})"/i);

	if (serializedMatch && serializedMatch[1]) {
		return serializedMatch[1].toUpperCase();
	}

	// Try to extract any 3-letter uppercase code from the string
	const codeMatch = str.match(/\b([A-Z]{3})\b/);

	if (codeMatch && codeMatch[1]) {
		return codeMatch[1];
	}

	// Fallback to GBP if we can't extract a valid code
	return 'GBP';
}

/**
 * The StoreSalesWidget widget - Shows sales analytics over time
 */
function StoreSalesWidget() {
	const [defaultCurrency, setDefaultCurrency] = useState<string>('GBP');
	const [currencySymbol, setCurrencySymbol] = useState<string>('£');
	const [awaitRender, setAwaitRender] = useState(true);
	const { data: salesData, isLoading } = useGetSalesQuery({ interval: 'day' });

	const sales = salesData?.data ?? [];

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
					const rawCurrency = response.data.default_currency;
					const currency = extractCurrencyCode(rawCurrency);
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

	useEffect(() => {
		setAwaitRender(false);
	}, []);

	if (isLoading) {
		return <FuseLoading />;
	}

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

	const totalSales = sales.reduce((sum, s) => sum + (Number(s.total_sales) || 0), 0);
	const totalOrders = sales.reduce((sum, s) => sum + (Number(s.orders) || 0), 0);

	const lineSeries = [
		{
			name: 'Total Sales',
			type: 'area',
			data: sales.map((d) => ({ x: d.bucket, y: Number(d.total_sales) || 0 }))
		},
		{
			name: 'Orders',
			type: 'column',
			data: sales.map((d) => ({ x: d.bucket, y: Number(d.orders) || 0 }))
		}
	];

	const chartOptions: ApexOptions = {
		chart: {
			fontFamily: 'inherit',
			foreColor: 'inherit',
			height: '100%',
			type: 'line',
			toolbar: {
				show: false
			},
			zoom: {
				enabled: false
			},
			animations: {
				enabled: true,
				speed: 600
			}
		},
		colors: ['#6366F1', '#22C55E'],
		xaxis: {
			type: 'category',
			labels: {
				rotate: -15,
				style: {
					fontSize: '12px'
				}
			}
		},
		stroke: {
			curve: 'smooth',
			width: [3, 0]
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
			hover: {
				size: 7
			},
			colors: ['#ffffff'],
			strokeColors: ['#6366F1', '#22C55E']
		},
		grid: {
			borderColor: '#e5e7eb',
			strokeDashArray: 4,
			xaxis: {
				lines: {
					show: false
				}
			}
		},
		tooltip: {
			shared: true,
			intersect: false,
			theme: 'light',
			fillSeriesColor: false,
			y: [{ formatter: (val: number) => currency.format(val) }, { formatter: (val: number) => `${val} orders` }]
		},
		yaxis: [
			{
				title: {
					text: 'Sales'
				},
				labels: {
					formatter: (v: number) => formatCompactCurrency(v)
				}
			},
			{
				opposite: true,
				title: {
					text: 'Orders'
				},
				decimalsInFloat: 0
			}
		],
		legend: {
			position: 'top',
			horizontalAlign: 'left',
			itemMargin: {
				horizontal: 16,
				vertical: 6
			},
			fontWeight: 600
		},
		dataLabels: {
			enabled: true,
			enabledOnSeries: [1],
			formatter: (val: number) => {
				if (!val) return '';

				return `${val}`;
			},
			style: {
				fontSize: '11px',
				fontWeight: 600
			}
		}
	};

	if (awaitRender) {
		return null;
	}

	return (
		<Paper className="flex flex-col flex-auto p-6 shadow-sm rounded-xl overflow-hidden h-full">
			<div className="flex flex-col sm:flex-row items-start justify-between mb-4">
				<div>
					<Typography className="text-xl font-semibold tracking-tight leading-6 truncate">
						Store Sales Analytics
					</Typography>
					<Typography className="text-sm text-secondary mt-1">
						Total Sales: {currency.format(totalSales)} • Total Orders: {totalOrders.toLocaleString()}
					</Typography>
				</div>
			</div>
			<div className="flex flex-col flex-auto mt-2">
				<ReactApexChart
					className="flex-auto w-full"
					options={chartOptions}
					series={lineSeries}
					height={350}
				/>
			</div>
		</Paper>
	);
}

export default memo(StoreSalesWidget);

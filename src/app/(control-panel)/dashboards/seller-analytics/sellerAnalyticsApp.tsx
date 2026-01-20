'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import FusePageSimple from '@fuse/core/FusePageSimple';
import FuseLoading from '@fuse/core/FuseLoading';
import { Box, Card, CardContent, CardHeader, Typography, Stack, Avatar, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { useGetSalesQuery, useGetTopProductsQuery } from '../../reports/apis/AnalyticsApi';
import axios from 'axios';
import useUser from '@auth/useUser';

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
  KRW: '₩',
};

export default function SellerAnalyticsApp() {
  const { data: user } = useUser();
  const isSupplier = user?.role?.includes('supplier');
  const [defaultCurrency, setDefaultCurrency] = useState<string>('GBP'); // Default to GBP
  const [currencySymbol, setCurrencySymbol] = useState<string>('£');

  const { data: salesData, isLoading: loadingSales } = useGetSalesQuery({ interval: 'day' });
  const { data: topProductsData, isLoading: loadingProducts } = useGetTopProductsQuery({ limit: 10 });

  const sales = salesData?.data ?? [];
  const topProducts = topProductsData?.data ?? [] as Array<{ product_id: number; product_name: string; total_sales: number; orders: number }>;

  // Fetch default currency from API
  useEffect(() => {
    const fetchCurrency = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
        const response = await axios.get(`${apiUrl}/api/currencies/rates`, {
          withCredentials: true,
          headers: { 'Accept': 'application/json' }
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

  const totalSales = sales.reduce((sum, s) => sum + (Number(s.total_sales) || 0), 0);
  const totalOrders = sales.reduce((sum, s) => sum + (Number(s.orders) || 0), 0);
  const topProduct = topProducts[0];

  const currency = new Intl.NumberFormat(undefined, { style: 'currency', currency: defaultCurrency, maximumFractionDigits: 0 });
  const compactCurrency = new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 });
  const formatCompactCurrency = (v: number) => {
    if (!isFinite(v)) return `${currencySymbol}0`;
    const compact = compactCurrency.format(v).replace(/\s/g, '');
    return v >= 1000 ? `${currencySymbol}${compact}` : currency.format(v);
  };

  const lineSeries = [
    {
      name: 'Total Sales',
      type: 'area' as const,
      data: sales.map((d: any) => ({ x: d.bucket, y: Number(d.total_sales) })),
    },
    {
      name: 'Orders',
      type: 'column' as const,
      data: sales.map((d: any) => ({ x: d.bucket, y: Number(d.orders) })),
    },
  ];

  const productBarSeries = [
    {
      name: 'Sales',
      data: topProducts.map((p: any) => Number(p.total_sales) || 0),
    },
  ];
  const productBarCategories = topProducts.map((p: any) => p.product_name);

  if (loadingSales || loadingProducts) return <FuseLoading />;

  return (
    <FusePageSimple
      header={
        <Box sx={{ px: { xs: 2, md: 4 }, py: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            {isSupplier ? 'Supplier Analytics' : 'Seller Analytics'}
          </Typography>
          <Typography color="text.secondary">Sales, top products, and performance</Typography>
        </Box>
      }
      content={
        <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: 'background.default' }}>
          {/* KPI CARDS */}
          <Box sx={{ mb: 2, display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' } }}>
            <Box>
              <Card sx={{ height: '100%', boxShadow: 4, borderRadius: 3, background: 'linear-gradient(135deg, #6366F1 0%, #22C55E 100%)' }}>
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.18)', color: '#fff', boxShadow: 1 }}>
                      <TrendingUpIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.85)' }}>Total Sales</Typography>
                      <Typography variant="h4" sx={{ fontWeight: 800, color: 'common.white' }}>{currency.format(totalSales)}</Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Box>
            <Box>
              <Card sx={{ height: '100%', boxShadow: 4, borderRadius: 3, background: 'linear-gradient(135deg, #06B6D4 0%, #22C55E 100%)' }}>
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.18)', color: '#fff', boxShadow: 1 }}>
                      <ReceiptLongIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.85)' }}>Total Orders</Typography>
                      <Typography variant="h4" sx={{ fontWeight: 800, color: 'common.white' }}>{totalOrders.toLocaleString()}</Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Box>
            <Box>
              <Card sx={{ height: '100%', boxShadow: 4, borderRadius: 3, background: 'linear-gradient(135deg, #F59E0B 0%, #F43F5E 100%)' }}>
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.18)', color: '#fff', boxShadow: 1 }}>
                      <EmojiEventsIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.85)' }}>Top Product</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: 'common.white' }}>{topProduct?.product_name || '—'}</Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>{topProduct ? currency.format(Number(topProduct.total_sales)) : ''}</Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Box>
          </Box>

          {/* Charts */}
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' } }}>
            <Box>
              <Card sx={{ height: '100%', boxShadow: 6, borderRadius: 3 }}>
                <CardHeader title="Sales Over Time" subheader="Total sales and orders" titleTypographyProps={{ sx: { fontWeight: 700 } }} />
                <CardContent>
                  <ReactApexChart
                    type="line"
                    height={320}
                    options={{
                      theme: { mode: 'light' },
                      chart: { toolbar: { show: false }, foreColor: '#6b7280' },
                      colors: ['#6366F1', '#22C55E'],
                      xaxis: { type: 'category', labels: { rotate: -15 } },
                      stroke: { curve: 'smooth', width: [3, 0] },
                      fill: { type: 'gradient', gradient: { shadeIntensity: 0.35, opacityFrom: 0.45, opacityTo: 0.05, stops: [0, 90, 100] } },
                      markers: { size: 4, strokeWidth: 2, hover: { size: 7 }, colors: ['#ffffff'], strokeColors: ['#6366F1', '#22C55E'] },
                      grid: { borderColor: '#e5e7eb', strokeDashArray: 4 },
                      plotOptions: { bar: { columnWidth: '45%', borderRadius: 8, borderRadiusApplication: 'end' } },
                      tooltip: { shared: true, intersect: false, theme: 'light', fillSeriesColor: false, y: [{ formatter: (val: number) => currency.format(val) }, { formatter: (val: number) => `${val} orders` }] },
                      yaxis: [
                        { title: { text: 'Sales' }, labels: { formatter: (v: number) => formatCompactCurrency(v) } },
                        { opposite: true, title: { text: 'Orders' }, decimalsInFloat: 0 }
                      ],
                      legend: { position: 'top', horizontalAlign: 'left' },
                    }}
                    series={lineSeries}
                  />
                </CardContent>
              </Card>
            </Box>

            <Box>
              <Card sx={{ height: '100%', boxShadow: 6, borderRadius: 3 }}>
                <CardHeader title="Top Products" subheader="By total sales" titleTypographyProps={{ sx: { fontWeight: 700 } }} />
                <CardContent>
                  <ReactApexChart
                    type="bar"
                    height={320}
                    options={{
                      theme: { mode: 'light' },
                      chart: { toolbar: { show: false } },
                      colors: ['#22C55E'],
                      xaxis: { categories: productBarCategories, labels: { rotateAlways: true, rotate: -25, trim: true } },
                      plotOptions: { bar: { horizontal: false, borderRadius: 6, columnWidth: '45%' } },
                      dataLabels: { enabled: false },
                      legend: { show: false },
                      tooltip: { y: { formatter: (val: number) => currency.format(val) } },
                    }}
                    series={productBarSeries}
                  />
                </CardContent>
              </Card>
            </Box>

            <Box sx={{ gridColumn: { xs: 'auto', lg: '1 / -1' } }}>
              <Card sx={{ boxShadow: 6, borderRadius: 3 }}>
                <CardHeader title="Top Products Table" subheader="Sales and orders" titleTypographyProps={{ sx: { fontWeight: 700 } }} />
                <CardContent>
                  <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 360, borderRadius: 2, overflow: 'auto', background: 'linear-gradient(180deg, #ffffff 0%, #fafafa 100%)', borderColor: 'grey.200' }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 800, bgcolor: 'grey.50' }}>Product</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800, bgcolor: 'grey.50' }}>Orders</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800, bgcolor: 'grey.50' }}>Total Sales</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {topProducts.map((p: any) => (
                          <TableRow key={p.product_id} hover>
                            <TableCell sx={{ fontWeight: 600 }}>{p.product_name}</TableCell>
                            <TableCell align="right">{Number(p.orders).toLocaleString()}</TableCell>
                            <TableCell align="right">{currency.format(Number(p.total_sales) || 0)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Box>
          </Box>
        </Box>
      }
    />
  );
}





























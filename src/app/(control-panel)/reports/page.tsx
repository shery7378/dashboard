'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useGetSalesQuery, useGetVendorPerformanceQuery, useGetSalesHeatmapQuery } from './apis/AnalyticsApi';
import { Card, CardContent, CardHeader, Typography, Box, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Paper, Stack, Avatar } from '@mui/material';
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
  KRW: '₩',
};

export default function ReportsPage() {
  const [defaultCurrency, setDefaultCurrency] = useState<string>('GBP'); // Default to GBP
  const [currencySymbol, setCurrencySymbol] = useState<string>('£');

  const { data: salesData } = useGetSalesQuery({ interval: 'day' });
  const { data: vendorPerf } = useGetVendorPerformanceQuery({ limit: 10 });
  const { data: heatmap } = useGetSalesHeatmapQuery({});

  const sales = salesData?.data ?? [];
  const vendors = vendorPerf?.data ?? [];
  const heat = heatmap?.data ?? [];

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

  // Aggregates for KPIs
  const totalSales = sales.reduce((sum, s) => sum + (Number(s.total_sales) || 0), 0);
  const totalOrders = sales.reduce((sum, s) => sum + (Number(s.orders) || 0), 0);
  const topVendor = vendors[0];

  const currency = new Intl.NumberFormat(undefined, { style: 'currency', currency: defaultCurrency, maximumFractionDigits: 0 });
  const compactCurrency = new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 });
  const formatCompactCurrency = (v: number) => {
    if (!isFinite(v)) return `${currencySymbol}0`;
    const compact = compactCurrency.format(v).replace(/\s/g, '');
    return v >= 1000 ? `${currencySymbol}${compact}` : currency.format(v);
  };

  // Peaks for annotations
  const salesValues = sales.map((d) => Number(d.total_sales) || 0);
  const ordersValues = sales.map((d) => Number(d.orders) || 0);
  const maxSales = salesValues.length ? Math.max(...salesValues) : 0;
  const maxSalesIdx = salesValues.indexOf(maxSales);
  const maxSalesBucket = maxSalesIdx >= 0 ? sales[maxSalesIdx]?.bucket : undefined;
  const maxOrders = ordersValues.length ? Math.max(...ordersValues) : 0;
  const maxOrdersIdx = ordersValues.indexOf(maxOrders);
  const maxOrdersBucket = maxOrdersIdx >= 0 ? sales[maxOrdersIdx]?.bucket : undefined;

  const lineSeries = [
    {
      name: 'Total Sales',
      type: 'area',
      data: sales.map((d) => ({ x: d.bucket, y: Number(d.total_sales) })),
    },
    {
      name: 'Orders',
      type: 'column',
      data: sales.map((d) => ({ x: d.bucket, y: Number(d.orders) })),
    },
  ];

  // Prepare chart data - filter out vendors with no name or zero sales
  const validVendors = vendors.filter((v) => v.vendor_name && Number(v.total_sales) > 0);
  
  const barSeries = [
    {
      name: 'Sales',
      data: validVendors.map((v) => Number(v.total_sales) || 0),
    },
  ];

  const barCategories = validVendors.map((v) => v.vendor_name || 'Unknown Seller');

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
          WebkitTextFillColor: 'transparent',
        }}
      >
        Admin Reports & Analytics
      </Typography>

      {/* KPI CARDS */}
      <Box sx={{
        mb: 1,
        display: 'grid',
        gap: 2,
        gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }
      }}>
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
                  <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.85)' }}>Top Seller</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'common.white' }}>{topVendor?.vendor_name || '—'}</Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>{topVendor ? currency.format(Number(topVendor.total_sales)) : ''}</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Box>

      <Box sx={{
        display: 'grid',
        gap: 2,
        gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }
      }}>
        <Box>
          <Card sx={{ height: '100%', boxShadow: 6, borderRadius: 3 }}>
            <CardHeader
              title="Sales Over Time"
              subheader="Total sales and orders"
              titleTypographyProps={{ sx: { fontWeight: 700 } }}
              subheaderTypographyProps={{ sx: { color: 'text.secondary' } }}
            />
            <CardContent>
              <ReactApexChart
                type="line"
                height={320}
                options={{
                  theme: { mode: 'light' },
                  chart: {
                    toolbar: { show: false },
                    foreColor: '#6b7280',
                    dropShadow: { enabled: true, top: 2, left: 2, blur: 3, opacity: 0.15 },
                    animations: { enabled: true, speed: 600, animateGradually: { enabled: true, delay: 120 } },
                    background: 'linear-gradient(180deg, #ffffff 0%, #fafafa 100%)',
                  },
                  colors: ['#6366F1', '#22C55E'],
                  xaxis: { type: 'category', labels: { rotate: -15 } },
                  stroke: { curve: 'smooth', width: [3, 0] },
                  fill: { type: 'gradient', gradient: { shadeIntensity: 0.35, opacityFrom: 0.45, opacityTo: 0.05, stops: [0, 90, 100] } },
                  markers: { size: 4, strokeWidth: 2, hover: { size: 7 }, colors: ['#ffffff'], strokeColors: ['#6366F1', '#22C55E'] },
                  grid: { borderColor: '#e5e7eb', strokeDashArray: 4, xaxis: { lines: { show: false } }, row: { colors: ['#fafafa', 'transparent'], opacity: 0.6 } },
                  plotOptions: { bar: { columnWidth: '45%', borderRadius: 8, borderRadiusApplication: 'end' } },
                  tooltip: { shared: true, intersect: false, theme: 'light', fillSeriesColor: false, y: [{ formatter: (val: number) => currency.format(val) }, { formatter: (val: number) => `${val} orders` }] },
                  yaxis: [
                    { title: { text: 'Sales' }, labels: { formatter: (v: number) => formatCompactCurrency(v) } },
                    { opposite: true, title: { text: 'Orders' }, decimalsInFloat: 0 }
                  ],
                  dataLabels: {
                    enabled: true,
                    enabledOnSeries: [1],
                    formatter: (val: number, opts: any) => {
                      // show labels only for non-zero orders
                      if (!val) return '';
                      return `${val}`;
                    },
                    style: { fontSize: '11px', fontWeight: 600 },
                    background: { enabled: true, borderRadius: 6, borderWidth: 0, opacity: 0.8 },
                  },
                  states: { hover: { filter: { type: 'lighten' } }, active: { filter: { type: 'darken' } } },
                  legend: { position: 'top', horizontalAlign: 'left', itemMargin: { horizontal: 16, vertical: 6 }, fontWeight: 600 },
                  annotations: {
                    points: [
                      ...(maxSalesBucket !== undefined ? [{
                        x: maxSalesBucket,
                        y: maxSales,
                        seriesIndex: 0,
                        marker: { size: 6, fillColor: '#6366F1', strokeColor: '#111827', strokeWidth: 2 },
                        label: { text: `Peak ${currency.format(maxSales)}`, borderColor: '#6366F1', style: { background: '#EEF2FF', color: '#111827' } },
                      }] : []),
                      ...(maxOrdersBucket !== undefined ? [{
                        x: maxOrdersBucket,
                        y: maxOrders,
                        seriesIndex: 1,
                        marker: { size: 6, fillColor: '#22C55E', strokeColor: '#111827', strokeWidth: 2 },
                        label: { text: `Max ${maxOrders} orders`, borderColor: '#22C55E', style: { background: '#ECFDF5', color: '#065F46' } },
                      }] : []),
                    ],
                  },
                }}
                series={lineSeries}
              />
            </CardContent>
          </Card>
        </Box>

        <Box>
          <Card sx={{ height: '100%', boxShadow: 6, borderRadius: 3 }}>
            <CardHeader
              title="Top Sellers"
              subheader="By total sales"
              titleTypographyProps={{ sx: { fontWeight: 700 } }}
              subheaderTypographyProps={{ sx: { color: 'text.secondary' } }}
            />
            <CardContent>
              {vendors.length === 0 ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 320 }}>
                  <Typography color="text.secondary">No seller data available</Typography>
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
                    plotOptions: { bar: { horizontal: false, borderRadius: 6, columnWidth: '45%' } },
                    dataLabels: { 
                      enabled: true,
                      formatter: (val: number) => formatCompactCurrency(val),
                      style: { fontSize: '11px', fontWeight: 600 }
                    },
                    legend: { show: false },
                    tooltip: { y: { formatter: (val: number) => currency.format(val) } },
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
              <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 360, borderRadius: 2, overflow: 'auto', background: 'linear-gradient(180deg, #ffffff 0%, #fafafa 100%)', borderColor: 'grey.200' }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800, bgcolor: 'grey.50', textTransform: 'uppercase', letterSpacing: 0.4 }}>Store ID</TableCell>
                      <TableCell sx={{ fontWeight: 800, bgcolor: 'grey.50', textTransform: 'uppercase', letterSpacing: 0.4 }}>Latitude</TableCell>
                      <TableCell sx={{ fontWeight: 800, bgcolor: 'grey.50', textTransform: 'uppercase', letterSpacing: 0.4 }}>Longitude</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, bgcolor: 'grey.50', textTransform: 'uppercase', letterSpacing: 0.4 }}>Orders</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, bgcolor: 'grey.50', textTransform: 'uppercase', letterSpacing: 0.4 }}>Total Sales</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {heat.map((h: any, i: number) => {
                      const ts = Number(h.total_sales) || 0;
                      return (
                        <TableRow key={h.store_id} hover sx={{ '&:nth-of-type(odd)': { bgcolor: 'grey.50' }, transition: 'all .15s ease', '&:hover': { bgcolor: 'grey.100' } }}>
                          <TableCell sx={{ fontWeight: 600 }}>{h.store_id}</TableCell>
                          <TableCell sx={{ fontFamily: 'monospace' }}>{Number(h.latitude).toFixed(6)}</TableCell>
                          <TableCell sx={{ fontFamily: 'monospace' }}>{Number(h.longitude).toFixed(6)}</TableCell>
                          <TableCell align="right">
                            <Box component="span" sx={{ px: 1, py: 0.5, borderRadius: 1.5, fontWeight: 700, bgcolor: 'rgba(2,132,199,0.12)', color: 'info.main' }}>{h.orders}</Box>
                          </TableCell>
                          <TableCell align="right">
                            <Box component="span" sx={{ px: 1, py: 0.5, borderRadius: 1.5, fontWeight: 700, bgcolor: ts >= 1000 ? 'rgba(34,197,94,0.12)' : 'rgba(99,102,241,0.12)', color: ts >= 1000 ? 'success.main' : 'primary.main' }}>
                              {currency.format(ts)}
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800, textTransform: 'uppercase' }}>Total</TableCell>
                      <TableCell colSpan={2} />
                      <TableCell align="right" sx={{ fontWeight: 800 }}>{totalHeatOrders.toLocaleString()}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800 }}>{currency.format(totalHeatSales)}</TableCell>
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

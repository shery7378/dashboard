'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import FusePageSimple from '@fuse/core/FusePageSimple';
import { Box, Card, CardContent, CardHeader, Typography, Stack, Avatar, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Skeleton } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { useGetSalesQuery, useGetTopProductsQuery } from '../../reports/apis/AnalyticsApi';
import axios from 'axios';
import useUser from '@auth/useUser';

const ReactApexChart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
  loading: () => <Skeleton variant="rounded" height={320} />
});

// Currency symbols mapping
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  GBP: '£',
  BGP: '£',
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

  const { data: salesData, isLoading: loadingSales, error: salesError } = useGetSalesQuery({ interval: 'day' });
  const { data: topProductsData, isLoading: loadingProducts, error: productsError } = useGetTopProductsQuery({ limit: 10 });

  const sales = salesData?.data ?? [];
  const topProducts = topProductsData?.data ?? [] as Array<{ product_id: number; product_name: string; total_sales: number; orders: number }>;

  // Check if there's an error or no data
  const hasError = salesError || productsError;
  const hasNoData = !loadingSales && !loadingProducts && sales.length === 0 && topProducts.length === 0;

  // Helper function to check if error has status
  const hasErrorStatus = (error: any, status: number) => {
    return error && typeof error === 'object' && 'status' in error && error.status === status;
  };

  // Show empty state if there's no data OR if there's a 404/403 error (likely no data available)
  const shouldShowEmptyState = hasNoData || (hasError && (
    hasErrorStatus(salesError, 404) ||
    hasErrorStatus(salesError, 403) ||
    hasErrorStatus(productsError, 404) ||
    hasErrorStatus(productsError, 403)
  ));

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
          const currency = String(response.data.default_currency).toUpperCase();
          const normalizedCurrency = currency === 'BGP' ? 'GBP' : currency;
          setDefaultCurrency(normalizedCurrency);
          setCurrencySymbol(CURRENCY_SYMBOLS[normalizedCurrency] || normalizedCurrency);
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
          {/* Error State */}
          {hasError && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
              <Typography color="error" variant="h6" sx={{ mb: 2 }}>
                Unable to load analytics data
              </Typography>
              <Typography color="text.secondary" variant="body2">
                Please check your connection and try again.
              </Typography>
            </Box>
          )}

          {/* Empty State for New Sellers */}
          {shouldShowEmptyState && (
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '60vh',
              textAlign: 'center',
              px: 3
            }}>
              {/* Icon */}
              <Box sx={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 4,
                boxShadow: '0 20px 40px rgba(102, 126, 234, 0.15)'
              }}>
                <TrendingUpIcon sx={{ fontSize: 48, color: 'white' }} />
              </Box>

              {/* Welcome Text */}
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 700,
                  color: 'text.primary',
                  mb: 2,
                  fontSize: { xs: '1.8rem', md: '2.2rem' }
                }}
              >
                Welcome to Your Analytics Dashboard
              </Typography>

              <Typography
                variant="h6"
                sx={{
                  color: 'text.secondary',
                  mb: 6,
                  maxWidth: 600,
                  lineHeight: 1.6,
                  fontSize: { xs: '1rem', md: '1.1rem' }
                }}
              >
                {isSupplier
                  ? "Start adding products to see your sales analytics and performance metrics here."
                  : "Start adding products and making sales to see your analytics and performance metrics here."
                }
              </Typography>

              {/* Stats Cards */}
              <Box sx={{
                display: 'grid',
                gap: 3,
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
                width: '100%',
                maxWidth: 800
              }}>
                <Card sx={{
                  p: 3,
                  textAlign: 'center',
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                  border: '1px solid',
                  borderColor: 'grey.200',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 24px rgba(0,0,0,0.1)'
                  }
                }}>
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 700,
                      color: 'primary.main',
                      mb: 1,
                      fontSize: { xs: '1.8rem', md: '2rem' }
                    }}
                  >
                    {currency.format(0)}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color: 'text.secondary',
                      fontWeight: 500,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5
                    }}
                  >
                    Total Sales
                  </Typography>
                </Card>

                <Card sx={{
                  p: 3,
                  textAlign: 'center',
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
                  border: '1px solid',
                  borderColor: 'grey.200',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 24px rgba(0,0,0,0.1)'
                  }
                }}>
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 700,
                      color: 'warning.main',
                      mb: 1,
                      fontSize: { xs: '1.8rem', md: '2rem' }
                    }}
                  >
                    0
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color: 'text.secondary',
                      fontWeight: 500,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5
                    }}
                  >
                    Total Orders
                  </Typography>
                </Card>

                <Card sx={{
                  p: 3,
                  textAlign: 'center',
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                  border: '1px solid',
                  borderColor: 'grey.200',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 24px rgba(0,0,0,0.1)'
                  }
                }}>
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 700,
                      color: 'info.main',
                      mb: 1,
                      fontSize: { xs: '1.8rem', md: '2rem' }
                    }}
                  >
                    —
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color: 'text.secondary',
                      fontWeight: 500,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5
                    }}
                  >
                    Top Product
                  </Typography>
                </Card>
              </Box>

              {/* Call to Action */}
              <Box sx={{ mt: 6 }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <EmojiEventsIcon sx={{ fontSize: 20, color: 'warning.main' }} />
                  Ready to start selling? Add your first product to see your analytics come to life!
                </Typography>
              </Box>
            </Box>
          )}

          {/* Error State (for non-404/403 errors) */}
          {hasError && !shouldShowEmptyState && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
              <Typography color="error" variant="h6" sx={{ mb: 2 }}>
                Unable to load analytics data
              </Typography>
              <Typography color="text.secondary" variant="body2">
                Please check your connection and try again.
              </Typography>
            </Box>
          )}

          {/* Normal Analytics View */}
          {!hasError && !shouldShowEmptyState && (
            <>
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
                          {loadingSales ? (
                            <Skeleton variant="text" width={140} sx={{ bgcolor: 'rgba(255,255,255,0.25)' }} />
                          ) : (
                            <Typography variant="h4" sx={{ fontWeight: 800, color: 'common.white' }}>{currency.format(totalSales)}</Typography>
                          )}
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
                          {loadingSales ? (
                            <Skeleton variant="text" width={100} sx={{ bgcolor: 'rgba(255,255,255,0.25)' }} />
                          ) : (
                            <Typography variant="h4" sx={{ fontWeight: 800, color: 'common.white' }}>{totalOrders.toLocaleString()}</Typography>
                          )}
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
                          {loadingProducts ? (
                            <>
                              <Skeleton variant="text" width={160} sx={{ bgcolor: 'rgba(255,255,255,0.25)' }} />
                              <Skeleton variant="text" width={90} sx={{ bgcolor: 'rgba(255,255,255,0.25)' }} />
                            </>
                          ) : (
                            <>
                              <Typography variant="h6" sx={{ fontWeight: 700, color: 'common.white' }}>{topProduct?.product_name || '—'}</Typography>
                              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>{topProduct ? currency.format(Number(topProduct.total_sales)) : ''}</Typography>
                            </>
                          )}
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
                      {loadingSales ? (
                        <Skeleton variant="rounded" height={320} />
                      ) : (
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
                      )}
                    </CardContent>
                  </Card>
                </Box>

                <Box>
                  <Card sx={{ height: '100%', boxShadow: 6, borderRadius: 3 }}>
                    <CardHeader title="Top Products" subheader="By total sales" titleTypographyProps={{ sx: { fontWeight: 700 } }} />
                    <CardContent>
                      {loadingProducts ? (
                        <Skeleton variant="rounded" height={320} />
                      ) : (
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
                      )}
                    </CardContent>
                  </Card>
                </Box>

                <Box sx={{ gridColumn: { xs: 'auto', lg: '1 / -1' } }}>
                  <Card sx={{ boxShadow: 6, borderRadius: 3 }}>
                    <CardHeader title="Top Products Table" subheader="Sales and orders" titleTypographyProps={{ sx: { fontWeight: 700 } }} />
                    <CardContent>
                      {loadingProducts ? (
                        <Skeleton variant="rounded" height={240} />
                      ) : (
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
                      )}
                    </CardContent>
                  </Card>
                </Box>
              </Box>
            </>
          )}
        </Box>
      }
    />
  );
}





























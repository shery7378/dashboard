'use client';

import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Container,
  MenuItem,
  Snackbar,
  TextField,
  Typography,
} from '@mui/material';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import RestartAltOutlinedIcon from '@mui/icons-material/RestartAltOutlined';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import {
  useGetAdminProductFeesSettingsQuery,
  useUpdateAdminProductFeesSettingsMutation,
} from './ProductFeesAdminApi';

export default function ProductFeesSettingsPage() {
  const {
    data,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetAdminProductFeesSettingsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  const [updateSettings, { isLoading: isSaving }] = useUpdateAdminProductFeesSettingsMutation();

  const [standardFee, setStandardFee] = useState<number>(0);
  const [feeType, setFeeType] = useState<'fixed' | 'percentage'>('fixed');
  const [feeDescription, setFeeDescription] = useState('');
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load data into local state
  useEffect(() => {
    const d = data?.data;
    if (!d) return;

    setStandardFee(d.standard_product_fee ?? 0);
    setFeeType(d.standard_product_fee_type ?? 'fixed');
    setFeeDescription(d.standard_product_fee_description ?? 'Standard product fee');
    setCurrencySymbol(d.currency_symbol ?? '$');
  }, [data]);

  // Error from initial load
  useEffect(() => {
    if (isError && error) {
      const anyErr = error as any;
      setErrorMessage(anyErr?.data?.message || 'Failed to load product fees settings.');
    }
  }, [isError, error]);

  const handleSave = async () => {
    try {
      if (standardFee < 0) {
        setErrorMessage('Product fee cannot be negative.');
        return;
      }

      if (feeType === 'percentage' && standardFee > 100) {
        setErrorMessage('Percentage fee cannot exceed 100%.');
        return;
      }

      await updateSettings({
        standard_product_fee: standardFee,
        standard_product_fee_type: feeType,
        standard_product_fee_description: feeDescription || 'Standard product fee',
      }).unwrap();

      setMessage('Product fees settings updated successfully.');
      await refetch();
    } catch (e: any) {
      setErrorMessage(e?.data?.message || 'Failed to update product fees settings.');
    }
  };

  const handleReload = async () => {
    try {
      await refetch();
      setMessage('Product fees settings reloaded from server.');
    } catch {
      setErrorMessage('Failed to reload product fees settings.');
    }
  };

  return (
    <>
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #020617 0%, #0f172a 40%, #1f2937 100%)',
          py: 6,
        }}
      >
        <Container maxWidth="md">
          {/* Header */}
          <Box
            sx={{
              mb: 4,
              textAlign: 'center',
              color: 'white',
            }}
          >
            <Typography variant="h3" fontWeight={800} gutterBottom>
              Product Fees Settings
            </Typography>
            <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
              Configure the standard fee that will be applied to all products on the platform.
            </Typography>
          </Box>

          {/* Card */}
          <Card
            elevation={8}
            sx={{
              borderRadius: 4,
              overflow: 'hidden',
              background: 'rgba(15,23,42,0.98)',
              border: '1px solid rgba(148,163,184,0.35)',
              color: 'white',
            }}
          >
            <CardHeader
              avatar={
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: '999px',
                    background:
                      'radial-gradient(circle at 30% 30%, #10b981 0%, #059669 40%, #047857 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 10px 30px rgba(16,185,129,0.5)',
                  }}
                >
                  <AttachMoneyIcon sx={{ color: 'white', fontSize: 30 }} />
                </Box>
              }
              title={
                <Typography variant="h5" fontWeight={700}>
                  Standard Product Fee Configuration
                </Typography>
              }
              subheader={
                <Typography variant="body2" sx={{ color: 'rgba(148,163,184,0.9)' }}>
                  Set a global fee that applies to all products. Choose between a fixed amount or a percentage of the product price.
                </Typography>
              }
              sx={{
                pb: 0,
                '& .MuiCardHeader-subheader': {
                  mt: 1,
                },
              }}
            />

            <CardContent sx={{ pt: 3 }}>
              {isFetching && !data && (
                <Alert severity="info" sx={{ backgroundColor: 'rgba(15,23,42,0.9)', color: 'white' }}>
                  Loading product fees settings…
                </Alert>
              )}

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
                <TextField
                  select
                  label="Fee Type"
                  value={feeType}
                  onChange={(e) => setFeeType(e.target.value as 'fixed' | 'percentage')}
                  fullWidth
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      backgroundColor: 'rgba(15,23,42,0.95)',
                      color: 'white',
                      '& fieldset': {
                        borderColor: 'rgba(148,163,184,0.6)',
                      },
                      '&:hover fieldset': {
                        borderColor: '#10b981',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#10b981',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: 'rgba(148,163,184,0.9)',
                    },
                    '& .MuiInputBase-input': {
                      color: 'white',
                    },
                  }}
                  helperText={
                    feeType === 'fixed'
                      ? 'A fixed amount added to every product (e.g., $5.00 per product)'
                      : 'A percentage of the product price (e.g., 5% means $5.00 fee for a $100 product)'
                  }
                >
                  <MenuItem value="fixed">Fixed Amount</MenuItem>
                  <MenuItem value="percentage">Percentage (%)</MenuItem>
                </TextField>

                <TextField
                  label={`Standard Product Fee ${feeType === 'percentage' ? '(%)' : `(${currencySymbol})`}`}
                  type="number"
                  value={standardFee}
                  onChange={(e) => setStandardFee(parseFloat(e.target.value) || 0)}
                  fullWidth
                  variant="outlined"
                  inputProps={{
                    min: 0,
                    max: feeType === 'percentage' ? 100 : undefined,
                    step: feeType === 'percentage' ? 0.1 : 0.01,
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      backgroundColor: 'rgba(15,23,42,0.95)',
                      color: 'white',
                      '& fieldset': {
                        borderColor: 'rgba(148,163,184,0.6)',
                      },
                      '&:hover fieldset': {
                        borderColor: '#10b981',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#10b981',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: 'rgba(148,163,184,0.9)',
                    },
                    '& .MuiInputBase-input': {
                      color: 'white',
                    },
                  }}
                  helperText={
                    feeType === 'fixed'
                      ? `Enter the fixed fee amount in ${currencySymbol} (e.g., 5.00 for ${currencySymbol}5.00 per product)`
                      : 'Enter the percentage fee (e.g., 5 for 5% of product price)'
                  }
                />

                <TextField
                  label="Fee Description (Optional)"
                  value={feeDescription}
                  onChange={(e) => setFeeDescription(e.target.value)}
                  fullWidth
                  variant="outlined"
                  placeholder="e.g., Platform fee, Service charge"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      backgroundColor: 'rgba(15,23,42,0.95)',
                      color: 'white',
                      '& fieldset': {
                        borderColor: 'rgba(148,163,184,0.6)',
                      },
                      '&:hover fieldset': {
                        borderColor: '#10b981',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#10b981',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: 'rgba(148,163,184,0.9)',
                    },
                    '& .MuiInputBase-input': {
                      color: 'white',
                    },
                  }}
                  helperText="Optional description for this fee that may be shown to customers."
                />

                {/* Information Box */}
                <Alert
                  severity="info"
                  sx={{
                    backgroundColor: 'rgba(15,23,42,0.9)',
                    color: 'white',
                    border: '1px solid rgba(56,189,248,0.3)',
                    '& .MuiAlert-icon': {
                      color: '#38bdf8',
                    },
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    How Product Fees Work:
                  </Typography>
                  <Typography variant="body2" component="div">
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                      <li>
                        <strong>Fixed Amount:</strong> A constant fee added to every product regardless of price.
                      </li>
                      <li>
                        <strong>Percentage:</strong> A fee calculated as a percentage of each product's price.
                      </li>
                    </ul>
                    <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                      Note: This is a global setting that applies to all products. Individual product fees can be overridden at the product level if needed.
                    </Typography>
                  </Typography>
                </Alert>
              </Box>
            </CardContent>

            <CardActions
              sx={{
                justifyContent: 'flex-end',
                p: 3,
                gap: 2,
                borderTop: '1px solid rgba(51,65,85,0.8)',
                background: 'linear-gradient(to right, rgba(15,23,42,1), rgba(15,23,42,0.95))',
              }}
            >
              <Button
                variant="outlined"
                startIcon={<RestartAltOutlinedIcon />}
                onClick={handleReload}
                disabled={isFetching}
                sx={{
                  borderRadius: 999,
                  px: 3,
                  textTransform: 'none',
                  fontWeight: 600,
                  borderColor: 'rgba(148,163,184,0.7)',
                  color: 'rgba(248,250,252,0.9)',
                  '&:hover': {
                    borderColor: '#e5e7eb',
                    backgroundColor: 'rgba(15,23,42,0.8)',
                  },
                }}
              >
                Reload
              </Button>

              <Button
                variant="contained"
                startIcon={<SaveOutlinedIcon />}
                onClick={handleSave}
                disabled={isSaving}
                sx={{
                  borderRadius: 999,
                  px: 4,
                  py: 1.5,
                  textTransform: 'none',
                  fontWeight: 700,
                  background:
                    'linear-gradient(135deg, #10b981 0%, #059669 40%, #047857 100%)',
                  boxShadow: '0 10px 25px rgba(16,185,129,0.5)',
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: '0 14px 30px rgba(16,185,129,0.6)',
                    background:
                      'linear-gradient(135deg, #059669 0%, #10b981 40%, #047857 100%)',
                  },
                }}
              >
                {isSaving ? 'Saving…' : 'Save Settings'}
              </Button>
            </CardActions>
          </Card>
        </Container>
      </Box>

      {/* Notifications */}
      <Snackbar
        open={!!message}
        autoHideDuration={3000}
        onClose={() => setMessage(null)}
      >
        <Alert severity="success" variant="filled" onClose={() => setMessage(null)}>
          {message}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!errorMessage}
        autoHideDuration={4000}
        onClose={() => setErrorMessage(null)}
      >
        <Alert severity="error" variant="filled" onClose={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </>
  );
}


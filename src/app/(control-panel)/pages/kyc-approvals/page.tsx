'use client';

import FusePageSimple from '@fuse/core/FusePageSimple';
import { Box, Button, Card, CardContent, CardHeader, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Stack, Alert, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, Grid, IconButton, Tooltip, TextField, Snackbar } from '@mui/material';
import { useListKycSubmissionsQuery, useApproveKycMutation, useRejectKycMutation, useGetKycDocumentsQuery, useStartKybInquiryMutation } from '../kyc/apis/KycApi';
import { useState } from 'react';

export default function KycApprovalsPage() {
  const { data, error, isLoading, refetch } = useListKycSubmissionsQuery({ status: 'pending' });
  const [approve, { isLoading: approving }] = useApproveKycMutation();
  const [reject, { isLoading: rejecting }] = useRejectKycMutation();
  const [docSubmissionId, setDocSubmissionId] = useState<number | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const { data: docsData, isFetching: docsLoading } = useGetKycDocumentsQuery({ submissionId: docSubmissionId as number }, { skip: docSubmissionId == null });
  const [kybOpen, setKybOpen] = useState(false);
  const [kybVendor, setKybVendor] = useState<{ id: number; name: string } | null>(null);
  const [kybName, setKybName] = useState('');
  const [kybEmail, setKybEmail] = useState('');
  const [kybError, setKybError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const [startKyb, { isLoading: startingKyb }] = useStartKybInquiryMutation();

  const submissions = data?.data ?? [];

  async function onApprove(id: number) {
    await approve({ submissionId: id });
    refetch();
  }
  async function onReject(id: number) {
    await reject({ submissionId: id });
    refetch();
  }

  async function onStartKyb() {
    if (!kybVendor || !kybVendor.id) {
      setKybError('Vendor ID is required');
      return;
    }
    
    setKybError(null);
    
    try {
      // Prepare payload - ensure reference_id is always a string
      const payload: { reference_id: string; name?: string; email?: string } = {
        reference_id: String(kybVendor.id)
      };
      
      if (kybName && kybName.trim()) {
        payload.name = kybName.trim();
      }
      
      if (kybEmail && kybEmail.trim()) {
        payload.email = kybEmail.trim();
      }
      
      // Debug log in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Starting KYB with payload:', payload);
      }
      
      const result = await startKyb(payload).unwrap();
      
      // Success
      setSnackbarMessage('KYB inquiry started successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setKybOpen(false);
      setKybVendor(null);
      setKybName('');
      setKybEmail('');
      refetch();
    } catch (error: any) {
      // Error handling - safely extract error message, handling objects with title property
      let errorMessage = 'Failed to start KYB inquiry';
      
      // Log full error for debugging
      console.error('KYB Error:', error);
      console.error('Error data:', error?.data);
      console.error('Error status:', error?.status);
      
      // Helper function to extract message from error array or object
      const extractFromError = (err: any): string | null => {
        if (typeof err === 'string') {
          return err;
        }
        if (Array.isArray(err) && err.length > 0) {
          const firstError = err[0];
          if (typeof firstError === 'object' && firstError !== null) {
            return firstError.title || firstError.message || JSON.stringify(firstError);
          }
          if (typeof firstError === 'string') {
            return firstError;
          }
        }
        if (typeof err === 'object' && err !== null) {
          return err.title || err.message || JSON.stringify(err);
        }
        return null;
      };
      
      // Check error.data first (RTK Query structure)
      if (error?.data) {
        // Handle Laravel validation errors (422)
        if (error.data.errors && typeof error.data.errors === 'object') {
          const validationErrors = Object.entries(error.data.errors)
            .map(([field, messages]: [string, any]) => {
              const msg = Array.isArray(messages) ? messages.join(', ') : String(messages);
              return `${field}: ${msg}`;
            })
            .join('; ');
          errorMessage = `Validation failed: ${validationErrors}`;
        }
        // Handle error object with status and error array
        else if (error.data.error) {
          const extracted = extractFromError(error.data.error);
          if (extracted) {
            errorMessage = extracted;
          }
        }
        // Handle error.data.message
        else if (error.data.message) {
          errorMessage = error.data.message;
        }
        // Handle error.data.detail
        else if (error.data.detail) {
          errorMessage = error.data.detail;
        }
        // Try to extract from error.data itself
        else {
          const extracted = extractFromError(error.data);
          if (extracted && extracted !== '{}') {
            errorMessage = extracted;
          }
        }
      }
      // Check error.error directly (alternative structure)
      else if (error?.error) {
        const extracted = extractFromError(error.error);
        if (extracted) {
          errorMessage = extracted;
        }
      }
      // Check error.message
      else if (typeof error?.message === 'string') {
        errorMessage = error.message;
      }
      
      // Handle 401 authentication errors specifically
      if (error?.status === 401 || error?.data?.status === 401) {
        errorMessage = 'Authentication required. Please ensure you are logged in as an admin and your session is valid. If the issue persists, please log out and log back in.';
      }
      
      // Handle 422 validation errors specifically
      if (error?.status === 422 || error?.data?.status === 422) {
        if (!errorMessage.includes('Validation failed') && !errorMessage.includes(':')) {
          const msg = error?.data?.message || error?.data?.error || 'Validation error: Please check the form fields and try again.';
          errorMessage = msg;
        }
      }
      
      // Handle 500 server errors
      if (error?.status === 500 || error?.data?.status === 500) {
        errorMessage = error?.data?.message || error?.data?.error || 'Server error. Please try again later.';
      }
      
      // Ensure we always have a string (never render an object)
      if (typeof errorMessage !== 'string' || errorMessage === '{}' || errorMessage === 'null') {
        errorMessage = `Failed to start KYB inquiry (Status: ${error?.status || 'unknown'})`;
      }
      
      setKybError(errorMessage);
      setSnackbarMessage(errorMessage);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  }

  return (
    <FusePageSimple
      header={
        <Box sx={{ px: { xs: 2, md: 4 }, py: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>KYC Approvals</Typography>
          <Typography color="text.secondary">Review vendor submissions</Typography>
        </Box>
      }
      content={
        <Box sx={{ p: { xs: 2, md: 3 } }}>
          <Card>
            <CardHeader title="Pending Submissions" />
            <CardContent>
              {isLoading && (
                <Stack alignItems="center" sx={{ py: 6 }}>
                  <CircularProgress />
                </Stack>
              )}
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {(() => {
                    const e = error as any;
                    const code = e?.status;
                    const msg = e?.data?.message || e?.data?.error || 'Failed to load submissions';
                    if (code === 403) {
                      return 'Forbidden (403): This page requires an admin account. Please log in as an admin.';
                    }
                    if (code === 401) {
                      return 'Unauthorized (401): Please log in.';
                    }
                    return `${msg}`;
                  })()}
                </Alert>
              )}
              {!isLoading && !error && submissions.length === 0 && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  No pending submissions. Ask a vendor to submit their KYC, or remove the status filter to see others.
                </Alert>
              )}
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>Vendor</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Submitted At</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {submissions.map((s: any) => (
                      <TableRow key={s.id} hover>
                        <TableCell>{s.id}</TableCell>
                        <TableCell>{s.vendor_name}</TableCell>
                        <TableCell>{s.status}</TableCell>
                        <TableCell>{new Date(s.submitted_at).toLocaleString()}</TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Button size="small" variant="text" onClick={() => { setKybVendor({ id: s.vendor_id, name: s.vendor_name }); setKybName(s.vendor_name || ''); setKybEmail(''); setKybError(null); setKybOpen(true); }}>
                              Start KYB
                            </Button>
                            <Button size="small" variant="outlined" onClick={() => setDocSubmissionId(s.id)}>
                              View Documents
                            </Button>
                            <Button size="small" variant="contained" color="success" onClick={() => onApprove(s.id)} disabled={approving}>
                              Approve
                            </Button>
                            <Button size="small" variant="outlined" color="error" onClick={() => onReject(s.id)} disabled={rejecting}>
                              Reject
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Dialog open={docSubmissionId != null} onClose={() => setDocSubmissionId(null)} maxWidth="md" fullWidth>
                <DialogTitle>Submission #{docSubmissionId} — Documents</DialogTitle>
                <DialogContent dividers>
                  {docsLoading && (
                    <Stack alignItems="center" sx={{ py: 4 }}>
                      <CircularProgress />
                    </Stack>
                  )}
                  {!docsLoading && (
                    <Grid container spacing={2}>
                      {(['id_front','id_back','business_license','bank_statement'] as const).map((key) => {
                        const item = (docsData?.data as any)?.[key];
                        if (!item) return null;
                        const isPdf = String(item.url).toLowerCase().endsWith('.pdf');
                        return (
                          <Grid item xs={12} sm={6} key={key}>
                            <Card variant="outlined" sx={{ borderRadius: 2 }}>
                              <CardHeader title={key.replace('_',' ').toUpperCase()} subheader={item.filename} />
                              <CardContent>
                                {isPdf ? (
                                  <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
                                    <object data={item.url} type="application/pdf" width="100%" height="360">
                                      <Typography sx={{ p: 2 }}>
                                        PDF preview not supported.{' '}
                                        <Button variant="outlined" href={item.url} target="_blank" rel="noopener">Open PDF</Button>
                                      </Typography>
                                    </object>
                                  </Box>
                                ) : (
                                  <Box component="img" src={item.url} alt={key} onClick={() => setLightboxSrc(item.url)} sx={{ width: '100%', height: 240, objectFit: 'cover', borderRadius: 1, cursor: 'zoom-in' }} />
                                )}
                              </CardContent>
                            </Card>
                          </Grid>
                        );
                      })}
                      {!docsData?.data && (
                        <Typography color="text.secondary">No documents uploaded.</Typography>
                      )}
                    </Grid>
                  )}
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => setDocSubmissionId(null)}>Close</Button>
                </DialogActions>
              </Dialog>

              {/* Image Lightbox */}
              <Dialog open={!!lightboxSrc} onClose={() => setLightboxSrc(null)} maxWidth="lg" fullWidth>
                <DialogTitle>
                  Image Preview
                </DialogTitle>
                <DialogContent dividers>
                  {lightboxSrc && (
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                      <Box component="img" src={lightboxSrc} alt="preview" sx={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }} />
                    </Box>
                  )}
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => setLightboxSrc(null)}>Close</Button>
                </DialogActions>
              </Dialog>

              {/* Start KYB Dialog */}
              <Dialog open={kybOpen} onClose={() => { if (!startingKyb) { setKybOpen(false); setKybError(null); setKybVendor(null); setKybName(''); setKybEmail(''); } }} maxWidth="sm" fullWidth>
                <DialogTitle>Start KYB for {kybVendor?.name || 'Vendor'}</DialogTitle>
                <DialogContent dividers>
                  <Stack spacing={2}>
                    {kybError && (
                      <Alert severity="error" onClose={() => setKybError(null)}>
                        {kybError}
                      </Alert>
                    )}
                    <TextField label="Reference ID (vendor_id)" value={kybVendor?.id ?? ''} InputProps={{ readOnly: true }} />
                    <TextField label="Business/Contact Name (optional)" value={kybName} onChange={(e) => setKybName(e.target.value)} disabled={startingKyb} />
                    <TextField label="Email (optional)" type="email" value={kybEmail} onChange={(e) => setKybEmail(e.target.value)} disabled={startingKyb} />
                  </Stack>
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => { setKybOpen(false); setKybError(null); setKybVendor(null); setKybName(''); setKybEmail(''); }} disabled={startingKyb}>Cancel</Button>
                  <Button variant="contained" onClick={onStartKyb} disabled={startingKyb || !kybVendor}>
                    {startingKyb ? <CircularProgress size={20} /> : 'Start'}
                  </Button>
                </DialogActions>
              </Dialog>

              {/* Snackbar for notifications */}
              <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={() => setSnackbarOpen(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              >
                <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
                  {snackbarMessage}
                </Alert>
              </Snackbar>
            </CardContent>
          </Card>
        </Box>
      }
    />
  );
}

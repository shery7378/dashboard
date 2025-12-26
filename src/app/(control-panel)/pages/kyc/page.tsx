'use client';

import FusePageSimple from '@fuse/core/FusePageSimple';
import { Box, Button, Card, CardContent, CardHeader, Stack, Typography, Alert, Grid, Divider, Chip, IconButton, Tooltip, CircularProgress, Stepper, Step, StepLabel, Avatar, List, ListItem, ListItemIcon, ListItemText, Snackbar, Skeleton } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import UploadIcon from '@mui/icons-material/Upload';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import DoneAllRoundedIcon from '@mui/icons-material/DoneAllRounded';
import ImageRoundedIcon from '@mui/icons-material/ImageRounded';
import { useGetKycStatusQuery, useUploadDocumentMutation, useSubmitKycMutation } from './apis/KycApi';

export default function VendorKycPage() {
  const { data, refetch, isFetching } = useGetKycStatusQuery();
  const [uploadDocument, { isLoading: uploading }] = useUploadDocumentMutation();
  const [submitKyc, { isLoading: submitting }] = useSubmitKycMutation();
  const status = data?.data?.status ?? 'not_submitted';
  const serverUploads = (data?.data as any)?.uploads || {};
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  useEffect(() => {
    if (error || success) setSnackbarOpen(true);
  }, [error, success]);
  const closeSnackbar = () => setSnackbarOpen(false);
  const [idFrontPreview, setIdFrontPreview] = useState<string | null>(null);
  const [idBackPreview, setIdBackPreview] = useState<string | null>(null);
  const [licensePreview, setLicensePreview] = useState<string | null>(null);
  const [bankPreview, setBankPreview] = useState<string | null>(null);
  const [uploadingType, setUploadingType] = useState<null | 'id_front' | 'id_back' | 'business_license' | 'bank_statement'>(null);

  useEffect(() => {
    if (!idFrontPreview && serverUploads?.id_front?.url) setIdFrontPreview(serverUploads.id_front.url);
    if (!idBackPreview && serverUploads?.id_back?.url) setIdBackPreview(serverUploads.id_back.url);
    if (!licensePreview && serverUploads?.business_license?.url) setLicensePreview(serverUploads.business_license.url);
    if (!bankPreview && serverUploads?.bank_statement?.url) setBankPreview(serverUploads.bank_statement.url);
  }, [serverUploads, idFrontPreview, idBackPreview, licensePreview, bankPreview]);

  async function onUpload(type: 'id' | 'id_front' | 'id_back' | 'business_license' | 'bank_statement', file?: File) {
    setError(null);
    setSuccess(null);
    if (!file) return;
    setUploadingType(type as any);
    const localUrl = URL.createObjectURL(file);
    if (type === 'id_front') setIdFrontPreview(localUrl);
    if (type === 'id_back') setIdBackPreview(localUrl);
    if (type === 'business_license') setLicensePreview(localUrl);
    if (type === 'bank_statement') setBankPreview(localUrl);
    const res = await uploadDocument({ type, file });
    if ('error' in res) {
      const err: any = (res as any).error;
      const msg = err?.data?.message || err?.data?.error || err?.error || 'Upload failed';
      setError(msg);
    } else {
      setSuccess('Uploaded');
      refetch();
    }
    setUploadingType(null);
  }

  function clearPreview(type: 'id_front' | 'id_back' | 'business_license' | 'bank_statement') {
    if (type === 'id_front') setIdFrontPreview(null);
    if (type === 'id_back') setIdBackPreview(null);
    if (type === 'business_license') setLicensePreview(null);
    if (type === 'bank_statement') setBankPreview(null);
  }

  function onDropFactory(type: 'id_front' | 'id_back' | 'business_license' | 'bank_statement') {
    return (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (file) onUpload(type, file);
    };
  }

  const idReady = Boolean(idFrontPreview) && Boolean(idBackPreview);
  const docsReady = Boolean(licensePreview) || Boolean(bankPreview);
  const activeStep = useMemo(() => {
    if (!idReady) return 0;
    if (!docsReady) return 1;
    return 2;
  }, [idReady, docsReady]);

  async function onSubmit() {
    setError(null);
    setSuccess(null);
    const res = await submitKyc({});
    if ('error' in res) {
      const err: any = (res as any).error;
      const msg = err?.data?.message || err?.data?.error || err?.error || 'Submit failed';
      setError(msg);
    } else {
      setSuccess('Submitted');
      refetch();
    }
  }

  return (<>
    <FusePageSimple
      header={
        <Box sx={{
          px: { xs: 2, md: 4 },
          py: 3,
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          background: 'radial-gradient(1200px 500px at -10% -40%, rgba(124,58,237,0.6), transparent), radial-gradient(1200px 500px at 110% 140%, rgba(14,165,233,0.6), transparent), linear-gradient(135deg, #0ea5e9 0%, #7c3aed 100%)'
        }}>
          <Box sx={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            '&:before, &:after': {
              content: '""', position: 'absolute', width: 220, height: 220, borderRadius: '50%', filter: 'blur(40px)', opacity: 0.35,
            },
            '&:before': { background: '#ffffff', top: -40, left: -40, animation: 'float1 12s ease-in-out infinite' },
            '&:after': { background: '#facc15', bottom: -40, right: -40, animation: 'float2 14s ease-in-out infinite' },
            '@keyframes float1': { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(10px)' } },
            '@keyframes float2': { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
          }} />
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={7}>
              <Typography variant="h3" sx={{
                fontWeight: 900,
                letterSpacing: 0.3,
                lineHeight: 1.1,
                background: 'linear-gradient(90deg, #ffffff 0%, #fbcfe8 40%, #a5b4fc 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>KYC Verification</Typography>
              <Typography sx={{ opacity: 0.95, mt: 0.75, fontSize: 16 }}>Securely verify your identity with a modern, streamlined flow.</Typography>
            </Grid>
            <Grid item md={5} sx={{ display: { xs: 'none', md: 'block' } }}>
              <Box component="img" src="/material-ui-static/brand.png" alt="KYC" sx={{ width: '100%', maxWidth: 360, ml: 'auto', opacity: 0.9 }} />
            </Grid>
          </Grid>
          <Box sx={{ mt: 2, maxWidth: 900 }}>
            <Stack direction="row" alignItems="center" spacing={2} sx={{
              '& .dot': { width: 10, height: 10, borderRadius: '50%' },
              '& .label': { color: 'rgba(255,255,255,0.95)' },
            }}>
              {[ 'Upload ID', 'Supporting Docs', 'Review & Submit' ].map((label, idx) => {
                const completed = (status === 'approved') || (idx < activeStep);
                const current = (status !== 'approved') && (idx === activeStep);
                const color = completed ? '#22c55e' : current ? '#ffffff' : 'rgba(255,255,255,0.55)';
                return (
                  <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                    <Box className="dot" sx={{ bgcolor: color }} />
                    <Typography variant="caption" className="label">{label}</Typography>
                    {idx < 2 && <Box sx={{ flex: 1, height: 2, mx: 1, bgcolor: 'rgba(255,255,255,0.35)' }} />}
                  </Box>
                );
              })}
            </Stack>
          </Box>
        </Box>
      }
      content={
        <Box sx={{
          p: { xs: 2, md: 4 },
          background: 'linear-gradient(180deg, rgba(2,6,23,0.02), rgba(2,6,23,0))',
        }}>
          <Stack spacing={2}>
            <Alert severity={status === 'approved' ? 'success' : status === 'rejected' ? 'error' : status === 'pending' ? 'info' : 'warning'}>
              Status: {status}
            </Alert>

            <Grid container spacing={3}>
              <Grid item xs={12} md={7}>
                <Card variant="outlined" sx={{
                  borderRadius: 4,
                  borderColor: 'divider',
                  background: 'rgba(255,255,255,0.6)',
                  backdropFilter: 'saturate(1.2) blur(6px)',
                  transition: 'box-shadow .2s ease, transform .2s ease',
                  '&:hover': { boxShadow: 6, transform: 'translateY(-2px)' },
                }}>
                  <CardHeader title={<Stack direction="row" spacing={1} alignItems="center"><Avatar sx={{ bgcolor: 'primary.main', width: 28, height: 28 }}><BadgeRoundedIcon sx={{ fontSize: 18 }} /></Avatar><Typography variant="subtitle1" fontWeight={700}>Government ID</Typography></Stack>} subheader="Upload both front and back sides" />
                  <CardContent>
                    {isFetching && (
                      <Stack spacing={2} sx={{ mb: 2 }}>
                        <Skeleton variant="rectangular" height={180} sx={{ borderRadius: 2 }} />
                        <Skeleton variant="rectangular" height={180} sx={{ borderRadius: 2 }} />
                      </Stack>
                    )}
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Stack spacing={1.5} alignItems="stretch">
                          <Box sx={{
                            border: '1px dashed',
                            borderColor: 'divider',
                            borderRadius: 3,
                            p: 2,
                            minHeight: 220,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: 'background.paper',
                            position: 'relative',
                            overflow: 'hidden',
                            backgroundImage: 'linear-gradient(#fff,#fff), linear-gradient(135deg, rgba(59,130,246,0.6), rgba(139,92,246,0.6))',
                            backgroundOrigin: 'border-box',
                            backgroundClip: 'padding-box, border-box',
                            borderWidth: '1px',
                            borderStyle: 'solid',
                            borderColor: 'transparent',
                            transition: 'transform .15s ease',
                            '&:hover': { transform: 'translateY(-2px)' },
                          }} onDragOver={(e)=>e.preventDefault()} onDrop={onDropFactory('id_front')}>
                            {idFrontPreview ? (
                              <>
                                <img src={idFrontPreview} alt="ID front preview" style={{ width: '100%', height: 200, borderRadius: 14, objectFit: 'cover' }} />
                                <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 1 }}>
                                  <Tooltip title="Remove">
                                    <IconButton size="small" color="inherit" onClick={() => clearPreview('id_front')} sx={{ bgcolor: 'rgba(0,0,0,0.4)', color: 'white' }}>
                                      <DeleteOutlineIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </>
                            ) : (
                              <Stack spacing={1.25} alignItems="center">
                                {uploadingType === 'id_front' ? <CircularProgress size={32} /> : <UploadIcon sx={{ fontSize: 40 }} color="action" />}
                                <Typography color="text.secondary" sx={{ fontSize: 14, fontWeight: 600 }}>Drag & drop front side here</Typography>
                                <Typography color="text.secondary" sx={{ fontSize: 12, opacity: 0.9 }}>PNG, JPG or PDF up to 10MB</Typography>
                              </Stack>
                            )}
                          </Box>
                          <Button component="label" variant="contained" disabled={uploadingType !== null} startIcon={<UploadIcon />} sx={{ textTransform: 'none', fontWeight: 700, py: 1.25, backgroundImage: 'linear-gradient(90deg,#2563eb,#7c3aed)', boxShadow: '0 6px 18px rgba(124,58,237,0.35)' }}>
                            Upload ID Front
                            <input hidden type="file" accept="image/*" onChange={(e) => onUpload('id_front', e.target.files?.[0])} />
                          </Button>
                        </Stack>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Stack spacing={1.5} alignItems="stretch">
                          <Box sx={{
                            border: '1px dashed',
                            borderColor: 'divider',
                            borderRadius: 3,
                            p: 2,
                            minHeight: 220,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: 'background.paper',
                            position: 'relative',
                            overflow: 'hidden',
                            backgroundImage: 'linear-gradient(#fff,#fff), linear-gradient(135deg, rgba(59,130,246,0.6), rgba(139,92,246,0.6))',
                            backgroundOrigin: 'border-box',
                            backgroundClip: 'padding-box, border-box',
                            borderWidth: '1px',
                            borderStyle: 'solid',
                            borderColor: 'transparent',
                            transition: 'transform .15s ease',
                            '&:hover': { transform: 'translateY(-2px)' },
                          }} onDragOver={(e)=>e.preventDefault()} onDrop={onDropFactory('id_back')}>
                            {idBackPreview ? (
                              <>
                                <img src={idBackPreview} alt="ID back preview" style={{ width: '100%', height: 200, borderRadius: 14, objectFit: 'cover' }} />
                                <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 1 }}>
                                  <Tooltip title="Remove">
                                    <IconButton size="small" color="inherit" onClick={() => clearPreview('id_back')} sx={{ bgcolor: 'rgba(0,0,0,0.4)', color: 'white' }}>
                                      <DeleteOutlineIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </>
                            ) : (
                              <Stack spacing={1.25} alignItems="center">
                                {uploadingType === 'id_back' ? <CircularProgress size={32} /> : <UploadIcon sx={{ fontSize: 40 }} color="action" />}
                                <Typography color="text.secondary" sx={{ fontSize: 14, fontWeight: 600 }}>Drag & drop back side here</Typography>
                                <Typography color="text.secondary" sx={{ fontSize: 12, opacity: 0.9 }}>PNG, JPG or PDF up to 10MB</Typography>
                              </Stack>
                            )}
                          </Box>
                          <Button component="label" variant="contained" disabled={uploadingType !== null} startIcon={<UploadIcon />} sx={{ textTransform: 'none', fontWeight: 700, py: 1.25, backgroundImage: 'linear-gradient(90deg,#2563eb,#7c3aed)', boxShadow: '0 6px 18px rgba(124,58,237,0.35)' }}>
                            Upload ID Back
                            <input hidden type="file" accept="image/*" onChange={(e) => onUpload('id_back', e.target.files?.[0])} />
                          </Button>
                        </Stack>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                <Box sx={{ my: 2 }} />

                <Card variant="outlined" sx={{
                  borderRadius: 4,
                  borderColor: 'divider',
                  background: 'rgba(255,255,255,0.6)',
                  backdropFilter: 'saturate(1.2) blur(6px)',
                  transition: 'box-shadow .2s ease, transform .2s ease',
                  '&:hover': { boxShadow: 6, transform: 'translateY(-2px)' },
                }}>
                  <CardHeader title={<Stack direction="row" spacing={1} alignItems="center"><Avatar sx={{ bgcolor: 'secondary.main', width: 28, height: 28 }}><DescriptionRoundedIcon sx={{ fontSize: 18 }} /></Avatar><Typography variant="subtitle1" fontWeight={700}>Supporting Documents</Typography></Stack>} subheader="Optional but may speed up verification" />
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Stack spacing={1.5}>
                          <Box sx={{
                            border: '1px dashed',
                            borderColor: 'divider',
                            borderRadius: 3,
                            p: 2,
                            minHeight: 200,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: 'background.paper',
                            position: 'relative',
                            overflow: 'hidden',
                            backgroundImage: 'linear-gradient(#fff,#fff), linear-gradient(135deg, rgba(59,130,246,0.6), rgba(139,92,246,0.6))',
                            backgroundOrigin: 'border-box',
                            backgroundClip: 'padding-box, border-box',
                            borderWidth: '1px',
                            borderStyle: 'solid',
                            borderColor: 'transparent',
                            transition: 'transform .15s ease',
                            '&:hover': { transform: 'translateY(-2px)' },
                          }} onDragOver={(e)=>e.preventDefault()} onDrop={onDropFactory('business_license')}>
                            {licensePreview ? (
                              <>
                                <img src={licensePreview} alt="Business license preview" style={{ width: '100%', height: 180, borderRadius: 14, objectFit: 'cover' }} />
                                <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                                  <Tooltip title="Remove">
                                    <IconButton size="small" color="inherit" onClick={() => clearPreview('business_license')} sx={{ bgcolor: 'rgba(0,0,0,0.4)', color: 'white' }}>
                                      <DeleteOutlineIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </>
                            ) : (
                              <Stack spacing={1.25} alignItems="center">
                                {uploadingType === 'business_license' ? <CircularProgress size={32} /> : <UploadIcon sx={{ fontSize: 40 }} color="action" />}
                                <Typography color="text.secondary" sx={{ fontSize: 14, fontWeight: 600 }}>Drag & drop business license</Typography>
                              </Stack>
                            )}
                          </Box>
                          <Button component="label" variant="outlined" disabled={uploadingType !== null} startIcon={<UploadIcon />} sx={{ textTransform: 'none', fontWeight: 700, py: 1.1 }}>
                            Upload Business License
                            <input hidden type="file" accept="image/*,application/pdf" onChange={(e) => onUpload('business_license', e.target.files?.[0])} />
                          </Button>
                        </Stack>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Stack spacing={1.5}>
                          <Box sx={{
                            border: '1px dashed',
                            borderColor: 'divider',
                            borderRadius: 3,
                            p: 2,
                            minHeight: 200,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: 'background.paper',
                            position: 'relative',
                            overflow: 'hidden',
                            backgroundImage: 'linear-gradient(#fff,#fff), linear-gradient(135deg, rgba(59,130,246,0.6), rgba(139,92,246,0.6))',
                            backgroundOrigin: 'border-box',
                            backgroundClip: 'padding-box, border-box',
                            borderWidth: '1px',
                            borderStyle: 'solid',
                            borderColor: 'transparent',
                            transition: 'transform .15s ease',
                            '&:hover': { transform: 'translateY(-2px)' },
                          }} onDragOver={(e)=>e.preventDefault()} onDrop={onDropFactory('bank_statement')}>
                            {bankPreview ? (
                              <>
                                <img src={bankPreview} alt="Bank statement preview" style={{ width: '100%', height: 180, borderRadius: 14, objectFit: 'cover' }} />
                                <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                                  <Tooltip title="Remove">
                                    <IconButton size="small" color="inherit" onClick={() => clearPreview('bank_statement')} sx={{ bgcolor: 'rgba(0,0,0,0.4)', color: 'white' }}>
                                      <DeleteOutlineIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </>
                            ) : (
                              <Stack spacing={1.25} alignItems="center">
                                {uploadingType === 'bank_statement' ? <CircularProgress size={32} /> : <UploadIcon sx={{ fontSize: 40 }} color="action" />}
                                <Typography color="text.secondary" sx={{ fontSize: 14, fontWeight: 600 }}>Drag & drop bank statement</Typography>
                              </Stack>
                            )}
                          </Box>
                          <Button component="label" variant="outlined" disabled={uploadingType !== null} startIcon={<UploadIcon />} sx={{ textTransform: 'none', fontWeight: 700, py: 1.1 }}>
                            Upload Bank Statement
                            <input hidden type="file" accept="image/*,application/pdf" onChange={(e) => onUpload('bank_statement', e.target.files?.[0])} />
                          </Button>
                        </Stack>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={5}>
                <Card variant="outlined" sx={{ borderRadius: 4, position: 'sticky', top: 16, background: 'rgba(255,255,255,0.8)', backdropFilter: 'saturate(1.2) blur(6px)', boxShadow: 4 }}>
                  <CardHeader title={<Stack direction="row" spacing={1} alignItems="center"><Avatar sx={{ bgcolor: 'success.main', width: 28, height: 28 }}><CheckCircleRoundedIcon sx={{ fontSize: 18 }} /></Avatar><Typography variant="subtitle1" fontWeight={700}>Verification Summary</Typography></Stack>} />
                  <CardContent>
                    <Stack spacing={2}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip icon={<CheckCircleRoundedIcon />} label={`Status: ${status}`} color={status === 'approved' ? 'success' : status === 'rejected' ? 'error' : status === 'pending' ? 'info' : 'warning'} variant={status === 'pending' ? 'filled' : 'outlined'} sx={{ fontWeight: 700 }} />
                      </Stack>
                      <Divider />
                      <List dense>
                        <ListItem>
                          <ListItemIcon><ImageRoundedIcon color="primary" /></ListItemIcon>
                          <ListItemText primary="Use a clear, well-lit photo" secondary="Avoid glare and crop to include all corners" />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon><BadgeRoundedIcon color="secondary" /></ListItemIcon>
                          <ListItemText primary="Both sides of your ID" secondary="Front and back must be readable" />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon><DoneAllRoundedIcon color="success" /></ListItemIcon>
                          <ListItemText primary="Faster approval" secondary="Add supporting documents to speed things up" />
                        </ListItem>
                      </List>
                      <Button variant="contained" color="primary" onClick={onSubmit} disabled={submitting || status === 'pending' || !idReady} startIcon={<SendRoundedIcon />} sx={{ textTransform: 'none', fontWeight: 800, py: 1.2, backgroundImage: 'linear-gradient(90deg,#10b981,#22c55e)', boxShadow: '0 6px 18px rgba(34,197,94,0.35)' }}>
                        Submit for Approval
                      </Button>
                      {!idReady && (
                        <Typography variant="caption" color="text.secondary">Upload both front and back of your ID to enable submission.</Typography>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Stack>
        </Box>
      }
    />
  </>);
}

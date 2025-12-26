
"use client";

import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  TextField,
  Button,
  Typography,
  Grid,
  InputAdornment,
  Alert,
  FormControlLabel,
  Checkbox,
  Switch,
  Box,
  Container,
  Stack,
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Avatar,
  Snackbar,
  Divider,
  Paper,
} from "@mui/material";

import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import RestartAltOutlinedIcon from "@mui/icons-material/RestartAltOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import SmsOutlinedIcon from "@mui/icons-material/SmsOutlined";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";

// your API imports...
import {
  useUpdateAdminNotificationProviderSettingsMutation,
  useGetAdminNotificationProviderSettingsQuery,
  useSendNotificationTestMutation,
} from "./NotificationsProviderAdminApi";

/* -------------------------------------------------------------------------- */
/* TYPES */
/* -------------------------------------------------------------------------- */

type SMTPFormType = {
  mail_mailer: string;
  mail_scheme: string;
  mail_host: string;
  mail_port: string;
  mail_username: string;
  mail_password: string;
  mail_from_address: string;
  mail_from_name: string;
};

type SMSFormType = {
  twilio_sid: string;
  twilio_auth_token: string;
  twilio_from: string;
  twilio_active: boolean;
};

/* -------------------------------------------------------------------------- */
/* COMPONENT */
/* -------------------------------------------------------------------------- */

export default function NotificationSettingsPage() {
  /* ---------------------------- FORM INITIALIZATION --------------------------- */
  const {
    control: smtpControl,
    handleSubmit: handleSMTPSubmit,
    reset: resetSMTP,
  } = useForm<SMTPFormType>({
    defaultValues: {
      mail_mailer: "",
      mail_scheme: "",
      mail_host: "",
      mail_port: "",
      mail_username: "",
      mail_password: "",
      mail_from_address: "",
      mail_from_name: "",
    },
  });

  const {
    control: smsControl,
    handleSubmit: handleSMSSubmit,
    reset: resetSMS,
  } = useForm<SMSFormType>({
    defaultValues: {
      twilio_sid: "",
      twilio_auth_token: "",
      twilio_from: "",
      twilio_active: false,
    },
  });

  /* ----------------------------------- STATE ---------------------------------- */
  const [globalEmailEnabled, setGlobalEmailEnabled] = useState(true);
  const [globalSMSEnabled, setGlobalSMSEnabled] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [testEmailAddress, setTestEmailAddress] = useState<string>("");
  const [testPhoneNumber, setTestPhoneNumber] = useState<string>("");

  const [updateSettings, { isLoading }] =
    useUpdateAdminNotificationProviderSettingsMutation();

  const [sendNotificationTestEmail, { isLoading: sendingEmail }] = useSendNotificationTestMutation();
  const [sendNotificationTestSMS, { isLoading: sendingSMS }] = useSendNotificationTestMutation();

  const {
    data: providerData,
    isFetching: isFetchingProvider,
    isError: isProviderError,
    error: providerError,
    refetch,
  } = useGetAdminNotificationProviderSettingsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  /* ---------------------------- FETCH PREFILL VALUES --------------------------- */
  useEffect(() => {
    const d = providerData?.data;
    if (!d) return;

    resetSMTP({
      mail_mailer: d.mail_mailer ?? "",
      mail_scheme: d.mail_scheme ?? "",
      mail_host: d.mail_host ?? "",
      mail_port: d.mail_port ? String(d.mail_port) : "",
      mail_username: d.mail_username ?? "",
      mail_password: d.mail_password ?? "",
      mail_from_address: d.mail_from_address ?? "",
      mail_from_name: d.mail_from_name ?? "",
    });

    resetSMS({
      twilio_sid: d.sms_api_key ?? "",
      twilio_auth_token: d.sms_api_secret ?? "",
      twilio_from: d.sms_sender_id ?? "",
      twilio_active: d.sms_provider === "twilio",
    });
  }, [providerData]);

  /* ------------------------------ ERROR HANDLING ------------------------------ */
  useEffect(() => {
    if (isProviderError && providerError) {
      const anyErr = providerError as any;
      setError(anyErr?.data?.message || "Failed to load settings.");
    }
  }, [isProviderError, providerError]);

  /* ------------------------------- FORM SUBMITS ------------------------------- */
  const onSaveSMTP = async (form: SMTPFormType) => {
    try {
      const resp = await updateSettings(form).unwrap();
      setMessage("SMTP settings saved successfully!");
      await refetch();
    } catch {
      setError("Failed to save SMTP settings.");
    }
  };

  const onSaveSMS = async (form: SMSFormType) => {
    try {
      await updateSettings({
        sms_provider: form.twilio_active ? "twilio" : null,
        sms_api_key: form.twilio_sid || null,
        sms_api_secret: form.twilio_auth_token || null,
        sms_sender_id: form.twilio_from || null,
      }).unwrap();
      setMessage("Twilio SMS settings saved successfully!");
      await refetch();
    } catch {
      setError("Failed to save SMS settings.");
    }
  };

  const handleReload = async () => {
    try {
      await refetch();
      setMessage("Settings reloaded successfully.");
    } catch {
      setError("Failed to reload settings.");
    }
  };

  const handleSendTestEmail = async () => {
    if (!globalEmailEnabled) return;
    setError(null);
    try {
      const payload: { channel: 'email'; to?: string } = { channel: 'email' };
      if (testEmailAddress.trim()) {
        payload.to = testEmailAddress.trim();
      }
      const res = await sendNotificationTestEmail(payload).unwrap();
      setMessage(res?.message || "Test email sent successfully!");
    } catch (e: any) {
      setError(e?.data?.message || "Failed to send test email.");
    }
  };

  const handleSendTestSMS = async () => {
    if (!globalSMSEnabled) return;
    setError(null);
    try {
      const payload: { channel: 'sms'; to?: string } = { channel: 'sms' };
      if (testPhoneNumber.trim()) {
        payload.to = testPhoneNumber.trim();
      }
      const res = await sendNotificationTestSMS(payload).unwrap();
      setMessage(res?.message || "Test SMS sent successfully!");
    } catch (e: any) {
      setError(e?.data?.message || "Failed to send test SMS.");
    }
  };

  /* -------------------------------------------------------------------------- */
  /* UI START */
  /* -------------------------------------------------------------------------- */

  return (
    <>
      <Box
        sx={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          py: 6,
        }}
      >
        <Container maxWidth="lg">
          <Stack spacing={4}>
            {/* ---------------------------------------------------------------------- */}
            {/* HEADER */}
            {/* ---------------------------------------------------------------------- */}
            <Paper
              elevation={8}
              sx={{
                p: 5,
                textAlign: "center",
                borderRadius: 4,
                background: "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.9) 100%)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.3)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    boxShadow: "0 4px 20px rgba(102, 126, 234, 0.4)",
                  }}
                >
                  <SettingsOutlinedIcon sx={{ fontSize: 40 }} />
                </Avatar>
              </Box>
              <Typography
                variant="h3"
                fontWeight="bold"
                sx={{
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  mb: 1,
                }}
              >
                Notification Settings
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Configure and manage your email and SMS notification channels
              </Typography>
            </Paper>

            {/* ---------------------------------------------------------------------- */}
            {/* GLOBAL TOGGLES */}
            {/* ---------------------------------------------------------------------- */}
            <Card
              elevation={6}
              sx={{
                borderRadius: 4,
                overflow: "hidden",
                background: "rgba(255,255,255,0.95)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.3)",
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: "0 12px 40px rgba(0,0,0,0.15)",
                },
              }}
            >
              <CardHeader
                avatar={
                  <Avatar
                    sx={{
                      bgcolor: "primary.main",
                      width: 56,
                      height: 56,
                      boxShadow: "0 4px 12px rgba(25, 118, 210, 0.3)",
                    }}
                  >
                    <SettingsOutlinedIcon />
                  </Avatar>
                }
                title={
                  <Typography variant="h5" fontWeight={600}>
                    Global Notification Control
                  </Typography>
                }
                subheader={
                  <Typography variant="body2" color="text.secondary">
                    Enable or disable notification channels system-wide
                  </Typography>
                }
                sx={{ pb: 1 }}
              />

              <Divider />

              <CardContent sx={{ pt: 3 }}>
                <Grid container spacing={4}>
                  <Grid item xs={12} md={6}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 3,
                        borderRadius: 3,
                        background: globalEmailEnabled
                          ? "linear-gradient(135deg, rgba(25, 118, 210, 0.1) 0%, rgba(66, 165, 245, 0.1) 100%)"
                          : "rgba(0,0,0,0.02)",
                        border: `2px solid ${globalEmailEnabled ? "rgba(25, 118, 210, 0.3)" : "rgba(0,0,0,0.1)"}`,
                        transition: "all 0.3s",
                      }}
                    >
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar
                          sx={{
                            bgcolor: globalEmailEnabled ? "primary.main" : "grey.300",
                            width: 48,
                            height: 48,
                          }}
                        >
                          <EmailOutlinedIcon />
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" fontWeight={600}>
                            Email Notifications
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {globalEmailEnabled ? "Enabled" : "Disabled"}
                          </Typography>
                        </Box>
                        <Switch
                          checked={globalEmailEnabled}
                          onChange={(e) => setGlobalEmailEnabled(e.target.checked)}
                          color="primary"
                          size="medium"
                        />
                      </Stack>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 3,
                        borderRadius: 3,
                        background: globalSMSEnabled
                          ? "linear-gradient(135deg, rgba(33, 150, 243, 0.1) 0%, rgba(3, 169, 244, 0.1) 100%)"
                          : "rgba(0,0,0,0.02)",
                        border: `2px solid ${globalSMSEnabled ? "rgba(33, 150, 243, 0.3)" : "rgba(0,0,0,0.1)"}`,
                        transition: "all 0.3s",
                      }}
                    >
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar
                          sx={{
                            bgcolor: globalSMSEnabled ? "info.main" : "grey.300",
                            width: 48,
                            height: 48,
                          }}
                        >
                          <SmsOutlinedIcon />
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" fontWeight={600}>
                            SMS Notifications
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {globalSMSEnabled ? "Enabled" : "Disabled"}
                          </Typography>
                        </Box>
                        <Switch
                          checked={globalSMSEnabled}
                          onChange={(e) => setGlobalSMSEnabled(e.target.checked)}
                          color="info"
                          size="medium"
                        />
                      </Stack>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* ---------------------------------------------------------------------- */}
            {/* SMTP SETTINGS */}
            {/* ---------------------------------------------------------------------- */}
            <Card
              elevation={6}
              sx={{
                borderRadius: 4,
                overflow: "hidden",
                background: "rgba(255,255,255,0.95)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.3)",
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: "0 12px 40px rgba(0,0,0,0.15)",
                },
              }}
            >
              <CardHeader
                avatar={
                  <Avatar
                    sx={{
                      bgcolor: "secondary.main",
                      width: 56,
                      height: 56,
                      boxShadow: "0 4px 12px rgba(156, 39, 176, 0.3)",
                    }}
                  >
                    <EmailOutlinedIcon />
                  </Avatar>
                }
                title={
                  <Typography variant="h5" fontWeight={600}>
                    Email (SMTP) Configuration
                  </Typography>
                }
                subheader={
                  <Typography variant="body2" color="text.secondary">
                    Configure your SMTP provider settings for sending emails
                  </Typography>
                }
                sx={{ pb: 1 }}
              />

              <Divider />

              <form onSubmit={handleSMTPSubmit(onSaveSMTP)}>
                <CardContent sx={{ pt: 3 }}>
                  <Grid container spacing={3}>
                    {/* Server Configuration Section */}
                    <Grid item xs={12}>
                      <Typography
                        variant="subtitle2"
                        fontWeight={600}
                        color="text.secondary"
                        sx={{ mb: 2, textTransform: "uppercase", letterSpacing: 1 }}
                      >
                        Server Configuration
                      </Typography>
                    </Grid>
                    {[
                      ["mail_mailer", "Mailer", "smtp | log"],
                      ["mail_scheme", "Encryption", "tls"],
                      ["mail_host", "Host", "smtp.example.com"],
                      ["mail_port", "Port", "587"],
                    ].map(([name, label, placeholder], i) => (
                      <Grid item xs={12} md={6} key={i}>
                        <Controller
                          name={name as any}
                          control={smtpControl}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              label={label}
                              placeholder={placeholder}
                              fullWidth
                              variant="outlined"
                              sx={{
                                "& .MuiOutlinedInput-root": {
                                  borderRadius: 2,
                                  transition: "all 0.2s",
                                  "&:hover": {
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                                  },
                                },
                              }}
                            />
                          )}
                        />
                      </Grid>
                    ))}

                    {/* Authentication Section */}
                    <Grid item xs={12} sx={{ mt: 2 }}>
                      <Typography
                        variant="subtitle2"
                        fontWeight={600}
                        color="text.secondary"
                        sx={{ mb: 2, textTransform: "uppercase", letterSpacing: 1 }}
                      >
                        Authentication
                      </Typography>
                    </Grid>
                    {[
                      ["mail_username", "Username", "username"],
                      ["mail_password", "Password", "password", "password"],
                    ].map(([name, label, placeholder, type], i) => (
                      <Grid item xs={12} md={6} key={i}>
                        <Controller
                          name={name as any}
                          control={smtpControl}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              label={label}
                              type={type || "text"}
                              placeholder={placeholder}
                              fullWidth
                              variant="outlined"
                              sx={{
                                "& .MuiOutlinedInput-root": {
                                  borderRadius: 2,
                                  transition: "all 0.2s",
                                  "&:hover": {
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                                  },
                                },
                              }}
                            />
                          )}
                        />
                      </Grid>
                    ))}

                    {/* From Address Section */}
                    <Grid item xs={12} sx={{ mt: 2 }}>
                      <Typography
                        variant="subtitle2"
                        fontWeight={600}
                        color="text.secondary"
                        sx={{ mb: 2, textTransform: "uppercase", letterSpacing: 1 }}
                      >
                        From Address
                      </Typography>
                    </Grid>
                    {[
                      ["mail_from_address", "Email Address", "hello@example.com"],
                      ["mail_from_name", "Display Name", "My App"],
                    ].map(([name, label, placeholder], i) => (
                      <Grid item xs={12} md={6} key={i}>
                        <Controller
                          name={name as any}
                          control={smtpControl}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              label={label}
                              placeholder={placeholder}
                              fullWidth
                              variant="outlined"
                              sx={{
                                "& .MuiOutlinedInput-root": {
                                  borderRadius: 2,
                                  transition: "all 0.2s",
                                  "&:hover": {
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                                  },
                                },
                              }}
                            />
                          )}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>

                <Divider />

                <CardContent>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Test Email Address"
                        placeholder="Enter email address to test (optional)"
                        value={testEmailAddress}
                        onChange={(e) => setTestEmailAddress(e.target.value)}
                        fullWidth
                        variant="outlined"
                        type="email"
                        helperText={testEmailAddress ? `Email will be sent to: ${testEmailAddress}` : "If empty, email will be sent to your account email"}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                        <Button
                          variant="outlined"
                          startIcon={<SendOutlinedIcon />}
                          disabled={!globalEmailEnabled || sendingEmail}
                          onClick={handleSendTestEmail}
                          sx={{
                            borderRadius: 2,
                            px: 3,
                            textTransform: "none",
                            fontWeight: 600,
                            transition: "all 0.2s",
                            "&:hover": {
                              transform: "translateY(-2px)",
                              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                            },
                          }}
                        >
                          {sendingEmail ? "Sending…" : "Send Test Email"}
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>

                <Divider />

                <CardActions
                  sx={{
                    justifyContent: "flex-end",
                    p: 3,
                    gap: 2,
                    flexWrap: "wrap",
                  }}
                >

                  <Button
                    variant="outlined"
                    startIcon={<RestartAltOutlinedIcon />}
                    onClick={handleReload}
                    sx={{
                      borderRadius: 2,
                      px: 3,
                      textTransform: "none",
                      fontWeight: 600,
                      transition: "all 0.2s",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                      },
                    }}
                  >
                    Reload
                  </Button>

                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<SaveOutlinedIcon />}
                    disabled={isLoading}
                    sx={{
                      borderRadius: 2,
                      px: 4,
                      py: 1.5,
                      textTransform: "none",
                      fontWeight: 600,
                      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)",
                      transition: "all 0.2s",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        boxShadow: "0 6px 20px rgba(102, 126, 234, 0.5)",
                        background: "linear-gradient(135deg, #764ba2 0%, #667eea 100%)",
                      },
                    }}
                  >
                    {isLoading ? "Saving…" : "Save SMTP Settings"}
                  </Button>
                </CardActions>
              </form>
            </Card>

            {/* ---------------------------------------------------------------------- */}
            {/* SMS SETTINGS */}
            {/* ---------------------------------------------------------------------- */}
            <Card
              elevation={6}
              sx={{
                borderRadius: 4,
                overflow: "hidden",
                background: "rgba(255,255,255,0.95)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.3)",
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: "0 12px 40px rgba(0,0,0,0.15)",
                },
              }}
            >
              <CardHeader
                avatar={
                  <Avatar
                    sx={{
                      bgcolor: "info.main",
                      width: 56,
                      height: 56,
                      boxShadow: "0 4px 12px rgba(33, 150, 243, 0.3)",
                    }}
                  >
                    <SmsOutlinedIcon />
                  </Avatar>
                }
                title={
                  <Typography variant="h5" fontWeight={600}>
                    SMS (Twilio) Configuration
                  </Typography>
                }
                subheader={
                  <Typography variant="body2" color="text.secondary">
                    Configure Twilio SMS provider for sending text messages
                  </Typography>
                }
                sx={{ pb: 1 }}
              />

              <Divider />

              <form onSubmit={handleSMSSubmit(onSaveSMS)}>
                <CardContent sx={{ pt: 3 }}>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <Typography
                        variant="subtitle2"
                        fontWeight={600}
                        color="text.secondary"
                        sx={{ mb: 2, textTransform: "uppercase", letterSpacing: 1 }}
                      >
                        Twilio Credentials
                      </Typography>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Controller
                        name="twilio_sid"
                        control={smsControl}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="Account SID"
                            placeholder="Your Twilio Account SID"
                            fullWidth
                            variant="outlined"
                            sx={{
                              "& .MuiOutlinedInput-root": {
                                borderRadius: 2,
                                transition: "all 0.2s",
                                "&:hover": {
                                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                                },
                              },
                            }}
                          />
                        )}
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Controller
                        name="twilio_auth_token"
                        control={smsControl}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            type="password"
                            label="Auth Token"
                            placeholder="Your Twilio Auth Token"
                            fullWidth
                            variant="outlined"
                            sx={{
                              "& .MuiOutlinedInput-root": {
                                borderRadius: 2,
                                transition: "all 0.2s",
                                "&:hover": {
                                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                                },
                              },
                            }}
                          />
                        )}
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Controller
                        name="twilio_from"
                        control={smsControl}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="From Number"
                            placeholder="+1234567890"
                            fullWidth
                            variant="outlined"
                            helperText="Your Twilio phone number"
                            sx={{
                              "& .MuiOutlinedInput-root": {
                                borderRadius: 2,
                                transition: "all 0.2s",
                                "&:hover": {
                                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                                },
                              },
                            }}
                          />
                        )}
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 3,
                          borderRadius: 2,
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          background: "rgba(33, 150, 243, 0.05)",
                          border: "2px solid rgba(33, 150, 243, 0.2)",
                        }}
                      >
                        <Controller
                          name="twilio_active"
                          control={smsControl}
                          render={({ field }) => (
                            <FormControlLabel
                              label={
                                <Box>
                                  <Typography variant="body1" fontWeight={600}>
                                    Enable Twilio SMS
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Activate SMS notifications via Twilio
                                  </Typography>
                                </Box>
                              }
                              control={
                                <Checkbox
                                  {...field}
                                  checked={field.value}
                                  color="info"
                                  size="medium"
                                  sx={{ mr: 2 }}
                                />
                              }
                            />
                          )}
                        />
                      </Paper>
                    </Grid>
                  </Grid>
                </CardContent>

                <Divider />

                <CardContent>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Test Phone Number"
                        placeholder="Enter phone number to test (optional)"
                        value={testPhoneNumber}
                        onChange={(e) => setTestPhoneNumber(e.target.value)}
                        fullWidth
                        variant="outlined"
                        type="tel"
                        helperText={testPhoneNumber ? `SMS will be sent to: ${testPhoneNumber}` : "If empty, SMS will be sent to your account phone number"}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                        <Button
                          variant="outlined"
                          startIcon={<SendOutlinedIcon />}
                          disabled={!globalSMSEnabled || sendingSMS}
                          onClick={handleSendTestSMS}
                          sx={{
                            borderRadius: 2,
                            px: 3,
                            textTransform: "none",
                            fontWeight: 600,
                            transition: "all 0.2s",
                            "&:hover": {
                              transform: "translateY(-2px)",
                              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                            },
                          }}
                        >
                          {sendingSMS ? "Sending…" : "Send Test SMS"}
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>

                <Divider />

                <CardActions
                  sx={{
                    justifyContent: "flex-end",
                    p: 3,
                    gap: 2,
                    flexWrap: "wrap",
                  }}
                >

                  <Button
                    variant="outlined"
                    startIcon={<RestartAltOutlinedIcon />}
                    onClick={handleReload}
                    sx={{
                      borderRadius: 2,
                      px: 3,
                      textTransform: "none",
                      fontWeight: 600,
                      transition: "all 0.2s",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                      },
                    }}
                  >
                    Reload
                  </Button>

                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<SaveOutlinedIcon />}
                    disabled={isLoading}
                    sx={{
                      borderRadius: 2,
                      px: 4,
                      py: 1.5,
                      textTransform: "none",
                      fontWeight: 600,
                      background: "linear-gradient(135deg, #2196f3 0%, #03a9f4 100%)",
                      boxShadow: "0 4px 15px rgba(33, 150, 243, 0.4)",
                      transition: "all 0.2s",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        boxShadow: "0 6px 20px rgba(33, 150, 243, 0.5)",
                        background: "linear-gradient(135deg, #03a9f4 0%, #2196f3 100%)",
                      },
                    }}
                  >
                    {isLoading ? "Saving…" : "Save SMS Settings"}
                  </Button>
                </CardActions>
              </form>
            </Card>
          </Stack>
        </Container>
      </Box>

      {/* --------------------------- NOTIFICATION TOAST --------------------------- */}
      <Snackbar
        open={!!message}
        autoHideDuration={3000}
        onClose={() => setMessage(null)}
      >
        <Alert severity="success" variant="filled">
          {message}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!error}
        autoHideDuration={4000}
        onClose={() => setError(null)}
      >
        <Alert severity="error" variant="filled">
          {error}
        </Alert>
      </Snackbar>
    </>
  );
}

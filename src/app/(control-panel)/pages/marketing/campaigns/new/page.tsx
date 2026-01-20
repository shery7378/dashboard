"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/utils/api";
import { 
  Container, Grid, Typography, Paper, TextField, MenuItem, Divider, Stack, 
  Button, Alert, Box, Card, CardContent, Chip, IconButton, Tooltip, 
  FormHelperText, Collapse
} from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import InfoIcon from "@mui/icons-material/Info";
import PreviewIcon from "@mui/icons-material/Preview";
import CodeIcon from "@mui/icons-material/Code";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

const MAX_MESSAGE_LENGTH = 1000;
const MAX_TITLE_LENGTH = 200;
const MAX_NAME_LENGTH = 100;

export default function NewCampaignPage() {
  const r = useRouter();
  const [form, setForm] = useState<any>({
    name: "",
    channel: "in_app",
    title: "",
    message: "",
    target: "",
    scheduled_for: null,
    status: "draft",
  });
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showJsonHelper, setShowJsonHelper] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Validation
  function validateForm() {
    const errors: Record<string, string> = {};
    
    if (!form.name.trim()) {
      errors.name = "Campaign name is required";
    } else if (form.name.length > MAX_NAME_LENGTH) {
      errors.name = `Name must be less than ${MAX_NAME_LENGTH} characters`;
    }
    
    if (!form.title.trim()) {
      errors.title = "Title is required";
    } else if (form.title.length > MAX_TITLE_LENGTH) {
      errors.title = `Title must be less than ${MAX_TITLE_LENGTH} characters`;
    }
    
    if (!form.message.trim()) {
      errors.message = "Message is required";
    } else if (form.message.length > MAX_MESSAGE_LENGTH) {
      errors.message = `Message must be less than ${MAX_MESSAGE_LENGTH} characters`;
    }
    
    if (form.target && form.target.trim()) {
      try {
        JSON.parse(form.target);
        setJsonError(null);
      } catch (e) {
        errors.target = "Invalid JSON format. Please check your syntax.";
        setJsonError("Invalid JSON format");
      }
    } else {
      setJsonError(null);
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    
    if (!validateForm()) {
      setErr("Please fix the errors in the form before submitting.");
      return;
    }
    
    setSaving(true);
    try {
      const payload: any = { ...form };
      
      // Parse and validate JSON
      if (payload.target && payload.target.trim()) {
        try {
          payload.target = JSON.parse(payload.target);
        } catch {
          setErr("Target JSON is invalid. Please check the format.");
          setSaving(false);
          return;
        }
      } else {
        delete payload.target;
      }
      
      // Format date for API
      if (payload.scheduled_for) {
        payload.scheduled_for = payload.scheduled_for.toISOString();
      } else {
        delete payload.scheduled_for;
      }
      
      await apiFetch("/api/admin/campaigns", { method: "POST", body: JSON.stringify(payload) });
      r.push("/pages/marketing/campaigns");
    } catch (e: any) {
      setErr(e.message || "Failed to create campaign. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const channelLabels: Record<string, string> = {
    in_app: "In App",
    email: "Email",
    sms: "SMS",
    web_push: "Web Push"
  };

  const jsonExamples = {
    all: '{"segment":"all"}',
    segment: '{"segment":"vip_customers"}',
    filters: '{"segment":"all","filters":{"min_orders":3,"registered_after":"2024-01-01"}}'
  };

  function insertJsonExample(example: string) {
    setForm({ ...form, target: example });
    setJsonError(null);
    setFieldErrors({ ...fieldErrors, target: "" });
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" fontWeight={600} gutterBottom>
          Create New Campaign
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Set up a new marketing campaign to engage with your audience across different channels.
        </Typography>

        {err && <Alert severity="error" sx={{ mb: 3 }}>{err}</Alert>}

        <Grid container spacing={3}>
          {/* Main Form */}
          <Grid item xs={12} md={8}>
            <Paper component="form" onSubmit={submit} sx={{ p: 4 }}>
              {/* Basic Information Section */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 2 }}>
                  Basic Information
                </Typography>
                <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
                    <TextField 
                      fullWidth 
                      label="Campaign Name" 
                      placeholder="e.g., Winback Campaign, Summer Sale"
                      value={form.name}
                      onChange={e => {
                        setForm({ ...form, name: e.target.value });
                        if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: "" });
                      }}
                      required
                      error={!!fieldErrors.name}
                      helperText={fieldErrors.name || `${form.name.length}/${MAX_NAME_LENGTH} characters`}
                      inputProps={{ maxLength: MAX_NAME_LENGTH }}
                    />
          </Grid>
          <Grid item xs={12} md={6}>
                    <TextField 
                      select 
                      fullWidth 
                      label="Channel" 
                      value={form.channel} 
                      onChange={e => setForm({ ...form, channel: e.target.value })}
                      helperText="Select the communication channel for this campaign"
                    >
                      <MenuItem value="in_app">In App Notification</MenuItem>
              <MenuItem value="email">Email</MenuItem>
              <MenuItem value="sms">SMS</MenuItem>
              <MenuItem value="web_push">Web Push</MenuItem>
            </TextField>
          </Grid>
                </Grid>
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Campaign Content Section */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 2 }}>
                  Campaign Content
                </Typography>
                <Grid container spacing={3}>
          <Grid item xs={12}>
                    <TextField 
                      fullWidth 
                      label="Campaign Title" 
                      placeholder="e.g., We miss you! Special offer inside"
                      value={form.title}
                      onChange={e => {
                        setForm({ ...form, title: e.target.value });
                        if (fieldErrors.title) setFieldErrors({ ...fieldErrors, title: "" });
                      }}
                      required
                      error={!!fieldErrors.title}
                      helperText={fieldErrors.title || `${form.title.length}/${MAX_TITLE_LENGTH} characters`}
                      inputProps={{ maxLength: MAX_TITLE_LENGTH }}
                    />
          </Grid>
          <Grid item xs={12}>
                    <TextField 
                      fullWidth 
                      label="Message" 
                      placeholder="Enter your campaign message here. Be clear and engaging!"
                      value={form.message}
                      onChange={e => {
                        setForm({ ...form, message: e.target.value });
                        if (fieldErrors.message) setFieldErrors({ ...fieldErrors, message: "" });
                      }}
                      required
                      error={!!fieldErrors.message}
                      helperText={fieldErrors.message || `${form.message.length}/${MAX_MESSAGE_LENGTH} characters`}
                      multiline 
                      minRows={4}
                      maxRows={8}
                      inputProps={{ maxLength: MAX_MESSAGE_LENGTH }}
                    />
                  </Grid>
          </Grid>
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Targeting & Scheduling Section */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 2 }}>
                  Targeting & Scheduling
                </Typography>
                <Grid container spacing={3}>
          <Grid item xs={12}>
                    <Box>
                      <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                        <TextField 
                          fullWidth 
                          label="Target JSON (Optional)" 
                          placeholder='{"segment":"all"}'
                          value={form.target}
                          onChange={e => {
                            setForm({ ...form, target: e.target.value });
                            setJsonError(null);
                            if (fieldErrors.target) setFieldErrors({ ...fieldErrors, target: "" });
                          }}
                          error={!!jsonError || !!fieldErrors.target}
                          helperText={jsonError || fieldErrors.target || "Optional: Define targeting rules as JSON"}
                          multiline
                          minRows={3}
                          maxRows={6}
                          sx={{ fontFamily: "monospace" }}
                        />
                        <Tooltip title="Show JSON examples">
                          <IconButton 
                            onClick={() => setShowJsonHelper(!showJsonHelper)}
                            sx={{ ml: 1 }}
                          >
                            {showJsonHelper ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                        </Tooltip>
                      </Box>
                      <Collapse in={showJsonHelper}>
                        <Card variant="outlined" sx={{ mt: 1, mb: 2 }}>
                          <CardContent>
                            <Typography variant="subtitle2" gutterBottom>
                              <CodeIcon sx={{ verticalAlign: "middle", mr: 1 }} />
                              JSON Examples:
                            </Typography>
                            <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap", gap: 1 }}>
                              <Chip 
                                label="All Users" 
                                onClick={() => insertJsonExample(jsonExamples.all)}
                                size="small"
                                clickable
                              />
                              <Chip 
                                label="Segment" 
                                onClick={() => insertJsonExample(jsonExamples.segment)}
                                size="small"
                                clickable
                              />
                              <Chip 
                                label="With Filters" 
                                onClick={() => insertJsonExample(jsonExamples.filters)}
                                size="small"
                                clickable
                              />
                            </Stack>
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: "block" }}>
                              Click on an example to insert it into the field above.
                            </Typography>
                          </CardContent>
                        </Card>
                      </Collapse>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <DateTimePicker
                      label="Schedule Campaign (Optional)"
                      value={form.scheduled_for}
                      onChange={(newValue) => setForm({ ...form, scheduled_for: newValue })}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          helperText: "Leave empty to send immediately",
                          InputLabelProps: { shrink: true }
                        },
                        actionBar: {
                          actions: ['clear', 'today']
                        }
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Action Buttons */}
              <Stack direction="row" justifyContent="space-between" spacing={2}>
                <Button 
                  variant="outlined" 
                  onClick={() => r.push('/pages/marketing/campaigns')}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Stack direction="row" spacing={2}>
                  <Button
                    variant="outlined"
                    startIcon={<PreviewIcon />}
                    onClick={() => setShowPreview(!showPreview)}
                    disabled={saving}
                  >
                    {showPreview ? "Hide" : "Show"} Preview
                  </Button>
                  <Button 
                    type="submit" 
                    variant="contained" 
                    disabled={saving}
                    sx={{ minWidth: 150 }}
                  >
                    {saving ? 'Creating...' : 'Create Campaign'}
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          </Grid>

          {/* Preview Panel */}
          <Grid item xs={12} md={4}>
            <Collapse in={showPreview}>
              <Paper sx={{ p: 3, position: "sticky", top: 20 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: "flex", alignItems: "center" }}>
                  <PreviewIcon sx={{ mr: 1 }} />
                  Campaign Preview
                </Typography>
                <Divider sx={{ my: 2 }} />
                
                {form.name || form.title || form.message ? (
                  <Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary">Channel</Typography>
                      <Chip label={channelLabels[form.channel] || form.channel} size="small" sx={{ ml: 1 }} />
                    </Box>
                    
                    {form.title && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="text.secondary">Title</Typography>
                        <Typography variant="body1" fontWeight={600} sx={{ mt: 0.5 }}>
                          {form.title || "(No title)"}
                        </Typography>
                      </Box>
                    )}
                    
                    {form.message && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="text.secondary">Message</Typography>
                        <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: "pre-wrap" }}>
                          {form.message || "(No message)"}
                        </Typography>
                      </Box>
                    )}
                    
                    {form.scheduled_for && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="text.secondary">Scheduled For</Typography>
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                          {form.scheduled_for.toLocaleString()}
                        </Typography>
                      </Box>
                    )}
                    
                    {form.target && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">Targeting</Typography>
                        <Box sx={{ mt: 0.5, p: 1, bgcolor: "grey.100", borderRadius: 1, fontFamily: "monospace", fontSize: "0.75rem" }}>
                          {form.target}
                        </Box>
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Fill in the form to see a preview of your campaign.
                  </Typography>
                )}
              </Paper>
            </Collapse>
          </Grid>
        </Grid>
    </Container>
  );
}

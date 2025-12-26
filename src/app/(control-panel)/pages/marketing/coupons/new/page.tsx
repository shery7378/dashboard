"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/utils/api";
import { 
  Container, Grid, Typography, Paper, TextField, MenuItem, FormControlLabel, 
  Switch, Divider, Stack, Button, Alert, Accordion, AccordionSummary, 
  AccordionDetails, RadioGroup, Radio, FormLabel, Box, Chip, CircularProgress,
  List, ListItem, ListItemText, Typography as MuiTypography, InputAdornment, IconButton
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import RefreshIcon from "@mui/icons-material/Refresh";

export default function NewCouponPage() {
  const r = useRouter();
  const [form, setForm] = useState<any>({
    code: "",
    type: "percent",
    value: 10,
    max_uses: "",
    max_uses_per_user: "",
    min_order_total: "",
    starts_at: "",
    ends_at: "",
    is_active: true,
    assignment_method: "manual",
    assigned_users: [],
    criteria: {
      customers_only: true,
      activated_only: false,
      no_orders: false,
      min_orders: "",
      max_orders: "",
      min_spent: "",
      max_spent: "",
      registered_after: "",
      registered_before: "",
      inactive_for_days: "",
      role_id: "",
    },
  });
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState<{count: number; users: any[]} | null>(null);

  // Generate random coupon code
  function generateCouponCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const length = 8; // 8 characters code
    let code = '';
    
    // Generate random code
    for (let i = 0; i < length; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Update form with generated code
    setForm({ ...form, code });
  }

  async function previewUsers() {
    setPreviewLoading(true);
    setPreviewData(null);
    try {
      const criteria = { ...form.criteria };
      // Clean empty values
      Object.keys(criteria).forEach(k => {
        if (criteria[k] === "" || criteria[k] === null || criteria[k] === false) {
          delete criteria[k];
        }
      });
      const res = await apiFetch("/api/admin/coupons/preview-users", {
        method: "POST",
        body: JSON.stringify({ criteria }),
      });
      setPreviewData(res);
    } catch (e: any) {
      setErr("Failed to preview users: " + e.message);
    } finally {
      setPreviewLoading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    try {
      const payload: any = { ...form };
      ["max_uses","max_uses_per_user","min_order_total","value"].forEach(k => {
        if (payload[k] === "" || payload[k] === null) delete payload[k];
        else payload[k] = Number(payload[k]);
      });
      
      // Clean criteria
      if (payload.assignment_method === "criteria") {
        Object.keys(payload.criteria).forEach(k => {
          if (payload.criteria[k] === "" || payload.criteria[k] === null || payload.criteria[k] === false) {
            delete payload.criteria[k];
          } else if (typeof payload.criteria[k] === "string" && !isNaN(Number(payload.criteria[k]))) {
            payload.criteria[k] = Number(payload.criteria[k]);
          }
        });
      } else {
        delete payload.criteria;
        if (!payload.assigned_users || payload.assigned_users.length === 0) {
          delete payload.assigned_users;
        }
      }
      
      await apiFetch("/api/admin/coupons", { method: "POST", body: JSON.stringify(payload) });
      r.push("/pages/marketing/coupons");
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h5" fontWeight={600} gutterBottom>New Coupon</Typography>
      {err && <Alert sx={{ mb: 2 }} severity="error">{err}</Alert>}
      <Paper component="form" onSubmit={submit} sx={{ p: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField 
              fullWidth 
              label="Code" 
              placeholder="SAVE10" 
              value={form.code} 
              onChange={e=>setForm({ ...form, code: e.target.value })} 
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={generateCouponCode}
                      edge="end"
                      aria-label="generate coupon code"
                      title="Generate Code"
                    >
                      <RefreshIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              helperText="Click the refresh icon to generate a random code"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField select fullWidth label="Type" value={form.type} onChange={e=>setForm({ ...form, type: e.target.value })}>
              <MenuItem value="percent">Percent</MenuItem>
              <MenuItem value="fixed">Fixed</MenuItem>
              <MenuItem value="free_shipping">Free Shipping</MenuItem>
            </TextField>
          </Grid>

          {form.type !== "free_shipping" && (
            <Grid item xs={12} md={6}>
              <TextField fullWidth type="number" inputProps={{ step: "0.01" }} label="Value" placeholder="10" value={form.value}
                helperText={form.type === 'percent' ? 'Percent off subtotal' : 'Fixed amount off subtotal'}
                onChange={e=>setForm({ ...form, value: e.target.value })}
              />
            </Grid>
          )}
          <Grid item xs={12} md={6}>
            <TextField fullWidth type="number" label="Min Order Total" placeholder="50.00" value={form.min_order_total as any}
              onChange={e=>setForm({ ...form, min_order_total: e.target.value })} />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField fullWidth type="number" label="Max Uses (global)" value={form.max_uses as any}
              onChange={e=>setForm({ ...form, max_uses: e.target.value })} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth type="number" label="Max Uses per User" value={form.max_uses_per_user as any}
              onChange={e=>setForm({ ...form, max_uses_per_user: e.target.value })} />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField fullWidth type="datetime-local" label="Starts At" InputLabelProps={{ shrink: true }} value={form.starts_at as any}
              onChange={e=>setForm({ ...form, starts_at: e.target.value })} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth type="datetime-local" label="Ends At" InputLabelProps={{ shrink: true }} value={form.ends_at as any}
              onChange={e=>setForm({ ...form, ends_at: e.target.value })} />
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* User Assignment Section */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">User Assignment (Optional)</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={3}>
              <FormLabel>Assignment Method</FormLabel>
              <RadioGroup
                value={form.assignment_method}
                onChange={(e) => setForm({ ...form, assignment_method: e.target.value })}
              >
                <FormControlLabel value="manual" control={<Radio />} label="Manual Selection - Select specific users" />
                <FormControlLabel value="criteria" control={<Radio />} label="Rule-Based - Assign based on criteria" />
              </RadioGroup>

              {form.assignment_method === "manual" && (
                <Box>
                  <TextField
                    fullWidth
                    label="Select Users"
                    placeholder="Enter user emails or IDs (comma separated)"
                    helperText="Enter user emails separated by commas, or leave empty for public coupon"
                    value={Array.isArray(form.assigned_users) ? form.assigned_users.join(", ") : form.assigned_users || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      const users = value ? value.split(",").map(u => u.trim()).filter(u => u) : [];
                      setForm({ ...form, assigned_users: users });
                    }}
                  />
                  {Array.isArray(form.assigned_users) && form.assigned_users.length > 0 && (
                    <Box sx={{ mt: 1 }}>
                      {form.assigned_users.map((user: string, idx: number) => (
                        <Chip key={idx} label={user} onDelete={() => {
                          const newUsers = [...form.assigned_users];
                          newUsers.splice(idx, 1);
                          setForm({ ...form, assigned_users: newUsers });
                        }} sx={{ m: 0.5 }} />
                      ))}
                    </Box>
                  )}
                </Box>
              )}

              {form.assignment_method === "criteria" && (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <FormLabel>User Role</FormLabel>
                    <Stack spacing={1} sx={{ mt: 1 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={form.criteria.customers_only}
                            onChange={(e) => setForm({
                              ...form,
                              criteria: { ...form.criteria, customers_only: e.target.checked }
                            })}
                          />
                        }
                        label="Customers Only"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={form.criteria.activated_only}
                            onChange={(e) => setForm({
                              ...form,
                              criteria: { ...form.criteria, activated_only: e.target.checked }
                            })}
                          />
                        }
                        label="Activated Users Only"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={form.criteria.no_orders}
                            onChange={(e) => setForm({
                              ...form,
                              criteria: { ...form.criteria, no_orders: e.target.checked }
                            })}
                          />
                        }
                        label="Users with No Orders"
                      />
                    </Stack>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Min Orders"
                      value={form.criteria.min_orders}
                      onChange={(e) => setForm({
                        ...form,
                        criteria: { ...form.criteria, min_orders: e.target.value }
                      })}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      type="number"
                      label="Max Orders"
                      value={form.criteria.max_orders}
                      onChange={(e) => setForm({
                        ...form,
                        criteria: { ...form.criteria, max_orders: e.target.value }
                      })}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      type="number"
                      inputProps={{ step: "0.01" }}
                      label="Min Total Spent"
                      value={form.criteria.min_spent}
                      onChange={(e) => setForm({
                        ...form,
                        criteria: { ...form.criteria, min_spent: e.target.value }
                      })}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      type="number"
                      inputProps={{ step: "0.01" }}
                      label="Max Total Spent"
                      value={form.criteria.max_spent}
                      onChange={(e) => setForm({
                        ...form,
                        criteria: { ...form.criteria, max_spent: e.target.value }
                      })}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Registered After"
                      InputLabelProps={{ shrink: true }}
                      value={form.criteria.registered_after}
                      onChange={(e) => setForm({
                        ...form,
                        criteria: { ...form.criteria, registered_after: e.target.value }
                      })}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Registered Before"
                      InputLabelProps={{ shrink: true }}
                      value={form.criteria.registered_before}
                      onChange={(e) => setForm({
                        ...form,
                        criteria: { ...form.criteria, registered_before: e.target.value }
                      })}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Inactive For (Days)"
                      helperText="Users who haven't placed an order in X days"
                      value={form.criteria.inactive_for_days}
                      onChange={(e) => setForm({
                        ...form,
                        criteria: { ...form.criteria, inactive_for_days: e.target.value }
                      })}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Button
                      variant="outlined"
                      onClick={previewUsers}
                      disabled={previewLoading}
                      startIcon={previewLoading ? <CircularProgress size={16} /> : null}
                    >
                      {previewLoading ? "Loading..." : "Preview Matching Users"}
                    </Button>
                    {previewData && (
                      <Box sx={{ mt: 2 }}>
                        <Alert severity="info">
                          <strong>{previewData.count}</strong> users match the criteria
                        </Alert>
                        {previewData.count > 0 && (
                          <Paper sx={{ mt: 2, p: 2, maxHeight: 200, overflow: "auto" }}>
                            <MuiTypography variant="subtitle2" gutterBottom>Preview (first 10):</MuiTypography>
                            <List dense>
                              {previewData.users.map((user: any) => (
                                <ListItem key={user.id}>
                                  <ListItemText
                                    primary={`${user.first_name} ${user.last_name}`}
                                    secondary={user.email}
                                  />
                                </ListItem>
                              ))}
                            </List>
                            {previewData.count > 10 && (
                              <MuiTypography variant="caption" color="text.secondary">
                                ... and {previewData.count - 10} more users
                              </MuiTypography>
                            )}
                          </Paper>
                        )}
                      </Box>
                    )}
                  </Grid>
                </Grid>
              )}
            </Stack>
          </AccordionDetails>
        </Accordion>

        <Divider sx={{ my: 2 }} />
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <FormControlLabel control={<Switch checked={form.is_active} onChange={e=>setForm({ ...form, is_active: e.target.checked })} />} label="Active" />
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={()=>r.push('/pages/marketing/coupons')}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving}>{saving? 'Saving…' : 'Create Coupon'}</Button>
          </Stack>
        </Stack>
      </Paper>
    </Container>
  );
}

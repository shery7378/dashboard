"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/utils/api";
import { Container, Grid, Typography, Paper, TextField, MenuItem, Divider, Stack, Button, Alert } from "@mui/material";

export default function NewCampaignPage() {
  const r = useRouter();
  const [form, setForm] = useState<any>({
    name: "",
    channel: "in_app",
    title: "",
    message: "",
    target: "",
    scheduled_for: "",
    status: "draft",
  });
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    try {
      const payload: any = { ...form };
      if (payload.target) {
        try { payload.target = JSON.parse(payload.target); } catch { alert("Target must be JSON"); setSaving(false); return; }
      } else {
        delete payload.target;
      }
      await apiFetch("/api/admin/campaigns", { method: "POST", body: JSON.stringify(payload) });
      r.push("/pages/marketing/campaigns");
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h5" fontWeight={600} gutterBottom>New Campaign</Typography>
      {err && <Alert sx={{ mb: 2 }} severity="error">{err}</Alert>}
      <Paper component="form" onSubmit={submit} sx={{ p: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Name" placeholder="Winback" value={form.name}
              onChange={e=>setForm({ ...form, name: e.target.value })} required />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField select fullWidth label="Channel" value={form.channel} onChange={e=>setForm({ ...form, channel: e.target.value })}>
              <MenuItem value="in_app">In App</MenuItem>
              <MenuItem value="email">Email</MenuItem>
              <MenuItem value="sms">SMS</MenuItem>
              <MenuItem value="web_push">Web Push</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth label="Title" placeholder="We miss you!" value={form.title}
              onChange={e=>setForm({ ...form, title: e.target.value })} required />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth label="Message" placeholder="Come back for a special offer." value={form.message}
              onChange={e=>setForm({ ...form, message: e.target.value })} required multiline minRows={3} />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth label='Target JSON' placeholder='{"segment":"all"}' value={form.target as any}
              helperText="Optional targeting rules as JSON (segment, filters, etc.)"
              onChange={e=>setForm({ ...form, target: e.target.value as any })} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth type="datetime-local" label="Schedule (optional)" InputLabelProps={{ shrink: true }} value={form.scheduled_for as any}
              onChange={e=>setForm({ ...form, scheduled_for: e.target.value as any })} />
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />
        <Stack direction="row" justifyContent="flex-end" spacing={1}>
          <Button variant="outlined" onClick={()=>r.push('/pages/marketing/campaigns')}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={saving}>{saving ? 'Saving…' : 'Create Campaign'}</Button>
        </Stack>
      </Paper>
    </Container>
  );
}

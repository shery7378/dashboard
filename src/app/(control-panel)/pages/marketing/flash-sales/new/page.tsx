"use client";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/utils/api";
import { useRouter } from "next/navigation";
import { Container, Grid, Typography, Paper, TextField, MenuItem, FormControlLabel, Switch, Divider, Stack, Button, Alert, Autocomplete, Chip, CircularProgress } from "@mui/material";

export default function NewFlashSalePage() {
  const r = useRouter();
  const [form, setForm] = useState<any>({
    name: "",
    discount_type: "percent",
    discount_value: 10,
    starts_at: "",
    ends_at: "",
    is_active: true,
    product_ids: [] as number[],
  });
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Fetch products for selection (try admin endpoint, then public)
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [productOptions, setProductOptions] = useState<{ id: string | number; label: string }[]>([]);
  const [stores, setStores] = useState<{ id: string | number; name: string }[]>([]);
  const [storeId, setStoreId] = useState<string | number | "">("");
  const [productsSource, setProductsSource] = useState<string>("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      setProductsLoading(true);
      setProductsError(null);
      try {
        // First, attempt to get stores (auth route), then fall back to public route
        try {
          const storesResp: any = await apiFetch(`/api/stores?per_page=50`);
          const storesList = (Array.isArray(storesResp?.data) ? storesResp?.data
                           : Array.isArray(storesResp?.data?.data) ? storesResp?.data?.data
                           : Array.isArray(storesResp) ? storesResp
                           : []) as any[];
          if (mounted) setStores(storesList.map((s: any) => ({ id: s.id, name: s.name })));
          if (mounted && storesList[0]?.id && !storeId) setStoreId(storesList[0].id);
        } catch {
          try {
            const storesRespPublic: any = await apiFetch(`/api/stores/getAllStores`);
            const storesList = (Array.isArray(storesRespPublic?.data) ? storesRespPublic?.data
                             : Array.isArray(storesRespPublic?.data?.data) ? storesRespPublic?.data?.data
                             : Array.isArray(storesRespPublic) ? storesRespPublic
                             : []) as any[];
            if (mounted) setStores(storesList.map((s: any) => ({ id: s.id, name: s.name })));
            if (mounted && storesList[0]?.id && !storeId) setStoreId(storesList[0].id);
          } catch {}
        }

        // If a store is chosen, try products for that store first
        if (storeId) {
          // Preferred: public store products route
          try {
            const byStoreAlt: any = await apiFetch(`/api/stores/${storeId}/products?per_page=100`);
            const listAlt = (
              // Backend currently returns a single store object with a `products` array:
              // { status: 200, data: { ..., products: [...] }, others: [...] }
              Array.isArray(byStoreAlt?.data?.products) ? byStoreAlt.data.products
              : Array.isArray(byStoreAlt?.data) ? byStoreAlt.data
              : Array.isArray(byStoreAlt?.data?.data) ? byStoreAlt.data.data
              : Array.isArray(byStoreAlt?.products) ? byStoreAlt.products
              : []
            ) as any[];
            if (mounted) {
              setProductOptions(listAlt.map((p: any) => ({ id: p.id, label: p.name })));
              setProductsSource(`/api/stores/${storeId}/products?per_page=100`);
            }
            return; // done
          } catch {}

          // Fallback: query products with store_id filter
          try {
            const byStore: any = await apiFetch(`/api/products?store_id=${storeId}&per_page=100`);
            const list = (Array.isArray(byStore?.data) ? byStore?.data
                        : Array.isArray(byStore?.data?.data) ? byStore?.data?.data
                        : Array.isArray(byStore?.products) ? byStore?.products
                        : []) as any[];
            if (mounted) {
              setProductOptions(list.map((p: any) => ({ id: p.id, label: p.name })));
              setProductsSource(`/api/products?store_id=${storeId}&per_page=100`);
            }
            return; // done
          } catch {}
        }

        // Fallback to public all-products
        let resp: any;
        try {
          resp = await apiFetch(`/api/products/getAllProducts`);
        } catch {
          resp = await apiFetch(`/api/products?per_page=100`);
        }
        let list = (Array.isArray(resp?.data) ? resp?.data
                    : Array.isArray(resp?.data?.data) ? resp?.data?.data
                    : Array.isArray(resp?.products) ? resp?.products
                    : []) as any[];
        if (mounted && list.length > 0) {
          setProductOptions(list.map((p: any) => ({ id: p.id, label: p.name })));
          setProductsSource(resp?.source || `/api/products/getAllProducts`);
        } else {
          // Final fallback: use mock products to allow UI testing
          try {
            const mockResp: any = await fetch(`/api/mock/ecommerce/products`).then(r => r.json());
            list = Array.isArray(mockResp) ? mockResp : [];
            if (mounted && list.length > 0) {
              setProductOptions(list.map((p: any) => ({ id: p.id, label: p.name })));
              setProductsSource(`/api/mock/ecommerce/products`);
            }
          } catch {}
        }
      } catch (e: any) {
        if (mounted) setProductsError(e.message || 'Failed to load products (check permissions)');
      } finally {
        if (mounted) setProductsLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [storeId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    try {
      const payload: any = { ...form };
      payload.discount_value = Number(payload.discount_value);
      // Ensure product_ids is an array of numbers
      payload.product_ids = (form.product_ids || [])
        .map((v: any) => Number(v))
        .filter((n: number) => !isNaN(n));
      await apiFetch("/api/admin/flash-sales", { method: "POST", body: JSON.stringify(payload) });
      r.push("/pages/marketing/flash-sales");
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  // Timezone helper text for admins – we keep logic in UTC but make it explicit
  const now = new Date();
  const localTimeLabel = now.toLocaleString();
  const utcTimeLabel = now.toUTCString();

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h5" fontWeight={600} gutterBottom>New Flash Sale</Typography>
      <Alert severity="info" sx={{ mb: 2 }}>
        All flash sale times are evaluated on the server in <strong>UTC</strong>.{" "}
        Your local time: <strong>{localTimeLabel}</strong>.{" "}
        Current UTC time: <strong>{utcTimeLabel}</strong>.
      </Alert>
      {err && <Alert sx={{ mb: 2 }} severity="error">{err}</Alert>}
      <Paper component="form" onSubmit={submit} sx={{ p: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField fullWidth label="Name" placeholder="Weekend Mega Sale" value={form.name}
              onChange={e=>setForm({ ...form, name: e.target.value })} required />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField select fullWidth label="Discount Type" value={form.discount_type}
              onChange={e=>setForm({ ...form, discount_type: e.target.value })}>
              <MenuItem value="percent">Percent</MenuItem>
              <MenuItem value="fixed">Fixed</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth type="number" inputProps={{ step: "0.01" }} label="Discount Value"
              placeholder="20" value={form.discount_value as any}
              helperText={form.discount_type === 'percent' ? 'Percent off product price' : 'Fixed amount off product price'}
              onChange={e=>setForm({ ...form, discount_value: e.target.value as any })} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="datetime-local"
              label="Starts At (UTC)"
              InputLabelProps={{ shrink: true }}
              value={form.starts_at as any}
              helperText="Choose when this sale should start; time is stored in UTC."
              onChange={e=>setForm({ ...form, starts_at: e.target.value as any })} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="datetime-local"
              label="Ends At (UTC)"
              InputLabelProps={{ shrink: true }}
              value={form.ends_at as any}
              helperText="The sale stops after this time (UTC)."
              onChange={e=>setForm({ ...form, ends_at: e.target.value as any })} />
          </Grid>
          {stores.length > 0 && (
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label="Store"
                value={storeId as any}
                onChange={(e) => setStoreId(e.target.value)}
                helperText={"Filter products by store"}
              >
                {stores.map((s) => (
                  <MenuItem key={String(s.id)} value={s.id as any}>{s.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
          )}
          <Grid item xs={12}>
            <Autocomplete
              multiple
              options={productOptions}
              loading={productsLoading}
              value={productOptions.filter(o => (form.product_ids as number[]).includes(Number(o.id)))}
              onChange={(_, value) => setForm({ ...form, product_ids: value.map(v => Number(v.id)) })}
              getOptionLabel={(option) => option.label}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip variant="outlined" label={option.label} {...getTagProps({ index })} />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Products"
                  placeholder="Select products"
                  helperText={productsError ? productsError : (!productsLoading && productOptions.length === 0 ? (storeId ? 'No products found for the selected store' : 'Select a store to load products') : (`Choose one or more products to include in this flash sale${productsSource ? ` • Source: ${productsSource}` : ''}`))}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {productsLoading ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <FormControlLabel control={<Switch checked={form.is_active} onChange={e=>setForm({ ...form, is_active: e.target.checked })} />} label="Active" />
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={()=>r.push('/pages/marketing/flash-sales')}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving}>{saving? 'Saving…' : 'Create Flash Sale'}</Button>
          </Stack>
        </Stack>
      </Paper>
    </Container>
  );
}

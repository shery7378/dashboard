'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/utils/api';
import {
	Container,
	Typography,
	Button,
	Paper,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Chip,
	Stack,
	LinearProgress,
	Box
} from '@mui/material';

export default function CouponsPage() {
	const [coupons, setCoupons] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	async function load() {
		try {
			setLoading(true);
			const res = await apiFetch('/api/admin/coupons');
			setCoupons(res?.data ?? res);
		} catch (e: any) {
			setError(e.message);
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		load();
	}, []);

	async function remove(id: number) {
		if (!confirm('Delete coupon?')) return;

		await apiFetch(`/api/admin/coupons/${id}`, { method: 'DELETE' });
		load();
	}

	async function toggle(id: number, active: boolean) {
		await apiFetch(`/api/admin/coupons/${id}/${active ? 'deactivate' : 'activate'}`, { method: 'POST' });
		load();
	}

	return (
		<Box
			sx={{
				background: (theme) =>
					theme.palette.mode === 'dark'
						? 'linear-gradient(180deg, rgba(23,23,23,1) 0%, rgba(30,30,30,1) 100%)'
						: 'linear-gradient(180deg, #fff 0%, #f7f9fc 100%)',
				py: { xs: 3, md: 6 }
			}}
		>
			<Container maxWidth="lg">
				<Stack
					direction="row"
					alignItems="center"
					justifyContent="space-between"
					sx={{ mb: 3 }}
				>
					<Box>
						<Typography
							variant="h4"
							fontWeight={700}
						>
							Coupons
						</Typography>
						<Typography
							variant="body2"
							color="text.secondary"
						>
							Create promo codes and manage availability.
						</Typography>
					</Box>
					<Button
						component={Link as any}
						href="/pages/marketing/coupons/new"
						variant="contained"
					>
						New Coupon
					</Button>
				</Stack>
				{loading && <LinearProgress />}
				{error && (
					<Paper sx={{ p: 2, my: 2, bgcolor: 'error.light', color: 'error.contrastText', borderRadius: 2 }}>
						{error}
					</Paper>
				)}
				{!loading && coupons?.length === 0 && (
					<Paper
						sx={{
							p: 4,
							textAlign: 'center',
							borderRadius: 3,
							border: (t) => `1px dashed ${t.palette.divider}`
						}}
					>
						<Typography
							variant="h6"
							fontWeight={600}
						>
							No coupons yet
						</Typography>
						<Typography
							variant="body2"
							color="text.secondary"
							sx={{ mt: 0.5 }}
						>
							Create your first coupon to reward customers.
						</Typography>
						<Button
							component={Link as any}
							href="/pages/marketing/coupons/new"
							sx={{ mt: 2 }}
							variant="outlined"
						>
							Create coupon
						</Button>
					</Paper>
				)}
				{coupons?.length > 0 && (
					<TableContainer
						component={Paper}
						sx={{ borderRadius: 3, overflow: 'hidden', border: (t) => `1px solid ${t.palette.divider}` }}
					>
						<Table size="small">
							<TableHead>
								<TableRow>
									<TableCell>Code</TableCell>
									<TableCell>Type</TableCell>
									<TableCell>Value</TableCell>
									<TableCell>Status</TableCell>
									<TableCell>Start</TableCell>
									<TableCell>End</TableCell>
									<TableCell align="right">Actions</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{coupons.map((c: any) => (
									<TableRow
										key={c.id}
										hover
									>
										<TableCell>
											<Typography fontFamily="monospace">{c.code}</Typography>
										</TableCell>
										<TableCell sx={{ textTransform: 'capitalize' }}>{c.type}</TableCell>
										<TableCell>{c.value ?? '-'}</TableCell>
										<TableCell>
											<Chip
												size="small"
												label={c.is_active ? 'Active' : 'Inactive'}
												color={c.is_active ? 'success' : 'default'}
											/>
										</TableCell>
										<TableCell>{c.starts_at ?? '-'}</TableCell>
										<TableCell>{c.ends_at ?? '-'}</TableCell>
										<TableCell align="right">
											<Stack
												direction="row"
												spacing={1}
												justifyContent="flex-end"
											>
												<Button
													size="small"
													variant="outlined"
													onClick={() => toggle(c.id, !!c.is_active)}
												>
													{c.is_active ? 'Deactivate' : 'Activate'}
												</Button>
												<Button
													size="small"
													color="error"
													variant="outlined"
													onClick={() => remove(c.id)}
												>
													Delete
												</Button>
											</Stack>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</TableContainer>
				)}
			</Container>
		</Box>
	);
}

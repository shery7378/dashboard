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

export default function CampaignsPage() {
	const [items, setItems] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	async function load() {
		try {
			setLoading(true);
			const res = await apiFetch('/api/admin/campaigns');
			setItems(res?.data ?? res);
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
		if (!confirm('Delete campaign?')) return;

		await apiFetch(`/api/admin/campaigns/${id}`, { method: 'DELETE' });
		load();
	}

	async function schedule(id: number) {
		const when = prompt('Schedule for (ISO datetime UTC)', new Date().toISOString());

		if (!when) return;

		await apiFetch(`/api/admin/campaigns/${id}/schedule`, {
			method: 'POST',
			body: JSON.stringify({ scheduled_for: when })
		});
		load();
	}

	async function sendNow(id: number) {
		try {
			const res = await apiFetch(`/api/admin/campaigns/${id}/send-now`, { method: 'POST' });

			if (res && res.message) {
				alert(res.message);

				if (res.errors && res.errors.length > 0) {
					console.error(res.errors);
				}
			}
		} catch (e: any) {
			alert('Error: ' + e.message);
		}
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
							Campaigns
						</Typography>
						<Typography
							variant="body2"
							color="text.secondary"
						>
							Send announcements and schedule messages.
						</Typography>
					</Box>
					<Button
						component={Link as any}
						href="/pages/marketing/campaigns/new"
						variant="contained"
					>
						New Campaign
					</Button>
				</Stack>
				{loading && <LinearProgress />}
				{error && (
					<Paper sx={{ p: 2, my: 2, bgcolor: 'error.light', color: 'error.contrastText', borderRadius: 2 }}>
						{error}
					</Paper>
				)}
				{!loading && items?.length === 0 && (
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
							No campaigns yet
						</Typography>
						<Typography
							variant="body2"
							color="text.secondary"
							sx={{ mt: 0.5 }}
						>
							Create your first campaign to reach users.
						</Typography>
						<Button
							component={Link as any}
							href="/pages/marketing/campaigns/new"
							sx={{ mt: 2 }}
							variant="outlined"
						>
							Create campaign
						</Button>
					</Paper>
				)}
				{items?.length > 0 && (
					<TableContainer
						component={Paper}
						sx={{ borderRadius: 3, overflow: 'hidden', border: (t) => `1px solid ${t.palette.divider}` }}
					>
						<Table size="small">
							<TableHead>
								<TableRow>
									<TableCell>Name</TableCell>
									<TableCell>Channel</TableCell>
									<TableCell>Status</TableCell>
									<TableCell>Scheduled</TableCell>
									<TableCell align="right">Actions</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{items.map((x: any) => (
									<TableRow
										key={x.id}
										hover
									>
										<TableCell>{x.name}</TableCell>
										<TableCell sx={{ textTransform: 'capitalize' }}>{x.channel}</TableCell>
										<TableCell>
											<Chip
												size="small"
												label={x.status}
												color={
													x.status === 'sent'
														? 'success'
														: x.status === 'scheduled'
															? 'warning'
															: 'default'
												}
											/>
										</TableCell>
										<TableCell>{x.scheduled_for ?? '-'}</TableCell>
										<TableCell align="right">
											<Stack
												direction="row"
												spacing={1}
												justifyContent="flex-end"
											>
												<Button
													size="small"
													variant="outlined"
													onClick={() => schedule(x.id)}
												>
													Schedule
												</Button>
												<Button
													size="small"
													color="success"
													variant="outlined"
													onClick={() => sendNow(x.id)}
												>
													Send Now
												</Button>
												<Button
													size="small"
													color="error"
													variant="outlined"
													onClick={() => remove(x.id)}
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

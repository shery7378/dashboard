'use client';

import { useMemo, useState } from 'react';
import { type MRT_ColumnDef } from 'material-react-table';
import DataTable from 'src/components/data-table/DataTable';
import {
	ListItemIcon,
	MenuItem,
	Paper,
	Typography,
	Chip,
	Button,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	TextField,
	Alert
} from '@mui/material';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import {
	useGetWithdrawalsQuery,
	useApproveWithdrawalMutation,
	useRejectWithdrawalMutation,
	type WithdrawalRequest
} from '../apis/WithdrawalsApi';
import { formatDate } from '@/utils/Constants';

/**
 * Helper function to safely format amount.
 */
const formatAmount = (amount: number | string | undefined | null): string => {
	if (amount === null || amount === undefined) return '0.00';
	const parsed = typeof amount === 'number' ? amount : parseFloat(String(amount));
	return isNaN(parsed) ? '0.00' : parsed.toFixed(2);
};

/**
 * Table for managing seller withdrawal requests.
 */
function WithdrawalsTable() {
	const { data, isLoading, error } = useGetWithdrawalsQuery({});
	const [approveWithdrawal] = useApproveWithdrawalMutation();
	const [rejectWithdrawal] = useRejectWithdrawalMutation();
	
	const [approveDialogOpen, setApproveDialogOpen] = useState(false);
	const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
	const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
	const [rejectionReason, setRejectionReason] = useState('');

	const withdrawals = data?.data ?? [];

	const handleApprove = async () => {
		if (!selectedWithdrawal) return;
		try {
			await approveWithdrawal({ id: selectedWithdrawal.id }).unwrap();
			setApproveDialogOpen(false);
			setSelectedWithdrawal(null);
		} catch (err) {
			console.error('Failed to approve withdrawal:', err);
		}
	};

	const handleReject = async () => {
		if (!selectedWithdrawal || !rejectionReason.trim()) return;
		try {
			await rejectWithdrawal({
				id: selectedWithdrawal.id,
				rejection_reason: rejectionReason
			}).unwrap();
			setRejectDialogOpen(false);
			setSelectedWithdrawal(null);
			setRejectionReason('');
		} catch (err) {
			console.error('Failed to reject withdrawal:', err);
		}
	};

	const columns = useMemo<MRT_ColumnDef<WithdrawalRequest>[]>(
		() => [
			{
				accessorKey: 'request_number',
				header: 'Request #',
				size: 140,
				Cell: ({ row }) => <span className="font-mono font-bold text-secondary">{row.original.request_number}</span>
			},
			{
				accessorKey: 'user.name',
				header: 'Seller',
				Cell: ({ row }) => (
					<div className="flex flex-col">
						<Typography variant="body2" className="font-semibold text-13">
							{row.original.user?.name ?? '—'}
						</Typography>
						<Typography variant="caption" className="text-11 text-text-secondary">
							{row.original.user?.email ?? '—'}
						</Typography>
					</div>
				)
			},
			{
				accessorKey: 'amount',
				header: 'Amount',
				size: 120,
				Cell: ({ row }) => (
					<Typography className="font-bold text-15">
						<span className="text-12 text-text-secondary mr-2">{row.original.currency}</span>
						{formatAmount(row.original.amount)}
					</Typography>
				)
			},
			{
				accessorKey: 'status',
				header: 'Status',
				size: 120,
				Cell: ({ row }) => {
					const status = row.original.status?.toLowerCase();
					const colors: Record<string, string> = {
						pending: 'bg-orange-100 text-orange-700',
						processing: 'bg-blue-100 text-blue-700',
						completed: 'bg-green-100 text-green-700',
						rejected: 'bg-red-100 text-red-700',
					};
					return (
						<Chip 
							label={row.original.status.toUpperCase()} 
							className={`text-10 font-bold ${colors[status] || 'bg-gray-100 text-gray-700'}`}
							size="small"
						/>
					);
				}
			},
			{
				accessorKey: 'created_at',
				header: 'Requested',
				size: 130,
				Cell: ({ row }) => formatDate(row.original.created_at)
			},
			{
				accessorKey: 'processed_at',
				header: 'Processed',
				size: 130,
				Cell: ({ row }) => row.original.processed_at ? formatDate(row.original.processed_at) : <span className="text-gray-400">Not yet</span>
			}
		],
		[]
	);

	if (error) return (
		<Paper className="p-24 flex flex-col items-center justify-center shadow-1 rounded-lg">
			<Typography color="error" variant="body1" className="font-semibold text-20">Failed to load withdrawals</Typography>
			<Typography color="text.secondary" variant="body2">Please check your connection or try again later.</Typography>
		</Paper>
	);

	return (
		<>
			<Paper className="flex flex-col flex-auto shadow hover:shadow-lg transition-shadow duration-300 rounded-lg overflow-hidden border-1 border-divider" elevation={0}>
				<DataTable
					enableRowSelection={false}
					enableRowActions={true}
					data={withdrawals}
					columns={columns}
					state={{ isLoading }}
					renderRowActionMenuItems={({ closeMenu, row }) => {
						const withdrawal = row.original;
						if (withdrawal.status !== 'pending') return null;

						return [
							<MenuItem
								key="approve"
								onClick={() => {
									setSelectedWithdrawal(withdrawal);
									setApproveDialogOpen(true);
									closeMenu();
								}}
								className="text-success"
							>
								<ListItemIcon>
									<FuseSvgIcon color="success">heroicons-outline:check-circle</FuseSvgIcon>
								</ListItemIcon>
								Approve
							</MenuItem>,
							<MenuItem
								key="reject"
								onClick={() => {
									setSelectedWithdrawal(withdrawal);
									setRejectDialogOpen(true);
									closeMenu();
								}}
								className="text-error"
							>
								<ListItemIcon>
									<FuseSvgIcon color="error">heroicons-outline:x-circle</FuseSvgIcon>
								</ListItemIcon>
								Reject
							</MenuItem>
						];
					}}
				/>
			</Paper>

			{/* Approve Dialog */}
			<Dialog open={approveDialogOpen} onClose={() => setApproveDialogOpen(false)} maxWidth="xs" fullWidth>
				<DialogTitle className="border-b-1 pb-16">Approve Withdrawal</DialogTitle>
				<DialogContent className="pt-24">
					{selectedWithdrawal && (
						<div className="space-y-16">
							<div className="bg-gray-50 p-16 rounded-lg space-y-8">
								<Typography variant="body2" className="flex justify-between">
									<span className="text-text-secondary">Vendor:</span>
									<span className="font-bold">{selectedWithdrawal.user?.name}</span>
								</Typography>
								<Typography variant="body2" className="flex justify-between">
									<span className="text-text-secondary">Amount:</span>
									<span className="font-bold text-success">{selectedWithdrawal.currency} {formatAmount(selectedWithdrawal.amount)}</span>
								</Typography>
								<Typography variant="body2" className="flex justify-between">
									<span className="text-text-secondary">Request #:</span>
									<span className="font-mono">{selectedWithdrawal.request_number}</span>
								</Typography>
							</div>
							<Alert severity="info" className="rounded-lg shadow-sm font-medium border-1 border-blue-200">
								Payment will be transferred to vendor's Stripe Connect account automatically.
							</Alert>
						</div>
					)}
				</DialogContent>
				<DialogActions className="p-16 border-t-1">
					<Button onClick={() => setApproveDialogOpen(false)}>Cancel</Button>
					<Button onClick={handleApprove} variant="contained" color="primary" className="px-24">
						Approve & Transfer
					</Button>
				</DialogActions>
			</Dialog>

			{/* Reject Dialog */}
			<Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="xs" fullWidth>
				<DialogTitle className="border-b-1 pb-16">Reject Withdrawal</DialogTitle>
				<DialogContent className="pt-24">
					{selectedWithdrawal && (
						<div className="space-y-16">
							<div className="bg-red-50 p-16 rounded-lg">
								<Typography variant="body2" className="text-red-800 font-bold mb-8">Rejecting request for:</Typography>
								<Typography variant="body2" className="flex justify-between">
									<span className="text-red-600">Amount:</span>
									<span className="font-bold text-red-700">{selectedWithdrawal.currency} {formatAmount(selectedWithdrawal.amount)}</span>
								</Typography>
							</div>
							<TextField
								fullWidth
								label="Rejection Reason"
								multiline
								rows={3}
								value={rejectionReason}
								onChange={(e) => setRejectionReason(e.target.value)}
								placeholder="Please explain why this request is being rejected..."
								required
								variant="outlined"
								error={!rejectionReason.trim()}
								helperText={!rejectionReason.trim() ? "Reason is required" : ""}
							/>
						</div>
					)}
				</DialogContent>
				<DialogActions className="p-16 border-t-1">
					<Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
					<Button
						onClick={handleReject}
						variant="contained"
						color="error"
						disabled={!rejectionReason.trim()}
						className="px-24"
					>
						Confirm Rejection
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
}

export default WithdrawalsTable;


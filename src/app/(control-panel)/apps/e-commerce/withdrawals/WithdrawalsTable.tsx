'use client';

import { useMemo, useState } from 'react';
import { type MRT_ColumnDef } from 'material-react-table';
import DataTable from 'src/components/data-table/DataTable';
import { ListItemIcon, MenuItem, Paper, Typography, Chip, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert } from '@mui/material';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import FuseLoading from '@fuse/core/FuseLoading';
import {
	useGetWithdrawalsQuery,
	useApproveWithdrawalMutation,
	useRejectWithdrawalMutation,
	type WithdrawalRequest
} from '../apis/WithdrawalsApi';

// Helper function to safely format amount - handles all possible types
// Defined outside component to ensure it's always available
const formatAmount = (amount: number | string | undefined | null): string => {
	// Handle null/undefined
	if (amount === null || amount === undefined) {
		return '0.00';
	}
	
	// If it's already a number, use toFixed directly
	if (typeof amount === 'number' && !isNaN(amount)) {
		return amount.toFixed(2);
	}
	
	// Convert to string and parse
	const amountStr = String(amount);
	const parsed = parseFloat(amountStr);
	
	// Return formatted or default
	return isNaN(parsed) ? '0.00' : parsed.toFixed(2);
};

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

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'pending':
				return 'warning';
			case 'processing':
				return 'info';
			case 'completed':
				return 'success';
			case 'rejected':
				return 'error';
			default:
				return 'default';
		}
	};

	const columns = useMemo<MRT_ColumnDef<WithdrawalRequest>[]>(
		() => [
			{
				accessorKey: 'request_number',
				header: 'Request #',
				size: 120,
			},
			{
				accessorKey: 'user.name',
				header: 'Vendor',
				Cell: ({ row }) => (
					<div>
						<Typography variant="body2" fontWeight="medium">
							{row.original.user?.name ?? '—'}
						</Typography>
						<Typography variant="caption" color="text.secondary">
							{row.original.user?.email ?? '—'}
						</Typography>
					</div>
				),
			},
			{
				accessorKey: 'amount',
				header: 'Amount',
				size: 100,
				Cell: ({ row }) => (
					<Typography fontWeight="medium">
						{row.original.currency} {formatAmount(row.original.amount)}
					</Typography>
				),
			},
			{
				accessorKey: 'status',
				header: 'Status',
				size: 120,
				Cell: ({ row }) => (
					<Chip
						label={row.original.status.toUpperCase()}
						color={getStatusColor(row.original.status) as any}
						size="small"
					/>
				),
			},
			{
				accessorKey: 'created_at',
				header: 'Requested',
				size: 120,
				Cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString(),
			},
			{
				accessorKey: 'processed_at',
				header: 'Processed',
				size: 120,
				Cell: ({ row }) => 
					row.original.processed_at 
						? new Date(row.original.processed_at).toLocaleDateString()
						: '—',
			},
		],
		[]
	);

	if (isLoading) {
		return <FuseLoading />;
	}

	if (error) {
		return <Alert severity="error">Failed to load withdrawals</Alert>;
	}

	return (
		<>
			<Paper
				className="flex flex-col flex-auto shadow-1 rounded-t-lg overflow-hidden rounded-b-none w-full h-full"
				elevation={0}
			>
				<DataTable
					initialState={{
						density: 'spacious',
						showColumnFilters: false,
						showGlobalFilter: true,
						pagination: {
							pageIndex: 0,
							pageSize: 20
						}
					}}
					enableRowSelection={false}
					enableRowActions={true}
					data={withdrawals as any}
					columns={columns}
					renderRowActionMenuItems={({ closeMenu, row }) => {
						const withdrawal = row.original;
						
						return [
							withdrawal.status === 'pending' && (
								<MenuItem
									key="approve"
									onClick={() => {
										setSelectedWithdrawal(withdrawal);
										setApproveDialogOpen(true);
										closeMenu();
									}}
								>
									<ListItemIcon>
										<FuseSvgIcon>heroicons-outline:check-circle</FuseSvgIcon>
									</ListItemIcon>
									Approve
								</MenuItem>
							),
							withdrawal.status === 'pending' && (
								<MenuItem
									key="reject"
									onClick={() => {
										setSelectedWithdrawal(withdrawal);
										setRejectDialogOpen(true);
										closeMenu();
									}}
								>
									<ListItemIcon>
										<FuseSvgIcon>heroicons-outline:x-circle</FuseSvgIcon>
									</ListItemIcon>
									Reject
								</MenuItem>
							),
						].filter(Boolean);
					}}
				/>
			</Paper>

			{/* Approve Dialog */}
			<Dialog open={approveDialogOpen} onClose={() => setApproveDialogOpen(false)}>
				<DialogTitle>Approve Withdrawal</DialogTitle>
				<DialogContent>
					{selectedWithdrawal && (
						<div className="space-y-4 pt-4">
							<Typography>
								<strong>Vendor:</strong> {selectedWithdrawal.user?.name}
							</Typography>
							<Typography>
								<strong>Amount:</strong> {selectedWithdrawal.currency} {formatAmount(selectedWithdrawal.amount)}
							</Typography>
							<Typography>
								<strong>Request #:</strong> {selectedWithdrawal.request_number}
							</Typography>
							<Alert severity="info" className="mt-4">
								Payment will be transferred to vendor's Stripe Connect account automatically.
							</Alert>
						</div>
					)}
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setApproveDialogOpen(false)}>Cancel</Button>
					<Button onClick={handleApprove} variant="contained" color="primary">
						Approve & Transfer
					</Button>
				</DialogActions>
			</Dialog>

			{/* Reject Dialog */}
			<Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)}>
				<DialogTitle>Reject Withdrawal</DialogTitle>
				<DialogContent>
					{selectedWithdrawal && (
						<div className="space-y-4 pt-4">
							<Typography>
								<strong>Vendor:</strong> {selectedWithdrawal.user?.name}
							</Typography>
							<Typography>
								<strong>Amount:</strong> {selectedWithdrawal.currency} {formatAmount(selectedWithdrawal.amount)}
							</Typography>
							<TextField
								fullWidth
								label="Rejection Reason"
								multiline
								rows={4}
								value={rejectionReason}
								onChange={(e) => setRejectionReason(e.target.value)}
								required
								className="mt-4"
							/>
						</div>
					)}
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
					<Button 
						onClick={handleReject} 
						variant="contained" 
						color="error"
						disabled={!rejectionReason.trim()}
					>
						Reject
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
}

export default WithdrawalsTable;


'use client';

import { useMemo, useState, useEffect } from 'react';
import { type MRT_ColumnDef } from 'material-react-table';
import DataTable from 'src/components/data-table/DataTable';
import { ListItemIcon, MenuItem, Paper, Typography, Chip, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert } from '@mui/material';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import FuseLoading from '@fuse/core/FuseLoading';
import { useSession } from 'next-auth/react';
import {
	useGetRefundRequestsQuery,
	useGetRefundRequestQuery,
	useRequestMoreDetailsMutation,
	useApproveRefundMutation,
	useRejectRefundMutation,
	type RefundRequest
} from '../apis/RefundRequestsApi';

const formatAmount = (amount: number | string | undefined | null): string => {
	if (amount === null || amount === undefined) {
		return '0.00';
	}
	if (typeof amount === 'number' && !isNaN(amount)) {
		return amount.toFixed(2);
	}
	const amountStr = String(amount);
	const parsed = parseFloat(amountStr);
	return isNaN(parsed) ? '0.00' : parsed.toFixed(2);
};

function RefundRequestsTable() {
	const { data: session } = useSession();
	const { data, isLoading, error } = useGetRefundRequestsQuery({});
	const [requestMoreDetails] = useRequestMoreDetailsMutation();
	const [approveRefund] = useApproveRefundMutation();
	const [rejectRefund] = useRejectRefundMutation();
	
	const [viewDetailsDialogOpen, setViewDetailsDialogOpen] = useState(false);
	const [requestDetailsDialogOpen, setRequestDetailsDialogOpen] = useState(false);
	const [approveDialogOpen, setApproveDialogOpen] = useState(false);
	const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
	const [selectedRefund, setSelectedRefund] = useState<RefundRequest | null>(null);
	const [selectedRefundId, setSelectedRefundId] = useState<number | null>(null);
	const { data: fullRefundData } = useGetRefundRequestQuery(selectedRefundId as number, { skip: !selectedRefundId });
	const [adminQuestion, setAdminQuestion] = useState('');
	const [adminNotes, setAdminNotes] = useState('');
	const [rejectionReason, setRejectionReason] = useState('');

	const refundRequests = data?.data ?? [];
	
	// Use full refund data if available, otherwise use selected refund
	const displayRefund = selectedRefundId && fullRefundData?.data ? fullRefundData.data : selectedRefund;
	
	// Get authentication token from session or localStorage
	const getAuthToken = () => {
		if (typeof window === 'undefined') return null;
		
		// Try session first (NextAuth)
		const sessionToken = (session as any)?.accessAuthToken || (session as any)?.accessToken;
		if (sessionToken) return sessionToken;
		
		// Fallback to localStorage
		return localStorage.getItem('token') || 
			localStorage.getItem('auth_token') || 
			localStorage.getItem('access_token');
	};

	const handleRequestMoreDetails = async () => {
		if (!selectedRefund || !adminQuestion.trim()) return;
		
		try {
			await requestMoreDetails({
				id: selectedRefund.id,
				admin_question: adminQuestion,
				admin_notes: adminNotes || undefined,
			}).unwrap();
			setRequestDetailsDialogOpen(false);
			setSelectedRefund(null);
			setAdminQuestion('');
			setAdminNotes('');
		} catch (err) {
			console.error('Failed to request more details:', err);
		}
	};

	const handleApprove = async () => {
		if (!displayRefund) return;
		
		try {
			await approveRefund({
				id: displayRefund.id,
				admin_notes: adminNotes || undefined
			}).unwrap();
			setApproveDialogOpen(false);
			setSelectedRefund(null);
			setSelectedRefundId(null);
			setAdminNotes('');
		} catch (err) {
			console.error('Failed to approve refund:', err);
		}
	};

	const handleReject = async () => {
		if (!selectedRefund || !rejectionReason.trim()) return;
		
		try {
			await rejectRefund({
				id: selectedRefund.id,
				admin_notes: rejectionReason
			}).unwrap();
			setRejectDialogOpen(false);
			setSelectedRefund(null);
			setRejectionReason('');
		} catch (err) {
			console.error('Failed to reject refund:', err);
		}
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'pending':
				return 'warning';
			case 'approved':
				return 'info';
			case 'processing':
				return 'info';
			case 'completed':
				return 'success';
			case 'rejected':
				return 'error';
			case 'cancelled':
				return 'default';
			default:
				return 'default';
		}
	};

	const columns = useMemo<MRT_ColumnDef<RefundRequest>[]>(
		() => [
			{
				accessorKey: 'request_number',
				header: 'Request #',
				size: 120,
			},
			{
				accessorKey: 'user.name',
				header: 'Customer',
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
				accessorKey: 'order.order_number',
				header: 'Order #',
				size: 120,
				Cell: ({ row }) => row.original.order?.order_number ?? `#${row.original.order_id}`,
			},
			{
				accessorKey: 'requested_amount',
				header: 'Amount',
				size: 100,
				Cell: ({ row }) => (
					<Typography fontWeight="medium">
						£{formatAmount(row.original.requested_amount)}
					</Typography>
				),
			},
			{
				accessorKey: 'reason',
				header: 'Reason',
				size: 150,
				Cell: ({ row }) => (
					<Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
						{row.original.reason?.replace(/_/g, ' ') ?? '—'}
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
				accessorKey: 'needs_more_details',
				header: 'Needs Info',
				size: 100,
				Cell: ({ row }) => {
					const refund = row.original;
					if (refund.needs_more_details) {
						return <Chip label="Yes" color="warning" size="small" />;
					}
					if (refund.has_customer_response || refund.customer_responded_at) {
						return <Chip label="Received" color="success" size="small" />;
					}
					return <Typography variant="body2" color="text.secondary">—</Typography>;
				},
			},
			{
				accessorKey: 'created_at',
				header: 'Requested',
				size: 120,
				Cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString(),
			},
		],
		[]
	);

	if (isLoading) {
		return <FuseLoading />;
	}

	if (error) {
		return <Alert severity="error">Failed to load refund requests</Alert>;
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
					data={refundRequests as any}
					columns={columns}
					renderRowActionMenuItems={({ closeMenu, row }) => {
						const refund = row.original;
						
						return [
							<MenuItem
								key="view-details"
								onClick={() => {
									setSelectedRefund(refund);
									setSelectedRefundId(refund.id);
									setViewDetailsDialogOpen(true);
									closeMenu();
								}}
							>
								<ListItemIcon>
									<FuseSvgIcon>heroicons-outline:eye</FuseSvgIcon>
								</ListItemIcon>
								View Details
							</MenuItem>,
							(refund.status === 'pending' && !refund.has_customer_response) && (
								<MenuItem
									key="request-details"
									onClick={() => {
										setSelectedRefund(refund);
										setSelectedRefundId(null);
										setRequestDetailsDialogOpen(true);
										closeMenu();
									}}
								>
									<ListItemIcon>
										<FuseSvgIcon>heroicons-outline:question-mark-circle</FuseSvgIcon>
									</ListItemIcon>
									Request More Details
								</MenuItem>
							),
							(refund.status === 'pending' || refund.has_customer_response) && (
								<MenuItem
									key="approve"
									onClick={() => {
										setSelectedRefund(refund);
										setSelectedRefundId(refund.id);
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
							refund.status === 'pending' && (
								<MenuItem
									key="reject"
									onClick={() => {
										setSelectedRefund(refund);
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

			{/* View Details Dialog - For reviewing customer information */}
			<Dialog open={viewDetailsDialogOpen} onClose={() => {
				setViewDetailsDialogOpen(false);
				setSelectedRefundId(null);
			}} maxWidth="md" fullWidth>
				<DialogTitle>Refund Request Details</DialogTitle>
				<DialogContent>
					{displayRefund && (
						<div className="space-y-4 pt-4">
							{/* Basic Information */}
							<div className="p-4 bg-gray-50 rounded-lg border">
								<Typography variant="h6" className="mb-3">Basic Information</Typography>
								<div className="space-y-2">
									<Typography>
										<strong>Request #:</strong> {displayRefund.request_number}
									</Typography>
									<Typography>
										<strong>Customer:</strong> {displayRefund.user?.name} ({displayRefund.user?.email})
									</Typography>
									<Typography>
										<strong>Order #:</strong> {displayRefund.order?.order_number ?? `#${displayRefund.order_id}`}
									</Typography>
									<Typography>
										<strong>Amount:</strong> £{formatAmount(displayRefund.requested_amount)}
									</Typography>
									<Typography>
										<strong>Reason:</strong> {displayRefund.reason?.replace(/_/g, ' ')}
									</Typography>
									<Typography>
										<strong>Status:</strong> <Chip 
											label={displayRefund.status.toUpperCase()} 
											color={getStatusColor(displayRefund.status) as any} 
											size="small" 
										/>
									</Typography>
									<Typography>
										<strong>Requested:</strong> {new Date(displayRefund.created_at).toLocaleString()}
									</Typography>
								</div>
							</div>

							{/* Admin Question (if asked) */}
							{displayRefund.admin_question && (
								<div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
									<Typography variant="h6" className="mb-2">Admin Question</Typography>
									<Typography variant="body2" className="mb-2">
										{displayRefund.admin_question}
									</Typography>
									{displayRefund.admin_questioned_at && (
										<Typography variant="caption" color="text.secondary">
											Asked: {new Date(displayRefund.admin_questioned_at).toLocaleString()}
										</Typography>
									)}
								</div>
							)}

							{/* Customer's Additional Information */}
							{displayRefund.customer_additional_info ? (
								<div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
									<Typography variant="h6" className="mb-2">Customer's Response</Typography>
									<Typography variant="body2" className="mb-3" style={{ whiteSpace: 'pre-wrap' }}>
										{displayRefund.customer_additional_info}
									</Typography>
									{displayRefund.customer_responded_at && (
										<Typography variant="caption" color="text.secondary" className="block mb-2">
											Responded: {new Date(displayRefund.customer_responded_at).toLocaleString()}
										</Typography>
									)}
									
									{/* Attachments */}
									{displayRefund.attachment_files && displayRefund.attachment_files.length > 0 && (
										<div className="mt-3 pt-3 border-t border-blue-300">
											<Typography variant="subtitle2" fontWeight="bold" className="mb-2">
												Attachments ({displayRefund.attachment_files.length}):
											</Typography>
											<div className="flex flex-col gap-2">
												{displayRefund.attachment_files.map((file: any) => {
													// Get token from session or localStorage
													const token = getAuthToken();
													
													// Always append token if it exists and the path contains /files/ or /api/files/
													let fileUrl = file.path;
													if (token && file.path) {
														// Check if this is an API file route - be more permissive
														const isApiFileRoute = file.path.includes('/api/files/') || 
															file.path.includes('/files/') ||
															file.path.match(/\/files\/\d+/) ||
															file.path.includes('127.0.0.1:8000/api/files/') ||
															file.path.includes('localhost') && file.path.includes('/files/');
														
														if (isApiFileRoute) {
															const separator = file.path.includes('?') ? '&' : '?';
															fileUrl = `${file.path}${separator}token=${encodeURIComponent(token)}`;
														}
													}
													
													// Debug logging - always log to help debug
													console.log('File URL Debug:', {
														fileId: file.id,
														originalPath: file.path,
														hasToken: !!token,
														tokenLength: token?.length || 0,
														finalUrl: fileUrl
													});
													
													// Debug logging
													console.log('File URL generation:', {
														originalPath: file.path,
														hasToken: !!token,
														tokenPreview: token ? token.substring(0, 10) + '...' : 'none',
														finalUrl: fileUrl
													});
													
													const handleFileClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
														e.preventDefault();
														if (!token) {
															alert('Authentication required. Please log in again.');
															return;
														}
														
														try {
															const url = fileUrl.includes('?') ? fileUrl : `${fileUrl}?token=${encodeURIComponent(token)}`;
															const response = await fetch(url, {
																headers: {
																	'Authorization': `Bearer ${token}`
																}
															});
															
															if (!response.ok) {
																throw new Error('Failed to fetch file');
															}
															
															const blob = await response.blob();
															const downloadUrl = window.URL.createObjectURL(blob);
															const link = document.createElement('a');
															link.href = downloadUrl;
															link.download = file.filename || 'download';
															document.body.appendChild(link);
															link.click();
															document.body.removeChild(link);
															window.URL.revokeObjectURL(downloadUrl);
														} catch (error) {
															console.error('Error downloading file:', error);
															alert('Failed to download file. Please try again.');
														}
													};
													
													return (
														<div key={file.id} className="flex items-center gap-2 p-2 bg-white rounded border">
															<FuseSvgIcon className="text-blue-600">heroicons-outline:paper-clip</FuseSvgIcon>
															<a
																href={fileUrl}
																onClick={handleFileClick}
																target="_blank"
																rel="noopener noreferrer"
																className="text-blue-600 hover:underline flex-1 cursor-pointer"
															>
																{file.filename}
															</a>
															{file.size && (
																<Typography variant="caption" color="text.secondary">
																	{(parseInt(file.size) / 1024).toFixed(1)} KB
																</Typography>
															)}
														</div>
													);
												})}
											</div>
										</div>
									)}
								</div>
							) : displayRefund.needs_more_details ? (
								<div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
									<Typography variant="body2" color="text.secondary">
										Waiting for customer to provide additional information...
									</Typography>
								</div>
							) : null}

							{/* Admin Notes (if any) */}
							{displayRefund.admin_notes && (
								<div className="p-4 bg-gray-50 rounded-lg border">
									<Typography variant="h6" className="mb-2">Admin Notes</Typography>
									<Typography variant="body2" style={{ whiteSpace: 'pre-wrap' }}>
										{displayRefund.admin_notes}
									</Typography>
								</div>
							)}
						</div>
					)}
				</DialogContent>
				<DialogActions>
					<Button onClick={() => {
						setViewDetailsDialogOpen(false);
						setSelectedRefundId(null);
					}}>Close</Button>
					{displayRefund && displayRefund.status === 'pending' && (
						<>
							<Button 
								onClick={() => {
									setViewDetailsDialogOpen(false);
									setApproveDialogOpen(true);
								}} 
								variant="contained" 
								color="primary"
							>
								Approve
							</Button>
							<Button 
								onClick={() => {
									setViewDetailsDialogOpen(false);
									setRejectDialogOpen(true);
								}} 
								variant="outlined" 
								color="error"
							>
								Reject
							</Button>
						</>
					)}
				</DialogActions>
			</Dialog>

			{/* Request More Details Dialog */}
			<Dialog open={requestDetailsDialogOpen} onClose={() => setRequestDetailsDialogOpen(false)} maxWidth="md" fullWidth>
				<DialogTitle>Request More Details</DialogTitle>
				<DialogContent>
					{selectedRefund && (
						<div className="space-y-4 pt-4">
							<Typography>
								<strong>Customer:</strong> {selectedRefund.user?.name}
							</Typography>
							<Typography>
								<strong>Order #:</strong> {selectedRefund.order?.order_number ?? `#${selectedRefund.order_id}`}
							</Typography>
							<Typography>
								<strong>Request #:</strong> {selectedRefund.request_number}
							</Typography>
							<TextField
								fullWidth
								label="Question for Customer"
								multiline
								rows={4}
								value={adminQuestion}
								onChange={(e) => setAdminQuestion(e.target.value)}
								required
								placeholder="What additional information do you need from the customer?"
								className="mt-4"
							/>
							<TextField
								fullWidth
								label="Admin Notes (Optional)"
								multiline
								rows={3}
								value={adminNotes}
								onChange={(e) => setAdminNotes(e.target.value)}
								placeholder="Internal notes (not visible to customer)"
								className="mt-2"
							/>
						</div>
					)}
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setRequestDetailsDialogOpen(false)}>Cancel</Button>
					<Button 
						onClick={handleRequestMoreDetails} 
						variant="contained" 
						color="primary"
						disabled={!adminQuestion.trim()}
					>
						Send Request
					</Button>
				</DialogActions>
			</Dialog>

			{/* Approve Dialog */}
			<Dialog open={approveDialogOpen} onClose={() => {
				setApproveDialogOpen(false);
				setSelectedRefundId(null);
			}} maxWidth="md" fullWidth>
				<DialogTitle>Approve Refund Request</DialogTitle>
				<DialogContent>
					{displayRefund && (
						<div className="space-y-4 pt-4">
							<Typography>
								<strong>Customer:</strong> {displayRefund.user?.name}
							</Typography>
							<Typography>
								<strong>Order #:</strong> {displayRefund.order?.order_number ?? `#${displayRefund.order_id}`}
							</Typography>
							<Typography>
								<strong>Amount:</strong> £{formatAmount(displayRefund.requested_amount)}
							</Typography>
							<Typography>
								<strong>Request #:</strong> {displayRefund.request_number}
							</Typography>
							
							{/* Show customer's additional information if provided */}
							{displayRefund.customer_additional_info && (
								<div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
									<Typography variant="subtitle2" fontWeight="bold" className="mb-2">
										Customer's Additional Information:
									</Typography>
									<Typography variant="body2" className="mb-2">
										{displayRefund.customer_additional_info}
									</Typography>
									{displayRefund.customer_responded_at && (
										<Typography variant="caption" color="text.secondary">
											Responded: {new Date(displayRefund.customer_responded_at).toLocaleString()}
										</Typography>
									)}
									{displayRefund.attachment_files && displayRefund.attachment_files.length > 0 && (
										<div className="mt-2">
											<Typography variant="caption" fontWeight="bold" className="block mb-1">
												Attachments ({displayRefund.attachment_files.length}):
											</Typography>
											<div className="flex flex-wrap gap-2">
												{displayRefund.attachment_files.map((file: any) => {
													// Get token from session or localStorage
													const token = getAuthToken();
													
													// Always append token if it exists and the path contains /files/ or /api/files/
													let fileUrl = file.path;
													if (token && file.path) {
														// Check if this is an API file route - be more permissive
														const isApiFileRoute = file.path.includes('/api/files/') || 
															file.path.includes('/files/') ||
															file.path.match(/\/files\/\d+/) ||
															file.path.includes('127.0.0.1:8000/api/files/') ||
															file.path.includes('localhost') && file.path.includes('/files/');
														
														if (isApiFileRoute) {
															const separator = file.path.includes('?') ? '&' : '?';
															fileUrl = `${file.path}${separator}token=${encodeURIComponent(token)}`;
														}
													}
													
													// Debug logging - always log to help debug
													console.log('File URL Debug:', {
														fileId: file.id,
														originalPath: file.path,
														hasToken: !!token,
														tokenLength: token?.length || 0,
														finalUrl: fileUrl
													});
													
													// Debug logging
													console.log('File URL generation:', {
														originalPath: file.path,
														hasToken: !!token,
														tokenPreview: token ? token.substring(0, 10) + '...' : 'none',
														finalUrl: fileUrl
													});
													
													const handleFileClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
														e.preventDefault();
														if (!token) {
															alert('Authentication required. Please log in again.');
															return;
														}
														
														try {
															const url = fileUrl.includes('?') ? fileUrl : `${fileUrl}?token=${encodeURIComponent(token)}`;
															const response = await fetch(url, {
																headers: {
																	'Authorization': `Bearer ${token}`
																}
															});
															
															if (!response.ok) {
																throw new Error('Failed to fetch file');
															}
															
															const blob = await response.blob();
															const downloadUrl = window.URL.createObjectURL(blob);
															const link = document.createElement('a');
															link.href = downloadUrl;
															link.download = file.filename || 'download';
															document.body.appendChild(link);
															link.click();
															document.body.removeChild(link);
															window.URL.revokeObjectURL(downloadUrl);
														} catch (error) {
															console.error('Error downloading file:', error);
															alert('Failed to download file. Please try again.');
														}
													};
													
													return (
														<a
															key={file.id}
															href={fileUrl}
															onClick={handleFileClick}
															target="_blank"
															rel="noopener noreferrer"
															className="text-blue-600 hover:underline text-sm cursor-pointer"
														>
															{file.filename}
														</a>
													);
												})}
											</div>
										</div>
									)}
								</div>
							)}
							
							{displayRefund.admin_question && (
								<div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
									<Typography variant="subtitle2" fontWeight="bold" className="mb-2">
										Admin Question:
									</Typography>
									<Typography variant="body2">
										{displayRefund.admin_question}
									</Typography>
								</div>
							)}
							
							<TextField
								fullWidth
								label="Admin Notes (Optional)"
								multiline
								rows={3}
								value={adminNotes}
								onChange={(e) => setAdminNotes(e.target.value)}
								placeholder="Internal notes"
								className="mt-4"
							/>
							<Alert severity="info" className="mt-4">
								The refund amount will be deducted from the vendor/supplier wallet balance automatically.
							</Alert>
						</div>
					)}
				</DialogContent>
				<DialogActions>
					<Button onClick={() => {
						setApproveDialogOpen(false);
						setSelectedRefundId(null);
					}}>Cancel</Button>
					<Button onClick={handleApprove} variant="contained" color="primary">
						Approve Refund
					</Button>
				</DialogActions>
			</Dialog>

			{/* Reject Dialog */}
			<Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)}>
				<DialogTitle>Reject Refund Request</DialogTitle>
				<DialogContent>
					{selectedRefund && (
						<div className="space-y-4 pt-4">
							<Typography>
								<strong>Customer:</strong> {selectedRefund.user?.name}
							</Typography>
							<Typography>
								<strong>Order #:</strong> {selectedRefund.order?.order_number ?? `#${selectedRefund.order_id}`}
							</Typography>
							<Typography>
								<strong>Amount:</strong> £{formatAmount(selectedRefund.requested_amount)}
							</Typography>
							<TextField
								fullWidth
								label="Rejection Reason"
								multiline
								rows={4}
								value={rejectionReason}
								onChange={(e) => setRejectionReason(e.target.value)}
								required
								placeholder="Please provide a reason for rejecting this refund request..."
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

export default RefundRequestsTable;


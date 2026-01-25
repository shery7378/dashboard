'use client';

import { useMemo, useState, useEffect } from 'react';
import { type MRT_ColumnDef } from 'material-react-table';
import DataTable from 'src/components/data-table/DataTable';
import { ListItemIcon, MenuItem, Paper, Typography, Chip, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert, IconButton } from '@mui/material';
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

// Helper function to normalize file paths - replaces localhost/127.0.0.1 with API URL from env
function normalizeFileUrl(filePath: string | undefined): string | null {
	if (!filePath) return null;
	
	// Get API URL from environment
	const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
	
	// Extract the base URL from the API URL (remove trailing slashes and ensure clean format)
	let apiBaseUrl = apiUrl.replace(/\/+$/, '');
	
	// Ensure apiBaseUrl doesn't have duplicate ports (clean it up)
	// Remove any trailing :port if it exists incorrectly
	apiBaseUrl = apiBaseUrl.replace(/:(\d+):(\d+)/, ':$1'); // Fix double ports like :8000:8000
	
	try {
		// Try to parse the URL to extract components
		const url = new URL(filePath);
		
		// Parse the API base URL to get its components
		const apiUrlObj = new URL(apiBaseUrl);
		
		// If it's localhost or 127.0.0.1, replace with API URL from env
		if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
			// Reconstruct URL with the API base URL, preserving path, search, and hash
			return `${apiUrlObj.protocol}//${apiUrlObj.host}${url.pathname}${url.search}${url.hash}`;
		}
		
		// If already using the correct domain, return as is
		return filePath;
	} catch (e) {
		// If URL parsing fails, try regex replacement as fallback
		// Match: protocol://host/path?query#hash
		const urlMatch = filePath.match(/^(https?:\/\/)([^\/]+)(\/.*)$/);
		
		if (urlMatch) {
			const [, protocol, host, path] = urlMatch;
			
			// Check if host is localhost or 127.0.0.1 (with or without port)
			if (host.startsWith('localhost') || host.startsWith('127.0.0.1')) {
				// Parse API base URL if possible
				try {
					const apiUrlObj = new URL(apiBaseUrl);
					return `${apiUrlObj.protocol}//${apiUrlObj.host}${path}`;
				} catch {
					// If parsing fails, use simple replacement
					// Extract just the host from apiBaseUrl
					const apiHostMatch = apiBaseUrl.match(/^https?:\/\/([^\/]+)/);
					if (apiHostMatch) {
						return `${protocol}${apiHostMatch[1]}${path}`;
					}
				}
			}
		}
		
		// If it's a relative path, make it absolute using the API URL
		if (filePath.startsWith('/')) {
			try {
				const apiUrlObj = new URL(apiBaseUrl);
				return `${apiUrlObj.protocol}//${apiUrlObj.host}${filePath}`;
			} catch {
				return `${apiBaseUrl}${filePath}`;
			}
		}
		
		// Return original if we can't normalize
		return filePath;
	}
}

// Component to display images with authentication
function ImageWithAuth({ fileId, filename, refundId, token, filePath }: { fileId: number; filename: string; refundId: number; token: string | null; filePath?: string }) {
	const [imageSrc, setImageSrc] = useState<string>('');
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);

	useEffect(() => {
		if (!token) {
			setError(true);
			setLoading(false);
			return;
		}

		const fetchImage = async () => {
			try {
				const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
				
				// Always use API endpoint to avoid CORS issues with storage URLs
				// The API endpoint properly handles authentication and CORS headers
				const url = `${apiUrl}/api/admin/refunds/${refundId}/download-attachment/${encodeURIComponent(filename)}`;

				const response = await fetch(url, {
					headers: {
						'Authorization': `Bearer ${token}`
					}
				});

				if (!response.ok) {
					throw new Error('Failed to fetch image');
				}

				// Always use blob URL for API responses
				const blob = await response.blob();
				const blobUrl = window.URL.createObjectURL(blob);
				setImageSrc(blobUrl);
				setLoading(false);
			} catch (err) {
				console.error('Error loading image:', err);
				setError(true);
				setLoading(false);
			}
		};

		fetchImage();

		// Cleanup
		return () => {
			if (imageSrc && imageSrc.startsWith('blob:')) {
				window.URL.revokeObjectURL(imageSrc);
			}
		};
	}, [fileId, filename, refundId, token, filePath]);

	if (loading) {
		return (
			<div className="w-full h-32 bg-gray-100 flex items-center justify-center">
				<Typography variant="caption" color="text.secondary">Loading...</Typography>
			</div>
		);
	}

	if (error || !imageSrc) {
		return (
			<div className="w-full h-32 bg-gray-100 flex items-center justify-center">
				<FuseSvgIcon className="text-gray-400">heroicons-outline:photograph</FuseSvgIcon>
			</div>
		);
	}

	return (
		<img
			src={imageSrc}
			alt={filename}
			className="w-full h-32 object-cover"
		/>
	);
}


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
	const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
	const [previewImageUrl, setPreviewImageUrl] = useState<string>('');
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

		// Check if refund can be rejected (must be pending status)
		if (selectedRefund.status !== 'pending') {
			alert(`This refund request cannot be rejected. Current status: ${selectedRefund.status.toUpperCase()}. Only pending refund requests can be rejected.`);
			return;
		}

		// Validate minimum length (backend requires min 10 characters)
		if (rejectionReason.trim().length < 10) {
			alert('Rejection reason must be at least 10 characters long.');
			return;
		}

		// Validate maximum length (backend requires max 1000 characters)
		if (rejectionReason.trim().length > 1000) {
			alert('Rejection reason must be less than 1000 characters.');
			return;
		}

		try {
			await rejectRefund({
				id: selectedRefund.id,
				admin_notes: rejectionReason.trim()
			}).unwrap();
			setRejectDialogOpen(false);
			setSelectedRefund(null);
			setRejectionReason('');
		} catch (err: any) {
			console.error('Failed to reject refund:', err);
			console.error('Error details:', JSON.stringify(err, null, 2));
			
			// Show user-friendly error message
			let errorMessage = 'Failed to reject refund. Please try again.';
			
			if (err?.data) {
				if (err.data.message) {
					errorMessage = err.data.message;
				} else if (err.data.errors) {
					// Show validation errors
					const errorMessages = Object.values(err.data.errors).flat().join('\n');
					errorMessage = errorMessages || errorMessage;
				} else if (err.data.status === 400) {
					errorMessage = err.data.message || 'This refund request cannot be rejected. It may have already been processed or is in an invalid state.';
				}
			} else if (err?.message) {
				errorMessage = err.message;
			}
			
			alert(errorMessage);
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
									<Typography component="div">
										<strong>Status:</strong> <Chip
											label={displayRefund.status.toUpperCase()}
											color={getStatusColor(displayRefund.status) as any}
											size="small"
											sx={{ ml: 1, verticalAlign: 'middle' }}
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
											<div className="flex flex-wrap gap-3">
												{displayRefund.attachment_files.map((file: any) => {
													// Get token from session or localStorage
													const token = getAuthToken();
													const isImage = file.filename?.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);

													const handleFileClick = async (e: React.MouseEvent) => {
														e.preventDefault();
														
														if (!token) {
															alert('Authentication required. Please log in again.');
															return;
														}

														try {
															const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
															let url = '';
															
															// Normalize file path if available
															const normalizedPath = normalizeFileUrl(file.path);
															
															if (normalizedPath) {
																// Add token to normalized path
																const separator = normalizedPath.includes('?') ? '&' : '?';
																url = `${normalizedPath}${separator}token=${encodeURIComponent(token)}`;
																
																// For images, try direct URL first
																if (isImage) {
																	setPreviewImageUrl(url);
																	setImagePreviewOpen(true);
																	return;
																} else {
																	// For other files, try to download via fetch first, then fallback to direct
																	try {
																		const response = await fetch(url, {
																			headers: {
																				'Authorization': `Bearer ${token}`
																			}
																		});
																		
																		if (response.ok) {
																			const blob = await response.blob();
																			const blobUrl = window.URL.createObjectURL(blob);
																			const link = document.createElement('a');
																			link.href = blobUrl;
																			link.download = file.filename || 'download';
																			document.body.appendChild(link);
																			link.click();
																			document.body.removeChild(link);
																			window.URL.revokeObjectURL(blobUrl);
																			return;
																		}
																	} catch (fetchError) {
																		// Fallback to direct URL
																		window.open(url, '_blank');
																		return;
																	}
																}
															}
															
															// Fallback to API endpoint if no path or if direct failed
															const filename = encodeURIComponent(file.filename || 'file');
															url = `${apiUrl}/api/admin/refunds/${displayRefund.id}/download-attachment/${filename}`;

															const response = await fetch(url, {
																headers: {
																	'Authorization': `Bearer ${token}`
																}
															});

															if (!response.ok) {
																throw new Error('Failed to fetch file');
															}

															const blob = await response.blob();
															const blobUrl = window.URL.createObjectURL(blob);

															if (isImage) {
																setPreviewImageUrl(blobUrl);
																setImagePreviewOpen(true);
															} else {
																const link = document.createElement('a');
																link.href = blobUrl;
																link.download = file.filename || 'download';
																document.body.appendChild(link);
																link.click();
																document.body.removeChild(link);
																window.URL.revokeObjectURL(blobUrl);
															}
														} catch (error) {
															console.error('Error fetching file:', error);
															alert('Failed to load file. Please try again.');
														}
													};

													// Render image thumbnail or file link
													if (isImage) {
														return (
															<div
																key={file.id}
																onClick={handleFileClick}
																className="cursor-pointer border-2 border-blue-200 rounded-lg overflow-hidden hover:border-blue-400 transition-all shadow-sm hover:shadow-md"
																style={{ width: '150px' }}
															>
																<ImageWithAuth
																	fileId={file.id}
																	filename={file.filename}
																	refundId={displayRefund.id}
																	token={token}
																filePath={file.path}
																/>
																<div className="p-2 bg-white">
																	<Typography variant="caption" className="text-gray-600 block truncate">
																		{file.filename}
																	</Typography>
																</div>
															</div>
														);
													} else {
														return (
															<a
																key={file.id}
																href="#"
																onClick={handleFileClick}
																className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer"
																style={{ minWidth: '150px' }}
															>
																<FuseSvgIcon className="text-gray-600">heroicons-outline:document</FuseSvgIcon>
																<Typography variant="body2" className="text-gray-700 truncate flex-1">
																	{file.filename}
																</Typography>
															</a>
														);
													}
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

													// Normalize file path and append token if needed
													const normalizedPath = normalizeFileUrl(file.path);
													let fileUrl = normalizedPath || file.path || '';
													
													if (token && fileUrl) {
														const separator = fileUrl.includes('?') ? '&' : '?';
														fileUrl = `${fileUrl}${separator}token=${encodeURIComponent(token)}`;
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
															const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
															const isImage = file.filename?.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);
															
															// Try using normalized file path first if available
															const normalizedPath = normalizeFileUrl(file.path);
															
															if (normalizedPath) {
																const separator = normalizedPath.includes('?') ? '&' : '?';
																const url = `${normalizedPath}${separator}token=${encodeURIComponent(token)}`;
																
																if (isImage) {
																	// For images, try direct URL
																	setPreviewImageUrl(url);
																	setImagePreviewOpen(true);
																	return;
																} else {
																	// For other files, try fetch first, then fallback to direct
																	try {
																		const response = await fetch(url, {
																			headers: {
																				'Authorization': `Bearer ${token}`
																			}
																		});
																		
																		if (response.ok) {
																			const blob = await response.blob();
																			const blobUrl = window.URL.createObjectURL(blob);
																			const link = document.createElement('a');
																			link.href = blobUrl;
																			link.download = file.filename || 'download';
																			document.body.appendChild(link);
																			link.click();
																			document.body.removeChild(link);
																			window.URL.revokeObjectURL(blobUrl);
																			return;
																		}
																	} catch (fetchError) {
																		// Fallback to direct URL or API endpoint
																	}
																}
															}
															
															// Fallback to API endpoint
															const filename = encodeURIComponent(file.filename || file.path?.split('/').pop() || 'file');
															const url = `${apiUrl}/api/admin/refunds/${displayRefund.id}/download-attachment/${filename}`;

															const response = await fetch(url, {
																headers: {
																	'Authorization': `Bearer ${token}`
																}
															});

															if (!response.ok) {
																throw new Error('Failed to fetch file');
															}

															const blob = await response.blob();
															const blobUrl = window.URL.createObjectURL(blob);

															if (isImage) {
																setPreviewImageUrl(blobUrl);
																setImagePreviewOpen(true);
															} else {
																const link = document.createElement('a');
																link.href = blobUrl;
																link.download = file.filename || 'download';
																document.body.appendChild(link);
																link.click();
																document.body.removeChild(link);
																window.URL.revokeObjectURL(blobUrl);
															}
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
							{selectedRefund.status !== 'pending' && (
								<Alert severity="warning" sx={{ mb: 2 }}>
									This refund request has status: <strong>{selectedRefund.status.toUpperCase()}</strong>. Only pending refund requests can be rejected.
								</Alert>
							)}
							<Typography>
								<strong>Customer:</strong> {selectedRefund.user?.name}
							</Typography>
							<Typography>
								<strong>Order #:</strong> {selectedRefund.order?.order_number ?? `#${selectedRefund.order_id}`}
							</Typography>
							<Typography>
								<strong>Amount:</strong> £{formatAmount(selectedRefund.requested_amount)}
							</Typography>
							<Typography component="div">
								<strong>Status:</strong> <Chip label={selectedRefund.status.toUpperCase()} color={getStatusColor(selectedRefund.status) as any} size="small" sx={{ ml: 1 }} />
							</Typography>
							<TextField
								fullWidth
								label="Rejection Reason"
								multiline
								rows={4}
								value={rejectionReason}
								onChange={(e) => setRejectionReason(e.target.value)}
								required
								placeholder="Please provide a reason for rejecting this refund request (minimum 10 characters)..."
								helperText={`${rejectionReason.length}/1000 characters (minimum 10 required)`}
								error={rejectionReason.trim().length > 0 && rejectionReason.trim().length < 10}
								inputProps={{ maxLength: 1000 }}
								disabled={selectedRefund.status !== 'pending'}
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
						disabled={
							selectedRefund?.status !== 'pending' ||
							!rejectionReason.trim() || 
							rejectionReason.trim().length < 10 || 
							rejectionReason.trim().length > 1000
						}
					>
						Reject
					</Button>
				</DialogActions>
			</Dialog>

			{/* Image Preview Modal */}
			<Dialog
				open={imagePreviewOpen}
				onClose={() => {
					setImagePreviewOpen(false);
					if (previewImageUrl) {
						window.URL.revokeObjectURL(previewImageUrl);
					}
					setPreviewImageUrl('');
				}}
				maxWidth="lg"
				fullWidth
			>
				<DialogTitle>
					Attachment Preview
					<IconButton
						onClick={() => {
							setImagePreviewOpen(false);
							if (previewImageUrl) {
								window.URL.revokeObjectURL(previewImageUrl);
							}
							setPreviewImageUrl('');
						}}
						sx={{ position: 'absolute', right: 8, top: 8 }}
					>
						<FuseSvgIcon>heroicons-outline:x</FuseSvgIcon>
					</IconButton>
				</DialogTitle>
				<DialogContent>
					{previewImageUrl && (
						<div className="flex items-center justify-center p-4">
							<img
								src={previewImageUrl}
								alt="Attachment preview"
								style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }}
							/>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</>
	);
}

export default RefundRequestsTable;


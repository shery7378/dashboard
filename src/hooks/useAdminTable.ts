'use client';

import { useState, useCallback } from 'react';
import { useSnackbar } from 'notistack';
import { type MRT_TableInstance } from 'material-react-table';

interface UseAdminTableOptions {
	deleteMutation: any;
	entityName?: string;
}

/**
 * A reusable hook to manage common state and logic for Admin/App tables.
 * Handles pagination, row selection deletion, and success/error notifications.
 */
export function useAdminTable({
	deleteMutation,
	entityName = 'item',
}: UseAdminTableOptions) {
	const { enqueueSnackbar } = useSnackbar();
	
	const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 15 });
	const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
	const [deleteIds, setDeleteIds] = useState<string[]>([]);
	const [isDeleting, setIsDeleting] = useState(false);
	const [tableInstance, setTableInstance] = useState<MRT_TableInstance<any> | null>(null);
	const [successDialogOpen, setSuccessDialogOpen] = useState(false);
	const [successMessage, setSuccessMessage] = useState('');

	const handleCloseSuccessDialog = useCallback(() => {
		setSuccessDialogOpen(false);
		setSuccessMessage('');
	}, []);

	const handleCloseConfirmDialog = useCallback(() => {
		setConfirmDialogOpen(false);
		setDeleteIds([]);
		setTableInstance(null);
	}, []);

	const handleRemoveConfirmed = useCallback(async () => {
		setIsDeleting(true);
		try {
			const results = await Promise.allSettled(deleteIds.map((id) => deleteMutation(id)));
			const succeeded = results.filter((r) => r.status === 'fulfilled').length;
			const failed = results.filter((r) => r.status === 'rejected').length;

			if (succeeded > 0) {
				const message = succeeded === 1 
					? `${entityName} deleted successfully` 
					: `${succeeded} ${entityName}s deleted successfully`;
				
				enqueueSnackbar(message, { variant: 'success' });
				setSuccessMessage(message);
				setSuccessDialogOpen(true);
				tableInstance?.resetRowSelection();
			}
			if (failed > 0) {
				enqueueSnackbar(`${failed} deletion(s) failed`, { variant: 'error' });
			}
		} catch (err: any) {
			enqueueSnackbar(err?.data?.message || err?.message || 'Deletion failed', { variant: 'error' });
		} finally {
			setIsDeleting(false);
			setConfirmDialogOpen(false);
			setDeleteIds([]);
			setTableInstance(null);
		}
	}, [deleteIds, deleteMutation, enqueueSnackbar, entityName, tableInstance]);

	const openDeleteDialog = useCallback((ids: string[], table?: MRT_TableInstance<any>) => {
		setDeleteIds(ids);
		setConfirmDialogOpen(true);
		if (table) setTableInstance(table);
	}, []);

	return {
		pagination,
		setPagination,
		confirmDialogOpen,
		setConfirmDialogOpen,
		deleteIds,
		isDeleting,
		handleCloseSuccessDialog,
		handleCloseConfirmDialog,
		handleRemoveConfirmed,
		openDeleteDialog,
		successDialogOpen,
		successMessage,
	};
}

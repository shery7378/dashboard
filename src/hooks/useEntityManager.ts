// src/hooks/useEntityManager.ts
import { useState } from 'react';
import { useSnackbar, OptionsObject } from 'notistack';

type EntityOptions<T> = {
	ids?: T[];
	id?: T;
	action: (id: T) => Promise<any>;
	bulkAction?: (ids: T[]) => Promise<any>; // Optional bulk action for multiple IDs
	entityLabel?: string;
	actionLabel?: string;
	confirmTitle?: string;
	confirmMessage?: string;
	onSuccess?: (count: number) => void;
	onError?: (count: number, errors: any[]) => void;
	onCancel?: () => void;
	snackbarOptions?: OptionsObject;
};

export const useEntityManager = () => {
	const { enqueueSnackbar } = useSnackbar();
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [pendingOptions, setPendingOptions] = useState<EntityOptions<any> | null>(null);
	const [loading, setLoading] = useState(false);
	const [successMessage, setSuccessMessage] = useState('');

	const runAction = async <T>({
		ids = [],
		action,
		bulkAction,
		entityLabel = 'item',
		actionLabel = 'processed',
		onSuccess,
		onError,
		snackbarOptions
	}: EntityOptions<T>) => {
		if (ids.length === 0) {
			enqueueSnackbar(`No ${entityLabel} selected`, { variant: 'warning', ...snackbarOptions });
			return { succeeded: 0, failed: 0, results: [] };
		}

		setLoading(true);
		try {
			let results: PromiseSettledResult<any>[] = [];
			let succeeded = 0;
			let failed = 0;

			if (bulkAction && ids.length > 1) {
				// Use bulk action for multiple IDs
				try {
					await bulkAction(ids);
					succeeded = ids.length;
					results = ids.map(() => ({ status: 'fulfilled' as const, value: undefined }));
				} catch (error) {
					failed = ids.length;
					results = ids.map(() => ({ status: 'rejected' as const, reason: error }));
				}
			} else {
				// Use individual actions for single ID or when bulkAction is not provided
				results = await Promise.allSettled(ids.map((id) => action(id)));
				succeeded = results.filter((r) => r.status === 'fulfilled').length;
				failed = results.filter((r) => r.status === 'rejected').length;
			}

			const errors = results
				.filter((r) => r.status === 'rejected')
				.map((r) => (r as PromiseRejectedResult).reason);

			if (succeeded > 0) {
				const message =
					succeeded === 1
						? `${entityLabel} ${actionLabel} successfully`
						: `${succeeded} ${entityLabel}s ${actionLabel} successfully`;
				enqueueSnackbar(message, { variant: 'success', ...snackbarOptions });
				setSuccessMessage(message);
				onSuccess?.(succeeded);
			}

			if (failed > 0) {
				enqueueSnackbar(`${failed} ${entityLabel}(s) failed to be ${actionLabel}`, {
					variant: 'error',
					...snackbarOptions
				});
				onError?.(failed, errors);
			}

			return { succeeded, failed, results };
		} finally {
			setLoading(false);
		}
	};

	const requestAction = <T>(options: EntityOptions<T>) => {
		setPendingOptions(options);
		setConfirmOpen(true);
	};

	const confirmAction = async () => {
		if (pendingOptions) {
			await runAction({
				...pendingOptions,
				ids: pendingOptions.id ? [pendingOptions.id] : pendingOptions.ids
			});
			setConfirmOpen(false);
			setPendingOptions(null);
		}
	};

	const cancelAction = () => {
		pendingOptions?.onCancel?.();
		setConfirmOpen(false);
		setPendingOptions(null);
	};

	const clearSuccessMessage = () => {
		setSuccessMessage('');
	};

	return {
		confirmOpen,
		confirmTitle: pendingOptions?.confirmTitle || 'Confirm Action',
		confirmMessage:
			pendingOptions?.confirmMessage ||
			`Are you sure you want to ${pendingOptions?.actionLabel || 'perform this action'}?`,
		loading,
		successMessage,
		clearSuccessMessage,
		requestAction,
		confirmAction,
		cancelAction
	};
};

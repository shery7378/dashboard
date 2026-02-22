'use client';

import { Dialog, DialogTitle, DialogContent, DialogActions, Typography, Button } from '@mui/material';
import { motion } from 'framer-motion';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

interface SuccessDialogProps {
	open: boolean;
	onClose: () => void;
	message?: string | null;
	title?: string;
}

export function SuccessDialog({
	open,
	onClose,
	message = 'Operation completed successfully',
	title = 'Success!'
}: SuccessDialogProps) {
	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="xs"
			fullWidth
			PaperProps={{
				sx: {
					borderRadius: 3,
					p: 2,
					textAlign: 'center'
				}
			}}
		>
			<DialogTitle sx={{ textAlign: 'center', p: 1 }}>
				<motion.div
					initial={{ scale: 0, rotate: -90 }}
					animate={{ scale: 1, rotate: 0 }}
					transition={{ type: 'spring', stiffness: 200, damping: 10 }}
					style={{ display: 'inline-block' }}
				>
					<CheckCircleIcon sx={{ fontSize: 60, color: 'secondary.main' }} />
				</motion.div>
			</DialogTitle>

			<DialogContent>
				<Typography
					variant="h6"
					gutterBottom
				>
					{title}
				</Typography>
				<Typography
					variant="body2"
					color="text.secondary"
				>
					{message}
				</Typography>
			</DialogContent>

			<DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
				<Button
					onClick={onClose}
					variant="contained"
					color="secondary"
				>
					Close
				</Button>
			</DialogActions>
		</Dialog>
	);
}

interface ConfirmDialogProps {
	open: boolean;
	onClose: () => void;
	onConfirm: () => void;
	isDeleting: boolean;
	title?: string;
	message?: string;
}

export function ConfirmDialog({
	open,
	onClose,
	onConfirm,
	isDeleting,
	title = 'Are you sure?',
	message = 'This action cannot be undone. Deleting this item will permanently remove all of its data.'
}: ConfirmDialogProps) {
	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="xs"
			fullWidth
			PaperProps={{
				sx: { borderRadius: 3, p: 2, textAlign: 'center' }
			}}
		>
			<DialogTitle sx={{ textAlign: 'center', p: 1 }}>
				<motion.div
					initial={{ scale: 0, rotate: -90 }}
					animate={{ scale: 1, rotate: 0 }}
					transition={{ type: 'spring', stiffness: 200, damping: 10 }}
					style={{ display: 'inline-block' }}
				>
					<WarningAmberIcon sx={{ fontSize: 60, color: 'error.main' }} />
				</motion.div>
			</DialogTitle>

			<DialogContent>
				<Typography
					variant="h6"
					gutterBottom
				>
					{title}
				</Typography>
				<Typography
					variant="body2"
					color="text.secondary"
				>
					{message}
				</Typography>
			</DialogContent>

			<DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
				<Button
					onClick={onClose}
					variant="outlined"
					color="inherit"
				>
					Cancel
				</Button>
				<Button
					onClick={onConfirm}
					variant="contained"
					color="error"
					disabled={isDeleting}
				>
					{isDeleting ? 'Removing...' : 'Delete'}
				</Button>
			</DialogActions>
		</Dialog>
	);
}

interface WarningDialogProps {
	open: boolean;
	onClose: () => void;
	onConfirm: () => void;
	isLoading?: boolean;
	title?: string;
	message?: string;
	confirmText?: string;
	cancelText?: string;
}

export function WarningDialog({
	open,
	onClose,
	onConfirm,
	isLoading = false,
	title = 'Are you sure?',
	message = 'This action cannot be undone.',
	confirmText = 'Confirm',
	cancelText = 'Cancel'
}: WarningDialogProps) {
	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="xs"
			fullWidth
			PaperProps={{
				sx: { borderRadius: 3, p: 2, textAlign: 'center' }
			}}
		>
			<DialogTitle sx={{ textAlign: 'center', p: 1 }}>
				<motion.div
					initial={{ scale: 0, rotate: -90 }}
					animate={{ scale: 1, rotate: 0 }}
					transition={{ type: 'spring', stiffness: 200, damping: 10 }}
					style={{ display: 'inline-block' }}
				>
					<WarningAmberIcon sx={{ fontSize: 60, color: 'warning.main' }} />
				</motion.div>
			</DialogTitle>

			<DialogContent>
				<Typography
					variant="h6"
					gutterBottom
				>
					{title}
				</Typography>
				<Typography
					variant="body2"
					color="text.secondary"
				>
					{message}
				</Typography>
			</DialogContent>

			<DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
				<Button
					onClick={onClose}
					variant="outlined"
					color="inherit"
				>
					{cancelText}
				</Button>
				<Button
					onClick={onConfirm}
					variant="contained"
					color="warning"
					disabled={isLoading}
				>
					{isLoading ? 'Updating...' : confirmText}
				</Button>
			</DialogActions>
		</Dialog>
	);
}

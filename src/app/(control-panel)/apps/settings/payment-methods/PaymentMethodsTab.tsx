'use client';

import { useState, useEffect } from 'react';
import {
	Box,
	Card,
	CardContent,
	Typography,
	Button,
	TextField,
	Switch,
	FormControlLabel,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Alert,
	CircularProgress,
	IconButton,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Paper,
	Chip,
} from '@mui/material';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { useSnackbar } from 'notistack';
import axios from 'axios';
import { getSession } from 'next-auth/react';

interface PaymentCredential {
	id?: number;
	payment_method: string;
	name: string;
	is_active: boolean;
	is_test_mode: boolean;
	credentials: Record<string, string>;
	description?: string;
	credential_keys?: string[];
	has_credentials?: boolean;
	logo_id?: number;
	logo_url?: string;
}

// Payment methods are now fetched from the database via API

interface AvailablePaymentMethod {
	payment_method: string;
	name: string;
	description: string;
	default_credentials: Record<string, string>;
	is_configured?: boolean;
}

function PaymentMethodsTab() {
	const { enqueueSnackbar } = useSnackbar();
	const [credentials, setCredentials] = useState<PaymentCredential[]>([]);
	const [availablePaymentMethods, setAvailablePaymentMethods] = useState<AvailablePaymentMethod[]>([]);
	const [loading, setLoading] = useState(true);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingCredential, setEditingCredential] = useState<PaymentCredential | null>(null);
	const [formData, setFormData] = useState<PaymentCredential>({
		payment_method: '',
		name: '',
		is_active: true,
		is_test_mode: false,
		credentials: {},
		description: '',
	});
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [logoFile, setLogoFile] = useState<File | null>(null);
	const [logoPreview, setLogoPreview] = useState<string | null>(null);
	const [removeLogo, setRemoveLogo] = useState(false);

	const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

	useEffect(() => {
		console.log('=== PaymentMethodsTab Component Mounted ===');
		console.log('API URL:', apiUrl);
		fetchAvailablePaymentMethods();
		fetchCredentials();
	}, []);

	const fetchAvailablePaymentMethods = async () => {
		console.log('=== FETCHING PAYMENT METHODS FROM DATABASE ===');
		try {
			// Fetch CSRF cookie first
			await axios.get(`${apiUrl}/sanctum/csrf-cookie`, {
				withCredentials: true,
			});
			
			// Get token from session or localStorage
			const session = await getSession();
			const token = session?.accessAuthToken || 
				session?.accessToken || 
				(typeof window !== 'undefined' ? localStorage.getItem('token') || localStorage.getItem('auth_token') : null);
			
			console.log('Token found:', token ? 'YES' : 'NO');
			
			if (!token) {
				console.error('No authentication token found');
				enqueueSnackbar('Authentication required. Please log in again.', { variant: 'error' });
				return;
			}

			const apiEndpoint = `${apiUrl}/api/admin/payment-method-credentials/available`;
			console.log('Calling API endpoint:', apiEndpoint);

			const response = await axios.get(apiEndpoint, {
				headers: {
					Authorization: `Bearer ${token}`,
					Accept: 'application/json',
					'Content-Type': 'application/json',
				},
				withCredentials: true,
			});

			console.log('API Response Status:', response.status);
			console.log('API Response Data:', JSON.stringify(response.data, null, 2));

			if (response.data.success) {
				const methods = response.data.data || [];
				console.log('Successfully loaded payment methods from database:', methods.length, 'methods');
				console.log('Methods:', methods.map(m => m.name).join(', '));
				setAvailablePaymentMethods(methods);
			} else {
				console.error('API returned unsuccessful response:', response.data);
				enqueueSnackbar('Failed to load payment methods from database.', { variant: 'error' });
			}
		} catch (error: any) {
			console.error('=== ERROR FETCHING PAYMENT METHODS ===');
			console.error('Error object:', error);
			console.error('Error response:', error.response?.data);
			console.error('Error status:', error.response?.status);
			console.error('Error message:', error.message);
			console.error('Error config:', error.config);
			
			// Show error but don't set empty array - let user know there's an issue
			if (error.response?.status === 401 || error.response?.status === 403) {
				enqueueSnackbar('Authentication failed. Please log in again.', { variant: 'error' });
			} else {
				enqueueSnackbar(`Failed to load available payment methods: ${error.message || 'Unknown error'}. Please refresh the page.`, { variant: 'error' });
			}
			// Keep empty array so user sees "Loading payment methods..." in dropdown
		}
	};

	const fetchCredentials = async () => {
		try {
			setLoading(true);
			
			// Fetch CSRF cookie first (required for Sanctum)
			await axios.get(`${apiUrl}/sanctum/csrf-cookie`, {
				withCredentials: true,
			});
			
			// Get token from session or localStorage (same pattern as apiServiceLaravel)
			const session = await getSession();
			const token = session?.accessAuthToken || 
				session?.accessToken || 
				(typeof window !== 'undefined' ? localStorage.getItem('token') || localStorage.getItem('auth_token') : null);
			
			if (!token) {
				enqueueSnackbar('Authentication required. Please log in again.', { variant: 'error' });
				setLoading(false);
				return;
			}

			console.log('Fetching payment credentials with token:', token ? `${token.substring(0, 20)}...` : 'none');

			const response = await axios.get(`${apiUrl}/api/admin/payment-method-credentials`, {
				headers: {
					Authorization: `Bearer ${token}`,
					Accept: 'application/json',
					'Content-Type': 'application/json',
				},
				withCredentials: true,
			});

			if (response.data.success) {
				const data = response.data.data || [];
				// Ensure all required fields are present
				const formattedData = data.map((item: any) => ({
					id: item.id,
					payment_method: item.payment_method || '',
					name: item.name || '',
					is_active: item.is_active ?? true,
					is_test_mode: item.is_test_mode ?? false,
					credentials: item.credentials || {},
					description: item.description || '',
					credential_keys: item.credential_keys || [],
					has_credentials: item.has_credentials || false,
					logo_id: item.logo_id,
					logo_url: item.logo_url,
				}));
				setCredentials(formattedData);
			}
		} catch (error: any) {
			console.error('Error fetching credentials:', error);
			console.error('Error response:', error.response?.data);
			console.error('Error status:', error.response?.status);
			
			if (error.response?.status === 401) {
				enqueueSnackbar('Authentication failed. Please log in again.', { variant: 'error' });
			} else if (error.response?.status === 403) {
				enqueueSnackbar('Access denied. Admin privileges required.', { variant: 'error' });
			} else {
				const errorMessage = error.response?.data?.message || 'Failed to fetch payment credentials';
				enqueueSnackbar(errorMessage, { variant: 'error' });
			}
		} finally {
			setLoading(false);
		}
	};

	const handleOpenDialog = (credential?: PaymentCredential) => {
		if (credential) {
			// Fetch full credential details for editing
			fetchCredentialDetails(credential.id!);
			setEditingCredential(credential);
			// Don't reset logoFile here - let fetchCredentialDetails set it
		} else {
			// For new credentials, ensure payment methods are loaded
			if (availablePaymentMethods.length === 0) {
				enqueueSnackbar('Loading payment methods...', { variant: 'info' });
				fetchAvailablePaymentMethods();
			}
			setEditingCredential(null);
			setFormData({
				payment_method: '',
				name: '',
				is_active: true,
				is_test_mode: false,
				credentials: {},
				description: '',
			});
			setLogoFile(null);
			setLogoPreview(null);
			setRemoveLogo(false);
		}
		setDialogOpen(true);
		setErrors({});
	};

	const fetchCredentialDetails = async (id: number) => {
		try {
			// Get token from session or localStorage
			const session = await getSession();
			const token = session?.accessAuthToken || 
				session?.accessToken || 
				(typeof window !== 'undefined' ? localStorage.getItem('token') || localStorage.getItem('auth_token') : null);
			
			if (!token) {
				enqueueSnackbar('Authentication required. Please log in again.', { variant: 'error' });
				return;
			}

			const response = await axios.get(`${apiUrl}/api/admin/payment-method-credentials/${id}`, {
				headers: {
					Authorization: `Bearer ${token}`,
					Accept: 'application/json',
					'Content-Type': 'application/json',
				},
				withCredentials: true,
			});

			if (response.data.success) {
				const data = response.data.data;
				setFormData({
					id: data.id,
					payment_method: data.payment_method || '',
					name: data.name || '',
					is_active: data.is_active ?? true,
					is_test_mode: data.is_test_mode ?? false,
					credentials: data.credentials || {},
					description: data.description || '',
					logo_id: data.logo_id,
					logo_url: data.logo_url,
				});
				// Set logo preview if logo exists
				if (data.logo_url) {
					setLogoPreview(data.logo_url);
				} else {
					setLogoPreview(null);
				}
				setRemoveLogo(false);
			}
		} catch (error: any) {
			console.error('Error fetching credential details:', error);
			enqueueSnackbar('Failed to fetch credential details', { variant: 'error' });
		}
	};

	const handleCloseDialog = () => {
		setDialogOpen(false);
		setEditingCredential(null);
		setFormData({
			payment_method: '',
			name: '',
			is_active: true,
			is_test_mode: false,
			credentials: {},
			description: '',
		});
		setErrors({});
		setLogoFile(null);
		setLogoPreview(null);
		setRemoveLogo(false);
	};

	const handleInputChange = (field: string, value: any) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));
		if (errors[field]) {
			setErrors((prev) => {
				const newErrors = { ...prev };
				delete newErrors[field];
				return newErrors;
			});
		}
	};

	const handleCredentialChange = (key: string, value: string) => {
		setFormData((prev) => ({
			...prev,
			credentials: {
				...prev.credentials,
				[key]: value,
			},
		}));
	};

	const getDefaultCredentials = (paymentMethod: string) => {
		const method = availablePaymentMethods.find((m) => m.payment_method === paymentMethod);
		return method?.default_credentials || {};
	};

	const handlePaymentMethodChange = (paymentMethod: string) => {
		console.log('Payment method changed to:', paymentMethod);
		const method = availablePaymentMethods.find((m) => m.payment_method === paymentMethod);
		if (method) {
			const defaultCreds = getDefaultCredentials(paymentMethod);
			console.log('Setting form data with payment method:', paymentMethod, 'and default credentials:', defaultCreds);
			setFormData((prev) => {
				const newData = {
					...prev,
					payment_method: paymentMethod, // Ensure payment_method is explicitly set
					name: method.name,
					description: method.description,
					credentials: { ...defaultCreds, ...prev.credentials },
				};
				console.log('New form data:', newData);
				return newData;
			});
			// Clear any payment_method errors
			if (errors.payment_method) {
				setErrors((prev) => {
					const newErrors = { ...prev };
					delete newErrors.payment_method;
					return newErrors;
				});
			}
		} else {
			console.warn('Payment method not found:', paymentMethod);
		}
	};

	const validateForm = (): boolean => {
		const newErrors: Record<string, string> = {};

		if (!formData.payment_method) {
			newErrors.payment_method = 'Payment method is required';
		}
		if (!formData.name) {
			newErrors.name = 'Name is required';
		}
		if (Object.keys(formData.credentials).length === 0) {
			newErrors.credentials = 'At least one credential is required';
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		console.log('File selected:', file ? { name: file.name, size: file.size, type: file.type } : 'none');
		if (file) {
			// Validate file type
			if (!file.type.startsWith('image/')) {
				enqueueSnackbar('Please select an image file', { variant: 'error' });
				return;
			}
			// Validate file size (2MB)
			if (file.size > 2 * 1024 * 1024) {
				enqueueSnackbar('Image size must be less than 2MB', { variant: 'error' });
				return;
			}
			console.log('Setting logo file state');
			setLogoFile(file);
			setRemoveLogo(false);
			// Create preview
			const reader = new FileReader();
			reader.onloadend = () => {
				setLogoPreview(reader.result as string);
				console.log('Logo preview set');
			};
			reader.readAsDataURL(file);
		} else {
			console.log('No file selected');
		}
	};

	const handleRemoveLogo = () => {
		setLogoFile(null);
		setLogoPreview(null);
		setRemoveLogo(true);
	};

	const handleSubmit = async () => {
		if (!validateForm()) {
			return;
		}

		try {
			// Get token from session or localStorage
			const session = await getSession();
			const token = session?.accessAuthToken || 
				session?.accessToken || 
				(typeof window !== 'undefined' ? localStorage.getItem('token') || localStorage.getItem('auth_token') : null);
			
			if (!token) {
				enqueueSnackbar('Authentication required. Please log in again.', { variant: 'error' });
				return;
			}

			const url = editingCredential
				? `${apiUrl}/api/admin/payment-method-credentials/${editingCredential.id}`
				: `${apiUrl}/api/admin/payment-method-credentials`;

			// Always use FormData when editing (to handle logo properly) or when creating with logo
			// When creating without logo, use JSON for simplicity
			const shouldUseFormData = editingCredential || logoFile || removeLogo;
			
			console.log('Submitting form:', {
				shouldUseFormData,
				logoFile: logoFile ? { name: logoFile.name, size: logoFile.size, type: logoFile.type } : null,
				removeLogo,
				editingCredential: !!editingCredential,
			});
			
			if (shouldUseFormData) {
				// Use FormData for file upload
				const formDataToSend = new FormData();
				formDataToSend.append('name', formData.name || '');
				formDataToSend.append('is_active', formData.is_active ? '1' : '0');
				formDataToSend.append('is_test_mode', formData.is_test_mode ? '1' : '0');
				formDataToSend.append('description', formData.description || '');
				
				// Add credentials as JSON string
				formDataToSend.append('credentials', JSON.stringify(formData.credentials || {}));
				
				// Only include payment_method for new records
				if (!editingCredential) {
					formDataToSend.append('payment_method', formData.payment_method || '');
				}
				
				// Add logo file or remove flag
				// Only append logo if it's a new file (logoFile exists)
				// Only append remove_logo if explicitly set
				// If neither, don't append anything (keeps existing logo)
				if (logoFile) {
					console.log('Appending logo file to FormData:', {
						name: logoFile.name,
						size: logoFile.size,
						type: logoFile.type,
						lastModified: logoFile.lastModified
					});
					formDataToSend.append('logo', logoFile);
					
					// Verify it was added - log all FormData entries
					const entries: string[] = [];
					for (const [key, value] of formDataToSend.entries()) {
						if (value instanceof File) {
							entries.push(`${key}: File(${value.name}, ${value.size} bytes)`);
						} else {
							entries.push(`${key}: ${value}`);
						}
					}
					console.log('FormData contents:', entries);
				} else if (removeLogo && editingCredential) {
					console.log('Appending remove_logo flag');
					formDataToSend.append('remove_logo', '1');
				} else {
					console.log('No logo file or remove flag - keeping existing logo (if any)');
				}

				// Don't set Content-Type header - let axios set it automatically with boundary
				const config = {
					headers: {
						Authorization: `Bearer ${token}`,
						Accept: 'application/json',
						// Remove Content-Type - axios will set it with boundary for FormData
					},
					withCredentials: true,
				};

				console.log('Sending FormData request');
				// Use POST with _method=PUT for file uploads (PUT doesn't work well with multipart/form-data)
				let response;
				if (editingCredential) {
					formDataToSend.append('_method', 'PUT');
					response = await axios.post(url, formDataToSend, config);
				} else {
					response = await axios.post(url, formDataToSend, config);
				}

				if (response.data.success) {
					enqueueSnackbar(
						editingCredential
							? 'Payment credentials updated successfully'
							: 'Payment credentials created successfully',
						{ variant: 'success' }
					);
					handleCloseDialog();
					fetchCredentials();
				}

				if (response.data.success) {
					enqueueSnackbar(
						editingCredential
							? 'Payment credentials updated successfully'
							: 'Payment credentials created successfully',
						{ variant: 'success' }
					);
					handleCloseDialog();
					fetchCredentials();
				}
			} else {
				// Use JSON for regular updates without logo
				const payload: any = {
					name: formData.name || '',
					is_active: formData.is_active ?? true,
					is_test_mode: formData.is_test_mode ?? false,
					credentials: formData.credentials || {},
					description: formData.description || '',
				};

				// Only include payment_method for new records (not when editing)
				if (!editingCredential) {
					payload.payment_method = formData.payment_method || '';
				}

				const config = {
					headers: {
						Authorization: `Bearer ${token}`,
						Accept: 'application/json',
						'Content-Type': 'application/json',
					},
					withCredentials: true,
				};

				const response = editingCredential
					? await axios.put(url, payload, config)
					: await axios.post(url, payload, config);

				if (response.data.success) {
					enqueueSnackbar(
						editingCredential
							? 'Payment credentials updated successfully'
							: 'Payment credentials created successfully',
						{ variant: 'success' }
					);
					handleCloseDialog();
					fetchCredentials();
				}
			}
		} catch (error: any) {
			console.error('Error saving credentials:', error);
			const errorMessage =
				error.response?.data?.message ||
				error.response?.data?.errors ||
				'Failed to save payment credentials';
			enqueueSnackbar(errorMessage, { variant: 'error' });
		}
	};

	const handleDelete = async (id: number) => {
		if (!confirm('Are you sure you want to delete these credentials?')) {
			return;
		}

		try {
			// Get token from session or localStorage
			const session = await getSession();
			const token = session?.accessAuthToken || 
				session?.accessToken || 
				(typeof window !== 'undefined' ? localStorage.getItem('token') || localStorage.getItem('auth_token') : null);
			
			if (!token) {
				enqueueSnackbar('Authentication required. Please log in again.', { variant: 'error' });
				return;
			}

			const response = await axios.delete(`${apiUrl}/api/admin/payment-method-credentials/${id}`, {
				headers: {
					Authorization: `Bearer ${token}`,
					Accept: 'application/json',
					'Content-Type': 'application/json',
				},
				withCredentials: true,
			});

			if (response.data.success) {
				enqueueSnackbar('Payment credentials deleted successfully', { variant: 'success' });
				fetchCredentials();
			}
		} catch (error: any) {
			console.error('Error deleting credentials:', error);
			enqueueSnackbar('Failed to delete payment credentials', { variant: 'error' });
		}
	};

	const getCredentialKeys = (paymentMethod: string): string[] => {
		return Object.keys(getDefaultCredentials(paymentMethod));
	};

	if (loading) {
		return (
			<Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
				<CircularProgress />
			</Box>
		);
	}

	return (
		<Box>
			<Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
				<Typography variant="h5" fontWeight="bold">
					Payment Method Credentials
				</Typography>
				<Button
					variant="contained"
					color="primary"
					startIcon={<FuseSvgIcon>heroicons-outline:plus</FuseSvgIcon>}
					onClick={() => handleOpenDialog()}
				>
					Add Payment Method
				</Button>
			</Box>

			<Alert severity="info" sx={{ mb: 3 }}>
				Manage payment gateway credentials here. Credentials are encrypted and stored securely in the
				database.
			</Alert>

			<TableContainer component={Paper}>
				<Table>
					<TableHead>
						<TableRow>
							<TableCell>Logo</TableCell>
							<TableCell>Payment Method</TableCell>
							<TableCell>Name</TableCell>
							<TableCell>Status</TableCell>
							<TableCell>Mode</TableCell>
							<TableCell>Credentials</TableCell>
							<TableCell>Actions</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{credentials.length === 0 ? (
							<TableRow>
								<TableCell colSpan={7} align="center">
									<Typography variant="body2" color="text.secondary">
										No payment credentials found. Click "Add Payment Method" to create one.
									</Typography>
								</TableCell>
							</TableRow>
						) : (
							credentials.map((credential) => (
								<TableRow key={credential.id || Math.random()}>
									<TableCell>
										{credential.logo_url ? (
											<img 
												src={credential.logo_url} 
												alt={credential.name} 
												style={{ 
													width: '40px', 
													height: '40px', 
													objectFit: 'contain',
													borderRadius: '4px'
												}} 
											/>
										) : (
											<Box sx={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.100', borderRadius: 1 }}>
												<FuseSvgIcon>heroicons-outline:photograph</FuseSvgIcon>
											</Box>
										)}
									</TableCell>
									<TableCell>
										<Typography variant="body2" fontWeight="medium">
											{credential.payment_method || 'N/A'}
										</Typography>
									</TableCell>
									<TableCell>{credential.name || 'N/A'}</TableCell>
									<TableCell>
										<Chip
											label={credential.is_active ? 'Active' : 'Inactive'}
											color={credential.is_active ? 'success' : 'default'}
											size="small"
										/>
									</TableCell>
									<TableCell>
										<Chip
											label={credential.is_test_mode ? 'Test' : 'Live'}
											color={credential.is_test_mode ? 'warning' : 'success'}
											size="small"
										/>
									</TableCell>
									<TableCell>
										<Typography variant="body2" color="text.secondary">
											{credential.credential_keys?.length || 0} credential(s) configured
										</Typography>
									</TableCell>
									<TableCell>
										<IconButton
											size="small"
											onClick={() => handleOpenDialog(credential)}
											color="primary"
										>
											<FuseSvgIcon>heroicons-outline:pencil</FuseSvgIcon>
										</IconButton>
										<IconButton
											size="small"
											onClick={() => handleDelete(credential.id!)}
											color="error"
										>
											<FuseSvgIcon>heroicons-outline:trash</FuseSvgIcon>
										</IconButton>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</TableContainer>

			<Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
				<DialogTitle>
					{editingCredential ? 'Edit Payment Credentials' : 'Add Payment Credentials'}
				</DialogTitle>
				<DialogContent>
					<Box sx={{ pt: 2 }}>
						<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
							<TextField
								select
								fullWidth
								label="Payment Method"
								value={formData.payment_method || ''}
								onChange={(e) => {
									const value = e.target.value;
									console.log('Payment method dropdown changed to:', value);
									handlePaymentMethodChange(value);
								}}
								error={!!errors.payment_method}
								helperText={errors.payment_method || 'Select a payment gateway'}
								disabled={!!editingCredential}
								required
								SelectProps={{
									native: true,
								}}
							>
								<option value="">Select Payment Method</option>
								{availablePaymentMethods.length > 0 ? (
									availablePaymentMethods.map((method) => (
										<option 
											key={method.payment_method} 
											value={method.payment_method}
											disabled={method.is_configured && !editingCredential}
										>
											{method.name} {method.is_configured && !editingCredential ? '(Already Configured)' : ''}
										</option>
									))
								) : (
									<option value="" disabled>
										{loading ? 'Loading payment methods from database...' : 'No payment methods available. Please refresh the page.'}
									</option>
								)}
							</TextField>

							<TextField
								fullWidth
								label="Name"
								value={formData.name}
								onChange={(e) => handleInputChange('name', e.target.value)}
								error={!!errors.name}
								helperText={errors.name}
							/>

							<TextField
								fullWidth
								multiline
								rows={3}
								label="Description"
								value={formData.description || ''}
								onChange={(e) => handleInputChange('description', e.target.value)}
							/>

							<Box sx={{ mt: 2 }}>
								<Typography variant="subtitle2" sx={{ mb: 1 }}>
									Logo
								</Typography>
								{logoPreview && (
									<Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
										<img 
											src={logoPreview} 
											alt="Logo preview" 
											style={{ 
												maxWidth: '150px', 
												maxHeight: '150px', 
												objectFit: 'contain',
												border: '1px solid #ddd',
												borderRadius: '4px',
												padding: '8px'
											}} 
										/>
										<Button
											size="small"
											variant="outlined"
											color="error"
											onClick={handleRemoveLogo}
										>
											Remove Logo
										</Button>
									</Box>
								)}
								<input
									accept="image/*"
									style={{ display: 'none' }}
									id="logo-upload"
									type="file"
									onChange={handleLogoChange}
								/>
								<label htmlFor="logo-upload">
									<Button
										variant="outlined"
										component="span"
										fullWidth
										startIcon={<FuseSvgIcon>heroicons-outline:photograph</FuseSvgIcon>}
									>
										{logoPreview ? 'Change Logo' : 'Upload Logo'}
									</Button>
								</label>
								<Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
									Upload a logo image (JPG, PNG, GIF, SVG, WEBP - Max 2MB)
								</Typography>
							</Box>

							<Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
								<FormControlLabel
									control={
										<Switch
											checked={formData.is_active}
											onChange={(e) => handleInputChange('is_active', e.target.checked)}
										/>
									}
									label="Active"
								/>

								<FormControlLabel
									control={
										<Switch
											checked={formData.is_test_mode}
											onChange={(e) => handleInputChange('is_test_mode', e.target.checked)}
										/>
									}
									label="Test Mode"
								/>
							</Box>

							{formData.payment_method && (
								<Box>
									<Typography variant="subtitle2" sx={{ mb: 1, mt: 2 }}>
										Credentials
									</Typography>
									{getCredentialKeys(formData.payment_method).map((key) => (
										<TextField
											key={key}
											fullWidth
											type="password"
											label={key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
											value={formData.credentials[key] || ''}
											onChange={(e) => handleCredentialChange(key, e.target.value)}
											margin="normal"
										/>
									))}
								</Box>
							)}
						</Box>
					</Box>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleCloseDialog}>Cancel</Button>
					<Button onClick={handleSubmit} variant="contained" color="primary">
						{editingCredential ? 'Update' : 'Create'}
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
}

export default PaymentMethodsTab;


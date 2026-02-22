'use client';

import { useState, useEffect } from 'react';
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	Radio,
	RadioGroup,
	FormControlLabel,
	FormControl,
	FormLabel,
	Typography,
	Box,
	TextField,
	Select,
	MenuItem,
	InputLabel,
	Alert,
	Chip,
	Divider
} from '@mui/material';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { getSession } from 'next-auth/react';

interface PaymentMethod {
	method: 'instant' | 'credit';
	label: string;
	description: string;
	available: boolean;
	credit_days?: number;
	credit_limit?: number;
	used_credit?: number;
	available_credit?: number;
}

interface PaymentMethodDialogProps {
	open: boolean;
	onClose: () => void;
	onConfirm: (
		paymentMethod: 'instant' | 'credit',
		quantity: number,
		creditDays?: number,
		paymentIntentId?: string
	) => void;
	productId: string;
	supplierId?: string;
	productPrice?: number;
	isLoading?: boolean;
}

function PaymentMethodDialog({
	open,
	onClose,
	onConfirm,
	productId,
	supplierId,
	productPrice = 0,
	isLoading = false
}: PaymentMethodDialogProps) {
	const [paymentMethod, setPaymentMethod] = useState<'instant' | 'credit'>('instant');
	const [quantity, setQuantity] = useState<number>(1);
	const [creditDays, setCreditDays] = useState<number>(30);
	const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
	const [loadingMethods, setLoadingMethods] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [actualProductPrice, setActualProductPrice] = useState<number>(productPrice);
	const [processingPayment, setProcessingPayment] = useState(false);

	// Fetch payment methods and product price when dialog opens
	useEffect(() => {
		const fetchData = async () => {
			if (open) {
				setLoadingMethods(true);
				setError(null);

				try {
					const session = await getSession();
					const token =
						session?.accessAuthToken ||
						session?.accessToken ||
						(typeof window !== 'undefined'
							? localStorage.getItem('token') || localStorage.getItem('auth_token')
							: null);

					const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

					// Fetch product details to get actual price
					if (productId && productPrice === 0) {
						try {
							const productResponse = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
								method: 'GET',
								headers: {
									Accept: 'application/json',
									'Content-Type': 'application/json',
									...(token && { Authorization: `Bearer ${token}` })
								},
								credentials: 'include'
							});

							const productData = await productResponse.json();

							if (productData?.status === 200 && productData?.data) {
								const prod = productData.data;
								// Prioritize effective_price, then price_tax_incl, then price_tax_excl, then price
								let fetchedPrice = 0;

								if (prod.effective_price && prod.effective_price > 0) {
									fetchedPrice = parseFloat(prod.effective_price.toString());
								} else if (prod.price_tax_incl && prod.price_tax_incl > 0) {
									fetchedPrice = parseFloat(prod.price_tax_incl.toString());
								} else if (prod.price_tax_excl && prod.price_tax_excl > 0) {
									fetchedPrice = parseFloat(prod.price_tax_excl.toString());
								} else if (prod.price && prod.price > 0) {
									fetchedPrice = parseFloat(prod.price.toString());
								}

								setActualProductPrice(fetchedPrice);
							}
						} catch (err) {
							console.error('Failed to fetch product price:', err);
						}
					} else {
						setActualProductPrice(productPrice);
					}

					// Fetch payment methods if supplier ID exists
					if (supplierId) {
						const response = await fetch(
							`${API_BASE_URL}/api/credit-terms/supplier/${supplierId}/payment-methods`,
							{
								method: 'GET',
								headers: {
									Accept: 'application/json',
									'Content-Type': 'application/json',
									...(token && { Authorization: `Bearer ${token}` })
								},
								credentials: 'include'
							}
						);

						const data = await response.json();

						if (data?.status === 200 && data.data) {
							setPaymentMethods(data.data || []);
							// Debug: Log payment methods
							console.log('Payment methods fetched:', data.data);
						} else {
							console.warn('Failed to fetch payment methods:', data);
							setPaymentMethods([
								{
									method: 'instant',
									label: 'Instant Payment',
									description: 'Pay immediately and receive stock transfer',
									available: true
								}
							]);
						}
					} else {
						// If no supplier ID, default to instant payment
						setPaymentMethods([
							{
								method: 'instant',
								label: 'Instant Payment',
								description: 'Pay immediately and receive stock transfer',
								available: true
							}
						]);
					}
				} catch (err) {
					console.error('Failed to fetch data:', err);
					// Default to instant payment if API fails
					setPaymentMethods([
						{
							method: 'instant',
							label: 'Instant Payment',
							description: 'Pay immediately and receive stock transfer',
							available: true
						}
					]);
				} finally {
					setLoadingMethods(false);
				}
			}
		};

		fetchData();
	}, [open, supplierId, productId, productPrice]);

	const handleConfirm = async () => {
		if (quantity < 1) {
			setError('Quantity must be at least 1');
			return;
		}

		const selectedMethod = paymentMethods.find((m) => m.method === paymentMethod);

		if (!selectedMethod || !selectedMethod.available) {
			setError('Selected payment method is not available');
			return;
		}

		if (paymentMethod === 'credit' && !creditDays) {
			setError('Please select credit days');
			return;
		}

		// Check credit limit if credit payment
		if (paymentMethod === 'credit' && selectedMethod.available_credit !== undefined) {
			const totalAmount = actualProductPrice * quantity;
			const availableCredit = Number(selectedMethod.available_credit);

			if (totalAmount > availableCredit) {
				setError(
					`Insufficient credit. Available: £${availableCredit.toFixed(2)}, Required: £${totalAmount.toFixed(2)}`
				);
				return;
			}
		}

		// For instant payment, process Stripe payment first
		if (paymentMethod === 'instant') {
			await handleStripePayment();
		} else {
			// Credit payment - no Stripe needed
			setError(null);
			onConfirm(paymentMethod, quantity, creditDays);
		}
	};

	const handleStripePayment = async () => {
		if (!supplierId) {
			setError('Supplier information is missing');
			return;
		}

		setProcessingPayment(true);
		setError(null);

		try {
			const session = await getSession();
			const token =
				session?.accessAuthToken ||
				session?.accessToken ||
				(typeof window !== 'undefined'
					? localStorage.getItem('token') || localStorage.getItem('auth_token')
					: null);

			const totalAmount = actualProductPrice * quantity;

			// Create payment intent
			const response = await fetch(`${API_BASE_URL}/api/wholesale-payment/create-intent`, {
				method: 'POST',
				headers: {
					Accept: 'application/json',
					'Content-Type': 'application/json',
					...(token && { Authorization: `Bearer ${token}` })
				},
				body: JSON.stringify({
					amount: totalAmount,
					currency: 'gbp',
					product_id: parseInt(productId),
					quantity: quantity,
					supplier_id: parseInt(supplierId)
				}),
				credentials: 'include'
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || 'Failed to create payment intent');
			}

			// Load Stripe.js and process payment
			if (typeof window !== 'undefined') {
				// Load Stripe.js if not already loaded
				if (!(window as any).Stripe) {
					const script = document.createElement('script');
					script.src = 'https://js.stripe.com/v3/';
					script.async = true;
					document.head.appendChild(script);
					await new Promise((resolve) => {
						script.onload = resolve;
					});
				}

				const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

				if (!stripeKey) {
					throw new Error(
						'Stripe publishable key not configured. Please set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in your environment variables.'
					);
				}

				const stripe = (window as any).Stripe(stripeKey);

				// Use Stripe's confirmPayment with redirect (simplest approach)
				// This will redirect to Stripe's hosted payment page
				const { error: stripeError } = await stripe.confirmPayment({
					clientSecret: data.client_secret,
					confirmParams: {
						return_url: `${window.location.origin}/apps/e-commerce/wholesale-catalog?payment_success=true&payment_intent=${data.payment_intent_id}&product_id=${productId}&quantity=${quantity}&supplier_id=${supplierId}`
					}
				});

				if (stripeError) {
					throw new Error(stripeError.message || 'Payment failed');
				}

				// Payment is processing - redirect will happen
				// The return_url will handle the completion
			} else {
				throw new Error('Stripe.js not available');
			}
		} catch (err: any) {
			console.error('Stripe payment error:', err);
			setError(err.message || 'Payment processing failed. Please try again.');
		} finally {
			setProcessingPayment(false);
		}
	};

	const selectedMethod = paymentMethods.find((m) => m.method === paymentMethod);
	const totalAmount = actualProductPrice * quantity;

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="sm"
			fullWidth
		>
			<DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 2 }}>
				<FuseSvgIcon sx={{ color: 'primary.main' }}>heroicons-outline:credit-card</FuseSvgIcon>
				<Typography
					component="span"
					variant="h6"
					fontWeight="bold"
				>
					Select Payment Method
				</Typography>
			</DialogTitle>
			<DialogContent>
				{loadingMethods ? (
					<Box
						display="flex"
						justifyContent="center"
						py={4}
					>
						<Typography>Loading payment methods...</Typography>
					</Box>
				) : (
					<>
						{error && (
							<Alert
								severity="error"
								sx={{ mb: 2 }}
								onClose={() => setError(null)}
							>
								{error}
							</Alert>
						)}

						{/* Quantity Input */}
						<Box mb={3}>
							<TextField
								fullWidth
								label="Quantity"
								type="number"
								value={quantity}
								onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
								inputProps={{ min: 1 }}
								helperText={`Total: £${totalAmount.toFixed(2)}`}
							/>
						</Box>

						{/* Payment Method Selection */}
						<FormControl
							component="fieldset"
							fullWidth
						>
							<FormLabel
								component="legend"
								sx={{ mb: 2, fontWeight: 600 }}
							>
								Payment Method
							</FormLabel>
							<RadioGroup
								value={paymentMethod}
								onChange={(e) => setPaymentMethod(e.target.value as 'instant' | 'credit')}
							>
								{paymentMethods.map((method) => (
									<Box
										key={method.method}
										mb={2}
									>
										<FormControlLabel
											value={method.method}
											control={<Radio />}
											label={
												<Box>
													<Box
														display="flex"
														alignItems="center"
														gap={1}
													>
														<Typography fontWeight={600}>{method.label}</Typography>
														{method.method === 'credit' &&
															method.available_credit !== undefined && (
																<Chip
																	label={`Available: £${Number(method.available_credit).toFixed(2)}`}
																	size="small"
																	color={
																		Number(method.available_credit) >= totalAmount
																			? 'success'
																			: 'warning'
																	}
																/>
															)}
													</Box>
													<Typography
														variant="body2"
														color="text.secondary"
														sx={{ mt: 0.5 }}
													>
														{method.description}
													</Typography>
													{method.method === 'credit' && method.credit_days && (
														<Typography
															variant="caption"
															color="primary"
															sx={{ display: 'block', mt: 0.5 }}
														>
															Pay in {method.credit_days} days
														</Typography>
													)}
												</Box>
											}
											disabled={!method.available}
										/>
									</Box>
								))}
							</RadioGroup>
						</FormControl>

						{/* Credit Days Selection */}
						{paymentMethod === 'credit' && selectedMethod && (
							<Box mt={2}>
								<Divider sx={{ my: 2 }} />
								<FormControl fullWidth>
									<InputLabel>Credit Days</InputLabel>
									<Select
										value={creditDays}
										label="Credit Days"
										onChange={(e) => setCreditDays(Number(e.target.value))}
									>
										<MenuItem value={7}>7 Days</MenuItem>
										<MenuItem value={15}>15 Days</MenuItem>
										<MenuItem value={30}>30 Days</MenuItem>
										<MenuItem value={60}>60 Days</MenuItem>
									</Select>
								</FormControl>
								{selectedMethod.available_credit !== undefined && (
									<Alert
										severity="info"
										sx={{ mt: 2 }}
									>
										<Typography variant="body2">
											<strong>Credit Limit:</strong> £
											{selectedMethod.credit_limit
												? Number(selectedMethod.credit_limit).toFixed(2)
												: '0.00'}
											<br />
											<strong>Used Credit:</strong> £
											{selectedMethod.used_credit
												? Number(selectedMethod.used_credit).toFixed(2)
												: '0.00'}
											<br />
											<strong>Available Credit:</strong> £
											{Number(selectedMethod.available_credit).toFixed(2)}
										</Typography>
									</Alert>
								)}
							</Box>
						)}

						{/* Summary */}
						<Box
							mt={3}
							p={2}
							sx={{ bgcolor: 'background.default', borderRadius: 2 }}
						>
							<Typography
								variant="subtitle2"
								fontWeight={600}
								gutterBottom
							>
								Order Summary
							</Typography>
							<Box
								display="flex"
								justifyContent="space-between"
								mb={1}
							>
								<Typography variant="body2">Unit Price:</Typography>
								<Typography
									variant="body2"
									fontWeight={600}
								>
									{actualProductPrice > 0 ? `£${actualProductPrice.toFixed(2)}` : 'Price on Request'}
								</Typography>
							</Box>
							<Box
								display="flex"
								justifyContent="space-between"
								mb={1}
							>
								<Typography variant="body2">Quantity:</Typography>
								<Typography
									variant="body2"
									fontWeight={600}
								>
									{quantity}
								</Typography>
							</Box>
							<Divider sx={{ my: 1 }} />
							<Box
								display="flex"
								justifyContent="space-between"
							>
								<Typography
									variant="body1"
									fontWeight={700}
								>
									Total:
								</Typography>
								<Typography
									variant="body1"
									fontWeight={700}
									color="primary.main"
								>
									£{totalAmount.toFixed(2)}
								</Typography>
							</Box>
						</Box>
					</>
				)}
			</DialogContent>
			<DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider' }}>
				<Button
					onClick={onClose}
					disabled={isLoading}
				>
					Cancel
				</Button>
				<Button
					onClick={handleConfirm}
					variant="contained"
					disabled={isLoading || loadingMethods || processingPayment || !selectedMethod?.available}
					startIcon={
						isLoading || processingPayment ? (
							<FuseSvgIcon className="animate-spin">heroicons-outline:arrow-path</FuseSvgIcon>
						) : (
							<FuseSvgIcon>heroicons-outline:check</FuseSvgIcon>
						)
					}
				>
					{isLoading || processingPayment
						? processingPayment
							? 'Processing Payment...'
							: 'Processing...'
						: paymentMethod === 'instant'
							? 'Pay & Import'
							: 'Confirm Import'}
				</Button>
			</DialogActions>
		</Dialog>
	);
}

export default PaymentMethodDialog;

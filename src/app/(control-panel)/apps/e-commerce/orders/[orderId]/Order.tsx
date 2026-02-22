'use client';

import { useState, SyntheticEvent, useEffect, useMemo } from 'react'; // Add useMemo if not there
import { useParams } from 'next/navigation';
import { useForm, FormProvider } from 'react-hook-form';
import { motion } from 'motion/react';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import FusePageCarded from '@fuse/core/FusePageCarded';
import FuseLoading from '@fuse/core/FuseLoading';
import Link from '@fuse/core/Link';
import useThemeMediaQuery from '@fuse/hooks/useThemeMediaQuery';
import FuseTabs from 'src/components/tabs/FuseTabs';
import FuseTab from 'src/components/tabs/FuseTab';

import OrdersHeader from './OrdersHeader';
import DetailsTab from './tabs/details/DetailsTab';
import { useGetECommerceOrderQuery } from '../../apis/ECommerceOrdersApi';
import type { EcommerceOrder } from '../../apis/ECommerceOrdersApi';

/**
 * Main order editor page.
 * Handles fetching, form context, tab navigation, and layout.
 */
export default function Order() {
	const { orderId } = useParams<{ orderId: string }>();
	const isNew = orderId === 'new';
	const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down('lg'));

	/**  Fetch order (skip for new order) */
	const { data, isLoading, isError } = useGetECommerceOrderQuery(orderId, {
		skip: isNew || !orderId
	});

	/** Local UI state */
	const [tabValue, setTabValue] = useState('details');
	const handleTabChange = (_: SyntheticEvent, value: string) => setTabValue(value);

	/** Normalize order data - Always coerce nulls to strings for RHF stability */
	const orderData: EcommerceOrder = useMemo(() => {
		const rawData = data?.data ?? {
			id: undefined,
			order_number: '',
			status: 'Pending',
			user: { id: '', name: '', email: '' },
			product_detail: [],
			phone: '',
			email: '',
			image: '',
			name: '',
			shipping_status: 'pending', // Default string for new
			payment_status: 'pending'
			// Add other | null fields as needed, e.g., price: '0',
		};

		// Explicitly normalize key fields to strings (prevents null dirty bug)
		return {
			...rawData,
			shipping_status: rawData.shipping_status ?? 'pending', // null → 'pending'
			payment_status: rawData.payment_status ?? 'pending',
			shipping_address: rawData.shipping_address ?? ''
			// Extend for other string | null fields if they have Selects
		};
	}, [data]);

	/**  Shared react-hook-form context */
	const methods = useForm<EcommerceOrder>({
		defaultValues: orderData,
		mode: 'onChange'
	});

	// Update form when orderData changes (e.g., after refetch)
	useEffect(() => {
		methods.reset(orderData); // ✅ No options needed; defaults are strings now
	}, [orderData, methods]);

	/** Loading state - Only show loading if we're actually loading an existing order (not creating new) */
	if (isLoading && !isNew) {
		return <FuseLoading />;
	}

	/** Error state */
	if (isError && !isNew) {
		return (
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1, transition: { delay: 0.1 } }}
				className="flex flex-col flex-1 items-center justify-center h-full"
			>
				<Typography
					color="text.secondary"
					variant="h5"
				>
					There is no such order!
				</Typography>
				<Button
					className="mt-6"
					component={Link}
					variant="outlined"
					to="/apps/e-commerce/orders"
					color="inherit"
				>
					Go to Orders Page
				</Button>
			</motion.div>
		);
	}

	/** Render layout */
	return (
		<FormProvider {...methods}>
			<FusePageCarded
				header={<OrdersHeader order={orderData} />}
				content={
					<div className="p-4 sm:p-6 w-full">
						{/* Tabs */}
						<FuseTabs
							className="mb-8"
							value={tabValue}
							onChange={handleTabChange}
						>
							<FuseTab
								value="details"
								label="Order Details"
							/>
							{/* <FuseTab value="products" label="Products" />
							<FuseTab value="invoice" label="Invoice" /> */}
						</FuseTabs>

						{/* Tab Content */}
						{tabValue === 'details' && <DetailsTab order={orderData} />}
						{/* {tabValue === 'products' && <ProductsTab products={orderData.product_detail} />} */}
						{/* {tabValue === 'invoice' && <InvoiceTab order={orderData} />} */}
					</div>
				}
				scroll={isMobile ? 'normal' : 'content'}
			/>
		</FormProvider>
	);
}

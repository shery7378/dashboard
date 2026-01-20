//src/app/(control-panel)/apps/e-commerce/stores/[storeId]/[[...handle]]/Store.tsx
'use client';

import FuseLoading from '@fuse/core/FuseLoading';
import FusePageCarded from '@fuse/core/FusePageCarded';
import { SyntheticEvent, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { FormProvider, useForm } from 'react-hook-form';
import useThemeMediaQuery from '@fuse/hooks/useThemeMediaQuery';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import FuseTabs from 'src/components/tabs/FuseTabs';
import FuseTab from 'src/components/tabs/FuseTab';

import StoreHeader from './StoreHeader';
import BasicInfoTab from './tabs/BasicInfoTab';
import StoreImagesTab from './tabs/StoreImagesTab';
import StoreSeoTab from './tabs/StoreSeoTab';
import StoreAddressTab from './tabs/StoreAddressTab';
import StoreContactTab from './tabs/StoreContactTab';

import { useGetECommerceStoreQuery } from '../../../apis/StoresLaravelApi';
import { createDefaultStore } from '../../models/StoreModel';
import { sanitizeStore } from '../../models/sanitizeStore';

// ✅ Validation schema (all optional, because we enforce "cannot empty if already filled" manually)
const schema = z.object({
	name: z.string().optional(),
	slug: z.string().optional(),
	description: z.string().optional(),
	meta_title: z.string().optional(),
	meta_description: z.string().optional(),
	meta_keywords: z.string().optional(),
	address: z.string().optional(),
	zip_code: z.string().optional(),
	city: z.string().optional(),
	country: z.string().optional(),
	contact_email: z.string().optional(),
	contact_phone: z.string().optional(),
	latitude: z.number().optional(),
	longitude: z.number().optional(),
	delivery_radius: z.number().optional(),
});

function Store() {
	const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down('lg'));
	const { storeId } = useParams<{ storeId: string }>();

	const { data: store, isLoading, isError } = useGetECommerceStoreQuery(storeId!, {
		skip: !storeId || storeId === 'new'
	});

	const [tabValue, setTabValue] = useState('basic-info');
	const [originalValues, setOriginalValues] = useState<any>({}); // store original data

	const methods = useForm({
		mode: 'onChange',
		defaultValues: createDefaultStore(),
		resolver: zodResolver(schema),
	});

	const { reset, watch, setValue } = methods;
	const name = watch('name');

	// Load store
	useEffect(() => {
		if (storeId === 'new') {
			reset(createDefaultStore());
			setOriginalValues({});
		} else if (store) {
			const sanitized = sanitizeStore(store.data);
			reset(sanitized);
			setOriginalValues(sanitized);
		}
	}, [store, storeId, reset]);

	if (isLoading) return <FuseLoading />;

	if (isError && storeId !== 'new') {
		return (
			<div className="flex flex-col flex-1 items-center justify-center h-full">
				<p>There is no such store!</p>
			</div>
		);
	}

	return (
		<FormProvider {...methods}>
			<FusePageCarded
				header={
					<StoreHeader
						activeTab={tabValue}
						getValues={() => ({
							...createDefaultStore(),
							...methods.getValues(),
						})}
						originalValues={originalValues}
					/>
				}
				content={
					<div className="p-4 sm:p-6 max-w-5xl space-y-6">
						<FuseTabs value={tabValue} onChange={(e: SyntheticEvent, val: string) => setTabValue(val)}>
							<FuseTab value="basic-info" label="Basic Info" />
							<FuseTab value="store-images" label="Images" />
							<FuseTab value="store-address" label="Address" />
							<FuseTab value="store-settings" label="Store Settings" />
							<FuseTab value="seo-settings" label="SEO Settings" />
						</FuseTabs>

						<div>
							<div className={tabValue !== 'basic-info' ? 'hidden' : ''}><BasicInfoTab /></div>
							<div className={tabValue !== 'store-images' ? 'hidden' : ''}><StoreImagesTab /></div>
							<div className={tabValue !== 'store-address' ? 'hidden' : ''}><StoreAddressTab /></div>
							<div className={tabValue !== 'store-settings' ? 'hidden' : ''}><StoreContactTab /></div>
							<div className={tabValue !== 'seo-settings' ? 'hidden' : ''}><StoreSeoTab /></div>
						</div>
					</div>
				}
				scroll={isMobile ? 'normal' : 'content'}
			/>
		</FormProvider>
	);
}

export default Store;

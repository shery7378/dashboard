'use client';

import FusePageSimple from '@fuse/core/FusePageSimple';
import { useState } from 'react';
import { styled } from '@mui/material/styles';
import * as React from 'react';
import FuseTabs from 'src/components/tabs/FuseTabs';
import FuseTab from 'src/components/tabs/FuseTab';
import VendorDashboardAppHeader from './SellerDashboardAppHeader';
import HomeTab from './tabs/home/HomeTab';
import { useGetProjectDashboardWidgetsQuery } from '../vendor/ProjectDashboardApi';

const Root = styled(FusePageSimple)(({ theme }) => ({
	'& .FusePageSimple-header': {
		backgroundColor: theme.vars.palette.background.paper,
		boxShadow: `inset 0 -1px 0 0px  ${theme.vars.palette.divider}`
	}
}));

/**
 * The SellerDashboardApp page.
 * Sellers directly sell products to customers (no wholesale catalog access).
 *
 * Performance: removed the 5-second timeout anti-pattern.
 * Content renders immediately; widgets show their own skeletons while loading.
 */
function SellerDashboardApp() {
	// Prefetch widgets in background; errors are handled per-widget
	useGetProjectDashboardWidgetsQuery();

	const [tabValue, setTabValue] = useState('home');

	function handleTabChange(_event: React.SyntheticEvent, value: string) {
		setTabValue(value);
	}

	return (
		<Root
			scroll="content"
			header={<VendorDashboardAppHeader />}
			content={
				<div className="w-full pt-4 sm:pt-6">
					<div className="w-full px-6 md:px-8">
						<FuseTabs
							value={tabValue}
							onChange={handleTabChange}
							aria-label="Vendor dashboard tabs"
						>
							<FuseTab
								value="home"
								label="Dashboard"
							/>
						</FuseTabs>
					</div>
					{tabValue === 'home' && <HomeTab />}
				</div>
			}
		/>
	);
}

export default SellerDashboardApp;

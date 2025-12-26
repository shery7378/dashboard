'use client';

import FusePageSimple from '@fuse/core/FusePageSimple';
import { useState } from 'react';
import { styled } from '@mui/material/styles';
import * as React from 'react';
import FuseLoading from '@fuse/core/FuseLoading';
import FuseTabs from 'src/components/tabs/FuseTabs';
import FuseTab from 'src/components/tabs/FuseTab';
import SellerDashboardAppHeader from './SellerDashboardAppHeader';
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
 */
function SellerDashboardApp() {
	const { isLoading } = useGetProjectDashboardWidgetsQuery();

	const [tabValue, setTabValue] = useState('home');

	function handleTabChange(event: React.SyntheticEvent, value: string) {
		setTabValue(value);
	}

	if (isLoading) {
		return <FuseLoading />;
	}

	return (
		<Root
			header={<SellerDashboardAppHeader />}
			content={
				<div className="w-full pt-4 sm:pt-6">
					<div className="w-full px-6 md:px-8">
						<FuseTabs
							value={tabValue}
							onChange={handleTabChange}
							aria-label="Seller dashboard tabs"
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


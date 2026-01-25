'use client';

import FusePageSimple from '@fuse/core/FusePageSimple';
import { useState, useEffect } from 'react';
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
 */
function SellerDashboardApp() {
	const { isLoading, error } = useGetProjectDashboardWidgetsQuery(undefined, {
		skip: false, // Keep querying, but handle errors gracefully
	});

	const [tabValue, setTabValue] = useState('home');
	const [showContent, setShowContent] = useState(false);

	// Add timeout to prevent infinite loading (show content after 5 seconds even if still loading)
	useEffect(() => {
		if (!isLoading) {
			setShowContent(true);
		} else {
			const timer = setTimeout(() => {
				setShowContent(true);
			}, 5000); // 5 second timeout
			return () => clearTimeout(timer);
		}
	}, [isLoading]);

	function handleTabChange(event: React.SyntheticEvent, value: string) {
		setTabValue(value);
	}

	// Log error for debugging but don't block the page
	if (error) {
		console.error('[SellerDashboard] Error loading widgets:', error);
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


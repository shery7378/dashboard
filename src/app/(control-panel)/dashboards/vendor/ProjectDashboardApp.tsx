'use client';

import FusePageSimple from '@fuse/core/FusePageSimple';
import { useState, useEffect } from 'react';
import { styled } from '@mui/material/styles';
import * as React from 'react';
import FuseTabs from 'src/components/tabs/FuseTabs';
import FuseTab from 'src/components/tabs/FuseTab';
import ProjectDashboardAppHeader from './ProjectDashboardAppHeader';
import HomeTab from './tabs/home/HomeTab';
import { useGetProjectDashboardWidgetsQuery } from './ProjectDashboardApi';

const Root = styled(FusePageSimple)(({ theme }) => ({
	'& .FusePageSimple-header': {
		backgroundColor: theme.vars.palette.background.paper,
		boxShadow: `inset 0 -1px 0 0px  ${theme.vars.palette.divider}`
	}
}));

/**
 * The ProjectDashboardApp page.
 */
function ProjectDashboardApp() {
	const { isLoading } = useGetProjectDashboardWidgetsQuery();
	const [showContent, setShowContent] = useState(false);

	const [tabValue, setTabValue] = useState('home');

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

	return (
		<Root
			header={<ProjectDashboardAppHeader />}
			content={
				<div className="w-full pt-4 sm:pt-6">
					<div className="w-full px-6 md:px-8">
						<FuseTabs
							value={tabValue}
							onChange={handleTabChange}
							aria-label="New user tabs"
						>
							<FuseTab
								value="home"
								label="Dashboard"
							/>
							{/* <FuseTab
								value="budget"
								label="Budget"
							/>
							<FuseTab
								value="team"
								label="Team"
							/> */}
						</FuseTabs>
					</div>
					{tabValue === 'home' && <HomeTab />}
					{/* {tabValue === 'budget' && <BudgetTab />}
					{tabValue === 'team' && <TeamTab />} */}
				</div>
			}
		/>
	);
}

export default ProjectDashboardApp;

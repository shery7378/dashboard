'use client';

import FusePageSimple from '@fuse/core/FusePageSimple';
import { styled } from '@mui/material/styles';
import { useState, useEffect } from 'react';
import FuseLoading from '@fuse/core/FuseLoading';
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

	if (isLoading && !showContent) {
		return <FuseLoading />;
	}

	return (
		<Root
			header={<ProjectDashboardAppHeader />}
			content={
				<div className="w-full pt-4 sm:pt-6">
					<HomeTab />
				</div>
			}
		/>
	);
}

export default ProjectDashboardApp;

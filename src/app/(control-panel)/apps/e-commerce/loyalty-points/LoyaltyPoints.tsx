'use client';

import { useState } from 'react';
import PageHeader from '@/components/PageHeader';
import LoyaltyPointsTable from './LoyaltyPointsTable';

/**
 * The loyalty points management page.
 */
function LoyaltyPoints() {
	const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);

	return (
		<div className="w-full h-full flex flex-col">
			<PageHeader 
				title="Loyalty Points" 
				subtitle="Monitor earnings, manage redemptions and configure point rules"
				actions={[
					{
						label: 'Settings',
						onClick: () => setSettingsDialogOpen(true),
						icon: 'heroicons-outline:cog-8-tooth',
						color: 'secondary'
					}
				]}
			/>
			<div className="flex-auto p-24 pt-0">
				<LoyaltyPointsTable
					settingsDialogOpen={settingsDialogOpen}
					onSettingsDialogClose={() => setSettingsDialogOpen(false)}
					onSettingsDialogOpen={() => setSettingsDialogOpen(true)}
				/>
			</div>
		</div>
	);
}

export default LoyaltyPoints;


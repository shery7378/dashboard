'use client';

import { useState } from 'react';
import GlobalStyles from '@mui/material/GlobalStyles';
import LoyaltyPointsHeader from './LoyaltyPointsHeader';
import LoyaltyPointsTable from './LoyaltyPointsTable';

/**
 * The loyalty points management page.
 */
function LoyaltyPoints() {
	const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);

	return (
		<>
			<GlobalStyles
				styles={() => ({
					'#root': {
						maxHeight: '100vh'
					}
				})}
			/>
			<div className="w-full h-full flex flex-col px-4">
				<LoyaltyPointsHeader onSettingsClick={() => setSettingsDialogOpen(true)} />
				<LoyaltyPointsTable
					settingsDialogOpen={settingsDialogOpen}
					onSettingsDialogClose={() => setSettingsDialogOpen(false)}
					onSettingsDialogOpen={() => setSettingsDialogOpen(true)}
				/>
			</div>
		</>
	);
}

export default LoyaltyPoints;

import { lazy, memo, Suspense } from 'react';
import NotificationPanel from '@/app/(control-panel)/apps/notifications/NotificationPanel';

const QuickPanel = lazy(() => import('@/components/theme-layouts/components/quickPanel/QuickPanel'));
const MessengerPanel = lazy(() => import('@/app/(control-panel)/apps/messenger/messengerPanel/MessengerPanel'));

/**
 * The right side layout 3.
 */
function RightSideLayout3() {
	return (
		<>
			<Suspense>
				<QuickPanel />
				<MessengerPanel />
			</Suspense>
			<NotificationPanel />
		</>
	);
}

export default memo(RightSideLayout3);

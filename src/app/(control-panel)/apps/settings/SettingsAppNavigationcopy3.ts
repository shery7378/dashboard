// src/app/(control-panel)/apps/settings/SettingsAppNavigation.ts
import store from '@/store/store';
import { FuseNavItemType } from '@fuse/core/FuseNavigation/types/FuseNavItemType';
import FuseUtils from '@fuse/utils';

// --- All potential children (use your real URLs) ---
const rawChildren: FuseNavItemType[] = [
	{
		id: 'apps.settings.account',
		title: 'Account',
		type: 'item',
		icon: 'heroicons-outline:user-circle',
		url: '/apps/settings/account',
		auth: ['admin'] // only admins
	},
	{
		id: 'apps.settings.security',
		title: 'Security',
		type: 'item',
		icon: 'heroicons-outline:lock-closed',
		url: '/apps/settings/security'
	},
	{
		id: 'apps.settings.planBilling',
		title: 'Plan & Billing',
		type: 'item',
		icon: 'heroicons-outline:credit-card',
		url: '/apps/settings/plan-billing'
	},
	{
		id: 'apps.settings.notifications',
		title: 'Notifications',
		type: 'item',
		icon: 'heroicons-outline:bell',
		url: '/apps/settings/notifications'
	},
	{
		id: 'apps.settings.team',
		title: 'Team',
		type: 'item',
		icon: 'heroicons-outline:user-group',
		url: '/apps/settings/team'
	}
];

// Recursively set hasPermission and prune unauthorized/empty branches
function applyPermissionsAndPrune(items: FuseNavItemType[], roles: string[]): FuseNavItemType[] {
	return items
		.map((item) => {
			const permitted = item.auth ? FuseUtils.hasPermission(item.auth, roles) : true;
			const children = item.children ? applyPermissionsAndPrune(item.children, roles) : undefined;

			const isBranch = item.type === 'collapse' || item.type === 'group';
			const hasPermission = isBranch ? permitted && (children ? children.length > 0 : true) : permitted;

			return {
				...item,
				hasPermission,
				children
			} as FuseNavItemType;
		})
		.filter((i) => i.hasPermission);
}

function getSettingsAppNavigationFromStore(): FuseNavItemType {
	// Safeguard for store initialization
	let roles: string[] = [];
	try {
		const state: any = store.getState?.() ?? {};
		roles = state?.auth?.user?.db?.role ?? state?.auth?.user?.roles ?? [];
	} catch (error) {
		console.warn('Store not initialized or inaccessible:', error);
	}

	const children = applyPermissionsAndPrune(rawChildren, roles);

	return {
		id: 'apps.settings',
		title: 'Settings',
		type: 'collapse',
		icon: 'heroicons-outline:cog-6-tooth',
		url: '/apps/settings',
		hasPermission: children.length > 0,
		children: children.length > 0 ? children : [] // Fallback for empty children
	};
}

// Factory function to create the static navigation object
function createSettingsAppNavigation(): FuseNavItemType {
	return getSettingsAppNavigationFromStore();
}

// Define the static object using the factory function
const SettingsAppNavigation: FuseNavItemType = createSettingsAppNavigation();

// Export as default
export default SettingsAppNavigation;

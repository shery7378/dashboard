import i18n from '@i18n';
import { FuseNavItemType } from '@fuse/core/FuseNavigation/types/FuseNavItemType';
import ar from './navigation-i18n/ar';
import en from './navigation-i18n/en';
import tr from './navigation-i18n/tr';
import es from './navigation-i18n/es';
import fr from './navigation-i18n/fr';
import de from './navigation-i18n/de';
import it from './navigation-i18n/it';
import pt from './navigation-i18n/pt';
import zh from './navigation-i18n/zh';
import authRoles from '@auth/authRoles';

i18n.addResourceBundle('en', 'navigation', en);
i18n.addResourceBundle('tr', 'navigation', tr);
i18n.addResourceBundle('ar', 'navigation', ar);
i18n.addResourceBundle('es', 'navigation', es);
i18n.addResourceBundle('fr', 'navigation', fr);
i18n.addResourceBundle('de', 'navigation', de);
i18n.addResourceBundle('it', 'navigation', it);
i18n.addResourceBundle('pt', 'navigation', pt);
i18n.addResourceBundle('zh', 'navigation', zh);

// helper for divider with unique id
let dividerCount = 0;
const divider = (): FuseNavItemType => ({
	id: `divider-${++dividerCount}`,
	type: 'divider',
});

const navigationConfig: FuseNavItemType[] = [
	// Admin menu
	{
		id: 'admin',
		type: 'group',
		icon: 'heroicons-outline:shield-check',
		translate: 'ADMIN',
		auth: authRoles.admin,
		children: [
			{
				id: 'admin.dashboards',
				title: 'Dashboard',
				type: 'item',
				icon: 'heroicons-outline:clipboard-document-check',
				url: '/dashboards/project',
				auth: authRoles.admin,
			},
			{
				id: 'admin.analytics',
				title: 'Analytics',
				type: 'item',
				icon: 'heroicons-outline:chart-pie',
				url: '/dashboards/analytics',
				auth: authRoles.admin,
			},
			divider(),
			{
				id: 'admin.vendors',
				title: 'Vendors',
				type: 'item',
				icon: 'feather:user-check',
				url: '/vendors',
				end: true,
			},
			divider(),
			{
				id: 'admin.stores',
				title: 'Stores',
				type: 'collapse',
				icon: 'heroicons-outline:building-storefront',
				children: [
					{
						id: 'admin.stores.all',
						title: 'Stores',
						type: 'item',
						url: '/apps/e-commerce/stores',
					},
				],
			},
			divider(),
			{
				id: 'admin.products',
				title: 'Products',
				type: 'collapse',
				icon: 'heroicons-outline:shopping-cart',
				children: [
					{
						id: 'admin.products.all',
						title: 'Products',
						type: 'item',
						url: '/apps/e-commerce/products',
						end: true,
					},
				],
			},
			divider(),
			{
				id: 'admin.orders',
				title: 'Orders',
				type: 'item',
				icon: 'feather:package',
				url: '/apps/e-commerce/orders',
				end: true,
			},
			divider(),
			{
				id: 'admin.withdrawals',
				title: 'Withdrawals',
				type: 'item',
				icon: 'heroicons-outline:banknotes',
				url: '/apps/e-commerce/withdrawals',
				end: true,
				auth: authRoles.admin,
			},
			divider(),
			{
				id: 'admin.refund-requests',
				title: 'Refund Requests',
				type: 'item',
				icon: 'heroicons-outline:arrow-uturn-left',
				url: '/apps/e-commerce/refund-requests',
				end: true,
				auth: authRoles.admin,
			},
			divider(),
			{
				id: 'admin.loyalty-points',
				title: 'Loyalty Points',
				type: 'item',
				icon: 'heroicons-outline:star',
				url: '/apps/e-commerce/loyalty-points',
				end: true,
				auth: authRoles.admin,
			},
			divider(),
			{
				id: 'admin.marketing',
				title: 'Marketing',
				type: 'collapse',
				icon: 'heroicons-outline:megaphone',
				children: [
					{
						id: 'admin.marketing.coupons',
						title: 'Coupons',
						type: 'item',
						icon: 'heroicons-outline:ticket',
						url: '/pages/marketing/coupons',
						end: true,
					},
					{
						id: 'admin.marketing.flashsales',
						title: 'Flash Sales',
						type: 'item',
						icon: 'heroicons-outline:bolt',
						url: '/pages/marketing/flash-sales',
						end: true,
					},
					{
						id: 'admin.marketing.campaigns',
						title: 'Campaigns',
						type: 'item',
						icon: 'heroicons-outline:megaphone',
						url: '/pages/marketing/campaigns',
						end: true,
					},
				],
			},
			divider(),
			{
				id: 'admin.categories',
				title: 'Categories',
				type: 'collapse',
				icon: 'material-outline:category',
				children: [
					{
						id: 'admin.categories.all',
						title: 'Categories',
						type: 'item',
						url: '/apps/e-commerce/categories',
					},
					{
						id: 'admin.categories.new',
						title: 'New category',
						type: 'item',
						url: '/apps/e-commerce/categories/new',
					},
				],
			},
			divider(),
			{
				id: 'admin.reports',
				title: 'Reports',
				type: 'item',
				icon: 'heroicons-outline:arrow-trending-up',
				url: '/reports',
				end: true,
			},
			divider(),
			{
				id: 'admin.users',
				title: 'Users',
				type: 'item',
				icon: 'material-outline:supervised_user_circle',
				url: '/accounts',
				end: true,
			},
			divider(),
			{
				id: 'admin.settings',
				title: 'Settings',
				type: 'collapse',
				icon: 'material-outline:settings',
				auth: authRoles.admin,
				children: [
					{
						id: 'admin.currency-settings',
						title: 'Currency Settings',
						type: 'item',
						icon: 'heroicons-outline:currency-dollar',
						url: '/pages/settings/currency',
						auth: authRoles.admin,
						end: true,
					},
					{
						id: 'admin.notification-settings',
						title: 'Notification Settings',
						type: 'item',
						icon: 'heroicons-outline:bell-alert',
						url: '/pages/settings/notifications',
						auth: authRoles.admin,
						end: true,
					},
					{
						id: 'admin.maps-radius-settings',
						title: 'Maps & Radius Search',
						type: 'item',
						icon: 'heroicons-outline:map',
						url: '/pages/settings/radius',
						auth: authRoles.admin,
						end: true,
					},
					{
						id: 'admin.currency-rates-settings',
						title: 'Currency Rates',
						type: 'item',
						icon: 'heroicons-outline:currency-dollar',
						url: '/pages/settings/currency-rates',
						auth: authRoles.admin,
						end: true,
					},
					divider(),
					{
						id: 'admin.payment-methods-settings',
						title: 'Payment Methods',
						type: 'item',
						icon: 'heroicons-outline:credit-card',
						url: '/apps/settings/payment-methods',
						auth: authRoles.admin,
						end: true,
					},
				],
			},
			{
				id: 'admin.kyc-approvals',
				title: 'KYC Approvals',
				type: 'item',
				icon: 'heroicons-outline:check-badge',
				url: '/pages/kyc-approvals',
				auth: authRoles.admin,
				end: true,
			},
		],
	},

	// Vendor menu (vendors can buy from suppliers - wholesale catalog access)
	{
		id: 'vendor',
		type: 'group',
		icon: 'heroicons-outline:shopping-bag',
		translate: 'VENDOR',
		auth: [...authRoles.vendor, ...authRoles.supplier], // Allow vendor and supplier roles only
		children: [
			{
				id: 'vendor.dashboards',
				title: 'Dashboard',
				translate: 'VENDOR_DASHBOARD',
				type: 'item',
				icon: 'heroicons-outline:clipboard-document-check',
				url: '/dashboards/vendor',
				auth: [...authRoles.vendor, ...authRoles.supplier],
			},
			{
				id: 'vendor.analytics',
				title: 'Analytics',
				translate: 'VENDOR_ANALYTICS',
				type: 'item',
				icon: 'heroicons-outline:chart-bar',
				url: '/dashboards/vendor-analytics',
				auth: [...authRoles.vendor, ...authRoles.supplier],
			},
			divider(),
			{
				id: 'vendor.orders',
				title: 'Orders',
				translate: 'VENDOR_ORDERS',
				type: 'item',
				icon: 'feather:package',
				url: '/apps/e-commerce/orders',
				end: true,
			},
			divider(),
			{
				id: 'vendor.products',
				title: 'Products',
				translate: 'VENDOR_PRODUCTS',
				type: 'collapse',
				icon: 'heroicons-outline:shopping-cart',
				children: [
					{
						id: 'vendor.products.all',
						title: 'Products',
						translate: 'VENDOR_PRODUCTS_ALL',
						type: 'item',
						url: '/apps/e-commerce/products',
						end: true,
					},
					{
						id: 'vendor.products.new',
						title: 'New Product',
						translate: 'VENDOR_PRODUCTS_NEW',
						type: 'item',
						url: '/apps/e-commerce/products/new',
					},
					{
						id: 'vendor.products.wholesale',
						title: 'Wholesale Catalog',
						translate: 'VENDOR_PRODUCTS_WHOLESALE',
						type: 'item',
						url: '/apps/e-commerce/wholesale-catalog',
						end: true,
					},
				],
			},
			divider(),
			{
				id: 'vendor.categories',
				title: 'Categories',
				translate: 'VENDOR_CATEGORIES',
				type: 'collapse',
				icon: 'material-outline:category',
				children: [
					{
						id: 'vendor.categories.all',
						title: 'Categories',
						translate: 'VENDOR_CATEGORIES_ALL',
						type: 'item',
						url: '/apps/e-commerce/categories',
					},
					{
						id: 'vendor.categories.new',
						title: 'New category',
						translate: 'VENDOR_CATEGORIES_NEW',
						type: 'item',
						url: '/apps/e-commerce/categories/new',
					},
				],
			},
			divider(),
			{
				id: 'vendor.reports',
				title: 'Reports',
				translate: 'VENDOR_REPORTS',
				type: 'item',
				url: '/apps/e-commerce/reports',
				icon: 'heroicons-outline:arrow-trending-up',
				end: true,
			},
			divider(),
			{
				id: 'vendor.live-selling',
				title: 'Live Selling',
				translate: 'VENDOR_LIVE_SELLING',
				type: 'item',
				url: '/apps/e-commerce/live-selling',
				icon: 'heroicons-outline:video-camera',
				auth: [...authRoles.vendor], // Vendor only
				end: true,
			},
			divider(),
			{
				id: 'vendor.payouts',
				title: 'Payouts',
				translate: 'VENDOR_PAYOUTS',
				type: 'item',
				url: '/apps/e-commerce/payouts',
				icon: 'heroicons-outline:currency-dollar',
				auth: [...authRoles.vendor, ...authRoles.supplier], // Allow both vendor and supplier roles
				end: true,
			},
			{
				id: 'vendor.order-settings',
				title: 'Order Options',
				translate: 'VENDOR_ORDER_OPTIONS',
				type: 'item',
				url: '/apps/e-commerce/order-settings',
				icon: 'heroicons-outline:cog-6-tooth',
				auth: [...authRoles.vendor, ...authRoles.supplier], // Allow both vendor and supplier roles
				end: true,
			},
			divider(),
			{
				id: 'supplier.credit-terms',
				title: 'Credit Terms',
				translate: 'SUPPLIER_CREDIT_TERMS',
				type: 'item',
				url: '/apps/e-commerce/credit-terms',
				icon: 'heroicons-outline:credit-card',
				auth: authRoles.supplier, // Only suppliers can manage credit terms
				end: true,
			},
			{
				id: 'supplier.wholesale-orders',
				title: 'Wholesale Orders',
				translate: 'SUPPLIER_WHOLESALE_ORDERS',
				type: 'item',
				url: '/apps/e-commerce/wholesale-orders',
				icon: 'heroicons-outline:shopping-cart',
				auth: authRoles.supplier, // Only suppliers can view wholesale orders
				end: true,
			},
			divider(),
			{
				id: 'vendor.messages',
				title: 'Messages',
				translate: 'VENDOR_MESSAGES',
				type: 'item',
				icon: 'heroicons-outline:chat-bubble-left-right',
				url: '/apps/messages',
				auth: [...authRoles.vendor, ...authRoles.supplier], // Allow both vendor and supplier roles
				end: true,
			},
			divider(),
			{
				id: 'vendor.kyc',
				title: 'KYC Verification',
				translate: 'VENDOR_KYC',
				type: 'item',
				icon: 'heroicons-outline:identification',
				url: '/pages/kyc',
				auth: [...authRoles.vendor, ...authRoles.supplier], // Allow both vendor and supplier roles
			},
			divider(),

			{
				id: 'user-account',
				title: 'Account',
				translate: 'USER_ACCOUNT',
				type: 'collapse',
				icon: 'heroicons-outline:user-circle',
				children: [
					{
						id: 'user-password',
						title: 'Change Password',
						translate: 'USER_PASSWORD',
						type: 'item',
						url: '/accounts/profile#change-password',
					},
				],
			},
			divider(), // 👈 divider added here too
		],
	},

];

export default navigationConfig;

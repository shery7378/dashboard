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
	type: 'divider'
});

const navigationConfig: FuseNavItemType[] = [

	// ─────────────────────────────────────────────
	// ADMIN MENU
	// ─────────────────────────────────────────────
	{
		id: 'admin',
		type: 'group',
		icon: 'heroicons-outline:shield-check',
		translate: 'ADMIN',
		auth: authRoles.admin,
		children: [

			// ── Dashboard ──────────────────────────
			{
				id: 'admin.dashboards',
				title: 'Dashboard',
				type: 'item',
				icon: 'heroicons-outline:clipboard-document-check',
				url: '/dashboards/project',
				auth: authRoles.admin
			},

			divider(),

			// ── Marketplace ────────────────────────
			{
				id: 'admin.marketplace',
				title: 'Marketplace',
				type: 'collapse',
				icon: 'heroicons-outline:building-storefront',
				auth: authRoles.admin,
				children: [
					{
						id: 'admin.sellers',
						title: 'Sellers',
						type: 'item',
						icon: 'feather:user-check',
						url: '/sellers',
						end: true
					},
					{
						id: 'admin.stores',
						title: 'Stores',
						type: 'item',
						icon: 'heroicons-outline:building-storefront',
						url: '/apps/e-commerce/stores',
						end: true
					},
					{
						id: 'admin.customers',
						title: 'Customers',
						type: 'item',
						icon: 'heroicons-outline:users',
						url: '/accounts',
						end: true
					}
				]
			},

			divider(),

			// ── Catalog ────────────────────────────
			{
				id: 'admin.catalog',
				title: 'Catalog',
				type: 'collapse',
				icon: 'heroicons-outline:shopping-cart',
				auth: authRoles.admin,
				children: [
					{
						id: 'admin.products.all',
						title: 'Products',
						type: 'item',
						icon: 'heroicons-outline:shopping-cart',
						url: '/apps/e-commerce/products',
						end: true
					},
					{
						id: 'admin.categories.all',
						title: 'Categories',
						type: 'item',
						icon: 'material-outline:category',
						url: '/apps/e-commerce/categories',
						end: true
					},
					{
						id: 'admin.products.new',
						title: 'Add Product',
						type: 'item',
						icon: 'heroicons-outline:plus-circle',
						url: '/apps/e-commerce/products/new',
						end: true
					},
					{
						id: 'admin.categories.new',
						title: 'Add Category',
						type: 'item',
						icon: 'heroicons-outline:plus-circle',
						url: '/apps/e-commerce/categories/new',
						end: true
					}
				]
			},

			divider(),

			// ── Orders ─────────────────────────────
			{
				id: 'admin.orders-group',
				title: 'Orders',
				type: 'collapse',
				icon: 'feather:package',
				auth: authRoles.admin,
				children: [
					{
						id: 'admin.orders',
						title: 'All Orders',
						type: 'item',
						icon: 'feather:package',
						url: '/apps/e-commerce/orders',
						end: true
					},
					{
						id: 'admin.refund-requests',
						title: 'Refund Requests',
						type: 'item',
						icon: 'heroicons-outline:arrow-uturn-left',
						url: '/apps/e-commerce/refund-requests',
						end: true,
						auth: authRoles.admin
					},
					{
						id: 'admin.returns-refunds',
						title: 'Returns / Refunds',
						type: 'item',
						icon: 'heroicons-outline:receipt-refund',
						url: '/apps/e-commerce/returns',
						end: true,
						auth: authRoles.admin
					}
				]
			},

			divider(),

			// ── Finance ────────────────────────────
			{
				id: 'admin.finance',
				title: 'Finance',
				type: 'collapse',
				icon: 'heroicons-outline:banknotes',
				auth: authRoles.admin,
				children: [
					{
						id: 'admin.withdrawals',
						title: 'Withdrawals',
						type: 'item',
						icon: 'heroicons-outline:banknotes',
						url: '/apps/e-commerce/withdrawals',
						end: true,
						auth: authRoles.admin
					},
					{
						id: 'admin.transactions',
						title: 'Transactions',
						type: 'item',
						icon: 'heroicons-outline:arrows-right-left',
						url: '/apps/e-commerce/transactions',
						end: true,
						auth: authRoles.admin
					},
					{
						id: 'admin.payout-requests',
						title: 'Payout Requests',
						type: 'item',
						icon: 'heroicons-outline:currency-dollar',
						url: '/apps/e-commerce/payout-requests',
						end: true,
						auth: authRoles.admin
					}
				]
			},

			divider(),

			// ── Promotions ─────────────────────────
			{
				id: 'admin.promotions',
				title: 'Promotions',
				type: 'collapse',
				icon: 'heroicons-outline:megaphone',
				auth: authRoles.admin,
				children: [
					{
						id: 'admin.marketing.coupons',
						title: 'Coupons',
						type: 'item',
						icon: 'heroicons-outline:ticket',
						url: '/pages/marketing/coupons',
						end: true
					},
					{
						id: 'admin.marketing.flashsales',
						title: 'Flash Sales',
						type: 'item',
						icon: 'heroicons-outline:bolt',
						url: '/pages/marketing/flash-sales',
						end: true
					},
					{
						id: 'admin.marketing.campaigns',
						title: 'Campaigns',
						type: 'item',
						icon: 'heroicons-outline:megaphone',
						url: '/pages/marketing/campaigns',
						end: true
					},
					{
						id: 'admin.loyalty-points',
						title: 'Loyalty Points',
						type: 'item',
						icon: 'heroicons-outline:star',
						url: '/apps/e-commerce/loyalty-points',
						end: true,
						auth: authRoles.admin
					}
				]
			},

			divider(),

			// ── Reports & Analytics ────────────────
			{
				id: 'admin.reports-analytics',
				title: 'Reports & Analytics',
				type: 'collapse',
				icon: 'heroicons-outline:arrow-trending-up',
				auth: authRoles.admin,
				children: [
					{
						id: 'admin.analytics',
						title: 'Analytics',
						type: 'item',
						icon: 'heroicons-outline:chart-pie',
						url: '/dashboards/analytics',
						auth: authRoles.admin
					},
					{
						id: 'admin.reports',
						title: 'Reports',
						type: 'item',
						icon: 'heroicons-outline:arrow-trending-up',
						url: '/reports',
						end: true
					}
				]
			},

			divider(),

			// ── User Management ────────────────────
			{
				id: 'admin.user-management',
				title: 'User Management',
				type: 'collapse',
				icon: 'material-outline:supervised_user_circle',
				auth: authRoles.admin,
				children: [
					{
						id: 'admin.users',
						title: 'Users',
						type: 'item',
						icon: 'material-outline:supervised_user_circle',
						url: '/accounts',
						end: true
					},
					{
						id: 'admin.kyc-approvals',
						title: 'KYC Approvals',
						type: 'item',
						icon: 'heroicons-outline:check-badge',
						url: '/pages/kyc-approvals',
						auth: authRoles.admin,
						end: true
					}
				]
			},

			divider(),

			// ── System ─────────────────────────────
			{
				id: 'admin.system',
				title: 'System',
				type: 'collapse',
				icon: 'material-outline:settings',
				auth: authRoles.admin,
				children: [
					{
						id: 'admin.messages',
						title: 'Messages',
						type: 'item',
						icon: 'heroicons-outline:chat-bubble-left-right',
						url: '/apps/messages',
						end: true
					},
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
								end: true
							},
							{
								id: 'admin.notification-settings',
								title: 'Notification Settings',
								type: 'item',
								icon: 'heroicons-outline:bell-alert',
								url: '/pages/settings/notifications',
								auth: authRoles.admin,
								end: true
							},
							{
								id: 'admin.maps-radius-settings',
								title: 'Maps & Radius Search',
								type: 'item',
								icon: 'heroicons-outline:map',
								url: '/pages/settings/radius',
								auth: authRoles.admin,
								end: true
							},
							{
								id: 'admin.currency-rates-settings',
								title: 'Currency Rates',
								type: 'item',
								icon: 'heroicons-outline:currency-dollar',
								url: '/pages/settings/currency-rates',
								auth: authRoles.admin,
								end: true
							},
							{
								id: 'admin.product-fees-settings',
								title: 'Product Fees',
								type: 'item',
								icon: 'heroicons-outline:currency-dollar',
								url: '/pages/settings/product-fees',
								auth: authRoles.admin,
								end: true
							},
							divider(),
							{
								id: 'admin.payment-methods-settings',
								title: 'Payment Methods',
								type: 'item',
								icon: 'heroicons-outline:credit-card',
								url: '/apps/settings/payment-methods',
								auth: authRoles.admin,
								end: true
							}
						]
					}
				]
			}
		]
	},

	// ─────────────────────────────────────────────
	// SELLER / SUPPLIER MENU  (shared — same sidebar for both roles)
	// ─────────────────────────────────────────────
	{
		id: 'seller',
		type: 'group',
		icon: 'heroicons-outline:shopping-bag',
		auth: [...authRoles.vendor, ...authRoles.supplier],
		children: [

			// ── Dashboard ──────────────────────────
			{
				id: 'seller.dashboards',
				title: 'Dashboard',
				type: 'item',
				icon: 'heroicons-outline:clipboard-document-check',
				url: '/dashboards/seller',
				end: true
			},

			divider(),

			// ── Store ──────────────────────────────
			{
				id: 'seller.store',
				title: 'Store',
				type: 'collapse',
				icon: 'heroicons-outline:building-storefront',
				children: [
					{
						id: 'seller.store.profile',
						title: 'Store Profile',
						type: 'item',
						icon: 'heroicons-outline:identification',
						url: '/apps/e-commerce/my-store',
						end: true
					},
					{
						id: 'seller.store.settings',
						title: 'Store Settings',
						type: 'item',
						icon: 'heroicons-outline:cog-6-tooth',
						url: '/apps/e-commerce/my-store',
						end: true
					},
					{
						id: 'seller.store.hours',
						title: 'Business Hours',
						type: 'item',
						icon: 'heroicons-outline:clock',
						url: '/apps/e-commerce/my-store',
						end: true
					}
				]
			},

			divider(),

			// ── Products ───────────────────────────
			{
				id: 'seller.products',
				title: 'Products',
				type: 'collapse',
				icon: 'heroicons-outline:shopping-cart',
				children: [
					{
						id: 'seller.products.all',
						title: 'All Products',
						type: 'item',
						url: '/apps/e-commerce/products',
						end: true
					},
					{
						id: 'seller.products.new',
						title: 'Add Product',
						type: 'item',
						icon: 'heroicons-outline:plus-circle',
						url: '/apps/e-commerce/products/new',
						end: true
					},
					{
						id: 'seller.products.categories',
						title: 'Categories',
						type: 'item',
						icon: 'material-outline:category',
						url: '/apps/e-commerce/categories',
						end: true
					},
					{
						id: 'seller.products.wholesale',
						title: 'Wholesale Catalog',
						type: 'item',
						url: '/apps/e-commerce/wholesale-catalog',
						end: true
					}
				]
			},

			divider(),

			// ── Orders ─────────────────────────────
			{
				id: 'seller.orders-group',
				title: 'Orders',
				type: 'collapse',
				icon: 'feather:package',
				children: [
					{
						id: 'seller.orders.all',
						title: 'All Orders',
						type: 'item',
						icon: 'feather:package',
						url: '/apps/e-commerce/orders',
						end: true
					},
					{
						id: 'seller.orders.pending',
						title: 'Pending Orders',
						type: 'item',
						icon: 'heroicons-outline:clock',
						url: '/apps/e-commerce/orders?status=pending',
						end: true
					},
					{
						id: 'seller.orders.completed',
						title: 'Completed Orders',
						type: 'item',
						icon: 'heroicons-outline:check-circle',
						url: '/apps/e-commerce/orders?status=completed',
						end: true
					},
					{
						id: 'seller.orders.refunds',
						title: 'Refund Requests',
						type: 'item',
						icon: 'heroicons-outline:arrow-uturn-left',
						url: '/apps/e-commerce/refund-requests',
						end: true
					}
				]
			},

			divider(),

			// ── Earnings ───────────────────────────
			{
				id: 'seller.earnings',
				title: 'Earnings',
				type: 'collapse',
				icon: 'heroicons-outline:currency-dollar',
				children: [
					{
						id: 'seller.earnings.overview',
						title: 'Earnings Overview',
						type: 'item',
						icon: 'heroicons-outline:chart-bar',
						url: '/dashboards/seller-analytics',
						end: true
					},
					{
						id: 'seller.earnings.withdraw',
						title: 'Withdraw Funds',
						type: 'item',
						icon: 'heroicons-outline:banknotes',
						url: '/apps/e-commerce/payouts',
						end: true
					},
					{
						id: 'seller.earnings.withdrawal-history',
						title: 'Withdrawal History',
						type: 'item',
						icon: 'heroicons-outline:clock',
						url: '/apps/e-commerce/withdrawal-history',
						end: true
					},
					{
						id: 'seller.earnings.transactions',
						title: 'Transactions',
						type: 'item',
						icon: 'heroicons-outline:arrows-right-left',
						url: '/apps/e-commerce/transactions',
						end: true
					}
				]
			},

			divider(),

			// ── Marketing ──────────────────────────
			{
				id: 'seller.marketing',
				title: 'Marketing',
				type: 'collapse',
				icon: 'heroicons-outline:megaphone',
				children: [
					{
						id: 'seller.marketing.coupons',
						title: 'Coupons',
						type: 'item',
						icon: 'heroicons-outline:ticket',
						url: '/pages/marketing/coupons',
						end: true
					},
					{
						id: 'seller.marketing.flashsales',
						title: 'Flash Sales',
						type: 'item',
						icon: 'heroicons-outline:bolt',
						url: '/pages/marketing/flash-sales',
						end: true
					},
					{
						id: 'seller.marketing.campaigns',
						title: 'Campaigns',
						type: 'item',
						icon: 'heroicons-outline:megaphone',
						url: '/pages/marketing/campaigns',
						end: true
					},
					{
						id: 'seller.marketing.loyalty',
						title: 'Loyalty Points',
						type: 'item',
						icon: 'heroicons-outline:star',
						url: '/apps/e-commerce/loyalty-points',
						end: true
					},
					{
						id: 'seller.live-selling',
						title: 'Live Selling',
						type: 'item',
						icon: 'heroicons-outline:video-camera',
						url: '/apps/e-commerce/live-selling',
						end: true
					}
				]
			},

			divider(),

			// ── Messages ───────────────────────────
			{
				id: 'seller.messages',
				title: 'Messages',
				type: 'item',
				icon: 'heroicons-outline:chat-bubble-left-right',
				url: '/apps/messages',
				end: true
			},

			divider(),

			// ── Reports ────────────────────────────
			{
				id: 'seller.reports',
				title: 'Reports',
				type: 'item',
				icon: 'heroicons-outline:arrow-trending-up',
				url: '/reports',
				end: true
			},

			divider(),

			// ── Account ────────────────────────────
			{
				id: 'seller.account',
				title: 'Account',
				type: 'collapse',
				icon: 'heroicons-outline:user-circle',
				children: [
					{
						id: 'seller.account.profile',
						title: 'Profile',
						type: 'item',
						icon: 'heroicons-outline:user',
						url: '/accounts/profile',
						end: true
					},
					{
						id: 'seller.account.settings',
						title: 'Settings',
						type: 'item',
						icon: 'heroicons-outline:cog-6-tooth',
						url: '/accounts/settings',
						end: true
					},
					{
						id: 'seller.kyc',
						title: 'KYC Verification',
						type: 'item',
						icon: 'heroicons-outline:identification',
						url: '/pages/kyc'
					},
					{
						id: 'user-password',
						title: 'Change Password',
						translate: 'USER_PASSWORD',
						type: 'item',
						icon: 'heroicons-outline:lock-closed',
						url: '/accounts/profile#change-password'
					}
				]
			},

			divider()
		]
	}
];

export default navigationConfig;
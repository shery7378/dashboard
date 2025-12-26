/**
 * The authRoles object defines the authorization roles for the Fuse application.
 */
const authRoles = {
	/**
	 * The admin role grants access to users with the 'admin' role.
	 */
	admin: ['admin'],

	/**
	 * The vendor role grants access to users with the 'vendor' role.
	 * Vendors can buy from suppliers (wholesale catalog) and sell to customers.
	 */
	vendor: ['vendor'],

	/**
	 * The supplier role grants access to users with the 'supplier' role.
	 */
	supplier: ['supplier'],

	/**
	 * The staff role grants access to users with the 'admin' or 'staff' role.
	 */
	staff: ['admin', 'staff'],

	/**
	 * The user role grants access to users with the 'admin', 'staff', or 'user' role.
	 */
	user: ['admin', 'staff', 'user'],

	/**
	 * The onlyGuest role grants access to unauthenticated users.
	 */
	onlyGuest: []
};

export default authRoles;

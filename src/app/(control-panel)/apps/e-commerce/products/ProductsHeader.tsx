import { useState } from 'react';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { motion } from 'motion/react';
import PageBreadcrumb from 'src/components/PageBreadcrumb';
import { useTranslation } from 'react-i18next';
import { useSession } from 'next-auth/react';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import Link from '@fuse/core/Link';
import ImportProductModal from './ImportProductModal';
import { useGetCurrentUserStoreQuery } from '../apis/StoresLaravelApi';
import './i18n';

/**
 * The products header.
 */
function ProductsHeader() {
	const { t } = useTranslation('products');
	const { data: session } = useSession();
	const [importModalOpen, setImportModalOpen] = useState(false);
	
	// Get current user's store
	const { data: storeData } = useGetCurrentUserStoreQuery();
	const store = storeData?.data;

	// Get user roles
	const user = session?.user || session?.db;
	const userRoles = user?.role || session?.db?.role || [];
	const roles = Array.isArray(userRoles) ? userRoles : [userRoles];
	
	// Hide import button for suppliers and admins
	const isSupplier = roles.includes('supplier');
	const isAdmin = roles.includes('admin');
	const showImportButton = !isSupplier && !isAdmin;

	// Check if both delivery and pickup are off
	const bothDeliveryAndPickupOff = store && !store.offers_delivery && !store.offers_pickup;

	return (
		<div className="flex grow-0 flex-1 w-full items-center justify-between space-y-2 sm:space-y-0 py-6 sm:py-8">
			<motion.span
				initial={{ x: -20 }}
				animate={{ x: 0, transition: { delay: 0.2 } }}
			>
				<div>
					<PageBreadcrumb className="mb-2" />
					<Typography className="text-4xl font-extrabold leading-none tracking-tight">{t('products')}</Typography>
				</div>
			</motion.span>
			<motion.div
				initial={{ x: 20 }}
				animate={{ x: 0, transition: { delay: 0.2 } }}
				className="flex items-center gap-2"
			>
				{showImportButton && (
					<Button
						variant="outlined"
						color="primary"
						startIcon={<FuseSvgIcon size={16}>heroicons-outline:arrow-down-tray</FuseSvgIcon>}
						onClick={() => setImportModalOpen(true)}
						disabled={bothDeliveryAndPickupOff}
						title={bothDeliveryAndPickupOff ? 'Import is disabled when both delivery and pickup are off' : ''}
					>
						<span className="hidden sm:inline">{t('import_product')}</span>
						<span className="sm:hidden">{t('import')}</span>
					</Button>
				)}
				<Button
					component={Link}
					to="/apps/e-commerce/products/new"
					role="button"
					variant="contained"
					color="primary"
					startIcon={<FuseSvgIcon size={16}>heroicons-outline:plus</FuseSvgIcon>}
					disabled={bothDeliveryAndPickupOff}
					title={bothDeliveryAndPickupOff ? 'Adding products is disabled when both delivery and pickup are off' : ''}
				>
					<span className="hidden sm:inline">{t('add')} {t('new_product')}</span>
					<span className="sm:hidden">{t('add')}</span>
				</Button>
			</motion.div>
			{showImportButton && (
				<ImportProductModal 
					open={importModalOpen} 
					onClose={() => setImportModalOpen(false)} 
				/>
			)}
		</div>
	);
}

export default ProductsHeader;

import { useState } from 'react';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { motion } from 'motion/react';
import PageBreadcrumb from 'src/components/PageBreadcrumb';
import { useTranslation } from 'react-i18next';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import Link from '@fuse/core/Link';
import ImportProductModal from './ImportProductModal';
import './i18n';

/**
 * The products header.
 */
function ProductsHeader() {
	const { t } = useTranslation('products');
	const [importModalOpen, setImportModalOpen] = useState(false);

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
				<Button
					variant="outlined"
					color="primary"
					startIcon={<FuseSvgIcon size={16}>heroicons-outline:arrow-down-tray</FuseSvgIcon>}
					onClick={() => setImportModalOpen(true)}
				>
					<span className="hidden sm:inline">{t('import_product')}</span>
					<span className="sm:hidden">{t('import')}</span>
				</Button>
				<Button
					component={Link}
					to="/apps/e-commerce/products/new"
					role="button"
					variant="contained"
					color="primary"
					startIcon={<FuseSvgIcon size={16}>heroicons-outline:plus</FuseSvgIcon>}
				>
					<span className="hidden sm:inline">{t('add')} {t('new_product')}</span>
					<span className="sm:hidden">{t('add')}</span>
				</Button>
			</motion.div>
			<ImportProductModal 
				open={importModalOpen} 
				onClose={() => setImportModalOpen(false)} 
			/>
		</div>
	);
}

export default ProductsHeader;

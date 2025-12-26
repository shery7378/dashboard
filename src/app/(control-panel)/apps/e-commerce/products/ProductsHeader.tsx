import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { motion } from 'motion/react';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import NavLinkAdapter from '@fuse/core/NavLinkAdapter';
import useThemeMediaQuery from '@fuse/hooks/useThemeMediaQuery';
import PageBreadcrumb from 'src/components/PageBreadcrumb';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import ImportProductModal from './ImportProductModal';
import './i18n';

/**
 * The products header.
 */
function ProductsHeader() {
	const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down('lg'));
	const { t } = useTranslation('products');
	const [importModalOpen, setImportModalOpen] = useState(false);

	return (
		<>
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

			<div className="flex flex-1 items-center justify-end space-x-2">
				<motion.div
						className="flex grow-0 space-x-2"
					initial={{ opacity: 0, x: 20 }}
					animate={{ opacity: 1, x: 0, transition: { delay: 0.2 } }}
				>
						<Button
							className=""
							variant="outlined"
							color="primary"
							onClick={() => setImportModalOpen(true)}
							size={isMobile ? 'small' : 'medium'}
						>
							<FuseSvgIcon size={20}>heroicons-outline:arrow-down-tray</FuseSvgIcon>
							<span className="mx-1 sm:mx-2">{t('import_product')}</span>
						</Button>
					<Button
						className=""
						variant="contained"
						color="secondary"
						component={NavLinkAdapter}
						to="/apps/e-commerce/products/new"
						size={isMobile ? 'small' : 'medium'}
					>
						<FuseSvgIcon size={20}>heroicons-outline:plus</FuseSvgIcon>
						<span className="mx-1 sm:mx-2">{t('add')}</span>
					</Button>
				</motion.div>
			</div>
		</div>
			<ImportProductModal open={importModalOpen} onClose={() => setImportModalOpen(false)} />
		</>
	);
}

export default ProductsHeader;

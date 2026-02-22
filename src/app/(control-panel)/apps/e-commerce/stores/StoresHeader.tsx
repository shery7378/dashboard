import Typography from '@mui/material/Typography';
import { motion } from 'framer-motion'; // ✅ fix: correct import from framer-motion
import useThemeMediaQuery from '@fuse/hooks/useThemeMediaQuery';
import PageBreadcrumb from 'src/components/PageBreadcrumb';

/**
 * Header for the Stores page — shows breadcrumb and Add button.
 */
function StoresHeader() {
	const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down('lg'));

	return (
		<div className="flex grow-0 flex-1 w-full items-center justify-between space-y-2 sm:space-y-0 py-6 sm:py-8">
			{/* Page title with animation */}
			<motion.span
				initial={{ x: -20 }}
				animate={{ x: 0, transition: { delay: 0.2 } }}
			>
				<div>
					<PageBreadcrumb className="mb-2" />
					<Typography className="text-4xl font-extrabold leading-none tracking-tight">Stores</Typography>
				</div>
			</motion.span>

			{/* Add button */}
			{/* <div className="flex flex-1 items-center justify-end space-x-2">
				<motion.div
					className="flex grow-0"
					initial={{ opacity: 0, x: 20 }}
					animate={{ opacity: 1, x: 0, transition: { delay: 0.2 } }}
				>
					<Button
						variant="contained"
						color="secondary"
						component={NavLinkAdapter}
						to="/apps/e-commerce/stores/new"
						size={isMobile ? 'small' : 'medium'}
					>
						<FuseSvgIcon size={20}>heroicons-outline:plus</FuseSvgIcon>
						<span className="mx-1 sm:mx-2">Add</span>
					</Button>
				</motion.div>
			</div> */}
		</div>
	);
}

export default StoresHeader;

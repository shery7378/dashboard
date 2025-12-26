import { motion } from 'motion/react';
import SummaryWidget from '../../widgets/SummaryWidget';
import OrdersTableForHome from '@/app/(control-panel)/apps/e-commerce/orders/OrdersTableForHome';
import ProductsTableForHome from '@/app/(control-panel)/apps/e-commerce/products/ProductsTableForHome';

/**
 * The Seller HomeTab component.
 * Shows seller-specific dashboard widgets (no wholesale catalog access).
 */
function HomeTab() {
	const container = {
		show: {
			transition: {
				staggerChildren: 0.04
			}
		}
	};

	const item = {
		hidden: { opacity: 0, y: 20 },
		show: { opacity: 1, y: 0 }
	};

	return (
		<motion.div
			className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 w-full min-w-0 py-6 px-6 md:px-8"
			variants={container}
			initial="hidden"
			animate="show"
		>
			<motion.div variants={item}>
				<SummaryWidget />
			</motion.div>
			<motion.div
				id="OrdersTable"
				className="sm:col-span-2 md:col-span-4"
			>
				<OrdersTableForHome />
			</motion.div>

			<motion.div
				id="ProductsTable"
				className="sm:col-span-2 md:col-span-4"
			>
				<ProductsTableForHome />
			</motion.div>
		</motion.div>
	);
}

export default HomeTab;


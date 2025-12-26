'use client';

import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { motion } from 'motion/react';
import Link from '@fuse/core/Link';

function StoreCheck() {
	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1, transition: { delay: 0.1 } }}
			className="flex flex-col flex-1 items-center justify-center h-full"
		>
			<Typography color="text.secondary" variant="h5">
				Please create a store first before adding products.
			</Typography>
			<Button
				className="mt-6"
				component={Link}
				variant="outlined"
				to="/apps/e-commerce/stores/new"
				color="inherit"
			>
				Go To Add Store Page
			</Button>
		</motion.div>
	);
}

export default StoreCheck;

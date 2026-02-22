//src/app/(control-panel)/apps/e-commerce/products/ProductsTableForHome.tsx
import { useMemo, useState } from 'react';
import { type MRT_ColumnDef } from 'material-react-table';
import DataTable from 'src/components/data-table/DataTable';
import FuseLoading from '@fuse/core/FuseLoading';
import { Chip, Paper } from '@mui/material';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import Link from '@fuse/core/Link';
import Typography from '@mui/material/Typography';
import clsx from 'clsx';
import { useSnackbar } from 'notistack';
import {
	EcommerceProduct,
	useDeleteECommerceProductMutation,
	useGetECommerceProductsQuery
} from '../apis/ProductsLaravelApi';
import ProductModel from './models/ProductModel';
import { getContrastColor } from '@/utils/colorUtils';

function ProductsTableForHome() {
	const { data: products, isLoading } = useGetECommerceProductsQuery();
	const [removeProduct] = useDeleteECommerceProductMutation();
	const { enqueueSnackbar } = useSnackbar();

	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [selectedIds, setSelectedIds] = useState<number[]>([]);
	const [selectedTable, setSelectedTable] = useState<any>(null);
	const [singleDeleteId, setSingleDeleteId] = useState<number | null>(null);

	const productList: EcommerceProduct[] = useMemo(() => {
		// API returns { data: EcommerceProduct[], pagination: {...} }
		const mapped =
			products?.data?.map((product) => {
				const model = ProductModel(product);

				// Debug: log first product to see structure
				if (products.data.indexOf(product) === 0) {
					console.log('🔍 First product raw data:', {
						raw: product,
						model: model,
						tags: product.tags,
						product_attributes: product.product_attributes,
						attributes: (product as any).attributes
					});
				}

				return model;
			}) ?? [];
		return mapped;
	}, [products]);

	const columns = useMemo<MRT_ColumnDef<EcommerceProduct>[]>(
		() => [
			{
				accessorKey: 'featuredImageId',
				header: '',
				enableColumnFilter: false,
				enableColumnDragging: false,
				size: 64,
				enableSorting: false,
				Cell: ({ row }) => {
					const imageUrl = row.original.featured_image?.url;
					return (
						<div className="flex items-center justify-center">
							<img
								className="w-full max-h-9 max-w-9 block rounded-sm object-cover"
								src={
									imageUrl
										? `${process.env.NEXT_PUBLIC_API_URL}/${imageUrl}`
										: '/assets/images/apps/ecommerce/product-image-placeholder.png'
								}
								alt={row.original.name}
							/>
						</div>
					);
				}
			},
			{
				accessorKey: 'name',
				header: 'Name',
				Cell: ({ row }) => (
					<Typography
						component={Link}
						to={`/apps/e-commerce/products/${row.original.id}/${row.original.slug}`}
						role="button"
					>
						<u>{row.original.name}</u>
					</Typography>
				)
			},
			{
				accessorKey: 'categories',
				header: 'Category',
				Cell: ({ row }) => {
					const product = row.original;
					const categories = product.main_category
						? [product.main_category, ...(product.subcategories || [])]
						: Array.isArray(product.categories)
							? product.categories
							: [];

					return (
						<div className="flex flex-wrap space-x-0.5">
							{categories.length > 0
								? categories.map((cat: any, idx: number) => (
										<Chip
											key={cat?.id || cat?.name || idx}
											className="text-sm"
											size="small"
											color="default"
											label={cat?.name || cat || '-'}
										/>
									))
								: '-'}
						</div>
					);
				}
			},
			{
				accessorKey: 'tags',
				header: 'Tags',
				Cell: ({ row }) => {
					const product = row.original;
					// Try multiple possible paths for tags
					const tags = product.tags || (product as any).tag_ids || [];

					// Handle both array of objects and array of strings/IDs
					const tagList = Array.isArray(tags) ? tags : [];

					return (
						<div className="flex flex-wrap space-x-0.5 space-y-0.5">
							{tagList.length > 0
								? tagList.map((tag: any, idx: number) => {
										// Handle different tag formats
										const tagName = typeof tag === 'string' ? tag : tag?.name || tag?.label || tag;
										const tagId = tag?.id || idx;

										if (!tagName) return null;

										return (
											<Chip
												key={tagId}
												className="text-sm"
												size="small"
												color="primary"
												label={tagName}
											/>
										);
									})
								: '-'}
						</div>
					);
				}
			},
			{
				accessorKey: 'product_attributes',
				header: 'Attributes',
				Cell: ({ row }) => {
					const product = row.original;
					// Try multiple possible paths for attributes
					const attributes = product.product_attributes || (product as any).attributes || [];

					// Also check variants for attributes
					const variants = (product as any).product_variants || (product as any).variants || [];
					const variantAttrs: any[] = [];

					if (variants.length > 0) {
						variants.forEach((variant: any) => {
							if (variant.attributes && Array.isArray(variant.attributes)) {
								variantAttrs.push(...variant.attributes);
							}
						});
					}

					// Combine product attributes and variant attributes
					const allAttributes = [...attributes, ...variantAttrs];

					return (
						<div className="flex flex-wrap space-x-0.5 space-y-0.5">
							{allAttributes.length > 0
								? allAttributes.map((attr: any, idx: number) => {
										// Handle different attribute formats
										const attrName = attr?.attribute_name || attr?.name || 'Attribute';
										const attrValue = attr?.attribute_value || attr?.value || '-';
										const attrId = attr?.id || idx;

										return (
											<Chip
												key={attrId}
												className="text-sm"
												size="small"
												color="default"
												label={`${attrName}: ${attrValue}`}
												sx={{
													...(attrName === 'Color' && attrValue && attrValue !== '-'
														? {
																backgroundColor: `${attrValue} !important`,
																'& .MuiChip-label': {
																	color: `${getContrastColor(attrValue.toLowerCase())} `
																}
															}
														: {})
												}}
											/>
										);
									})
								: '-'}
						</div>
					);
				}
			},
			{
				accessorKey: 'priceTaxIncl',
				header: 'Price',
				Cell: ({ row }) =>
					`£${parseFloat(String(row.original.price_tax_excl || row.original.price || 0)).toFixed(2)}`
			},
			{
				accessorKey: 'quantity',
				header: 'Quantity',
				Cell: ({ row }) => (
					<div className="flex items-center space-x-2">
						<span>{row.original.quantity}</span>
						<i
							className={clsx(
								'inline-block w-2 h-2 rounded-sm',
								row.original.quantity <= 5 && 'bg-red-500',
								row.original.quantity > 5 && row.original.quantity <= 25 && 'bg-orange-500',
								row.original.quantity > 25 && 'bg-green-500'
							)}
						/>
					</div>
				)
			},
			{
				accessorKey: 'active',
				header: 'Active',
				Cell: ({ row }) => (
					<div className="flex items-center">
						{row.original.active ? (
							<FuseSvgIcon
								className="text-green-500"
								size={20}
							>
								heroicons-outline:check-circle
							</FuseSvgIcon>
						) : (
							<FuseSvgIcon
								className="text-red-500"
								size={20}
							>
								heroicons-outline:minus-circle
							</FuseSvgIcon>
						)}
					</div>
				)
			}
		],
		[]
	);

	const handleDelete = async () => {
		try {
			if (singleDeleteId !== null) {
				await removeProduct(singleDeleteId).unwrap();
				enqueueSnackbar('Product deleted successfully', { variant: 'success' });
			} else {
				await Promise.all(selectedIds.map((id) => removeProduct(id).unwrap()));
				enqueueSnackbar('Products deleted successfully', { variant: 'success' });

				if (selectedTable) {
					selectedTable.resetRowSelection();
				}
			}
		} catch (error) {
			console.error('Error deleting products:', error);
			enqueueSnackbar('Failed to delete product(s)', { variant: 'error' });
		} finally {
			setIsDialogOpen(false);
			setSelectedIds([]);
			setSelectedTable(null);
			setSingleDeleteId(null);
		}
	};

	if (isLoading) return <FuseLoading />;

	return (
		<Paper
			className="flex flex-col flex-auto shadow-1 rounded-t-lg overflow-hidden rounded-b-none w-full h-full"
			elevation={0}
		>
			<DataTable
				initialState={{
					density: 'spacious',
					showColumnFilters: false,
					showGlobalFilter: false
				}}
				enableRowSelection={false}
				enableRowActions={false}
				enableColumnFilters={false}
				enableGlobalFilter={false}
				enableBottomToolbar={false}
				enablePagination={false} // ❌ pagination disable
				data={(productList ?? []).slice(0, 10)} // ✅ only 10 rows
				columns={columns}
				muiTableHeadCellProps={{
					sx: {
						fontSize: '14px',
						fontWeight: 600,
						color: (theme) => theme.palette.text.secondary // muted gray
					}
				}}
				muiTableBodyCellProps={{
					sx: {
						fontSize: '14px',
						fontWeight: 400
					}
				}}
				renderTopToolbarCustomActions={() => (
					<Typography className="text-2xl font-semibold tracking-tight leading-6 truncate">
						Products Table
					</Typography>
				)}
			/>
		</Paper>
	);
}

export default ProductsTableForHome;

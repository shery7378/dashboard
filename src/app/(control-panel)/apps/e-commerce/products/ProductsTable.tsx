import React, { useMemo, useState } from 'react';
import { type MRT_ColumnDef, type MRT_TableInstance } from 'material-react-table';
import DataTable from 'src/components/data-table/DataTable';
// import FuseLoading from '@fuse/core/FuseLoading';
import {
	Chip,
	ListItemIcon,
	MenuItem,
	Paper,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogContentText,
	DialogActions,
	Button
} from '@mui/material';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import Link from '@fuse/core/Link';
import Typography from '@mui/material/Typography';
import clsx from 'clsx';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import {
	EcommerceProduct,
	useDeleteECommerceProductMutation,
	useGetECommerceProductsQuery
} from '../apis/ProductsLaravelApi';
import ProductModel from './models/ProductModel';
import { getContrastColor } from '@/utils/colorUtils';
import './i18n';

function ProductsTable() {
	// 🔹 Pagination state
	const [pagination, setPagination] = useState({
		pageIndex: 0, // MRT uses 0-based indexing
		pageSize: 15
	});

	const { data: products, isLoading } = useGetECommerceProductsQuery({
		page: pagination.pageIndex + 1,
		perPage: pagination.pageSize
	}, {
		refetchOnMountOrArgChange: 300,
		refetchOnFocus: false
	});

	const [removeProduct] = useDeleteECommerceProductMutation();
	const { enqueueSnackbar } = useSnackbar();
	const { t } = useTranslation('products');

	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [selectedIds, setSelectedIds] = useState<number[]>([]);
	const [selectedTable, setSelectedTable] = useState<MRT_TableInstance<EcommerceProduct> | null>(null);
	const [singleDeleteId, setSingleDeleteId] = useState<number | null>(null);

	const productList: EcommerceProduct[] = useMemo(() => {
		// Handle different possible API response structures
		type ProductsApiShape = {
			data?: EcommerceProduct[];
			products?: { data?: EcommerceProduct[] } | EcommerceProduct[];
		};
		const raw = products as ProductsApiShape | undefined;
		const productsData: EcommerceProduct[] =
			raw?.data ??
			(Array.isArray(raw?.products)
				? raw.products
				: (raw?.products as { data?: EcommerceProduct[] } | undefined)?.data) ??
			[];
		const productArray = Array.isArray(productsData) ? productsData : [];
		return productArray.map((product: EcommerceProduct) => {
			const mapped = ProductModel(product);

			// Ensure tags and product_attributes are arrays (handle null/undefined)
			if (!Array.isArray(mapped.tags)) {
				(mapped as EcommerceProduct & { tags: string[] }).tags = [];
			}

			if (!Array.isArray((mapped as EcommerceProduct & { product_attributes?: unknown[] }).product_attributes)) {
				(mapped as EcommerceProduct & { product_attributes: unknown[] }).product_attributes = [];
			}

			return mapped;
		});
	}, [products]);

	const columns = useMemo<MRT_ColumnDef<EcommerceProduct>[]>(
		() => [
			{
				accessorKey: 'featuredImageId',
				header: '',
				enableColumnFilter: false,
				enableColumnDragging: false,
				size: 100,
				enableSorting: false,
				Cell: ({ row }) => {
					const imageUrl = row.original.featured_image?.url;
					// Handle both relative and absolute URLs
					const buildImageUrl = (url: string | undefined) => {
						if (!url) return '/assets/images/apps/ecommerce/product-image-placeholder.png';

						if (url.startsWith('http://') || url.startsWith('https://')) return url;

						const apiBase = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');

						if (apiBase) {
							return url.startsWith('/') ? `${apiBase}${url}` : `${apiBase}/${url}`;
						}

						return url.startsWith('/') ? url : `/${url}`;
					};

					return (
						<div className="flex items-center justify-center relative w-20 h-20">
							<img
								className="rounded-sm object-cover w-full h-full"
								src={buildImageUrl(imageUrl)}
								alt={row.original.name}
								onError={(e) => {
									const target = e.target as HTMLImageElement;
									target.src = '/assets/images/apps/ecommerce/product-image-placeholder.png';
								}}
							/>
						</div>
					);
				}
			},
			{
				accessorKey: 'name',
				header: t('name'),
				Cell: ({ row }) => {
					type ProductRow = EcommerceProduct & { id?: string | number; slug?: string };
					const productId = String((row.original as ProductRow).id || '');
					const slug = (row.original as ProductRow).slug || '';

					// Always use just the productId in the URL (slug is optional and handled by [[...handle]])
					// This ensures the route matches correctly
					const productUrl = `/apps/e-commerce/products/${productId}${slug && slug.trim() !== '' ? `/${slug}` : ''}`;

					return (
						<Typography
							component={Link}
							to={productUrl}
							role="button"
						>
							<u>{row.original.name}</u>
						</Typography>
					);
				}
			},
			{
				accessorKey: 'categories',
				header: t('category'),
				Cell: ({ row }) => {
					const mainCategory = row.original.main_category;
					type SubCat = { id?: string | number; name: string };
					const subcategories = ((row.original as EcommerceProduct & { subcategories?: SubCat[] }).subcategories) || [];
					const categories = row.original.categories || [];

					// Collect all categories to display
					const categoryChips: React.ReactElement[] = [];

					// Add main category if it exists
					if (mainCategory && mainCategory.name) {
						categoryChips.push(
							<Chip
								key={`main-${mainCategory.id || mainCategory.name}`}
								className="text-sm"
								size="small"
								color="default"
								label={mainCategory.name}
							/>
						);
					}

					// Add subcategories if they exist
					if (Array.isArray(subcategories) && subcategories.length > 0) {
						subcategories.forEach((sub: SubCat) => {
							if (sub && sub.name) {
								categoryChips.push(
									<Chip
										key={`sub-${sub.id || sub.name}`}
										className="text-sm"
										size="small"
										color="default"
										label={sub.name}
									/>
								);
							}
						});
					}

					// Fallback: if no main_category or subcategories, try to use categories array
					if (categoryChips.length === 0 && Array.isArray(categories) && categories.length > 0) {
						categories.forEach((cat: string | { name?: string }, index: number) => {
							const catName = typeof cat === 'string' ? cat : cat?.name;

							if (catName) {
								categoryChips.push(
									<Chip
										key={`cat-${index}`}
										className="text-sm"
										size="small"
										color="default"
										label={catName}
									/>
								);
							}
						});
					}

					return (
						<div className="flex flex-wrap space-x-0.5">
							{categoryChips.length > 0 ? categoryChips : '-'}
						</div>
					);
				}
			},
			{
				accessorKey: 'tags',
				header: t('tags'),
				Cell: ({ row }) => {
					const tags = row.original.tags || [];
					type TagOrSub = { id?: string | number; name?: string; type?: string };
					const subcategories = ((row.original as EcommerceProduct & { subcategories?: TagOrSub[] }).subcategories) || [];

					// Combine tags and subcategories
					const allItems: TagOrSub[] = [];

					// Add tags
					if (Array.isArray(tags) && tags.length > 0) {
						allItems.push(...tags.map((tag: TagOrSub) => ({ ...tag, type: 'tag' })));
					}

					// Add subcategories
					if (Array.isArray(subcategories) && subcategories.length > 0) {
						allItems.push(...subcategories.map((sub: TagOrSub) => ({ ...sub, type: 'subcategory' })));
					}

					return (
						<div className="flex flex-wrap space-x-0.5 space-y-0.5">
							{allItems.length > 0
								? allItems.map((item: TagOrSub, index: number) => (
										<Chip
											key={item?.id ?? item?.name ?? index}
											className="text-sm"
											size="small"
											color={item.type === 'subcategory' ? 'default' : 'primary'}
											label={item?.name ?? item ?? '-'}
										/>
									))
								: '-'}
						</div>
					);
				}
			},
			{
				accessorKey: 'product_attributes',
				header: t('attributes'),
				Cell: ({ row }) => {
					type Attr = { id?: string | number; attribute_name?: string; attribute_value?: string; name?: string; value?: string };
					type Variant = { attributes?: Attr[]; price?: string | number; price_tax_excl?: string | number; quantity?: string | number; qty?: string | number };
					type ProductWithVariants = EcommerceProduct & { product_attributes?: Attr[]; product_variants?: Variant[]; variants?: Variant[] };
					const pRow = row.original as ProductWithVariants;
					// Check both product_attributes and attributes from variants
					const productAttrs: Attr[] = pRow.product_attributes || [];
					const variants: Variant[] = pRow.product_variants || pRow.variants || [];

					let attributes: Attr[] = productAttrs;

					if (attributes.length === 0 && variants.length > 0) {
						// Extract unique attributes from variants
						const variantAttrs: Attr[] = [];
						variants.forEach((variant: Variant) => {
							if (variant.attributes && Array.isArray(variant.attributes)) {
								variant.attributes.forEach((attr: Attr) => {
									if (
										!variantAttrs.find(
											(a) =>
												a.attribute_name === attr.attribute_name &&
												a.attribute_value === attr.attribute_value
										)
									) {
										variantAttrs.push(attr);
									}
								});
							}
						});
						attributes = variantAttrs;
					}

					return (
						<div className="flex flex-wrap space-x-0.5 space-y-0.5">
							{Array.isArray(attributes) && attributes.length > 0
								? attributes.map((attr: Attr, index: number) => (
										<Chip
											key={
												attr?.id ?? `${attr?.attribute_name}-${attr?.attribute_value}-${index}`
											}
											className="text-sm"
											size="small"
											color="default"
											label={`${attr?.attribute_name || attr?.name || 'Attribute'}: ${attr?.attribute_value || attr?.value || '-'}`}
											sx={{
												...(attr?.attribute_name === 'Color' && attr?.attribute_value
													? {
															backgroundColor: `${attr.attribute_value} !important`,
															'& .MuiChip-label': {
																color: `${getContrastColor(attr.attribute_value.toLowerCase())} `
															}
														}
													: {})
											}}
										/>
									))
								: '-'}
						</div>
					);
				}
			},
			{
				accessorKey: 'priceTaxIncl',
				header: t('price'),
				Cell: ({ row }) => {
					type ProductWithVariants2 = EcommerceProduct & { product_variants?: { price?: string|number; price_tax_excl?: string|number }[]; variants?: { price?: string|number; price_tax_excl?: string|number }[] };
					const pRow2 = row.original as ProductWithVariants2;
					// Check if product has variants - use variant price if available
					const variants2 = pRow2.product_variants || pRow2.variants || [];

					if (variants2.length > 0) {
						// Get the lowest price from variants
						const prices = variants2
							.map((v) => parseFloat(String(v.price || v.price_tax_excl || 0)))
							.filter((p: number) => !isNaN(p) && p > 0);

						if (prices.length > 0) {
							const minPrice = Math.min(...prices);
							return `£${minPrice.toFixed(2)}`;
						}
					}

					// Fallback to product price
					const price = parseFloat(String(row.original.price_tax_excl || row.original.price || 0));
					return price > 0 ? `£${price.toFixed(2)}` : '-';
				}
			},
			{
				accessorKey: 'quantity',
				header: t('quantity'),
				Cell: ({ row }) => {
					type ProductWithVariants3 = EcommerceProduct & { product_variants?: { quantity?: string|number; qty?: string|number }[]; variants?: { quantity?: string|number; qty?: string|number }[] };
					const pRow3 = row.original as ProductWithVariants3;
					// Check if product has variants - sum up variant quantities
					const variants3 = pRow3.product_variants || pRow3.variants || [];

					if (variants3.length > 0) {
						const totalStock = variants3.reduce((sum: number, v) => {
							return sum + parseInt(String(v.quantity || v.qty || 0));
						}, 0);
						return (
							<div className="flex items-center space-x-2">
								<span>{totalStock > 0 ? totalStock : '-'}</span>
								{totalStock > 0 && (
									<i
										className={clsx(
											'inline-block w-2 h-2 rounded-sm',
											totalStock <= 5 && 'bg-red-500',
											totalStock > 5 && totalStock <= 25 && 'bg-orange-500',
											totalStock > 25 && 'bg-green-500'
										)}
									/>
								)}
							</div>
						);
					}

					// Fallback to product quantity
					const quantity = parseInt(String(row.original.quantity || 0));
					return (
						<div className="flex items-center space-x-2">
							<span>{quantity > 0 ? quantity : '-'}</span>
							{quantity > 0 && (
								<i
									className={clsx(
										'inline-block w-2 h-2 rounded-sm',
										quantity <= 5 && 'bg-red-500',
										quantity > 5 && quantity <= 25 && 'bg-orange-500',
										quantity > 25 && 'bg-green-500'
									)}
								/>
							)}
						</div>
					);
				}
			},
			{
				accessorKey: 'active',
				header: t('active'),
				accessorFn: (row) => (
					<div className="flex items-center">
						{row.active ? (
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
		[t]
	);

	const handleDelete = async () => {
		try {
			if (singleDeleteId !== null) {
				await removeProduct(singleDeleteId).unwrap();
				enqueueSnackbar(t('product_deleted_successfully'), { variant: 'success' });
			} else {
				await Promise.all(selectedIds.map((id) => removeProduct(id).unwrap()));
				enqueueSnackbar(t('products_deleted_successfully'), { variant: 'success' });

				if (selectedTable) {
					selectedTable.resetRowSelection();
				}
			}
		} catch (error) {
			console.error('Error deleting products:', error);
			enqueueSnackbar(t('failed_to_delete_product'), { variant: 'error' });
		} finally {
			setIsDialogOpen(false);
			setSelectedIds([]);
			setSelectedTable(null);
			setSingleDeleteId(null);
		}
	};

	// No full screen loading; let DataTable handle it for a smoother experience
	// if (isLoading) return <FuseLoading />;

	return (
		<Paper
			className="flex flex-col flex-auto shadow-1 rounded-t-lg overflow-hidden rounded-b-none w-full h-full"
			elevation={0}
		>
			<DataTable
				data={productList}
				columns={columns}
				manualPagination
				rowCount={products?.pagination?.total ?? 0}
				state={{ pagination, isLoading }}
				onPaginationChange={setPagination}
				renderRowActionMenuItems={({ closeMenu, row, table }) => [
					<MenuItem
						key="delete"
						onClick={() => {
							setSingleDeleteId(row.original.id);
							setIsDialogOpen(true);
							closeMenu();
							table.resetRowSelection();
						}}
					>
						<ListItemIcon>
							<FuseSvgIcon>heroicons-outline:trash</FuseSvgIcon>
						</ListItemIcon>
						{t('delete')}
					</MenuItem>
				]}
				renderTopToolbarCustomActions={({ table }) => {
					const { rowSelection } = table.getState();
					const hasSelected = Object.keys(rowSelection).length > 0;

					if (!hasSelected) return null;

					return (
						<Button
							variant="contained"
							size="small"
							onClick={() => {
								const selected = table.getSelectedRowModel().rows.map((r) => r.original.id);
								setSelectedIds(selected);
								setSelectedTable(table);
								setIsDialogOpen(true);
							}}
							className="flex shrink min-w-9 ltr:mr-2 rtl:ml-2"
							color="secondary"
						>
							<FuseSvgIcon size={16}>heroicons-outline:trash</FuseSvgIcon>
							<span className="hidden sm:flex mx-2">{t('delete_selected_items')}</span>
						</Button>
					);
				}}
			/>

			{/* 🔒 Confirmation Dialog for both single and bulk delete */}
			<Dialog
				open={isDialogOpen}
				onClose={() => setIsDialogOpen(false)}
			>
				<DialogTitle>{t('confirm_deletion')}</DialogTitle>
				<DialogContent>
					<DialogContentText>
						{singleDeleteId !== null
							? t('confirm_delete_product')
							: t('confirm_delete_products', { count: selectedIds.length })}
					</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button
						onClick={() => setIsDialogOpen(false)}
						color="primary"
					>
						{t('cancel')}
					</Button>
					<Button
						onClick={handleDelete}
						color="error"
						variant="contained"
					>
						{t('delete')}
					</Button>
				</DialogActions>
			</Dialog>
		</Paper>
	);
}

export default ProductsTable;

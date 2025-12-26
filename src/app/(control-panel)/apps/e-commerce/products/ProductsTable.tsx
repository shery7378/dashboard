import { useMemo, useState } from 'react';
import { type MRT_ColumnDef } from 'material-react-table';
import DataTable from 'src/components/data-table/DataTable';
import FuseLoading from '@fuse/core/FuseLoading';
import {
  Chip, ListItemIcon, MenuItem, Paper, Dialog, DialogTitle,
  DialogContent, DialogContentText, DialogActions, Button
} from '@mui/material';
import _ from 'lodash';
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
  const { data: products, isLoading } = useGetECommerceProductsQuery();
  const [removeProduct] = useDeleteECommerceProductMutation();
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslation('products');

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [singleDeleteId, setSingleDeleteId] = useState<number | null>(null);

  const productList: EcommerceProduct[] = useMemo(() => {
    return products?.products?.data?.map((product) => ProductModel(product)) ?? [];
  }, [products]);

  const columns = useMemo<MRT_ColumnDef<EcommerceProduct>[]>(() => [
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
              src={imageUrl ? `${process.env.NEXT_PUBLIC_API_URL}/${imageUrl}` : '/assets/images/apps/ecommerce/product-image-placeholder.png'}
              alt={row.original.name}
            />
          </div>
        );
      }
    },
    {
      accessorKey: 'name',
      header: t('name'),
      Cell: ({ row }) => (
        <Typography component={Link} to={`/apps/e-commerce/products/${row.original.id}/${row.original.slug}`} role="button">
          <u>{row.original.name}</u>
        </Typography>
      )
    },
    {
      accessorKey: 'categories',
      header: t('category'),
      accessorFn: (row) => (
        <div className="flex flex-wrap space-x-0.5">
          {Array.isArray(row.main_category?.children) && row.main_category?.children.length > 0 ? (
            <>
              <Chip key={row.main_category.id} className="text-sm" size="small" color="default" label={row.main_category.name} />
              {row.subcategories?.map((sub: any) => (
                <Chip key={sub.id} className="text-sm" size="small" color="default" label={sub.name} />
              ))}
            </>
          ) : '-'}
        </div>
      )
    },
    {
      accessorKey: 'tags',
      header: t('tags'),
      accessorFn: (row) => (
        <div className="flex flex-wrap space-x-0.5 space-y-0.5">
          {Array.isArray(row.tags) && row.tags.length > 0
            ? row.tags.map((tag: any) => (
              <Chip
                key={tag.id ?? tag.name}
                className="text-sm"
                size="small"
                color="primary"
                label={tag.name ?? tag}
              />
            ))
            : '-'}
        </div>
      )
    },
    {
      accessorKey: 'product_attributes',
      header: t('attributes'),
      accessorFn: (row) => (
        <div className="flex flex-wrap space-x-0.5 space-y-0.5">
          {Array.isArray(row.product_attributes) && row.product_attributes.length > 0
            ? row.product_attributes.map((attr: any) => (
              <Chip
                key={`${attr.id}`} // Using unique key to avoid duplicate key warnings
                className="text-sm"
                size="small"
                color="default"
                label={`${attr.attribute_name}: ${attr.attribute_value || attr.value || '-'}`}
                sx={{
                  ...(attr.attribute_name === 'Color' && attr.attribute_value
                    ? {
                      backgroundColor: `${attr.attribute_value} !important`,
                      '& .MuiChip-label': {
                       color: `${ getContrastColor(attr.attribute_value.toLowerCase())} `, // Ensure text is readable on colored background
                      },
                    }
                    : {}),
                }}
              />
          ))
            : '-'}
        </div>
      )
    },
    {
      accessorKey: 'priceTaxIncl',
      header: t('price'),
      accessorFn: (row) => `£${parseFloat(row.price_tax_excl).toFixed(2)}`
    },
    {
      accessorKey: 'quantity',
      header: t('quantity'),
      accessorFn: (row) => (
        <div className="flex items-center space-x-2">
          <span>{row.quantity}</span>
          <i
            className={clsx(
              'inline-block w-2 h-2 rounded-sm',
              row.quantity <= 5 && 'bg-red-500',
              row.quantity > 5 && row.quantity <= 25 && 'bg-orange-500',
              row.quantity > 25 && 'bg-green-500'
            )}
          />
        </div>
      )
    },
    {
      accessorKey: 'active',
      header: t('active'),
      accessorFn: (row) => (
        <div className="flex items-center">
          {row.active ? (
            <FuseSvgIcon className="text-green-500" size={20}>heroicons-outline:check-circle</FuseSvgIcon>
          ) : (
            <FuseSvgIcon className="text-red-500" size={20}>heroicons-outline:minus-circle</FuseSvgIcon>
          )}
        </div>
      )
    }
  ], [t]);

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

  if (isLoading) return <FuseLoading />;

  return (
    <Paper className="flex flex-col flex-auto shadow-1 rounded-t-lg overflow-hidden rounded-b-none w-full h-full" elevation={0}>
      <DataTable
        data={productList}
        columns={columns}
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
      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
        <DialogTitle>{t('confirm_deletion')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {singleDeleteId !== null
              ? t('confirm_delete_product')
              : t('confirm_delete_products', { count: selectedIds.length })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)} color="primary">{t('cancel')}</Button>
          <Button onClick={handleDelete} color="error" variant="contained">{t('delete')}</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

export default ProductsTable;
//src/app/(control-panel)/apps/e-commerce/products/ProductsTableForHome.tsx 
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
      header: 'Name',
      Cell: ({ row }) => (
        <Typography component={Link} to={`/apps/e-commerce/products/${row.original.id}/${row.original.slug}`} role="button">
          <u>{row.original.name}</u>
        </Typography>
      )
    },
    {
      accessorKey: 'categories',
      header: 'Category',
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
      header: 'Tags',
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
      header: 'Attributes',
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
                        color: `${getContrastColor(attr.attribute_value.toLowerCase())} `, // Ensure text is readable on colored background
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
      header: 'Price',
      accessorFn: (row) => `$${parseFloat(row.price_tax_excl).toFixed(2)}`
    },
    {
      accessorKey: 'quantity',
      header: 'Quantity',
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
      header: 'Active',
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
  ], []);

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
    <Paper className="flex flex-col flex-auto shadow-1 rounded-t-lg overflow-hidden rounded-b-none w-full h-full" elevation={0}>
      <DataTable
        initialState={{
          density: 'spacious',
          showColumnFilters: false,
          showGlobalFilter: false,
        }}
        enableRowSelection={false}
        enableRowActions={false}
        enableColumnFilters={false}
        enableGlobalFilter={false}
        enableBottomToolbar={false}
        enablePagination={false}   // ❌ pagination disable
        data={(productList ?? []).slice(0, 10)} // ✅ only 10 rows
        columns={columns}
        muiTableHeadCellProps={{
          sx: {
            fontSize: '14px',
            fontWeight: 600,
            color: (theme) => theme.palette.text.secondary, // muted gray
          },
        }}
        muiTableBodyCellProps={{
          sx: {
            fontSize: '14px',
            fontWeight: 400,
          },
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
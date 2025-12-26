'use client';

import { useState } from 'react';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { motion } from 'motion/react';
import { useFormContext } from 'react-hook-form';
import { useParams } from 'next/navigation';
import _ from 'lodash';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import PageBreadcrumb from 'src/components/PageBreadcrumb';
import useNavigate from '@fuse/hooks/useNavigate';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import { useSession } from 'next-auth/react';
import { ConfirmDialog, SuccessDialog } from '@/components/DialogComponents';
import {
  EcommerceProduct,
  useCreateECommerceProductMutation,
  useDeleteECommerceProductMutation,
  useUpdateECommerceProductMutation,
} from '../../../apis/ProductsLaravelApi';
import '../../i18n';

/**
 * The product header.
 */
function ProductHeader() {
  const routeParams = useParams<{ productId: string }>();
  const { productId } = routeParams;

  const [createProduct, { isLoading: isCreating }] =
    useCreateECommerceProductMutation();
  const [saveProduct, { isLoading: isSaving }] =
    useUpdateECommerceProductMutation();
  const [removeProduct, { isLoading: isDeleting }] =
    useDeleteECommerceProductMutation();

  const methods = useFormContext();
  const { formState, watch, getValues } = methods;
  const { isValid, dirtyFields, errors, isDirty } = formState;
  
  // Get user role and store_id from session
  const { data: session } = useSession();
  const user = session?.user || session?.db;
  const userRoles = user?.role || session?.db?.role || [];
  
  // Get store_id from session for debugging
  const sessionStoreId = session?.db?.store_id;
  
  // Debug: Log validation state for new products
  if (productId === 'new') {
    console.log('Form validation state:', {
      isValid,
      errors: Object.keys(errors).length > 0 ? errors : 'No errors',
      dirtyFields: Object.keys(dirtyFields),
      isDirty,
      store_id: watch('store_id'),
      name: watch('name'),
      description: watch('description'),
      main_category: watch('main_category'),
      subcategory: watch('subcategory'),
      gallery_images: watch('gallery_images'),
    });
  }

  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const { t } = useTranslation('products');

  // ✅ dialog states
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [createdProductId, setCreatedProductId] = useState<string | null>(null);

  const { name, gallery_images } = watch() as EcommerceProduct;

  function transformFormValues(values: EcommerceProduct): any {
    const transformed: any = {
      ...values,
      categories: values.categories?.map((cat) => cat.id) ?? [],
      tags: values.tags ?? [],
      active: Number(values.active), // Convert true/false or 1/0 to 1/0
    };
    
    // Transform product_variants to variants if it exists (backend expects 'variants')
    if (values.product_variants && Array.isArray(values.product_variants) && values.product_variants.length > 0) {
      transformed.variants = values.product_variants;
    } else if (values.variants && Array.isArray(values.variants) && values.variants.length > 0) {
      // Use variants if it exists directly
      transformed.variants = values.variants;
    }
    
    return transformed;
  }

  /** ✅ Save handler */
  function handleSaveProduct() {
    const values = getValues() as EcommerceProduct;
    saveProduct(transformFormValues(values))
      .unwrap()
      .then((data) => {
        setSuccessMessage(t('your_product_has_been_updated'));
        setSuccessDialogOpen(true);
        setCreatedProductId(data.data.id);
        enqueueSnackbar(t('product_updated_successfully'), {
          variant: 'success',
        });
      })
      .catch((error) => {
        console.error('Error updating product:', error.data?.error);
        enqueueSnackbar(
          `${t('failed_to_update_product')} ${error.data?.error ?? ''}`,
          { variant: 'error' }
        );
      });
  }

  /** ✅ Create handler */
  function handleCreateProduct() {
    const values = getValues() as EcommerceProduct;
    
    // Debug: Log current form values
    console.log('Creating product with values:', {
      store_id: values.store_id,
      session_store_id: sessionStoreId,
      name: values.name,
      description: values.description,
      main_category: values.main_category,
      subcategory: values.subcategory,
      gallery_images: values.gallery_images?.length,
    });
    
    // Check store_id first (critical for suppliers/vendors)
    // If form doesn't have store_id but session does, set it from session and continue
    if (!values.store_id && sessionStoreId) {
      console.log('⚠️ Form missing store_id, setting from session:', sessionStoreId);
      const numericStoreId = Number(sessionStoreId);
      if (!isNaN(numericStoreId) && numericStoreId > 0) {
        methods.setValue('store_id', numericStoreId, { shouldValidate: true });
        // Update values object to use the new store_id
        values.store_id = numericStoreId;
        console.log('✅ Store ID set from session, continuing with creation');
      }
    }
    
    if (!values.store_id) {
      console.error('❌ Store ID is missing! Form values:', values, 'Session store_id:', sessionStoreId);
      const userRole = Array.isArray(userRoles) ? userRoles[0] : userRoles;
      const roleName = userRole === 'supplier' ? 'supplier' : userRole === 'vendor' ? 'vendor' : 'user';
      enqueueSnackbar(
        `Store is required. Please create a store first by going to "My Store" in the sidebar, or refresh the page to reload your store information.`,
        { variant: 'error', autoHideDuration: 10000 }
      );
      return;
    }
    
    // Validate form before submitting
    methods.trigger().then((isFormValid) => {
      if (!isFormValid) {
        const errors = methods.formState.errors;
        console.error('Form validation errors:', errors);
        
        // Check for store_id error specifically
        if (errors.store_id) {
          enqueueSnackbar(
            errors.store_id.message || 'Store is required. You must have a store before creating products.',
            { variant: 'error', autoHideDuration: 6000 }
          );
          return;
        }
        
        // Show first validation error
        const firstError = Object.values(errors)[0];
        if (firstError) {
          enqueueSnackbar(
            firstError.message || t('please_fill_all_required_fields'),
            { variant: 'error' }
          );
        } else {
          enqueueSnackbar(t('please_fill_all_required_fields'), { variant: 'error' });
        }
        return;
      }

      createProduct(transformFormValues(values))
        .unwrap()
        .then((data) => {
          setSuccessMessage(t('your_product_has_been_created'));
          setSuccessDialogOpen(true);
          setCreatedProductId(data.data.id);
          enqueueSnackbar(t('product_created_successfully'), {
            variant: 'success',
          });
        })
        .catch((error) => {
          console.error('Error creating product:', error);
          
          // Handle different error types
          let errorMessage = t('failed_to_create_product');
          
          if (error.data) {
            if (error.data.message) {
              errorMessage = error.data.message;
            } else if (error.data.error) {
              errorMessage = error.data.error;
            } else if (error.data.errors) {
              // Laravel validation errors
              const firstError = Object.values(error.data.errors)[0];
              errorMessage = Array.isArray(firstError) ? firstError[0] : String(firstError);
            }
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          enqueueSnackbar(errorMessage, { variant: 'error' });
        });
    });
  }

  /** ✅ Remove confirm handler */
  function handleRemoveConfirmed() {
    removeProduct(productId)
      .unwrap()
      .then(() => {
        enqueueSnackbar(t('product_deleted_successfully'), {
          variant: 'success',
        });
        navigate('/apps/e-commerce/products');
      })
      .catch((error) => {
        console.error('Error deleting product:', error.data?.error);
        enqueueSnackbar(
          `${t('failed_to_delete_product')} ${error.data?.error ?? ''}`,
          { variant: 'error' }
        );
      })
      .finally(() => setConfirmDialogOpen(false));
  }

  /** ✅ Success dialog close (redirect after action) */
  function handleCloseDialog() {
    setSuccessDialogOpen(false);
    if (createdProductId) {
      navigate(`/apps/e-commerce/products/${createdProductId}`);
    }
  }

  return (
    <div className="flex flex-col sm:flex-row flex-1 w-full items-center justify-between space-y-2 sm:space-y-0 py-6 sm:py-8">
      {/* Left section */}
      <div className="flex flex-col items-start space-y-2 sm:space-y-0 w-full sm:max-w-full min-w-0">
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1, transition: { delay: 0.3 } }}
        >
          <PageBreadcrumb className="mb-2" />
        </motion.div>

        <div className="flex items-center max-w-full space-x-3">
          <motion.div
            className="hidden sm:flex"
            initial={{ scale: 0 }}
            animate={{ scale: 1, transition: { delay: 0.3 } }}
          >
            {gallery_images && gallery_images.length > 0 ? (
              <img
                className="w-8 sm:w-12 rounded-sm"
                src={
                  gallery_images.find((img) => img.is_featured)?.url ??
                  '/assets/images/apps/ecommerce/product-image-placeholder.png'
                }
                alt={name}
              />
            ) : (
              <img
                className="w-8 sm:w-12 rounded-sm"
                src="/assets/images/apps/ecommerce/product-image-placeholder.png"
                alt={name}
              />
            )}
          </motion.div>
          <motion.div
            className="flex flex-col min-w-0"
            initial={{ x: -20 }}
            animate={{ x: 0, transition: { delay: 0.3 } }}
          >
            <Typography className="text-lg sm:text-2xl truncate font-semibold">
              {name || t('new_product')}
            </Typography>
            <Typography variant="caption" className="font-medium">
              {t('product_detail')}
            </Typography>
          </motion.div>
        </div>
      </div>

      {/* Right buttons */}
      <motion.div
        className="flex flex-1 w-full"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0, transition: { delay: 0.3 } }}
      >
        {productId !== 'new' ? (
          <>
            <Button
              className="whitespace-nowrap mx-1"
              variant="contained"
              color="secondary"
              onClick={() => setConfirmDialogOpen(true)} // ✅ use confirmDialogOpen
              startIcon={
                <FuseSvgIcon className="hidden sm:flex">
                  heroicons-outline:trash
                </FuseSvgIcon>
              }
            >
              {t('remove')}
            </Button>
            <Button
              className="whitespace-nowrap mx-1"
              variant="contained"
              color="secondary"
              disabled={_.isEmpty(dirtyFields) || !isValid || isSaving}
              onClick={handleSaveProduct}
            >
              {isSaving ? t('saving') : t('save')}
            </Button>
          </>
        ) : (
          <Button
            className="whitespace-nowrap mx-1"
            variant="contained"
            color="secondary"
            disabled={isCreating} // Only disable when actually creating
            onClick={handleCreateProduct}
            data-product-create-button
            title={!isValid ? 'Please fill all required fields (Name, Description, Category, Subcategory, Images)' : ''}
            sx={{
              // Force button to always be enabled and visible (except when creating)
              opacity: isCreating ? 0.6 : 1,
              pointerEvents: isCreating ? 'none' : 'auto',
              cursor: isCreating ? 'wait' : 'pointer',
              // Override Material-UI disabled styles - ensure button looks enabled when not creating
              '&.Mui-disabled': {
                opacity: isCreating ? 0.6 : 1, // Only show disabled opacity when actually creating
                cursor: isCreating ? 'wait' : 'pointer', // Always clickable when not creating
                backgroundColor: isCreating ? undefined : 'var(--mui-palette-secondary-main) !important',
                color: isCreating ? undefined : 'var(--mui-palette-secondary-contrastText) !important',
              },
              // Normal enabled state styling
              backgroundColor: 'var(--mui-palette-secondary-main)',
              color: 'var(--mui-palette-secondary-contrastText)',
              '&:hover:not(:disabled)': {
                backgroundColor: 'var(--mui-palette-secondary-dark)',
              },
              '&:active:not(:disabled)': {
                backgroundColor: 'var(--mui-palette-secondary-dark)',
              }
            }}
          >
            {isCreating ? t('adding') : t('add')}
          </Button>
        )}
      </motion.div>

      {/* ✅ Dialogs */}
      <SuccessDialog
        open={successDialogOpen}
        onClose={handleCloseDialog}
        message={successMessage}
      />

      <ConfirmDialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={handleRemoveConfirmed}
        isDeleting={isDeleting}
      />
    </div>
  );
}

export default ProductHeader;

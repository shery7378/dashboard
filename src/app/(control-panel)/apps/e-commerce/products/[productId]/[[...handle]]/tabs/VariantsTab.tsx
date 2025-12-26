'use client';

import { useEffect, useState, useRef } from 'react';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';
import { Button, Chip, InputAdornment, ListItem, Typography } from '@mui/material';
import { Controller, useFormContext } from 'react-hook-form';
import { useGetECommerceAttributesQuery } from '../../../../apis/ECommerceAttributesApi';
import { slugify } from '../../../models/ProductModel';
import ImageUpload from './ImageUpload';
import { getContrastColor } from '@/utils/colorUtils';
import isEqual from 'lodash/isEqual';

// Utility function to format variant data
const formatVariant = (variant, attributeOptions) => {
  console.log('formatVariant called with variant:', variant, 'attributeOptions:', attributeOptions);
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? '';
  const attributeMap = new Map();

  variant.attributes.forEach((attr) => {
    const match = attributeOptions.find((opt) => opt.id === attr.attribute_id);
    const key = attr.attribute_name;

    if (!attributeMap.has(key)) {
      attributeMap.set(key, {
        id: attr.attribute_id,
        name: key,
        type: match?.type || (attr.attribute_value?.match(/^\d+$/) ? 'number' : 'text'),
        options: match?.options || [],
        unit: match?.unit || '',
        value: attr.attribute_name === 'Color' ? [attr.attribute_value] : attr.attribute_value || '',
        multiple: match?.multiple || attr.attribute_name === 'Color',
      });
    } else {
      const existing = attributeMap.get(key);
      const mergedOptions = Array.from(new Set([
        ...(existing.options || []),
        ...(match?.options || []),
      ]));
      let updatedValue = existing.value;
      if (attr.attribute_name === 'Color') {
        updatedValue = Array.isArray(existing.value)
          ? [...existing.value, attr.attribute_value]
          : [existing.value, attr.attribute_value];
      }
      attributeMap.set(key, {
        ...existing,
        options: mergedOptions,
        value: updatedValue,
      });
    }
  });

  const mappedAttributes = Array.from(attributeMap.values());
  const variantImage = variant.image
    ? variant.image.startsWith('data:') || variant.image.startsWith('http')
      ? variant.image
      : `${apiBase}/${variant.image}`
    : '';

  console.log('mappedAttributes:', mappedAttributes, 'formatted variant_image:', variantImage);
  return {
    variant_id: variant.id || '',
    variant_name: variant.name || '',
    variant_slug: variant.slug || slugify(variant.name),
    variant_sku: variant.sku || '',
    variant_quantity: variant.quantity?.toString() || '',
    variant_price_tax_excl: variant.price_tax_excl || '',
    variant_extra_shipping_fee: variant.extra_shipping_fee || '',
    variant_attributes: mappedAttributes,
    extraVariantFields: mappedAttributes.reduce((acc, attr) => {
      acc[attr.name] = attr.value || (attr.type === 'number' ? 0 : attr.type === 'select' ? (attr.name === 'Color' ? [] : '') : '');
      return acc;
    }, {}),
    variant_image: variantImage,
  };
};

function VariantsTab() {
  const methods = useFormContext();
  const { control, setValue, watch, formState, register } = methods;
  const { errors } = formState;

  const mainCategory = watch('main_category');
  const mainCategoryId = mainCategory?.id;
  const productId = watch('id');
  const productVariants = watch('product_variants') || [];

  // Fetch attributes
  const { data: attributeData, isLoading: loadingAttributes } = useGetECommerceAttributesQuery(mainCategoryId, {
    skip: !mainCategoryId,
  });
  const attributeOptions = attributeData?.data || [];

  // State for managing variants array
  const [variants, setVariants] = useState(() =>
    productVariants.length > 0
      ? productVariants.map((variant) => formatVariant(variant, attributeOptions))
      : [
        {
          variant_id: '',
          variant_name: '',
          variant_slug: '',
          variant_sku: '',
          variant_quantity: '',
          variant_price_tax_excl: '',
          variant_extra_shipping_fee: '',
          variant_attributes: [],
          extraVariantFields: {},
          variant_image: '',
        },
      ]
  );

  // State for dynamic fields
  const [dynamicFieldsMap, setDynamicFieldsMap] = useState({});

  // Ref to prevent repeated syncing
  const didSyncVariants = useRef(false);
  const prevProductVariants = useRef(productVariants);

  // Reset variants and dynamicFieldsMap when mainCategoryId changes
  useEffect(() => {
    if (!mainCategoryId) return;

    console.log('Main Category ID changed, resetting variants and fields:', mainCategoryId);

    // Reset variants state
    const resetVariants = variants.map((variant) => ({
      ...variant,
      variant_attributes: [],
      extraVariantFields: {},
    }));
    setVariants(resetVariants);

    // Reset form state
    resetVariants.forEach((variant, index) => {
      console.log(`Resetting form values for variant ${index}`);
      setValue(`variants[${index}].variant_attributes`, [], { shouldValidate: false });
      setValue(`variants[${index}].extraVariantFields`, {}, { shouldValidate: false });
    });

    // Reset dynamicFieldsMap
    console.log('Resetting dynamicFieldsMap to empty');
    setDynamicFieldsMap({});
  }, [mainCategoryId, setValue]);

  // Sync variants with productVariants
  useEffect(() => {
    console.log('Sync useEffect triggered', { productVariants, attributeOptions, didSyncVariants: didSyncVariants.current });
    if (!attributeOptions.length || !Array.isArray(productVariants) || didSyncVariants.current || isEqual(productVariants, prevProductVariants.current)) {
      console.log('Sync useEffect skipped');
      return;
    }

    const formattedVariants = productVariants.length > 0
      ? productVariants.map((variant) => formatVariant(variant, attributeOptions))
      : [
        {
          variant_id: '',
          variant_name: '',
          variant_slug: '',
          variant_sku: '',
          variant_quantity: '',
          variant_price_tax_excl: '',
          variant_extra_shipping_fee: '',
          variant_attributes: [],
          extraVariantFields: {},
          variant_image: '',
        },
      ];

    console.log('Setting variants:', formattedVariants);
    setVariants(formattedVariants);

    formattedVariants.forEach((variant, index) => {
      Object.entries(variant).forEach(([key, value]) => {
        console.log(`Setting form value: variants[${index}].${key} =`, value);
        setValue(`variants[${index}].${key}`, value, { shouldValidate: false });
      });
    });

    didSyncVariants.current = true;
    prevProductVariants.current = productVariants;
  }, [productVariants, attributeOptions, setValue]);

  // Reset didSyncVariants when productId changes
  useEffect(() => {
    console.log('Product ID changed:', productId);
    didSyncVariants.current = false;
  }, [productId]);

  // Handle adding new variant
  const addVariant = () => {
    console.log('Adding new variant');
    const newVariants = [
      ...variants,
      {
        variant_name: '',
        variant_slug: '',
        variant_sku: '',
        variant_quantity: '',
        variant_price_tax_excl: '',
        variant_extra_shipping_fee: '',
        variant_attributes: [],
        extraVariantFields: {},
        variant_image: '',
      },
    ];
    setVariants(newVariants);
    const newIndex = newVariants.length - 1;
    const initialValues = {
      variant_name: '',
      variant_slug: '',
      variant_sku: '',
      variant_quantity: '',
      variant_price_tax_excl: '',
      variant_extra_shipping_fee: '',
      variant_attributes: [],
      extraVariantFields: {},
      variant_image: '',
    };
    Object.entries(initialValues).forEach(([key, value]) => {
      console.log(`Setting initial form value: variants[${newIndex}].${key} =`, value);
      setValue(`variants[${newIndex}].${key}`, value, { shouldValidate: false });
    });
  };

  // Handle removing variant
  const removeVariant = (index) => {
    console.log('Removing variant at index:', index);
    const newVariants = variants.filter((_, i) => i !== index);
    setVariants(newVariants);

    const fieldsToClear = [
      'variant_name',
      'variant_slug',
      'variant_sku',
      'variant_quantity',
      'variant_price_tax_excl',
      'variant_extra_shipping_fee',
      'variant_attributes',
      'extraVariantFields',
      'variant_image',
    ];
    fieldsToClear.forEach((field) => {
      console.log(`Clearing form value: variants[${index}].${field}`);
      setValue(`variants[${index}].${field}`, undefined, { shouldValidate: false });
    });
  };

  // Sync variant_name with variant_slug
  useEffect(() => {
    console.log('Slug sync useEffect triggered', { variants });
    const updates = {};
    let shouldUpdate = false;

    variants.forEach((variant, index) => {
      const newSlug = slugify(variant.variant_name);
      if (variant.variant_slug !== newSlug) {
        updates[`variants[${index}].variant_slug`] = newSlug;
        shouldUpdate = true;
      }
    });

    if (shouldUpdate) {
      Object.entries(updates).forEach(([key, value]) => {
        console.log(`Setting slug: ${key} =`, value);
        setValue(key, value, { shouldValidate: true });
      });
    }
  }, [variants, setValue]);

  // Update dynamicFieldsMap based on variants
  useEffect(() => {
    console.log('Dynamic fields useEffect triggered', { variants });
    const newMap = {};

    variants.forEach((variant, index) => {
      const fields = [];
      const grouped = {};

      (variant.variant_attributes || []).forEach((attr) => {
        console.log('Processing attribute for dynamic fields:', attr);
        if (!grouped[attr.name]) {
          grouped[attr.name] = { ...attr };
        } else {
          grouped[attr.name].options = Array.from(
            new Set([...grouped[attr.name].options, ...(attr.options || [])])
          );
        }
      });

      console.log('Grouped attributes:', grouped);
      Object.values(grouped).forEach((attr) => {
        fields.push({
          id: attr.id,
          name: attr.name,
          type: attr.type,
          options: attr.options || [],
          unit: attr.unit || '',
          value:
            variant.extraVariantFields[attr.name] ??
            (attr.type === 'number' ? 0 : attr.type === 'select' ? (attr.name === 'Color' ? [] : null) : ''),
        });
      });

      newMap[index] = fields;
    });

    console.log('Setting dynamicFieldsMap:', newMap);
    setDynamicFieldsMap(newMap);
  }, [variants]);

  return (
    <div>
      {variants.map((variant, index) => (
        <div key={index} className="mb-6 p-4 border rounded-lg">
          <Typography variant="h6" className="text-gray-800 font-semibold mb-4">
            Variant {index + 1}
            {index > 0 && (
              <button
                type="button"
                onClick={() => removeVariant(index)}
                className="ml-2 p-1 text-red-500 hover:text-red-700"
              >
                ✖
              </button>
            )}
          </Typography>

          <Controller
            name={`variants[${index}].variant_id`}
            control={control}
            defaultValue={variant.variant_id}
            render={({ field }) => (
              <input type="hidden" {...field} />
            )}
          />

          <Controller
            name={`variants[${index}].variant_name`}
            control={control}
            defaultValue={variant.variant_name}
            render={({ field }) => (
              <TextField
                {...field}
                className="mt-2 mb-4"
                required
                label="Variant name"
                autoFocus
                id={`variant_name_${index}`}
                variant="outlined"
                fullWidth
                error={!!errors?.variants?.[index]?.variant_name}
                helperText={errors?.variants?.[index]?.variant_name?.message}
              />
            )}
          />

          {variant.variant_slug && (
            <Typography variant="body2" className="mb-4 text-gray-600">
              Slug: <span className="font-mono text-sm">{variant.variant_slug}</span>
            </Typography>
          )}

          <Controller
            name={`variants[${index}].variant_slug`}
            control={control}
            defaultValue={variant.variant_slug}
            render={({ field }) => <input type="hidden" {...field} />}
          />

          <div className="mt-6 relative">
            <div className="absolute top-0 left-1/80 transform -translate-x-1/80 -translate-y-1/2 px-1">
              <Typography variant="h6" className="text-gray-800 font-semibold">
                Variant Image
              </Typography>
            </div>
            <div className="pt-6 p-5 bg-gray-50 rounded-lg shadow-sm">
              <ImageUpload
                name={`variants[${index}].variant_image`}
                index={index}
                initialImage={variant.variant_image}
              />
            </div>
          </div>

          <div className="mt-6 relative">
            <div className="absolute top-0 left-1/80 transform -translate-x-1/80 -translate-y-1/2 px-1">
              <Typography variant="h6" className="text-gray-800 font-semibold">
                Inventory & Price Fields
              </Typography>
            </div>
            <div className="pt-6 p-5 bg-gray-50 rounded-lg shadow-sm">
              <Controller
                name={`variants[${index}].variant_sku`}
                control={control}
                defaultValue={variant.variant_sku}
                render={({ field }) => (
                  <TextField
                    {...field}
                    className="mt-2 mb-4"
                    required
                    label="SKU"
                    id={`variant_sku_${index}`}
                    variant="outlined"
                    fullWidth
                  />
                )}
              />

              <Controller
                name={`variants[${index}].variant_quantity`}
                control={control}
                defaultValue={variant.variant_quantity}
                render={({ field }) => (
                  <TextField
                    {...field}
                    className="mt-2 mb-4"
                    label="Quantity"
                    id={`variant_quantity_${index}`}
                    variant="outlined"
                    type="number"
                    fullWidth
                  />
                )}
              />

              <Controller
                name={`variants[${index}].variant_price_tax_excl`}
                control={control}
                defaultValue={variant.variant_price_tax_excl}
                render={({ field }) => (
                  <TextField
                    {...field}
                    className="mt-2 mb-4"
                    label="Tax Excluded Price"
                    id={`variant_priceTaxExcl_${index}`}
                    slotProps={{
                      input: { startAdornment: <InputAdornment position="start">£</InputAdornment> },
                    }}
                    type="number"
                    variant="outlined"
                    fullWidth
                  />
                )}
              />

              <Controller
                name={`variants[${index}].variant_extra_shipping_fee`}
                control={control}
                defaultValue={variant.variant_extra_shipping_fee}
                render={({ field }) => (
                  <TextField
                    {...field}
                    className="mt-2 mb-4"
                    label="Extra Shipping Fee"
                    id={`variant_extra_shipping_fee_${index}`}
                    variant="outlined"
                    slotProps={{
                      input: { startAdornment: <InputAdornment position="start">£</InputAdornment> },
                    }}
                    fullWidth
                  />
                )}
              />
            </div>
          </div>

          <div className="mt-8 relative">
            <div className="absolute top-0 left-1/80 transform -translate-x-1/80 -translate-y-1/2 px-1">
              <Typography variant="h6" className="text-gray-800 font-semibold">
                Extra Attributes
              </Typography>
            </div>
            <div className="pt-6 p-5 bg-gray-50 rounded-lg shadow-sm">
              <Controller
                name={`variants[${index}].variant_attributes`}
                control={control}
                defaultValue={variant.variant_attributes}
                render={({ field: { onChange, value } }) => {
                  const handleRemoveField = (idToRemove) => {
                    console.log('Removing attribute with id:', idToRemove);

                    const attributeToRemove = value.find(attr => attr.id === idToRemove);
                    const attributeName = attributeToRemove?.name;

                    const newValue = value.filter((attr) => attr.id !== idToRemove);
                    onChange(newValue); // Updates variant_attributes

                    // Update variants state
                    setVariants((prev) => {
                      const updatedVariants = [...prev];
                      const variant = { ...updatedVariants[index] };

                      // Remove the key from extraVariantFields
                      const newExtraFields = { ...variant.extraVariantFields };
                      if (attributeName) {
                        delete newExtraFields[attributeName];
                      }

                      variant.variant_attributes = newValue;
                      variant.extraVariantFields = newExtraFields;

                      updatedVariants[index] = variant;
                      return updatedVariants;
                    });

                    // Remove the key from form state too
                    if (attributeName) {
                      setValue(`variants[${index}].extraVariantFields.${attributeName}`, undefined, {
                        shouldValidate: false,
                        shouldDirty: true,
                      });
                    }

                    // Update dynamicFieldsMap
                    const updatedFields = (dynamicFieldsMap[index] || []).filter((f) => f.id !== idToRemove);
                    setDynamicFieldsMap((prev) => ({
                      ...prev,
                      [index]: updatedFields,
                    }));
                  };


                  return (
                    <div>
                      <Autocomplete
                        multiple
                        className="mt-2 mb-4"
                        options={attributeOptions}
                        getOptionLabel={(option) => option.name || ''}
                        isOptionEqualToValue={(option, val) => option.id === val?.id}
                        loading={loadingAttributes}
                        value={value || []}
                        onChange={(event, newValue) => {
                          console.log('Autocomplete onChange:', newValue);
                          const uniqueByName = Array.from(
                            new Map(newValue.map((attr) => [attr.name, attr])).values()
                          );
                          onChange(uniqueByName);

                          // Update variants state
                          setVariants((prev) => {
                            const newVariants = [...prev];
                            newVariants[index] = {
                              ...newVariants[index],
                              variant_attributes: uniqueByName,
                              extraVariantFields: uniqueByName.reduce((acc, attr) => {
                                acc[attr.name] = attr.name === 'Color' ? [] : (attr.type === 'number' ? 0 : '');
                                return acc;
                              }, {}),
                            };
                            console.log('Updated variants after attribute change:', newVariants);
                            return newVariants;
                          });

                          // Update dynamicFieldsMap
                          setDynamicFieldsMap((prev) => ({
                            ...prev,
                            [index]: uniqueByName.map((attr) => ({
                              id: attr.id,
                              name: attr.name,
                              type: attr.type,
                              options: attr.options || [],
                              unit: attr.unit || '',
                              value: attr.name === 'Color' ? [] : (attr.type === 'number' ? 0 : ''),
                            })),
                          }));
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Select Attributes"
                            variant="outlined"
                            placeholder="Select attributes"
                            InputProps={{
                              ...params.InputProps,
                              endAdornment: (
                                <>
                                  {loadingAttributes ? <CircularProgress color="inherit" size={20} /> : null}
                                  {params.InputProps.endAdornment}
                                </>
                              ),
                            }}
                          />
                        )}
                      />

                      {(dynamicFieldsMap[index] || []).map((field) => (
                        <div key={field.id} className="mt-4 flex items-center">
                          <Controller
                            name={`variants[${index}].extraVariantFields.${field.name}`}
                            control={control}
                            defaultValue={field.value}
                            render={({ field: fieldProps }) => {
                              console.log(`Rendering field: ${field.name}`, fieldProps.value);
                              return (
                                <div className="flex-1">
                                  {field.type === 'select' && field.name === 'Color' ? (
                                    <Autocomplete
                                      {...fieldProps}
                                      multiple
                                      options={field.options}
                                      getOptionLabel={(option) => option}
                                      isOptionEqualToValue={(option, val) => option === val}
                                      value={
                                        Array.isArray(fieldProps.value)
                                          ? fieldProps.value.map((val) => (typeof val === 'string' ? val : String(val)))
                                          : []
                                      }
                                      onChange={(e, newValue) => {
                                        console.log(`Color Autocomplete onChange: ${field.name}`, newValue);
                                        fieldProps.onChange(newValue || []);
                                      }}
                                      renderOption={(props, option) => (
                                        <ListItem
                                          {...props}
                                          key={option}
                                          style={{
                                            backgroundColor: option.toLowerCase(),
                                            color: getContrastColor(option.toLowerCase()),
                                          }}
                                        >
                                          {option}
                                        </ListItem>
                                      )}
                                      renderInput={(params) => (
                                        <TextField
                                          {...params}
                                          label="Color"
                                          variant="outlined"
                                          fullWidth
                                        />
                                      )}
                                      renderTags={(value, getTagProps) =>
                                        value.map((option, index) => (
                                          <Chip
                                            {...getTagProps({ index })}
                                            key={option}
                                            label={option}
                                            sx={{
                                              backgroundColor: option.toLowerCase(),
                                              '&.MuiChip-root': {
                                                color: getContrastColor(option.toLowerCase()),
                                              },
                                              '& .MuiChip-deleteIcon': {
                                                color: getContrastColor(option.toLowerCase()),
                                                '&:hover': {
                                                  color: getContrastColor(option.toLowerCase()),
                                                },
                                              },
                                            }}
                                          />
                                        ))
                                      }
                                    />
                                  ) : field.type === 'select' ? (
                                    <Autocomplete
                                      {...fieldProps}
                                      multiple={field.multiple || false}
                                      options={field.options || []}
                                      getOptionLabel={(option) => option}
                                      isOptionEqualToValue={(option, value) => option === value}
                                      value={
                                        field.multiple
                                          ? (Array.isArray(fieldProps.value) ? fieldProps.value : [])
                                          : fieldProps.value || null
                                      }
                                      onChange={(event, newValue) => {
                                        console.log(`Select Autocomplete onChange: ${field.name}`, newValue);
                                        fieldProps.onChange(newValue);
                                      }}
                                      renderOption={(props, option) => (
                                        <li {...props} key={option}>
                                          {option}
                                        </li>
                                      )}
                                      renderInput={(params) => (
                                        <TextField
                                          {...params}
                                          label={`${field.name} ${field.unit ? `(${field.unit})` : ''}`}
                                          variant="outlined"
                                          fullWidth
                                        />
                                      )}
                                    />
                                  ) : field.type === 'number' ? (
                                    <TextField
                                      {...fieldProps}
                                      type="number"
                                      value={fieldProps.value || 0}
                                      label={`${field.name} ${field.unit ? `(${field.unit})` : ''}`}
                                      variant="outlined"
                                      fullWidth
                                      InputProps={{ sx: { backgroundColor: 'white' } }}
                                    />
                                  ) : (
                                    <TextField
                                      {...fieldProps}
                                      type="text"
                                      value={fieldProps.value || ''}
                                      label={`${field.name} ${field.unit ? `(${field.unit})` : ''}`}
                                      variant="outlined"
                                      fullWidth
                                      InputProps={{ sx: { backgroundColor: 'white' } }}
                                    />
                                  )}
                                </div>
                              );
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveField(field.id)}
                            className="ml-2 p-2 text-red-500 hover:text-red-700"
                          >
                            ✖
                          </button>
                        </div>
                      ))}
                    </div>
                  );
                }}
              />
            </div>
          </div>
        </div>
      ))}

      <Button variant="contained" color="primary" onClick={addVariant} className="mt-4">
        Add New Variant
      </Button>

      <input type="hidden" {...register('variants')} value={JSON.stringify(variants)} />
    </div>
  );
}

export default VariantsTab;
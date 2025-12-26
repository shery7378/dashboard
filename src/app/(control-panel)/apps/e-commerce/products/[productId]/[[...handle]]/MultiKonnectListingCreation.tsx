'use client';

import { useState, useEffect, useMemo } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import LinearProgress from '@mui/material/LinearProgress';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import ProductHeader from './ProductHeader';
import Autocomplete from '@mui/material/Autocomplete';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Chip from '@mui/material/Chip';
import { useGetECommerceCategoriesQuery } from '../../../apis/CategoriesLaravelApi';
import { useGetECommerceProductsQuery } from '../../../apis/ProductsLaravelApi';
import { slugify } from '../../models/ProductModel';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';
import Switch from '@mui/material/Switch';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';

interface ListingStep {
	id: number;
	title: string;
	description: string;
	completed: boolean;
}

interface Variant {
	id?: string;
	storage: string;
	color: string;
	price: string;
	compareAt: string;
	stock: string;
	sameDay: boolean;
}

function MultiKonnectListingCreation() {
	const { watch, setValue, control, formState } = useFormContext();
	const { errors } = formState;
	const { productId } = useParams<{ productId: string }>();
	const { data: session } = useSession();
	
	const [currentStep, setCurrentStep] = useState(1);
	const [mpidSearch, setMpidSearch] = useState('');
	const [mpidMatched, setMpidMatched] = useState(false);
	const [matchedProduct, setMatchedProduct] = useState<any>(null);
	const [variants, setVariants] = useState<Variant[]>([]);
	const [storageOptions, setStorageOptions] = useState<string[]>([]);
	const [colorOptions, setColorOptions] = useState<string[]>([]);
	const [offers, setOffers] = useState({
		accessoryShield: false,
		setupAtDoorstep: false,
		priceDropProtection: false,
		tradeInAssist: false,
	});
	const [isInitialized, setIsInitialized] = useState(false);
	const [barcodeDialogOpen, setBarcodeDialogOpen] = useState(false);
	const [barcodeInput, setBarcodeInput] = useState('');
	const [pastListingsDialogOpen, setPastListingsDialogOpen] = useState(false);
	const [importVendorDialogOpen, setImportVendorDialogOpen] = useState(false);
	const [masterTemplateDialogOpen, setMasterTemplateDialogOpen] = useState(false);
	const [liveSyncEnabled, setLiveSyncEnabled] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [addStorageDialogOpen, setAddStorageDialogOpen] = useState(false);
	const [addColorDialogOpen, setAddColorDialogOpen] = useState(false);
	const [newStorageInput, setNewStorageInput] = useState('');
	const [newColorInput, setNewColorInput] = useState('');
	const [applyPriceDialogOpen, setApplyPriceDialogOpen] = useState(false);
	const [applyStockDialogOpen, setApplyStockDialogOpen] = useState(false);
	const [priceToApply, setPriceToApply] = useState('');
	const [stockToApply, setStockToApply] = useState('');
	const [variantImageDialogs, setVariantImageDialogs] = useState<Record<number, boolean>>({});
	const [processingImageIndex, setProcessingImageIndex] = useState<number | null>(null);
	const [imageProcessingDialogOpen, setImageProcessingDialogOpen] = useState(false);
	const [imageProcessingMessage, setImageProcessingMessage] = useState('');
	const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
	const [colorImages, setColorImages] = useState<Record<string, string>>({}); // Map color name to image URL
	const [selectedColorForImage, setSelectedColorForImage] = useState<string | null>(null);
	const [colorImageDialogOpen, setColorImageDialogOpen] = useState(false);

	// Watch form values - all fields are now reactive
	const productTitle = watch('name') || '';
	const slug = watch('slug') || '';
	const galleryImages = watch('gallery_images') || [];
	const description = watch('description') || '';
	const seoTitle = watch('meta_title') || '';
	const metaDescription = watch('meta_description') || '';
	const priceTaxExcl = watch('price_tax_excl') || '';
	const compareAtPrice = watch('compare_at_price') || '';
	const stock = watch('in_stock') || 0;
	const condition = watch('condition') || 'New';
	const returns = watch('returns') || '7-day returns';
	const warranty = watch('warranty') || 'Manufacturer warranty';
	const conditionNotes = watch('condition_notes') || '';
	const boxContents = watch('box_contents') || '';
	const storePostcode = watch('store_postcode') || '';
	const deliveryRadius = watch('delivery_radius') || 5;
	const deliverySlots = watch('delivery_slots') || '12-3pm';
	const readyInMinutes = watch('ready_in_minutes') || 45;
	const enablePickup = watch('enable_pickup') || false;
	const kycTier = watch('kyc_tier') || 'Tier 0 - Email verified';
	const safeSellingLimit = watch('safe_selling_limit') || '£5,000 / day';
	const payoutLock = watch('payout_lock') || '48h post-delivery';
	const productVariants = watch('product_variants') || [];
	const extraFields = watch('extraFields') || {};

	// Fetch categories
	const { data: categoryData } = useGetECommerceCategoriesQuery({});
	const categoryOptions = categoryData?.data || [];

	// Calculate pricing intelligence dynamically
	const pricingIntelligence = useMemo(() => {
		// Get city from postcode (simplified - in production, use a postcode lookup API)
		const getCityFromPostcode = (postcode: string): string => {
			if (!postcode) return 'London';
			// Simple mapping - in production, use proper postcode lookup
			const postcodePrefix = postcode.split(' ')[0]?.toUpperCase() || '';
			const cityMap: Record<string, string> = {
				'E': 'London',
				'W': 'London',
				'N': 'London',
				'SW': 'London',
				'SE': 'London',
				'NW': 'London',
				'EC': 'London',
				'WC': 'London',
				'M': 'Manchester',
				'B': 'Birmingham',
				'L': 'Liverpool',
				'LS': 'Leeds',
				'S1': 'Sheffield',
				'S2': 'Sheffield',
				'S3': 'Sheffield',
				'S4': 'Sheffield',
				'S5': 'Sheffield',
				'S6': 'Sheffield',
				'S7': 'Sheffield',
				'S8': 'Sheffield',
				'S9': 'Sheffield',
				'S10': 'Sheffield',
			};
			// Handle single 'S' prefix (check if it's London or Sheffield based on second character)
			if (postcodePrefix === 'S' && postcode.length > 1) {
				const secondChar = postcode[1];
				if (secondChar && /[0-9]/.test(secondChar)) {
					return 'Sheffield';
				}
			}
			return cityMap[postcodePrefix] || 'London';
		};

		const city = getCityFromPostcode(storePostcode);
		
		// Get selected variant prices (use first variant with price, or main price)
		const selectedVariantPrice = variants.find(v => v.price && parseFloat(v.price) > 0)?.price 
			|| priceTaxExcl 
			|| '0';
		const basePrice = parseFloat(selectedVariantPrice) || 0;

		// Mock recent listings data (in production, fetch from API)
		// This simulates price data for similar products in the city
		const generateMockPrices = (base: number, count: number = 20): number[] => {
			const prices: number[] = [];
			for (let i = 0; i < count; i++) {
				// Generate prices within ±15% of base price
				const variation = (Math.random() - 0.5) * 0.3; // -15% to +15%
				const price = base * (1 + variation);
				prices.push(Math.round(price));
			}
			return prices.sort((a, b) => a - b);
		};

		const recentPrices = basePrice > 0 
			? generateMockPrices(basePrice)
			: generateMockPrices(1299); // Default fallback

		// Calculate percentiles
		const calculatePercentile = (arr: number[], percentile: number): number => {
			const index = Math.ceil((percentile / 100) * arr.length) - 1;
			return arr[Math.max(0, Math.min(index, arr.length - 1))];
		};

		const p25 = calculatePercentile(recentPrices, 25);
		const p75 = calculatePercentile(recentPrices, 75);
		const median = calculatePercentile(recentPrices, 50);

		// Calculate fees
		// Commission: typically 2.5% of sale price
		const commissionRate = 0.025;
		const commission = basePrice * commissionRate;
		
		// Delivery fee: based on delivery radius and same-day
		const hasSameDay = variants.some(v => v.sameDay) || false;
		const deliveryFee = hasSameDay ? 5 : 3; // Same-day delivery costs more
		
		// Promotional fees (if any promotions are enabled)
		const promoFee = 0; // Can be calculated based on active promotions
		
		const totalFees = commission + deliveryFee + promoFee;
		const netPrice = basePrice - totalFees;

		return {
			city,
			priceRange: { min: p25, max: p75 },
			median,
			fees: {
				commission,
				delivery: deliveryFee,
				promos: promoFee,
				total: totalFees,
			},
			net: netPrice,
			basePrice,
		};
	}, [storePostcode, variants, priceTaxExcl]);

	// Format currency
	const formatCurrency = (amount: number): string => {
		return new Intl.NumberFormat('en-GB', {
			style: 'currency',
			currency: 'GBP',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0,
		}).format(amount);
	};
	
	// Fetch user's past products
	const { data: pastProductsData, isLoading: loadingPastProducts } = useGetECommerceProductsQuery({ page: 1, perPage: 50 });
	const pastProducts = pastProductsData?.data || [];
	
	// Fetch other vendors' products
	const { data: otherVendorsData, isLoading: loadingOtherVendors } = useGetECommerceProductsQuery({ page: 1, perPage: 50 });
	const otherVendorsProducts = otherVendorsData?.data || [];

	// Calculate listing score - fully dynamic
	const listingScore = useMemo(() => {
		let score = 0;
		const maxScore = 100;
		
		// Product Identity (20 points)
		if (productTitle && productTitle.length > 10) score += 10;
		if (mpidMatched) score += 10;
		
		// Media (25 points)
		if (galleryImages.length >= 1) score += 10;
		if (galleryImages.length >= 4) score += 5;
		if (galleryImages.length >= 8) score += 10;
		
		// Variants (20 points)
		if (variants.length > 0) score += 10;
		if (variants.length > 0 && variants.every(v => v.price && parseFloat(v.price) > 0)) score += 10;
		
		// Pricing (10 points)
		if (priceTaxExcl && parseFloat(priceTaxExcl.toString()) > 0) score += 10;
		
		// Copy & SEO (15 points)
		if (description && description.length > 50) score += 5;
		if (seoTitle && seoTitle.length > 20 && seoTitle.length <= 70) score += 5;
		if (metaDescription && metaDescription.length > 50 && metaDescription.length <= 160) score += 5;
		
		// Same-day & Delivery (10 points)
		if (storePostcode && storePostcode.length > 0) score += 5;
		if (deliverySlots && deliverySlots !== '12-3pm') score += 5;
		
		// QC & Policies (10 points)
		if (condition && condition !== 'New') score += 3;
		if (conditionNotes && conditionNotes.length > 10) score += 3;
		if (boxContents && boxContents.length > 5) score += 4;
		
		return Math.min(maxScore, score);
	}, [
		productTitle, 
		mpidMatched, 
		galleryImages.length, 
		variants, 
		priceTaxExcl, 
		description, 
		seoTitle, 
		metaDescription, 
		storePostcode, 
		deliverySlots, 
		condition, 
		conditionNotes, 
		boxContents
	]);

	// Update checklist based on form state - fully dynamic
	const checklistItems = useMemo(() => {
		const items = [];
		
		// Media checklist
		if (galleryImages.length < 8) {
			items.push({
				id: 1,
				text: `Add at least 8 photos including box contents (${galleryImages.length}/8)`,
				completed: false,
			});
		} else {
			items.push({
				id: 1,
				text: 'Add at least 8 photos including box contents',
				completed: true,
			});
		}
		
		// Variant images checklist - check if per-color images are added
		const hasColorImages = colorOptions.length > 0 && colorOptions.every(color => colorImages[color]);
		if (variants.length > 0 && colorOptions.length > 0 && !hasColorImages) {
			const imagesAdded = colorOptions.filter(color => colorImages[color]).length;
			items.push({
				id: 2,
				text: `Add per-color images (${imagesAdded}/${colorOptions.length} colors)`,
				completed: false,
			});
		} else if (hasColorImages) {
			items.push({
				id: 2,
				text: 'Per-color images added',
				completed: true,
			});
		}
		
		// Same-day configuration
		if (!storePostcode || !deliverySlots) {
			items.push({
				id: 3,
				text: 'Same-day slots configured',
				completed: false,
			});
		} else {
			items.push({
				id: 3,
				text: 'Same-day slots configured',
				completed: true,
			});
		}
		
		// Variants pricing
		if (variants.length === 0) {
			items.push({
				id: 4,
				text: 'Add and price variants',
				completed: false,
			});
		} else if (!variants.every(v => v.price && parseFloat(v.price) > 0)) {
			items.push({
				id: 4,
				text: `Price all variants (${variants.filter(v => v.price && parseFloat(v.price) > 0).length}/${variants.length} priced)`,
				completed: false,
			});
		} else {
			items.push({
				id: 4,
				text: 'Variants priced',
				completed: true,
			});
		}
		
		// SEO checklist
		if (!seoTitle || seoTitle.length < 20 || seoTitle.length > 70) {
			items.push({
				id: 5,
				text: 'Add SEO title (20-70 characters)',
				completed: false,
			});
		} else {
			items.push({
				id: 5,
				text: 'Add SEO title (20-70 characters)',
				completed: true,
			});
		}
		
		// Description checklist
		if (!description || description.length < 50) {
			items.push({
				id: 6,
				text: 'Add product description (min 50 characters)',
				completed: false,
			});
		} else {
			items.push({
				id: 6,
				text: 'Add product description (min 50 characters)',
				completed: true,
			});
		}
		
		return items;
	}, [galleryImages.length, variants, storePostcode, deliverySlots, seoTitle, description, colorOptions, colorImages]);

	const steps: ListingStep[] = [
		{ id: 1, title: 'Identity', description: 'MPID, title', completed: false },
		{ id: 2, title: 'Media', description: 'upload, BG remove', completed: false },
		{ id: 3, title: 'Variants', description: 'matrix, per-variant photos', completed: false },
		{ id: 4, title: 'Pricing & intel', description: 'range, fees', completed: false },
		{ id: 5, title: 'Same-day & stores', description: 'radius, slots', completed: false },
		{ id: 6, title: 'Copy & SEO', description: 'AI title/bullets', completed: false },
		{ id: 7, title: 'QC & policies', description: 'IMEI, returns', completed: false },
		{ id: 8, title: 'Offers', description: 'Shield, concierge', completed: false },
		{ id: 9, title: 'Trust & Compliance', description: 'KYC, fraud checks', completed: false },
		{ id: 10, title: 'Preview & checks', description: 'score, validate', completed: false },
	];

	// Initialize from existing product data
	useEffect(() => {
		if (isInitialized) return;
		
		// Load existing variants and extract storage/color options
		if (productVariants && productVariants.length > 0) {
			const existingVariants: Variant[] = [];
			const storages = new Set<string>();
			const colors = new Set<string>();
			
			const loadedColorImages: Record<string, string> = {};
			
			productVariants.forEach((variant: any) => {
				// Extract attributes from variant
				const attributes = variant.attributes || [];
				let storage = '';
				let color = '';
				
				attributes.forEach((attr: any) => {
					if (attr.attribute_name === 'Storage' || attr.attribute_name === 'storage') {
						storage = attr.attribute_value || '';
						if (storage) storages.add(storage);
					}
					if (attr.attribute_name === 'Color' || attr.attribute_name === 'color') {
						color = Array.isArray(attr.attribute_value) 
							? attr.attribute_value[0] 
							: attr.attribute_value || '';
						if (color) colors.add(color);
					}
				});
				
				const variantData: any = {
					id: variant.id?.toString(),
					storage: storage || variant.name?.split(' - ')[0] || '',
					color: color || variant.name?.split(' - ')[1] || '',
					price: variant.price_tax_excl?.toString() || variant.price?.toString() || '',
					compareAt: variant.compared_price?.toString() || '',
					stock: variant.quantity?.toString() || variant.qty?.toString() || '',
					sameDay: variant.same_day || false,
				};
				
				// Add variant image if it exists
				if (variant.image) {
					variantData.image = variant.image;
					// Store as color image if not already set
					if (color && !loadedColorImages[color]) {
						loadedColorImages[color] = variant.image;
					}
				}
				
				existingVariants.push(variantData);
			});
			
			setVariants(existingVariants);
			setStorageOptions(Array.from(storages));
			setColorOptions(Array.from(colors));
			if (Object.keys(loadedColorImages).length > 0) {
				setColorImages(loadedColorImages);
			}
		}
		
		// Load offers from extraFields
		if (extraFields) {
			setOffers({
				accessoryShield: extraFields.accessoryShield || false,
				setupAtDoorstep: extraFields.setupAtDoorstep || false,
				priceDropProtection: extraFields.priceDropProtection || false,
				tradeInAssist: extraFields.tradeInAssist || false,
			});
		}
		
		// Check for MPID match in extraFields
		if (extraFields.mpidMatched) {
			setMpidMatched(true);
			setMatchedProduct(extraFields.matchedProduct || null);
		}
		
		setIsInitialized(true);
	}, [productVariants, extraFields, isInitialized]);

	// Auto-generate slug from title
	useEffect(() => {
		if (productTitle && !slug) {
			const autoSlug = slugify(productTitle);
			setValue('slug', autoSlug, { shouldDirty: false });
		}
	}, [productTitle, slug, setValue]);

	// MPID search handler - save to extraFields
	const handleMpidSearch = (value: string) => {
		setMpidSearch(value);
		if (value.toLowerCase().includes('iphone') || value.toLowerCase().includes('16') || value.toLowerCase().includes('apple')) {
			const matched = {
				brand: 'Apple',
				model: 'iPhone 16 Pro Max',
				display: '6.9"',
				chip: 'A18 Pro',
				year: '2025',
			};
			setMpidMatched(true);
			setMatchedProduct(matched);
			// Save to extraFields
			setValue('extraFields', {
				...extraFields,
				mpidMatched: true,
				matchedProduct: matched,
			}, { shouldDirty: true });
		} else if (value.length > 0) {
			setMpidMatched(false);
			setMatchedProduct(null);
			setValue('extraFields', {
				...extraFields,
				mpidMatched: false,
				matchedProduct: null,
			}, { shouldDirty: true });
		}
	};

	// Image upload handler
	const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const files = event.target.files;
		if (files) {
			const imagePromises = Array.from(files).map((file) => {
				return new Promise((resolve) => {
					const reader = new FileReader();
					reader.onload = () => {
						const base64Image = {
							url: `data:${file.type};base64,${btoa(reader.result as string)}`,
							is_featured: galleryImages.length === 0,
						};
						resolve(base64Image);
					};
					reader.readAsBinaryString(file);
				});
			});

			const newImages = await Promise.all(imagePromises);
			const updatedImages = [...galleryImages, ...newImages];
			setValue('gallery_images', updatedImages, { shouldDirty: true, shouldValidate: true });
		}
	};

	const handleImageRemove = (index: number) => {
		const updatedImages = galleryImages.filter((_, i) => i !== index);
		setValue('gallery_images', updatedImages, { shouldDirty: true, shouldValidate: true });
	};

	const handleImageClick = (index: number) => {
		const updatedImages = galleryImages.map((img, i) => ({
			...img,
			is_featured: i === index ? !img.is_featured : false,
		}));
		setValue('gallery_images', updatedImages, { shouldDirty: true });
	};

	// Image processing utilities
	const processImage = async (imageUrl: string, processFn: (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, img: HTMLImageElement) => Promise<void>): Promise<string> => {
		return new Promise((resolve, reject) => {
			const img = new Image();
			img.crossOrigin = 'anonymous';
			img.onload = async () => {
				try {
					const canvas = document.createElement('canvas');
					canvas.width = img.width;
					canvas.height = img.height;
					const ctx = canvas.getContext('2d');
					if (!ctx) {
						reject(new Error('Could not get canvas context'));
						return;
					}
					ctx.drawImage(img, 0, 0);
					await processFn(canvas, ctx, img);
					resolve(canvas.toDataURL('image/png'));
				} catch (error) {
					reject(error);
				}
			};
			img.onerror = reject;
			img.src = imageUrl;
		});
	};

	// Remove background handler
	const handleRemoveBackground = async (imageIndex: number = 0) => {
		if (galleryImages.length === 0) {
			alert('Please upload an image first');
			return;
		}
		
		setProcessingImageIndex(imageIndex);
		setImageProcessingMessage('Removing background...');
		setImageProcessingDialogOpen(true);

		try {
			const imageUrl = galleryImages[imageIndex].url;
			const processedUrl = await processImage(imageUrl, async (canvas, ctx, img) => {
				// Simple background removal using edge detection
				// In production, use a proper background removal API like remove.bg
				const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
				const data = imageData.data;
				
				// Simple algorithm: remove white/light backgrounds
				for (let i = 0; i < data.length; i += 4) {
					const r = data[i];
					const g = data[i + 1];
					const b = data[i + 2];
					const brightness = (r + g + b) / 3;
					
					// If pixel is very light (background), make it transparent
					if (brightness > 240) {
						data[i + 3] = 0; // Set alpha to 0 (transparent)
					}
				}
				
				ctx.putImageData(imageData, 0, 0);
			});

			const updatedImages = [...galleryImages];
			updatedImages[imageIndex] = { ...updatedImages[imageIndex], url: processedUrl };
			setValue('gallery_images', updatedImages, { shouldDirty: true });
			setImageProcessingMessage('Background removed successfully!');
			setTimeout(() => {
				setImageProcessingDialogOpen(false);
				setProcessingImageIndex(null);
			}, 1000);
		} catch (error) {
			console.error('Error removing background:', error);
			alert('Failed to remove background. Please try again.');
			setImageProcessingDialogOpen(false);
			setProcessingImageIndex(null);
		}
	};

	// Auto-crop & center handler
	const handleAutoCropAndCenter = async (imageIndex: number = 0) => {
		if (galleryImages.length === 0) {
			alert('Please upload an image first');
			return;
		}

		setProcessingImageIndex(imageIndex);
		setImageProcessingMessage('Auto-cropping and centering...');
		setImageProcessingDialogOpen(true);

		try {
			const imageUrl = galleryImages[imageIndex].url;
			const processedUrl = await processImage(imageUrl, async (canvas, ctx, img) => {
				const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
				const data = imageData.data;
				
				// Find bounding box of non-transparent/non-white content
				let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;
				
				for (let y = 0; y < canvas.height; y++) {
					for (let x = 0; x < canvas.width; x++) {
						const idx = (y * canvas.width + x) * 4;
						const r = data[idx];
						const g = data[idx + 1];
						const b = data[idx + 2];
						const a = data[idx + 3];
						const brightness = (r + g + b) / 3;
						
						// Consider non-transparent and non-white pixels as content
						if (a > 10 && brightness < 240) {
							minX = Math.min(minX, x);
							minY = Math.min(minY, y);
							maxX = Math.max(maxX, x);
							maxY = Math.max(maxY, y);
						}
					}
				}
				
				// Add padding
				const padding = 20;
				minX = Math.max(0, minX - padding);
				minY = Math.max(0, minY - padding);
				maxX = Math.min(canvas.width, maxX + padding);
				maxY = Math.min(canvas.height, maxY + padding);
				
				// Crop and center
				const width = maxX - minX;
				const height = maxY - minY;
				const size = Math.max(width, height);
				
				const newCanvas = document.createElement('canvas');
				newCanvas.width = size;
				newCanvas.height = size;
				const newCtx = newCanvas.getContext('2d');
				if (!newCtx) return;
				
				// Fill with white background
				newCtx.fillStyle = '#ffffff';
				newCtx.fillRect(0, 0, size, size);
				
				// Center the cropped image
				const offsetX = (size - width) / 2;
				const offsetY = (size - height) / 2;
				newCtx.drawImage(img, minX, minY, width, height, offsetX, offsetY, width, height);
				
				// Replace canvas content
				canvas.width = size;
				canvas.height = size;
				ctx.drawImage(newCanvas, 0, 0);
			});

			const updatedImages = [...galleryImages];
			updatedImages[imageIndex] = { ...updatedImages[imageIndex], url: processedUrl };
			setValue('gallery_images', updatedImages, { shouldDirty: true });
			setImageProcessingMessage('Image cropped and centered!');
			setTimeout(() => {
				setImageProcessingDialogOpen(false);
				setProcessingImageIndex(null);
			}, 1000);
		} catch (error) {
			console.error('Error cropping image:', error);
			alert('Failed to crop image. Please try again.');
			setImageProcessingDialogOpen(false);
			setProcessingImageIndex(null);
		}
	};

	// Create 360° spin handler
	const handleCreate360Spin = async (imageIndex: number = 0) => {
		if (galleryImages.length === 0) {
			alert('Please upload an image first');
			return;
		}

		setProcessingImageIndex(imageIndex);
		setImageProcessingMessage('Creating 360° spin sequence...');
		setImageProcessingDialogOpen(true);

		try {
			const imageUrl = galleryImages[imageIndex].url;
			const spinImages: any[] = [];
			const frames = 36; // 36 frames for smooth 360° rotation

			// Create rotated versions of the image
			for (let i = 0; i < frames; i++) {
				const angle = (i * 360) / frames;
				const processedUrl = await processImage(imageUrl, async (canvas, ctx, img) => {
					// Clear canvas
					ctx.clearRect(0, 0, canvas.width, canvas.height);
					// Rotate image
					ctx.save();
					ctx.translate(canvas.width / 2, canvas.height / 2);
					ctx.rotate((angle * Math.PI) / 180);
					ctx.translate(-canvas.width / 2, -canvas.height / 2);
					ctx.drawImage(img, 0, 0);
					ctx.restore();
				});
				
				spinImages.push({
					url: processedUrl,
					is_featured: i === 0,
					is_360_frame: true,
					frame_index: i,
				});
			}

			// Add spin images to gallery
			const updatedImages = [...galleryImages.slice(0, imageIndex), ...spinImages, ...galleryImages.slice(imageIndex + 1)];
			setValue('gallery_images', updatedImages, { shouldDirty: true });
			setImageProcessingMessage('360° spin created successfully!');
			setTimeout(() => {
				setImageProcessingDialogOpen(false);
				setProcessingImageIndex(null);
			}, 1000);
		} catch (error) {
			console.error('Error creating 360° spin:', error);
			alert('Failed to create 360° spin. Please try again.');
			setImageProcessingDialogOpen(false);
			setProcessingImageIndex(null);
		}
	};

	// Watermark handler
	const handleWatermark = async (imageIndex: number = 0) => {
		if (galleryImages.length === 0) {
			alert('Please upload an image first');
			return;
		}

		setProcessingImageIndex(imageIndex);
		setImageProcessingMessage('Adding watermark...');
		setImageProcessingDialogOpen(true);

		try {
			const imageUrl = galleryImages[imageIndex].url;
			const processedUrl = await processImage(imageUrl, async (canvas, ctx, img) => {
				// Add watermark text
				ctx.save();
				ctx.font = 'bold 24px Arial';
				ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
				ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
				ctx.lineWidth = 2;
				ctx.textAlign = 'center';
				ctx.textBaseline = 'middle';
				
				const watermarkText = 'MultiKonnect';
				const x = canvas.width / 2;
				const y = canvas.height - 40;
				
				ctx.strokeText(watermarkText, x, y);
				ctx.fillText(watermarkText, x, y);
				ctx.restore();
			});

			const updatedImages = [...galleryImages];
			updatedImages[imageIndex] = { ...updatedImages[imageIndex], url: processedUrl };
			setValue('gallery_images', updatedImages, { shouldDirty: true });
			setImageProcessingMessage('Watermark added successfully!');
			setTimeout(() => {
				setImageProcessingDialogOpen(false);
				setProcessingImageIndex(null);
			}, 1000);
		} catch (error) {
			console.error('Error adding watermark:', error);
			alert('Failed to add watermark. Please try again.');
			setImageProcessingDialogOpen(false);
			setProcessingImageIndex(null);
		}
	};

	// AI Auto-enhance handler
	const handleAIAutoEnhance = async (imageIndex: number = 0) => {
		if (galleryImages.length === 0) {
			alert('Please upload an image first');
			return;
		}

		setProcessingImageIndex(imageIndex);
		setImageProcessingMessage('AI enhancing image...');
		setImageProcessingDialogOpen(true);

		try {
			const imageUrl = galleryImages[imageIndex].url;
			const processedUrl = await processImage(imageUrl, async (canvas, ctx, img) => {
				const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
				const data = imageData.data;
				
				// Enhance: adjust brightness, contrast, and saturation
				for (let i = 0; i < data.length; i += 4) {
					// Brightness adjustment (+10%)
					data[i] = Math.min(255, data[i] * 1.1);     // R
					data[i + 1] = Math.min(255, data[i + 1] * 1.1); // G
					data[i + 2] = Math.min(255, data[i + 2] * 1.1); // B
					
					// Contrast adjustment
					const factor = 1.2;
					data[i] = Math.min(255, Math.max(0, (data[i] - 128) * factor + 128));
					data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * factor + 128));
					data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * factor + 128));
					
					// Saturation boost
					const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
					const satFactor = 1.15;
					data[i] = Math.min(255, gray + (data[i] - gray) * satFactor);
					data[i + 1] = Math.min(255, gray + (data[i + 1] - gray) * satFactor);
					data[i + 2] = Math.min(255, gray + (data[i + 2] - gray) * satFactor);
				}
				
				ctx.putImageData(imageData, 0, 0);
			});

			const updatedImages = [...galleryImages];
			updatedImages[imageIndex] = { ...updatedImages[imageIndex], url: processedUrl };
			setValue('gallery_images', updatedImages, { shouldDirty: true });
			setImageProcessingMessage('Image enhanced successfully!');
			setTimeout(() => {
				setImageProcessingDialogOpen(false);
				setProcessingImageIndex(null);
			}, 1000);
		} catch (error) {
			console.error('Error enhancing image:', error);
			alert('Failed to enhance image. Please try again.');
			setImageProcessingDialogOpen(false);
			setProcessingImageIndex(null);
		}
	};

	// Variants handlers
	const handleAddStorage = () => {
		setAddStorageDialogOpen(true);
	};

	const handleConfirmAddStorage = () => {
		if (newStorageInput && newStorageInput.trim() && !storageOptions.includes(newStorageInput.trim())) {
			const updated = [...storageOptions, newStorageInput.trim()];
			setStorageOptions(updated);
			setNewStorageInput('');
			setAddStorageDialogOpen(false);
			// Regenerate variants if colors exist
			if (colorOptions.length > 0) {
				generateVariantsFromOptions(updated, colorOptions);
			}
		}
	};

	const handleRemoveStorage = (storageToRemove: string) => {
		const updated = storageOptions.filter(s => s !== storageToRemove);
		setStorageOptions(updated);
		// Remove variants with this storage
		const updatedVariants = variants.filter(v => v.storage !== storageToRemove);
		setVariants(updatedVariants);
	};

	const handleAddColor = () => {
		setAddColorDialogOpen(true);
	};

	const handleConfirmAddColor = () => {
		if (newColorInput && newColorInput.trim() && !colorOptions.includes(newColorInput.trim())) {
			const updated = [...colorOptions, newColorInput.trim()];
			setColorOptions(updated);
			setNewColorInput('');
			setAddColorDialogOpen(false);
			// Regenerate variants if storage exists
			if (storageOptions.length > 0) {
				generateVariantsFromOptions(storageOptions, updated);
			}
		}
	};

	const handleRemoveColor = (colorToRemove: string) => {
		const updated = colorOptions.filter(c => c !== colorToRemove);
		setColorOptions(updated);
		// Remove variants with this color
		const updatedVariants = variants.filter(v => v.color !== colorToRemove);
		setVariants(updatedVariants);
	};
	
	const generateVariantsFromOptions = (storages: string[], colors: string[]) => {
		const newVariants: Variant[] = [];
		storages.forEach(storage => {
			colors.forEach(color => {
				// Check if variant already exists
				const exists = variants.some(v => v.storage === storage && v.color === color);
				if (!exists) {
					newVariants.push({
						storage,
						color,
						price: '',
						compareAt: '',
						stock: '',
						sameDay: false,
					});
				}
			});
		});
		if (newVariants.length > 0) {
			setVariants([...variants, ...newVariants]);
		}
	};

	const generateVariants = () => {
		if (storageOptions.length === 0 || colorOptions.length === 0) {
			alert('Please add at least one storage and one color option');
			return;
		}
		const newVariants: Variant[] = [];
		storageOptions.forEach(storage => {
			colorOptions.forEach(color => {
				// Preserve existing variant data if it exists
				const existing = variants.find(v => v.storage === storage && v.color === color);
				if (existing) {
					newVariants.push(existing);
				} else {
					const newVariant: any = {
						storage,
						color,
						price: '',
						compareAt: '',
						stock: '',
						sameDay: false,
					};
					// If there's a per-color image, assign it to this variant
					if (colorImages[color]) {
						newVariant.image = colorImages[color];
					}
					newVariants.push(newVariant);
				}
			});
		});
		setVariants(newVariants);
	};

	// Save variants to form when they change - convert to product_variants format
	useEffect(() => {
		if (variants.length > 0 && isInitialized) {
			// Convert variants to product_variants format for API
			const productVariantsData = variants.map((variant, index) => {
				const variantName = `${variant.storage} - ${variant.color}`;
				const variantPrice = parseFloat(variant.price) || 0;
				const variantStock = parseInt(variant.stock) || 0;
				const variantData: any = {
					id: variant.id || undefined,
					name: variantName,
					sku: `${slug}-${variant.storage.toLowerCase()}-${variant.color.toLowerCase()}`.replace(/\s+/g, '-'),
					price: variantPrice, // Backend expects 'price' field
					price_tax_excl: variantPrice, // Also include for compatibility
					compared_price: parseFloat(variant.compareAt) || 0,
					quantity: variantStock,
					qty: variantStock,
					manage_stock: true, // Required field - always true for variants
					in_stock: variantStock > 0,
					is_active: true,
					position: index + 1,
					attributes: [
						{ attribute_name: 'Storage', attribute_value: variant.storage },
						{ attribute_name: 'Color', attribute_value: variant.color },
					],
					same_day: variant.sameDay || false,
				};
				
				// Include variant image if it exists, or use per-color image
				if ((variant as any).image) {
					variantData.image = (variant as any).image;
				} else if (colorImages[variant.color]) {
					variantData.image = colorImages[variant.color];
				}
				
				return variantData;
			});
			
			setValue('product_variants', productVariantsData, { shouldDirty: true });
		}
	}, [variants, isInitialized, slug, setValue, colorImages]);

	const handleVariantChange = (index: number, field: keyof Variant, value: any) => {
		const updated = [...variants];
		updated[index] = { ...updated[index], [field]: value };
		setVariants(updated);
		// The useEffect above will handle saving to form
	};

	const handleApplyPriceToAll = () => {
		setApplyPriceDialogOpen(true);
	};

	const handleConfirmApplyPrice = () => {
		if (priceToApply && !isNaN(parseFloat(priceToApply))) {
			const updated = variants.map(v => ({ ...v, price: priceToApply }));
			setVariants(updated);
			setPriceToApply('');
			setApplyPriceDialogOpen(false);
			// Update main price if variants exist
			if (updated.length > 0) {
				setValue('price_tax_excl', parseFloat(priceToApply), { shouldDirty: true });
			}
		}
	};

	const handleApplyStockToAll = () => {
		setApplyStockDialogOpen(true);
	};

	const handleConfirmApplyStock = () => {
		if (stockToApply && !isNaN(parseInt(stockToApply))) {
			const updated = variants.map(v => ({ ...v, stock: stockToApply }));
			setVariants(updated);
			setStockToApply('');
			setApplyStockDialogOpen(false);
			// Update main stock
			setValue('in_stock', parseInt(stockToApply), { shouldDirty: true });
		}
	};

	const handleRemoveVariant = (index: number) => {
		const updated = variants.filter((_, i) => i !== index);
		setVariants(updated);
	};

	const handleVariantImageUpload = (variantIndex: number, files: FileList | null) => {
		if (!files || files.length === 0) return;
		
		const file = files[0];
		const reader = new FileReader();
		
		reader.onloadend = () => {
			const imageUrl = reader.result as string;
			const updated = [...variants];
			// Store image URL in variant (we'll need to extend Variant interface)
			(updated[variantIndex] as any).image = imageUrl;
			setVariants(updated);
		};
		
		reader.readAsDataURL(file);
	};

	// Per-color image handlers
	const handleAddColorImage = (color: string) => {
		setSelectedColorForImage(color);
		setColorImageDialogOpen(true);
	};

	const handleColorImageUpload = (files: FileList | null) => {
		if (!files || files.length === 0 || !selectedColorForImage) return;
		
		const file = files[0];
		const reader = new FileReader();
		
		reader.onloadend = () => {
			const imageUrl = reader.result as string;
			setColorImages({
				...colorImages,
				[selectedColorForImage]: imageUrl,
			});
			// Also update all variants with this color to use this image
			const updated = variants.map(v => {
				if (v.color === selectedColorForImage) {
					return { ...v, image: imageUrl };
				}
				return v;
			});
			setVariants(updated);
			setColorImageDialogOpen(false);
			setSelectedColorForImage(null);
		};
		
		reader.readAsDataURL(file);
	};

	const handleRemoveColorImage = (color: string) => {
		const updated = { ...colorImages };
		delete updated[color];
		setColorImages(updated);
		// Remove images from variants with this color (but keep variant-specific images)
		const updatedVariants = variants.map(v => {
			if (v.color === color && (v as any).image === colorImages[color]) {
				const variantCopy = { ...v };
				delete (variantCopy as any).image;
				return variantCopy;
			}
			return v;
		});
		setVariants(updatedVariants);
	};

	// AI helpers
	const handleSuggestTitle = () => {
		if (productTitle) {
			const suggested = `${productTitle} — QC-Verified, Same-Day Delivery`;
			setValue('meta_title', suggested);
		}
	};

	const handleGenerateBullets = () => {
		const bullets = [
			'Fast same-day delivery available',
			'1-year AccessoryShield included',
			'QC-verified device with invoice',
			'Professional setup assistance',
			'7-day price-drop protection',
			'Trade-in value check available',
		];
		setValue('description', bullets.join('\n• '));
	};

	const handleWriteDescription = () => {
		const desc = `This ${productTitle || 'product'} comes with full manufacturer warranty and original packaging. Includes all accessories, documentation, and SIM tool. Device has been QC-verified and tested. Fast same-day delivery available in select areas.`;
		setValue('description', desc, { shouldDirty: true });
	};
	
	// Save offers to extraFields
	useEffect(() => {
		if (isInitialized) {
			setValue('extraFields', {
				...extraFields,
				accessoryShield: offers.accessoryShield,
				setupAtDoorstep: offers.setupAtDoorstep,
				priceDropProtection: offers.priceDropProtection,
				tradeInAssist: offers.tradeInAssist,
			}, { shouldDirty: true });
		}
	}, [offers, isInitialized, extraFields, setValue]);

	const handleStepClick = (stepId: number) => {
		setCurrentStep(stepId);
		const sectionMap: { [key: number]: string } = {
			1: 'identity',
			2: 'media',
			3: 'variants',
			4: 'pricing',
			5: 'delivery',
			6: 'copy',
			7: 'policies',
			8: 'offers',
			9: 'trust',
			10: 'preview',
		};
		const sectionId = sectionMap[stepId];
		if (sectionId) {
			setTimeout(() => {
				const element = document.getElementById(sectionId);
				if (element) {
					element.scrollIntoView({ behavior: 'smooth', block: 'start' });
				}
			}, 100);
		}
	};

	const handlePublishClick = () => {
		const addButton = document.querySelector('[data-product-create-button]') as HTMLButtonElement;
		if (addButton) {
			addButton.click();
		}
	};

	// Calculate missing required fields
	const missingFields = useMemo(() => {
		const missing: Array<{ field: string; section: string; step: number }> = [];
		
		// Product Identity (Step 1)
		if (!productTitle || productTitle.length < 5) {
			missing.push({ field: 'Product Name (min 5 characters)', section: 'Product Identity', step: 1 });
		}
		if (!watch('main_category')) {
			missing.push({ field: 'Main Category', section: 'Product Identity', step: 1 });
		}
		if (!watch('subcategory') || watch('subcategory')?.length === 0) {
			missing.push({ field: 'At least one Subcategory', section: 'Product Identity', step: 1 });
		}
		
		// Media (Step 2)
		if (!galleryImages || galleryImages.length === 0) {
			missing.push({ field: 'At least one Product Image', section: 'Media', step: 2 });
		}
		
		// Description (Step 6 - Copy & SEO)
		if (!description || description.length < 10) {
			missing.push({ field: 'Description (min 10 characters)', section: 'Copy & SEO', step: 6 });
		}
		
		// Variants (Step 3)
		if (variants.length > 0) {
			variants.forEach((variant, idx) => {
				if (!variant.price || parseFloat(variant.price) <= 0) {
					missing.push({ 
						field: `Variant ${idx + 1} (${variant.storage} ${variant.color}): Price`, 
						section: 'Variants', 
						step: 3 
					});
				}
				if (variant.stock === '' || variant.stock === undefined || parseInt(variant.stock) < 0) {
					missing.push({ 
						field: `Variant ${idx + 1} (${variant.storage} ${variant.color}): Stock`, 
						section: 'Variants', 
						step: 3 
					});
				}
			});
		}
		
		return missing;
	}, [productTitle, description, galleryImages, variants, watch]);

	const handleRunValidation = () => {
		// Trigger form validation
		const form = document.querySelector('form');
		if (form) {
			const event = new Event('submit', { bubbles: true, cancelable: true });
			form.dispatchEvent(event);
		}
	};

	// Barcode scanning handler
	const handleScanBarcode = () => {
		setBarcodeDialogOpen(true);
	};

	const handleBarcodeSubmit = () => {
		if (barcodeInput.trim()) {
			// Search for product by barcode/GTIN
			handleMpidSearch(barcodeInput.trim());
			setBarcodeDialogOpen(false);
			setBarcodeInput('');
		}
	};

	// Master Template handler
	const handleUseMasterTemplate = () => {
		setMasterTemplateDialogOpen(true);
	};

	const handleSelectMasterTemplate = (template: any) => {
		// Load template data into form
		if (template.name) setValue('name', template.name, { shouldDirty: true });
		if (template.description) setValue('description', template.description, { shouldDirty: true });
		if (template.meta_title) setValue('meta_title', template.meta_title, { shouldDirty: true });
		if (template.meta_description) setValue('meta_description', template.meta_description, { shouldDirty: true });
		if (template.price_tax_excl) setValue('price_tax_excl', template.price_tax_excl, { shouldDirty: true });
		if (template.product_variants) {
			// Load variants
			const templateVariants = template.product_variants.map((v: any) => ({
				id: v.id?.toString(),
				storage: v.attributes?.find((a: any) => a.attribute_name === 'Storage')?.attribute_value || '',
				color: v.attributes?.find((a: any) => a.attribute_name === 'Color')?.attribute_value || '',
				price: v.price_tax_excl?.toString() || '',
				compareAt: v.compared_price?.toString() || '',
				stock: v.quantity?.toString() || '',
				sameDay: v.same_day || false,
			}));
			setVariants(templateVariants);
		}
		setMasterTemplateDialogOpen(false);
	};

	// Past Listing handler
	const handleUsePastListing = () => {
		setPastListingsDialogOpen(true);
	};

	const handleSelectPastListing = (product: any) => {
		// Load product data into form
		if (product.name) setValue('name', product.name, { shouldDirty: true });
		if (product.description) setValue('description', product.description, { shouldDirty: true });
		if (product.meta_title) setValue('meta_title', product.meta_title, { shouldDirty: true });
		if (product.meta_description) setValue('meta_description', product.meta_description, { shouldDirty: true });
		if (product.price_tax_excl) setValue('price_tax_excl', product.price_tax_excl, { shouldDirty: true });
		if (product.gallery_images) setValue('gallery_images', product.gallery_images, { shouldDirty: true });
		if (product.product_variants) {
			const pastVariants = product.product_variants.map((v: any) => ({
				id: v.id?.toString(),
				storage: v.attributes?.find((a: any) => a.attribute_name === 'Storage')?.attribute_value || '',
				color: v.attributes?.find((a: any) => a.attribute_name === 'Color')?.attribute_value || '',
				price: v.price_tax_excl?.toString() || '',
				compareAt: v.compared_price?.toString() || '',
				stock: v.quantity?.toString() || '',
				sameDay: v.same_day || false,
			}));
			setVariants(pastVariants);
		}
		setPastListingsDialogOpen(false);
	};

	// Import from Other Vendor handler
	const handleImportFromVendor = () => {
		setImportVendorDialogOpen(true);
	};

	const handleSelectVendorProduct = (product: any) => {
		// Import product data
		if (product.name) setValue('name', product.name, { shouldDirty: true });
		if (product.description) setValue('description', product.description, { shouldDirty: true });
		if (product.meta_title) setValue('meta_title', product.meta_title, { shouldDirty: true });
		if (product.meta_description) setValue('meta_description', product.meta_description, { shouldDirty: true });
		if (product.price_tax_excl) setValue('price_tax_excl', product.price_tax_excl, { shouldDirty: true });
		if (product.product_variants) {
			const vendorVariants = product.product_variants.map((v: any) => ({
				id: v.id?.toString(),
				storage: v.attributes?.find((a: any) => a.attribute_name === 'Storage')?.attribute_value || '',
				color: v.attributes?.find((a: any) => a.attribute_name === 'Color')?.attribute_value || '',
				price: v.price_tax_excl?.toString() || '',
				compareAt: v.compared_price?.toString() || '',
				stock: v.quantity?.toString() || '',
				sameDay: v.same_day || false,
			}));
			setVariants(vendorVariants);
		}
		setImportVendorDialogOpen(false);
	};

	// Live Sync toggle handler
	const handleLiveSyncToggle = (enabled: boolean) => {
		setLiveSyncEnabled(enabled);
		setValue('extraFields', {
			...extraFields,
			liveSyncEnabled: enabled,
		}, { shouldDirty: true });
	};

	return (
		<div className="flex flex-col h-screen bg-[#f6f7fb] overflow-hidden relative" style={{ fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif' }}>
			{/* Hidden ProductHeader for form submission */}
			<div className="absolute opacity-0 pointer-events-none -z-10">
				<ProductHeader />
			</div>
			
			{/* Top Navigation Bar */}
			<header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0 sticky top-0 z-50">
				<div className="flex items-center space-x-3">
					<Typography variant="h6" className="font-bold text-gray-900" sx={{ fontSize: '15px', fontWeight: 700 }}>
						MultiKonnect
					</Typography>
					<Chip 
						label="Create Listing"
						size="small"
						sx={{
							fontSize: '12px',
							border: '1px solid #e5e7eb',
							padding: '2px 8px',
							borderRadius: '999px',
							color: '#6b7280',
							backgroundColor: '#f9fafb',
							height: '20px',
						}}
					/>
				</div>
				<div className="flex items-center space-x-2">
					<Button 
						variant="outlined" 
						size="small"
						sx={{
							borderColor: '#e5e7eb',
							color: '#374151',
							textTransform: 'none',
							fontSize: '13px',
							padding: '10px 14px',
							borderRadius: '12px',
							minHeight: '44px',
							fontWeight: 500,
							'&:hover': {
								borderColor: '#d1d5db',
								backgroundColor: '#f9fafb',
							},
						}}
						onClick={() => handlePublishClick()}
					>
						Save draft
					</Button>
					<Button 
						variant="outlined" 
						size="small"
						sx={{
							borderColor: '#e5e7eb',
							color: '#374151',
							textTransform: 'none',
							fontSize: '13px',
							padding: '10px 14px',
							borderRadius: '12px',
							minHeight: '44px',
							fontWeight: 500,
							'&:hover': {
								borderColor: '#d1d5db',
								backgroundColor: '#f9fafb',
							},
						}}
					>
						Preview
					</Button>
					<Button 
						variant="contained" 
						size="small"
						sx={{ 
							backgroundColor: '#ff6536',
							color: '#fff',
							textTransform: 'none',
							fontSize: '13px',
							padding: '10px 14px',
							fontWeight: 600,
							borderRadius: '12px',
							minHeight: '44px',
							boxShadow: '0 2px 8px rgba(255, 101, 54, 0.2)',
							'&:hover': { 
								backgroundColor: '#e55a2b',
								boxShadow: '0 4px 12px rgba(255, 101, 54, 0.3)',
							},
						}}
						onClick={handlePublishClick}
					>
						Publish
					</Button>
				</div>
			</header>

			<div className="flex flex-1 overflow-hidden min-h-0">
				{/* Left Sidebar - Listing Steps */}
				<aside className="w-[260px] bg-white border-r border-gray-200 overflow-y-auto flex-shrink-0 sticky top-[52px]" style={{ alignSelf: 'start' }}>
					<div className="p-4">
						<Typography variant="h6" className="font-semibold mb-3 text-gray-900" sx={{ fontSize: '15px', fontWeight: 600 }}>
							Create Listing
						</Typography>
						<div className="space-y-0.5">
							{steps.map((step) => (
								<a
									key={step.id}
									href={`#${step.id === 1 ? 'identity' : step.id === 2 ? 'media' : step.id === 3 ? 'variants' : ''}`}
									onClick={(e) => {
										e.preventDefault();
										handleStepClick(step.id);
									}}
									className={`flex justify-between items-center p-2.5 rounded-[10px] cursor-pointer transition-all no-underline ${
										currentStep === step.id
											? 'bg-[#eef2ff]'
											: 'hover:bg-gray-50'
									}`}
									style={{
										color: 'inherit',
										textDecoration: 'none',
									}}
								>
									<div className="flex items-start space-x-2 flex-1 min-w-0">
										<span 
											className={`font-semibold text-sm flex-shrink-0 ${
												currentStep === step.id ? 'text-[#3b82f6]' : 'text-gray-600'
											}`}
										>
											{step.id}.
										</span>
										<div className="flex-1 min-w-0">
											<Typography
												variant="body2"
												className={`font-medium ${
													currentStep === step.id ? 'text-[#3b82f6]' : 'text-gray-900'
												}`}
												sx={{ fontSize: '13px', fontWeight: 500 }}
											>
												{step.title}
											</Typography>
											<Typography 
												variant="caption" 
												className="text-gray-500"
												sx={{ fontSize: '11px', display: 'block', marginTop: '1px', color: '#6b7280' }}
											>
												{step.description}
											</Typography>
										</div>
									</div>
								</a>
							))}
						</div>
					</div>
				</aside>

				{/* Main Content Area */}
				<main className="flex-1 overflow-y-auto p-6 min-w-0 bg-[#f6f7fb]">
					<div className="max-w-[1180px] mx-auto space-y-4">
						{/* Product Identity Section - Step 1 */}
						<section 
							className="p-4 bg-white rounded-2xl border border-gray-200" 
							id="identity"
							style={{
								borderRadius: '16px',
								border: '1px solid #e5e7eb',
								boxShadow: '0 14px 40px rgba(2,8,23,.06)',
							}}
						>
							<Typography variant="h6" className="font-semibold mb-1 text-gray-900" sx={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px', margin: '0 0 6px 0' }}>
								Product identity
							</Typography>
							<Typography variant="body2" className="text-gray-600 mb-4" sx={{ fontSize: '13px', color: '#6b7280', marginBottom: '10px', margin: '2px 0 10px 0' }}>
								Match to a Master Product (MPID) to lock canonical specs. You can still add merchant-specific notes.
							</Typography>

							<div className="grid grid-cols-3 gap-3 mb-3">
								<TextField
									fullWidth
									placeholder="Search name or GTIN/EAN/U"
									variant="outlined"
									value={mpidSearch}
									onChange={(e) => handleMpidSearch(e.target.value)}
									size="small"
									sx={{
										'& .MuiOutlinedInput-root': {
											borderRadius: '12px',
											fontSize: '14px',
											height: '44px',
										},
									}}
								/>
								<Controller
									name="name"
									control={control}
									render={({ field }) => (
										<TextField
											{...field}
											fullWidth
											label="Product Title"
											placeholder="e.g., iPhone 16 Pro Max 256"
											variant="outlined"
											error={!!errors.name}
											helperText={errors.name?.message as string}
											size="small"
											sx={{
												'& .MuiOutlinedInput-root': {
													borderRadius: '12px',
													fontSize: '14px',
													height: '44px',
												},
											}}
										/>
									)}
								/>
								<Controller
									name="slug"
									control={control}
									render={({ field }) => (
										<TextField
											{...field}
											fullWidth
											label="Slug / Handle"
											variant="outlined"
											disabled
											helperText="auto-generates from title"
											size="small"
											sx={{
												'& .MuiOutlinedInput-root': {
													borderRadius: '12px',
													fontSize: '14px',
													height: '44px',
												},
											}}
										/>
									)}
								/>
							</div>
							<Typography variant="caption" className="text-gray-500 mb-3" sx={{ fontSize: '12px', color: '#6b7280', display: 'block', marginTop: '6px' }}>
								We'll suggest an SEO title later based on MPID + variants.
							</Typography>

							{/* Category Fields */}
							<div className="grid grid-cols-2 gap-3 mb-3">
								<Controller
									name="main_category"
									control={control}
									render={({ field }) => (
										<Autocomplete
											{...field}
											options={categoryOptions}
											getOptionLabel={(option) => option.name || ''}
											isOptionEqualToValue={(option, value) => option.id === value.id}
											value={field.value || null}
											onChange={(event, newValue) => {
												field.onChange(newValue);
												setValue('subcategory', []); // Reset subcategory when main category changes
											}}
											renderInput={(params) => (
												<TextField
													{...params}
													label="Main Category *"
													placeholder="Select main category"
													size="small"
													error={!!errors.main_category}
													helperText={errors.main_category?.message as string}
													sx={{
														'& .MuiOutlinedInput-root': {
															borderRadius: '12px',
															fontSize: '14px',
															minHeight: '40px',
														},
													}}
												/>
											)}
										/>
									)}
								/>
								<Controller
									name="subcategory"
									control={control}
									render={({ field }) => {
										const mainCategory = watch('main_category');
										const selected = field.value || [];
										const mainChildren = mainCategory?.children || [];
										// Combine selected and main category children, avoiding duplicates
										const subcategoryOptions = [...mainChildren, ...selected].filter(
											(value, index, self) => self.findIndex(v => v.id === value.id) === index
										);

										return (
											<Autocomplete
												{...field}
												multiple
												options={subcategoryOptions}
												getOptionLabel={(option) => option.name || ''}
												isOptionEqualToValue={(option, value) => option.id === value.id}
												value={field.value || []}
												onChange={(event, newValue) => {
													field.onChange(newValue);
												}}
												disabled={!mainCategory}
												filterSelectedOptions
												renderInput={(params) => (
													<TextField
														{...params}
														label="Subcategory *"
														placeholder={mainCategory ? "Select subcategories" : "Select main category first"}
														size="small"
														error={!!errors.subcategory}
														helperText={errors.subcategory?.message as string || (mainCategory ? "Select at least one subcategory" : "")}
														sx={{
															'& .MuiOutlinedInput-root': {
																borderRadius: '12px',
																fontSize: '14px',
																minHeight: '40px',
															},
														}}
													/>
												)}
												renderTags={(value, getTagProps) =>
													value.map((option, index) => (
														<Chip
															{...getTagProps({ index })}
															key={option.id}
															label={option.name}
															size="small"
															sx={{
																fontSize: '12px',
																height: '24px',
															}}
														/>
													))
												}
											/>
										);
									}}
								/>
							</div>

							<div className="flex flex-wrap gap-2 mb-3">
								<Button 
									variant="outlined" 
									size="small"
									onClick={handleScanBarcode}
									sx={{
										borderColor: '#e5e7eb',
										color: '#374151',
										textTransform: 'none',
										fontSize: '12px',
										padding: '10px 14px',
										borderRadius: '12px',
										minHeight: '44px',
										'&:hover': {
											borderColor: '#d1d5db',
											backgroundColor: '#f9fafb',
										},
									}}
								>
									Scan barcode
								</Button>
								<Button 
									variant="outlined" 
									size="small"
									onClick={handleUseMasterTemplate}
									sx={{
										borderColor: '#e5e7eb',
										color: '#374151',
										textTransform: 'none',
										fontSize: '12px',
										padding: '10px 14px',
										borderRadius: '12px',
										minHeight: '44px',
										'&:hover': {
											borderColor: '#d1d5db',
											backgroundColor: '#f9fafb',
										},
									}}
								>
									Use Master Template
								</Button>
								<Button 
									variant="outlined" 
									size="small"
									onClick={handleUsePastListing}
									sx={{
										borderColor: '#e5e7eb',
										color: '#374151',
										textTransform: 'none',
										fontSize: '12px',
										padding: '10px 14px',
										borderRadius: '12px',
										minHeight: '44px',
										'&:hover': {
											borderColor: '#d1d5db',
											backgroundColor: '#f9fafb',
										},
									}}
								>
									Use My Past Listing
								</Button>
								<Button 
									variant="outlined" 
									size="small"
									onClick={handleImportFromVendor}
									sx={{
										borderColor: '#e5e7eb',
										color: '#374151',
										textTransform: 'none',
										fontSize: '12px',
										padding: '10px 14px',
										borderRadius: '12px',
										minHeight: '44px',
										'&:hover': {
											borderColor: '#d1d5db',
											backgroundColor: '#f9fafb',
										},
									}}
								>
									Import from Other Vendor
								</Button>
								<Button 
									variant="outlined" 
									size="small"
									onClick={() => handleLiveSyncToggle(!liveSyncEnabled)}
									startIcon={<Switch checked={liveSyncEnabled} size="small" sx={{ pointerEvents: 'none' }} />}
									sx={{
										borderColor: liveSyncEnabled ? '#3b82f6' : '#e5e7eb',
										color: liveSyncEnabled ? '#3b82f6' : '#374151',
										textTransform: 'none',
										fontSize: '12px',
										padding: '10px 14px',
										borderRadius: '12px',
										minHeight: '44px',
										backgroundColor: liveSyncEnabled ? '#eff6ff' : 'transparent',
										'&:hover': {
											borderColor: liveSyncEnabled ? '#2563eb' : '#d1d5db',
											backgroundColor: liveSyncEnabled ? '#dbeafe' : '#f9fafb',
										},
									}}
								>
									Live Sync (Auto-Update Specs)
								</Button>
							</div>

							{mpidMatched && matchedProduct && (
								<Box 
									className="mt-3"
									sx={{
										paddingTop: '10px',
										borderTop: '1px solid #e5e7eb',
									}}
								>
									<div className="flex flex-wrap gap-2 mb-2">
										<Chip 
											label={`Brand: ${matchedProduct.brand}`} 
											size="small"
											sx={{
												backgroundColor: '#f3f4f6',
												border: '1px solid #e5e7eb',
												fontSize: '12px',
												height: '24px',
												fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
												padding: '2px 8px',
											}}
										/>
										<Chip 
											label={`Model: ${matchedProduct.model}`} 
											size="small"
											sx={{
												backgroundColor: '#f3f4f6',
												border: '1px solid #e5e7eb',
												fontSize: '12px',
												height: '24px',
												fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
												padding: '2px 8px',
											}}
										/>
										<Chip 
											label={`Display: ${matchedProduct.display}`} 
											size="small"
											sx={{
												backgroundColor: '#f3f4f6',
												border: '1px solid #e5e7eb',
												fontSize: '12px',
												height: '24px',
												fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
												padding: '2px 8px',
											}}
										/>
										<Chip 
											label={`Chip: ${matchedProduct.chip}`} 
											size="small"
											sx={{
												backgroundColor: '#f3f4f6',
												border: '1px solid #e5e7eb',
												fontSize: '12px',
												height: '24px',
												fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
												padding: '2px 8px',
											}}
										/>
										<Chip 
											label={`Year: ${matchedProduct.year}`} 
											size="small"
											sx={{
												backgroundColor: '#f3f4f6',
												border: '1px solid #e5e7eb',
												fontSize: '12px',
												height: '24px',
												fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
												padding: '2px 8px',
											}}
										/>
									</div>
									<Typography variant="caption" className="text-gray-600" sx={{ fontSize: '12px', color: '#6b7280', display: 'block', marginTop: '6px' }}>
										After matching MPID, core specs become read-only to protect catalog quality. You may add condition notes below.
									</Typography>
								</Box>
							)}
						</section>

						{/* Media Section - Step 2 */}
						<section 
							className="p-4 bg-white rounded-2xl border border-gray-200" 
							id="media"
							style={{
								borderRadius: '16px',
								border: '1px solid #e5e7eb',
								boxShadow: '0 14px 40px rgba(2,8,23,.06)',
							}}
						>
							<Typography variant="h6" className="font-semibold mb-1 text-gray-900" sx={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px', margin: '0 0 6px 0' }}>
								Media
							</Typography>
							<Typography variant="body2" className="text-gray-600 mb-4" sx={{ fontSize: '13px', color: '#6b7280', marginBottom: '10px', margin: '2px 0 10px 0' }}>
								Upload 6-12 images. Include front/back, box contents, ports. Per-variant photos supported.
							</Typography>

							{/* Large Image Upload Area - Single box as shown in image */}
							{/* Main Image Upload Area */}
							<div className="mb-4">
								{galleryImages.length > 0 ? (
									<div className="relative w-full h-[400px] border border-gray-300 rounded-xl overflow-hidden bg-white">
										<img
											src={galleryImages[0].url}
											alt="Product"
											className="w-full h-full object-contain"
										/>
										<button
											type="button"
											onClick={(e) => {
												e.preventDefault();
												e.stopPropagation();
												handleImageRemove(0);
											}}
											className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow-lg hover:bg-gray-100 transition-colors"
											style={{
												width: '32px',
												height: '32px',
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
											}}
										>
											<FuseSvgIcon size={16} className="text-gray-600">
												heroicons-outline:x-mark
											</FuseSvgIcon>
										</button>
										{galleryImages[0].is_featured && (
											<div className="absolute top-2 left-2 bg-yellow-400 rounded-full p-1.5 shadow-lg">
												<FuseSvgIcon className="text-white" size={16}>
													heroicons-solid:star
												</FuseSvgIcon>
											</div>
										)}
									</div>
								) : (
									<label
										className="block w-full h-[400px] border border-dashed border-gray-300 rounded-xl flex items-center justify-center bg-white text-gray-500 hover:border-gray-400 hover:bg-gray-50 cursor-pointer transition-colors"
										style={{
											borderRadius: '12px',
										}}
									>
										<input
											type="file"
											accept="image/*"
											multiple
											className="hidden"
											onChange={handleImageUpload}
										/>
										<div className="text-center">
											<FuseSvgIcon className="text-gray-400 mb-2" size={48}>
												heroicons-outline:photo
											</FuseSvgIcon>
											<Typography variant="body2" sx={{ fontSize: '14px', color: '#6b7280' }}>
												Click to upload or drag and drop
											</Typography>
										</div>
									</label>
								)}
							</div>

							{/* Additional Images Grid */}
							{galleryImages.length > 0 && (
								<div className="mb-4">
									<Typography variant="body2" className="font-medium mb-2 text-gray-700" sx={{ fontSize: '14px', marginBottom: '8px' }}>
										Additional Images ({galleryImages.length - 1} of 11)
									</Typography>
									<div className="grid grid-cols-6 gap-2.5">
										{/* Show existing additional images */}
										{galleryImages.slice(1).map((image, index) => (
											<div
												key={`image-${index + 1}`}
												className="relative h-[120px] border border-gray-300 rounded-xl overflow-hidden bg-gray-50 group cursor-pointer"
												style={{
													borderRadius: '12px',
												}}
												onClick={() => handleImageClick(index + 1)}
											>
												<img
													src={image.url}
													alt={`Product ${index + 2}`}
													className="w-full h-full object-cover"
												/>
												{image.is_featured && (
													<div className="absolute top-1 right-1 bg-yellow-400 rounded-full p-1 shadow-md">
														<FuseSvgIcon className="text-white" size={14}>
															heroicons-solid:star
														</FuseSvgIcon>
													</div>
												)}
												<button
													type="button"
													onClick={(e) => {
														e.stopPropagation();
														handleImageRemove(index + 1);
													}}
													className="absolute top-1 left-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600"
													style={{
														width: '24px',
														height: '24px',
														display: 'flex',
														alignItems: 'center',
														justifyContent: 'center',
													}}
												>
													<FuseSvgIcon size={12}>
														heroicons-outline:x-mark
													</FuseSvgIcon>
												</button>
											</div>
										))}
										
										{/* Add more images button */}
										{galleryImages.length < 12 && (
											<label
												className="h-[120px] border border-dashed border-gray-300 rounded-xl flex items-center justify-center bg-gray-50 text-gray-500 hover:border-gray-400 hover:bg-gray-100 cursor-pointer transition-colors"
												style={{
													borderRadius: '12px',
												}}
											>
												<input
													type="file"
													accept="image/*"
													multiple
													className="hidden"
													onChange={handleImageUpload}
												/>
												<FuseSvgIcon className="text-gray-400" size={24}>
													heroicons-outline:plus
												</FuseSvgIcon>
											</label>
										)}
										
										{/* Empty placeholders to fill grid */}
										{Array.from({ length: Math.max(0, 5 - (galleryImages.length - 1)) }).map((_, idx) => (
											galleryImages.length < 12 && (
												<label
													key={`placeholder-${idx}`}
													className="h-[120px] border border-dashed border-gray-300 rounded-xl flex items-center justify-center bg-gray-50 text-gray-500 hover:border-gray-400 hover:bg-gray-100 cursor-pointer transition-colors"
													style={{
														borderRadius: '12px',
													}}
												>
													<input
														type="file"
														accept="image/*"
														multiple
														className="hidden"
														onChange={handleImageUpload}
													/>
													<span className="text-2xl font-light">+</span>
												</label>
											)
										))}
									</div>
									<Typography variant="caption" className="text-gray-500 mt-2" sx={{ fontSize: '12px', color: '#6b7280', display: 'block' }}>
										Click on an image to set it as featured. Upload up to 12 images total.
									</Typography>
								</div>
							)}

							{/* Image Editing Buttons */}
							{galleryImages.length > 0 && (
								<div className="flex flex-wrap gap-2 mb-3">
									<Button 
										variant="outlined" 
										size="small"
										onClick={() => handleRemoveBackground(0)}
										disabled={processingImageIndex !== null}
										startIcon={processingImageIndex === 0 ? <CircularProgress size={16} /> : <FuseSvgIcon size={16}>heroicons-outline:scissors</FuseSvgIcon>}
										sx={{
											borderColor: '#e5e7eb',
											color: '#374151',
											textTransform: 'none',
											fontSize: '12px',
											padding: '10px 14px',
											borderRadius: '12px',
											minHeight: '44px',
											'&:hover': {
												borderColor: '#d1d5db',
												backgroundColor: '#f9fafb',
											},
											'&:disabled': {
												opacity: 0.6,
											},
										}}
									>
										Remove background
									</Button>
									<Button 
										variant="outlined" 
										size="small"
										onClick={() => handleAutoCropAndCenter(0)}
										disabled={processingImageIndex !== null}
										startIcon={processingImageIndex === 0 ? <CircularProgress size={16} /> : <FuseSvgIcon size={16}>heroicons-outline:crop</FuseSvgIcon>}
										sx={{
											borderColor: '#e5e7eb',
											color: '#374151',
											textTransform: 'none',
											fontSize: '12px',
											padding: '10px 14px',
											borderRadius: '12px',
											minHeight: '44px',
											'&:hover': {
												borderColor: '#d1d5db',
												backgroundColor: '#f9fafb',
											},
											'&:disabled': {
												opacity: 0.6,
											},
										}}
									>
										Auto-crop & center
									</Button>
									<Button 
										variant="outlined" 
										size="small"
										onClick={() => handleCreate360Spin(0)}
										disabled={processingImageIndex !== null}
										startIcon={processingImageIndex === 0 ? <CircularProgress size={16} /> : <FuseSvgIcon size={16}>heroicons-outline:arrow-path</FuseSvgIcon>}
										sx={{
											borderColor: '#e5e7eb',
											color: '#374151',
											textTransform: 'none',
											fontSize: '12px',
											padding: '10px 14px',
											borderRadius: '12px',
											minHeight: '44px',
											'&:hover': {
												borderColor: '#d1d5db',
												backgroundColor: '#f9fafb',
											},
											'&:disabled': {
												opacity: 0.6,
											},
										}}
									>
										Create 360° spin
									</Button>
									<Button 
										variant="outlined" 
										size="small"
										onClick={() => handleWatermark(0)}
										disabled={processingImageIndex !== null}
										startIcon={processingImageIndex === 0 ? <CircularProgress size={16} /> : <FuseSvgIcon size={16}>heroicons-outline:document-text</FuseSvgIcon>}
										sx={{
											borderColor: '#e5e7eb',
											color: '#374151',
											textTransform: 'none',
											fontSize: '12px',
											padding: '10px 14px',
											borderRadius: '12px',
											minHeight: '44px',
											'&:hover': {
												borderColor: '#d1d5db',
												backgroundColor: '#f9fafb',
											},
											'&:disabled': {
												opacity: 0.6,
											},
										}}
									>
										Watermark
									</Button>
									<Button 
										variant="outlined" 
										size="small"
										onClick={() => handleAIAutoEnhance(0)}
										disabled={processingImageIndex !== null}
										startIcon={processingImageIndex === 0 ? <CircularProgress size={16} /> : <FuseSvgIcon size={16}>heroicons-outline:sparkles</FuseSvgIcon>}
										sx={{
											borderColor: '#e5e7eb',
											color: '#374151',
											textTransform: 'none',
											fontSize: '12px',
											padding: '10px 14px',
											borderRadius: '12px',
											minHeight: '44px',
											'&:hover': {
												borderColor: '#d1d5db',
												backgroundColor: '#f9fafb',
											},
											'&:disabled': {
												opacity: 0.6,
											},
										}}
									>
										AI Auto-enhance
									</Button>
								</div>
							)}
							<Typography variant="body2" className="text-gray-600" sx={{ fontSize: '12px', color: '#6b7280', marginTop: '6px' }}>
								Tip: Add a photo of serial/IMEI (mask last digits). AI will auto-shadow and white balance.
							</Typography>
						</section>

						{/* Variants Section - Step 3 */}
						<Paper 
							className="p-4" 
							id="variants"
							sx={{
								borderRadius: '16px',
								border: '1px solid #e5e7eb',
								boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
							}}
						>
							<Typography variant="h6" className="font-semibold mb-1 text-gray-900" sx={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px' }}>
								Variants
							</Typography>
							<Typography variant="body2" className="text-gray-600 mb-4" sx={{ fontSize: '13px', color: '#6b7280', marginBottom: '10px' }}>
								Matrix for Storage × Color. Per-variant price / stock / images.
							</Typography>

							{/* Storage Options Display */}
							{storageOptions.length > 0 && (
								<div className="mb-3">
									<Typography variant="subtitle2" className="mb-2" sx={{ fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>
										Storage Options:
									</Typography>
									<div className="flex flex-wrap gap-2">
										{storageOptions.map((storage, idx) => (
											<Chip
												key={idx}
												label={storage}
												onDelete={() => handleRemoveStorage(storage)}
												size="small"
												sx={{
													backgroundColor: '#f3f4f6',
													color: '#374151',
													fontSize: '12px',
													'& .MuiChip-deleteIcon': {
														fontSize: '16px',
													},
												}}
											/>
										))}
									</div>
								</div>
							)}

							{/* Color Options Display */}
							{colorOptions.length > 0 && (
								<div className="mb-3">
									<Typography variant="subtitle2" className="mb-2" sx={{ fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>
										Color Options:
									</Typography>
									<div className="flex flex-wrap gap-2">
										{colorOptions.map((color, idx) => (
											<Chip
												key={idx}
												label={color}
												onDelete={() => handleRemoveColor(color)}
												size="small"
												sx={{
													backgroundColor: '#f3f4f6',
													color: '#374151',
													fontSize: '12px',
													'& .MuiChip-deleteIcon': {
														fontSize: '16px',
													},
												}}
											/>
										))}
									</div>
									{/* Per-Color Images Section */}
									<div className="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
										<Typography variant="subtitle2" className="mb-2" sx={{ fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
											Per-Color Images (Optional)
										</Typography>
										<Typography variant="caption" className="mb-3" sx={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '8px' }}>
											Add images for each color. These will be used for all variants with that color.
										</Typography>
										<div className="grid grid-cols-3 gap-3">
											{colorOptions.map((color, idx) => (
												<div key={idx} className="flex flex-col items-center">
													<Typography variant="caption" sx={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px', fontWeight: 500 }}>
														{color}
													</Typography>
													{colorImages[color] ? (
														<div className="relative w-full aspect-square rounded-lg overflow-hidden border-2 border-gray-300">
															<img
																src={colorImages[color]}
																alt={color}
																className="w-full h-full object-cover"
															/>
															<IconButton
																size="small"
																onClick={() => handleRemoveColorImage(color)}
																sx={{
																	position: 'absolute',
																	top: 4,
																	right: 4,
																	backgroundColor: 'rgba(255, 255, 255, 0.9)',
																	padding: '4px',
																	'&:hover': {
																		backgroundColor: 'rgba(255, 255, 255, 1)',
																	},
																}}
															>
																<FuseSvgIcon size={14} sx={{ color: '#ef4444' }}>heroicons-outline:x-mark</FuseSvgIcon>
															</IconButton>
															<IconButton
																size="small"
																onClick={() => handleAddColorImage(color)}
																sx={{
																	position: 'absolute',
																	bottom: 4,
																	right: 4,
																	backgroundColor: 'rgba(255, 255, 255, 0.9)',
																	padding: '4px',
																	'&:hover': {
																		backgroundColor: 'rgba(255, 255, 255, 1)',
																	},
																}}
															>
																<FuseSvgIcon size={14} sx={{ color: '#374151' }}>heroicons-outline:pencil</FuseSvgIcon>
															</IconButton>
														</div>
													) : (
														<label className="w-full aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-white cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors">
															<input
																type="file"
																accept="image/*"
																style={{ display: 'none' }}
																onChange={(e) => {
																	if (e.target.files && e.target.files.length > 0) {
																		setSelectedColorForImage(color);
																		handleColorImageUpload(e.target.files);
																	}
																}}
															/>
															<FuseSvgIcon size={24} sx={{ color: '#9ca3af' }}>heroicons-outline:photo</FuseSvgIcon>
														</label>
													)}
												</div>
											))}
										</div>
									</div>
								</div>
							)}

							<div className="flex flex-wrap gap-2 mb-4">
								<Button 
									variant="outlined" 
									size="small"
									onClick={handleAddStorage}
									sx={{
										borderColor: '#e5e7eb',
										color: '#374151',
										textTransform: 'none',
										fontSize: '12px',
										padding: '6px 12px',
										borderRadius: '10px',
										'&:hover': {
											borderColor: '#d1d5db',
											backgroundColor: '#f9fafb',
										},
									}}
								>
									Add Storage
								</Button>
								<Button 
									variant="outlined" 
									size="small"
									onClick={handleAddColor}
									sx={{
										borderColor: '#e5e7eb',
										color: '#374151',
										textTransform: 'none',
										fontSize: '12px',
										padding: '6px 12px',
										borderRadius: '10px',
										'&:hover': {
											borderColor: '#d1d5db',
											backgroundColor: '#f9fafb',
										},
									}}
								>
									Add Color
								</Button>
								{variants.length > 0 && (
									<>
										<Button 
											variant="outlined" 
											size="small"
											onClick={handleApplyPriceToAll}
											startIcon={<FuseSvgIcon size={16}>heroicons-outline:currency-pound</FuseSvgIcon>}
											sx={{
												borderColor: '#e5e7eb',
												color: '#374151',
												textTransform: 'none',
												fontSize: '12px',
												padding: '6px 12px',
												borderRadius: '10px',
												'&:hover': {
													borderColor: '#d1d5db',
													backgroundColor: '#f9fafb',
												},
											}}
										>
											Apply price to all
										</Button>
										<Button 
											variant="outlined" 
											size="small"
											onClick={handleApplyStockToAll}
											startIcon={<FuseSvgIcon size={16}>heroicons-outline:cube</FuseSvgIcon>}
											sx={{
												borderColor: '#e5e7eb',
												color: '#374151',
												textTransform: 'none',
												fontSize: '12px',
												padding: '6px 12px',
												borderRadius: '10px',
												'&:hover': {
													borderColor: '#d1d5db',
													backgroundColor: '#f9fafb',
												},
											}}
										>
											Apply stock to all
										</Button>
									</>
								)}
							</div>

							{storageOptions.length > 0 && colorOptions.length > 0 && variants.length === 0 && (
								<Button 
									variant="contained" 
									onClick={generateVariants} 
									className="mb-4"
									sx={{
										backgroundColor: '#ff6536',
										'&:hover': { backgroundColor: '#e55a2b' },
										textTransform: 'none',
										borderRadius: '10px',
									}}
								>
									Generate Variant Matrix
								</Button>
							)}

							<div className="overflow-x-auto">
								<table className="w-full border-collapse" style={{ fontSize: '13px' }}>
									<thead>
										<tr className="bg-gray-100">
											<th className="border border-gray-300 px-3 py-2 text-left font-semibold" style={{ fontSize: '12px' }}>Storage</th>
											<th className="border border-gray-300 px-3 py-2 text-left font-semibold" style={{ fontSize: '12px' }}>Color</th>
											<th className="border border-gray-300 px-3 py-2 text-left font-semibold" style={{ fontSize: '12px' }}>Price (£)</th>
											<th className="border border-gray-300 px-3 py-2 text-left font-semibold" style={{ fontSize: '12px' }}>Compare-at</th>
											<th className="border border-gray-300 px-3 py-2 text-left font-semibold" style={{ fontSize: '12px' }}>Stock</th>
											<th className="border border-gray-300 px-3 py-2 text-left font-semibold" style={{ fontSize: '12px' }}>Same-day</th>
											<th className="border border-gray-300 px-3 py-2 text-left font-semibold" style={{ fontSize: '12px' }}>Images</th>
										</tr>
									</thead>
									<tbody>
										{variants.length === 0 ? (
											<tr>
												<td colSpan={7} className="border border-gray-300 px-4 py-8 text-center text-gray-400" style={{ fontSize: '13px' }}>
													No variants added yet. Add Storage and Color options to generate variant matrix.
												</td>
											</tr>
										) : (
											variants.map((variant, index) => (
												<tr key={index}>
													<td className="border border-gray-300 px-3 py-2" style={{ fontSize: '13px' }}>{variant.storage}</td>
													<td className="border border-gray-300 px-3 py-2" style={{ fontSize: '13px' }}>{variant.color}</td>
													<td className="border border-gray-300 px-3 py-2">
														<TextField
															size="small"
															type="number"
															value={variant.price}
															onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
															placeholder="1299"
															sx={{
																width: '100%',
																'& .MuiOutlinedInput-root': {
																	fontSize: '13px',
																	minHeight: '36px',
																	maxHeight: '36px',
																},
																'& .MuiInputBase-input': {
																	padding: '8px 12px',
																	overflow: 'hidden',
																	textOverflow: 'ellipsis',
																},
															}}
														/>
													</td>
													<td className="border border-gray-300 px-3 py-2">
														<TextField
															size="small"
															type="number"
															value={variant.compareAt}
															onChange={(e) => handleVariantChange(index, 'compareAt', e.target.value)}
															placeholder="1349"
															sx={{
																width: '100%',
																'& .MuiOutlinedInput-root': {
																	fontSize: '13px',
																	minHeight: '36px',
																	maxHeight: '36px',
																},
																'& .MuiInputBase-input': {
																	padding: '8px 12px',
																	overflow: 'hidden',
																	textOverflow: 'ellipsis',
																},
															}}
														/>
													</td>
													<td className="border border-gray-300 px-3 py-2">
														<TextField
															size="small"
															type="number"
															value={variant.stock}
															onChange={(e) => handleVariantChange(index, 'stock', e.target.value)}
															placeholder="12"
															sx={{
																width: '100%',
																'& .MuiOutlinedInput-root': {
																	fontSize: '13px',
																	minHeight: '36px',
																	maxHeight: '36px',
																},
																'& .MuiInputBase-input': {
																	padding: '8px 12px',
																	overflow: 'hidden',
																	textOverflow: 'ellipsis',
																},
															}}
														/>
													</td>
													<td className="border border-gray-300 px-3 py-2">
														<Checkbox
															checked={variant.sameDay}
															onChange={(e) => handleVariantChange(index, 'sameDay', e.target.checked)}
															size="small"
														/>
													</td>
													<td className="border border-gray-300 px-3 py-2">
														<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
															{(variant as any).image ? (
																<>
																	<Box
																		component="img"
																		src={(variant as any).image}
																		alt={`${variant.storage} ${variant.color}`}
																		sx={{
																			width: 40,
																			height: 40,
																			objectFit: 'cover',
																			borderRadius: '8px',
																			border: '1px solid #e5e7eb',
																		}}
																	/>
																	<IconButton
																		size="small"
																		onClick={() => {
																			const updated = [...variants];
																			delete (updated[index] as any).image;
																			setVariants(updated);
																		}}
																		sx={{ color: '#ef4444', padding: '4px' }}
																	>
																		<FuseSvgIcon size={14}>heroicons-outline:x-mark</FuseSvgIcon>
																	</IconButton>
																</>
															) : (
																<label>
																	<input
																		type="file"
																		accept="image/*"
																		style={{ display: 'none' }}
																		onChange={(e) => handleVariantImageUpload(index, e.target.files)}
																	/>
																	<Button 
																		size="small" 
																		variant="outlined"
																		component="span"
																		startIcon={<FuseSvgIcon size={14}>heroicons-outline:photo</FuseSvgIcon>}
																		sx={{
																			borderColor: '#e5e7eb',
																			color: '#374151',
																			textTransform: 'none',
																			fontSize: '11px',
																			padding: '4px 10px',
																			borderRadius: '8px',
																		}}
																	>
																		Upload
																	</Button>
																</label>
															)}
														</Box>
													</td>
												</tr>
											))
										)}
									</tbody>
								</table>
							</div>
						</Paper>

						{/* Pricing & Intel Section - Step 4 */}
						<Paper 
							className="p-3" 
							id="pricing"
							sx={{
								borderRadius: '16px',
								border: '1px solid #e5e7eb',
								boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
							}}
						>
							<Typography variant="h6" className="font-semibold mb-2 text-gray-900" sx={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
								Pricing & intelligence
							</Typography>
							<div className="grid grid-cols-2 gap-3 mb-3">
								<Paper 
									className="p-3"
									sx={{
										backgroundColor: '#ffffff',
										border: '1px solid #e5e7eb',
										borderRadius: '12px',
										padding: '12px',
									}}
								>
									<div className="flex justify-between items-start mb-1">
										<div>
											<Typography variant="subtitle2" className="font-bold" sx={{ fontSize: '14px', fontWeight: 800 }}>
												Suggested range ({pricingIntelligence.city})
											</Typography>
											<Typography variant="caption" className="text-gray-600" sx={{ fontSize: '12px', color: '#6b7280', display: 'block', marginTop: '2px' }}>
												25–75% band from recent listings
											</Typography>
										</div>
										<div style={{ textAlign: 'right' }}>
											<Typography variant="h6" className="font-bold" sx={{ fontSize: '20px', fontWeight: 900 }}>
												{formatCurrency(pricingIntelligence.priceRange.min)} – {formatCurrency(pricingIntelligence.priceRange.max)}
											</Typography>
											<Typography variant="caption" className="text-gray-500" sx={{ fontSize: '12px', color: '#6b7280' }}>
												Median {formatCurrency(pricingIntelligence.median)}
											</Typography>
										</div>
									</div>
								</Paper>
								<Paper 
									className="p-3"
									sx={{
										backgroundColor: '#ffffff',
										border: '1px solid #e5e7eb',
										borderRadius: '12px',
										padding: '12px',
									}}
								>
									<div className="flex justify-between items-start mb-1">
										<div>
											<Typography variant="subtitle2" className="font-bold" sx={{ fontSize: '14px', fontWeight: 800 }}>
												Fee preview
											</Typography>
											<Typography variant="caption" className="text-gray-600" sx={{ fontSize: '12px', color: '#6b7280', display: 'block', marginTop: '2px' }}>
												Commission + delivery + promos
											</Typography>
										</div>
										<div style={{ textAlign: 'right' }}>
											<Typography variant="body2" className="mb-1" sx={{ fontSize: '13px' }}>
												Fees: {formatCurrency(pricingIntelligence.fees.total)}
											</Typography>
											<Typography variant="h6" className="font-bold" sx={{ fontSize: '16px', fontWeight: 700 }}>
												Net: {formatCurrency(pricingIntelligence.net)}
											</Typography>
										</div>
									</div>
								</Paper>
							</div>
							<Typography variant="caption" className="text-gray-500" sx={{ fontSize: '12px', color: '#6b7280' }}>
								{pricingIntelligence.basePrice > 0 
									? `Auto-refreshed range for ${pricingIntelligence.city} based on selected variant.`
									: "We'll auto-refresh range by city and variant once you select stock."}
							</Typography>
						</Paper>

						{/* Same-day & Stores Section - Step 5 */}
						<Paper 
							className="p-4" 
							id="delivery"
							sx={{
								borderRadius: '16px',
								border: '1px solid #e5e7eb',
								boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
							}}
						>
							<Typography variant="h6" className="font-semibold mb-1 text-gray-900" sx={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px' }}>
								Same-day & stores
							</Typography>
							<div className="grid grid-cols-2 gap-3 mb-3">
								<Controller
									name="store_postcode"
									control={control}
									render={({ field }) => (
										<TextField 
											{...field} 
											label="Store postcode" 
											placeholder="E12 6PH" 
											fullWidth 
											size="small"
											sx={{
												'& .MuiOutlinedInput-root': {
													borderRadius: '12px',
													fontSize: '14px',
												},
											}}
										/>
									)}
								/>
								<Controller
									name="delivery_radius"
									control={control}
									render={({ field }) => (
										<TextField 
											{...field} 
											label="Radius (km)" 
											type="number" 
											value={deliveryRadius} 
											fullWidth 
											size="small"
											sx={{
												'& .MuiOutlinedInput-root': {
													borderRadius: '12px',
													fontSize: '14px',
												},
											}}
										/>
									)}
								/>
								<Controller
									name="delivery_slots"
									control={control}
									render={({ field }) => (
										<FormControl fullWidth size="small">
											<InputLabel>Delivery slots</InputLabel>
											<Select 
												{...field} 
												value={deliverySlots}
												sx={{
													borderRadius: '12px',
													fontSize: '14px',
												}}
											>
												<MenuItem value="12-3pm">12–3pm</MenuItem>
												<MenuItem value="3-6pm">3–6pm</MenuItem>
												<MenuItem value="6-9pm">6–9pm</MenuItem>
											</Select>
										</FormControl>
									)}
								/>
							</div>
							<Controller
								name="enable_pickup"
								control={control}
								render={({ field }) => (
									<FormControlLabel
										control={<Checkbox {...field} checked={enablePickup} size="small" />}
										label="Enable pickup"
										sx={{ marginTop: '8px' }}
									/>
								)}
							/>
							<Typography variant="caption" className="text-gray-500" sx={{ fontSize: '12px', color: '#6b7280', display: 'block', marginTop: '8px' }}>
								Same-day badge appears only if stock &gt; 0 and slots are available.
							</Typography>
						</Paper>

						{/* Copy & SEO Section - Step 6 */}
						<Paper 
							className="p-4" 
							id="copy"
							sx={{
								borderRadius: '16px',
								border: '1px solid #e5e7eb',
								boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
							}}
						>
							<Typography variant="h6" className="font-semibold mb-1 text-gray-900" sx={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px' }}>
								Copy & SEO (AI-assisted)
							</Typography>
							<div className="flex flex-wrap gap-2 mb-3">
								<Button 
									variant="outlined" 
									size="small"
									onClick={handleSuggestTitle}
									sx={{
										borderColor: '#e5e7eb',
										color: '#374151',
										textTransform: 'none',
										fontSize: '12px',
										padding: '6px 12px',
										borderRadius: '10px',
										'&:hover': {
											borderColor: '#d1d5db',
											backgroundColor: '#f9fafb',
										},
									}}
								>
									Suggest title
								</Button>
								<Button 
									variant="outlined" 
									size="small"
									onClick={handleGenerateBullets}
									sx={{
										borderColor: '#e5e7eb',
										color: '#374151',
										textTransform: 'none',
										fontSize: '12px',
										padding: '6px 12px',
										borderRadius: '10px',
										'&:hover': {
											borderColor: '#d1d5db',
											backgroundColor: '#f9fafb',
										},
									}}
								>
									Generate 6 bullets
								</Button>
								<Button 
									variant="outlined" 
									size="small"
									onClick={handleWriteDescription}
									sx={{
										borderColor: '#e5e7eb',
										color: '#374151',
										textTransform: 'none',
										fontSize: '12px',
										padding: '6px 12px',
										borderRadius: '10px',
										'&:hover': {
											borderColor: '#d1d5db',
											backgroundColor: '#f9fafb',
										},
									}}
								>
									Write description
								</Button>
								<Select 
									defaultValue="Neutral" 
									size="small" 
									sx={{ 
										minWidth: 200,
										borderRadius: '10px',
										fontSize: '12px',
									}}
								>
									<MenuItem value="Neutral">Tone: Neutral</MenuItem>
									<MenuItem value="Premium">Premium</MenuItem>
									<MenuItem value="Conversational">Conversational</MenuItem>
								</Select>
							</div>
							<div className="mb-4">
								<Controller
									name="meta_title"
									control={control}
									render={({ field }) => {
										const charCount = (field.value || '').length;
										return (
											<Box sx={{ position: 'relative', width: '100%' }}>
												<TextField
													value={field.value || ''}
													onChange={(e) => {
														e.stopPropagation();
														field.onChange(e);
													}}
													onBlur={field.onBlur}
													name={field.name}
													inputRef={field.ref}
													fullWidth
													label="SEO title (≤ 70 chars)"
													placeholder="iPhone 16 Pro Max 256GB — QC-Verified, Same-Day Delivery"
													size="small"
													inputProps={{
														maxLength: 70,
														style: { paddingRight: '60px' },
													}}
													sx={{
														'& .MuiOutlinedInput-root': {
															borderRadius: '12px',
															fontSize: '14px',
															minHeight: '40px',
															maxHeight: '40px',
															'& fieldset': {
																borderColor: '#e5e7eb',
															},
															'&:hover fieldset': {
																borderColor: '#d1d5db',
															},
															'&.Mui-focused fieldset': {
																borderColor: '#ff6536',
																borderWidth: '2px',
															},
														},
														'& .MuiInputBase-input': {
															padding: '8px 14px 8px 14px',
															color: '#111827',
															fontSize: '14px',
															width: '100%',
															boxSizing: 'border-box',
															'&::placeholder': {
																color: '#9ca3af',
																opacity: 1,
															},
														},
														'& .MuiInputLabel-root': {
															color: '#6b7280',
															fontSize: '14px',
															'&.Mui-focused': {
																color: '#ff6536',
															},
														},
													}}
												/>
												<Box
													sx={{
														position: 'absolute',
														right: '14px',
														top: '50%',
														transform: 'translateY(-50%)',
														fontSize: '11px',
														color: '#6b7280',
														pointerEvents: 'none',
														zIndex: 2,
														backgroundColor: 'white',
														paddingLeft: '4px',
													}}
												>
													{charCount}/70
												</Box>
											</Box>
										);
									}}
								/>
							</div>
							<div className="mb-4">
								<Controller
									name="meta_description"
									control={control}
									render={({ field }) => {
										const charCount = (field.value || '').length;
										return (
											<Box sx={{ position: 'relative', width: '100%' }}>
												<TextField
													{...field}
													fullWidth
													label="Meta description (≤ 160 chars)"
													placeholder="Fast same-day delivery, 1-year AccessoryShield, verified device with invoice."
													size="small"
													inputProps={{
														maxLength: 160,
														style: { paddingRight: '70px' },
													}}
													sx={{
														'& .MuiOutlinedInput-root': {
															borderRadius: '12px',
															fontSize: '14px',
															minHeight: '40px',
															maxHeight: '40px',
															'& fieldset': {
																borderColor: '#e5e7eb',
															},
															'&:hover fieldset': {
																borderColor: '#d1d5db',
															},
															'&.Mui-focused fieldset': {
																borderColor: '#ff6536',
																borderWidth: '2px',
															},
														},
														'& .MuiInputBase-input': {
															padding: '8px 14px 8px 14px',
															color: '#111827',
															fontSize: '14px',
															width: '100%',
															boxSizing: 'border-box',
															'&::placeholder': {
																color: '#9ca3af',
																opacity: 1,
															},
														},
														'& .MuiInputLabel-root': {
															color: '#6b7280',
															fontSize: '14px',
															'&.Mui-focused': {
																color: '#ff6536',
															},
														},
													}}
												/>
												<Box
													sx={{
														position: 'absolute',
														right: '14px',
														top: '50%',
														transform: 'translateY(-50%)',
														fontSize: '11px',
														color: '#6b7280',
														pointerEvents: 'none',
														zIndex: 2,
														backgroundColor: 'white',
														paddingLeft: '4px',
													}}
												>
													{charCount}/160
												</Box>
											</Box>
										);
									}}
								/>
							</div>
							<div className="mb-3">
								<Controller
									name="description"
									control={control}
									render={({ field }) => (
										<TextField
											{...field}
											fullWidth
											multiline
											minRows={5}
											maxRows={10}
											label="Description"
											placeholder="Add what's in the box, condition notes, and warranty details…"
											size="small"
											sx={{
												'& .MuiOutlinedInput-root': {
													borderRadius: '12px',
													fontSize: '14px',
													minHeight: '120px',
													'& textarea': {
														overflow: 'auto !important',
														resize: 'vertical',
														minHeight: '100px !important',
														padding: '12px 14px !important',
														lineHeight: '1.5',
													},
												},
											}}
										/>
									)}
								/>
							</div>
							<Typography variant="caption" className="text-gray-500" sx={{ fontSize: '12px', color: '#6b7280', display: 'block', marginTop: '8px' }}>
								Structured schema will include brand/model/MPN from MPID automatically.
							</Typography>
						</Paper>

						{/* QC & Policies Section - Step 7 */}
						<Paper 
							className="p-4" 
							id="policies"
							sx={{
								borderRadius: '16px',
								border: '1px solid #e5e7eb',
								boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
							}}
						>
							<Typography variant="h6" className="font-semibold mb-1 text-gray-900" sx={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px' }}>
								QC & policies
							</Typography>
							<div className="grid grid-cols-3 gap-3 mb-3">
								<Controller
									name="condition"
									control={control}
									render={({ field }) => (
										<FormControl fullWidth size="small">
											<InputLabel>Condition</InputLabel>
											<Select 
												{...field} 
												value={condition}
												sx={{
													borderRadius: '12px',
													fontSize: '14px',
												}}
											>
												<MenuItem value="New">New</MenuItem>
												<MenuItem value="Open-Box">Open‑Box</MenuItem>
												<MenuItem value="Like New">Like New</MenuItem>
												<MenuItem value="Good">Good</MenuItem>
												<MenuItem value="Fair">Fair</MenuItem>
											</Select>
										</FormControl>
									)}
								/>
								<TextField
									fullWidth
									label="IMEI / Serial"
									placeholder="Masked on product page"
									helperText="Masked on product page"
									size="small"
									sx={{
										'& .MuiOutlinedInput-root': {
											borderRadius: '12px',
											fontSize: '14px',
											minHeight: '40px',
											maxHeight: '40px',
										},
										'& .MuiInputBase-input': {
											padding: '8px 14px',
											color: '#111827',
											fontSize: '14px',
											width: '100%',
											boxSizing: 'border-box',
											overflow: 'hidden',
											textOverflow: 'ellipsis',
											whiteSpace: 'nowrap',
										},
										'& .MuiFormHelperText-root': {
											marginTop: '4px',
											marginLeft: '0',
											fontSize: '11px',
										},
									}}
								/>
								<Controller
									name="returns"
									control={control}
									render={({ field }) => (
										<FormControl fullWidth size="small">
											<InputLabel>Returns</InputLabel>
											<Select 
												{...field} 
												value={returns}
												sx={{
													borderRadius: '12px',
													fontSize: '14px',
												}}
											>
												<MenuItem value="7-day returns">7‑day returns</MenuItem>
												<MenuItem value="15-day returns">15‑day returns</MenuItem>
												<MenuItem value="30-day returns">30‑day returns</MenuItem>
											</Select>
										</FormControl>
									)}
								/>
								<Controller
									name="warranty"
									control={control}
									render={({ field }) => (
										<FormControl fullWidth size="small">
											<InputLabel>Warranty</InputLabel>
											<Select 
												{...field} 
												value={warranty}
												sx={{
													borderRadius: '12px',
													fontSize: '14px',
												}}
											>
												<MenuItem value="Manufacturer warranty">Manufacturer warranty</MenuItem>
												<MenuItem value="Vendor warranty">Vendor warranty</MenuItem>
											</Select>
										</FormControl>
									)}
								/>
								<Controller
									name="condition_notes"
									control={control}
									render={({ field }) => (
										<TextField
											{...field}
											fullWidth
											multiline
											minRows={3}
											maxRows={6}
											label="Condition notes"
											placeholder="e.g., Minor hairline on frame; battery health 98%."
											size="small"
											sx={{
												'& .MuiOutlinedInput-root': {
													borderRadius: '12px',
													fontSize: '14px',
													minHeight: '80px',
													'& textarea': {
														overflow: 'auto !important',
														resize: 'vertical',
														minHeight: '60px !important',
													},
												},
												'& .MuiInputBase-input': {
													lineHeight: '1.5',
													padding: '12px 14px',
												},
											}}
										/>
									)}
								/>
								<Controller
									name="box_contents"
									control={control}
									render={({ field }) => (
										<TextField
											{...field}
											fullWidth
											label="Box contents checklist"
											placeholder="Phone, USB‑C cable, docs, SIM tool"
											size="small"
											sx={{
												'& .MuiOutlinedInput-root': {
													borderRadius: '12px',
													fontSize: '14px',
													minHeight: '40px',
												},
												'& .MuiInputBase-input': {
													overflow: 'hidden',
													textOverflow: 'ellipsis',
													whiteSpace: 'nowrap',
													padding: '8px 14px',
												},
											}}
										/>
									)}
								/>
							</div>
							<Typography variant="caption" className="text-gray-500" sx={{ fontSize: '12px', color: '#6b7280' }}>
								Phones: require unseal video at hand‑off; DOA window 48h for instant swap.
							</Typography>
						</Paper>

						{/* Offers Section - Step 8 */}
						<Paper 
							className="p-4" 
							id="offers"
							sx={{
								borderRadius: '16px',
								border: '1px solid #e5e7eb',
								boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
							}}
						>
							<Typography variant="h6" className="font-semibold mb-1 text-gray-900" sx={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px' }}>
								Offers
							</Typography>
							<div className="space-y-2">
								<FormControlLabel
									control={
										<Checkbox
											checked={offers.accessoryShield}
											onChange={(e) => setOffers({ ...offers, accessoryShield: e.target.checked })}
											size="small"
										/>
									}
									label="AccessoryShield — Free 1‑Year replacement"
									sx={{ fontSize: '13px' }}
								/>
								<FormControlLabel
									control={
										<Checkbox
											checked={offers.setupAtDoorstep}
											onChange={(e) => setOffers({ ...offers, setupAtDoorstep: e.target.checked })}
											size="small"
										/>
									}
									label="Setup@Doorstep — 30‑minute concierge"
									sx={{ fontSize: '13px' }}
								/>
								<FormControlLabel
									control={
										<Checkbox
											checked={offers.priceDropProtection}
											onChange={(e) => setOffers({ ...offers, priceDropProtection: e.target.checked })}
											size="small"
										/>
									}
									label="7‑Day Price‑Drop Protection"
									sx={{ fontSize: '13px' }}
								/>
								<FormControlLabel
									control={
										<Checkbox
											checked={offers.tradeInAssist}
											onChange={(e) => setOffers({ ...offers, tradeInAssist: e.target.checked })}
											size="small"
										/>
									}
									label="Trade‑in Assist — instant value check"
									sx={{ fontSize: '13px' }}
								/>
							</div>
						</Paper>

						{/* Trust & Compliance Section - Step 9 */}
						<Paper 
							className="p-4" 
							id="trust"
							sx={{
								borderRadius: '16px',
								border: '1px solid #e5e7eb',
								boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
							}}
						>
							<Typography variant="h6" className="font-semibold mb-1 text-gray-900" sx={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px' }}>
								Trust & Compliance
							</Typography>
							<Typography variant="body2" className="text-gray-600 mb-3" sx={{ fontSize: '13px', color: '#6b7280', marginBottom: '10px' }}>
								Exclusive MultiKonnect safeguards to reduce fraud and elevate buyer confidence.
							</Typography>
							<div className="grid grid-cols-2 gap-3 mb-3">
								<Controller
									name="kyc_tier"
									control={control}
									render={({ field }) => (
										<FormControl fullWidth size="small">
											<InputLabel>KYC tier</InputLabel>
											<Select 
												{...field} 
												value={kycTier}
												sx={{
													borderRadius: '12px',
													fontSize: '14px',
												}}
											>
												<MenuItem value="Tier 0 - Email verified">Tier 0 — Email verified</MenuItem>
												<MenuItem value="Tier 1 - ID + Selfie">Tier 1 — ID + Selfie</MenuItem>
												<MenuItem value="Tier 2 - ID + Bank match">Tier 2 — ID + Bank match</MenuItem>
												<MenuItem value="Tier 3 - Business KYB">Tier 3 — Business KYB</MenuItem>
											</Select>
										</FormControl>
									)}
								/>
								<Controller
									name="safe_selling_limit"
									control={control}
									render={({ field }) => (
										<TextField 
											{...field} 
											label="Safe‑selling limit" 
											value={safeSellingLimit} 
											fullWidth 
											size="small"
											sx={{
												'& .MuiOutlinedInput-root': {
													borderRadius: '12px',
													fontSize: '14px',
												},
											}}
										/>
									)}
								/>
								<TextField
									fullWidth
									label="Fraud signals"
									value="Device fingerprint OK · IP clean · Velocity normal"
									disabled
									size="small"
									sx={{
										'& .MuiOutlinedInput-root': {
											borderRadius: '12px',
											fontSize: '14px',
										},
									}}
								/>
								<Controller
									name="payout_lock"
									control={control}
									render={({ field }) => (
										<FormControl fullWidth size="small">
											<InputLabel>Payout lock</InputLabel>
											<Select 
												{...field} 
												value={payoutLock}
												sx={{
													borderRadius: '12px',
													fontSize: '14px',
												}}
											>
												<MenuItem value="Instant">Instant</MenuItem>
												<MenuItem value="48h post-delivery">48h post‑delivery</MenuItem>
												<MenuItem value="Manual review">Manual review</MenuItem>
											</Select>
										</FormControl>
									)}
								/>
							</div>
							<Typography variant="caption" className="text-gray-500" sx={{ fontSize: '12px', color: '#6b7280' }}>
								We cross‑check ID ↔ bank name, geolocation, IP risk, and order velocity to keep the marketplace safe.
							</Typography>
						</Paper>

						{/* Preview Section - Step 10 */}
						<Paper 
							className="p-0" 
							id="preview"
							sx={{
								borderRadius: '16px',
								border: '1px solid #e5e7eb',
								boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
								overflow: 'hidden',
							}}
						>
							<div className="flex gap-2 items-center p-3 border-b border-gray-200">
								<Typography variant="h6" className="font-semibold flex-1 text-gray-900" sx={{ fontSize: '16px', fontWeight: 600 }}>
									Preview
								</Typography>
								<Button 
									variant={previewMode === 'desktop' ? 'contained' : 'outlined'}
									size="small"
									onClick={() => setPreviewMode('desktop')}
									sx={{
										borderColor: '#e5e7eb',
										color: previewMode === 'desktop' ? '#fff' : '#374151',
										backgroundColor: previewMode === 'desktop' ? '#ff6536' : 'transparent',
										textTransform: 'none',
										fontSize: '12px',
										padding: '4px 12px',
										borderRadius: '8px',
										minHeight: '36px',
										'&:hover': {
											backgroundColor: previewMode === 'desktop' ? '#e55a2b' : '#f9fafb',
										},
									}}
								>
									Desktop
								</Button>
								<Button 
									variant={previewMode === 'mobile' ? 'contained' : 'outlined'}
									size="small"
									onClick={() => setPreviewMode('mobile')}
									sx={{
										borderColor: '#e5e7eb',
										color: previewMode === 'mobile' ? '#fff' : '#374151',
										backgroundColor: previewMode === 'mobile' ? '#ff6536' : 'transparent',
										textTransform: 'none',
										fontSize: '12px',
										padding: '4px 12px',
										borderRadius: '8px',
										minHeight: '36px',
										'&:hover': {
											backgroundColor: previewMode === 'mobile' ? '#e55a2b' : '#f9fafb',
										},
									}}
								>
									Mobile
								</Button>
							</div>
							<div className="p-4">
								<div className={`grid gap-4 ${previewMode === 'mobile' ? 'grid-cols-1' : 'grid-cols-[1.1fr_0.9fr]'}`}>
									<div 
										className="h-[360px] rounded-xl overflow-hidden relative bg-gray-100"
										style={{
											borderRadius: '14px',
										}}
									>
										{galleryImages.length > 0 ? (
											<>
												{/* Main Featured Image - show featured image or first image */}
												<img
													src={(galleryImages.find(img => img.is_featured) || galleryImages[0])?.url}
													alt={productTitle || 'Product'}
													className="w-full h-full object-contain"
													style={{
														objectFit: 'contain',
													}}
												/>
												{/* Image Counter Badge */}
												{galleryImages.length > 1 && (
													<div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded-md text-xs font-semibold">
														{galleryImages.length} images
													</div>
												)}
												{/* Thumbnail Navigation */}
												{galleryImages.length > 1 && (
													<div className="absolute bottom-2 left-2 right-2 flex gap-2 overflow-x-auto pb-1">
														{galleryImages.slice(0, 5).map((img, idx) => {
															const isFeatured = img.is_featured || (idx === 0 && !galleryImages.some(i => i.is_featured));
															return (
																<div
																	key={idx}
																	className="flex-shrink-0 w-12 h-12 rounded border-2 border-white overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
																	style={{
																		borderColor: isFeatured ? '#ff6536' : 'white',
																	}}
																	onClick={() => {
																		// Switch featured image
																		const updated = galleryImages.map((img, i) => ({
																			...img,
																			is_featured: i === idx,
																		}));
																		setValue('gallery_images', updated, { shouldDirty: true });
																	}}
																>
																	<img
																		src={img.url}
																		alt={`Thumbnail ${idx + 1}`}
																		className="w-full h-full object-cover"
																	/>
																</div>
															);
														})}
														{galleryImages.length > 5 && (
															<div className="flex-shrink-0 w-12 h-12 rounded border-2 border-white bg-black bg-opacity-60 flex items-center justify-center text-white text-xs font-semibold">
																+{galleryImages.length - 5}
															</div>
														)}
													</div>
												)}
											</>
										) : (
											<div 
												className="h-full w-full flex items-center justify-center text-gray-400"
												style={{
													background: 'linear-gradient(135deg, #ff7a52, #ff4f1e)',
												}}
											>
												<Typography variant="h6" sx={{ fontSize: '18px', fontWeight: 900, color: 'white' }}>
													PRODUCT IMAGES
												</Typography>
											</div>
										)}
									</div>
									<div>
										<Typography variant="h5" className="font-bold mb-2" sx={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px' }}>
											{productTitle || 'Product Name'}
										</Typography>
										<div className="flex flex-wrap gap-2 items-center mb-2">
											{/* QC-Verified badge - show if condition is set */}
											{(condition && condition !== 'New') && (
												<Chip 
													label="QC‑Verified" 
													size="small"
													sx={{
														backgroundColor: '#f3f4f6',
														border: '1px solid #e5e7eb',
														fontSize: '11px',
														height: '24px',
														fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
													}}
												/>
											)}
											{/* AccessoryShield badge - show if offer is enabled */}
											{offers.accessoryShield && (
												<Chip 
													label="AccessoryShield" 
													size="small"
													sx={{
														backgroundColor: '#f3f4f6',
														border: '1px solid #e5e7eb',
														fontSize: '11px',
														height: '24px',
														fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
													}}
												/>
											)}
											{/* Same-day delivery badge - show if stock > 0 and delivery slots set */}
											{(stock > 0 || variants.some(v => parseInt(v.stock) > 0)) && deliverySlots && (
												<Chip 
													label={`Ready ~${readyInMinutes}m`} 
													size="small"
													sx={{
														backgroundColor: '#f3f4f6',
														border: '1px solid #e5e7eb',
														fontSize: '11px',
														height: '24px',
														fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
													}}
												/>
											)}
											{/* Setup at Doorstep badge */}
											{offers.setupAtDoorstep && (
												<Chip 
													label="Setup at Doorstep" 
													size="small"
													sx={{
														backgroundColor: '#f3f4f6',
														border: '1px solid #e5e7eb',
														fontSize: '11px',
														height: '24px',
														fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
													}}
												/>
											)}
											{/* Price Drop Protection badge */}
											{offers.priceDropProtection && (
												<Chip 
													label="Price Drop Protection" 
													size="small"
													sx={{
														backgroundColor: '#f3f4f6',
														border: '1px solid #e5e7eb',
														fontSize: '11px',
														height: '24px',
														fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
													}}
												/>
											)}
										</div>
										<div className="flex gap-2 items-center mb-2">
											<div className="flex items-center border border-gray-300 rounded-xl px-3 py-2" style={{ maxWidth: '220px', borderRadius: '12px' }}>
												<span className="mr-1" style={{ fontSize: '16px', fontWeight: 700 }}>£</span>
												<input 
													type="text" 
													value={variants.length > 0 && variants[0].price 
														? variants[0].price 
														: priceTaxExcl || '0'} 
													readOnly
													style={{ 
														border: 'none', 
														outline: 'none', 
														width: '100%',
														fontSize: '16px',
														fontWeight: 700,
														color: '#111827',
													}}
												/>
											</div>
											<Button 
												variant="contained"
												disabled={(stock === 0 && variants.length === 0) || (variants.length > 0 && !variants.some(v => parseInt(v.stock) > 0))}
												sx={{
													backgroundColor: '#ff6536',
													'&:hover': { backgroundColor: '#e55a2b' },
													'&:disabled': {
														backgroundColor: '#d1d5db',
														color: '#9ca3af',
													},
													textTransform: 'none',
													borderRadius: '10px',
													fontSize: '13px',
													padding: '8px 16px',
												}}
											>
												Add to cart
											</Button>
										</div>
										{/* Show variant selection if variants exist */}
										{variants.length > 0 && (
											<div className="mb-2">
												<Typography variant="caption" sx={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
													Variants:
												</Typography>
												<div className="flex flex-wrap gap-1">
													{variants.slice(0, 3).map((variant, idx) => (
														<Chip
															key={idx}
															label={`${variant.storage} ${variant.color}`}
															size="small"
															sx={{
																backgroundColor: '#f3f4f6',
																border: '1px solid #e5e7eb',
																fontSize: '10px',
																height: '20px',
															}}
														/>
													))}
													{variants.length > 3 && (
														<Chip
															label={`+${variants.length - 3} more`}
															size="small"
															sx={{
																backgroundColor: '#f3f4f6',
																border: '1px solid #e5e7eb',
																fontSize: '10px',
																height: '20px',
															}}
														/>
													)}
												</div>
											</div>
										)}
										<Typography variant="caption" className="text-gray-500" sx={{ fontSize: '12px', color: '#6b7280' }}>
											Preview is read‑only on live; fields here mirror your inputs.
										</Typography>
									</div>
								</div>
							</div>
						</Paper>
					</div>
				</main>

				{/* Right Sidebar - Listing Score & Actions */}
				<aside className="w-[320px] bg-white border-l border-gray-200 overflow-y-auto flex-shrink-0 sticky top-[52px]" style={{ alignSelf: 'start' }}>
					<div className="p-4 space-y-4">
						{/* Listing Score */}
						<div>
							<div className="flex items-center justify-between mb-2">
								<Typography variant="h6" className="font-semibold text-gray-900" sx={{ fontSize: '16px', fontWeight: 600 }}>
									Listing Score
								</Typography>
								<Chip 
									label={listingScore} 
									sx={{
										backgroundColor: '#10b981',
										color: '#fff',
										fontSize: '14px',
										fontWeight: 700,
										height: '28px',
										borderRadius: '999px',
									}}
								/>
							</div>
							<LinearProgress
								variant="determinate"
								value={listingScore}
								sx={{
									height: 10,
									borderRadius: '999px',
									backgroundColor: '#eef0f4',
									'& .MuiLinearProgress-bar': {
										background: listingScore >= 80 
											? 'linear-gradient(90deg, #22c55e, #f59e0b)' 
											: listingScore >= 60 
											? 'linear-gradient(90deg, #f59e0b, #ef4444)' 
											: '#ef4444',
										borderRadius: '999px',
									},
								}}
							/>
						</div>

						{/* Missing Fields Alert */}
						{missingFields.length > 0 && (
							<div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
								<Typography variant="subtitle2" className="font-semibold mb-2 text-red-900" sx={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
									⚠️ Missing Required Fields ({missingFields.length})
								</Typography>
								<div className="space-y-1 max-h-[200px] overflow-y-auto">
									{missingFields.map((item, idx) => (
										<div 
											key={idx} 
											className="text-xs text-red-700 cursor-pointer hover:text-red-900 hover:underline"
											onClick={() => {
												setCurrentStep(item.step);
												handleStepClick(item.step);
											}}
										>
											• {item.field}
											<span className="text-red-500 ml-1">({item.section})</span>
										</div>
									))}
								</div>
							</div>
						)}

						{/* Checklist */}
						<div>
							<Typography variant="subtitle2" className="font-semibold mb-3 text-gray-900" sx={{ fontSize: '14px', fontWeight: 600, marginBottom: '10px' }}>
								Checklist
							</Typography>
							<div className="space-y-2">
								{checklistItems.map((item) => (
									<Box
										key={item.id}
										sx={{
											display: 'flex',
											alignItems: 'flex-start',
											gap: '10px',
											border: '1px solid #e5e7eb',
											borderRadius: '12px',
											padding: '10px',
											backgroundColor: item.completed ? '#ecfdf5' : '#fef2f2',
										}}
									>
										{item.completed ? (
											<CheckCircleIcon sx={{ color: '#10b981', fontSize: '20px', marginTop: '2px', flexShrink: 0 }} />
										) : (
											<CancelIcon sx={{ color: '#ef4444', fontSize: '20px', marginTop: '2px', flexShrink: 0 }} />
										)}
										<Typography
											variant="body2"
											sx={{
												fontSize: '13px',
												color: item.completed ? '#374151' : '#991b1b',
												flex: 1,
												lineHeight: 1.5,
											}}
										>
											{item.text}
										</Typography>
									</Box>
								))}
							</div>
						</div>

						{/* Actions */}
						<div className="space-y-2">
							<Button
								variant="contained"
								fullWidth
								sx={{
									backgroundColor: '#ff6536',
									color: '#fff',
									textTransform: 'none',
									fontSize: '13px',
									padding: '10px 16px',
									fontWeight: 600,
									borderRadius: '12px',
									minHeight: '44px',
									'&:hover': { backgroundColor: '#e55a2b' },
								}}
								onClick={handleRunValidation}
							>
								Run validation
							</Button>
							<Button 
								variant="outlined" 
								fullWidth
								onClick={() => handlePublishClick()}
								sx={{
									borderColor: '#e5e7eb',
									color: '#374151',
									textTransform: 'none',
									fontSize: '13px',
									padding: '10px 16px',
									borderRadius: '12px',
									minHeight: '44px',
									'&:hover': {
										borderColor: '#d1d5db',
										backgroundColor: '#f9fafb',
									},
								}}
							>
								Save draft
							</Button>
							<Button 
								variant="outlined" 
								fullWidth
								sx={{
									borderColor: '#e5e7eb',
									color: '#374151',
									textTransform: 'none',
									fontSize: '13px',
									padding: '10px 16px',
									borderRadius: '12px',
									minHeight: '44px',
									'&:hover': {
										borderColor: '#d1d5db',
										backgroundColor: '#f9fafb',
									},
								}}
							>
								Preview
							</Button>
							<Button
								variant="contained"
								fullWidth
								sx={{
									backgroundColor: '#ff6536',
									color: '#fff',
									textTransform: 'none',
									fontSize: '13px',
									padding: '10px 16px',
									fontWeight: 600,
									borderRadius: '12px',
									minHeight: '44px',
									'&:hover': { backgroundColor: '#e55a2b' },
								}}
								onClick={handlePublishClick}
							>
								Publish
							</Button>
						</div>
					</div>
				</aside>
			</div>

			{/* Bottom Bar */}
			<div className="bg-white border-t border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0" style={{ backdropFilter: 'blur(8px)', backgroundColor: '#ffffffeb' }}>
				<div className="flex items-center space-x-2">
					{mpidMatched && (
						<Chip 
							label="MPID matched" 
							size="small"
							sx={{
								backgroundColor: '#f3f4f6',
								border: '1px solid #e5e7eb',
								fontSize: '12px',
								height: '24px',
								fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
								color: '#374151',
								padding: '2px 8px',
							}}
						/>
					)}
					{storePostcode && (
						<Chip 
							label="Same‑day enabled" 
							size="small"
							sx={{
								backgroundColor: '#f3f4f6',
								border: '1px solid #e5e7eb',
								fontSize: '12px',
								height: '24px',
								fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
								color: '#374151',
								padding: '2px 8px',
							}}
						/>
					)}
				</div>
				<div className="flex items-center space-x-2">
					<Button 
						variant="outlined" 
						size="small"
						onClick={() => handlePublishClick()}
						sx={{
							borderColor: '#e5e7eb',
							color: '#374151',
							textTransform: 'none',
							fontSize: '12px',
							padding: '6px 14px',
							borderRadius: '10px',
							minHeight: '36px',
							'&:hover': {
								borderColor: '#d1d5db',
								backgroundColor: '#f9fafb',
							},
						}}
					>
						Save draft
					</Button>
					<Button 
						variant="outlined" 
						size="small"
						sx={{
							borderColor: '#e5e7eb',
							color: '#374151',
							textTransform: 'none',
							fontSize: '12px',
							padding: '6px 14px',
							borderRadius: '10px',
							minHeight: '36px',
							'&:hover': {
								borderColor: '#d1d5db',
								backgroundColor: '#f9fafb',
							},
						}}
					>
						Preview
					</Button>
					<Button
						variant="contained"
						size="small"
						sx={{
							backgroundColor: '#ff6536',
							color: '#fff',
							textTransform: 'none',
							fontSize: '12px',
							padding: '6px 16px',
							fontWeight: 600,
							borderRadius: '10px',
							minHeight: '36px',
							'&:hover': { backgroundColor: '#e55a2b' },
						}}
						onClick={handlePublishClick}
					>
						Publish
					</Button>
				</div>
			</div>

			{/* Barcode Scanner Dialog */}
			<Dialog open={barcodeDialogOpen} onClose={() => setBarcodeDialogOpen(false)} maxWidth="sm" fullWidth>
				<DialogTitle>Scan Barcode</DialogTitle>
				<DialogContent>
					<TextField
						autoFocus
						fullWidth
						label="Enter Barcode / GTIN / EAN / UPC"
						placeholder="e.g., 1234567890123"
						value={barcodeInput}
						onChange={(e) => setBarcodeInput(e.target.value)}
						onKeyPress={(e) => {
							if (e.key === 'Enter') {
								handleBarcodeSubmit();
							}
						}}
						sx={{ marginTop: 2 }}
					/>
					<Typography variant="caption" sx={{ display: 'block', marginTop: 2, color: '#6b7280' }}>
						Enter the barcode manually or use your device camera to scan
					</Typography>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setBarcodeDialogOpen(false)}>Cancel</Button>
					<Button onClick={handleBarcodeSubmit} variant="contained" disabled={!barcodeInput.trim()}>
						Search
					</Button>
				</DialogActions>
			</Dialog>

			{/* Master Template Dialog */}
			<Dialog open={masterTemplateDialogOpen} onClose={() => setMasterTemplateDialogOpen(false)} maxWidth="md" fullWidth>
				<DialogTitle>Select Master Template</DialogTitle>
				<DialogContent>
					<TextField
						fullWidth
						label="Search templates"
						placeholder="Search by name, brand, or model..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						sx={{ marginBottom: 2 }}
					/>
					{loadingPastProducts ? (
						<Box display="flex" justifyContent="center" p={3}>
							<CircularProgress />
						</Box>
					) : (
						<List>
							{pastProducts
								.filter((p: any) => !searchQuery || p.name?.toLowerCase().includes(searchQuery.toLowerCase()))
								.slice(0, 10)
								.map((product: any) => (
									<ListItem key={product.id} disablePadding>
										<ListItemButton onClick={() => handleSelectMasterTemplate(product)}>
											<ListItemText
												primary={product.name}
												secondary={`SKU: ${product.sku || 'N/A'} | Price: £${product.price_tax_excl || 0}`}
											/>
										</ListItemButton>
									</ListItem>
								))}
							{pastProducts.length === 0 && (
								<Typography variant="body2" sx={{ padding: 2, color: '#6b7280', textAlign: 'center' }}>
									No master templates available
								</Typography>
							)}
						</List>
					)}
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setMasterTemplateDialogOpen(false)}>Cancel</Button>
				</DialogActions>
			</Dialog>

			{/* Past Listings Dialog */}
			<Dialog open={pastListingsDialogOpen} onClose={() => setPastListingsDialogOpen(false)} maxWidth="md" fullWidth>
				<DialogTitle>Select from Your Past Listings</DialogTitle>
				<DialogContent>
					<TextField
						fullWidth
						label="Search your listings"
						placeholder="Search by name, SKU..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						sx={{ marginBottom: 2 }}
					/>
					{loadingPastProducts ? (
						<Box display="flex" justifyContent="center" p={3}>
							<CircularProgress />
						</Box>
					) : (
						<List>
							{pastProducts
								.filter((p: any) => !searchQuery || p.name?.toLowerCase().includes(searchQuery.toLowerCase()))
								.slice(0, 20)
								.map((product: any) => (
									<ListItem key={product.id} disablePadding>
										<ListItemButton onClick={() => handleSelectPastListing(product)}>
											<ListItemText
												primary={product.name}
												secondary={`SKU: ${product.sku || 'N/A'} | Price: £${product.price_tax_excl || 0}`}
											/>
										</ListItemButton>
									</ListItem>
								))}
							{pastProducts.length === 0 && (
								<Typography variant="body2" sx={{ padding: 2, color: '#6b7280', textAlign: 'center' }}>
									No past listings found
								</Typography>
							)}
						</List>
					)}
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setPastListingsDialogOpen(false)}>Cancel</Button>
				</DialogActions>
			</Dialog>

			{/* Import from Other Vendor Dialog */}
			<Dialog open={importVendorDialogOpen} onClose={() => setImportVendorDialogOpen(false)} maxWidth="md" fullWidth>
				<DialogTitle>Import from Other Vendor</DialogTitle>
				<DialogContent>
					<TextField
						fullWidth
						label="Search vendor products"
						placeholder="Search by name, brand, SKU..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						sx={{ marginBottom: 2 }}
					/>
					{loadingOtherVendors ? (
						<Box display="flex" justifyContent="center" p={3}>
							<CircularProgress />
						</Box>
					) : (
						<List>
							{otherVendorsProducts
								.filter((p: any) => !searchQuery || p.name?.toLowerCase().includes(searchQuery.toLowerCase()))
								.slice(0, 20)
								.map((product: any) => (
									<ListItem key={product.id} disablePadding>
										<ListItemButton onClick={() => handleSelectVendorProduct(product)}>
											<ListItemText
												primary={product.name}
												secondary={`SKU: ${product.sku || 'N/A'} | Price: £${product.price_tax_excl || 0}`}
											/>
										</ListItemButton>
									</ListItem>
								))}
							{otherVendorsProducts.length === 0 && (
								<Typography variant="body2" sx={{ padding: 2, color: '#6b7280', textAlign: 'center' }}>
									No vendor products available
								</Typography>
							)}
						</List>
					)}
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setImportVendorDialogOpen(false)}>Cancel</Button>
				</DialogActions>
			</Dialog>

			{/* Add Storage Dialog */}
			<Dialog open={addStorageDialogOpen} onClose={() => { setAddStorageDialogOpen(false); setNewStorageInput(''); }} PaperProps={{ sx: { borderRadius: '16px' } }} maxWidth="sm" fullWidth>
				<DialogTitle>Add Storage Option</DialogTitle>
				<DialogContent>
					<TextField
						autoFocus
						fullWidth
						label="Storage (e.g., 256GB, 512GB)"
						placeholder="Enter storage option"
						value={newStorageInput}
						onChange={(e) => setNewStorageInput(e.target.value)}
						onKeyPress={(e) => {
							if (e.key === 'Enter' && newStorageInput.trim()) {
								handleConfirmAddStorage();
							}
						}}
						sx={{ marginTop: 2 }}
					/>
					{storageOptions.length > 0 && (
						<Box sx={{ marginTop: 2 }}>
							<Typography variant="caption" sx={{ color: '#6b7280', display: 'block', marginBottom: 1 }}>
								Current options:
							</Typography>
							<div className="flex flex-wrap gap-1">
								{storageOptions.map((storage, idx) => (
									<Chip key={idx} label={storage} size="small" sx={{ fontSize: '11px' }} />
								))}
							</div>
						</Box>
					)}
				</DialogContent>
				<DialogActions>
					<Button onClick={() => { setAddStorageDialogOpen(false); setNewStorageInput(''); }}>Cancel</Button>
					<Button onClick={handleConfirmAddStorage} variant="contained" disabled={!newStorageInput.trim() || storageOptions.includes(newStorageInput.trim())}>
						Add
					</Button>
				</DialogActions>
			</Dialog>

			{/* Add Color Dialog */}
			<Dialog open={addColorDialogOpen} onClose={() => { setAddColorDialogOpen(false); setNewColorInput(''); }} PaperProps={{ sx: { borderRadius: '16px' } }} maxWidth="sm" fullWidth>
				<DialogTitle>Add Color Option</DialogTitle>
				<DialogContent>
					<TextField
						autoFocus
						fullWidth
						label="Color (e.g., Blue, Black, White)"
						placeholder="Enter color option"
						value={newColorInput}
						onChange={(e) => setNewColorInput(e.target.value)}
						onKeyPress={(e) => {
							if (e.key === 'Enter' && newColorInput.trim()) {
								handleConfirmAddColor();
							}
						}}
						sx={{ marginTop: 2 }}
					/>
					{colorOptions.length > 0 && (
						<Box sx={{ marginTop: 2 }}>
							<Typography variant="caption" sx={{ color: '#6b7280', display: 'block', marginBottom: 1 }}>
								Current options:
							</Typography>
							<div className="flex flex-wrap gap-1">
								{colorOptions.map((color, idx) => (
									<Chip key={idx} label={color} size="small" sx={{ fontSize: '11px' }} />
								))}
							</div>
						</Box>
					)}
				</DialogContent>
				<DialogActions>
					<Button onClick={() => { setAddColorDialogOpen(false); setNewColorInput(''); }}>Cancel</Button>
					<Button onClick={handleConfirmAddColor} variant="contained" disabled={!newColorInput.trim() || colorOptions.includes(newColorInput.trim())}>
						Add
					</Button>
				</DialogActions>
			</Dialog>

			{/* Apply Price to All Dialog */}
			<Dialog open={applyPriceDialogOpen} onClose={() => { setApplyPriceDialogOpen(false); setPriceToApply(''); }} PaperProps={{ sx: { borderRadius: '16px' } }} maxWidth="sm" fullWidth>
				<DialogTitle>Apply Price to All Variants</DialogTitle>
				<DialogContent>
					<TextField
						autoFocus
						fullWidth
						type="number"
						label="Price (£)"
						placeholder="Enter price"
						value={priceToApply}
						onChange={(e) => setPriceToApply(e.target.value)}
						onKeyPress={(e) => {
							if (e.key === 'Enter' && priceToApply && !isNaN(parseFloat(priceToApply))) {
								handleConfirmApplyPrice();
							}
						}}
						InputProps={{
							startAdornment: <InputAdornment position="start">£</InputAdornment>,
						}}
						sx={{ marginTop: 2 }}
					/>
					<Typography variant="caption" sx={{ display: 'block', marginTop: 2, color: '#6b7280' }}>
						This will apply the same price to all {variants.length} variant{variants.length !== 1 ? 's' : ''}.
					</Typography>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => { setApplyPriceDialogOpen(false); setPriceToApply(''); }}>Cancel</Button>
					<Button onClick={handleConfirmApplyPrice} variant="contained" disabled={!priceToApply || isNaN(parseFloat(priceToApply))}>
						Apply
					</Button>
				</DialogActions>
			</Dialog>

			{/* Apply Stock to All Dialog */}
			<Dialog open={applyStockDialogOpen} onClose={() => { setApplyStockDialogOpen(false); setStockToApply(''); }} PaperProps={{ sx: { borderRadius: '16px' } }} maxWidth="sm" fullWidth>
				<DialogTitle>Apply Stock to All Variants</DialogTitle>
				<DialogContent>
					<TextField
						autoFocus
						fullWidth
						type="number"
						label="Stock Quantity"
						placeholder="Enter stock quantity"
						value={stockToApply}
						onChange={(e) => setStockToApply(e.target.value)}
						onKeyPress={(e) => {
							if (e.key === 'Enter' && stockToApply && !isNaN(parseInt(stockToApply))) {
								handleConfirmApplyStock();
							}
						}}
						sx={{ marginTop: 2 }}
					/>
					<Typography variant="caption" sx={{ display: 'block', marginTop: 2, color: '#6b7280' }}>
						This will apply the same stock quantity to all {variants.length} variant{variants.length !== 1 ? 's' : ''}.
					</Typography>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => { setApplyStockDialogOpen(false); setStockToApply(''); }}>Cancel</Button>
					<Button onClick={handleConfirmApplyStock} variant="contained" disabled={!stockToApply || isNaN(parseInt(stockToApply))}>
						Apply
					</Button>
				</DialogActions>
			</Dialog>

			{/* Image Processing Dialog */}
			<Dialog 
				open={imageProcessingDialogOpen} 
				onClose={() => {}} 
				PaperProps={{ sx: { borderRadius: '16px' } }} 
				maxWidth="sm" 
				fullWidth
			>
				<DialogContent sx={{ textAlign: 'center', padding: 3 }}>
					{processingImageIndex !== null && (
						<>
							<CircularProgress sx={{ marginBottom: 2 }} />
							<Typography variant="body1" sx={{ fontSize: '14px', color: '#374151' }}>
								{imageProcessingMessage}
							</Typography>
						</>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}

export default MultiKonnectListingCreation;

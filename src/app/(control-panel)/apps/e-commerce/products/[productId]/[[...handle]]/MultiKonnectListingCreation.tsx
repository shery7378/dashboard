'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import useNavigate from '@fuse/hooks/useNavigate';
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
import ImportProductModal from '../../ImportProductModal';
import Autocomplete from '@mui/material/Autocomplete';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Chip from '@mui/material/Chip';
import { useGetECommerceCategoriesQuery } from '../../../apis/CategoriesLaravelApi';
import { useGetECommerceProductsQuery, useGetOtherVendorsProductsQuery } from '../../../apis/ProductsLaravelApi';
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
import Divider from '@mui/material/Divider';
import { useSnackbar } from 'notistack';

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
	const { watch, setValue, control, formState, trigger } = useFormContext();
	const { errors } = formState;
	const { productId } = useParams<{ productId: string }>();
	const { data: session } = useSession();
	const navigate = useNavigate();
	const { enqueueSnackbar } = useSnackbar();
	
	const [currentStep, setCurrentStep] = useState(1);
	const [mpidSearch, setMpidSearch] = useState('');
	const [mpidMatched, setMpidMatched] = useState(false);
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
	const [matchedProduct, setMatchedProduct] = useState<any>(null);
	const [variants, setVariants] = useState<Variant[]>([]);
	const [storageOptions, setStorageOptions] = useState<string[]>([]);
	const [colorOptions, setColorOptions] = useState<string[]>([]);
	// Dynamic attribute names - can be customized for different product types
	const [attribute1Name, setAttribute1Name] = useState<string>('Storage');
	const [attribute2Name, setAttribute2Name] = useState<string>('Color');
	const [showAttributeNameDialog, setShowAttributeNameDialog] = useState(false);
	const [editingAttribute, setEditingAttribute] = useState<'attribute1' | 'attribute2' | null>(null);
	const [newAttributeName, setNewAttributeName] = useState('');
	const [feeSettingsDialogOpen, setFeeSettingsDialogOpen] = useState(false);
	const [tempFeeSettings, setTempFeeSettings] = useState({
		commissionRate: 0.025,
		promoFee: 0,
	});
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
	const [isUploadingImage, setIsUploadingImage] = useState(false);
	const [isUploadingColorImage, setIsUploadingColorImage] = useState(false);
	const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
	const [colorImages, setColorImages] = useState<Record<string, string>>({}); // Map color name to image URL
	const [selectedColorForImage, setSelectedColorForImage] = useState<string | null>(null);
	const [colorImageDialogOpen, setColorImageDialogOpen] = useState(false);
	const [seoTone, setSeoTone] = useState<string>('Neutral');
	const sectionRefs = useRef<{ [key: number]: HTMLElement | null }>({});
	const observerRef = useRef<IntersectionObserver | null>(null);
	const prevProductTitleRef = useRef<string>('');
	const prevVariantsRef = useRef<string>('');
	const prevColorImagesRef = useRef<string>('');
	const prevSlugRef = useRef<string>('');
	const prevOffersRef = useRef<string>('');
	const hasInitializedRef = useRef(false);
	const prevProductVariantsRef = useRef<string>('');
	const prevExtraFieldsRef = useRef<string>('');

	// Watch form values - all fields are now reactive
	const productTitle = watch('name') || '';
	const slug = watch('slug') || '';
	const galleryImagesRaw = watch('gallery_images');
	// Ensure galleryImages is always an array - defensive programming
	// Use useMemo to ensure reactivity when gallery_images changes
	const galleryImages: any[] = useMemo(() => {
		console.log('galleryImages useMemo triggered, galleryImagesRaw:', galleryImagesRaw);
		if (!galleryImagesRaw) {
			console.log('galleryImagesRaw is falsy, returning empty array');
			return [];
		}
		if (!Array.isArray(galleryImagesRaw)) {
			console.log('galleryImagesRaw is not an array:', typeof galleryImagesRaw);
			return [];
		}
		const filtered = galleryImagesRaw.filter((img: any) => {
			const hasUrl = img && img.url && typeof img.url === 'string' && img.url.length > 0;
			if (!hasUrl) {
				console.log('Filtered out image:', img);
			}
			return hasUrl;
		});
		console.log('galleryImages computed:', filtered.length, 'images out of', galleryImagesRaw.length);
		if (filtered.length > 0) {
			console.log('First filtered image:', filtered[0]);
		}
		return filtered;
	}, [galleryImagesRaw]);
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
	// Vendor-set shipping charges
	const shippingChargeRegular = watch('shipping_charge_regular') || 0;
	const shippingChargeSameDay = watch('shipping_charge_same_day') || 0;
	const kycTier = watch('kyc_tier') || 'Tier 0 - Email verified';
	const safeSellingLimit = watch('safe_selling_limit') || '£5,000 / day';
	const payoutLock = watch('payout_lock') || '48h post-delivery';
	const productVariants = watch('product_variants') || [];
	const extraFields = watch('extraFields') || {};

	// Admin-configurable fee settings - per product, stored in extraFields
	// Note: Shipping charges are set by vendor, not admin
	// Get fees from extraFields (product-specific) or use defaults
	const getProductFees = useCallback(() => {
		if (extraFields?.commissionRate !== undefined || extraFields?.promoFee !== undefined) {
			return {
				commissionRate: extraFields.commissionRate ?? 0.025, // 2.5% default
				promoFee: extraFields.promoFee ?? 0,
			};
		}
		// Default fees if not set for this product
		return {
			commissionRate: 0.025, // 2.5% default
			promoFee: 0, // Promotional fee
		};
	}, [extraFields]);

	const [feeSettings, setFeeSettings] = useState(() => {
		// Initialize with defaults, will be updated when extraFields loads
		return {
			commissionRate: 0.025,
			promoFee: 0,
		};
	});

	// Update feeSettings when extraFields changes (product loads or fees are updated)
	useEffect(() => {
		const productFees = getProductFees();
		setFeeSettings(productFees);
		setTempFeeSettings(productFees);
	}, [getProductFees]);

	// Update tempFeeSettings when feeSettings changes
	useEffect(() => {
		setTempFeeSettings(feeSettings);
	}, [feeSettings]);

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
		
		// Get base price from multiple sources - prioritize the most current/relevant price
		// 1. Check variants state (local state, most up-to-date)
		// 2. Check product_variants from form (form state)
		// 3. Check main price_tax_excl (fallback)
		let basePrice = 0;
		
		// First, try to get price from local variants state
		const variantPrice = variants.find(v => {
			const price = parseFloat(v.price?.toString() || '0');
			return price > 0;
		});
		
		if (variantPrice && variantPrice.price) {
			basePrice = parseFloat(variantPrice.price.toString()) || 0;
		} else if (Array.isArray(productVariants) && productVariants.length > 0) {
			// Try form's product_variants
			const formVariantWithPrice = productVariants.find((v: any) => {
				const price = parseFloat(v.price_tax_excl?.toString() || '0');
				return price > 0;
			});
			if (formVariantWithPrice?.price_tax_excl) {
				basePrice = parseFloat(formVariantWithPrice.price_tax_excl.toString()) || 0;
			}
		}
		
		// Fallback to main price field
		if (basePrice <= 0 && priceTaxExcl) {
			basePrice = parseFloat(priceTaxExcl.toString()) || 0;
		}

		// Mock recent listings data (in production, fetch from API)
		// This simulates price data for similar products in the city
		// Optimized: reduced count and use deterministic variation to prevent blocking
		const generateMockPrices = (base: number, count: number = 20): number[] => {
			if (base <= 0) return [];
			const prices: number[] = [];
			// Use deterministic variation based on base price to avoid Math.random() blocking
			const seed = Math.floor(base) % 1000;
			for (let i = 0; i < count; i++) {
				// Generate prices within ±15% of base price using seeded variation
				const variation = ((seed + i) % 30 - 15) / 100; // -15% to +15%
				const price = base * (1 + variation);
				prices.push(Math.round(price * 100) / 100); // Round to 2 decimal places
			}
			return prices.sort((a, b) => a - b);
		};

		const recentPrices = basePrice > 0 
			? generateMockPrices(basePrice)
			: [];

		// Calculate percentiles
		const calculatePercentile = (arr: number[], percentile: number): number => {
			if (arr.length === 0) return 0;
			const index = Math.ceil((percentile / 100) * arr.length) - 1;
			return arr[Math.max(0, Math.min(index, arr.length - 1))];
		};

		const p25 = recentPrices.length > 0 ? calculatePercentile(recentPrices, 25) : 0;
		const p75 = recentPrices.length > 0 ? calculatePercentile(recentPrices, 75) : 0;
		const median = recentPrices.length > 0 ? calculatePercentile(recentPrices, 50) : 0;

		// Calculate fees using admin-configurable settings
		const commission = basePrice > 0 ? basePrice * feeSettings.commissionRate : 0;
		
		// Shipping charge: set by vendor/seller (not admin)
		const hasSameDay = variants.some(v => v.sameDay) || false;
		const shippingCharge = hasSameDay 
			? (parseFloat(shippingChargeSameDay.toString()) || 0)
			: (parseFloat(shippingChargeRegular.toString()) || 0);
		
		// Promotional fees (if any promotions are enabled) - admin set
		const promoFee = feeSettings.promoFee || 0;
		
		const totalFees = commission + shippingCharge + promoFee;
		const netPrice = basePrice > 0 ? basePrice - totalFees : 0;

		return {
			city,
			priceRange: { min: p25, max: p75 },
			median,
			fees: {
				commission: Math.round(commission * 100) / 100,
				shipping: shippingCharge,
				promos: promoFee,
				total: Math.round(totalFees * 100) / 100,
			},
			net: Math.round(netPrice * 100) / 100,
			basePrice,
		};
	}, [storePostcode, variants, priceTaxExcl, feeSettings, shippingChargeRegular, shippingChargeSameDay, productVariants]);

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
	
	// Fetch other vendors' products (excludes current vendor's products)
	const { data: otherVendorsData, isLoading: loadingOtherVendors } = useGetOtherVendorsProductsQuery({ 
		page: 1, 
		perPage: 50 
	});
	const otherVendorsProducts = otherVendorsData?.products?.data || otherVendorsData?.data || [];

	// Calculate listing score - fully dynamic
	const listingScore = useMemo(() => {
		let score = 0;
		const maxScore = 100;
		
		// Product Identity (20 points)
		if (productTitle && productTitle.length > 10) score += 10;
		if (mpidMatched) score += 10;
		
		// Media (25 points)
		if (Array.isArray(galleryImages)) {
			if (galleryImages.length >= 1) score += 10;
			if (galleryImages.length >= 4) score += 5;
			if (galleryImages.length >= 8) score += 10;
		}
		
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
		if (!Array.isArray(galleryImages) || galleryImages.length < 8) {
			items.push({
				id: 1,
				text: `Add at least 8 photos including box contents (${Array.isArray(galleryImages) ? galleryImages.length : 0}/8)`,
				completed: false,
			});
		} else {
			items.push({
				id: 1,
				text: 'Add at least 8 photos including box contents',
				completed: true,
			});
		}
		
		// Same-day configuration
		// Check if both store_postcode and delivery_slots are properly set
		const hasStorePostcode = storePostcode && storePostcode.trim().length > 0;
		const hasDeliverySlots = deliverySlots && deliverySlots.trim().length > 0 && deliverySlots !== '';
		
		console.log('Same-day slots validation:', {
			storePostcode,
			deliverySlots,
			hasStorePostcode,
			hasDeliverySlots,
			completed: hasStorePostcode && hasDeliverySlots
		});
		
		if (!hasStorePostcode || !hasDeliverySlots) {
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

	// Calculate step completion status dynamically
	const getStepCompletion = useCallback((stepId: number): boolean => {
		switch (stepId) {
			case 1: // Identity
				return !!(productTitle && productTitle.length >= 5 && watch('main_category'));
			case 2: // Media
				return Array.isArray(galleryImages) && galleryImages.length >= 6;
			case 3: // Variants
				return variants.length > 0 && variants.every(v => v.price && v.stock);
			case 4: // Pricing & intel
				return !!(priceTaxExcl || variants.some(v => v.price));
			case 5: // Same-day & stores
				const hasStorePostcode = storePostcode && storePostcode.trim().length > 0;
				const hasDeliverySlots = deliverySlots && deliverySlots.trim().length > 0 && deliverySlots !== '';
				console.log('Step 5 completion check:', { storePostcode, deliverySlots, hasStorePostcode, hasDeliverySlots });
				return !!(hasStorePostcode && hasDeliverySlots);
			case 6: // Copy & SEO
				return !!(seoTitle && description && description.length >= 50);
			case 7: // QC & policies
				return !!(condition && returns);
			case 8: // Offers
				return true; // Optional step
			case 9: // Trust & Compliance
				return !!(kycTier && safeSellingLimit);
			case 10: // Preview & checks
				return true; // Always accessible
			default:
				return false;
		}
	}, [productTitle, galleryImages.length, variants, priceTaxExcl, storePostcode, deliverySlots, seoTitle, description, condition, returns, kycTier, safeSellingLimit, watch]);

	const steps: ListingStep[] = useMemo(() => [
		{ id: 1, title: 'Identity', description: 'MPID, title', completed: getStepCompletion(1) },
		{ id: 2, title: 'Media', description: 'upload, BG remove', completed: getStepCompletion(2) },
		{ id: 3, title: 'Variants', description: 'matrix, per-variant photos', completed: getStepCompletion(3) },
		{ id: 4, title: 'Pricing & intel', description: 'range, fees', completed: getStepCompletion(4) },
		{ id: 5, title: 'Same-day & stores', description: 'radius, slots', completed: getStepCompletion(5) },
		{ id: 6, title: 'Copy & SEO', description: 'AI title/bullets', completed: getStepCompletion(6) },
		{ id: 7, title: 'QC & policies', description: 'IMEI, returns', completed: getStepCompletion(7) },
		{ id: 8, title: 'Offers', description: 'Shield, concierge', completed: getStepCompletion(8) },
		{ id: 9, title: 'Trust & Compliance', description: 'KYC, fraud checks', completed: getStepCompletion(9) },
		{ id: 10, title: 'Preview & checks', description: 'score, validate', completed: getStepCompletion(10) },
	], [getStepCompletion]);

	// Initialize from existing product data - fixed to prevent re-running
	// Split into two useEffects: one for variants (runs once), one for extraFields (runs once)
	useEffect(() => {
		if (hasInitializedRef.current || isInitialized) return;
		if (!productVariants || productVariants.length === 0) return;
		
		// Create a key to compare
		const productVariantsKey = JSON.stringify(productVariants);
		
		// Only process if data has actually changed and hasn't been processed yet
		if (productVariantsKey === prevProductVariantsRef.current) return;
		
		prevProductVariantsRef.current = productVariantsKey;
		
		// Load existing variants and extract storage/color options
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
		
		hasInitializedRef.current = true;
		setIsInitialized(true);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [productVariants]); // Only watch productVariants, not extraFields
	
	// Initialize offers from extraFields - separate useEffect to avoid loops
	useEffect(() => {
		if (hasInitializedRef.current && isInitialized) {
			// Only load offers once after initialization
			if (prevExtraFieldsRef.current !== '') return; // Already processed
			
			const extraFieldsKey = JSON.stringify(extraFields || {});
			if (extraFieldsKey === '{}') return; // No data to process
			
			prevExtraFieldsRef.current = extraFieldsKey;
			
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
			if (extraFields?.mpidMatched) {
				setMpidMatched(true);
				setMatchedProduct(extraFields.matchedProduct || null);
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isInitialized]); // Only run when isInitialized becomes true

	// Auto-generate slug from title - fixed infinite loop by removing setValue from dependencies
	useEffect(() => {
		if (productTitle && !slug && productTitle !== prevProductTitleRef.current) {
			prevProductTitleRef.current = productTitle;
			const autoSlug = slugify(productTitle);
			setValue('slug', autoSlug, { shouldDirty: false });
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [productTitle, slug]); // Removed setValue to prevent infinite loop

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

	// Image upload handler - optimized to prevent multiple calls and fix stale closure
	const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const files = event.target.files;
		
		console.log('handleImageUpload called, files:', files, 'files.length:', files?.length);
		
		if (!files || files.length === 0) {
			console.log('No files selected');
			return;
		}
		
		// Prevent multiple simultaneous uploads
		if (isUploadingImage) {
			console.log('Already uploading, ignoring');
			event.target.value = '';
			return;
		}
		
		setIsUploadingImage(true);
		
		// Store files array before resetting input
		const filesArray = Array.from(files);
		console.log('Files array:', filesArray.length, 'files');
		
		// Reset input to allow same file to be selected again (after storing files)
		event.target.value = '';
		
		try {
			// Get current gallery images from form to avoid stale closure
			const currentGalleryImagesRaw = watch('gallery_images');
			// Ensure it's always an array
			const currentGalleryImages = Array.isArray(currentGalleryImagesRaw) ? currentGalleryImagesRaw : [];
			const isFirstImage = currentGalleryImages.length === 0;
			
			console.log('Current gallery images:', currentGalleryImages.length);
			
			const imagePromises = filesArray.map((file, index) => {
				console.log(`Processing file ${index + 1}/${filesArray.length}:`, file.name, 'Type:', file.type, 'Size:', file.size);
				
				return new Promise<{ url: string; is_featured: boolean }>((resolve, reject) => {
					// Validate file type
					if (!file.type.startsWith('image/')) {
						console.error(`File ${file.name} is not an image, type: ${file.type}`);
						reject(new Error(`File ${file.name} is not an image`));
						return;
					}
					
					// Validate file size (max 10MB)
					if (file.size > 10 * 1024 * 1024) {
						console.error(`File ${file.name} is too large: ${file.size} bytes`);
						reject(new Error(`File ${file.name} is too large (max 10MB)`));
						return;
					}
					
					const reader = new FileReader();
					reader.onload = () => {
						const result = reader.result;
						if (!result || typeof result !== 'string') {
							console.error('FileReader result is not a string:', typeof result);
							reject(new Error('Failed to read image file'));
							return;
						}
						
						console.log(`File ${file.name} read successfully, data URL length:`, result.length);
						
						const base64Image = {
							url: result, // readAsDataURL already returns data URL
							is_featured: isFirstImage && index === 0, // Only first image of first batch is featured
						};
						resolve(base64Image);
					};
					reader.onerror = (error) => {
						console.error(`FileReader error for ${file.name}:`, error);
						reject(new Error(`Failed to read file: ${file.name}`));
					};
					reader.readAsDataURL(file);
				});
			});

			const results = await Promise.allSettled(imagePromises);
			
			// Filter successful results
			const newImages = results
				.filter((result): result is PromiseFulfilledResult<{ url: string; is_featured: boolean }> => result.status === 'fulfilled')
				.map(result => result.value);
			
			// Log rejected results
			const rejected = results.filter(result => result.status === 'rejected');
			if (rejected.length > 0) {
				console.warn('Some images failed to upload:', rejected.map(r => r.status === 'rejected' ? r.reason : ''));
				rejected.forEach((r, idx) => {
					if (r.status === 'rejected') {
						console.error(`Image ${idx + 1} failed:`, r.reason);
					}
				});
			}
			
			console.log('Successfully processed images:', newImages.length, 'out of', filesArray.length);
			console.log('New images structure:', newImages);
			
			if (newImages.length === 0) {
				alert('No images were successfully uploaded. Please check the console for errors.');
				setIsUploadingImage(false);
				return;
			}
			
			// Get latest gallery images directly from watch (not functional update)
			// Re-read to get the most current value after async operations
			const latestGalleryImagesRaw = watch('gallery_images');
			const latestImages = Array.isArray(latestGalleryImagesRaw) ? latestGalleryImagesRaw : [];
			const updatedImages = [...latestImages, ...newImages];
			
			// Ensure all images have valid url strings
			const validImages = updatedImages.filter((img: any) => img && img.url && typeof img.url === 'string' && img.url.length > 0);
			
			console.log('Previous images:', latestImages.length, 'New:', newImages.length, 'Total:', validImages.length);
			console.log('Updated images:', validImages);
			
			// Set the value directly (not using functional update)
			setValue('gallery_images', validImages, { shouldDirty: true, shouldValidate: true });
			
		} catch (error) {
			console.error('Error uploading images:', error);
			const errorMessage = error instanceof Error ? error.message : 'Failed to upload images. Please try again.';
			alert(errorMessage);
		} finally {
			setIsUploadingImage(false);
		}
	};

	const handleImageRemove = (index: number) => {
		// Ensure galleryImages is an array before filtering
		if (!Array.isArray(galleryImages)) return;
		const updatedImages = galleryImages.filter((_, i) => i !== index);
		setValue('gallery_images', updatedImages, { shouldDirty: true, shouldValidate: true });
	};

	const handleImageClick = (index: number) => {
		if (!Array.isArray(galleryImages)) return;
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
		if (!Array.isArray(galleryImages) || galleryImages.length === 0) {
			alert('Please upload an image first');
			return;
		}
		
		setProcessingImageIndex(imageIndex);
		setImageProcessingMessage('Removing background...');
		setImageProcessingDialogOpen(true);

		try {
			if (!galleryImages[imageIndex] || !galleryImages[imageIndex].url) {
				alert('Image not found');
				setImageProcessingDialogOpen(false);
				setProcessingImageIndex(null);
				return;
			}
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
		if (!Array.isArray(galleryImages) || galleryImages.length === 0) {
			alert('Please upload an image first');
			return;
		}

		setProcessingImageIndex(imageIndex);
		setImageProcessingMessage('Auto-cropping and centering...');
		setImageProcessingDialogOpen(true);

		try {
			if (!galleryImages[imageIndex] || !galleryImages[imageIndex].url) {
				alert('Image not found');
				setImageProcessingDialogOpen(false);
				setProcessingImageIndex(null);
				return;
			}
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
		if (!Array.isArray(galleryImages) || galleryImages.length === 0) {
			alert('Please upload an image first');
			return;
		}

		setProcessingImageIndex(imageIndex);
		setImageProcessingMessage('Creating 360° spin sequence...');
		setImageProcessingDialogOpen(true);

		try {
			if (!galleryImages[imageIndex] || !galleryImages[imageIndex].url) {
				alert('Image not found');
				setImageProcessingDialogOpen(false);
				setProcessingImageIndex(null);
				return;
			}
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
			if (!Array.isArray(galleryImages)) {
				setImageProcessingDialogOpen(false);
				setProcessingImageIndex(null);
				return;
			}
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
		if (!Array.isArray(galleryImages) || galleryImages.length === 0) {
			alert('Please upload an image first');
			return;
		}

		setProcessingImageIndex(imageIndex);
		setImageProcessingMessage('Adding watermark...');
		setImageProcessingDialogOpen(true);

		try {
			if (!galleryImages[imageIndex] || !galleryImages[imageIndex].url) {
				alert('Image not found');
				setImageProcessingDialogOpen(false);
				setProcessingImageIndex(null);
				return;
			}
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
		if (!Array.isArray(galleryImages) || galleryImages.length === 0) {
			alert('Please upload an image first');
			return;
		}

		setProcessingImageIndex(imageIndex);
		setImageProcessingMessage('AI enhancing image...');
		setImageProcessingDialogOpen(true);

		try {
			if (!galleryImages[imageIndex] || !galleryImages[imageIndex].url) {
				alert('Image not found');
				setImageProcessingDialogOpen(false);
				setProcessingImageIndex(null);
				return;
			}
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
			// Regenerate ALL variants if colors exist (not just add new ones)
			if (colorOptions.length > 0) {
				// Generate complete variant matrix
				const newVariants: Variant[] = [];
				updated.forEach(storage => {
					colorOptions.forEach(color => {
						// Preserve existing variant data if it exists
						const existing = variants.find(v => v.storage === storage && v.color === color);
						if (existing) {
							newVariants.push(existing);
						} else {
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
				setVariants(newVariants);
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
			// Regenerate ALL variants if storage exists (not just add new ones)
			if (storageOptions.length > 0) {
				// Generate complete variant matrix
				const newVariants: Variant[] = [];
				storageOptions.forEach(storage => {
					updated.forEach(color => {
						// Preserve existing variant data if it exists
						const existing = variants.find(v => v.storage === storage && v.color === color);
						if (existing) {
							newVariants.push(existing);
						} else {
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
				setVariants(newVariants);
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
			alert(`Please add at least one ${attribute1Name.toLowerCase()} and one ${attribute2Name.toLowerCase()} option`);
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
	// Fixed infinite loop by using useRef to track previous values and removing setValue from deps
	useEffect(() => {
		// Always ensure product_variants exists in form (even before initialization)
		const currentProductVariants = watch('product_variants');
		if (!Array.isArray(currentProductVariants)) {
			console.log('Initializing product_variants to empty array');
			setValue('product_variants', [], { shouldDirty: false });
		}
		
		if (!isInitialized) {
			return;
		}
		
		// Always save variants to form, even if empty (backend might require the field to exist)
		if (variants.length === 0) {
			console.log('Saving empty variants array to form');
			setValue('product_variants', [], { shouldDirty: true });
			return;
		}
		
		console.log('Saving variants to form:', variants.length, 'variants');
		
		// Create a string representation to compare (prevents unnecessary updates)
		const variantsKey = JSON.stringify(variants.map(v => ({ 
			storage: v.storage, 
			color: v.color, 
			price: v.price, 
			stock: v.stock,
			image: (v as any).image 
		})));
		const colorImagesKey = JSON.stringify(colorImages);
		const currentSlug = slug || '';
		
		// Only update if variants, colorImages, or slug actually changed
		if (variantsKey !== prevVariantsRef.current || colorImagesKey !== prevColorImagesRef.current || currentSlug !== prevSlugRef.current) {
			prevVariantsRef.current = variantsKey;
			prevColorImagesRef.current = colorImagesKey;
			prevSlugRef.current = currentSlug;
			
			// Convert variants to product_variants format for API
			const productVariantsData = variants.map((variant, index) => {
				const variantName = `${variant.storage} - ${variant.color}`;
				const variantPrice = parseFloat(variant.price) || 0;
				const variantStock = parseInt(variant.stock) || 0;
				const variantSku = `${currentSlug}-${variant.storage.toLowerCase()}-${variant.color.toLowerCase()}`.replace(/\s+/g, '-');
				
				// Generate uid and uids (backend requires these fields)
				const variantUid = variant.id ? `variant-${variant.id}` : `variant-${Date.now()}-${index}`;
				const variantUids = variantUid;
				
				const variantData: any = {
					id: variant.id || undefined,
					name: variantName, // Required field
					sku: variantSku, // Required field
					uid: variantUid, // Required field (backend fillable)
					uids: variantUids, // Required field (backend fillable)
					price: variantPrice, // Backend expects 'price' field (model fillable)
					price_tax_excl: variantPrice, // Database column (if exists)
					price_tax_incl: variantPrice, // Database column (if exists)
					compared_price: parseFloat(variant.compareAt) || 0,
					quantity: variantStock, // Database column (if exists)
					qty: variantStock, // Backend expects 'qty' field (model fillable)
					manage_stock: true, // Required field - always true for variants
					in_stock: variantStock > 0,
					is_active: true, // Required field
					is_default: false,
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
			
			console.log('Setting product_variants in form:', productVariantsData.length, 'variants');
			setValue('product_variants', productVariantsData, { shouldDirty: true });
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [variants, isInitialized, slug, colorImages]); // Removed setValue to prevent infinite loop

	const handleVariantChange = useCallback((index: number, field: keyof Variant, value: any) => {
		setVariants(prevVariants => {
			const updated = [...prevVariants];
			updated[index] = { ...updated[index], [field]: value };
			return updated;
		});
		// The useEffect above will handle saving to form
	}, []);

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

	// Color image upload handler - optimized to prevent multiple calls and infinite loops
	const handleColorImageUpload = useCallback((files: FileList | null) => {
		if (!files || files.length === 0 || !selectedColorForImage) return;
		
		// Prevent multiple simultaneous uploads
		if (isUploadingColorImage) return;
		
		setIsUploadingColorImage(true);
		const file = files[0];
		const colorName = selectedColorForImage; // Capture value to avoid stale closure
		const reader = new FileReader();
		
		reader.onloadend = () => {
			const imageUrl = reader.result as string;
			setColorImages((prev) => {
				// Only update if the image actually changed
				if (prev[colorName] === imageUrl) {
					return prev;
				}
				return {
					...prev,
					[colorName]: imageUrl,
				};
			});
			// Also update all variants with this color to use this image
			setVariants((prev) => {
				const hasChanges = prev.some(v => v.color === colorName && (v as any).image !== imageUrl);
				if (!hasChanges) {
					return prev; // No changes needed
				}
				return prev.map(v => {
					if (v.color === colorName) {
						return { ...v, image: imageUrl };
					}
					return v;
				});
			});
			setColorImageDialogOpen(false);
			setSelectedColorForImage(null);
			setIsUploadingColorImage(false);
		};
		
		reader.onerror = () => {
			console.error('Error reading color image file');
			alert('Failed to upload image. Please try again.');
			setIsUploadingColorImage(false);
		};
		
		reader.readAsDataURL(file);
	}, [selectedColorForImage, isUploadingColorImage]);

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
	const handleSuggestTitle = async () => {
		if (!productTitle || productTitle.length < 5) {
			alert('Please enter a product title first (minimum 5 characters)');
			return;
		}
		
		try {
			// Generate SEO title based on product title and tone
			const toneText = seoTone === 'Neutral' ? '' : ` (${seoTone.toLowerCase()} tone)`;
			const suggested = `${productTitle} — QC-Verified, Same-Day Delivery${toneText}`;
			
			// Ensure it's within 70 characters
			const finalTitle = suggested.length > 70 ? suggested.substring(0, 67) + '...' : suggested;
			setValue('meta_title', finalTitle, { shouldDirty: true });
		} catch (error) {
			console.error('Error generating SEO title:', error);
			alert('Failed to generate SEO title. Please try again.');
		}
	};

	const handleGenerateBullets = async () => {
		if (!productTitle || productTitle.length < 5) {
			alert('Please enter a product title first (minimum 5 characters)');
			return;
		}
		
		try {
			// Generate bullet points based on product title and offers
			const bullets = [
				'Fast same-day delivery available',
				'1-year AccessoryShield included',
				'QC-verified device with invoice',
				'Professional setup assistance',
				'7-day price-drop protection',
				'Trade-in value check available',
			];
			
			// Add offer-specific bullets
			if (offers.accessoryShield) {
				bullets[1] = '1-year AccessoryShield warranty included';
			}
			if (offers.setupAtDoorstep) {
				bullets[3] = 'Professional setup assistance at your doorstep';
			}
			if (offers.priceDropProtection) {
				bullets[4] = '7-day price-drop protection guarantee';
			}
			if (offers.tradeInAssist) {
				bullets[5] = 'Free trade-in value check and assistance';
			}
			
			const description = bullets.join('\n• ');
			setValue('description', description, { shouldDirty: true });
		} catch (error) {
			console.error('Error generating bullets:', error);
			alert('Failed to generate bullet points. Please try again.');
		}
	};

	const handleWriteDescription = async () => {
		if (!productTitle || productTitle.length < 5) {
			alert('Please enter a product title first (minimum 5 characters)');
			return;
		}
		
		try {
			// Generate description based on product title, tone, and offers
			const toneStyle = seoTone === 'Professional' ? 'professional' : 
							  seoTone === 'Casual' ? 'casual and friendly' :
							  seoTone === 'Friendly' ? 'friendly and approachable' :
							  seoTone === 'Formal' ? 'formal and detailed' : 'clear and informative';
			
			let desc = `This ${productTitle} comes with full manufacturer warranty and original packaging. Includes all accessories, documentation, and SIM tool. Device has been QC-verified and tested.`;
			
			if (offers.accessoryShield) {
				desc += ' Includes 1-year AccessoryShield warranty for added protection.';
			}
			if (offers.setupAtDoorstep) {
				desc += ' Professional setup assistance available at your doorstep.';
			}
			if (offers.priceDropProtection) {
				desc += ' 7-day price-drop protection ensures you get the best value.';
			}
			
			desc += ' Fast same-day delivery available in select areas.';
			
			setValue('description', desc, { shouldDirty: true });
		} catch (error) {
			console.error('Error writing description:', error);
			alert('Failed to generate description. Please try again.');
		}
	};
	
	// Save offers to extraFields - fixed infinite loop by using functional update
	useEffect(() => {
		if (!isInitialized) return;
		
		// Create a key to compare offers
		const offersKey = JSON.stringify(offers);
		
		// Only update if offers actually changed
		if (offersKey === prevOffersRef.current) return;
		
		prevOffersRef.current = offersKey;
		
		// Use functional update to get current value without triggering re-renders
		setValue('extraFields', (prev: any) => ({
			...prev,
			accessoryShield: offers.accessoryShield,
			setupAtDoorstep: offers.setupAtDoorstep,
			priceDropProtection: offers.priceDropProtection,
			tradeInAssist: offers.tradeInAssist,
		}), { shouldDirty: true });
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [offers, isInitialized]); // Removed setValue from dependencies

	const handleStepClick = useCallback((stepId: number) => {
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
			// Use ref if available, otherwise fallback to getElementById
			const element = sectionRefs.current[stepId] || document.getElementById(sectionId);
			if (element) {
				const headerOffset = 60; // Header height
				const elementPosition = element.getBoundingClientRect().top;
				const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
				
				window.scrollTo({
					top: offsetPosition,
					behavior: 'smooth'
				});
			}
		}
	}, []);

	// Intersection Observer to update current step based on scroll position
	useEffect(() => {
		const observerOptions = {
			root: null,
			rootMargin: '-20% 0px -60% 0px',
			threshold: 0
		};

		observerRef.current = new IntersectionObserver((entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					const stepId = parseInt(entry.target.getAttribute('data-step-id') || '1');
					setCurrentStep(stepId);
				}
			});
		}, observerOptions);

		// Observe all sections
		Object.values(sectionRefs.current).forEach((ref) => {
			if (ref && observerRef.current) {
				observerRef.current.observe(ref);
			}
		});

		return () => {
			if (observerRef.current) {
				observerRef.current.disconnect();
			}
		};
	}, []);

	// Set refs for sections
	const setSectionRef = useCallback((stepId: number, element: HTMLElement | null) => {
		if (element) {
			sectionRefs.current[stepId] = element;
			if (observerRef.current) {
				observerRef.current.observe(element);
			}
		}
	}, []);

	// Keyboard navigation
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Ctrl/Cmd + Arrow keys for navigation
			if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowDown') {
				e.preventDefault();
				if (currentStep < 10) {
					handleStepClick(currentStep + 1);
				}
			} else if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowUp') {
				e.preventDefault();
				if (currentStep > 1) {
					handleStepClick(currentStep - 1);
				}
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [currentStep, handleStepClick]);

	// Auto-save functionality (debounced) - optimized to prevent excessive calls
	useEffect(() => {
		// Skip auto-save if not initialized or if uploading images
		if (!isInitialized || isUploadingImage || isUploadingColorImage) {
			return;
		}

		const autoSaveTimer = setTimeout(() => {
			// Trigger form validation and save state
			// This would typically call an API to save draft
			console.log('Auto-saving form state...');
		}, 3000); // Increased to 3 seconds to reduce frequency

		return () => clearTimeout(autoSaveTimer);
	}, [productTitle, slug, description, isInitialized, isUploadingImage, isUploadingColorImage]);
	// Removed galleryImages and variants from dependencies to reduce re-runs

	const handlePublishClick = () => {
		// Validate "New" condition requires at least one picture
		if (condition === 'New' && (!galleryImages || galleryImages.length === 0)) {
			enqueueSnackbar('New condition requires at least one picture. Please add at least one image before publishing.', { 
				variant: 'error' 
			});
			// Scroll to media section
			setCurrentStep(2);
			handleStepClick(2);
			return;
		}

		// Ensure variants are saved to form before publishing
		// This prevents race condition where publish happens before useEffect saves variants
		if (variants.length > 0) {
			const currentSlug = slug || '';
			const productVariantsData = variants.map((variant, index) => {
				const variantName = `${variant.storage} - ${variant.color}`;
				const variantPrice = parseFloat(variant.price) || 0;
				const variantStock = parseInt(variant.stock) || 0;
				const variantData: any = {
					id: variant.id || undefined,
					name: variantName,
					sku: `${currentSlug}-${variant.storage.toLowerCase()}-${variant.color.toLowerCase()}`.replace(/\s+/g, '-'),
					price: variantPrice,
					price_tax_excl: variantPrice,
					compared_price: parseFloat(variant.compareAt) || 0,
					quantity: variantStock,
					qty: variantStock,
					manage_stock: true,
					in_stock: variantStock > 0,
					is_active: true,
					position: index + 1,
					attributes: [
						{ attribute_name: 'Storage', attribute_value: variant.storage },
						{ attribute_name: 'Color', attribute_value: variant.color },
					],
					same_day: variant.sameDay || false,
				};
				
				if ((variant as any).image) {
					variantData.image = (variant as any).image;
				} else if (colorImages[variant.color]) {
					variantData.image = colorImages[variant.color];
				}
				
				return variantData;
			});
			
			console.log('handlePublishClick: Saving variants to form before publish:', productVariantsData.length, 'variants');
			setValue('product_variants', productVariantsData, { shouldDirty: true });
		} else {
			// Ensure empty array is set if no variants
			console.log('handlePublishClick: Setting empty variants array');
			setValue('product_variants', [], { shouldDirty: true });
		}
		
		// Set active status to 1 (published) before submitting
		setValue('active', 1, { shouldDirty: true });
		
		// Trigger validation to ensure form is valid before submitting
		trigger().then((isValid) => {
			console.log('handlePublishClick: Form validation result:', isValid);
			
			// Small delay to ensure setValue and validation complete before clicking submit button
			setTimeout(() => {
				// Try to find create button first (for new products)
				let submitButton = document.querySelector('[data-product-create-button]') as HTMLButtonElement;
				
				// If not found, try to find save button (for editing existing products)
				if (!submitButton) {
					submitButton = document.querySelector('[data-product-save-button]') as HTMLButtonElement;
				}
				
				if (submitButton) {
					// Check if button is disabled
					if (submitButton.disabled) {
						console.warn('handlePublishClick: Submit button is disabled', {
							buttonType: submitButton.getAttribute('data-product-create-button') ? 'create' : 'save',
							productId,
							isValid,
							formState: formState
						});
					} else {
						console.log('handlePublishClick: Clicking submit button', {
							buttonType: submitButton.getAttribute('data-product-create-button') ? 'create' : 'save',
							productId,
							isValid
						});
						submitButton.click();
					}
				} else {
					console.error('handlePublishClick: Submit button not found', {
						productId,
						createButton: document.querySelector('[data-product-create-button]'),
						saveButton: document.querySelector('[data-product-save-button]')
					});
				}
			}, 150); // Increased delay to ensure setValue completes
		});
	};

	const handleSaveDraft = () => {
		// Ensure variants are saved to form before saving draft
		if (variants.length > 0) {
			const currentSlug = slug || '';
			const productVariantsData = variants.map((variant, index) => {
				const variantName = `${variant.storage} - ${variant.color}`;
				const variantPrice = parseFloat(variant.price) || 0;
				const variantStock = parseInt(variant.stock) || 0;
				const variantData: any = {
					id: variant.id || undefined,
					name: variantName,
					sku: `${currentSlug}-${variant.storage.toLowerCase()}-${variant.color.toLowerCase()}`.replace(/\s+/g, '-'),
					price: variantPrice,
					price_tax_excl: variantPrice,
					compared_price: parseFloat(variant.compareAt) || 0,
					quantity: variantStock,
					qty: variantStock,
					manage_stock: true,
					in_stock: variantStock > 0,
					is_active: true,
					position: index + 1,
					attributes: [
						{ attribute_name: 'Storage', attribute_value: variant.storage },
						{ attribute_name: 'Color', attribute_value: variant.color },
					],
					same_day: variant.sameDay || false,
				};
				
				if ((variant as any).image) {
					variantData.image = (variant as any).image;
				} else if (colorImages[variant.color]) {
					variantData.image = colorImages[variant.color];
				}
				
				return variantData;
			});
			
			setValue('product_variants', productVariantsData, { shouldDirty: true });
		} else {
			setValue('product_variants', [], { shouldDirty: true });
		}
		
		// Set draft status and save
		setValue('status', 'draft', { shouldDirty: true });
		
		// Small delay to ensure setValue completes before clicking create button
		setTimeout(() => {
			const addButton = document.querySelector('[data-product-create-button]') as HTMLButtonElement;
			if (addButton) {
				addButton.click();
			}
		}, 100);
	};

	const handlePreviewClick = () => {
		// Scroll to preview section
		const previewSection = document.getElementById('preview');
		if (previewSection) {
			previewSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
			setCurrentStep(10);
		}
	};

	// Watch category values for validation
	const mainCategory = watch('main_category');
	const subcategory = watch('subcategory');
	
	// Calculate missing required fields
	const missingFields = useMemo(() => {
		const missing: Array<{ field: string; section: string; step: number }> = [];
		
		// Product Identity (Step 1)
		if (!productTitle || productTitle.length < 5) {
			missing.push({ field: 'Product Name (min 5 characters)', section: 'Product Identity', step: 1 });
		}
		
		// Check main_category - must be an object with an id property
		const hasValidMainCategory = mainCategory && 
			typeof mainCategory === 'object' && 
			mainCategory.id !== null && 
			mainCategory.id !== undefined && 
			mainCategory.id !== '';
		if (!hasValidMainCategory) {
			missing.push({ field: 'Main Category', section: 'Product Identity', step: 1 });
		}
		
		// Check subcategory - must be an array with at least one item that has an id
		const hasValidSubcategory = subcategory && 
			Array.isArray(subcategory) && 
			subcategory.length > 0 && 
			subcategory.some((cat: any) => cat && cat.id !== null && cat.id !== undefined && cat.id !== '');
		if (!hasValidSubcategory) {
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
	}, [productTitle, description, galleryImages, variants, mainCategory, subcategory]);

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
		if (template.meta_keywords) setValue('meta_keywords', template.meta_keywords, { shouldDirty: true });
		if (template.price_tax_excl) setValue('price_tax_excl', template.price_tax_excl, { shouldDirty: true });
		if (template.price_tax_incl) setValue('price_tax_incl', template.price_tax_incl, { shouldDirty: true });
		if (template.sku) setValue('sku', template.sku, { shouldDirty: true });
		
		// Handle categories
		if (template.categories && template.categories.length > 0) {
			const mainCategory = template.categories.find((cat: any) => !cat.parent_id);
			const subcategories = template.categories.filter((cat: any) => cat.parent_id);
			if (mainCategory) setValue('main_category_id', mainCategory.id, { shouldDirty: true });
			if (subcategories.length > 0) {
				setValue('subcategory_ids', subcategories.map((cat: any) => cat.id), { shouldDirty: true });
			}
		}
		
		if (template.gallery_images) {
			const galleryImages = Array.isArray(template.gallery_images) ? template.gallery_images : [];
			setValue('gallery_images', galleryImages, { shouldDirty: true });
		}
		
		if (template.product_variants && template.product_variants.length > 0) {
			// Extract unique storage and color options from variants
			const storageSet = new Set<string>();
			const colorSet = new Set<string>();
			
			const templateVariants = template.product_variants.map((v: any) => {
				const storage = v.attributes?.find((a: any) => a.attribute_name === 'Storage')?.attribute_value || '';
				const color = v.attributes?.find((a: any) => a.attribute_name === 'Color')?.attribute_value || '';
				
				if (storage) storageSet.add(storage);
				if (color) colorSet.add(color);
				
				return {
					id: v.id?.toString(),
					storage,
					color,
					price: v.price_tax_excl?.toString() || v.price?.toString() || '',
					compareAt: v.compared_price?.toString() || '',
					stock: v.quantity?.toString() || v.qty?.toString() || '',
					sameDay: v.same_day || false,
					image: v.image || (v.attributes?.find((a: any) => a.attribute_name === 'Image')?.attribute_value),
				};
			});
			
			// Update storage and color options
			if (storageSet.size > 0) {
				setStorageOptions(Array.from(storageSet));
			}
			if (colorSet.size > 0) {
				setColorOptions(Array.from(colorSet));
			}
			
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
		if (product.meta_keywords) setValue('meta_keywords', product.meta_keywords, { shouldDirty: true });
		if (product.price_tax_excl) setValue('price_tax_excl', product.price_tax_excl, { shouldDirty: true });
		if (product.price_tax_incl) setValue('price_tax_incl', product.price_tax_incl, { shouldDirty: true });
		if (product.sku) setValue('sku', product.sku, { shouldDirty: true });
		
		// Handle categories
		if (product.categories && product.categories.length > 0) {
			const mainCategory = product.categories.find((cat: any) => !cat.parent_id);
			const subcategories = product.categories.filter((cat: any) => cat.parent_id);
			if (mainCategory) setValue('main_category_id', mainCategory.id, { shouldDirty: true });
			if (subcategories.length > 0) {
				setValue('subcategory_ids', subcategories.map((cat: any) => cat.id), { shouldDirty: true });
			}
		}
		
		if (product.gallery_images) {
			// Ensure gallery_images is an array before setting
			const galleryImages = Array.isArray(product.gallery_images) ? product.gallery_images : [];
			setValue('gallery_images', galleryImages, { shouldDirty: true });
		}
		if (product.product_variants && product.product_variants.length > 0) {
			// Extract unique storage and color options from variants
			const storageSet = new Set<string>();
			const colorSet = new Set<string>();
			
			const pastVariants = product.product_variants.map((v: any) => {
				const storage = v.attributes?.find((a: any) => a.attribute_name === 'Storage')?.attribute_value || '';
				const color = v.attributes?.find((a: any) => a.attribute_name === 'Color')?.attribute_value || '';
				
				if (storage) storageSet.add(storage);
				if (color) colorSet.add(color);
				
				return {
					id: v.id?.toString(),
					storage,
					color,
					price: v.price_tax_excl?.toString() || v.price?.toString() || '',
					compareAt: v.compared_price?.toString() || '',
					stock: v.quantity?.toString() || v.qty?.toString() || '',
					sameDay: v.same_day || false,
					image: v.image || (v.attributes?.find((a: any) => a.attribute_name === 'Image')?.attribute_value),
				};
			});
			
			// Update storage and color options
			if (storageSet.size > 0) {
				setStorageOptions(Array.from(storageSet));
			}
			if (colorSet.size > 0) {
				setColorOptions(Array.from(colorSet));
			}
			
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

	// Back button handler
	const handleBack = () => {
		// Check if we're on the listing route
		const currentPath = window.location.pathname;
		if (currentPath.includes('/listing/')) {
			navigate('/listing');
		} else {
			navigate('/apps/e-commerce/products');
		}
	};

	return (
		<div className="flex flex-col h-screen bg-[#f9fafb] overflow-hidden relative" style={{ fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif' }}>
		{/* Hidden ProductHeader for form submission */}
		<div className="absolute opacity-0 pointer-events-none -z-10">
			<ProductHeader />
		</div>

		{/* Top Navigation Bar - Dark Navy Header */}
		<header 
			className="px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between flex-shrink-0 sticky top-0 z-50" 
			style={{ 
				backgroundColor: '#0f172a',
				minHeight: '60px',
				boxShadow: 'none',
				borderBottom: 'none'
			}}
		>
			<div className="flex items-center space-x-2 sm:space-x-3">
				{/* Back Button */}
				<IconButton
					onClick={handleBack}
					sx={{
						color: '#ffffff',
						padding: '8px',
						marginRight: { xs: '4px', sm: '8px' }
					}}
				>
					<FuseSvgIcon>heroicons-outline:arrow-left</FuseSvgIcon>
				</IconButton>
				
				{/* Sidebar Toggle - Mobile */}
				<IconButton
					onClick={() => setSidebarOpen(!sidebarOpen)}
					sx={{
						color: '#ffffff',
						padding: '8px',
						marginRight: { xs: '4px', sm: '0' },
						display: { xs: 'flex', lg: 'none' }
					}}
				>
					<FuseSvgIcon>heroicons-outline:bars-3</FuseSvgIcon>
				</IconButton>

				{/* Orange Circle Logo */}
				<div 
					className="rounded-full flex-shrink-0 hidden sm:block"
					style={{ 
						backgroundColor: '#ff6536',
						width: '8px',
						height: '8px',
						borderRadius: '50%',
						marginRight: '8px'
					}}
				/>
				{/* MultiKonnect Text */}
				<Typography 
					variant="h6" 
					sx={{ 
						fontSize: { xs: '14px', sm: '16px' }, 
						fontWeight: 700,
						color: '#ffffff',
						letterSpacing: '0.01em',
						lineHeight: 1.2,
						marginRight: { xs: '8px', sm: '12px' }
					}}
				>
					MultiKonnect
				</Typography>
				{/* Create Listing Button - Hidden on mobile */}
				<Button
					variant="text"
					size="small"
					className="hidden sm:flex"
					sx={{
						color: '#ffffff',
						textTransform: 'none',
						fontSize: '14px',
						padding: '6px 16px',
						minHeight: '32px',
						fontWeight: 500,
						borderRadius: '8px',
						backgroundColor: 'transparent',
						'&:hover': {
							backgroundColor: 'rgba(255, 255, 255, 0.1)',
						},
					}}
				>
					Create Listing
				</Button>
			</div>
			<div className="flex items-center space-x-1 sm:space-x-2">
				{/* Right Sidebar Toggle - Mobile */}
				<IconButton
					onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
					sx={{
						color: '#ffffff',
						padding: '8px',
						display: { xs: 'flex', lg: 'none' }
					}}
				>
					<FuseSvgIcon>heroicons-outline:chart-bar</FuseSvgIcon>
				</IconButton>

				<Button 
					variant="text" 
					size="small"
					onClick={handleSaveDraft}
					className="hidden sm:flex"
					sx={{
						color: '#ffffff',
						textTransform: 'none',
						fontSize: { xs: '12px', sm: '14px' },
						padding: { xs: '6px 12px', sm: '8px 16px' },
						minHeight: '36px',
						fontWeight: 500,
						borderRadius: '8px',
						backgroundColor: 'transparent',
						'&:hover': {
							backgroundColor: 'rgba(255, 255, 255, 0.1)',
						},
					}}
				>
					<span className="hidden md:inline">Save draft</span>
					<span className="md:hidden">Save</span>
				</Button>
				<Button 
					variant="text" 
					size="small"
					className="hidden sm:flex"
					sx={{
						color: '#ffffff',
						textTransform: 'none',
						fontSize: { xs: '12px', sm: '14px' },
						padding: { xs: '6px 12px', sm: '8px 16px' },
						minHeight: '36px',
						fontWeight: 500,
						borderRadius: '8px',
						backgroundColor: 'transparent',
						'&:hover': {
							backgroundColor: 'rgba(255, 255, 255, 0.1)',
						},
					}}
					onClick={handlePreviewClick}
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
						fontSize: { xs: '12px', sm: '14px' },
						padding: { xs: '6px 16px', sm: '8px 20px' },
						fontWeight: 600,
						borderRadius: '8px',
						minHeight: '36px',
						boxShadow: 'none',
						'&:hover': { 
							backgroundColor: '#e55a2b',
							boxShadow: 'none',
						},
					}}
					onClick={handlePublishClick}
				>
					Publish
				</Button>
			</div>
		</header>

			<div className="flex flex-1 overflow-hidden min-h-0 justify-center">
				<div className="flex w-full max-w-[1920px] relative">
				{/* Mobile Left Sidebar Overlay */}
				{sidebarOpen && (
					<div 
						className="fixed inset-0 bg-black bg-opacity-50 z-[60] lg:hidden"
						onClick={() => setSidebarOpen(false)}
						style={{ top: '60px' }}
					/>
				)}
				
				{/* Left Sidebar - Listing Steps - Light Grey */}
				<aside 
					className={`fixed lg:static w-[280px] max-w-[85vw] lg:max-w-none border-r overflow-y-auto flex-shrink-0 z-[70] lg:z-auto transition-transform duration-300 ease-in-out ${
						sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
					}`}
					style={{ 
						backgroundColor: '#f8f9fa',
						borderColor: '#e5e7eb',
						borderRightWidth: '1px',
						height: 'calc(100vh - 60px)',
						top: '60px',
						left: 0,
						boxShadow: sidebarOpen ? '2px 0 8px rgba(0,0,0,0.1)' : 'none'
					}}
				>
					{/* Close button for mobile */}
					<div className="lg:hidden flex justify-end p-2 border-b">
						<IconButton
							onClick={() => setSidebarOpen(false)}
							size="small"
							sx={{ color: '#6b7280' }}
						>
							<FuseSvgIcon>heroicons-outline:x-mark</FuseSvgIcon>
						</IconButton>
					</div>
					<div className="p-3 sm:p-4">
						<div className="space-y-0.5">
							{steps.map((step) => (
								<a
									key={step.id}
									href={`#${step.id === 1 ? 'identity' : step.id === 2 ? 'media' : step.id === 3 ? 'variants' : ''}`}
									onClick={(e) => {
										e.preventDefault();
										handleStepClick(step.id);
										// Close sidebar on mobile after selecting a step
										if (window.innerWidth < 1024) {
											setSidebarOpen(false);
										}
									}}
									className="flex items-start cursor-pointer transition-all no-underline"
									style={{
										color: 'inherit',
										textDecoration: 'none',
										padding: '10px 12px',
										borderRadius: '6px',
										backgroundColor: currentStep === step.id ? '#dbeafe' : 'transparent',
										marginBottom: '1px',
									}}
								>
									<span 
										style={{
											fontSize: '13px',
											fontWeight: 600,
											color: currentStep === step.id ? '#2563eb' : '#6b7280',
											marginRight: '8px',
											minWidth: '20px',
											lineHeight: '1.5'
										}}
									>
										{step.id}.
									</span>
									<div style={{ flex: 1, minWidth: 0 }}>
										<div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
											<Typography
												sx={{ 
													fontSize: '13px', 
													fontWeight: 500,
													color: currentStep === step.id ? '#1e40af' : '#111827',
													lineHeight: '1.5',
												}}
											>
												{step.title}
											</Typography>
											{step.completed && (
												<CheckCircleIcon 
													sx={{ 
														fontSize: '14px', 
														color: '#10b981',
														marginLeft: 'auto'
													}} 
												/>
											)}
										</div>
										<Typography 
											sx={{ 
												fontSize: '11px', 
												display: 'block', 
												color: '#6b7280',
												lineHeight: '1.4'
											}}
										>
											{step.description}
										</Typography>
									</div>
								</a>
							))}
						</div>
					</div>
				</aside>

				{/* Main Content Area */}
				<main 
					className={`flex-1 overflow-y-auto min-w-0 px-4 sm:px-6 lg:px-8 transition-all duration-300 ${
						sidebarOpen || rightSidebarOpen ? 'lg:ml-0 lg:mr-0' : ''
					}`}
					style={{ 
						backgroundColor: '#ffffff',
						paddingTop: '16px',
						paddingBottom: '16px',
						height: 'calc(100vh - 60px)',
						width: '100%'
					}}
				>
					<div className="w-full max-w-[1200px] mx-auto space-y-4 sm:space-y-6">
						{/* Product Identity Section - Step 1 */}
						<section 
							ref={(el) => setSectionRef(1, el)}
							className="p-4 sm:p-6 rounded-xl border" 
							id="identity"
							data-step-id="1"
							style={{
								borderRadius: '12px',
								border: '1px solid #e5e7eb',
								backgroundColor: '#ffffff',
								boxShadow: 'none',
								scrollMarginTop: '80px',
							}}
						>
							<Typography variant="h6" className="font-semibold mb-1 text-gray-900" sx={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px', margin: '0 0 6px 0' }}>
								Product identity
							</Typography>
							<Typography variant="body2" className="text-gray-600 mb-4" sx={{ fontSize: '13px', color: '#6b7280', marginBottom: '10px', margin: '2px 0 10px 0' }}>
								Match to a Master Product (MPID) to lock canonical specs. You can still add merchant-specific notes.
							</Typography>

							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
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
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
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
							ref={(el) => setSectionRef(2, el)}
							className="p-4 sm:p-6 rounded-xl border" 
							id="media"
							data-step-id="2"
							style={{
								borderRadius: '12px',
								border: '1px solid #e5e7eb',
								backgroundColor: '#ffffff',
								boxShadow: 'none',
								scrollMarginTop: '80px',
							}}
						>
							<Typography variant="h6" className="font-semibold mb-1 text-gray-900" sx={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px', margin: '0 0 6px 0' }}>
								Media
							</Typography>
							<Typography variant="body2" className="text-gray-600 mb-4" sx={{ fontSize: '13px', color: '#6b7280', marginBottom: '10px', margin: '2px 0 10px 0' }}>
								Upload 6-12 images. Include front/back, box contents, ports. Per-variant photos supported.
							</Typography>

							{/* Image Upload Slots */}
							<div className="flex gap-3 mb-4" style={{ flexWrap: 'wrap' }}>
								{(() => {
									// Use the memoized galleryImages for reactivity
									const imagesArray = Array.isArray(galleryImages) ? galleryImages : [];
									
									// Show at least 6 slots, or more if there are more images
									// Maximum of 12 slots as per instructions (6-12 images)
									const totalSlots = Math.max(6, Math.min(12, imagesArray.length + 1));
									
									return Array.from({ length: totalSlots }, (_, index) => {
										// Debug log for first slot
										if (index === 0) {
											console.log('Media section render - galleryImages:', imagesArray);
											console.log('Media section render - galleryImagesRaw:', galleryImagesRaw);
											console.log('Media section render - imagesArray length:', imagesArray.length);
											console.log('Media section render - totalSlots:', totalSlots);
											if (imagesArray.length > 0) {
												console.log('Media section render - first image:', imagesArray[0]);
											}
										}
										
										const hasImage = imagesArray.length > index && 
											imagesArray[index] && 
											imagesArray[index].url &&
											typeof imagesArray[index].url === 'string' &&
											imagesArray[index].url.length > 0;
										
										const isFirstSlot = index === 0;
										const currentImage = hasImage ? imagesArray[index] : null;
										
										if (index === 0) {
											console.log('Media section render - hasImage for index 0:', hasImage, 'currentImage:', currentImage);
										}
									
									return (
										<label
											key={`media-slot-${index}-${currentImage?.url || 'empty'}`}
											htmlFor={`image-upload-${index}`}
											style={{
												width: '150px',
												height: '150px',
												border: '2px dashed #d1d5db',
												borderRadius: '12px',
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												cursor: 'pointer',
												backgroundColor: '#f9fafb',
												transition: 'all 0.2s',
												overflow: 'hidden',
											}}
											onMouseEnter={(e) => {
												e.currentTarget.style.borderColor = '#9ca3af';
												e.currentTarget.style.backgroundColor = '#f3f4f6';
											}}
											onMouseLeave={(e) => {
												e.currentTarget.style.borderColor = '#d1d5db';
												e.currentTarget.style.backgroundColor = '#f9fafb';
											}}
										>
											{hasImage && currentImage ? (
												<div style={{ position: 'relative', width: '100%', height: '100%' }}>
													<img
														src={currentImage.url}
														alt="Uploaded"
														style={{
															width: '100%',
															height: '100%',
															objectFit: 'cover',
															borderRadius: '10px',
														}}
														onError={(e) => {
															console.error('Image load error:', e);
														}}
													/>
													<button
														onClick={(e) => {
															e.preventDefault();
															e.stopPropagation();
															handleImageRemove(index);
														}}
														style={{
															position: 'absolute',
															top: '4px',
															right: '4px',
															background: 'rgba(0, 0, 0, 0.6)',
															color: 'white',
															border: 'none',
															borderRadius: '50%',
															width: '24px',
															height: '24px',
															cursor: 'pointer',
															display: 'flex',
															alignItems: 'center',
															justifyContent: 'center',
															fontSize: '16px',
															zIndex: 10,
														}}
													>
														×
													</button>
												</div>
											) : isUploadingImage && index === 0 ? (
												<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
													<CircularProgress size={24} sx={{ color: '#9ca3af' }} />
													<span style={{ color: '#9ca3af', fontSize: '12px' }}>Uploading...</span>
												</div>
											) : (
												<span style={{ color: '#9ca3af', fontSize: isFirstSlot ? '14px' : '24px', fontWeight: isFirstSlot ? 500 : 300 }}>
													{isFirstSlot ? 'Upload' : '+'}
												</span>
											)}
											<input
												id={`image-upload-${index}`}
												type="file"
												accept="image/*"
												multiple
												disabled={isUploadingImage}
												style={{ display: 'none' }}
												onChange={handleImageUpload}
											/>
										</label>
									);
									});
								})()}
							</div>

							{/* Action Buttons */}
							<div className="flex flex-col gap-3 mb-4">
								{/* First row of buttons */}
								<div className="flex gap-3" style={{ flexWrap: 'wrap' }}>
									<Button
										variant="outlined"
										size="small"
										onClick={() => {
											if (galleryImages && galleryImages.length > 0) {
												handleRemoveBackground(0);
											} else {
												alert('Please upload an image first');
											}
										}}
										sx={{
											borderColor: '#e5e7eb',
											color: '#374151',
											textTransform: 'none',
											fontSize: '13px',
											padding: '8px 16px',
											borderRadius: '8px',
											minHeight: '40px',
											backgroundColor: '#ffffff',
											'&:hover': {
												borderColor: '#d1d5db',
												backgroundColor: '#f9fafb',
											},
										}}
									>
										Remove background
									</Button>
									<Button
										variant="outlined"
										size="small"
										onClick={() => {
											if (galleryImages && galleryImages.length > 0) {
												handleAutoCropAndCenter(0);
											} else {
												alert('Please upload an image first');
											}
										}}
										sx={{
											borderColor: '#e5e7eb',
											color: '#374151',
											textTransform: 'none',
											fontSize: '13px',
											padding: '8px 16px',
											borderRadius: '8px',
											minHeight: '40px',
											backgroundColor: '#ffffff',
											'&:hover': {
												borderColor: '#d1d5db',
												backgroundColor: '#f9fafb',
											},
										}}
									>
										Auto-crop & center
									</Button>
									<Button
										variant="outlined"
										size="small"
										onClick={() => {
											if (galleryImages && galleryImages.length > 0) {
												handleCreate360Spin(0);
											} else {
												alert('Please upload an image first');
											}
										}}
										sx={{
											borderColor: '#e5e7eb',
											color: '#374151',
											textTransform: 'none',
											fontSize: '13px',
											padding: '8px 16px',
											borderRadius: '8px',
											minHeight: '40px',
											backgroundColor: '#ffffff',
											'&:hover': {
												borderColor: '#d1d5db',
												backgroundColor: '#f9fafb',
											},
										}}
									>
										Create 360° spin
									</Button>
									<Button
										variant="outlined"
										size="small"
										onClick={() => {
											if (galleryImages && galleryImages.length > 0) {
												handleWatermark(0);
											} else {
												alert('Please upload an image first');
											}
										}}
										sx={{
											borderColor: '#e5e7eb',
											color: '#374151',
											textTransform: 'none',
											fontSize: '13px',
											padding: '8px 16px',
											borderRadius: '8px',
											minHeight: '40px',
											backgroundColor: '#ffffff',
											'&:hover': {
												borderColor: '#d1d5db',
												backgroundColor: '#f9fafb',
											},
										}}
									>
										Watermark
									</Button>
								</div>

								{/* Second row - AI Auto-enhance */}
								<div className="flex gap-3">
									<Button
										variant="outlined"
										size="small"
										onClick={() => {
											if (galleryImages && galleryImages.length > 0) {
												handleAIAutoEnhance(0);
											} else {
												alert('Please upload an image first');
											}
										}}
										sx={{
											borderColor: '#e5e7eb',
											color: '#374151',
											textTransform: 'none',
											fontSize: '13px',
											padding: '8px 16px',
											borderRadius: '8px',
											minHeight: '40px',
											backgroundColor: '#ffffff',
											'&:hover': {
												borderColor: '#d1d5db',
												backgroundColor: '#f9fafb',
											},
										}}
									>
										AI Auto-enhance
									</Button>
								</div>
							</div>

							{/* Tip Section */}
							<div style={{ marginTop: '12px' }}>
								<Typography variant="body2" sx={{ fontSize: '13px', color: '#6b7280' }}>
									<span style={{ fontWeight: 600 }}>Tip:</span> Add a photo of serial/IMEI (mask last digits). AI will auto-shadow and white balance.
								</Typography>
							</div>
						</section>

						{/* Variants Section - Step 3 */}
						<Paper 
							ref={(el) => setSectionRef(3, el as HTMLElement)}
							className="p-3 sm:p-4 lg:p-6" 
							id="variants"
							data-step-id="3"
							sx={{
								borderRadius: '12px',
								border: '1px solid #e5e7eb',
								backgroundColor: '#ffffff',
								boxShadow: 'none',
								scrollMarginTop: '80px',
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
									Add {attribute1Name}
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
									Add {attribute2Name}
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

							<div className="overflow-x-auto -mx-3 sm:mx-0" style={{ WebkitOverflowScrolling: 'touch' }}>
								<table className="w-full border-collapse" style={{ fontSize: '13px', minWidth: '600px' }}>
									<thead>
										<tr className="bg-gray-100">
											<th className="border border-gray-300 px-2 sm:px-3 py-2 text-left font-semibold whitespace-nowrap text-xs sm:text-sm">{attribute1Name}</th>
											<th className="border border-gray-300 px-2 sm:px-3 py-2 text-left font-semibold whitespace-nowrap text-xs sm:text-sm">{attribute2Name}</th>
											<th className="border border-gray-300 px-2 sm:px-3 py-2 text-left font-semibold whitespace-nowrap text-xs sm:text-sm">Price (£)</th>
											<th className="border border-gray-300 px-2 sm:px-3 py-2 text-left font-semibold whitespace-nowrap text-xs sm:text-sm">Compare-at</th>
											<th className="border border-gray-300 px-2 sm:px-3 py-2 text-left font-semibold whitespace-nowrap text-xs sm:text-sm">Stock</th>
											<th className="border border-gray-300 px-2 sm:px-3 py-2 text-left font-semibold whitespace-nowrap text-xs sm:text-sm">Same-day</th>
											<th className="border border-gray-300 px-2 sm:px-3 py-2 text-left font-semibold whitespace-nowrap text-xs sm:text-sm">Images</th>
										</tr>
									</thead>
									<tbody>
										{variants.length === 0 ? (
											<tr>
												<td colSpan={7} className="border border-gray-300 px-3 sm:px-4 py-6 sm:py-8 text-center text-gray-400 text-xs sm:text-sm">
													No variants added yet. Add {attribute1Name} and {attribute2Name} options to generate variant matrix.
												</td>
											</tr>
										) : (
											variants.map((variant, index) => (
												<tr key={index}>
													<td className="border border-gray-300 px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm">{variant.storage}</td>
													<td className="border border-gray-300 px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm">{variant.color}</td>
													<td className="border border-gray-300 px-2 sm:px-3 py-2">
														<TextField
															size="small"
															type="number"
															value={variant.price}
															onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
															placeholder="1299"
															sx={{
																width: '100%',
																'& .MuiOutlinedInput-root': {
																	fontSize: { xs: '12px', sm: '13px' },
																	minHeight: { xs: '32px', sm: '36px' },
																	maxHeight: { xs: '32px', sm: '36px' },
																},
																'& .MuiInputBase-input': {
																	padding: { xs: '6px 8px', sm: '8px 12px' },
																	overflow: 'hidden',
																	textOverflow: 'ellipsis',
																},
															}}
														/>
													</td>
													<td className="border border-gray-300 px-2 sm:px-3 py-2">
														<TextField
															size="small"
															type="number"
															value={variant.compareAt}
															onChange={(e) => handleVariantChange(index, 'compareAt', e.target.value)}
															placeholder="1349"
															sx={{
																width: '100%',
																'& .MuiOutlinedInput-root': {
																	fontSize: { xs: '12px', sm: '13px' },
																	minHeight: { xs: '32px', sm: '36px' },
																	maxHeight: { xs: '32px', sm: '36px' },
																},
																'& .MuiInputBase-input': {
																	padding: { xs: '6px 8px', sm: '8px 12px' },
																	overflow: 'hidden',
																	textOverflow: 'ellipsis',
																},
															}}
														/>
													</td>
													<td className="border border-gray-300 px-2 sm:px-3 py-2">
														<TextField
															size="small"
															type="number"
															value={variant.stock}
															onChange={(e) => handleVariantChange(index, 'stock', e.target.value)}
															placeholder="12"
															sx={{
																width: '100%',
																'& .MuiOutlinedInput-root': {
																	fontSize: { xs: '12px', sm: '13px' },
																	minHeight: { xs: '32px', sm: '36px' },
																	maxHeight: { xs: '32px', sm: '36px' },
																},
																'& .MuiInputBase-input': {
																	padding: { xs: '6px 8px', sm: '8px 12px' },
																	overflow: 'hidden',
																	textOverflow: 'ellipsis',
																},
															}}
														/>
													</td>
													<td className="border border-gray-300 px-2 sm:px-3 py-2">
														<Checkbox
															checked={variant.sameDay}
															onChange={(e) => handleVariantChange(index, 'sameDay', e.target.checked)}
															size="small"
														/>
													</td>
													<td className="border border-gray-300 px-2 sm:px-3 py-2">
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
							ref={(el) => setSectionRef(4, el as HTMLElement)}
							className="p-3" 
							id="pricing"
							data-step-id="4"
							sx={{
								borderRadius: '16px',
								border: '1px solid #e5e7eb',
								boxShadow: 'none',
								scrollMarginTop: '80px',
							}}
						>
							<Typography variant="h6" className="font-semibold mb-2 text-gray-900" sx={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
								Pricing & intelligence
							</Typography>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
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
										<div style={{ flex: 1 }}>
											<div className="flex items-center justify-between mb-1">
												<Typography variant="subtitle2" className="font-bold" sx={{ fontSize: '14px', fontWeight: 800 }}>
													Fee preview
												</Typography>
												<IconButton 
													size="small" 
													onClick={() => {
														setTempFeeSettings(feeSettings);
														setFeeSettingsDialogOpen(true);
													}}
													sx={{ padding: '4px', marginLeft: '8px' }}
													title="Configure fees"
												>
													<FuseSvgIcon size={16} sx={{ color: '#6b7280' }}>heroicons-outline:cog-6-tooth</FuseSvgIcon>
												</IconButton>
											</div>
											<Typography variant="caption" className="text-gray-600" sx={{ fontSize: '12px', color: '#6b7280', display: 'block', marginTop: '2px' }}>
												Commission + shipping + promos
											</Typography>
											{/* Fee Breakdown */}
											<div className="mt-2 space-y-1" style={{ fontSize: '11px', color: '#6b7280' }}>
												<div className="flex justify-between">
													<span>Commission ({(feeSettings.commissionRate * 100).toFixed(1)}%):</span>
													<span>{formatCurrency(pricingIntelligence.fees.commission)}</span>
												</div>
												<div className="flex justify-between">
													<span>Shipping (vendor):</span>
													<span>{formatCurrency(pricingIntelligence.fees.shipping)}</span>
												</div>
												{pricingIntelligence.fees.promos > 0 && (
													<div className="flex justify-between">
														<span>Promos:</span>
														<span>{formatCurrency(pricingIntelligence.fees.promos)}</span>
													</div>
												)}
											</div>
										</div>
										<div style={{ textAlign: 'right', marginLeft: '16px' }}>
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
							ref={(el) => setSectionRef(5, el as HTMLElement)}
							className="p-3 sm:p-4" 
							id="delivery"
							data-step-id="5"
							sx={{
								borderRadius: '16px',
								border: '1px solid #e5e7eb',
								boxShadow: 'none',
								scrollMarginTop: '80px',
							}}
						>
							<Typography variant="h6" className="font-semibold mb-1 text-gray-900" sx={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px' }}>
								Same-day & stores
							</Typography>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
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
							
							{/* Shipping Charges - Set by Vendor */}
							<Typography variant="subtitle2" sx={{ fontSize: '14px', fontWeight: 600, marginTop: '16px', marginBottom: '8px' }}>
								Shipping Charges
							</Typography>
							<Typography variant="caption" sx={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '12px' }}>
								Set your shipping charges for this product. These will be added to the product price.
							</Typography>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
								<Controller
									name="shipping_charge_regular"
									control={control}
									render={({ field }) => (
										<TextField
											{...field}
											label="Regular Delivery Charge (£)"
											type="number"
											value={shippingChargeRegular}
											fullWidth
											size="small"
											InputProps={{
												startAdornment: <InputAdornment position="start">£</InputAdornment>,
											}}
											sx={{
												'& .MuiOutlinedInput-root': {
													borderRadius: '12px',
													fontSize: '14px',
												},
											}}
											helperText="Standard delivery"
										/>
									)}
								/>
								<Controller
									name="shipping_charge_same_day"
									control={control}
									render={({ field }) => (
										<TextField
											{...field}
											label="Same-Day Delivery Charge (£)"
											type="number"
											value={shippingChargeSameDay}
											fullWidth
											size="small"
											InputProps={{
												startAdornment: <InputAdornment position="start">£</InputAdornment>,
											}}
											sx={{
												'& .MuiOutlinedInput-root': {
													borderRadius: '12px',
													fontSize: '14px',
												},
											}}
											helperText="Same-day delivery"
										/>
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
										sx={{ marginTop: '16px' }}
									/>
								)}
							/>
							<Typography variant="caption" className="text-gray-500" sx={{ fontSize: '12px', color: '#6b7280', display: 'block', marginTop: '8px' }}>
								Same-day badge appears only if stock &gt; 0 and slots are available.
							</Typography>
						</Paper>

						{/* Copy & SEO Section - Step 6 */}
						<Paper 
							ref={(el) => setSectionRef(6, el as HTMLElement)}
							className="p-3 sm:p-4 lg:p-6" 
							id="copy"
							data-step-id="6"
							sx={{
								borderRadius: '12px',
								scrollMarginTop: '80px',
								border: '1px solid #e5e7eb',
								backgroundColor: '#ffffff',
								boxShadow: 'none',
							}}
						>
							<Typography 
								variant="h6" 
								className="font-semibold mb-4 text-gray-900" 
								sx={{ 
									fontSize: '18px', 
									fontWeight: 600, 
									marginBottom: '16px',
									color: '#111827'
								}}
							>
								Copy & SEO (AI-assisted)
							</Typography>
							
							{/* AI Action Buttons */}
							<div className="flex flex-wrap gap-3 mb-6">
								<Button
									variant="outlined"
									size="medium"
									onClick={handleSuggestTitle}
									sx={{
										borderColor: '#d1d5db',
										color: '#374151',
										textTransform: 'none',
										fontSize: '14px',
										fontWeight: 500,
										padding: '10px 20px',
										borderRadius: '8px',
										minHeight: '42px',
										borderWidth: '1.5px',
										'&:hover': {
											borderColor: '#9ca3af',
											backgroundColor: '#f9fafb',
											borderWidth: '1.5px',
										},
									}}
								>
									Suggest title
								</Button>
								<Button
									variant="outlined"
									size="medium"
									onClick={handleGenerateBullets}
									sx={{
										borderColor: '#d1d5db',
										color: '#374151',
										textTransform: 'none',
										fontSize: '14px',
										fontWeight: 500,
										padding: '10px 20px',
										borderRadius: '8px',
										minHeight: '42px',
										borderWidth: '1.5px',
										'&:hover': {
											borderColor: '#9ca3af',
											backgroundColor: '#f9fafb',
											borderWidth: '1.5px',
										},
									}}
								>
									Generate 6 bullets
								</Button>
								<Button
									variant="outlined"
									size="medium"
									onClick={handleWriteDescription}
									sx={{
										borderColor: '#d1d5db',
										color: '#374151',
										textTransform: 'none',
										fontSize: '14px',
										fontWeight: 500,
										padding: '10px 20px',
										borderRadius: '8px',
										minHeight: '42px',
										borderWidth: '1.5px',
										'&:hover': {
											borderColor: '#9ca3af',
											backgroundColor: '#f9fafb',
											borderWidth: '1.5px',
										},
									}}
								>
									Write description
								</Button>
							</div>

							{/* Tone Dropdown */}
							<div className="mb-6">
								<FormControl fullWidth size="medium">
									<InputLabel id="tone-select-label" sx={{ fontSize: '14px' }}>Tone</InputLabel>
									<Select 
										labelId="tone-select-label"
										label="Tone"
										value={seoTone}
										onChange={(e) => setSeoTone(e.target.value)}
										sx={{
											borderRadius: '8px',
											fontSize: '14px',
											'& .MuiOutlinedInput-notchedOutline': {
												borderColor: '#d1d5db',
											},
											'&:hover .MuiOutlinedInput-notchedOutline': {
												borderColor: '#9ca3af',
											},
										}}
									>
										<MenuItem value="Neutral" sx={{ fontSize: '14px' }}>Neutral</MenuItem>
										<MenuItem value="Professional" sx={{ fontSize: '14px' }}>Professional</MenuItem>
										<MenuItem value="Casual" sx={{ fontSize: '14px' }}>Casual</MenuItem>
										<MenuItem value="Friendly" sx={{ fontSize: '14px' }}>Friendly</MenuItem>
										<MenuItem value="Formal" sx={{ fontSize: '14px' }}>Formal</MenuItem>
									</Select>
								</FormControl>
							</div>

							{/* SEO Title Field - Independent */}
							<div className="mb-6">
								<Controller
									name="meta_title"
									control={control}
									render={({ field }) => {
										const currentValue = field.value || '';
										return (
											<TextField
												{...field}
												fullWidth
												label="SEO title (≤ 70 chars)"
												placeholder="iPhone 16 Pro Max 256GB — QC-Verified, Same-Day Delivery"
												size="medium"
												error={!!errors.meta_title}
												helperText={`${currentValue.length}/70 ${errors?.meta_title?.message ? ' - ' + errors.meta_title.message : ''}`}
												sx={{
													'& .MuiOutlinedInput-root': {
														borderRadius: '8px',
														fontSize: '14px',
														'& .MuiOutlinedInput-notchedOutline': {
															borderColor: '#d1d5db',
														},
														'&:hover .MuiOutlinedInput-notchedOutline': {
															borderColor: '#9ca3af',
														},
														'&.Mui-focused .MuiOutlinedInput-notchedOutline': {
															borderColor: '#3b82f6',
															borderWidth: '2px',
														},
													},
													'& .MuiInputBase-input': {
														padding: '12px 14px',
														color: '#111827',
													},
													'& .MuiInputLabel-root': {
														fontSize: '14px',
														color: '#6b7280',
													},
													'& .MuiFormHelperText-root': {
														fontSize: '12px',
														marginTop: '4px',
													},
												}}
											/>
										);
									}}
								/>
							</div>

							{/* Meta Description Field - Independent */}
							<div className="mb-6">
								<Controller
									name="meta_description"
									control={control}
									render={({ field }) => {
										const currentValue = field.value || '';
										return (
											<TextField
												{...field}
												fullWidth
												label="Meta description (≤ 160 chars)"
												placeholder="Fast same-day delivery, 1-year AccessoryShield, verified device with invoice."
												multiline
												rows={2}
												size="medium"
												error={!!errors.meta_description}
												helperText={`${currentValue.length}/160 ${errors?.meta_description?.message ? ' - ' + errors.meta_description.message : ''}`}
												sx={{
													'& .MuiOutlinedInput-root': {
														borderRadius: '8px',
														fontSize: '14px',
														'& .MuiOutlinedInput-notchedOutline': {
															borderColor: '#d1d5db',
														},
														'&:hover .MuiOutlinedInput-notchedOutline': {
															borderColor: '#9ca3af',
														},
														'&.Mui-focused .MuiOutlinedInput-notchedOutline': {
															borderColor: '#3b82f6',
															borderWidth: '2px',
														},
													},
													'& .MuiInputBase-input': {
														padding: '12px 14px',
														color: '#111827',
														lineHeight: '1.5',
													},
													'& .MuiInputLabel-root': {
														fontSize: '14px',
														color: '#6b7280',
													},
													'& .MuiFormHelperText-root': {
														fontSize: '12px',
														marginTop: '4px',
													},
												}}
											/>
										);
									}}
								/>
							</div>

							{/* Description Field - Independent */}
							<div className="mb-4">
								<Controller
									name="description"
									control={control}
									render={({ field }) => (
										<TextField
											{...field}
											fullWidth
											label="Description"
											placeholder="Add what's in the box, condition notes, and warranty details..."
											multiline
											minRows={5}
											maxRows={12}
											size="medium"
											error={!!errors.description}
											helperText={errors?.description?.message as string}
											sx={{
												'& .MuiOutlinedInput-root': {
													borderRadius: '8px',
													fontSize: '14px',
													'& .MuiOutlinedInput-notchedOutline': {
														borderColor: '#d1d5db',
													},
													'&:hover .MuiOutlinedInput-notchedOutline': {
														borderColor: '#9ca3af',
													},
													'&.Mui-focused .MuiOutlinedInput-notchedOutline': {
														borderColor: '#3b82f6',
														borderWidth: '2px',
													},
													'& textarea': {
														overflow: 'auto !important',
														resize: 'vertical',
														minHeight: '120px !important',
														fontFamily: 'inherit',
													},
												},
												'& .MuiInputBase-input': {
													padding: '12px 14px',
													color: '#111827',
													lineHeight: '1.5',
												},
												'& .MuiInputLabel-root': {
													fontSize: '14px',
													color: '#6b7280',
												},
												'& .MuiFormHelperText-root': {
													fontSize: '12px',
													marginTop: '4px',
												},
											}}
										/>
									)}
								/>
							</div>

							<Typography 
								variant="caption" 
								className="text-gray-500" 
								sx={{ 
									fontSize: '12px', 
									color: '#6b7280', 
									display: 'block', 
									marginTop: '12px',
									lineHeight: '1.5'
								}}
							>
								Structured schema will include brand/model/MPN from MPID automatically.
							</Typography>
						</Paper>

						{/* QC & Policies Section - Step 7 */}
						<Paper 
							ref={(el) => setSectionRef(7, el as HTMLElement)}
							className="p-3 sm:p-4 lg:p-6" 
							id="qc-policies"
							data-step-id="7"
							sx={{
								borderRadius: '16px',
								scrollMarginTop: '80px',
								border: '1px solid #e5e7eb',
								boxShadow: 'none',
								backgroundColor: '#ffffff',
							}}
						>
							<Typography 
								variant="h6" 
								className="font-semibold mb-1 text-gray-900" 
								sx={{ 
									fontSize: '18px', 
									fontWeight: 600, 
									marginBottom: '8px',
									color: '#111827'
								}}
							>
								QC & Policies
							</Typography>
							<Typography 
								variant="body2" 
								className="text-gray-600 mb-4" 
								sx={{ 
									fontSize: '13px', 
									color: '#6b7280', 
									marginBottom: '24px',
									lineHeight: '1.5'
								}}
							>
								Set product condition, warranty, returns policy, and quality control details to build buyer trust.
							</Typography>

							{/* Quality Control Section */}
							<Box sx={{ marginBottom: '32px' }}>
								<Typography 
									variant="subtitle2" 
									sx={{ 
										fontSize: '14px', 
										fontWeight: 600, 
										color: '#374151',
										marginBottom: '16px',
										textTransform: 'uppercase',
										letterSpacing: '0.5px'
									}}
								>
									Quality Control
								</Typography>
								
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
									{/* Condition */}
									<Controller
										name="condition"
										control={control}
										render={({ field }) => {
											const hasError = condition === 'New' && (!galleryImages || galleryImages.length === 0);
											return (
												<FormControl fullWidth size="small" error={hasError}>
													<InputLabel>Condition *</InputLabel>
													<Select 
														{...field} 
														value={condition}
														label="Condition *"
														onChange={(e) => {
															const newCondition = e.target.value;
															field.onChange(e);
															// Validate if "New" is selected and no images
															if (newCondition === 'New' && (!galleryImages || galleryImages.length === 0)) {
																setValue('condition', newCondition, { shouldValidate: true });
															}
														}}
														sx={{
															borderRadius: '12px',
															fontSize: '14px',
															'& .MuiOutlinedInput-notchedOutline': {
																borderColor: hasError ? '#ef4444' : '#d1d5db',
															},
															'&:hover .MuiOutlinedInput-notchedOutline': {
																borderColor: hasError ? '#ef4444' : '#9ca3af',
															},
															'&.Mui-focused .MuiOutlinedInput-notchedOutline': {
																borderColor: hasError ? '#ef4444' : '#3b82f6',
																borderWidth: '2px',
															},
														}}
													>
														<MenuItem value="New">New</MenuItem>
														<MenuItem value="Like New">Like New</MenuItem>
														<MenuItem value="Refurbished">Refurbished</MenuItem>
														<MenuItem value="Used - Excellent">Used - Excellent</MenuItem>
														<MenuItem value="Used - Good">Used - Good</MenuItem>
														<MenuItem value="Used - Fair">Used - Fair</MenuItem>
													</Select>
													{hasError && (
														<Typography variant="caption" sx={{ color: '#ef4444', marginTop: '4px', fontSize: '12px' }}>
															New condition requires at least one picture
														</Typography>
													)}
												</FormControl>
											);
										}}
									/>

									{/* IMEI/Serial Number */}
									<Controller
										name="imei"
										control={control}
										render={({ field }) => (
											<TextField
												{...field}
												fullWidth
												label="IMEI/Serial Number"
												placeholder="Enter IMEI or serial number"
												size="small"
												error={!!errors.imei}
												helperText={errors?.imei?.message as string || "Optional: Add for verification"}
												sx={{
													'& .MuiOutlinedInput-root': {
														borderRadius: '12px',
														fontSize: '14px',
														'& .MuiOutlinedInput-notchedOutline': {
															borderColor: '#d1d5db',
														},
														'&:hover .MuiOutlinedInput-notchedOutline': {
															borderColor: '#9ca3af',
														},
														'&.Mui-focused .MuiOutlinedInput-notchedOutline': {
															borderColor: '#3b82f6',
															borderWidth: '2px',
														},
													},
													'& .MuiInputBase-input': {
														padding: '12px 14px',
														color: '#111827',
													},
													'& .MuiFormHelperText-root': {
														fontSize: '11px',
														marginTop: '4px',
													},
												}}
											/>
										)}
									/>
								</div>

								{/* Condition Notes */}
								<Controller
									name="condition_notes"
									control={control}
									render={({ field }) => (
										<TextField
											{...field}
											fullWidth
											label="Condition Notes"
											placeholder="Describe any wear, scratches, imperfections, or special conditions..."
											value={conditionNotes}
											multiline
											minRows={3}
											maxRows={5}
											size="medium"
											error={!!errors.condition_notes}
											helperText={errors?.condition_notes?.message as string || "Optional: Detailed notes help buyers make informed decisions"}
											sx={{
												'& .MuiOutlinedInput-root': {
													borderRadius: '12px',
													fontSize: '14px',
													'& .MuiOutlinedInput-notchedOutline': {
														borderColor: '#d1d5db',
													},
													'&:hover .MuiOutlinedInput-notchedOutline': {
														borderColor: '#9ca3af',
													},
													'&.Mui-focused .MuiOutlinedInput-notchedOutline': {
														borderColor: '#3b82f6',
														borderWidth: '2px',
													},
													'& textarea': {
														overflow: 'auto !important',
														resize: 'vertical',
														minHeight: '90px !important',
														fontFamily: 'inherit',
													},
												},
												'& .MuiInputBase-input': {
													padding: '12px 14px',
													color: '#111827',
													lineHeight: '1.5',
												},
												'& .MuiFormHelperText-root': {
													fontSize: '11px',
													marginTop: '4px',
												},
											}}
										/>
									)}
								/>
							</Box>

							<Divider sx={{ marginY: '32px', borderColor: '#e5e7eb' }} />

							{/* Policies Section */}
							<Box sx={{ marginBottom: '24px' }}>
								<Typography 
									variant="subtitle2" 
									sx={{ 
										fontSize: '14px', 
										fontWeight: 600, 
										color: '#374151',
										marginBottom: '16px',
										textTransform: 'uppercase',
										letterSpacing: '0.5px'
									}}
								>
									Policies & Warranty
								</Typography>
								
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
									{/* Returns Policy */}
									<Controller
										name="returns"
										control={control}
										render={({ field }) => (
											<FormControl fullWidth size="small">
												<InputLabel>Returns Policy *</InputLabel>
												<Select 
													{...field} 
													value={returns}
													label="Returns Policy *"
													sx={{
														borderRadius: '12px',
														fontSize: '14px',
														'& .MuiOutlinedInput-notchedOutline': {
															borderColor: '#d1d5db',
														},
														'&:hover .MuiOutlinedInput-notchedOutline': {
															borderColor: '#9ca3af',
														},
														'&.Mui-focused .MuiOutlinedInput-notchedOutline': {
															borderColor: '#3b82f6',
															borderWidth: '2px',
														},
													}}
												>
													<MenuItem value="7-day returns">7-day returns</MenuItem>
													<MenuItem value="14-day returns">14-day returns</MenuItem>
													<MenuItem value="30-day returns">30-day returns</MenuItem>
													<MenuItem value="No returns">No returns</MenuItem>
												</Select>
											</FormControl>
										)}
									/>

									{/* Manufacturer Warranty */}
									<Controller
										name="warranty"
										control={control}
										render={({ field }) => (
											<TextField
												{...field}
												fullWidth
												label="Manufacturer Warranty"
												placeholder="e.g., 1-year manufacturer warranty"
												value={warranty}
												size="small"
												error={!!errors.warranty}
												helperText={errors?.warranty?.message as string || "Optional: Warranty details"}
												sx={{
													'& .MuiOutlinedInput-root': {
														borderRadius: '12px',
														fontSize: '14px',
														'& .MuiOutlinedInput-notchedOutline': {
															borderColor: '#d1d5db',
														},
														'&:hover .MuiOutlinedInput-notchedOutline': {
															borderColor: '#9ca3af',
														},
														'&.Mui-focused .MuiOutlinedInput-notchedOutline': {
															borderColor: '#3b82f6',
															borderWidth: '2px',
														},
													},
													'& .MuiInputBase-input': {
														padding: '12px 14px',
														color: '#111827',
													},
													'& .MuiFormHelperText-root': {
														fontSize: '11px',
														marginTop: '4px',
													},
												}}
											/>
										)}
									/>
								</div>
							</Box>

							<Divider sx={{ marginY: '24px', borderColor: '#e5e7eb' }} />

							{/* Box Contents Section */}
							<Box>
								<Typography 
									variant="subtitle2" 
									sx={{ 
										fontSize: '14px', 
										fontWeight: 600, 
										color: '#374151',
										marginBottom: '16px',
										textTransform: 'uppercase',
										letterSpacing: '0.5px'
									}}
								>
									Box Contents
								</Typography>
								
								<Controller
									name="box_contents"
									control={control}
									render={({ field }) => (
										<TextField
											{...field}
											fullWidth
											label="What's Included"
											placeholder="List all items included in the box (e.g., Device, Charger, USB-C cable, SIM tool, Documentation, Original box, Warranty card)"
											value={boxContents}
											multiline
											minRows={3}
											maxRows={5}
											size="medium"
											error={!!errors.box_contents}
											helperText={errors?.box_contents?.message as string || "Be specific about what's included to set accurate buyer expectations"}
											sx={{
												'& .MuiOutlinedInput-root': {
													borderRadius: '12px',
													fontSize: '14px',
													'& .MuiOutlinedInput-notchedOutline': {
														borderColor: '#d1d5db',
													},
													'&:hover .MuiOutlinedInput-notchedOutline': {
														borderColor: '#9ca3af',
													},
													'&.Mui-focused .MuiOutlinedInput-notchedOutline': {
														borderColor: '#3b82f6',
														borderWidth: '2px',
													},
													'& textarea': {
														overflow: 'auto !important',
														resize: 'vertical',
														minHeight: '90px !important',
														fontFamily: 'inherit',
													},
												},
												'& .MuiInputBase-input': {
													padding: '12px 14px',
													color: '#111827',
													lineHeight: '1.5',
												},
												'& .MuiFormHelperText-root': {
													fontSize: '11px',
													marginTop: '4px',
												},
											}}
										/>
									)}
								/>
							</Box>

							<Box 
								sx={{ 
									marginTop: '24px',
									padding: '12px 16px',
									backgroundColor: '#f3f4f6',
									borderRadius: '8px',
									borderLeft: '3px solid #3b82f6'
								}}
							>
								<Typography 
									variant="caption" 
									sx={{ 
										fontSize: '12px', 
										color: '#4b5563', 
										lineHeight: '1.6',
										display: 'block'
									}}
								>
									<strong>💡 Tip:</strong> QC-verified products with detailed condition notes and complete box contents build buyer trust and reduce returns. Be accurate and transparent.
								</Typography>
							</Box>
						</Paper>

						{/* Offers Section - Step 8 */}
						<Paper 
							ref={(el) => setSectionRef(8, el as HTMLElement)}
							className="p-3 sm:p-4" 
							id="offers"
							data-step-id="8"
							sx={{
								borderRadius: '16px',
								scrollMarginTop: '80px',
								border: '1px solid #e5e7eb',
								boxShadow: 'none',
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
							ref={(el) => setSectionRef(9, el as HTMLElement)}
							className="p-3 sm:p-4" 
							id="trust"
							data-step-id="9"
							sx={{
								borderRadius: '16px',
								scrollMarginTop: '80px',
								border: '1px solid #e5e7eb',
								boxShadow: 'none',
							}}
						>
							<Typography variant="h6" className="font-semibold mb-1 text-gray-900" sx={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px' }}>
								Trust & Compliance
							</Typography>
							<Typography variant="body2" className="text-gray-600 mb-3" sx={{ fontSize: '13px', color: '#6b7280', marginBottom: '10px' }}>
								Exclusive MultiKonnect safeguards to reduce fraud and elevate buyer confidence.
							</Typography>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
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
							ref={(el) => setSectionRef(10, el as HTMLElement)}
							className="p-0" 
							id="preview"
							data-step-id="10"
							sx={{
								borderRadius: '16px',
								scrollMarginTop: '80px',
								border: '1px solid #e5e7eb',
								boxShadow: 'none',
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
							<div className="p-3 sm:p-4">
								<div className={`grid gap-4 ${previewMode === 'mobile' ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-[1.1fr_0.9fr]'}`}>
									<div 
										className={`rounded-xl overflow-hidden relative bg-gray-100 ${
											previewMode === 'mobile' ? 'h-[300px] sm:h-[360px]' : 'h-[360px]'
										}`}
										style={{
											borderRadius: '14px',
										}}
									>
										{Array.isArray(galleryImages) && galleryImages.length > 0 ? (
											<>
												{/* Main Featured Image - show featured image or first image */}
												<img
													src={(() => {
														// Double-check that galleryImages is an array
														const images = Array.isArray(galleryImages) ? galleryImages : [];
														if (images.length === 0) return '';
														const featured = images.find((img: any) => img && img.is_featured);
														const first = images.find((img: any) => img && img.url);
														return (featured || first)?.url || '';
													})()}
													alt={productTitle || 'Product'}
													className="w-full h-full object-contain"
													style={{
														objectFit: 'contain',
													}}
													onError={(e) => {
														console.error('Image load error:', e);
													}}
												/>
												{/* Image Counter Badge */}
												{galleryImages.length > 1 && (
													<div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded-md text-xs font-semibold">
														{galleryImages.length} images
													</div>
												)}
												{/* Thumbnail Navigation */}
												{Array.isArray(galleryImages) && galleryImages.length > 1 && (
													<div className="absolute bottom-2 left-2 right-2 flex gap-2 overflow-x-auto pb-1">
														{galleryImages.filter((img: any) => img && img.url).slice(0, 5).map((img: any, idx: number) => {
															// Double-check that galleryImages is an array before using .some()
															const images = Array.isArray(galleryImages) ? galleryImages : [];
															const isFeatured = img.is_featured || (idx === 0 && !images.some((i: any) => i && i.is_featured));
															return (
																<div
																	key={idx}
																	className="flex-shrink-0 w-12 h-12 rounded border-2 border-white overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
																	style={{
																		borderColor: isFeatured ? '#ff6536' : 'white',
																	}}
																	onClick={() => {
																		// Switch featured image
																		if (!Array.isArray(galleryImages)) return;
																		const updated = galleryImages.map((img, i) => ({
																			...img,
																			is_featured: i === idx,
																		}));
																		setValue('gallery_images', updated, { shouldDirty: true });
																	}}
																>
																	{img && img.url && (
																		<img
																			src={img.url}
																			alt={`Thumbnail ${idx + 1}`}
																			className="w-full h-full object-cover"
																			onError={(e) => {
																				console.error('Thumbnail load error:', e);
																			}}
																		/>
																	)}
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
									<div className="w-full">
										<Typography variant="h5" className="font-bold mb-2" sx={{ fontSize: { xs: '18px', sm: '20px' }, fontWeight: 700, marginBottom: '6px' }}>
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
										<div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center mb-2">
											<div className="flex items-center border border-gray-300 rounded-xl px-3 py-2 flex-1 sm:flex-initial sm:max-w-[220px]" style={{ borderRadius: '12px' }}>
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
												fullWidth={previewMode === 'mobile'}
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
													fontSize: { xs: '14px', sm: '13px' },
													padding: { xs: '10px 16px', sm: '8px 16px' },
													minHeight: { xs: '44px', sm: '36px' },
													whiteSpace: previewMode === 'mobile' ? 'normal' : 'nowrap',
												}}
											>
												{previewMode === 'mobile' ? (
													<span>
														Add<br />to cart
													</span>
												) : (
													'Add to cart'
												)}
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

				{/* Mobile Right Sidebar Overlay */}
				{rightSidebarOpen && (
					<div 
						className="fixed inset-0 bg-black bg-opacity-50 z-[60] lg:hidden"
						onClick={() => setRightSidebarOpen(false)}
						style={{ top: '60px' }}
					/>
				)}

				{/* Right Sidebar - Listing Score & Actions */}
				<aside 
					className={`fixed lg:static w-[320px] max-w-[85vw] lg:max-w-none bg-white border-l overflow-y-auto flex-shrink-0 z-[70] lg:z-auto transition-transform duration-300 ease-in-out ${
						rightSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
					}`}
					style={{ 
						borderLeftColor: '#e5e7eb',
						borderLeftWidth: '1px',
						height: 'calc(100vh - 60px)',
						top: '60px',
						right: 0,
						boxShadow: rightSidebarOpen ? '-2px 0 8px rgba(0,0,0,0.1)' : 'none'
					}}
				>
					{/* Close button for mobile */}
					<div className="lg:hidden flex justify-end p-2 border-b">
						<IconButton
							onClick={() => setRightSidebarOpen(false)}
							size="small"
							sx={{ color: '#6b7280' }}
						>
							<FuseSvgIcon>heroicons-outline:x-mark</FuseSvgIcon>
						</IconButton>
					</div>
					<div className="p-3 sm:p-4 lg:p-5 space-y-4 sm:space-y-5">
						{/* Listing Score */}
						<div>
							<div className="flex items-center justify-between mb-3">
								<Typography variant="h6" className="font-semibold text-gray-900" sx={{ fontSize: '16px', fontWeight: 600 }}>
									Listing Score
								</Typography>
								<Chip 
									label={listingScore} 
									sx={{
										backgroundColor: listingScore >= 80 ? '#10b981' : listingScore >= 60 ? '#f59e0b' : '#ef4444',
										color: '#fff',
										fontSize: '14px',
										fontWeight: 700,
										height: '28px',
										borderRadius: '999px',
										padding: '0 12px',
									}}
								/>
							</div>
							<LinearProgress
								variant="determinate"
								value={listingScore}
								sx={{
									height: 8,
									borderRadius: '999px',
									backgroundColor: '#e5e7eb',
									'& .MuiLinearProgress-bar': {
										background: listingScore >= 80 
											? 'linear-gradient(90deg, #22c55e, #10b981)' 
											: listingScore >= 60 
											? 'linear-gradient(90deg, #f59e0b, #fbbf24)' 
											: 'linear-gradient(90deg, #ef4444, #dc2626)',
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
								onClick={handleSaveDraft}
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
								onClick={handlePreviewClick}
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
			</div>

			{/* Bottom Bar - Light Grey */}
			<div 
				className="border-t px-3 sm:px-6 py-2 sm:py-3 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0 flex-shrink-0 sticky bottom-0 z-40" 
				style={{ 
					backgroundColor: '#f3f4f6',
					borderTopColor: '#e5e7eb',
					minHeight: '56px'
				}}
			>
				<div className="flex items-center space-x-2 sm:space-x-3 flex-wrap justify-center">
					{mpidMatched && (
						<Chip 
							label="MPID matched" 
							size="small"
							sx={{
								backgroundColor: '#ffffff',
								border: '1px solid #e5e7eb',
								fontSize: '12px',
								height: '28px',
								fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
								color: '#374151',
								padding: '4px 12px',
								borderRadius: '16px',
								fontWeight: 500,
							}}
						/>
					)}
					{variants.length > 0 && (
						<Chip 
							label="Per-variant images" 
							size="small"
							sx={{
								backgroundColor: '#ffffff',
								border: '1px solid #e5e7eb',
								fontSize: '12px',
								height: '28px',
								fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
								color: '#374151',
								padding: '4px 12px',
								borderRadius: '16px',
								fontWeight: 500,
							}}
						/>
					)}
					{storePostcode && (
						<Chip 
							label="Same-day enabled" 
							size="small"
							sx={{
								backgroundColor: '#ffffff',
								border: '1px solid #e5e7eb',
								fontSize: '12px',
								height: '28px',
								fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
								color: '#374151',
								padding: '4px 12px',
								borderRadius: '16px',
								fontWeight: 500,
							}}
						/>
					)}
				</div>
				<div className="flex items-center space-x-1 sm:space-x-2">
					<Button 
						variant="text" 
						size="small"
						onClick={handleSaveDraft}
						className="hidden sm:flex"
						sx={{
							color: '#374151',
							textTransform: 'none',
							fontSize: { xs: '11px', sm: '13px' },
							padding: { xs: '6px 12px', sm: '8px 16px' },
							borderRadius: '8px',
							minHeight: '36px',
							fontWeight: 500,
							backgroundColor: 'transparent',
							'&:hover': {
								backgroundColor: 'rgba(0, 0, 0, 0.04)',
							},
						}}
					>
						Save draft
					</Button>
					<Button 
						variant="text" 
						size="small"
						onClick={handlePreviewClick}
						className="hidden sm:flex"
						sx={{
							color: '#374151',
							textTransform: 'none',
							fontSize: { xs: '11px', sm: '13px' },
							padding: { xs: '6px 12px', sm: '8px 16px' },
							borderRadius: '8px',
							minHeight: '36px',
							fontWeight: 500,
							backgroundColor: 'transparent',
							'&:hover': {
								backgroundColor: 'rgba(0, 0, 0, 0.04)',
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
							fontSize: { xs: '11px', sm: '13px' },
							padding: { xs: '6px 16px', sm: '8px 20px' },
							fontWeight: 600,
							borderRadius: '8px',
							minHeight: '36px',
							boxShadow: 'none',
							'&:hover': { 
								backgroundColor: '#e55a2b',
								boxShadow: 'none',
							},
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

			{/* Import from Other Seller Modal - Use the dedicated ImportProductModal component */}
			<ImportProductModal 
				open={importVendorDialogOpen} 
				onClose={() => setImportVendorDialogOpen(false)}
				mode="select"
				onProductSelect={handleSelectVendorProduct}
			/>

			{/* Add Storage Dialog - Dynamic */}
			<Dialog open={addStorageDialogOpen} onClose={() => { setAddStorageDialogOpen(false); setNewStorageInput(''); }} PaperProps={{ sx: { borderRadius: '16px' } }} maxWidth="sm" fullWidth>
				<DialogTitle>
					<div className="flex items-center justify-between">
						<span>Add {attribute1Name} Option</span>
						<IconButton 
							size="small" 
							onClick={() => {
								setEditingAttribute('attribute1');
								setNewAttributeName(attribute1Name);
								setShowAttributeNameDialog(true);
							}}
							sx={{ padding: '4px' }}
						>
							<FuseSvgIcon size={16} sx={{ color: '#6b7280' }}>heroicons-outline:pencil</FuseSvgIcon>
						</IconButton>
					</div>
				</DialogTitle>
				<DialogContent>
					<TextField
						autoFocus
						fullWidth
						label={`${attribute1Name} (e.g., 256GB, 512GB, Small, Large)`}
						placeholder={`Enter ${attribute1Name.toLowerCase()} option`}
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

			{/* Add Color Dialog - Dynamic */}
			<Dialog open={addColorDialogOpen} onClose={() => { setAddColorDialogOpen(false); setNewColorInput(''); }} PaperProps={{ sx: { borderRadius: '16px' } }} maxWidth="sm" fullWidth>
				<DialogTitle>
					<div className="flex items-center justify-between">
						<span>Add {attribute2Name} Option</span>
						<IconButton 
							size="small" 
							onClick={() => {
								setEditingAttribute('attribute2');
								setNewAttributeName(attribute2Name);
								setShowAttributeNameDialog(true);
							}}
							sx={{ padding: '4px' }}
						>
							<FuseSvgIcon size={16} sx={{ color: '#6b7280' }}>heroicons-outline:pencil</FuseSvgIcon>
						</IconButton>
					</div>
				</DialogTitle>
				<DialogContent>
					<TextField
						autoFocus
						fullWidth
						label={`${attribute2Name} (e.g., Black, White, Blue, Small, Medium)`}
						placeholder={`Enter ${attribute2Name.toLowerCase()} option`}
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

			{/* Fee Settings Dialog - Admin Configuration (Per Product) */}
			<Dialog 
				open={feeSettingsDialogOpen} 
				onClose={() => setFeeSettingsDialogOpen(false)} 
				PaperProps={{ sx: { borderRadius: '16px' } }} 
				maxWidth="sm" 
				fullWidth
			>
				<DialogTitle>Configure Fee Settings</DialogTitle>
				<DialogContent>
					<Typography variant="body2" sx={{ color: '#6b7280', marginBottom: 3 }}>
						Set the fee rates for this specific product. These settings are saved with the product and will be used for fee calculations.
					</Typography>
					<Typography variant="caption" sx={{ color: '#9ca3af', display: 'block', marginBottom: 2, fontStyle: 'italic' }}>
						Note: Shipping charges are set by vendors/sellers in the delivery section, not here.
					</Typography>
					
					<TextField
						fullWidth
						label="Commission Rate (%)"
						type="number"
						value={(tempFeeSettings.commissionRate * 100).toFixed(2)}
						onChange={(e) => {
							const value = parseFloat(e.target.value) || 0;
							setTempFeeSettings({
								...tempFeeSettings,
								commissionRate: value / 100
							});
						}}
						InputProps={{
							endAdornment: <InputAdornment position="end">%</InputAdornment>,
						}}
						sx={{ marginBottom: 2 }}
						helperText="Percentage of sale price (e.g., 2.5 for 2.5%)"
					/>
					
					
					<TextField
						fullWidth
						label="Promotional Fee (£)"
						type="number"
						value={tempFeeSettings.promoFee}
						onChange={(e) => {
							setTempFeeSettings({
								...tempFeeSettings,
								promoFee: parseFloat(e.target.value) || 0
							});
						}}
						InputProps={{
							startAdornment: <InputAdornment position="start">£</InputAdornment>,
						}}
						sx={{ marginBottom: 2 }}
						helperText="Additional fee for promotional listings (optional)"
					/>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setFeeSettingsDialogOpen(false)}>Cancel</Button>
					<Button 
						onClick={() => {
							// Save fees to extraFields (product-specific)
							setValue('extraFields', {
								...extraFields,
								commissionRate: tempFeeSettings.commissionRate,
								promoFee: tempFeeSettings.promoFee,
							}, { shouldDirty: true });
							setFeeSettings(tempFeeSettings);
							setFeeSettingsDialogOpen(false);
						}} 
						variant="contained"
					>
						Save Settings
					</Button>
				</DialogActions>
			</Dialog>
		</div>
	);
}

export default MultiKonnectListingCreation;

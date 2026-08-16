import React, { useState, useEffect } from 'react';
import {
  Store,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Check,
  CheckCircle2,
  Upload,
  Image as ImageIcon,
  Gem,
  Shirt,
  Flower2,
  Gift,
  Utensils,
  Home,
  Palette,
  Watch,
  Layers,
  MessageCircle,
  Instagram,
  Copy,
  ExternalLink,
  Plus,
  Trash2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { BusinessCategory, StoreTemplateId, StorePalette } from '../types';
import { TEMPLATES, COLOR_PRESETS } from '../lib/templates';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { uploadImageFile, deleteStorageFile } from '../lib/storage';

interface OnboardingWizardProps {
  onNavigate: (route: string) => void;
}

interface TempProduct {
  name: string;
  price: string;
  compareAtPrice?: string;
  category: string;
  shortDescription?: string;
  sku?: string;
  images: string[];
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onNavigate }) => {
  const { user, setStoreState, refreshAuth } = useAuth();

  // Wizard Step: 1 to 6, then 7 for initial products, 8 for live congratulations
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Step 1: Business Name & Slug
  const [businessName, setBusinessName] = useState('Aarohi Jewels');
  const [slug, setSlug] = useState('aarohi-jewels');
  const [isSlugAvailable, setIsSlugAvailable] = useState<boolean | null>(true);
  const [checkingSlug, setCheckingSlug] = useState(false);

  // Step 2: Category
  const [category, setCategory] = useState<BusinessCategory>('Jewellery');

  // Step 3: Details
  const [instagram, setInstagram] = useState('aarohijewels');
  const [whatsapp, setWhatsapp] = useState('9876543210');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [email, setEmail] = useState(user?.email || 'aarohi@example.com');
  const [city, setCity] = useState('Jaipur');
  const [state, setState] = useState('Rajasthan');
  const [description, setDescription] = useState('Handcrafted artisan jewellery made with love in Jaipur.');

  // Step 4: Logo
  const [logoUrl, setLogoUrl] = useState<string>('https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=300&auto=format&fit=crop&q=80');
  const [noLogo, setNoLogo] = useState<boolean>(false);
  const [uploadingLogo, setUploadingLogo] = useState<boolean>(false);
  const [logoError, setLogoError] = useState<string>('');

  // Step 5: Template
  const [templateId, setTemplateId] = useState<StoreTemplateId>('jewellery-elegant');

  // Step 6: Colors
  const [colors, setColors] = useState<StorePalette>(TEMPLATES['jewellery-elegant'].defaultColors);

  // Step 7: Products during onboarding
  const [products, setProducts] = useState<TempProduct[]>([
    {
      name: 'Freshwater Pearl Necklace',
      price: '899',
      compareAtPrice: '1299',
      category: 'Necklaces',
      shortDescription: 'AAA Grade natural freshwater pearls with 22k gold plated clasp.',
      sku: 'AJ-101',
      images: ['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&auto=format&fit=crop&q=80'],
    },
    {
      name: 'Gold Tone Flower Earrings',
      price: '599',
      compareAtPrice: '899',
      category: 'Earrings',
      shortDescription: 'Intricate blooming flower stud earrings with delicate drop beads.',
      sku: 'AJ-102',
      images: ['https://images.unsplash.com/photo-1630019852942-f89202989a59?w=600&auto=format&fit=crop&q=80'],
    },
  ]);

  // Current product form state
  const [currentProdName, setCurrentProdName] = useState('');
  const [currentProdPrice, setCurrentProdPrice] = useState('');
  const [currentProdCompare, setCurrentProdCompare] = useState('');
  const [currentProdCategory, setCurrentProdCategory] = useState('');
  const [currentProdDesc, setCurrentProdDesc] = useState('');
  const [currentProdSku, setCurrentProdSku] = useState('');
  const [currentProdImage, setCurrentProdImage] = useState('https://images.unsplash.com/photo-1611591475102-468e7c5be384?w=600&auto=format&fit=crop&q=80');
  const [uploadingProdImage, setUploadingProdImage] = useState<boolean>(false);
  const [prodImageError, setProdImageError] = useState<string>('');

  // Step 8: Published store result
  const [publishedSlug, setPublishedSlug] = useState('');
  const [copied, setCopied] = useState(false);

  // Auto generate slug from business name
  const handleNameChange = (val: string) => {
    setBusinessName(val);
    const suggestedSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    setSlug(suggestedSlug);
  };

  // Populate dynamic defaults for newly registered seller
  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
    if (user?.name && user.name !== 'Aarohi Sharma' && user.name !== 'Platform Admin' && user.name !== 'Seller') {
      const brand = `${user.name}'s Store`;
      setBusinessName(brand);
      const suggested = brand
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      setSlug(suggested);
    }
  }, [user]);

  // Debounced slug check
  useEffect(() => {
    if (!slug) return;
    const timer = setTimeout(async () => {
      setCheckingSlug(true);
      try {
        const res = await api.checkSlug(slug);
        setIsSlugAvailable(res.available);
      } catch {
        setIsSlugAvailable(true);
      } finally {
        setCheckingSlug(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [slug]);

  // Handle Logo Upload to Supabase Storage
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoError('');
    setError('');
    setUploadingLogo(true);

    try {
      const result = await uploadImageFile(file, 'store-logos', {
        storeId: slug || 'store',
        userId: user?.id,
      });

      setLogoUrl(result.url);
      setNoLogo(false);
    } catch (err: any) {
      setLogoError(err.message || 'Failed to upload logo.');
    } finally {
      setUploadingLogo(false);
      // Reset input value so same file can be reselected if needed
      e.target.value = '';
    }
  };

  // Handle Product Image Upload to Supabase Storage
  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProdImageError('');
    setError('');
    setUploadingProdImage(true);

    try {
      const result = await uploadImageFile(file, 'product-images', {
        storeId: slug || 'store',
        userId: user?.id,
      });

      setCurrentProdImage(result.url);
    } catch (err: any) {
      setProdImageError(err.message || 'Failed to upload product image.');
    } finally {
      setUploadingProdImage(false);
      // Reset input value so same file can be reselected if needed
      e.target.value = '';
    }
  };

  // Remove a product from the list and clean up its storage file if applicable
  const handleRemoveProduct = async (idx: number) => {
    const item = products[idx];
    if (item && Array.isArray(item.images) && item.images[0]) {
      const imgUrl = item.images[0];
      // Clean up Supabase storage file asynchronously in the background
      deleteStorageFile(imgUrl, 'product-images').catch(() => {});
    }
    setProducts(products.filter((_, i) => i !== idx));
  };

  // Add Product to list
  const handleAddProduct = () => {
    if (uploadingProdImage) {
      setError('Please wait for the product image upload to finish.');
      return;
    }

    if (!currentProdName || !currentProdPrice) {
      setError('Please provide at least product name and price.');
      return;
    }

    if (products.length >= 10) {
      setError('Free plan allows maximum 10 active products.');
      return;
    }

    if (currentProdImage.startsWith('data:image/')) {
      setError('Product image must be a valid uploaded remote URL.');
      return;
    }

    setProducts([
      ...products,
      {
        name: currentProdName,
        price: currentProdPrice,
        compareAtPrice: currentProdCompare || undefined,
        category: currentProdCategory || category,
        shortDescription: currentProdDesc || '',
        sku: currentProdSku || undefined,
        images: [currentProdImage],
      },
    ]);

    // Reset inputs
    setCurrentProdName('');
    setCurrentProdPrice('');
    setCurrentProdCompare('');
    setCurrentProdCategory('');
    setCurrentProdDesc('');
    setCurrentProdSku('');
    setProdImageError('');
    setError('');
  };

  // Final Publish Store
  const handleCompleteAndPublish = async () => {
    if (uploadingLogo || uploadingProdImage) {
      setError('Please wait until all image uploads have finished.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Validate WhatsApp number (Module 4)
      const cleanWa = whatsapp.replace(/[^0-9]/g, '');
      if (cleanWa.length < 10) {
        throw new Error('Please enter a valid 10-digit WhatsApp number.');
      }

      const res = await api.completeOnboarding({
        name: businessName,
        slug,
        category,
        instagram,
        whatsapp: cleanWa.startsWith('91') ? cleanWa : `91${cleanWa}`,
        phone: phone || whatsapp,
        email: email || user?.email,
        city,
        state,
        description,
        logoUrl: noLogo ? '' : logoUrl,
        templateId,
        colors,
        firstProducts: products,
      });

      // Explicitly publish the store to Supabase so status becomes 'published'
      let finalStore = res.store;
      try {
        const publishRes = await api.publishStore();
        if (publishRes && publishRes.store) {
          finalStore = publishRes.store;
        }
      } catch (pubErr) {
        console.warn('Publish store immediate call warning:', pubErr);
      }

      setPublishedSlug(finalStore.slug);
      setStoreState(finalStore, res.business);
      setStep(8); // Show completion
    } catch (err: any) {
      setError(err.message || 'Failed to create your store. Please check all details.');
    } finally {
      setLoading(false);
    }
  };

  const categoriesList: { name: BusinessCategory; icon: any }[] = [
    { name: 'Jewellery', icon: Gem },
    { name: 'Fashion', icon: Shirt },
    { name: 'Handmade', icon: Sparkles },
    { name: 'Gifts', icon: Gift },
    { name: 'Beauty', icon: Flower2 },
    { name: 'Bakery / Food', icon: Utensils },
    { name: 'Home Décor', icon: Home },
    { name: 'Crafts', icon: Palette },
    { name: 'Accessories', icon: Watch },
    { name: 'Other', icon: Layers },
  ];

  return (
    <div className="min-h-[85vh] bg-[#FDFCF9] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Step Indicator Header (Steps 1 to 6 & 7) */}
        {step <= 7 && (
          <div className="mb-8 text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#F3F0E9] text-[#3D3D3D] border border-[#E5E2D9] text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-[#5D6D5F]" />
              <span>Step {step <= 6 ? `${step} of 6` : 'Add First Products'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-light text-[#1A1A1A]">
              {step === 1 && <span>What is your <span className="font-semibold">business called?</span></span>}
              {step === 2 && <span>Choose your <span className="font-semibold">business category</span></span>}
              {step === 3 && <span>Enter <span className="font-semibold">Instagram &amp; WhatsApp</span> details</span>}
              {step === 4 && <span>Upload your <span className="font-semibold">business logo</span></span>}
              {step === 5 && <span>Choose a <span className="font-semibold">store template</span></span>}
              {step === 6 && <span>Customize <span className="font-semibold">store colours</span></span>}
              {step === 7 && <span>Add Your <span className="font-semibold">First Products</span></span>}
            </h1>
            <p className="text-xs sm:text-sm text-[#6B6B6B]">
              {step === 1 && 'We will generate your personalized store URL automatically.'}
              {step === 2 && 'This helps us configure recommended filters and styles.'}
              {step === 3 && 'Customers will receive instant WhatsApp messages to order directly.'}
              {step === 4 && 'Your logo will appear on your store header and product previews.'}
              {step === 5 && 'Pick a mobile-first theme that highlights your brand.'}
              {step === 6 && 'Select palette presets or adjust accent tones.'}
              {step === 7 && `Add up to 10 active products for free (${products.length}/10 added).`}
            </p>

            {/* Progress Bar */}
            <div className="w-full bg-[#E5E2D9] h-2 rounded-full overflow-hidden max-w-md mx-auto">
              <div
                className="bg-[#5D6D5F] h-full transition-all duration-300 rounded-full"
                style={{ width: `${(step / 7) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Wizard Main Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-xs border border-[#E5E2D9] relative">
          {error && (
            <div className="mb-6 p-3.5 rounded-2xl bg-[#FDF2F2] border border-[#F8D7DA] text-[#A94442] text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: BUSINESS NAME */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] mb-2">
                  Business Name *
                </label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Aarohi Jewellery"
                  className="w-full px-4 py-3 bg-[#F9F8F5] border border-[#E5E2D9] rounded-full text-sm font-semibold text-[#1A1A1A] focus:ring-2 focus:ring-[#5D6D5F] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] mb-2">
                  Your Free Store Link (Slug) *
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#8A8A8A] font-mono hidden sm:inline">microstore.in/store/</span>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    className="w-full px-4 py-3 bg-[#F9F8F5] border border-[#E5E2D9] rounded-full text-xs font-mono text-[#1A1A1A] focus:ring-2 focus:ring-[#5D6D5F] focus:outline-none"
                  />
                </div>

                <div className="mt-2 text-xs flex items-center gap-2">
                  {checkingSlug ? (
                    <span className="text-[#8A8A8A]">Checking availability...</span>
                  ) : isSlugAvailable ? (
                    <span className="text-[#3D7A4F] font-medium flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>URL is available: microstore.in/store/{slug}</span>
                    </span>
                  ) : (
                    <span className="text-[#C0392B] font-medium">
                      Store URL &apos;{slug}&apos; is already taken. Please modify.
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  disabled={!businessName.trim() || !slug.trim() || !isSlugAvailable}
                  onClick={() => setStep(2)}
                  className="px-6 py-3 bg-[#5D6D5F] hover:bg-[#4A584C] text-white font-bold text-xs rounded-full shadow-xs transition flex items-center gap-2 disabled:opacity-50"
                >
                  <span>NEXT: CHOOSE CATEGORY</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: CATEGORY */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {categoriesList.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = category === cat.name;
                  return (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => setCategory(cat.name)}
                      className={`p-4 rounded-3xl border text-left transition flex flex-col items-start gap-2 ${
                        isSelected
                          ? 'border-[#5D6D5F] bg-[#F3F0E9] ring-2 ring-[#5D6D5F]/30'
                          : 'border-[#E5E2D9] bg-[#FDFCF9] hover:bg-[#F3F0E9]'
                      }`}
                    >
                      <div className={`p-2.5 rounded-2xl ${isSelected ? 'bg-[#5D6D5F] text-white' : 'bg-white text-[#5D6D5F] border border-[#E5E2D9]'}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-xs text-[#1A1A1A]">{cat.name}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 text-[#6B6B6B] hover:text-[#1A1A1A] font-semibold text-xs rounded-full flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-6 py-3 bg-[#5D6D5F] hover:bg-[#4A584C] text-white font-bold text-xs rounded-full shadow-xs transition flex items-center gap-2"
                >
                  <span>NEXT: BUSINESS DETAILS</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: BUSINESS DETAILS */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1A1A1A] mb-1.5">
                    WhatsApp Number (Mandatory) *
                  </label>
                  <div className="relative">
                    <MessageCircle className="w-4 h-4 text-[#25D366] absolute left-3.5 top-3" />
                    <input
                      type="tel"
                      required
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full pl-10 pr-3 py-2.5 bg-[#F9F8F5] border border-[#E5E2D9] rounded-full text-xs text-[#1A1A1A] font-medium focus:ring-2 focus:ring-[#5D6D5F] focus:outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-[#8A8A8A] mt-1">Orders will be delivered to this WhatsApp number.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1A1A1A] mb-1.5">
                    Instagram Handle
                  </label>
                  <div className="relative">
                    <Instagram className="w-4 h-4 text-[#C4A484] absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value.replace(/^@/, ''))}
                      placeholder="e.g. aarohijewels"
                      className="w-full pl-10 pr-3 py-2.5 bg-[#F9F8F5] border border-[#E5E2D9] rounded-full text-xs text-[#1A1A1A] focus:ring-2 focus:ring-[#5D6D5F] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1A1A1A] mb-1.5">
                    City
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Jaipur"
                    className="w-full px-3 py-2.5 bg-[#F9F8F5] border border-[#E5E2D9] rounded-full text-xs text-[#1A1A1A] focus:ring-2 focus:ring-[#5D6D5F] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1A1A1A] mb-1.5">
                    State
                  </label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="e.g. Rajasthan"
                    className="w-full px-3 py-2.5 bg-[#F9F8F5] border border-[#E5E2D9] rounded-full text-xs text-[#1A1A1A] focus:ring-2 focus:ring-[#5D6D5F] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] mb-1.5">
                  Short Business Description (Optional)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell your customers about your craft, origin, or specialty..."
                  className="w-full px-4 py-2.5 bg-[#F9F8F5] border border-[#E5E2D9] rounded-2xl text-xs text-[#1A1A1A] focus:ring-2 focus:ring-[#5D6D5F] focus:outline-none resize-none"
                />
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2.5 text-[#6B6B6B] hover:text-[#1A1A1A] font-semibold text-xs rounded-full flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  disabled={!whatsapp.trim()}
                  onClick={() => setStep(4)}
                  className="px-6 py-3 bg-[#5D6D5F] hover:bg-[#4A584C] text-white font-bold text-xs rounded-full shadow-xs transition flex items-center gap-2 disabled:opacity-50"
                >
                  <span>NEXT: LOGO</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: LOGO */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-3xl bg-[#F9F8F5] border border-[#E5E2D9]">
                <div className="w-24 h-24 rounded-2xl bg-white border border-[#E5E2D9] shadow-xs flex items-center justify-center overflow-hidden shrink-0 relative">
                  {uploadingLogo ? (
                    <div className="flex flex-col items-center justify-center gap-1.5 text-[#5D6D5F]">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span className="text-[10px] font-semibold">Uploading...</span>
                    </div>
                  ) : noLogo ? (
                    <div className="w-full h-full bg-[#5D6D5F] text-white font-serif font-bold text-3xl flex items-center justify-center">
                      {businessName.charAt(0).toUpperCase()}
                    </div>
                  ) : logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-[#8A8A8A]" />
                  )}
                </div>

                <div className="space-y-3 text-center sm:text-left flex-1">
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm text-[#1A1A1A]">Upload Your Brand Logo</h4>
                    <p className="text-xs text-[#6B6B6B]">Supports PNG, JPG, JPEG, WEBP (Max 5MB)</p>
                    {logoError && (
                      <p className="text-xs text-[#C0392B] font-medium flex items-center gap-1 justify-center sm:justify-start">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{logoError}</span>
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                    <label className={`cursor-pointer px-4 py-2 bg-[#5D6D5F] hover:bg-[#4A584C] text-white text-xs font-semibold rounded-full flex items-center gap-1.5 shadow-xs transition ${uploadingLogo ? 'opacity-50 pointer-events-none' : ''}`}>
                      {uploadingLogo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                      <span>{uploadingLogo ? 'Uploading Logo...' : 'Choose Logo File'}</span>
                      <input type="file" accept="image/jpeg,image/png,image/webp,image/jpg" onChange={handleLogoUpload} disabled={uploadingLogo} className="hidden" />
                    </label>

                    <button
                      type="button"
                      disabled={uploadingLogo}
                      onClick={() => {
                        setNoLogo(true);
                        setLogoUrl('');
                        setLogoError('');
                      }}
                      className="px-4 py-2 bg-white hover:bg-[#F3F0E9] text-[#1A1A1A] border border-[#E5E2D9] text-xs font-semibold rounded-full transition disabled:opacity-50"
                    >
                      I Don&apos;t Have a Logo
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-4 py-2.5 text-[#6B6B6B] hover:text-[#1A1A1A] font-semibold text-xs rounded-full flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  disabled={uploadingLogo}
                  onClick={() => setStep(5)}
                  className="px-6 py-3 bg-[#5D6D5F] hover:bg-[#4A584C] text-white font-bold text-xs rounded-full shadow-xs transition flex items-center gap-2 disabled:opacity-50"
                >
                  <span>NEXT: CHOOSE TEMPLATE</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: TEMPLATES (5 PRESETS) */}
          {step === 5 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.values(TEMPLATES).map((tmpl) => {
                  const isSelected = templateId === tmpl.id;
                  return (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => {
                        setTemplateId(tmpl.id);
                        setColors(tmpl.defaultColors);
                      }}
                      className={`p-4 rounded-3xl border text-left transition flex flex-col justify-between ${
                        isSelected
                          ? 'border-[#5D6D5F] bg-[#F3F0E9] ring-2 ring-[#5D6D5F]/30'
                          : 'border-[#E5E2D9] bg-[#FDFCF9] hover:bg-[#F3F0E9]'
                      }`}
                    >
                      <div>
                        <div className={`h-24 rounded-2xl bg-gradient-to-br ${tmpl.previewGradient} flex items-center justify-center p-3 text-white mb-3 shadow-inner`}>
                          <div className="text-center">
                            <span className="text-xs font-bold">{tmpl.name}</span>
                          </div>
                        </div>
                        <h4 className="font-bold text-xs text-[#1A1A1A]">{tmpl.name}</h4>
                        <p className="text-[11px] text-[#6B6B6B] mt-1 leading-snug">{tmpl.tagline}</p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-[#E5E2D9] flex items-center justify-between text-[11px]">
                        <span className="text-[#8A8A8A]">{tmpl.category}</span>
                        {isSelected && <span className="font-bold text-[#5D6D5F]">Selected ✓</span>}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="px-4 py-2.5 text-[#6B6B6B] hover:text-[#1A1A1A] font-semibold text-xs rounded-full flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(6)}
                  className="px-6 py-3 bg-[#5D6D5F] hover:bg-[#4A584C] text-white font-bold text-xs rounded-full shadow-xs transition flex items-center gap-2"
                >
                  <span>NEXT: STORE COLOURS</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 6: STORE COLOURS */}
          {step === 6 && (
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] mb-2">
                  Pick A Curated Palette
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {COLOR_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setColors(preset.colors)}
                      className="p-3 rounded-2xl bg-[#F9F8F5] border border-[#E5E2D9] hover:border-[#5D6D5F] text-left transition flex items-center gap-2"
                    >
                      <div className="flex -space-x-1">
                        <span className="w-4 h-4 rounded-full border border-white" style={{ backgroundColor: preset.colors.primary }} />
                        <span className="w-4 h-4 rounded-full border border-white" style={{ backgroundColor: preset.colors.accent }} />
                      </div>
                      <span className="text-xs font-semibold text-[#1A1A1A] truncate">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Pickers */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-semibold text-[#6B6B6B] mb-1">Primary Color</label>
                  <div className="flex items-center gap-2 p-2 bg-[#F9F8F5] rounded-2xl border border-[#E5E2D9]">
                    <input
                      type="color"
                      value={colors.primary}
                      onChange={(e) => setColors({ ...colors, primary: e.target.value })}
                      className="w-7 h-7 rounded-full border-none cursor-pointer"
                    />
                    <span className="text-xs font-mono">{colors.primary}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#6B6B6B] mb-1">Accent Background</label>
                  <div className="flex items-center gap-2 p-2 bg-[#F9F8F5] rounded-2xl border border-[#E5E2D9]">
                    <input
                      type="color"
                      value={colors.accent}
                      onChange={(e) => setColors({ ...colors, accent: e.target.value })}
                      className="w-7 h-7 rounded-full border-none cursor-pointer"
                    />
                    <span className="text-xs font-mono">{colors.accent}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#6B6B6B] mb-1">Page Canvas</label>
                  <div className="flex items-center gap-2 p-2 bg-[#F9F8F5] rounded-2xl border border-[#E5E2D9]">
                    <input
                      type="color"
                      value={colors.background}
                      onChange={(e) => setColors({ ...colors, background: e.target.value })}
                      className="w-7 h-7 rounded-full border-none cursor-pointer"
                    />
                    <span className="text-xs font-mono">{colors.background}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#6B6B6B] mb-1">Text Color</label>
                  <div className="flex items-center gap-2 p-2 bg-[#F9F8F5] rounded-2xl border border-[#E5E2D9]">
                    <input
                      type="color"
                      value={colors.text}
                      onChange={(e) => setColors({ ...colors, text: e.target.value })}
                      className="w-7 h-7 rounded-full border-none cursor-pointer"
                    />
                    <span className="text-xs font-mono">{colors.text}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(5)}
                  className="px-4 py-2.5 text-[#6B6B6B] hover:text-[#1A1A1A] font-semibold text-xs rounded-full flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(7)}
                  className="px-6 py-3 bg-[#5D6D5F] hover:bg-[#4A584C] text-white font-bold text-xs rounded-full shadow-xs transition flex items-center gap-2"
                >
                  <span>NEXT: ADD PRODUCTS</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 7: ADD INITIAL PRODUCTS */}
          {step === 7 && (
            <div className="space-y-6">
              {/* Product Counter Badge */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#F3F0E9] border border-[#E5E2D9] text-[#1A1A1A] text-xs font-semibold">
                <span>Free Plan Limit: Maximum 10 Active Products</span>
                <span className="bg-[#5D6D5F] text-white px-2.5 py-0.5 rounded-full font-bold">
                  {products.length} / 10 Products Added
                </span>
              </div>

              {/* Existing Added Products List */}
              {products.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-[#6B6B6B] uppercase tracking-wider">Ready to Publish:</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {products.map((p, idx) => (
                      <div key={idx} className="p-3 bg-[#F9F8F5] rounded-2xl border border-[#E5E2D9] flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <img src={p.images[0]} alt={p.name} className="w-10 h-10 rounded-xl object-cover bg-stone-200 shrink-0 border border-[#E5E2D9]" referrerPolicy="no-referrer" />
                          <div>
                            <div className="font-bold text-xs text-[#1A1A1A] truncate max-w-[150px]">{p.name}</div>
                            <div className="text-[11px] text-[#5D6D5F] font-semibold">₹{p.price}</div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveProduct(idx)}
                          className="p-1.5 text-[#8A8A8A] hover:text-[#C0392B] rounded-lg transition"
                          title="Remove product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add New Product Form */}
              {products.length < 10 && (
                <div className="p-4 rounded-3xl bg-[#F9F8F5] border border-[#E5E2D9] space-y-3">
                  <h4 className="font-bold text-xs text-[#1A1A1A] uppercase tracking-wider flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-[#5D6D5F]" />
                    <span>Add A Product</span>
                  </h4>

                  {prodImageError && (
                    <p className="text-xs text-[#C0392B] font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{prodImageError}</span>
                    </p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-4 flex flex-col items-center justify-center p-3 bg-white rounded-2xl border border-[#E5E2D9] relative">
                      {uploadingProdImage ? (
                        <div className="w-20 h-20 rounded-xl bg-[#F9F8F5] border border-[#E5E2D9] mb-2 flex flex-col items-center justify-center gap-1 text-[#5D6D5F]">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span className="text-[9px] font-semibold">Uploading...</span>
                        </div>
                      ) : (
                        <img src={currentProdImage} alt="Product" className="w-20 h-20 rounded-xl object-cover mb-2 border border-[#E5E2D9]" referrerPolicy="no-referrer" />
                      )}

                      <label className={`cursor-pointer text-[11px] text-[#5D6D5F] font-semibold hover:underline flex items-center gap-1 ${uploadingProdImage ? 'opacity-50 pointer-events-none' : ''}`}>
                        {uploadingProdImage && <Loader2 className="w-3 h-3 animate-spin" />}
                        <span>{uploadingProdImage ? 'Uploading...' : 'Upload Photo'}</span>
                        <input type="file" accept="image/jpeg,image/png,image/webp,image/jpg" onChange={handleProductImageUpload} disabled={uploadingProdImage} className="hidden" />
                      </label>
                    </div>

                    <div className="sm:col-span-8 space-y-2">
                      <input
                        type="text"
                        value={currentProdName}
                        onChange={(e) => setCurrentProdName(e.target.value)}
                        placeholder="Product Name (e.g. Kundan Bracelet) *"
                        className="w-full px-3.5 py-2 bg-white border border-[#E5E2D9] rounded-full text-xs text-[#1A1A1A] focus:outline-none"
                      />

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          value={currentProdPrice}
                          onChange={(e) => setCurrentProdPrice(e.target.value)}
                          placeholder="Price (₹) *"
                          className="w-full px-3.5 py-2 bg-white border border-[#E5E2D9] rounded-full text-xs text-[#1A1A1A] focus:outline-none"
                        />
                        <input
                          type="number"
                          value={currentProdCompare}
                          onChange={(e) => setCurrentProdCompare(e.target.value)}
                          placeholder="MRP / Original (₹)"
                          className="w-full px-3.5 py-2 bg-white border border-[#E5E2D9] rounded-full text-xs text-[#1A1A1A] focus:outline-none"
                        />
                      </div>

                      <input
                        type="text"
                        value={currentProdDesc}
                        onChange={(e) => setCurrentProdDesc(e.target.value)}
                        placeholder="Short description (optional)"
                        className="w-full px-3.5 py-2 bg-white border border-[#E5E2D9] rounded-full text-xs text-[#1A1A1A] focus:outline-none"
                      />

                      <button
                        type="button"
                        disabled={uploadingProdImage}
                        onClick={handleAddProduct}
                        className="w-full py-2.5 bg-[#1A1A1A] hover:bg-[#2E332F] text-white font-semibold text-xs rounded-full shadow-xs transition disabled:opacity-50"
                      >
                        + Add To Store List
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(6)}
                  className="px-4 py-2.5 text-[#6B6B6B] hover:text-[#1A1A1A] font-semibold text-xs rounded-full flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  disabled={loading || products.length === 0 || uploadingProdImage || uploadingLogo}
                  onClick={handleCompleteAndPublish}
                  className="px-8 py-3.5 bg-[#5D6D5F] hover:bg-[#4A584C] text-white font-bold text-xs sm:text-sm rounded-full shadow-xs transition flex items-center gap-2 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{loading ? 'PUBLISHING STORE...' : 'PUBLISH MY FREE STORE'}</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 8: SUCCESS CELEBRATION & SHARE */}
          {step === 8 && (
            <div className="py-6 text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-full bg-[#E8F3EA] text-[#3D7A4F] flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <h2 className="text-3xl font-light text-[#1A1A1A]">🎉 Your Store Is <span className="font-semibold text-[#5D6D5F]">Live!</span></h2>
                <p className="text-xs sm:text-sm text-[#6B6B6B] max-w-md mx-auto">
                  Congratulations <strong>{businessName}</strong>! Your WhatsApp ordering micro store is now published and ready to take customer orders.
                </p>
              </div>

              {/* Store URL Box */}
              <div className="max-w-md mx-auto p-4 bg-[#F9F8F5] rounded-3xl border border-[#E5E2D9] space-y-3">
                <label className="block text-xs font-semibold text-[#1A1A1A] text-left">
                  Your Public Storefront URL:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/store/${publishedSlug}`}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#E5E2D9] rounded-full text-xs font-mono text-[#1A1A1A] select-all"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/store/${publishedSlug}`);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2500);
                    }}
                    className={`px-4 py-2.5 rounded-full text-xs font-semibold flex items-center gap-1 shrink-0 transition ${
                      copied ? 'bg-[#3D7A4F] text-white' : 'bg-[#5D6D5F] text-white hover:bg-[#4A584C]'
                    }`}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => onNavigate(`store/${publishedSlug}`)}
                  className="w-full sm:w-auto px-6 py-3 bg-[#5D6D5F] hover:bg-[#4A584C] text-white font-bold text-xs rounded-full shadow-xs transition flex items-center justify-center gap-2"
                >
                  <span>VIEW PUBLIC STORE</span>
                  <ExternalLink className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    refreshAuth();
                    onNavigate('dashboard');
                  }}
                  className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-[#F3F0E9] text-[#1A1A1A] border border-[#E5E2D9] font-bold text-xs rounded-full shadow-xs transition"
                >
                  GO TO SELLER DASHBOARD
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

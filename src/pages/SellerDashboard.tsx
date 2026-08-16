import React, { useState, useEffect } from 'react';
import {
  Store as StoreIcon,
  Plus,
  Edit2,
  Trash2,
  Copy,
  ExternalLink,
  Share2,
  TrendingUp,
  Eye,
  MessageCircle,
  Users,
  Settings,
  Package,
  Layers,
  Sparkles,
  AlertCircle,
  Check,
  CheckCircle2,
  X,
  Upload,
  Globe,
  CreditCard,
  BarChart3,
  RefreshCw,
  Sliders,
  Phone,
  Instagram,
  Lock,
} from 'lucide-react';
import { Product, Store, Business, AnalyticsSummary, StoreTemplateId, StorePalette } from '../types';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { TEMPLATES, COLOR_PRESETS } from '../lib/templates';
import { ShareStoreModal } from '../components/ShareStoreModal';
import { uploadImageFile } from '../lib/storage';

interface SellerDashboardProps {
  onNavigate: (route: string) => void;
}

export const SellerDashboard: React.FC<SellerDashboardProps> = ({ onNavigate }) => {
  const { user, refreshAuth } = useAuth();

  // Tab State
  const [activeTab, setActiveTab] = useState<'home' | 'products' | 'store' | 'analytics' | 'share'>('home');
  const [timeframe, setTimeframe] = useState<number>(30); // 1 for today, 7 for week, 30 for month

  // Data States
  const [store, setStore] = useState<Store | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionError, setActionError] = useState<string>('');
  const [actionSuccess, setActionSuccess] = useState<string>('');

  // Modals & Drawers
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isUnpublishModalOpen, setIsUnpublishModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Product Form Fields
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodCompare, setProdCompare] = useState('');
  const [prodCategory, setProdCategory] = useState('');
  const [prodShortDesc, setProdShortDesc] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodSku, setProdSku] = useState('');
  const [prodStock, setProdStock] = useState<'in_stock' | 'low_stock' | 'out_of_stock' | 'made_to_order'>('in_stock');
  const [prodImages, setProdImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&auto=format&fit=crop&q=80',
  ]);
  const [prodIsActive, setProdIsActive] = useState<boolean>(true);
  const [prodIsFeatured, setProdIsFeatured] = useState<boolean>(false);
  const [submittingProduct, setSubmittingProduct] = useState(false);

  // Store Settings Form Fields
  const [editBizName, setEditBizName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editInstagram, setEditInstagram] = useState('');
  const [editWhatsapp, setEditWhatsapp] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editState, setEditState] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editLogoUrl, setEditLogoUrl] = useState('');
  const [editTemplateId, setEditTemplateId] = useState<StoreTemplateId>('jewellery-elegant');
  const [editColors, setEditColors] = useState<StorePalette>(TEMPLATES['jewellery-elegant'].defaultColors);
  const [editTagline, setEditTagline] = useState('');
  const [editAnnouncement, setEditAnnouncement] = useState('');
  const [savingStore, setSavingStore] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingProdImage, setUploadingProdImage] = useState(false);

  // Fetch Dashboard Data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [storeData, productsData, analyticsData] = await Promise.all([
        api.getSellerStore(),
        api.getProducts(),
        api.getSellerAnalytics(timeframe),
      ]);

      const loadedProducts = Array.isArray(productsData?.products) ? productsData.products : [];
      console.log(`[DIAGNOSTICS] SellerDashboard loaded:`, {
        authenticatedSellerId: user?.id,
        resolvedBusinessId: storeData?.business?.id,
        resolvedStoreId: storeData?.store?.id,
        frontendReceivedProductCount: loadedProducts.length,
        totalProducts: productsData?.totalProducts ?? loadedProducts.length,
        activeProducts:
          productsData?.activeProducts ??
          loadedProducts.filter((p: Product) => p.isActive && !p.isSuspended).length,
      });

      setStore(storeData.store);
      setBusiness(storeData.business);
      setProducts(loadedProducts);
      setAnalytics(analyticsData);

      // Populate store settings
      if (storeData.business) {
        setEditBizName(storeData.business.name);
        setEditCategory(storeData.business.category);
        setEditInstagram(storeData.business.instagram);
        setEditWhatsapp(storeData.business.whatsapp);
        setEditPhone(storeData.business.phone);
        setEditEmail(storeData.business.email);
        setEditCity(storeData.business.city);
        setEditState(storeData.business.state);
        setEditDesc(storeData.business.description);
        setEditLogoUrl(storeData.business.logoUrl || '');
      }
      if (storeData.store) {
        setEditTemplateId(storeData.store.templateId);
        setEditColors(storeData.store.colors);
        setEditTagline(storeData.store.tagline || '');
        setEditAnnouncement(storeData.store.announcement || '');
      }
    } catch (err: any) {
      if (err.message?.includes('No store found')) {
        onNavigate('onboarding');
      } else {
        setActionError(err.message || 'Failed to load store data');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [timeframe]);

  // Open Product Create / Edit Modal
  const openProductModal = (product?: Product) => {
    setActionError('');
    if (product) {
      setEditingProduct(product);
      setProdName(product.name);
      setProdPrice(String(product.price));
      setProdCompare(product.compareAtPrice ? String(product.compareAtPrice) : '');
      setProdCategory(product.category);
      setProdShortDesc(product.shortDescription || '');
      setProdDesc(product.description || '');
      setProdSku(product.sku || '');
      setProdStock(product.stockStatus);
      setProdImages(product.images.length > 0 ? product.images : ['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&auto=format&fit=crop&q=80']);
      setProdIsActive(product.isActive);
      setProdIsFeatured(product.isFeatured);
    } else {
      setEditingProduct(null);
      setProdName('');
      setProdPrice('');
      setProdCompare('');
      setProdCategory(business?.category || 'General');
      setProdShortDesc('');
      setProdDesc('');
      setProdSku('');
      setProdStock('in_stock');
      setProdImages(['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&auto=format&fit=crop&q=80']);
      setProdIsActive(true);
      setProdIsFeatured(false);
    }
    setIsProductModalOpen(true);
  };

  // Handle Product Save (Create or Update)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName || !prodPrice) {
      setActionError('Product Name and Price are required.');
      return;
    }

    setSubmittingProduct(true);
    setActionError('');

    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, {
          name: prodName,
          price: Number(prodPrice),
          compareAtPrice: prodCompare ? Number(prodCompare) : undefined,
          category: prodCategory,
          shortDescription: prodShortDesc,
          description: prodDesc,
          sku: prodSku || undefined,
          stockStatus: prodStock,
          images: prodImages,
          isActive: prodIsActive,
          isFeatured: prodIsFeatured,
        });
        setActionSuccess('Product updated successfully!');
      } else {
        await api.createProduct({
          name: prodName,
          price: Number(prodPrice),
          compareAtPrice: prodCompare ? Number(prodCompare) : undefined,
          category: prodCategory,
          shortDescription: prodShortDesc,
          description: prodDesc,
          sku: prodSku || undefined,
          stockStatus: prodStock,
          images: prodImages,
          isActive: prodIsActive,
          isFeatured: prodIsFeatured,
        });
        setActionSuccess('Product added to your store!');
      }

      setIsProductModalOpen(false);
      fetchData();
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err: any) {
      setActionError(err.message || 'Failed to save product');
    } finally {
      setSubmittingProduct(false);
    }
  };

  // Delete Product
  const handleDeleteProduct = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await api.deleteProduct(id);
      fetchData();
      setActionSuccess('Product deleted.');
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err: any) {
      setActionError(err.message || 'Failed to delete product');
    }
  };

  // Duplicate Product
  const handleDuplicateProduct = async (id: string) => {
    try {
      await api.duplicateProduct(id);
      fetchData();
      setActionSuccess('Product duplicated.');
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err: any) {
      setActionError(err.message || 'Failed to duplicate product');
    }
  };

  // Toggle Active/Inactive Product
  const handleToggleProductActive = async (product: Product) => {
    try {
      await api.updateProduct(product.id, { isActive: !product.isActive });
      fetchData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to update product status');
    }
  };

  // View Live Store with diagnostics
  const handleViewLive = () => {
    if (!store?.slug) return;
    const targetUrl = `/store/${store.slug}`;
    console.log(`[DIAGNOSTICS] View Live Store clicked:`, {
      urlBeingOpened: targetUrl,
      slugUsed: store.slug,
      currentStoreStatus: store.status,
      storeId: store.id,
    });
    onNavigate(`store/${store.slug}`);
  };

  // Toggle Store Publish Status
  const handleTogglePublish = async () => {
    if (!store) return;
    try {
      if (store.status === 'published') {
        setIsUnpublishModalOpen(true);
      } else {
        const res = await api.publishStore();
        if (res && res.store) {
          setStore(res.store);
        }
        await fetchData();
        setActionSuccess('Your store is now live!');
        setTimeout(() => setActionSuccess(''), 3000);
      }
    } catch (err: any) {
      console.error(`[DIAGNOSTICS] Publish store failed:`, err);
      setActionError(err.message || 'Failed to publish store. Please try again.');
    }
  };

  const handleConfirmUnpublish = async () => {
    try {
      const res = await api.unpublishStore();
      if (res && res.store) {
        setStore(res.store);
      }
      setIsUnpublishModalOpen(false);
      await fetchData();
      setActionSuccess('Store switched to draft mode.');
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err: any) {
      console.error(`[DIAGNOSTICS] Unpublish store failed:`, err);
      setActionError(err.message || 'Failed to unpublish store');
    }
  };

  // Save Store Settings
  const handleSaveStoreSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingStore(true);
    setActionError('');
    try {
      await api.updateSellerStore({
        businessName: editBizName,
        category: editCategory,
        instagram: editInstagram,
        whatsapp: editWhatsapp,
        phone: editPhone,
        email: editEmail,
        city: editCity,
        state: editState,
        description: editDesc,
        logoUrl: editLogoUrl,
        templateId: editTemplateId,
        colors: editColors,
        tagline: editTagline,
        announcement: editAnnouncement,
      });
      fetchData();
      setActionSuccess('Store settings updated successfully!');
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err: any) {
      setActionError(err.message || 'Failed to save store settings');
    } finally {
      setSavingStore(false);
    }
  };

  // Image Upload helper (Supabase Storage)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isLogo = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setActionError('');
    if (isLogo) {
      setUploadingLogo(true);
    } else {
      setUploadingProdImage(true);
    }

    try {
      const bucket = isLogo ? 'store-logos' : 'product-images';
      const result = await uploadImageFile(file, bucket, {
        storeId: store?.id || business?.slug || 'store',
        productId: editingProduct?.id || 'new',
        userId: user?.id,
      });

      if (isLogo) {
        setEditLogoUrl(result.url);
      } else {
        setProdImages([result.url]);
      }
    } catch (err: any) {
      setActionError(err.message || 'Image upload failed.');
    } finally {
      if (isLogo) {
        setUploadingLogo(false);
      } else {
        setUploadingProdImage(false);
      }
      e.target.value = '';
    }
  };

  const totalProductsCount = products.length;
  const activeProductsCount = products.filter((p) => p.isActive && !p.isSuspended).length;

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-[#FDFCF9]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#5D6D5F] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#8A8A8A] font-medium">Loading your natural store dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCF9] text-[#1A1A1A] pb-24 md:pb-12">
      {/* Top Banner / Alerts */}
      {actionSuccess && (
        <div className="bg-[#5D6D5F] text-white text-xs font-semibold py-2.5 px-4 text-center shadow-xs">
          ✓ {actionSuccess}
        </div>
      )}
      {actionError && (
        <div className="bg-[#B42318] text-white text-xs font-semibold py-2.5 px-4 text-center shadow-xs">
          ⚠️ {actionError}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Header greeting */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E5E2D9]">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#5D6D5F]">Seller Hub</span>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A]">
              Good Morning, {user?.name || business?.name || 'Seller'}
            </h1>
            <p className="text-xs text-[#8A8A8A] font-medium mt-0.5">
              {business?.name} • Category: <strong className="text-[#3D3D3D]">{business?.category}</strong>
              <span className="ml-2 text-[#5D6D5F] font-mono cursor-pointer" onClick={() => setIsShareModalOpen(true)}>[Copy Link]</span>
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => openProductModal()}
              className="px-6 py-2.5 bg-[#5D6D5F] hover:bg-[#4A584C] text-white text-xs font-bold rounded-full shadow-sm flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Product</span>
            </button>
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="px-4 py-2.5 bg-white hover:bg-[#F3F0E9] text-[#1A1A1A] text-xs font-semibold rounded-full border border-[#E5E2D9] shadow-xs flex items-center gap-1.5 transition"
            >
              <Share2 className="w-4 h-4 text-[#5D6D5F]" />
              <span>Share Store</span>
            </button>
            {store && (
              <>
                <button
                  onClick={() => onNavigate('preview')}
                  className="px-4 py-2.5 bg-white hover:bg-[#F3F0E9] text-[#1A1A1A] text-xs font-semibold rounded-full border border-[#E5E2D9] flex items-center gap-1.5 shadow-xs transition"
                >
                  <Eye className="w-3.5 h-3.5 text-[#5D6D5F]" />
                  <span>Preview</span>
                </button>
                {store.status === 'published' && (
                  <button
                    onClick={handleViewLive}
                    className="px-4 py-2.5 bg-[#1A1A1A] hover:bg-[#3D3D3D] text-white text-xs font-semibold rounded-full flex items-center gap-1.5 shadow-xs transition"
                  >
                    <span>View Live</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Tab Navigation (Desktop Header) */}
        <div className="hidden md:flex items-center gap-2 py-4 border-b border-[#E5E2D9] text-xs font-semibold">
          <button
            onClick={() => setActiveTab('home')}
            className={`px-5 py-2 rounded-full transition ${
              activeTab === 'home' ? 'bg-[#5D6D5F] text-white shadow-xs' : 'text-[#8A8A8A] hover:text-[#1A1A1A] hover:bg-[#F3F0E9]'
            }`}
          >
            Dashboard Home
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`px-5 py-2 rounded-full transition flex items-center gap-1.5 ${
              activeTab === 'products' ? 'bg-[#5D6D5F] text-white shadow-xs' : 'text-[#8A8A8A] hover:text-[#1A1A1A] hover:bg-[#F3F0E9]'
            }`}
          >
            <span>Products</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'products' ? 'bg-[#4A584C] text-white' : 'bg-[#EAE7DF] text-[#3D3D3D]'}`}>
              {activeProductsCount}/10
            </span>
          </button>
          <button
            onClick={() => setActiveTab('store')}
            className={`px-5 py-2 rounded-full transition ${
              activeTab === 'store' ? 'bg-[#5D6D5F] text-white shadow-xs' : 'text-[#8A8A8A] hover:text-[#1A1A1A] hover:bg-[#F3F0E9]'
            }`}
          >
            Store Settings &amp; Theme
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-5 py-2 rounded-full transition ${
              activeTab === 'analytics' ? 'bg-[#5D6D5F] text-white shadow-xs' : 'text-[#8A8A8A] hover:text-[#1A1A1A] hover:bg-[#F3F0E9]'
            }`}
          >
            Visitor &amp; WhatsApp Analytics
          </button>
          <button
            onClick={() => setActiveTab('share')}
            className={`px-5 py-2 rounded-full transition ${
              activeTab === 'share' ? 'bg-[#5D6D5F] text-white shadow-xs' : 'text-[#8A8A8A] hover:text-[#1A1A1A] hover:bg-[#F3F0E9]'
            }`}
          >
            Share &amp; Instagram Bio Link
          </button>
        </div>

        {/* TAB 1: DASHBOARD HOME */}
        {activeTab === 'home' && (
          <div className="py-6 space-y-6">
            {/* STORE STATUS CARD */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#E5E2D9] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#F3F0E9] border border-[#E5E2D9] flex items-center justify-center overflow-hidden shrink-0 font-serif italic text-[#5D6D5F] font-bold text-xl">
                  {business?.logoUrl ? (
                    <img src={business.logoUrl} alt={business.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <span>{business?.name?.slice(0, 2).toUpperCase() || 'ST'}</span>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-[#1A1A1A]">{business?.name}</h2>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1.5 ${
                        store?.status === 'published'
                          ? 'bg-[#E8F3EA] text-[#3D7A4F]'
                          : store?.status === 'suspended'
                          ? 'bg-[#FEF3F2] text-[#B42318]'
                          : 'bg-[#F3F0E9] text-[#8A8A8A]'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${store?.status === 'published' ? 'bg-[#3D7A4F] animate-pulse' : 'bg-[#8A8A8A]'}`} />
                      {store?.status === 'published' ? 'ONLINE' : store?.status === 'suspended' ? 'SUSPENDED' : 'DRAFT'}
                    </span>
                  </div>

                  <div className="text-xs text-[#8A8A8A] font-mono mt-0.5">
                    {window.location.origin}/store/{store?.slug}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <button
                  onClick={() => setIsShareModalOpen(true)}
                  className="flex-1 md:flex-none px-4 py-2 rounded-full bg-[#F3F0E9] hover:bg-[#EAE7DF] text-[#1A1A1A] border border-[#E5E2D9] text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  <Share2 className="w-3.5 h-3.5 text-[#5D6D5F]" />
                  <span>Share Store</span>
                </button>

                <button
                  onClick={handleViewLive}
                  className="flex-1 md:flex-none px-4 py-2 rounded-full bg-[#F3F0E9] hover:bg-[#EAE7DF] text-[#1A1A1A] border border-[#E5E2D9] text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Live</span>
                </button>

                <button
                  onClick={handleTogglePublish}
                  className={`flex-1 md:flex-none px-5 py-2 rounded-full text-xs font-semibold transition ${
                    store?.status === 'published'
                      ? 'bg-[#1A1A1A] hover:bg-[#3D3D3D] text-white'
                      : 'bg-[#5D6D5F] hover:bg-[#4A584C] text-white'
                  }`}
                >
                  {store?.status === 'published' ? 'Unpublish' : 'Publish Store'}
                </button>
              </div>
            </div>

            {/* DASHBOARD GRID: STATS & PRODUCTS + LIVE PHONE PREVIEW */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* LEFT COLUMN: STATS, RECENT PRODUCTS, UPSELL */}
              <div className="lg:col-span-8 space-y-6">
                {/* 3 STATS CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white p-5 rounded-3xl border border-[#E5E2D9] shadow-sm">
                    <p className="text-[11px] uppercase tracking-widest text-[#8A8A8A] font-bold mb-1">Store Visitors</p>
                    <p className="text-3xl font-light text-[#1A1A1A]">{analytics?.storeVisits || 0}</p>
                    <div className="mt-3 h-1.5 w-full bg-[#F3F0E9] rounded-full overflow-hidden">
                      <div className="w-2/3 h-full bg-[#5D6D5F] rounded-full"></div>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-3xl border border-[#E5E2D9] shadow-sm">
                    <p className="text-[11px] uppercase tracking-widest text-[#8A8A8A] font-bold mb-1">WhatsApp Enquiries</p>
                    <p className="text-3xl font-light text-[#1A1A1A]">{analytics?.whatsappClicks || 0}</p>
                    <div className="mt-3 h-1.5 w-full bg-[#F3F0E9] rounded-full overflow-hidden">
                      <div className="w-1/3 h-full bg-[#C4A484] rounded-full"></div>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-3xl border border-[#E5E2D9] shadow-sm">
                    <p className="text-[11px] uppercase tracking-widest text-[#8A8A8A] font-bold mb-1">Active Products</p>
                    <p className="text-3xl font-light text-[#1A1A1A]">
                      {activeProductsCount}
                      <span className="text-lg text-[#8A8A8A]"> / 10</span>
                    </p>
                    <div className="mt-3 h-1.5 w-full bg-[#F3F0E9] rounded-full overflow-hidden">
                      <div className="w-4/5 h-full bg-[#5D6D5F] rounded-full"></div>
                    </div>
                  </div>
                </div>

                {/* RECENT PRODUCTS */}
                <div className="bg-white rounded-3xl border border-[#E5E2D9] shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-[#F3F0E9] flex justify-between items-center">
                    <h3 className="font-bold text-[#1A1A1A] text-sm sm:text-base">Recent Products</h3>
                    <div className="flex items-center gap-3">
                      <span
                        onClick={() => setActiveTab('products')}
                        className="text-xs text-[#5D6D5F] font-semibold cursor-pointer hover:underline"
                      >
                        View All
                      </span>
                      <button
                        onClick={() => openProductModal()}
                        className="px-3.5 py-1.5 bg-[#5D6D5F] hover:bg-[#4A584C] text-white text-xs font-semibold rounded-full shadow-xs flex items-center gap-1 transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Product</span>
                      </button>
                    </div>
                  </div>

                  <div className="divide-y divide-[#F3F0E9]">
                    {products.length === 0 ? (
                      <div className="text-center py-10 px-4">
                        <Package className="w-8 h-8 text-[#BABABA] mx-auto mb-2" />
                        <p className="text-xs text-[#8A8A8A]">No products yet. Add your first item to begin.</p>
                      </div>
                    ) : (
                      products.slice(0, 4).map((product, idx) => (
                        <div key={product.id} className="flex items-center px-6 py-4 hover:bg-[#FDFCF9] transition">
                          <div className="w-12 h-12 bg-[#F3F0E9] rounded-2xl mr-4 flex items-center justify-center text-[#8A8A8A] font-bold text-xs shrink-0 overflow-hidden border border-[#E5E2D9]">
                            {product.images[0] ? (
                              <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <span>P{idx + 1}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0 pr-3">
                            <h4 className="font-bold text-sm text-[#1A1A1A] truncate">{product.name}</h4>
                            <p className="text-xs text-[#8A8A8A] italic truncate">{product.category} {product.sku ? `• SKU: ${product.sku}` : ''}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-bold text-sm text-[#1A1A1A]">₹{product.price}</p>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                product.stockStatus === 'in_stock'
                                  ? 'bg-[#E8F3EA] text-[#3D7A4F]'
                                  : product.stockStatus === 'low_stock'
                                  ? 'bg-[#FEF3F2] text-[#B42318]'
                                  : 'bg-[#F3F0E9] text-[#8A8A8A]'
                              }`}
                            >
                              {product.stockStatus === 'in_stock' ? 'In Stock' : product.stockStatus === 'low_stock' ? 'Low Stock' : 'Out of Stock'}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* UPSELL / COMING SOON CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-[#F3F0E9] p-4 rounded-2xl flex items-center justify-between border border-dashed border-[#C4A484]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-lg border border-[#E5E2D9]">🌐</div>
                      <div>
                        <p className="text-sm font-bold text-[#1A1A1A]">Custom Domain</p>
                        <p className="text-xs text-[#8A8A8A]">Connect your own web address</p>
                      </div>
                    </div>
                    <span className="text-[9px] bg-white text-[#C4A484] px-2 py-0.5 rounded-full font-bold uppercase border border-[#C4A484]">Coming Soon</span>
                  </div>

                  <div className="bg-[#F3F0E9] p-4 rounded-2xl flex items-center justify-between border border-dashed border-[#C4A484]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-lg border border-[#E5E2D9]">💳</div>
                      <div>
                        <p className="text-sm font-bold text-[#1A1A1A]">Online Payments</p>
                        <p className="text-xs text-[#8A8A8A]">Direct bank transfers &amp; UPI</p>
                      </div>
                    </div>
                    <span className="text-[9px] bg-white text-[#C4A484] px-2 py-0.5 rounded-full font-bold uppercase border border-[#C4A484]">Coming Soon</span>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: MOBILE LIVE PREVIEW SIDEBAR */}
              <div className="lg:col-span-4 bg-[#EAE7DF] rounded-[40px] p-6 border border-[#E5E2D9] relative overflow-hidden shadow-inner flex flex-col items-center justify-center min-h-[520px]">
                <p className="text-[10px] font-bold text-[#8A8A8A] uppercase tracking-widest mb-4">Live Store Preview</p>

                {/* PHONE FRAME */}
                <div className="w-[240px] h-[480px] bg-white rounded-[32px] shadow-2xl border-[6px] border-[#1A1A1A] overflow-hidden flex flex-col relative">
                  <div className="h-5 w-24 bg-[#1A1A1A] absolute top-0 left-1/2 -translate-x-1/2 rounded-b-xl z-20"></div>

                  {/* STORE FRONT CONTENT */}
                  <div className="flex-1 overflow-y-auto flex flex-col bg-[#FDFCF9]">
                    <div className="bg-[#FDFCF9] p-4 text-center border-b border-[#F3F0E9] mt-3">
                      <div className="w-12 h-12 bg-white rounded-full border border-[#E5E2D9] mx-auto flex items-center justify-center mb-2 font-serif italic text-[#5D6D5F] font-bold text-sm shadow-xs overflow-hidden">
                        {business?.logoUrl ? (
                          <img src={business.logoUrl} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <span>{business?.name?.slice(0, 2).toUpperCase() || 'AJ'}</span>
                        )}
                      </div>
                      <h5 className="font-bold text-xs text-[#1A1A1A] truncate">{business?.name || 'Aarohi Jewellery'}</h5>
                      <p className="text-[10px] text-[#8A8A8A] mb-2 line-clamp-2">{store?.tagline || business?.description || 'Curated boutique collection'}</p>
                      <div className="flex justify-center space-x-2">
                        <div className="w-5 h-5 rounded-full bg-[#EAE7DF] flex items-center justify-center text-[10px]">📷</div>
                        <div className="w-5 h-5 rounded-full bg-[#EAE7DF] flex items-center justify-center text-[10px]">💬</div>
                      </div>
                    </div>

                    <div className="p-3 grid grid-cols-2 gap-2">
                      {products.slice(0, 2).map((prod) => (
                        <div key={prod.id} className="bg-white border border-[#F3F0E9] rounded-xl overflow-hidden shadow-2xs">
                          <div className="h-20 bg-[#F9F8F5] flex items-center justify-center text-[10px] text-[#BABABA] overflow-hidden">
                            {prod.images[0] ? (
                              <img src={prod.images[0]} alt={prod.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <span>Image</span>
                            )}
                          </div>
                          <div className="p-2">
                            <p className="text-[9px] font-bold text-[#1A1A1A] truncate">{prod.name}</p>
                            <p className="text-[10px] font-bold text-[#5D6D5F]">₹{prod.price}</p>
                            <button className="w-full bg-[#25D366] text-white py-1 rounded-md text-[8px] mt-1 font-bold">
                              WhatsApp
                            </button>
                          </div>
                        </div>
                      ))}
                      {products.length < 2 && (
                        <div className="bg-white border border-[#F3F0E9] rounded-xl overflow-hidden opacity-50 p-2 text-center">
                          <div className="h-16 bg-[#F9F8F5] rounded flex items-center justify-center text-[8px] text-[#BABABA]">Add item</div>
                        </div>
                      )}
                    </div>

                    <div className="mt-auto p-2 border-t border-[#F3F0E9] text-center">
                      <p className="text-[8px] text-[#BABABA] uppercase tracking-tighter">Powered by MicroStore</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('store')}
                  className="mt-5 bg-white border border-[#E5E2D9] text-[#1A1A1A] px-5 py-2 rounded-full font-bold text-xs shadow-xs hover:bg-[#F3F0E9] transition"
                >
                  Edit Mobile Template
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PRODUCT MANAGEMENT CRUD */}
        {activeTab === 'products' && (
          <div className="py-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-[#1A1A1A]">Product Management</h2>
                <p className="text-xs text-[#8A8A8A]">
                  Free plan limit: <strong className="text-[#3D3D3D]">{activeProductsCount} / 10 active products used</strong>.
                </p>
              </div>

              <button
                onClick={() => openProductModal()}
                disabled={activeProductsCount >= 10}
                className="px-6 py-2.5 bg-[#5D6D5F] hover:bg-[#4A584C] disabled:bg-[#EAE7DF] disabled:text-[#8A8A8A] text-white text-xs font-bold rounded-full shadow-sm flex items-center gap-1.5 transition"
              >
                <Plus className="w-4 h-4" />
                <span>+ ADD PRODUCT</span>
              </button>
            </div>

            {/* Product Table / Cards */}
            {products.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-[#E5E2D9] p-6">
                <Package className="w-10 h-10 text-[#BABABA] mx-auto mb-2" />
                <h3 className="font-bold text-[#1A1A1A] text-base">No Products Yet</h3>
                <p className="text-xs text-[#8A8A8A] max-w-sm mx-auto mt-1 mb-4">
                  Upload photos, set your pricing, and start showing products to WhatsApp buyers.
                </p>
                <button
                  onClick={() => openProductModal()}
                  className="px-6 py-2.5 bg-[#5D6D5F] text-white text-xs font-bold rounded-full hover:bg-[#4A584C] transition"
                >
                  + Add Your First Product
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-3xl shadow-sm border border-[#E5E2D9] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-[#3D3D3D]">
                    <thead className="bg-[#F3F0E9] border-b border-[#E5E2D9] text-[11px] uppercase font-bold text-[#8A8A8A]">
                      <tr>
                        <th className="py-3.5 px-4">Product</th>
                        <th className="py-3.5 px-4">Category</th>
                        <th className="py-3.5 px-4">Price</th>
                        <th className="py-3.5 px-4">Stock</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F3F0E9]">
                      {products.map((product) => (
                        <tr key={product.id} className="hover:bg-[#FDFCF9] transition">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="w-12 h-12 rounded-xl object-cover bg-[#F3F0E9] shrink-0 border border-[#E5E2D9]"
                                referrerPolicy="no-referrer"
                              />
                              <div>
                                <div className="font-bold text-[#1A1A1A] text-xs">{product.name}</div>
                                {product.sku && <div className="text-[10px] text-[#8A8A8A] font-mono">SKU: {product.sku}</div>}
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-medium text-[#3D3D3D]">{product.category}</td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-[#1A1A1A]">₹{product.price}</div>
                            {product.compareAtPrice && (
                              <div className="text-[10px] text-[#8A8A8A] line-through">₹{product.compareAtPrice}</div>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#E8F3EA] text-[#3D7A4F]">
                              {product.stockStatus === 'in_stock' ? 'In Stock' : product.stockStatus}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <button
                              onClick={() => handleToggleProductActive(product)}
                              className={`px-3 py-1 rounded-full text-[10px] font-bold transition ${
                                product.isActive
                                  ? 'bg-[#E8F3EA] text-[#3D7A4F] hover:bg-[#D4EAD8]'
                                  : 'bg-[#F3F0E9] text-[#8A8A8A] hover:bg-[#EAE7DF]'
                              }`}
                            >
                              {product.isActive ? 'Active (Live)' : 'Archived'}
                            </button>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openProductModal(product)}
                                className="p-2 text-[#8A8A8A] hover:text-[#1A1A1A] rounded-full hover:bg-[#F3F0E9] transition"
                                title="Edit Product"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDuplicateProduct(product.id)}
                                className="p-2 text-[#8A8A8A] hover:text-[#1A1A1A] rounded-full hover:bg-[#F3F0E9] transition"
                                title="Duplicate Product"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(product.id, product.name)}
                                className="p-2 text-[#B42318] hover:text-[#912018] rounded-full hover:bg-[#FEF3F2] transition"
                                title="Delete Product"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: STORE SETTINGS & THEMES */}
        {activeTab === 'store' && (
          <div className="py-6 max-w-4xl space-y-6">
            <form onSubmit={handleSaveStoreSettings} className="space-y-6">
              {/* Business Info */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#E5E2D9] space-y-4">
                <h3 className="font-bold text-[#1A1A1A] text-base">Business Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#3D3D3D] mb-1">Business Name *</label>
                    <input
                      type="text"
                      required
                      value={editBizName}
                      onChange={(e) => setEditBizName(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F9F8F5] border border-[#E5E2D9] rounded-xl text-xs text-[#1A1A1A] focus:outline-none focus:border-[#5D6D5F]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#3D3D3D] mb-1">Category</label>
                    <input
                      type="text"
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F9F8F5] border border-[#E5E2D9] rounded-xl text-xs text-[#1A1A1A] focus:outline-none focus:border-[#5D6D5F]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#3D3D3D] mb-1">WhatsApp Number *</label>
                    <input
                      type="text"
                      required
                      value={editWhatsapp}
                      onChange={(e) => setEditWhatsapp(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F9F8F5] border border-[#E5E2D9] rounded-xl text-xs text-[#1A1A1A] focus:outline-none focus:border-[#5D6D5F]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#3D3D3D] mb-1">Instagram Handle</label>
                    <input
                      type="text"
                      value={editInstagram}
                      onChange={(e) => setEditInstagram(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F9F8F5] border border-[#E5E2D9] rounded-xl text-xs text-[#1A1A1A] focus:outline-none focus:border-[#5D6D5F]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#3D3D3D] mb-1">City</label>
                    <input
                      type="text"
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F9F8F5] border border-[#E5E2D9] rounded-xl text-xs text-[#1A1A1A] focus:outline-none focus:border-[#5D6D5F]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#3D3D3D] mb-1">State</label>
                    <input
                      type="text"
                      value={editState}
                      onChange={(e) => setEditState(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F9F8F5] border border-[#E5E2D9] rounded-xl text-xs text-[#1A1A1A] focus:outline-none focus:border-[#5D6D5F]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#3D3D3D] mb-1">Short Description / Story</label>
                  <textarea
                    rows={2}
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F9F8F5] border border-[#E5E2D9] rounded-xl text-xs text-[#1A1A1A] focus:outline-none focus:border-[#5D6D5F] resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#3D3D3D] mb-1">Top Announcement Banner</label>
                  <input
                    type="text"
                    value={editAnnouncement}
                    onChange={(e) => setEditAnnouncement(e.target.value)}
                    placeholder="e.g. Handcrafted jewelry with free doorstep shipping!"
                    className="w-full px-3 py-2 bg-[#F9F8F5] border border-[#E5E2D9] rounded-xl text-xs text-[#1A1A1A] focus:outline-none focus:border-[#5D6D5F]"
                  />
                </div>
              </div>

              {/* Logo & Theme Templates */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#E5E2D9] space-y-4">
                <h3 className="font-bold text-[#1A1A1A] text-base">Store Template &amp; Styling</h3>

                {/* Logo Uploader */}
                <div className="flex items-center gap-4 p-4 bg-[#F9F8F5] rounded-2xl border border-[#E5E2D9]">
                  <div className="w-16 h-16 rounded-2xl bg-white border border-[#E5E2D9] flex items-center justify-center overflow-hidden shrink-0">
                    {editLogoUrl ? (
                      <img src={editLogoUrl} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <StoreIcon className="w-8 h-8 text-[#BABABA]" />
                    )}
                  </div>
                  <div>
                    <label className="cursor-pointer px-4 py-2 bg-[#1A1A1A] hover:bg-[#3D3D3D] text-white text-xs font-semibold rounded-full inline-flex items-center gap-1.5 transition">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Change Logo</span>
                      <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, true)} className="hidden" />
                    </label>
                    <p className="text-[11px] text-[#8A8A8A] mt-1">PNG, JPG, WEBP recommended</p>
                  </div>
                </div>

                {/* Templates */}
                <div>
                  <label className="block text-xs font-bold text-[#3D3D3D] mb-2">Select Template</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {Object.values(TEMPLATES).map((tmpl) => (
                      <button
                        key={tmpl.id}
                        type="button"
                        onClick={() => {
                          setEditTemplateId(tmpl.id);
                          setEditColors(tmpl.defaultColors);
                        }}
                        className={`p-3 rounded-2xl border text-left transition ${
                          editTemplateId === tmpl.id
                            ? 'border-[#5D6D5F] bg-[#F3F0E9] ring-2 ring-[#5D6D5F]/30'
                            : 'border-[#E5E2D9] bg-[#F9F8F5] hover:bg-[#F3F0E9]'
                        }`}
                      >
                        <div className={`h-16 rounded-xl bg-gradient-to-br ${tmpl.previewGradient} flex items-center justify-center text-white text-xs font-bold mb-2`}>
                          {tmpl.name}
                        </div>
                        <div className="font-bold text-xs text-[#1A1A1A]">{tmpl.name}</div>
                        <div className="text-[10px] text-[#8A8A8A]">{tmpl.category}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Palette Pickers */}
                <div>
                  <label className="block text-xs font-bold text-[#3D3D3D] mb-2">Store Color Palette</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-[#F9F8F5] rounded-xl border border-[#E5E2D9]">
                      <span className="text-[10px] text-[#8A8A8A] font-semibold block mb-1">Primary Color</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={editColors.primary}
                          onChange={(e) => setEditColors({ ...editColors, primary: e.target.value })}
                          className="w-6 h-6 rounded cursor-pointer"
                        />
                        <span className="text-xs font-mono">{editColors.primary}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-[#F9F8F5] rounded-xl border border-[#E5E2D9]">
                      <span className="text-[10px] text-[#8A8A8A] font-semibold block mb-1">Accent Background</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={editColors.accent}
                          onChange={(e) => setEditColors({ ...editColors, accent: e.target.value })}
                          className="w-6 h-6 rounded cursor-pointer"
                        />
                        <span className="text-xs font-mono">{editColors.accent}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-[#F9F8F5] rounded-xl border border-[#E5E2D9]">
                      <span className="text-[10px] text-[#8A8A8A] font-semibold block mb-1">Canvas Background</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={editColors.background}
                          onChange={(e) => setEditColors({ ...editColors, background: e.target.value })}
                          className="w-6 h-6 rounded cursor-pointer"
                        />
                        <span className="text-xs font-mono">{editColors.background}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-[#F9F8F5] rounded-xl border border-[#E5E2D9]">
                      <span className="text-[10px] text-[#8A8A8A] font-semibold block mb-1">Text Color</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={editColors.text}
                          onChange={(e) => setEditColors({ ...editColors, text: e.target.value })}
                          className="w-6 h-6 rounded cursor-pointer"
                        />
                        <span className="text-xs font-mono">{editColors.text}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleTogglePublish}
                  className="px-5 py-2.5 text-xs font-semibold text-[#3D3D3D] hover:text-[#1A1A1A] border border-[#E5E2D9] rounded-full hover:bg-[#F3F0E9] transition"
                >
                  {store?.status === 'published' ? 'Switch to Draft Mode' : 'Publish Store'}
                </button>

                <button
                  type="submit"
                  disabled={savingStore}
                  className="px-8 py-2.5 bg-[#5D6D5F] hover:bg-[#4A584C] text-white text-xs font-bold rounded-full shadow-sm transition disabled:opacity-50"
                >
                  {savingStore ? 'Saving Settings...' : 'Save Store Changes'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 4: VISITOR & WHATSAPP ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="py-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-[#1A1A1A]">Store Analytics</h2>
                <p className="text-xs text-[#8A8A8A]">Real-time visitor counts and WhatsApp conversion tracking</p>
              </div>

              <div className="flex items-center gap-1 bg-[#F3F0E9] p-1 rounded-full text-xs font-medium border border-[#E5E2D9]">
                <button
                  onClick={() => setTimeframe(1)}
                  className={`px-3 py-1 rounded-full transition ${timeframe === 1 ? 'bg-white text-[#1A1A1A] font-bold shadow-xs' : 'text-[#8A8A8A]'}`}
                >
                  Today
                </button>
                <button
                  onClick={() => setTimeframe(7)}
                  className={`px-3 py-1 rounded-full transition ${timeframe === 7 ? 'bg-white text-[#1A1A1A] font-bold shadow-xs' : 'text-[#8A8A8A]'}`}
                >
                  7 Days
                </button>
                <button
                  onClick={() => setTimeframe(30)}
                  className={`px-3 py-1 rounded-full transition ${timeframe === 30 ? 'bg-white text-[#1A1A1A] font-bold shadow-xs' : 'text-[#8A8A8A]'}`}
                >
                  30 Days
                </button>
              </div>
            </div>

            {/* Top Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-3xl border border-[#E5E2D9] shadow-sm">
                <span className="text-[11px] font-bold text-[#8A8A8A] uppercase tracking-wider">Total Store Visits</span>
                <div className="text-3xl font-light text-[#1A1A1A] mt-2">{analytics?.storeVisits || 0}</div>
                <p className="text-xs text-[#8A8A8A] mt-1">Visitors browsing your store</p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-[#E5E2D9] shadow-sm">
                <span className="text-[11px] font-bold text-[#8A8A8A] uppercase tracking-wider">Product Views</span>
                <div className="text-3xl font-light text-[#1A1A1A] mt-2">{analytics?.productViews || 0}</div>
                <p className="text-xs text-[#8A8A8A] mt-1">Product detail cards opened</p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-[#E5E2D9] shadow-sm">
                <span className="text-[11px] font-bold text-[#3D7A4F] uppercase tracking-wider">WhatsApp Order Clicks</span>
                <div className="text-3xl font-light text-[#3D7A4F] mt-2">{analytics?.whatsappClicks || 0}</div>
                <p className="text-xs text-[#3D7A4F]/80 mt-1">Direct inquiries opened in WhatsApp</p>
              </div>
            </div>

            {/* Top Product Highlight */}
            {analytics?.topProduct ? (
              <div className="bg-[#F3F0E9] rounded-3xl p-6 border border-[#E5E2D9]">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#5D6D5F] text-white">
                  Most Viewed Product
                </span>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-3">
                  <div>
                    <h3 className="text-lg font-bold text-[#1A1A1A]">{analytics.topProduct.name}</h3>
                    <div className="flex items-center gap-4 text-xs text-[#8A8A8A] mt-1">
                      <span>👁️ {analytics.topProduct.views} views</span>
                      <span>💬 {analytics.topProduct.whatsappClicks} WhatsApp orders initiated</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-6 border border-[#E5E2D9] text-center">
                <p className="text-xs text-[#8A8A8A]">No product view data yet. Share your store link to start tracking!</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: SHARE STORE */}
        {activeTab === 'share' && (
          <div className="py-6 max-w-2xl space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#E5E2D9] space-y-6">
              <div>
                <h2 className="text-xl font-bold text-[#1A1A1A]">Share Your Store</h2>
                <p className="text-xs text-[#8A8A8A] mt-0.5">
                  Put this link in your Instagram bio to let all followers browse and order in 1 tap.
                </p>
              </div>

              {/* URL Box */}
              <div>
                <label className="block text-xs font-bold text-[#3D3D3D] uppercase tracking-wider mb-2">
                  Your Store Link:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/store/${store?.slug}`}
                    className="w-full px-4 py-3 bg-[#F9F8F5] border border-[#E5E2D9] rounded-2xl text-xs font-mono text-[#1A1A1A] select-all"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/store/${store?.slug}`);
                      setActionSuccess('Store URL copied to clipboard!');
                      setTimeout(() => setActionSuccess(''), 2500);
                    }}
                    className="px-5 py-3 bg-[#1A1A1A] hover:bg-[#3D3D3D] text-white text-xs font-bold rounded-2xl shrink-0 transition"
                  >
                    Copy Link
                  </button>
                </div>
              </div>

              {/* Instagram Guide */}
              <div className="p-5 rounded-2xl bg-[#F3F0E9] border border-[#E5E2D9] text-[#1A1A1A] space-y-3">
                <div className="flex items-center gap-2 text-[#5D6D5F] font-bold text-sm">
                  <Instagram className="w-5 h-5" />
                  <span>How to Add to Your Instagram Bio</span>
                </div>
                <ol className="text-xs text-[#3D3D3D] space-y-2 list-decimal list-inside leading-relaxed">
                  <li>Copy your store link above.</li>
                  <li>Open the Instagram app &gt; tap your profile photo &gt; tap <strong>Edit profile</strong>.</li>
                  <li>Tap <strong>Links</strong> &gt; tap <strong>Add external link</strong>.</li>
                  <li>Paste your store link and title it <strong>&quot;Shop on WhatsApp&quot;</strong>.</li>
                </ol>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`Check out our collection at ${business?.name}: ${window.location.origin}/store/${store?.slug}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-2.5 bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-bold rounded-full flex items-center gap-2 shadow-xs transition"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Share on WhatsApp Status</span>
                </a>

                <a
                  href={`/store/${store?.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-[#5D6D5F] hover:underline flex items-center gap-1"
                >
                  <span>Open Storefront</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* PRODUCT CREATE / EDIT MODAL */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-[#E5E2D9] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E2D9] mb-4">
              <h3 className="font-bold text-[#1A1A1A] text-lg">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="p-2 text-[#8A8A8A] hover:text-[#1A1A1A] rounded-full hover:bg-[#F3F0E9]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              {/* Image upload */}
              <div>
                <label className="block text-xs font-bold text-[#3D3D3D] mb-1.5">Product Photo *</label>
                <div className="flex items-center gap-4 p-3 bg-[#F9F8F5] rounded-2xl border border-[#E5E2D9]">
                  <img
                    src={prodImages[0]}
                    alt="Preview"
                    className="w-16 h-16 rounded-xl object-cover bg-[#F3F0E9] shrink-0 border border-[#E5E2D9]"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <label className="cursor-pointer px-4 py-2 bg-[#1A1A1A] hover:bg-[#3D3D3D] text-white text-xs font-semibold rounded-full inline-flex items-center gap-1.5 transition">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Product Photo</span>
                      <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, false)} className="hidden" />
                    </label>
                    <p className="text-[10px] text-[#8A8A8A] mt-1">High resolution square photos convert best</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#3D3D3D] mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  placeholder="e.g. Kundan Pearl Choker Set"
                  className="w-full px-3.5 py-2.5 bg-[#F9F8F5] border border-[#E5E2D9] rounded-xl text-xs text-[#1A1A1A] focus:outline-none focus:border-[#5D6D5F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#3D3D3D] mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    placeholder="899"
                    className="w-full px-3.5 py-2.5 bg-[#F9F8F5] border border-[#E5E2D9] rounded-xl text-xs text-[#1A1A1A] focus:outline-none focus:border-[#5D6D5F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#3D3D3D] mb-1">Original Price (₹ MRP)</label>
                  <input
                    type="number"
                    value={prodCompare}
                    onChange={(e) => setProdCompare(e.target.value)}
                    placeholder="1299"
                    className="w-full px-3.5 py-2.5 bg-[#F9F8F5] border border-[#E5E2D9] rounded-xl text-xs text-[#1A1A1A] focus:outline-none focus:border-[#5D6D5F]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#3D3D3D] mb-1">Category</label>
                  <input
                    type="text"
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value)}
                    placeholder="e.g. Necklaces"
                    className="w-full px-3.5 py-2.5 bg-[#F9F8F5] border border-[#E5E2D9] rounded-xl text-xs text-[#1A1A1A] focus:outline-none focus:border-[#5D6D5F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#3D3D3D] mb-1">SKU / Code (Optional)</label>
                  <input
                    type="text"
                    value={prodSku}
                    onChange={(e) => setProdSku(e.target.value)}
                    placeholder="AJ-101"
                    className="w-full px-3.5 py-2.5 bg-[#F9F8F5] border border-[#E5E2D9] rounded-xl text-xs text-[#1A1A1A] focus:outline-none focus:border-[#5D6D5F]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#3D3D3D] mb-1">Short Highlights</label>
                <input
                  type="text"
                  value={prodShortDesc}
                  onChange={(e) => setProdShortDesc(e.target.value)}
                  placeholder="e.g. 22k gold plated with adjustable hook"
                  className="w-full px-3.5 py-2.5 bg-[#F9F8F5] border border-[#E5E2D9] rounded-xl text-xs text-[#1A1A1A] focus:outline-none focus:border-[#5D6D5F]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#3D3D3D] mb-1">Detailed Description</label>
                <textarea
                  rows={3}
                  value={prodDesc}
                  onChange={(e) => setProdDesc(e.target.value)}
                  placeholder="Describe craftsmanship, care instructions, material, dimensions..."
                  className="w-full px-3.5 py-2.5 bg-[#F9F8F5] border border-[#E5E2D9] rounded-xl text-xs text-[#1A1A1A] focus:outline-none focus:border-[#5D6D5F] resize-none"
                />
              </div>

              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#1A1A1A]">
                  <input
                    type="checkbox"
                    checked={prodIsActive}
                    onChange={(e) => setProdIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-[#5D6D5F]"
                  />
                  <span>Active on WhatsApp Store</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#1A1A1A]">
                  <input
                    type="checkbox"
                    checked={prodIsFeatured}
                    onChange={(e) => setProdIsFeatured(e.target.checked)}
                    className="w-4 h-4 rounded text-[#5D6D5F]"
                  />
                  <span>Featured on Homepage</span>
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-[#E5E2D9]">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-5 py-2.5 text-xs font-semibold text-[#8A8A8A] hover:text-[#1A1A1A]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingProduct}
                  className="px-7 py-2.5 bg-[#5D6D5F] hover:bg-[#4A584C] text-white font-bold text-xs rounded-full shadow-sm transition disabled:opacity-50"
                >
                  {submittingProduct ? 'Saving...' : editingProduct ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UNPUBLISH CONFIRMATION MODAL */}
      {isUnpublishModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-[#E5E2D9] space-y-4 text-center">
            <AlertCircle className="w-10 h-10 text-[#C4A484] mx-auto" />
            <h3 className="font-bold text-[#1A1A1A] text-base">Unpublish Store?</h3>
            <p className="text-xs text-[#8A8A8A] leading-relaxed">
              Your store will be switched to draft mode. Visitors following your Instagram link will not be able to browse or order until you publish again.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setIsUnpublishModalOpen(false)}
                className="px-5 py-2 text-xs font-semibold text-[#8A8A8A] hover:text-[#1A1A1A]"
              >
                Keep Live
              </button>
              <button
                onClick={handleConfirmUnpublish}
                className="px-5 py-2 bg-[#B42318] hover:bg-[#912018] text-white text-xs font-bold rounded-full"
              >
                Yes, Unpublish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SHARE STORE MODAL */}
      {store && (
        <ShareStoreModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          storeSlug={store.slug}
          businessName={business?.name || 'My Store'}
        />
      )}

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FDFCF9]/95 backdrop-blur border-t border-[#E5E2D9] px-2 py-2 flex items-center justify-around text-[10px] font-semibold text-[#8A8A8A] shadow-lg">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg ${activeTab === 'home' ? 'text-[#5D6D5F] font-bold' : ''}`}
        >
          <StoreIcon className="w-4 h-4" />
          <span>Home</span>
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg ${activeTab === 'products' ? 'text-[#5D6D5F] font-bold' : ''}`}
        >
          <Package className="w-4 h-4" />
          <span>Products</span>
        </button>

        <button
          onClick={() => openProductModal()}
          className="flex flex-col items-center gap-0.5 -mt-5 bg-[#5D6D5F] text-white p-3 rounded-full shadow-lg"
        >
          <Plus className="w-5 h-5" />
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg ${activeTab === 'analytics' ? 'text-[#5D6D5F] font-bold' : ''}`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Analytics</span>
        </button>

        <button
          onClick={() => setActiveTab('store')}
          className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg ${activeTab === 'store' ? 'text-[#5D6D5F] font-bold' : ''}`}
        >
          <Settings className="w-4 h-4" />
          <span>Store</span>
        </button>
      </div>
    </div>
  );
};

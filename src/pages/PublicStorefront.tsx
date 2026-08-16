import React, { useState, useEffect } from 'react';
import {
  MessageCircle,
  Instagram,
  MapPin,
  Search,
  Share2,
  AlertTriangle,
  Sparkles,
  ExternalLink,
  ChevronRight,
  X,
  Check,
  Package,
  Heart,
  Store as StoreIcon,
  ShoppingBag,
  ArrowLeft,
  Layers,
} from 'lucide-react';
import { Product, Store, Business } from '../types';
import { api } from '../lib/api';
import { TEMPLATES } from '../lib/templates';
import { ShareStoreModal } from '../components/ShareStoreModal';
import { ReportStoreModal } from '../components/ReportStoreModal';

interface PublicStorefrontProps {
  slug: string;
  initialProductSlug?: string;
  isPreviewMode?: boolean;
  onNavigate: (route: string) => void;
}

const DEMO_VARIATIONS = [
  {
    slug: 'aarohi-jewellery',
    name: 'Aarohi Jewellery',
    category: 'Jewellery & Kundan',
    city: 'Jaipur',
    template: 'Jewellery Elegant',
    themeColor: '#b45309',
  },
  {
    slug: 'vogue-aura',
    name: 'Vogue Aura',
    category: 'Ethnic Fashion',
    city: 'Lucknow',
    template: 'Fashion Modern',
    themeColor: '#0f766e',
  },
  {
    slug: 'glow-botanica',
    name: 'GlowBotanica',
    category: 'Botanical Skincare',
    city: 'Bengaluru',
    template: 'Beauty Minimal',
    themeColor: '#047857',
  },
  {
    slug: 'clay-and-knot',
    name: 'Clay & Knot Studio',
    category: 'Pottery & Ceramics',
    city: 'Pune',
    template: 'Handmade Warm',
    themeColor: '#c2410c',
  },
];

export const PublicStorefront: React.FC<PublicStorefrontProps> = ({
  slug,
  initialProductSlug,
  isPreviewMode = false,
  onNavigate,
}) => {
  const [store, setStore] = useState<Store | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Modals
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeWhatsAppOrder, setActiveWhatsAppOrder] = useState<{
    product: Product;
    whatsappUrl: string;
    message: string;
    phoneNumber: string;
  } | null>(null);
  const [copiedOrderMsg, setCopiedOrderMsg] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [copiedProductLink, setCopiedProductLink] = useState(false);

  // Load Public Store or Preview
  useEffect(() => {
    const fetchStore = async () => {
      setLoading(true);
      setError('');
      try {
        if (isPreviewMode) {
          const data = await api.getStorePreview();
          setStore(data.store);
          setBusiness(data.business);
          setProducts(data.products);
          if (initialProductSlug) {
            const found = data.products.find(
              (p) => p.slug.toLowerCase() === initialProductSlug.toLowerCase()
            );
            if (found) setSelectedProduct(found);
          }
        } else {
          const data = await api.getPublicStore(slug);
          setStore(data.store);
          setBusiness(data.business);
          setProducts(data.products);

          // If a product slug was passed in URL, pre-open product modal
          if (initialProductSlug) {
            const found = data.products.find(
              (p) => p.slug.toLowerCase() === initialProductSlug.toLowerCase()
            );
            if (found) {
              setSelectedProduct(found);
              api.recordEvent(data.store.id, 'product_view', found.id);
            }
          }

          // Record store visit event
          api.recordEvent(data.store.id, 'store_visit');
        }
      } catch (err: any) {
        setError(err.message || 'Store not found or currently unavailable');
      } finally {
        setLoading(false);
      }
    };

    if (slug || isPreviewMode) {
      fetchStore();
    }
  }, [slug, initialProductSlug, isPreviewMode]);

  // Handle WhatsApp Order Trigger (Module 11)
  const handleWhatsAppOrder = (product: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!business || !store) return;

    // Track analytics event (Module 11 & 13)
    api.recordEvent(store.id, 'whatsapp_order_click', product.id);

    // Format phone number
    let cleanNumber = business.whatsapp.replace(/[^0-9]/g, '');
    if (!cleanNumber.startsWith('91') && cleanNumber.length === 10) {
      cleanNumber = `91${cleanNumber}`;
    }

    // Build pre-filled WhatsApp message
    const storeUrl = `${window.location.origin}/store/${store.slug}`;
    const message = `Hi ${business.name}! 👋\n\nI would like to place an order from your online store:\n\n🛍️ *Product:* ${product.name}\n💰 *Price:* ₹${product.price}${product.sku ? `\n🔖 *SKU:* ${product.sku}` : ''}\n🔗 *Store Link:* ${storeUrl}\n\nPlease confirm availability and payment details!`;

    const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;

    // Set active modal state so customer sees direct feedback immediately
    setActiveWhatsAppOrder({
      product,
      whatsappUrl,
      message,
      phoneNumber: `+${cleanNumber}`,
    });

    // Try popup navigation safely
    try {
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    } catch {
      // Handled by modal fallback
    }
  };

  // Handle General WhatsApp Enquiry
  const handleGeneralWhatsApp = () => {
    if (!business || !store) return;
    let cleanNumber = business.whatsapp.replace(/[^0-9]/g, '');
    if (!cleanNumber.startsWith('91') && cleanNumber.length === 10) {
      cleanNumber = `91${cleanNumber}`;
    }
    const message = `Hi ${business.name}! 👋 I am browsing your store on MicroStore and have a general enquiry.`;
    const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
    
    // Attempt open or redirect
    try {
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    } catch {
      window.location.href = whatsappUrl;
    }
  };

  // Open Product Modal
  const handleOpenProduct = (product: Product) => {
    setSelectedProduct(product);
    if (store) {
      api.recordEvent(store.id, 'product_view', product.id);
    }
  };

  // Categories list
  const categories = ['All', ...Array.from(new Set(products.map((p) => p.category).filter(Boolean)))];

  // Filtered products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.shortDescription?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFCF9]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-[#5D6D5F] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#6B6B6B] font-medium">Opening store...</p>
        </div>
      </div>
    );
  }

  if (error || !store || !business) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4 bg-[#FDFCF9]">
        <div className="max-w-md w-full text-center bg-white p-8 rounded-3xl border border-[#E5E2D9] shadow-xs space-y-4">
          <AlertTriangle className="w-12 h-12 text-[#C0392B] mx-auto" />
          <h2 className="text-xl font-bold text-[#1A1A1A]">Store Not Available</h2>
          <p className="text-xs text-[#6B6B6B]">
            {error || 'This store may be in draft mode or the link is incorrect.'}
          </p>
          <button
            onClick={() => onNavigate('home')}
            className="px-6 py-2.5 bg-[#5D6D5F] hover:bg-[#4A584C] text-white text-xs font-semibold rounded-full transition"
          >
            Go to MicroStore Home
          </button>
        </div>
      </div>
    );
  }

  // Dynamic Theme Colors
  const colors = store.colors || {
    primary: '#5D6D5F',
    accent: '#F3F0E9',
    background: '#FDFCF9',
    text: '#1A1A1A',
  };

  const isSerifHeading = store.templateId === 'jewellery-elegant' || store.templateId === 'handmade-warm';

  return (
    <div
      className="min-h-screen pb-24"
      style={{ backgroundColor: colors.background, color: colors.text }}
    >
      {/* Demo Variation Switcher Bar */}
      <div className="bg-[#1A1A1A] text-[#F3F0E9] border-b border-[#3D3D3D] py-2 px-4 sticky top-0 z-30 shadow-md">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1 font-bold text-[#E8F3EA] bg-[#5D6D5F]/40 px-2.5 py-0.5 rounded-full border border-[#5D6D5F]/60">
              <Layers className="w-3.5 h-3.5" />
              <span>Theme Variation</span>
            </span>
            <span className="text-stone-300 font-medium hidden md:inline">
              Preview other curated Indian store styles:
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            {DEMO_VARIATIONS.map((v) => {
              const isCurrent = v.slug === slug;
              return (
                <button
                  key={v.slug}
                  onClick={() => onNavigate(`store/${v.slug}`)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition ${
                    isCurrent
                      ? 'bg-white text-[#1A1A1A] shadow-xs'
                      : 'bg-[#2E2E2E] hover:bg-[#3D3D3D] text-stone-300 hover:text-white'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: v.themeColor }}
                  />
                  <span>{v.name}</span>
                  {isCurrent && (
                    <span className="text-[9px] bg-[#E8F3EA] text-[#3D7A4F] px-1.5 py-0.2 rounded-full font-bold">
                      Active
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Announcement Banner (Module 9) */}
      {store.announcement && (
        <div
          className="text-white text-center py-2 px-4 text-xs font-semibold flex items-center justify-center gap-2"
          style={{ backgroundColor: colors.primary }}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{store.announcement}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* HEADER SECTION (Module 9) */}
        <div
          className="rounded-3xl p-6 sm:p-8 border border-[#E5E2D9] shadow-xs space-y-4"
          style={{ backgroundColor: colors.accent }}
        >
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-5">
            {/* Logo */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white border border-[#E5E2D9] shadow-xs overflow-hidden flex items-center justify-center shrink-0">
              {business.logoUrl ? (
                <img
                  src={business.logoUrl}
                  alt={business.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div
                  className={`w-full h-full flex items-center justify-center font-bold text-3xl text-white ${isSerifHeading ? 'font-serif' : 'font-sans'}`}
                  style={{ backgroundColor: colors.primary }}
                >
                  {business.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Business Info */}
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span
                  className="px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white shadow-xs"
                  style={{ backgroundColor: colors.primary }}
                >
                  {business.category}
                </span>
                {business.city && (
                  <span className="text-xs text-[#6B6B6B] flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>
                      {business.city}
                      {business.state ? `, ${business.state}` : ''}
                    </span>
                  </span>
                )}
              </div>

              <h1 className={`text-2xl sm:text-3xl text-[#1A1A1A] tracking-tight ${isSerifHeading ? 'font-serif font-bold' : 'font-sans font-light'}`}>
                <span>{business.name}</span>
              </h1>

              {business.description && (
                <p className="text-xs sm:text-sm text-[#6B6B6B] max-w-xl leading-relaxed">
                  {business.description}
                </p>
              )}

              {/* Social & Contact Actions */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
                {business.instagram && (
                  <a
                    href={`https://instagram.com/${business.instagram.replace(/^@/, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-1.5 rounded-full bg-white border border-[#E5E2D9] text-[#1A1A1A] hover:text-pink-600 text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Instagram className="w-3.5 h-3.5 text-pink-600" />
                    <span>@{business.instagram.replace(/^@/, '')}</span>
                  </a>
                )}

                <button
                  onClick={handleGeneralWhatsApp}
                  className="px-3.5 py-1.5 rounded-full bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Chat on WhatsApp</span>
                </button>

                <button
                  onClick={() => setIsShareModalOpen(true)}
                  className="p-2 rounded-full bg-white border border-[#E5E2D9] text-[#1A1A1A] hover:bg-[#F3F0E9] transition"
                  title="Share Store"
                >
                  <Share2 className="w-4 h-4 text-[#5D6D5F]" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SEARCH & CATEGORY FILTERS */}
        <div className="space-y-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#8A8A8A] absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search jewellery, items, apparel, gifts..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E5E2D9] rounded-full text-xs text-[#1A1A1A] focus:ring-2 focus:ring-[#5D6D5F] focus:outline-none shadow-xs"
            />
          </div>

          {/* Filter Chips */}
          {categories.length > 2 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                    selectedCategory === cat
                      ? 'bg-[#1A1A1A] text-white shadow-xs'
                      : 'bg-white text-[#6B6B6B] border border-[#E5E2D9] hover:bg-[#F3F0E9]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* PRODUCT GRID (Module 9) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-xs text-[#6B6B6B] uppercase tracking-wider">
              {selectedCategory === 'All' ? 'Products & Catalogue' : selectedCategory} ({filteredProducts.length})
            </h2>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-[#E5E2D9] p-6 space-y-2">
              <Package className="w-10 h-10 text-[#8A8A8A] mx-auto" />
              <h3 className="font-bold text-[#1A1A1A] text-sm">No Products Found</h3>
              <p className="text-xs text-[#6B6B6B]">
                Try searching for another keyword or change the category filter.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {filteredProducts.map((product) => {
                const discount =
                  product.compareAtPrice && product.compareAtPrice > product.price
                    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
                    : null;

                return (
                  <div
                    key={product.id}
                    onClick={() => handleOpenProduct(product)}
                    className="group bg-white rounded-3xl border border-[#E5E2D9] shadow-xs hover:shadow-md transition cursor-pointer overflow-hidden flex flex-col justify-between"
                  >
                    {/* Image Area */}
                    <div className="relative aspect-square bg-[#F3F0E9] overflow-hidden">
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        referrerPolicy="no-referrer"
                      />

                      {discount && (
                        <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-[#C0392B] text-white text-[10px] font-bold tracking-wider uppercase shadow-xs">
                          {discount}% OFF
                        </span>
                      )}

                      {product.isFeatured && (
                        <span
                          className="absolute top-2 right-2 px-2.5 py-0.5 rounded-full text-white text-[10px] font-bold shadow-xs"
                          style={{ backgroundColor: colors.primary }}
                        >
                          Featured
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-[#8A8A8A] uppercase tracking-wider block">
                          {product.category}
                        </span>
                        <h3 className="font-bold text-xs sm:text-sm text-[#1A1A1A] line-clamp-2 mt-0.5">
                          {product.name}
                        </h3>

                        {product.shortDescription && (
                          <p className="text-[11px] text-[#6B6B6B] line-clamp-1 mt-0.5">
                            {product.shortDescription}
                          </p>
                        )}
                      </div>

                      <div className="pt-2 border-t border-[#F3F0E9]">
                        {/* Price */}
                        <div className="flex items-baseline gap-1.5 mb-2.5">
                          <span
                            className="font-bold text-sm sm:text-base"
                            style={{ color: colors.primary }}
                          >
                            ₹{product.price}
                          </span>
                          {product.compareAtPrice && (
                            <span className="text-[11px] text-[#8A8A8A] line-through">
                              ₹{product.compareAtPrice}
                            </span>
                          )}
                        </div>

                        {/* WhatsApp CTA Button (Module 9 & 11) */}
                        <button
                          onClick={(e) => handleWhatsAppOrder(product, e)}
                          className="w-full py-2 bg-[#25D366] hover:bg-[#1EBE5D] active:scale-[0.98] text-white text-xs font-bold rounded-full flex items-center justify-center gap-1.5 transition shadow-xs"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>ORDER</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* FOOTER (Module 15 & 16) */}
        <div className="pt-10 pb-6 border-t border-[#E5E2D9] text-center space-y-4">
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-[#6B6B6B]">
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="text-[#8A8A8A] hover:text-[#1A1A1A] transition"
            >
              Report Store
            </button>
            <span>•</span>
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="text-[#8A8A8A] hover:text-[#1A1A1A] transition"
            >
              Share Storefront
            </button>
          </div>

          {/* Powered by MicroStore Badge */}
          <div
            onClick={() => onNavigate('signup')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#E5E2D9] shadow-xs cursor-pointer hover:border-[#5D6D5F] transition group"
          >
            <div className="w-6 h-6 rounded-full bg-[#5D6D5F] text-white flex items-center justify-center font-bold text-xs">
              <StoreIcon className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs text-[#6B6B6B] font-medium">
              Powered by <strong className="text-[#1A1A1A] group-hover:text-[#5D6D5F]">MicroStore</strong> — Free Online WhatsApp Store
            </span>
          </div>
        </div>
      </div>

      {/* PRODUCT DETAIL MODAL / DRAWER (Module 10) */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#E5E2D9] max-h-[90vh] overflow-y-auto space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Header / Close */}
            <div className="flex items-center justify-between pb-2">
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-[#6B6B6B] hover:text-[#1A1A1A] text-xs font-semibold flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Catalogue</span>
              </button>
              <button
                onClick={() => setSelectedProduct(null)}
                className="p-1.5 text-[#8A8A8A] hover:text-[#1A1A1A] rounded-full hover:bg-[#F3F0E9]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Product Image */}
            <div className="aspect-square rounded-2xl bg-[#F3F0E9] overflow-hidden border border-[#E5E2D9]">
              <img
                src={selectedProduct.images[0]}
                alt={selectedProduct.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Product Info */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#8A8A8A] uppercase tracking-wider">
                  {selectedProduct.category}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F3EA] text-[#3D7A4F]">
                  {selectedProduct.stockStatus === 'in_stock' ? 'In Stock' : selectedProduct.stockStatus}
                </span>
              </div>

              <h2 className="text-xl font-bold text-[#1A1A1A]">{selectedProduct.name}</h2>

              {/* Price */}
              <div className="flex items-baseline gap-2">
                <span
                  className="font-bold text-2xl"
                  style={{ color: colors.primary }}
                >
                  ₹{selectedProduct.price}
                </span>
                {selectedProduct.compareAtPrice && (
                  <span className="text-sm text-[#8A8A8A] line-through">
                    ₹{selectedProduct.compareAtPrice}
                  </span>
                )}
                {selectedProduct.sku && (
                  <span className="text-[11px] text-[#8A8A8A] font-mono ml-auto">
                    SKU: {selectedProduct.sku}
                  </span>
                )}
              </div>

              {selectedProduct.shortDescription && (
                <p className="text-xs text-[#6B6B6B] font-medium leading-relaxed bg-[#F9F8F5] p-3.5 rounded-2xl border border-[#E5E2D9]">
                  {selectedProduct.shortDescription}
                </p>
              )}

              {selectedProduct.description && (
                <div className="text-xs text-[#6B6B6B] leading-relaxed space-y-1">
                  <span className="font-bold text-[#1A1A1A] uppercase tracking-wider text-[10px] block">
                    Product Description:
                  </span>
                  <p>{selectedProduct.description}</p>
                </div>
              )}
            </div>

            {/* WhatsApp CTA Action */}
            <div className="pt-2 space-y-2">
              <button
                onClick={() => handleWhatsAppOrder(selectedProduct)}
                className="w-full py-3.5 bg-[#25D366] hover:bg-[#1EBE5D] active:scale-[0.99] text-white font-bold text-sm rounded-full shadow-md flex items-center justify-center gap-2 transition"
              >
                <MessageCircle className="w-5 h-5" />
                <span>ORDER THIS ON WHATSAPP</span>
              </button>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    `${window.location.origin}/store/${store.slug}`
                  );
                  setCopiedProductLink(true);
                  setTimeout(() => setCopiedProductLink(false), 2000);
                }}
                className="w-full py-2.5 bg-[#F3F0E9] hover:bg-[#EAE6DD] text-[#1A1A1A] text-xs font-semibold rounded-full flex items-center justify-center gap-1.5 transition"
              >
                {copiedProductLink ? <Check className="w-4 h-4 text-[#3D7A4F]" /> : <Share2 className="w-4 h-4 text-[#5D6D5F]" />}
                <span>{copiedProductLink ? 'Link Copied!' : 'Share This Product'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WHATSAPP ORDER LAUNCHER / PREVIEW MODAL */}
      {activeWhatsAppOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-[#E5E2D9] space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#F3F0E9] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-xs">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#1A1A1A]">WhatsApp Order Ready</h3>
                  <p className="text-[11px] text-[#8A8A8A]">Sending to {business.name} ({activeWhatsAppOrder.phoneNumber})</p>
                </div>
              </div>
              <button
                onClick={() => setActiveWhatsAppOrder(null)}
                className="p-1.5 text-[#8A8A8A] hover:text-[#1A1A1A] rounded-full hover:bg-[#F3F0E9]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Product Snapshot */}
            <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-[#F9F8F5] border border-[#E5E2D9]">
              <img
                src={activeWhatsAppOrder.product.images[0]}
                alt={activeWhatsAppOrder.product.name}
                className="w-14 h-14 rounded-xl object-cover border border-[#E5E2D9] shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-xs text-[#1A1A1A] truncate">{activeWhatsAppOrder.product.name}</h4>
                <div className="text-sm font-bold text-[#5D6D5F] mt-0.5">₹{activeWhatsAppOrder.product.price}</div>
                {activeWhatsAppOrder.product.sku && (
                  <div className="text-[10px] text-[#8A8A8A]">SKU: {activeWhatsAppOrder.product.sku}</div>
                )}
              </div>
            </div>

            {/* Formatted Message Box */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-[#8A8A8A] font-semibold">
                <span>Pre-filled WhatsApp Message</span>
                <span>Ready to send</span>
              </div>
              <div className="p-3 bg-[#E8F3EA]/50 border border-[#25D366]/30 rounded-2xl text-xs text-[#1A1A1A] font-mono whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto">
                {activeWhatsAppOrder.message}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-1">
              <a
                href={activeWhatsAppOrder.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-sm rounded-full shadow-md flex items-center justify-center gap-2 transition text-center"
              >
                <MessageCircle className="w-4 h-4" />
                <span>OPEN IN WHATSAPP</span>
              </a>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(activeWhatsAppOrder.message);
                    setCopiedOrderMsg(true);
                    setTimeout(() => setCopiedOrderMsg(false), 2000);
                  }}
                  className="py-2.5 px-3 bg-[#F3F0E9] hover:bg-[#EAE6DD] text-[#1A1A1A] text-xs font-semibold rounded-full flex items-center justify-center gap-1.5 transition"
                >
                  {copiedOrderMsg ? <Check className="w-3.5 h-3.5 text-[#3D7A4F]" /> : <Share2 className="w-3.5 h-3.5 text-[#5D6D5F]" />}
                  <span>{copiedOrderMsg ? 'Copied!' : 'Copy Message'}</span>
                </button>

                <button
                  onClick={() => setActiveWhatsAppOrder(null)}
                  className="py-2.5 px-3 bg-white hover:bg-[#F3F0E9] border border-[#E5E2D9] text-[#6B6B6B] text-xs font-semibold rounded-full transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SHARE MODAL */}
      <ShareStoreModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        storeSlug={store.slug}
        businessName={business.name}
      />

      {/* REPORT STORE MODAL */}
      <ReportStoreModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        storeId={store.id}
        storeName={business.name}
      />
    </div>
  );
};

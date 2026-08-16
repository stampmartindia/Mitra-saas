import React from 'react';
import {
  ArrowRight,
  Sparkles,
  MessageCircle,
  Smartphone,
  CheckCircle2,
  Share2,
  Store,
  Gem,
  Shirt,
  Flower2,
  Gift,
  Utensils,
  Home,
  Palette,
  Watch,
  ChevronRight,
  ShieldCheck,
  Zap,
  TrendingUp,
  Package,
} from 'lucide-react';
import { TEMPLATES } from '../lib/templates';

interface HomePageProps {
  onNavigate: (route: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const categories = [
    { name: 'Jewellery', icon: Gem, count: 'Jaipur, Surat, Mumbai', demoSlug: 'aarohi-jewellery', color: 'bg-amber-100 text-amber-800' },
    { name: 'Fashion & Apparel', icon: Shirt, count: 'Kurtis, Sarees, Dresses', demoSlug: 'vogue-aura', color: 'bg-teal-100 text-teal-800' },
    { name: 'Beauty & Skincare', icon: Flower2, count: 'Oils, Serums, Lip Balms', demoSlug: 'glow-botanica', color: 'bg-emerald-100 text-emerald-800' },
    { name: 'Handmade & Crafts', icon: Sparkles, count: 'Pottery, Macrame, Candles', demoSlug: 'clay-and-knot', color: 'bg-orange-100 text-orange-800' },
    { name: 'Personalized Gifts', icon: Gift, count: 'Custom Frames, Keepsakes', demoSlug: 'aarohi-jewellery', color: 'bg-purple-100 text-purple-800' },
    { name: 'Home Bakery & Food', icon: Utensils, count: 'Cakes, Chocolates, Cookies', demoSlug: 'clay-and-knot', color: 'bg-rose-100 text-rose-800' },
    { name: 'Home Décor', icon: Home, count: 'Planters, Art Prints', demoSlug: 'clay-and-knot', color: 'bg-amber-100 text-amber-900' },
    { name: 'Accessories & Resin', icon: Watch, count: 'Hairpins, Keychain Art', demoSlug: 'aarohi-jewellery', color: 'bg-blue-100 text-blue-800' },
  ];

  const faqs = [
    {
      q: 'Is the online store really 100% free?',
      a: 'Yes! Phase 1 allows you to create your store, upload up to 10 active products, customize your theme, and take unlimited WhatsApp orders completely free of charge forever.',
    },
    {
      q: 'How do customers place orders and pay me?',
      a: 'When a customer clicks "Order on WhatsApp", WhatsApp automatically opens with the product photo link, name, price, and SKU pre-filled. You receive the exact enquiry directly on your phone and can share your UPI ID / QR code or confirm delivery details directly with the buyer.',
    },
    {
      q: 'Do I need a laptop or coding knowledge?',
      a: 'No coding is required at all! The entire setup takes less than 3 minutes directly from your smartphone.',
    },
    {
      q: 'How do I put my store link in my Instagram bio?',
      a: 'Once your store is generated, copy your personal link (e.g. yourstore.microstore.in) and paste it into the "Links / Website" section of your Instagram profile. Whenever followers tap it, they see your organized product catalogue.',
    },
    {
      q: 'Can I add or remove products later?',
      a: 'Yes. From your Seller Dashboard, you can add new items, update prices, mark items in or out of stock, duplicate listings, and archive old products anytime.',
    },
  ];
  return (
    <div className="bg-[#FDFCF9] text-[#1A1A1A]">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 border-b border-[#E5E2D9]">
        {/* Subtle natural glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-[#E5E2D9]/40 blur-[100px] pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#F3F0E9] text-[#3D3D3D] border border-[#E5E2D9] text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-[#5D6D5F]" />
                <span>Zero Coding • Instant WhatsApp Orders • 100% Free Starter</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light text-[#1A1A1A] tracking-tight leading-[1.15]">
                Turn Your Instagram Business Into a <span className="font-semibold text-[#5D6D5F]">Professional Brand</span>
              </h1>

              <p className="text-lg sm:text-xl text-[#6B6B6B] max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Create your free online store, showcase your products, and receive orders directly on WhatsApp in under 3 minutes.
              </p>

              {/* CTAs */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <button
                  onClick={() => onNavigate('signup')}
                  className="w-full sm:w-auto px-8 py-4 bg-[#5D6D5F] hover:bg-[#4A584C] text-white font-bold text-base rounded-full shadow-sm hover:shadow-md transition flex items-center justify-center gap-2 group"
                >
                  <span>CREATE FREE STORE</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => onNavigate('store/aarohi-jewellery')}
                  className="w-full sm:w-auto px-7 py-4 bg-white hover:bg-[#F3F0E9] text-[#1A1A1A] font-semibold text-base rounded-full border border-[#E5E2D9] shadow-xs transition flex items-center justify-center gap-2"
                >
                  <span>VIEW DEMO STORE</span>
                  <span className="text-xs bg-[#E8F3EA] text-[#3D7A4F] px-2.5 py-0.5 rounded-full font-bold">Live</span>
                </button>
              </div>

              {/* Trust badges */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-y-2 gap-x-6 text-xs text-[#6B6B6B]">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#5D6D5F]" />
                  <span>Up to 10 Active Products Free</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#5D6D5F]" />
                  <span>Works on All Smartphones</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#5D6D5F]" />
                  <span>No Credit Card or Setup Fee</span>
                </div>
              </div>
            </div>

            {/* Right Phone Mockup Preview */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-[340px] bg-[#2E332F] p-3.5 rounded-[40px] shadow-2xl border-[6px] border-[#3F4741] ring-1 ring-black/20">
                {/* Speaker notch */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 w-24 h-4 bg-[#3F4741] rounded-full z-20" />

                {/* Screen Content */}
                <div className="bg-[#FDFCF9] rounded-[30px] overflow-hidden pt-7 pb-4 text-[#1A1A1A] relative shadow-inner">
                  {/* Store Header Mock */}
                  <div className="px-4 pb-3 border-b border-[#E5E2D9] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#5D6D5F] text-white flex items-center justify-center font-serif text-sm font-bold shadow-xs">
                        A
                      </div>
                      <div>
                        <div className="font-serif font-bold text-xs text-[#1A1A1A]">Aarohi Jewellery</div>
                        <div className="text-[9px] text-[#5D6D5F]">Jaipur • Kundan &amp; Pearls</div>
                      </div>
                    </div>
                    <span className="text-[9px] bg-[#E8F3EA] text-[#3D7A4F] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-[#3D7A4F] rounded-full animate-pulse" />
                      Online
                    </span>
                  </div>

                  {/* Announcement */}
                  <div className="bg-[#F3F0E9] text-[#3D3D3D] text-[10px] py-1 px-3 text-center font-medium border-b border-[#E5E2D9]">
                    ✨ Free shipping on orders above ₹1,500
                  </div>

                  {/* Sample Product Card */}
                  <div className="p-4 space-y-3">
                    <div className="bg-white rounded-2xl p-3 shadow-xs border border-[#E5E2D9]">
                      <div className="relative aspect-square rounded-xl overflow-hidden bg-[#F3F0E9] mb-2 border border-[#E5E2D9]">
                        <img
                          src="https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&auto=format&fit=crop&q=80"
                          alt="Freshwater Pearl Necklace"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <span className="absolute top-1.5 left-1.5 bg-[#5D6D5F] text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                          Bestseller
                        </span>
                      </div>
                      <div className="font-serif font-semibold text-xs text-[#1A1A1A]">Handcrafted Pearl Necklace</div>
                      <div className="flex items-baseline gap-1.5 mt-1">
                        <span className="text-sm font-bold text-[#1A1A1A]">₹899</span>
                        <span className="text-[10px] text-[#8A8A8A] line-through">₹1,299</span>
                      </div>

                      {/* WhatsApp Button */}
                      <button
                        onClick={() => onNavigate('store/aarohi-jewellery')}
                        className="mt-2.5 w-full py-2 bg-[#25D366] hover:bg-[#1EBE5D] text-white rounded-full text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>ORDER ON WHATSAPP</span>
                      </button>
                    </div>

                    <div className="text-center pt-1">
                      <span className="text-[10px] text-[#8A8A8A]">Powered by MicroStore</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. HOW IT WORKS */}
      <section id="how-it-works" className="py-16 sm:py-24 bg-white border-b border-[#E5E2D9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5D6D5F]">Simple 4-Step Process</span>
            <h2 className="text-3xl sm:text-4xl font-light text-[#1A1A1A] mt-2">
              From Instagram Seller to Professional Online Store in <span className="font-semibold">3 Minutes</span>
            </h2>
            <p className="text-[#6B6B6B] mt-3 text-base">
              No technical setup, no payment gateway approvals, and no complicated dashboards.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-[#FDFCF9] rounded-3xl p-6 border border-[#E5E2D9] relative">
              <div className="w-10 h-10 rounded-2xl bg-[#5D6D5F] text-white font-bold flex items-center justify-center text-base mb-4">
                1
              </div>
              <h3 className="font-bold text-[#1A1A1A] text-lg mb-2">Create Free Store</h3>
              <p className="text-sm text-[#6B6B6B] leading-relaxed">
                Enter your business name, select your category, and get your personalized store link automatically.
              </p>
            </div>

            <div className="bg-[#FDFCF9] rounded-3xl p-6 border border-[#E5E2D9] relative">
              <div className="w-10 h-10 rounded-2xl bg-[#5D6D5F] text-white font-bold flex items-center justify-center text-base mb-4">
                2
              </div>
              <h3 className="font-bold text-[#1A1A1A] text-lg mb-2">Add Your Products</h3>
              <p className="text-sm text-[#6B6B6B] leading-relaxed">
                Upload product photos, set your prices, and add descriptions. Keep up to 10 active products for free.
              </p>
            </div>

            <div className="bg-[#FDFCF9] rounded-3xl p-6 border border-[#E5E2D9] relative">
              <div className="w-10 h-10 rounded-2xl bg-[#5D6D5F] text-white font-bold flex items-center justify-center text-base mb-4">
                3
              </div>
              <h3 className="font-bold text-[#1A1A1A] text-lg mb-2">Add Link to Bio</h3>
              <p className="text-sm text-[#6B6B6B] leading-relaxed">
                Paste your store URL into your Instagram bio and WhatsApp status so followers can browse anytime.
              </p>
            </div>

            <div className="bg-[#FDFCF9] rounded-3xl p-6 border border-[#E5E2D9] relative">
              <div className="w-10 h-10 rounded-2xl bg-[#25D366] text-white font-bold flex items-center justify-center text-base mb-4">
                4
              </div>
              <h3 className="font-bold text-[#1A1A1A] text-lg mb-2">Get WhatsApp Orders</h3>
              <p className="text-sm text-[#6B6B6B] leading-relaxed">
                Customers click &quot;Order on WhatsApp&quot; and your chat opens with product details pre-filled.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. EXAMPLE STORES SHOWCASE */}
      <section className="py-16 sm:py-24 bg-[#F9F8F5] border-b border-[#E5E2D9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#5D6D5F]">Live Indian Businesses</span>
              <h2 className="text-3xl font-light text-[#1A1A1A] mt-1">See How Real Sellers Use <span className="font-semibold">MicroStore</span></h2>
            </div>
            <p className="text-sm text-[#6B6B6B] max-w-md mt-2 md:mt-0">
              Tap any store below to test the live storefront experience and see how WhatsApp order messages generate.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Store 1: Aarohi Jewellery */}
            <div
              onClick={() => onNavigate('store/aarohi-jewellery')}
              className="bg-white rounded-3xl overflow-hidden border border-[#E5E2D9] hover:shadow-md transition cursor-pointer group"
            >
              <div className="h-36 bg-[#F3F0E9] relative overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500&auto=format&fit=crop&q=80"
                  alt="Aarohi Jewellery"
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-3 right-3 bg-white/90 text-[#5D6D5F] text-[10px] font-bold px-2.5 py-0.5 rounded-full backdrop-blur-xs border border-[#E5E2D9]">
                  Jewellery
                </div>
              </div>
              <div className="p-5">
                <h4 className="font-bold text-[#1A1A1A] text-base group-hover:text-[#5D6D5F] transition">Aarohi Jewellery</h4>
                <p className="text-xs text-[#8A8A8A] mt-0.5">Jaipur • Kundan &amp; Freshwater Pearls</p>
                <div className="mt-4 pt-3 border-t border-[#F3F0E9] flex items-center justify-between text-xs">
                  <span className="text-[#6B6B6B] font-medium">6 Products Live</span>
                  <span className="text-[#5D6D5F] font-semibold flex items-center gap-0.5">
                    <span>Visit Store</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>

            {/* Store 2: Vogue Aura */}
            <div
              onClick={() => onNavigate('store/vogue-aura')}
              className="bg-white rounded-3xl overflow-hidden border border-[#E5E2D9] hover:shadow-md transition cursor-pointer group"
            >
              <div className="h-36 bg-[#F3F0E9] relative overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=500&auto=format&fit=crop&q=80"
                  alt="Vogue Aura"
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-3 right-3 bg-white/90 text-[#5D6D5F] text-[10px] font-bold px-2.5 py-0.5 rounded-full backdrop-blur-xs border border-[#E5E2D9]">
                  Fashion
                </div>
              </div>
              <div className="p-5">
                <h4 className="font-bold text-[#1A1A1A] text-base group-hover:text-[#5D6D5F] transition">Vogue Aura Boutique</h4>
                <p className="text-xs text-[#8A8A8A] mt-0.5">Lucknow • Chikankari &amp; Maxi Dresses</p>
                <div className="mt-4 pt-3 border-t border-[#F3F0E9] flex items-center justify-between text-xs">
                  <span className="text-[#6B6B6B] font-medium">Chic Modern Theme</span>
                  <span className="text-[#5D6D5F] font-semibold flex items-center gap-0.5">
                    <span>Visit Store</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>

            {/* Store 3: GlowBotanica */}
            <div
              onClick={() => onNavigate('store/glow-botanica')}
              className="bg-white rounded-3xl overflow-hidden border border-[#E5E2D9] hover:shadow-md transition cursor-pointer group"
            >
              <div className="h-36 bg-[#F3F0E9] relative overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1608248597359-bb4254b38d01?w=500&auto=format&fit=crop&q=80"
                  alt="GlowBotanica"
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-3 right-3 bg-white/90 text-[#5D6D5F] text-[10px] font-bold px-2.5 py-0.5 rounded-full backdrop-blur-xs border border-[#E5E2D9]">
                  Beauty
                </div>
              </div>
              <div className="p-5">
                <h4 className="font-bold text-[#1A1A1A] text-base group-hover:text-[#5D6D5F] transition">GlowBotanica Essentials</h4>
                <p className="text-xs text-[#8A8A8A] mt-0.5">Bengaluru • Cold-pressed Skincare</p>
                <div className="mt-4 pt-3 border-t border-[#F3F0E9] flex items-center justify-between text-xs">
                  <span className="text-[#6B6B6B] font-medium">Minimal Botanical</span>
                  <span className="text-[#5D6D5F] font-semibold flex items-center gap-0.5">
                    <span>Visit Store</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>

            {/* Store 4: Clay & Knot */}
            <div
              onClick={() => onNavigate('store/clay-and-knot')}
              className="bg-white rounded-3xl overflow-hidden border border-[#E5E2D9] hover:shadow-md transition cursor-pointer group"
            >
              <div className="h-36 bg-[#F3F0E9] relative overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=80"
                  alt="Clay & Knot Studio"
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-3 right-3 bg-white/90 text-[#C4A484] text-[10px] font-bold px-2.5 py-0.5 rounded-full backdrop-blur-xs border border-[#E5E2D9]">
                  Handmade
                </div>
              </div>
              <div className="p-5">
                <h4 className="font-bold text-[#1A1A1A] text-base group-hover:text-[#C4A484] transition">Clay &amp; Knot Studio</h4>
                <p className="text-xs text-[#8A8A8A] mt-0.5">Pune • Hand-thrown Pottery</p>
                <div className="mt-4 pt-3 border-t border-[#F3F0E9] flex items-center justify-between text-xs">
                  <span className="text-[#6B6B6B] font-medium">Warm Terracotta</span>
                  <span className="text-[#C4A484] font-semibold flex items-center gap-0.5">
                    <span>Visit Store</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. TEMPLATES SECTION */}
      <section id="templates" className="py-16 sm:py-24 bg-white border-b border-[#E5E2D9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5D6D5F]">5 Distinct Styles</span>
            <h2 className="text-3xl font-light text-[#1A1A1A] mt-1">Free Mobile-Optimized <span className="font-semibold">Templates</span></h2>
            <p className="text-[#6B6B6B] mt-2 text-sm">
              Each template is tailored for different categories with curated palettes, typography, and clean layouts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Object.values(TEMPLATES).map((tmpl) => (
              <div key={tmpl.id} className="bg-[#FDFCF9] rounded-3xl p-4 border border-[#E5E2D9] flex flex-col justify-between">
                <div>
                  <div className={`h-24 rounded-2xl bg-gradient-to-br ${tmpl.previewGradient} flex items-center justify-center p-3 text-white shadow-inner mb-3`}>
                    <div className="text-center">
                      <div className="font-bold text-xs">{tmpl.name}</div>
                      <div className="text-[10px] text-white/80">{tmpl.category}</div>
                    </div>
                  </div>
                  <h4 className="font-bold text-[#1A1A1A] text-sm">{tmpl.name}</h4>
                  <p className="text-xs text-[#8A8A8A] mt-1 leading-snug">{tmpl.tagline}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#E5E2D9] flex items-center justify-between text-[11px]">
                  <span className="font-medium text-[#6B6B6B]">Included Free</span>
                  <span className="text-[#3D7A4F] font-semibold">Ready to Use</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. FREE PLAN FEATURES */}
      <section className="py-16 sm:py-20 bg-[#F3F0E9] border-b border-[#E5E2D9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[#5D6D5F]">Everything You Need To Start</span>
              <h2 className="text-3xl font-light text-[#1A1A1A]">100% Free Forever <span className="font-semibold">Store Plan</span></h2>
              <p className="text-[#6B6B6B] text-sm leading-relaxed">
                Designed specifically for Indian creators, boutique sellers, and home businesses starting their online journey without upfront capital or tech hurdles.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-white border border-[#E5E2D9] shadow-xs">
                  <CheckCircle2 className="w-4 h-4 text-[#5D6D5F] shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-xs text-[#1A1A1A]">Up to 10 Active Products</h5>
                    <p className="text-[11px] text-[#8A8A8A]">Add images, prices &amp; categories</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-white border border-[#E5E2D9] shadow-xs">
                  <CheckCircle2 className="w-4 h-4 text-[#5D6D5F] shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-xs text-[#1A1A1A]">Instant WhatsApp Ordering</h5>
                    <p className="text-[11px] text-[#8A8A8A]">Auto-filled pre-formatted enquiries</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-white border border-[#E5E2D9] shadow-xs">
                  <CheckCircle2 className="w-4 h-4 text-[#5D6D5F] shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-xs text-[#1A1A1A]">Instagram Bio Link</h5>
                    <p className="text-[11px] text-[#8A8A8A]">One link to showcase all items</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-white border border-[#E5E2D9] shadow-xs">
                  <CheckCircle2 className="w-4 h-4 text-[#5D6D5F] shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-xs text-[#1A1A1A]">Basic Visitor Analytics</h5>
                    <p className="text-[11px] text-[#8A8A8A]">Track visits and WhatsApp clicks</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Teaser Box */}
            <div className="lg:col-span-6 bg-white p-6 sm:p-8 rounded-3xl border border-[#E5E2D9] shadow-xs">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F3F0E9] text-[#5D6D5F] text-xs font-semibold mb-4 border border-[#E5E2D9]">
                <Package className="w-3.5 h-3.5" />
                <span>Physical Branding Products Coming Soon</span>
              </div>
              <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">
                Custom Wooden Stamps, Thank You Cards &amp; Packaging
              </h3>
              <p className="text-xs text-[#6B6B6B] leading-relaxed mb-4">
                In Phase 2, we will enable direct ordering of customized wooden logo stamps, stamp pads, 100+ Thank You cards with repeat-order QR codes, and branded stickers to make every parcel look like an established luxury D2C brand.
              </p>
              <div className="p-3.5 bg-[#F9F8F5] rounded-2xl border border-[#E5E2D9] text-[#1A1A1A] text-xs flex items-center justify-between">
                <span className="text-[#6B6B6B]">Starter &amp; Business Brand Kits</span>
                <span className="text-[#5D6D5F] font-bold">Starting ₹999 (Phase 2)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. BUSINESS CATEGORIES */}
      <section className="py-16 sm:py-24 bg-white border-b border-[#E5E2D9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5D6D5F]">Explore Sectors</span>
            <h2 className="text-3xl font-light text-[#1A1A1A] mt-1">Built for Every Indian <span className="font-semibold">Creator</span></h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((cat, idx) => {
              const Icon = cat.icon;
              return (
                <div
                  key={idx}
                  onClick={() => onNavigate(`store/${cat.demoSlug}`)}
                  className="p-4 rounded-3xl bg-[#FDFCF9] hover:bg-[#F3F0E9] border border-[#E5E2D9] hover:border-[#5D6D5F]/40 transition cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-2xl bg-[#F3F0E9] text-[#5D6D5F] flex items-center justify-center mb-3 group-hover:scale-105 transition border border-[#E5E2D9]">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-sm text-[#1A1A1A] group-hover:text-[#5D6D5F] transition">{cat.name}</h4>
                  <p className="text-[11px] text-[#8A8A8A] mt-0.5">{cat.count}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. FAQ */}
      <section id="faq" className="py-16 sm:py-24 bg-[#F9F8F5] border-b border-[#E5E2D9]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5D6D5F]">Frequently Asked Questions</span>
            <h2 className="text-3xl font-light text-[#1A1A1A] mt-1">Common Questions From <span className="font-semibold">Sellers</span></h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E5E2D9] shadow-xs">
                <h4 className="font-bold text-[#1A1A1A] text-base mb-2">{faq.q}</h4>
                <p className="text-[#6B6B6B] text-xs sm:text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. FINAL CTA BANNER */}
      <section className="py-16 sm:py-20 bg-[#2E332F] text-white relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-white/10 text-[#E5E2D9] border border-white/20 text-xs font-semibold">
            <Zap className="w-3.5 h-3.5 text-[#C4A484]" />
            <span>Ready in under 3 minutes</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-light tracking-tight max-w-2xl mx-auto">
            Start Taking WhatsApp Orders with Your Own <span className="font-semibold text-[#C4A484]">Free Store</span>
          </h2>

          <p className="text-[#E5E2D9]/80 text-sm sm:text-base max-w-xl mx-auto">
            Join hundreds of Indian Instagram jewellery, fashion, and handicraft sellers who have streamlined their orders today.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onNavigate('signup')}
              className="w-full sm:w-auto px-8 py-4 bg-[#5D6D5F] hover:bg-[#4A584C] text-white font-bold text-base rounded-full shadow-lg transition flex items-center justify-center gap-2"
            >
              <span>CREATE FREE STORE NOW</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => onNavigate('store/aarohi-jewellery')}
              className="w-full sm:w-auto px-7 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold text-base rounded-full border border-white/20 transition"
            >
              <span>EXPLORE LIVE DEMO</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

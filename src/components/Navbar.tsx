import React, { useState } from 'react';
import { Store, UserCheck, Shield, Sparkles, ChevronDown, LogOut, ArrowRight, Menu, X, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onNavigate: (route: string) => void;
  currentRoute: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, currentRoute }) => {
  const { user, store, logout, quickLoginAs } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [demoStoresOpen, setDemoStoresOpen] = useState(false);

  const demoStores = [
    {
      slug: 'aarohi-jewellery',
      name: 'Aarohi Jewellery',
      tagline: 'Kundan & Pearls • Jaipur',
      color: '#b45309',
    },
    {
      slug: 'vogue-aura',
      name: 'Vogue Aura Boutique',
      tagline: 'Ethnic Kurtis • Lucknow',
      color: '#0f766e',
    },
    {
      slug: 'glow-botanica',
      name: 'GlowBotanica Essentials',
      tagline: 'Botanical Skincare • Bengaluru',
      color: '#047857',
    },
    {
      slug: 'clay-and-knot',
      name: 'Clay & Knot Studio',
      tagline: 'Handmade Pottery • Pune',
      color: '#c2410c',
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#FDFCF9]/95 backdrop-blur border-b border-[#E5E2D9]">
      {/* Top Demo Bar / Quick Switcher Banner */}
      <div className="bg-[#1A1A1A] text-[#F3F0E9] text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#5D6D5F]/30 text-[#E8F3EA] border border-[#5D6D5F]/50">
              Phase 1 Live
            </span>
            <span className="text-stone-300">🇮🇳 Free Online Stores with instant WhatsApp ordering for Indian micro-businesses</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                id="quick-demo-switcher"
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className="flex items-center gap-1.5 text-stone-300 hover:text-white px-2.5 py-1 rounded-full bg-[#3D3D3D] hover:bg-[#5D6D5F] transition"
              >
                <UserCheck className="w-3.5 h-3.5 text-[#C4A484]" />
                <span>Quick Role Switcher</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {roleMenuOpen && (
                <div
                  className="absolute right-0 mt-1 w-64 bg-[#FDFCF9] text-stone-900 rounded-2xl shadow-xl border border-[#E5E2D9] py-2 z-50 text-xs overflow-hidden"
                  onClick={() => setRoleMenuOpen(false)}
                >
                  <div className="px-3 py-1 text-[10px] font-bold text-[#8A8A8A] uppercase tracking-wider">
                    Demo Accounts
                  </div>
                  <button
                    onClick={() => quickLoginAs('seller_aarohi')}
                    className="w-full text-left px-3 py-2.5 hover:bg-[#F3F0E9] flex items-center justify-between text-stone-800 transition"
                  >
                    <div>
                      <div className="font-semibold text-[#1A1A1A]">Aarohi Jewellery (Seller)</div>
                      <div className="text-[11px] text-[#8A8A8A]">Jaipur Jewellery • 6 Products</div>
                    </div>
                    <span className="text-[10px] bg-[#E8F3EA] text-[#3D7A4F] px-2 py-0.5 rounded-full font-bold">Active</span>
                  </button>
                  <button
                    onClick={() => quickLoginAs('seller_vogue')}
                    className="w-full text-left px-3 py-2.5 hover:bg-[#F3F0E9] flex items-center justify-between text-stone-800 transition"
                  >
                    <div>
                      <div className="font-semibold text-[#1A1A1A]">Vogue Aura (Seller)</div>
                      <div className="text-[11px] text-[#8A8A8A]">Fashion Kurti • Lucknow</div>
                    </div>
                  </button>
                  <div className="border-t border-[#E5E2D9] my-1"></div>
                  <button
                    onClick={() => quickLoginAs('admin')}
                    className="w-full text-left px-3 py-2.5 hover:bg-[#F3F0E9] flex items-center justify-between text-[#5D6D5F] font-semibold transition"
                  >
                    <div className="flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-[#5D6D5F]" />
                      <span>Platform Admin Portal</span>
                    </div>
                    <span className="text-[10px] bg-[#EAE7DF] text-[#5D6D5F] px-2 py-0.5 rounded-full font-bold">Admin</span>
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => onNavigate('store/aarohi-jewellery')}
              className="hidden sm:flex items-center gap-1 text-[#C4A484] hover:text-[#e4c4a4] font-medium underline underline-offset-2"
            >
              <span>Live Demo Store</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center gap-2 text-left group"
            >
              <div className="w-9 h-9 rounded-2xl bg-[#5D6D5F] text-white flex items-center justify-center font-bold shadow-sm group-hover:bg-[#4A584C] transition">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xl font-black tracking-tight text-[#1A1A1A] flex items-center gap-1">
                  MicroStore
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#F3F0E9] text-[#5D6D5F] rounded-full border border-[#E5E2D9]">
                    Free
                  </span>
                </span>
                <p className="text-[11px] text-[#8A8A8A] -mt-1 font-medium">For Instagram & WhatsApp Sellers</p>
              </div>
            </button>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#3D3D3D]">
            <button
              onClick={() => onNavigate('home')}
              className={`hover:text-[#5D6D5F] transition ${currentRoute === 'home' ? 'text-[#5D6D5F] font-bold' : ''}`}
            >
              Home
            </button>
            <div className="relative">
              <button
                onClick={() => setDemoStoresOpen(!demoStoresOpen)}
                className="hover:text-[#5D6D5F] transition flex items-center gap-1.5 text-[#3D3D3D] py-1"
              >
                <span>Demo Stores</span>
                <span className="text-[10px] px-2 py-0.5 bg-[#E8F3EA] text-[#3D7A4F] rounded-full font-bold">4 Live</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {demoStoresOpen && (
                <div
                  className="absolute left-0 mt-2 w-72 bg-[#FDFCF9] text-[#1A1A1A] rounded-2xl shadow-xl border border-[#E5E2D9] py-2 z-50 text-xs overflow-hidden"
                  onClick={() => setDemoStoresOpen(false)}
                >
                  <div className="px-3 py-1.5 text-[10px] font-bold text-[#8A8A8A] uppercase tracking-wider border-b border-[#F3F0E9]">
                    Select Storefront Variation
                  </div>
                  {demoStores.map((item) => (
                    <button
                      key={item.slug}
                      onClick={() => onNavigate(`store/${item.slug}`)}
                      className="w-full text-left px-3.5 py-2.5 hover:bg-[#F3F0E9] flex items-center gap-2.5 transition border-b border-[#F3F0E9]/50 last:border-0"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <div>
                        <div className="font-semibold text-[#1A1A1A]">{item.name}</div>
                        <div className="text-[11px] text-[#8A8A8A]">{item.tagline}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <a
              href="#how-it-works"
              onClick={(e) => {
                if (currentRoute !== 'home') {
                  e.preventDefault();
                  onNavigate('home');
                  setTimeout(() => {
                    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }
              }}
              className="hover:text-[#5D6D5F] transition"
            >
              How It Works
            </a>
            <a
              href="#templates"
              onClick={(e) => {
                if (currentRoute !== 'home') {
                  e.preventDefault();
                  onNavigate('home');
                  setTimeout(() => {
                    document.getElementById('templates')?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }
              }}
              className="hover:text-[#5D6D5F] transition"
            >
              5 Free Templates
            </a>
            <a
              href="#faq"
              onClick={(e) => {
                if (currentRoute !== 'home') {
                  e.preventDefault();
                  onNavigate('home');
                  setTimeout(() => {
                    document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }
              }}
              className="hover:text-[#5D6D5F] transition"
            >
              FAQ
            </a>
          </nav>

          {/* User / Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                {user.role === 'admin' ? (
                  <button
                    onClick={() => onNavigate('admin')}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#F3F0E9] text-[#5D6D5F] border border-[#E5E2D9] text-xs font-semibold hover:bg-[#EAE7DF] transition"
                  >
                    <Shield className="w-3.5 h-3.5 text-[#5D6D5F]" />
                    Admin Panel
                  </button>
                ) : store ? (
                  <button
                    onClick={() => onNavigate('dashboard')}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#E8F3EA] text-[#3D7A4F] border border-[#CDE5D2] text-xs font-semibold hover:bg-[#d8edd9] transition"
                  >
                    <Store className="w-3.5 h-3.5 text-[#3D7A4F]" />
                    Seller Dashboard
                  </button>
                ) : (
                  <button
                    onClick={() => onNavigate('onboarding')}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#5D6D5F] hover:bg-[#4A584C] text-white text-xs font-semibold transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Complete Setup
                  </button>
                )}

                <div className="h-4 w-px bg-[#E5E2D9]"></div>

                <div className="text-right">
                  <div className="text-xs font-semibold text-[#1A1A1A]">{user.name}</div>
                  <div className="text-[10px] text-[#8A8A8A]">{user.email}</div>
                </div>

                <button
                  onClick={logout}
                  title="Logout"
                  className="p-1.5 text-[#8A8A8A] hover:text-[#1A1A1A] rounded-full hover:bg-[#F3F0E9] transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onNavigate('login')}
                  className="text-sm font-medium text-[#3D3D3D] hover:text-[#1A1A1A] px-3.5 py-1.5 rounded-full hover:bg-[#F3F0E9] transition"
                >
                  Seller Login
                </button>
                <button
                  onClick={() => onNavigate('signup')}
                  className="flex items-center gap-1.5 bg-[#5D6D5F] hover:bg-[#4A584C] text-white text-sm font-semibold px-5 py-2 rounded-full shadow-sm hover:shadow transition"
                >
                  <span>Create Free Store</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex md:hidden items-center gap-2">
            {user && (
              <button
                onClick={() => onNavigate(user.role === 'admin' ? 'admin' : (store ? 'dashboard' : 'onboarding'))}
                className="px-3 py-1 text-xs font-semibold bg-[#5D6D5F] text-white rounded-full"
              >
                Dashboard
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#3D3D3D] hover:text-[#1A1A1A] rounded-xl hover:bg-[#F3F0E9]"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#E5E2D9] bg-[#FDFCF9] px-4 pt-3 pb-6 space-y-3">
          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                onNavigate('home');
                setMobileMenuOpen(false);
              }}
              className="text-left font-medium text-[#1A1A1A] py-2 border-b border-[#F3F0E9]"
            >
              Home
            </button>
            <div className="py-2 border-b border-[#F3F0E9]">
              <div className="text-[11px] font-bold text-[#8A8A8A] uppercase tracking-wider mb-1.5">
                Explore Demo Store Variations
              </div>
              <div className="grid grid-cols-1 gap-1">
                {demoStores.map((item) => (
                  <button
                    key={item.slug}
                    onClick={() => {
                      onNavigate(`store/${item.slug}`);
                      setMobileMenuOpen(false);
                    }}
                    className="text-left font-medium text-[#1A1A1A] py-1.5 px-2 rounded-xl hover:bg-[#F3F0E9] flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span>{item.name}</span>
                    </div>
                    <span className="text-[10px] text-[#8A8A8A]">{item.tagline.split('•')[0]}</span>
                  </button>
                ))}
              </div>
            </div>
            {user ? (
              <>
                <button
                  onClick={() => {
                    onNavigate(user.role === 'admin' ? 'admin' : (store ? 'dashboard' : 'onboarding'));
                    setMobileMenuOpen(false);
                  }}
                  className="text-left font-semibold text-[#1A1A1A] py-2 border-b border-[#F3F0E9]"
                >
                  Go to {user.role === 'admin' ? 'Admin Portal' : 'Seller Dashboard'}
                </button>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="text-left text-rose-600 font-medium py-2"
                >
                  Logout ({user.name})
                </button>
              </>
            ) : (
              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={() => {
                    onNavigate('login');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-center py-2.5 text-[#1A1A1A] font-semibold border border-[#E5E2D9] bg-white rounded-full"
                >
                  Seller Login
                </button>
                <button
                  onClick={() => {
                    onNavigate('signup');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-center py-2.5 bg-[#5D6D5F] hover:bg-[#4A584C] text-white font-semibold rounded-full shadow-sm"
                >
                  Create Free Store
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

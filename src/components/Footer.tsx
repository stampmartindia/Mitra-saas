import React from 'react';
import { Store, Shield, Heart } from 'lucide-react';

interface FooterProps {
  onNavigate: (route: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-[#1A1A1A] text-[#D0CDC5] pt-12 pb-8 border-t border-[#333]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-[#333]">
          {/* Brand */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#5D6D5F] text-white flex items-center justify-center font-bold">
                <Store className="w-4 h-4" />
              </div>
              <span className="text-xl font-light text-white tracking-tight">Micro<span className="font-semibold text-[#C4A484]">Store</span></span>
            </div>
            <p className="text-sm text-[#A8A59D] max-w-md leading-relaxed">
              Empowering India&apos;s home businesses, boutique creators, and Instagram sellers to build a fast, free mobile catalogue with instant WhatsApp orders.
            </p>
            <div className="text-xs text-[#C4A484] font-medium flex items-center gap-1.5 pt-1">
              <span>✨ Built specifically for Indian sellers</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">Platform</h4>
            <ul className="space-y-2 text-sm text-[#A8A59D]">
              <li>
                <button onClick={() => onNavigate('home')} className="hover:text-white transition">
                  Home
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('store/aarohi-jewellery')} className="hover:text-[#C4A484] transition">
                  Aarohi Jewellery Demo
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('signup')} className="hover:text-white transition">
                  Create Free Store
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('login')} className="hover:text-white transition">
                  Seller Login
                </button>
              </li>
            </ul>
          </div>

          {/* Business Categories */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">Categories</h4>
            <ul className="space-y-2 text-sm text-[#A8A59D]">
              <li>Jewellery &amp; Heirloom</li>
              <li>Fashion &amp; Chikankari</li>
              <li>Handmade &amp; Studio Pottery</li>
              <li>Organic Skincare &amp; Beauty</li>
              <li>Personalized Gifts &amp; Bakery</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#7A7770] gap-3">
          <div className="flex items-center gap-1">
            <span>© {new Date().getFullYear()} MicroStore India. Handcrafted with</span>
            <Heart className="w-3 h-3 text-[#C4A484] fill-[#C4A484] inline" />
            <span>for small businesses.</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate('admin')}
              className="text-[#A8A59D] hover:text-white flex items-center gap-1 transition"
            >
              <Shield className="w-3 h-3 text-[#5D6D5F]" />
              <span>Admin Portal</span>
            </button>
            <span>•</span>
            <span className="text-[#A8A59D]">Phase 1 MVP Edition</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

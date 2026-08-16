import { StoreTemplateId, StorePalette, BusinessCategory } from '../types';

export interface TemplateConfig {
  id: StoreTemplateId;
  name: string;
  category: string;
  tagline: string;
  description: string;
  defaultColors: StorePalette;
  fontFamily: {
    heading: string;
    body: string;
  };
  cardRadius: string;
  badgeStyle: string;
  previewGradient: string;
}

export const TEMPLATES: Record<StoreTemplateId, TemplateConfig> = {
  'jewellery-elegant': {
    id: 'jewellery-elegant',
    name: 'Jewellery Elegant',
    category: 'Jewellery & Luxury',
    tagline: 'Refined serif typography, gold accents & luxury heirlooms',
    description: 'Designed specifically for jewellery studios, kundan artisans, and luxury boutique accessories.',
    defaultColors: {
      primary: '#b45309', // Amber Gold
      accent: '#fef3c7',
      background: '#fffdfa',
      text: '#1f2937',
    },
    fontFamily: {
      heading: 'serif',
      body: 'sans-serif',
    },
    cardRadius: 'rounded-xl',
    badgeStyle: 'bg-amber-100 text-amber-900 border border-amber-200',
    previewGradient: 'from-amber-700 via-amber-600 to-amber-900',
  },
  'fashion-modern': {
    id: 'fashion-modern',
    name: 'Fashion Modern',
    category: 'Clothing & Apparel',
    tagline: 'Chic editorial lookbook, clean lines & modern teal palettes',
    description: 'Perfect for kurtis, streetwear, dresses, sarees, and modern fashion boutiques.',
    defaultColors: {
      primary: '#0f766e', // Modern Teal
      accent: '#ccfbf1',
      background: '#f8fafc',
      text: '#0f172a',
    },
    fontFamily: {
      heading: 'sans-serif',
      body: 'sans-serif',
    },
    cardRadius: 'rounded-lg',
    badgeStyle: 'bg-teal-100 text-teal-900 border border-teal-200',
    previewGradient: 'from-teal-700 via-teal-600 to-emerald-900',
  },
  'handmade-warm': {
    id: 'handmade-warm',
    name: 'Handmade Warm',
    category: 'Crafts & Art',
    tagline: 'Terracotta earthy warmth, soft curves & artisan story',
    description: 'Ideal for studio pottery, macrame, resin art, hand-poured candles, and personalized gifts.',
    defaultColors: {
      primary: '#c2410c', // Terracotta
      accent: '#ffedd5',
      background: '#fffaf5',
      text: '#292524',
    },
    fontFamily: {
      heading: 'serif',
      body: 'sans-serif',
    },
    cardRadius: 'rounded-2xl',
    badgeStyle: 'bg-orange-100 text-orange-900 border border-orange-200',
    previewGradient: 'from-orange-700 via-amber-700 to-stone-800',
  },
  'beauty-minimal': {
    id: 'beauty-minimal',
    name: 'Beauty Minimal',
    category: 'Beauty & Skincare',
    tagline: 'Botanical freshness, soft pastels & clean wellness feel',
    description: 'Crafted for organic skincare, lip oils, serums, soaps, and natural cosmetic brands.',
    defaultColors: {
      primary: '#047857', // Botanical Green
      accent: '#d1fae5',
      background: '#f9fdfa',
      text: '#134e4a',
    },
    fontFamily: {
      heading: 'sans-serif',
      body: 'sans-serif',
    },
    cardRadius: 'rounded-xl',
    badgeStyle: 'bg-emerald-100 text-emerald-900 border border-emerald-200',
    previewGradient: 'from-emerald-700 via-teal-600 to-slate-900',
  },
  'general-store': {
    id: 'general-store',
    name: 'General Store',
    category: 'All Categories',
    tagline: 'High-contrast modern indigo, versatile catalog & swift browsing',
    description: 'A versatile clean e-commerce theme suitable for any business category or home business.',
    defaultColors: {
      primary: '#4338ca', // Indigo
      accent: '#e0e7ff',
      background: '#f8fafc',
      text: '#1e1b4b',
    },
    fontFamily: {
      heading: 'sans-serif',
      body: 'sans-serif',
    },
    cardRadius: 'rounded-xl',
    badgeStyle: 'bg-indigo-100 text-indigo-900 border border-indigo-200',
    previewGradient: 'from-indigo-700 via-blue-600 to-slate-900',
  },
};

export const COLOR_PRESETS: { name: string; colors: StorePalette }[] = [
  {
    name: 'Natural Sage & Sand',
    colors: {
      primary: '#5D6D5F', // Sage green earth tone
      accent: '#EAE7DF',
      background: '#FDFCF9',
      text: '#1A1A1A',
    },
  },
  {
    name: 'Warm Terracotta & Clay',
    colors: {
      primary: '#C4A484', // Warm clay / camel
      accent: '#F3F0E9',
      background: '#FDFCF9',
      text: '#292524',
    },
  },
  {
    name: 'Jaipur Gold & Amber',
    colors: {
      primary: '#b45309',
      accent: '#fef3c7',
      background: '#fffdfa',
      text: '#1f2937',
    },
  },
  {
    name: 'Lucknowi Teal & Mint',
    colors: {
      primary: '#0f766e',
      accent: '#ccfbf1',
      background: '#f8fafc',
      text: '#0f172a',
    },
  },
  {
    name: 'Terracotta Earth',
    colors: {
      primary: '#c2410c',
      accent: '#ffedd5',
      background: '#fffaf5',
      text: '#292524',
    },
  },
  {
    name: 'Forest Botanical',
    colors: {
      primary: '#047857',
      accent: '#d1fae5',
      background: '#f9fdfa',
      text: '#134e4a',
    },
  },
  {
    name: 'Royal Velvet Plum',
    colors: {
      primary: '#7e22ce',
      accent: '#f3e8ff',
      background: '#faf5ff',
      text: '#3b0764',
    },
  },
  {
    name: 'Modern Slate & Indigo',
    colors: {
      primary: '#3b82f6',
      accent: '#dbeafe',
      background: '#f8fafc',
      text: '#0f172a',
    },
  },
];

export const CATEGORY_ICONS: Record<BusinessCategory, string> = {
  Jewellery: 'Gem',
  Fashion: 'Shirt',
  Handmade: 'Sparkles',
  Gifts: 'Gift',
  Beauty: 'Flower2',
  'Bakery / Food': 'Utensils',
  'Home Décor': 'Home',
  Crafts: 'Palette',
  Accessories: 'Watch',
  Other: 'Store',
};

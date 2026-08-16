import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { AuthPages } from './pages/AuthPages';
import { OnboardingWizard } from './pages/OnboardingWizard';
import { SellerDashboard } from './pages/SellerDashboard';
import { PublicStorefront } from './pages/PublicStorefront';
import { AdminDashboard } from './pages/AdminDashboard';
import { AlertTriangle, ArrowLeft } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, hasStore, isLoading } = useAuth();
  const [currentRoute, setCurrentRoute] = useState<string>('home');
  const [storeSlug, setStoreSlug] = useState<string>('');
  const [productSlug, setProductSlug] = useState<string | undefined>(undefined);

  // Handle URL path on initial load & popstate
  useEffect(() => {
    const handleLocation = () => {
      const path = window.location.pathname;

      if (path.startsWith('/store/')) {
        const segments = path.replace('/store/', '').split('/');
        const sSlug = segments[0] || '';
        setStoreSlug(sSlug);

        // Check if product subpath exists: /store/:storeSlug/product/:productSlug
        if (segments[1] === 'product' && segments[2]) {
          setProductSlug(segments[2]);
        } else {
          setProductSlug(undefined);
        }
        setCurrentRoute('store');
      } else if (path === '/preview') {
        setCurrentRoute('preview');
      } else if (path === '/login') {
        setCurrentRoute('login');
      } else if (path === '/signup') {
        setCurrentRoute('signup');
      } else if (path === '/forgot-password') {
        setCurrentRoute('forgot-password');
      } else if (path === '/onboarding') {
        setCurrentRoute('onboarding');
      } else if (path === '/dashboard') {
        setCurrentRoute('dashboard');
      } else if (path === '/admin') {
        setCurrentRoute('admin');
      } else if (path === '/' || path === '') {
        setCurrentRoute('home');
      } else {
        setCurrentRoute('not-found');
      }
    };

    handleLocation();
    window.addEventListener('popstate', handleLocation);
    return () => window.removeEventListener('popstate', handleLocation);
  }, []);

  const navigate = (route: string) => {
    if (route.startsWith('store/')) {
      const segments = route.replace('store/', '').split('/');
      const sSlug = segments[0] || '';
      setStoreSlug(sSlug);

      if (segments[1] === 'product' && segments[2]) {
        setProductSlug(segments[2]);
        try {
          window.history.pushState({}, '', `/store/${sSlug}/product/${segments[2]}`);
        } catch {}
      } else {
        setProductSlug(undefined);
        try {
          window.history.pushState({}, '', `/store/${sSlug}`);
        } catch {}
      }
      setCurrentRoute('store');
    } else {
      setCurrentRoute(route);
      try {
        window.history.pushState({}, '', route === 'home' ? '/' : `/${route}`);
      } catch {}
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Redirect on auth change or protected route violations
  useEffect(() => {
    if (isLoading) return;

    if (user && (currentRoute === 'login' || currentRoute === 'signup')) {
      if (user.role === 'admin') {
        navigate('admin');
      } else if (!hasStore || user.onboardingStatus === 'not_started') {
        navigate('onboarding');
      } else {
        navigate('dashboard');
      }
    } else if (!user && (currentRoute === 'dashboard' || currentRoute === 'onboarding' || currentRoute === 'admin' || currentRoute === 'preview')) {
      navigate('login');
    } else if (user && user.role !== 'admin' && currentRoute === 'admin') {
      navigate('dashboard');
    }
  }, [user, hasStore, currentRoute, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFCF9]">
        <div className="w-8 h-8 border-4 border-[#5D6D5F] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Render Public Storefront view (doesn't have platform navbar/footer to keep customer focus)
  if (currentRoute === 'store') {
    return <PublicStorefront slug={storeSlug} initialProductSlug={productSlug} onNavigate={navigate} />;
  }

  // Render Authenticated Seller Preview view
  if (currentRoute === 'preview' && user) {
    return <PublicStorefront slug="" isPreviewMode={true} onNavigate={navigate} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFCF9] text-[#1A1A1A] selection:bg-[#F3F0E9] selection:text-[#1A1A1A]">
      {/* Platform Navigation */}
      <Navbar currentRoute={currentRoute} onNavigate={navigate} />

      {/* Main Page Content */}
      <main className="flex-1">
        {currentRoute === 'home' && <HomePage onNavigate={navigate} />}

        {currentRoute === 'login' && <AuthPages mode="login" onNavigate={navigate} />}

        {currentRoute === 'signup' && <AuthPages mode="signup" onNavigate={navigate} />}

        {currentRoute === 'forgot-password' && <AuthPages mode="forgot" onNavigate={navigate} />}

        {currentRoute === 'onboarding' && <OnboardingWizard onNavigate={navigate} />}

        {currentRoute === 'dashboard' && <SellerDashboard onNavigate={navigate} />}

        {currentRoute === 'admin' && <AdminDashboard onNavigate={navigate} />}

        {currentRoute === 'not-found' && (
          <div className="min-h-[70vh] flex items-center justify-center p-6">
            <div className="max-w-md w-full text-center bg-white p-8 rounded-3xl border border-[#E5E2D9] space-y-4">
              <AlertTriangle className="w-12 h-12 text-[#5D6D5F] mx-auto" />
              <h1 className="text-xl font-bold text-[#1A1A1A]">Page Not Found</h1>
              <p className="text-sm text-[#6B6B6B]">
                The page you requested could not be found or has moved.
              </p>
              <button
                onClick={() => navigate('home')}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#5D6D5F] hover:bg-[#4A584C] text-white text-xs font-semibold rounded-full transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Return to Home
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer (omitted on dashboard and admin for clean workspace) */}
      {currentRoute !== 'dashboard' && currentRoute !== 'admin' && currentRoute !== 'not-found' && (
        <Footer onNavigate={navigate} />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

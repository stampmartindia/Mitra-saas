import React, { useState } from 'react';
import { Store, ArrowRight, Lock, Mail, User as UserIcon, Shield, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

interface AuthPageProps {
  mode: 'login' | 'signup' | 'forgot';
  onNavigate: (route: string) => void;
}

export const AuthPages: React.FC<AuthPageProps> = ({ mode, onNavigate }) => {
  const { login, signup, quickLoginAs, sessionExpiredMessage, clearSessionExpiredMessage } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [emailConfirmationPending, setEmailConfirmationPending] = useState(false);

  const activeMessage = error || (mode === 'login' ? sessionExpiredMessage : null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    clearSessionExpiredMessage();
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (!name.trim() || !email.trim() || !password) {
          throw new Error('Please fill in all required fields.');
        }
        const result = await signup(name.trim(), email.trim(), password);
        if (result?.needsEmailConfirmation) {
          setEmailConfirmationPending(true);
        } else {
          onNavigate('onboarding');
        }
      } else if (mode === 'login') {
        if (!email.trim() || !password) {
          throw new Error('Please enter both email and password.');
        }
        await login(email.trim(), password);
        // App.tsx router automatically redirects based on user role and store status
      } else if (mode === 'forgot') {
        if (!email.trim()) throw new Error('Please enter your account email.');
        await api.resetPassword(email.trim());
        setResetSuccess(true);
      }
    } catch (err: any) {
      console.error('Auth form submission error:', err);
      setError(err.message || 'Authentication error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#FDFCF9]">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div
            onClick={() => onNavigate('home')}
            className="inline-flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-full bg-[#5D6D5F] text-white flex items-center justify-center font-bold shadow-sm group-hover:scale-105 transition">
              <Store className="w-5 h-5" />
            </div>
            <span className="text-2xl font-light text-[#1A1A1A] tracking-tight">Micro<span className="font-semibold text-[#5D6D5F]">Store</span></span>
          </div>

          <h2 className="text-2xl font-light text-[#1A1A1A]">
            {mode === 'signup' && <span>Create Your <span className="font-semibold">Free Business Store</span></span>}
            {mode === 'login' && <span>Log In to Your <span className="font-semibold">Seller Dashboard</span></span>}
            {mode === 'forgot' && <span>Reset Your <span className="font-semibold">Password</span></span>}
          </h2>
          <p className="text-xs text-[#6B6B6B]">
            {mode === 'signup' && 'Get your free WhatsApp catalogue online in 3 minutes.'}
            {mode === 'login' && 'Manage your products, store settings, and view enquiries.'}
            {mode === 'forgot' && 'Enter your registered email to receive reset instructions.'}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xs border border-[#E5E2D9]">
          {activeMessage && (
            <div className="mb-4 p-3 rounded-2xl bg-[#FDF2F2] border border-[#F8D7DA] text-[#A94442] text-xs font-medium">
              {activeMessage}
            </div>
          )}

          {emailConfirmationPending ? (
            <div className="text-center py-4 space-y-3">
              <div className="w-10 h-10 rounded-full bg-[#E8F3EA] text-[#3D7A4F] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-[#1A1A1A] text-sm">Account created. Please check your email to verify your account.</h4>
              <p className="text-xs text-[#6B6B6B]">
                We have dispatched a verification link to <strong>{email}</strong>. Once confirmed, you can log in to start creating your business catalogue.
              </p>
              <button
                type="button"
                onClick={() => {
                  setEmailConfirmationPending(false);
                  onNavigate('login');
                }}
                className="mt-2 text-xs text-[#5D6D5F] font-semibold hover:underline"
              >
                Go to Login
              </button>
            </div>
          ) : resetSuccess ? (
            <div className="text-center py-4 space-y-3">
              <div className="w-10 h-10 rounded-full bg-[#E8F3EA] text-[#3D7A4F] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-[#1A1A1A] text-sm">Reset Instructions Dispatched</h4>
              <p className="text-xs text-[#6B6B6B]">
                If an account exists for <strong>{email}</strong>, we have sent password recovery instructions.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('login')}
                className="mt-2 text-xs text-[#5D6D5F] font-semibold hover:underline"
              >
                Back to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold text-[#1A1A1A] mb-1.5">
                    Your Full Name *
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-[#8A8A8A] absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Aarohi Sharma"
                      className="w-full pl-10 pr-3 py-2.5 bg-[#F9F8F5] border border-[#E5E2D9] rounded-full text-xs text-[#1A1A1A] focus:ring-2 focus:ring-[#5D6D5F] focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] mb-1.5">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#8A8A8A] absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. aarohi@example.com"
                    className="w-full pl-10 pr-3 py-2.5 bg-[#F9F8F5] border border-[#E5E2D9] rounded-full text-xs text-[#1A1A1A] focus:ring-2 focus:ring-[#5D6D5F] focus:outline-none"
                  />
                </div>
              </div>

              {mode !== 'forgot' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-[#1A1A1A]">
                      Password *
                    </label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => onNavigate('forgot-password')}
                        className="text-[11px] text-[#5D6D5F] hover:underline"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#8A8A8A] absolute left-3.5 top-3" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-3 py-2.5 bg-[#F9F8F5] border border-[#E5E2D9] rounded-full text-xs text-[#1A1A1A] focus:ring-2 focus:ring-[#5D6D5F] focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#5D6D5F] hover:bg-[#4A584C] text-white font-bold text-xs rounded-full shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                <span>
                  {loading
                    ? 'Processing...'
                    : mode === 'signup'
                    ? 'CREATE FREE ACCOUNT'
                    : mode === 'login'
                    ? 'LOG IN TO STORE'
                    : 'SEND RESET LINK'}
                </span>
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          )}

          {/* Quick Demo Logins for easy testing */}
          <div className="mt-6 pt-5 border-t border-[#E5E2D9]">
            <div className="text-[11px] font-bold text-[#8A8A8A] uppercase tracking-wider text-center mb-2">
              Instant 1-Click Demo Logins
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => quickLoginAs('seller_aarohi')}
                className="p-2 rounded-full bg-[#F3F0E9] hover:bg-[#EAE6DD] text-[#1A1A1A] border border-[#E5E2D9] text-xs font-semibold flex items-center justify-center gap-1.5 transition text-center"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#5D6D5F]" />
                <span>Seller (Aarohi)</span>
              </button>
              <button
                type="button"
                onClick={() => quickLoginAs('admin')}
                className="p-2 rounded-full bg-[#F3F0E9] hover:bg-[#EAE6DD] text-[#1A1A1A] border border-[#E5E2D9] text-xs font-semibold flex items-center justify-center gap-1.5 transition text-center"
              >
                <Shield className="w-3.5 h-3.5 text-[#C4A484]" />
                <span>Admin Portal</span>
              </button>
            </div>
          </div>

          {/* Footer toggle */}
          <div className="mt-5 text-center text-xs text-[#6B6B6B]">
            {mode === 'signup' ? (
              <p>
                Already have a store?{' '}
                <button
                  type="button"
                  onClick={() => onNavigate('login')}
                  className="font-bold text-[#5D6D5F] hover:underline"
                >
                  Log In
                </button>
              </p>
            ) : (
              <p>
                Don&apos;t have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => onNavigate('signup')}
                  className="font-bold text-[#5D6D5F] hover:underline"
                >
                  Create Free Store
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

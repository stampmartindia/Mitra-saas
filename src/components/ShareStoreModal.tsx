import React, { useState } from 'react';
import { X, Copy, Check, MessageCircle, Share2, Instagram, ExternalLink, Sparkles } from 'lucide-react';

interface ShareStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeSlug: string;
  businessName: string;
}

export const ShareStoreModal: React.FC<ShareStoreModalProps> = ({
  isOpen,
  onClose,
  storeSlug,
  businessName,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const origin = window.location.origin;
  const storeUrl = `${origin}/store/${storeSlug}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(storeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsAppShare = () => {
    const message = encodeURIComponent(
      `Hello! Check out our collection at *${businessName}*:\n🛍️ View catalog & order directly: ${storeUrl}`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: businessName,
          text: `Check out ${businessName}'s store on WhatsApp:`,
          url: storeUrl,
        });
      } catch {
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-[#FDFCF9] rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-[#E5E2D9] animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-[#E5E2D9]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-[#F3F0E9] text-[#5D6D5F] border border-[#E5E2D9]">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#1A1A1A] text-base">Share Your Store</h3>
              <p className="text-xs text-[#8A8A8A]">{businessName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#8A8A8A] hover:text-[#1A1A1A] rounded-full hover:bg-[#F3F0E9] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {/* URL Box with Copy */}
          <div>
            <label className="block text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider mb-1.5">
              Your Public Store Link
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={storeUrl}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E5E2D9] rounded-full text-xs font-mono text-[#1A1A1A] select-all focus:outline-none"
              />
              <button
                onClick={handleCopy}
                className={`px-4 py-2.5 rounded-full text-xs font-bold flex items-center gap-1.5 shrink-0 transition ${
                  copied
                    ? 'bg-[#3D7A4F] text-white'
                    : 'bg-[#5D6D5F] hover:bg-[#4A584C] text-white'
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Quick Share Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={handleWhatsAppShare}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-full bg-[#E8F3EA] hover:bg-[#d8edd9] border border-[#CDE5D2] text-[#3D7A4F] text-xs font-semibold transition"
            >
              <MessageCircle className="w-4 h-4 text-[#3D7A4F]" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={handleNativeShare}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-full bg-[#F3F0E9] hover:bg-[#EAE6DD] border border-[#E5E2D9] text-[#1A1A1A] text-xs font-semibold transition"
            >
              <Share2 className="w-4 h-4 text-[#5D6D5F]" />
              <span>Other Apps</span>
            </button>
          </div>

          {/* Instagram Bio Pro Tip */}
          <div className="p-4 rounded-2xl bg-[#F3F0E9] border border-[#E5E2D9] text-[#1A1A1A] space-y-2">
            <div className="flex items-center gap-1.5 text-[#5D6D5F] font-bold text-xs">
              <Instagram className="w-4 h-4 text-[#5D6D5F]" />
              <span>Add to Your Instagram Bio</span>
            </div>
            <ol className="text-xs text-[#6B6B6B] space-y-1 list-decimal list-inside leading-relaxed">
              <li>Copy your store link above.</li>
              <li>Open Instagram &gt; <strong>Edit Profile</strong>.</li>
              <li>Paste this into the <strong>Links / Website</strong> field.</li>
              <li>Your followers can now tap and order directly on WhatsApp!</li>
            </ol>
          </div>

          <div className="pt-2 flex justify-end">
            <a
              href={`/store/${storeSlug}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-[#5D6D5F] font-bold flex items-center gap-1 hover:underline"
            >
              <span>Preview Live Storefront</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

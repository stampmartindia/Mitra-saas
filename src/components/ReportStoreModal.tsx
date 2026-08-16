import React, { useState } from 'react';
import { X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { api } from '../lib/api';

interface ReportStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: string;
  storeName: string;
  productId?: string;
  productName?: string;
}

export const ReportStoreModal: React.FC<ReportStoreModalProps> = ({
  isOpen,
  onClose,
  storeId,
  storeName,
  productId,
  productName,
}) => {
  const [reason, setReason] = useState<'spam' | 'fraud' | 'prohibited' | 'misleading' | 'other'>('spam');
  const [description, setDescription] = useState('');
  const [reporterEmail, setReporterEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Please provide a brief description for our moderation team.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await api.reportStore({
        storeId,
        productId,
        reason,
        description,
        reporterEmail: reporterEmail || undefined,
      });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-[#FDFCF9] rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-[#E5E2D9] animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-[#E5E2D9]">
          <div className="flex items-center gap-2.5 text-[#C0392B]">
            <div className="p-2 rounded-2xl bg-[#FDF2F2] border border-[#F8D7DA]">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-[#1A1A1A] text-base">Report Store / Listing</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#8A8A8A] hover:text-[#1A1A1A] rounded-full hover:bg-[#F3F0E9] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="py-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#E8F3EA] text-[#3D7A4F] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-[#1A1A1A] text-base">Report Submitted</h4>
            <p className="text-xs text-[#6B6B6B] max-w-xs mx-auto leading-relaxed">
              Thank you for keeping our community safe. Our trust &amp; safety team will review <strong>{storeName}</strong> promptly.
            </p>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2.5 bg-[#5D6D5F] text-white text-xs font-semibold rounded-full hover:bg-[#4A584C] transition"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="text-xs text-[#6B6B6B]">
              Reporting: <strong className="text-[#1A1A1A]">{storeName}</strong>
              {productName && (
                <span>
                  {' '}&bull; Product: <strong className="text-[#1A1A1A]">{productName}</strong>
                </span>
              )}
            </div>

            {error && (
              <div className="p-2.5 rounded-2xl bg-[#FDF2F2] border border-[#F8D7DA] text-[#A94442] text-xs font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#1A1A1A] mb-1.5">
                Reason for reporting
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-[#F9F8F5] border border-[#E5E2D9] rounded-2xl text-xs text-[#1A1A1A] focus:ring-2 focus:ring-[#5D6D5F] focus:outline-none"
              >
                <option value="spam">Spam or Unsolicited Content</option>
                <option value="fraud">Fraud / Counterfeit Concern</option>
                <option value="prohibited">Prohibited or Illegal Items</option>
                <option value="misleading">Misleading Pricing or Images</option>
                <option value="other">Other Violation</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1A1A1A] mb-1.5">
                Describe the issue *
              </label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Please describe what is inappropriate or fraudulent..."
                className="w-full px-3.5 py-2.5 bg-[#F9F8F5] border border-[#E5E2D9] rounded-2xl text-xs text-[#1A1A1A] focus:ring-2 focus:ring-[#5D6D5F] focus:outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1A1A1A] mb-1.5">
                Your Email (Optional for updates)
              </label>
              <input
                type="email"
                value={reporterEmail}
                onChange={(e) => setReporterEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 bg-[#F9F8F5] border border-[#E5E2D9] rounded-full text-xs text-[#1A1A1A] focus:ring-2 focus:ring-[#5D6D5F] focus:outline-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-[#6B6B6B] hover:text-[#1A1A1A] rounded-full hover:bg-[#F3F0E9] transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-[#C0392B] hover:bg-[#A93226] text-white text-xs font-semibold rounded-full shadow-xs transition disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

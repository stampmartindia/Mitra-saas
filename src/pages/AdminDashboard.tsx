import React, { useState, useEffect } from 'react';
import {
  Shield,
  Store as StoreIcon,
  Users,
  Package,
  MessageCircle,
  Eye,
  AlertTriangle,
  Search,
  ExternalLink,
  Ban,
  CheckCircle,
  Trash2,
  Filter,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface AdminDashboardProps {
  onNavigate: (route: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [stores, setStores] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [actionSuccess, setActionSuccess] = useState<string>('');
  const [actionError, setActionError] = useState<string>('');

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [statsData, storesData, reportsData] = await Promise.all([
        api.getAdminStats(),
        api.getAdminStores(),
        api.getAdminReports(),
      ]);
      setStats(statsData);
      setStores(Array.isArray(storesData) ? storesData : storesData?.stores || []);
      setReports(Array.isArray(reportsData) ? reportsData : (reportsData as any)?.reports || []);
    } catch (err: any) {
      setActionError(err.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleUpdateStoreStatus = async (storeId: string, status: 'published' | 'draft' | 'suspended') => {
    try {
      await api.updateStoreStatusByAdmin(storeId, status);
      setActionSuccess(`Store status updated to ${status}.`);
      fetchAdminData();
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err: any) {
      setActionError(err.message || 'Failed to update store status');
    }
  };

  const filteredStores = stores.filter((item) => {
    const nameMatch =
      item.business?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.user?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.store?.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const statusMatch = statusFilter === 'all' || item.store?.status === statusFilter;
    return nameMatch && statusMatch;
  });

  return (
    <div className="min-h-screen bg-[#FDFCF9] text-[#1A1A1A] pb-16">
      {/* Top Banner Alerts */}
      {actionSuccess && (
        <div className="bg-[#5D6D5F] text-white text-xs font-semibold py-2 px-4 text-center">
          ✓ {actionSuccess}
        </div>
      )}
      {actionError && (
        <div className="bg-[#C0392B] text-white text-xs font-semibold py-2 px-4 text-center">
          ⚠️ {actionError}
        </div>
      )}

      {/* Admin Header */}
      <div className="border-b border-[#E5E2D9] bg-white sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F3F0E9] text-[#5D6D5F] border border-[#E5E2D9] flex items-center justify-center font-bold">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-light text-[#1A1A1A]">MicroStore <span className="font-semibold text-[#5D6D5F]">Admin Portal</span></h1>
                <span className="px-2.5 py-0.5 rounded-full bg-[#F3F0E9] border border-[#E5E2D9] text-[10px] font-mono text-[#5D6D5F] font-bold">
                  SUPERUSER
                </span>
              </div>
              <p className="text-xs text-[#6B6B6B]">Platform-wide seller moderation &amp; infrastructure overview</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchAdminData}
              className="p-2.5 rounded-full bg-white hover:bg-[#F3F0E9] text-[#1A1A1A] border border-[#E5E2D9] transition"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => onNavigate('dashboard')}
              className="px-4 py-2 bg-[#5D6D5F] hover:bg-[#4A584C] text-white text-xs font-semibold rounded-full shadow-xs transition"
            >
              Go to Seller View
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* PLATFORM METRICS */}
        <div>
          <h2 className="text-xs font-bold text-[#6B6B6B] uppercase tracking-wider mb-3">
            Global Platform Statistics
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            <div className="bg-white p-5 rounded-3xl border border-[#E5E2D9] shadow-xs">
              <div className="flex items-center justify-between text-[#6B6B6B] mb-2">
                <span className="text-xs font-semibold">Total Sellers</span>
                <Users className="w-4 h-4 text-[#5D6D5F]" />
              </div>
              <div className="text-2xl sm:text-3xl font-light text-[#1A1A1A]">{stats?.totalUsers || 0}</div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-[#E5E2D9] shadow-xs">
              <div className="flex items-center justify-between text-[#6B6B6B] mb-2">
                <span className="text-xs font-semibold">Live Stores</span>
                <StoreIcon className="w-4 h-4 text-[#5D6D5F]" />
              </div>
              <div className="text-2xl sm:text-3xl font-light text-[#5D6D5F]">{stats?.totalStores || 0}</div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-[#E5E2D9] shadow-xs">
              <div className="flex items-center justify-between text-[#6B6B6B] mb-2">
                <span className="text-xs font-semibold">Total Products</span>
                <Package className="w-4 h-4 text-[#C4A484]" />
              </div>
              <div className="text-2xl sm:text-3xl font-light text-[#1A1A1A]">{stats?.totalProducts || 0}</div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-[#E5E2D9] shadow-xs">
              <div className="flex items-center justify-between text-[#6B6B6B] mb-2">
                <span className="text-xs font-semibold">WhatsApp Orders</span>
                <MessageCircle className="w-4 h-4 text-[#25D366]" />
              </div>
              <div className="text-2xl sm:text-3xl font-light text-[#25D366]">{stats?.totalWhatsAppClicks || 0}</div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-[#E5E2D9] shadow-xs">
              <div className="flex items-center justify-between text-[#6B6B6B] mb-2">
                <span className="text-xs font-semibold">Store Visitors</span>
                <Eye className="w-4 h-4 text-[#C4A484]" />
              </div>
              <div className="text-2xl sm:text-3xl font-light text-[#1A1A1A]">{stats?.totalVisits || 0}</div>
            </div>
          </div>
        </div>

        {/* STORE & SELLER MANAGEMENT TABLE */}
        <div className="bg-white rounded-3xl border border-[#E5E2D9] overflow-hidden shadow-xs">
          <div className="p-5 border-b border-[#E5E2D9] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-[#1A1A1A]">Registered Stores &amp; Sellers</h2>
              <p className="text-xs text-[#6B6B6B]">Moderate tenant storefronts, inspect catalogs, and manage active status.</p>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-[#8A8A8A] absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search stores..."
                  className="pl-9 pr-3 py-1.5 bg-[#F9F8F5] border border-[#E5E2D9] rounded-full text-xs text-[#1A1A1A] focus:outline-none focus:border-[#5D6D5F]"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 bg-[#F9F8F5] border border-[#E5E2D9] rounded-full text-xs text-[#1A1A1A] focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#1A1A1A]">
              <thead className="bg-[#F9F8F5] border-b border-[#E5E2D9] text-[10px] uppercase font-bold text-[#6B6B6B] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Store / Business</th>
                  <th className="py-3 px-4">Owner &amp; WhatsApp</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Template</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E2D9]">
                {filteredStores.map((item) => (
                  <tr key={item.store.id} className="hover:bg-[#F9F8F5] transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#F9F8F5] border border-[#E5E2D9] flex items-center justify-center overflow-hidden shrink-0">
                          {item.business.logoUrl ? (
                            <img src={item.business.logoUrl} alt={item.business.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <StoreIcon className="w-5 h-5 text-[#8A8A8A]" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-[#1A1A1A] text-xs">{item.business.name}</div>
                          <a
                            href={`/store/${item.store.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-[#5D6D5F] hover:underline font-mono inline-flex items-center gap-1"
                          >
                            <span>/store/{item.store.slug}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-[#1A1A1A]">{item.user?.name || 'Owner'}</div>
                      <div className="text-[11px] text-[#6B6B6B]">{item.business.whatsapp}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#F3F0E9] border border-[#E5E2D9] text-[10px] text-[#1A1A1A] font-medium">
                        {item.business.category}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-[#6B6B6B] font-mono text-[11px]">
                      {item.store.templateId}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          item.store.status === 'published'
                            ? 'bg-[#E8F3EA] text-[#3D7A4F] border border-[#C3E4C9]'
                            : item.store.status === 'suspended'
                            ? 'bg-[#FDF2F2] text-[#C0392B] border border-[#F8D7DA]'
                            : 'bg-[#F9F8F5] text-[#6B6B6B] border border-[#E5E2D9]'
                        }`}
                      >
                        {item.store.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {item.store.status === 'suspended' ? (
                          <button
                            onClick={() => handleUpdateStoreStatus(item.store.id, 'published')}
                            className="px-3 py-1 bg-[#E8F3EA] hover:bg-[#D4EDDA] text-[#3D7A4F] border border-[#C3E4C9] rounded-full text-[11px] font-semibold flex items-center gap-1"
                          >
                            <CheckCircle className="w-3 h-3" />
                            <span>Reactivate</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUpdateStoreStatus(item.store.id, 'suspended')}
                            className="px-3 py-1 bg-[#FDF2F2] hover:bg-[#F8D7DA] text-[#C0392B] border border-[#F8D7DA] rounded-full text-[11px] font-semibold flex items-center gap-1"
                          >
                            <Ban className="w-3 h-3" />
                            <span>Suspend</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ABUSE REPORTS MODERATION QUEUE */}
        <div className="bg-white rounded-3xl border border-[#E5E2D9] p-6 space-y-4 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-[#C4A484]" />
            <h2 className="text-base font-semibold text-[#1A1A1A]">Abuse &amp; Content Reports Queue</h2>
          </div>

          {reports.length === 0 ? (
            <p className="text-xs text-[#6B6B6B]">No active reports filed by visitors.</p>
          ) : (
            <div className="space-y-2">
              {reports.map((r) => (
                <div key={r.id} className="p-3.5 bg-[#F9F8F5] rounded-2xl border border-[#E5E2D9] flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#C0392B] uppercase">{r.reason}</span>
                      <span className="text-[11px] text-[#8A8A8A]">• Reported on Store ID: {r.storeId}</span>
                    </div>
                    {r.details && <p className="text-xs text-[#1A1A1A] mt-1">{r.details}</p>}
                    {r.reporterEmail && <span className="text-[10px] text-[#8A8A8A]">Contact: {r.reporterEmail}</span>}
                  </div>

                  <button
                    onClick={() => handleUpdateStoreStatus(r.storeId, 'suspended')}
                    className="px-3.5 py-1.5 bg-[#FDF2F2] hover:bg-[#F8D7DA] text-[#C0392B] border border-[#F8D7DA] text-xs font-semibold rounded-full shrink-0"
                  >
                    Suspend Reported Store
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

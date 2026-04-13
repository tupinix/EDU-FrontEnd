import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Download, Ban, X, RefreshCw, Loader2, Key, Check } from 'lucide-react';
import { useAuthStore } from '../hooks/useStore';
import apiClient from '../services/api';
import { licensesApi } from '../services/api';
import type { License } from '../types';
import { cn } from '@/lib/utils';

interface LicenseFormData {
  customerName: string;
  customerEmail: string;
  plan: 'demo' | 'starter' | 'professional' | 'enterprise';
  durationDays: number;
  maxDevices: number;
}

const PLANS = ['demo', 'starter', 'professional', 'enterprise'] as const;
const DURATIONS = [
  { label: '30d', value: 30 },
  { label: '90d', value: 90 },
  { label: '365d', value: 365 },
];

const planColors: Record<string, string> = {
  demo: 'bg-gray-100 text-gray-500',
  starter: 'bg-blue-50 text-blue-600',
  professional: 'bg-purple-50 text-purple-600',
  enterprise: 'bg-amber-50 text-amber-700',
};

export function LicensesPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const [licenses, setLicenses] = useState<License[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<LicenseFormData>({
    customerName: '',
    customerEmail: '',
    plan: 'starter',
    durationDays: 365,
    maxDevices: 10,
  });
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.role !== 'admin') navigate('/');
  }, [user, navigate]);

  const fetchLicenses = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await licensesApi.getAll();
      setLicenses(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load licenses');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLicenses();
  }, []);

  const handleNew = () => {
    setFormData({
      customerName: '',
      customerEmail: '',
      plan: 'starter',
      durationDays: 365,
      maxDevices: 10,
    });
    setFormError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSaving(true);
    try {
      await licensesApi.create(formData);
      setShowModal(false);
      fetchLicenses();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to generate license');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = async (id: string, customerName: string) => {
    try {
      const response = await apiClient.get(`/licenses/${id}/download`, { responseType: 'text' });
      const blob = new Blob([response.data], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `license-${customerName.replace(/\s+/g, '-').toLowerCase()}.key`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download license');
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      await licensesApi.revoke(id);
      setRevokingId(null);
      fetchLicenses();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke license');
    }
  };

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  const isExpired = (d: string) => new Date(d) < new Date();

  if (user?.role !== 'admin') return null;

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-gray-900 tracking-tight">
            {t('sidebar.licenses')}
          </h1>
          <p className="text-[12px] sm:text-[13px] text-gray-400 mt-0.5">
            Generate and manage license keys
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={fetchLicenses}
            disabled={isLoading}
            className="p-2 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
          </button>
          <button
            onClick={handleNew}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-900 text-white text-[13px] font-medium rounded-xl hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Generate License
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center justify-between bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          <p className="text-[13px] text-red-500">{error}</p>
          <button
            onClick={() => setError('')}
            className="text-red-300 hover:text-red-500 p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Licenses list */}
      <div className="bg-white rounded-2xl border border-gray-200/60 overflow-hidden">
        {/* Desktop table header */}
        <div className="hidden sm:grid sm:grid-cols-[1fr_1fr_90px_100px_80px_100px] px-6 py-3 border-b border-gray-100 text-[11px] font-medium text-gray-400 uppercase tracking-wider">
          <span>Customer</span>
          <span>Email</span>
          <span>Plan</span>
          <span>Expires</span>
          <span>Status</span>
          <span className="text-right">Actions</span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 text-gray-300 animate-spin" />
          </div>
        ) : licenses.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Key className="w-8 h-8 text-gray-200 mx-auto mb-3" />
            <p className="text-[14px] text-gray-400">No licenses generated yet</p>
            <p className="text-[12px] text-gray-300 mt-1">
              Click "Generate License" to create a new license key
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {licenses.map((license) => (
              <div
                key={license.id}
                className="px-5 sm:px-6 py-4 flex flex-col sm:grid sm:grid-cols-[1fr_1fr_90px_100px_80px_100px] sm:items-center gap-2 sm:gap-4"
              >
                {/* Customer name */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-[12px] font-semibold shrink-0">
                    {license.customerName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-[14px] font-medium text-gray-900 truncate">
                    {license.customerName}
                  </span>
                </div>

                {/* Email */}
                <span className="text-[13px] text-gray-500 truncate pl-11 sm:pl-0">
                  {license.customerEmail}
                </span>

                {/* Plan badge */}
                <span
                  className={cn(
                    'text-[11px] font-medium px-2 py-0.5 rounded w-fit capitalize',
                    planColors[license.plan] || 'bg-gray-100 text-gray-500'
                  )}
                >
                  {license.plan}
                </span>

                {/* Expires date */}
                <span
                  className={cn(
                    'text-[12px] tabular-nums',
                    isExpired(license.expiresAt) ? 'text-red-400' : 'text-gray-400'
                  )}
                >
                  {fmtDate(license.expiresAt)}
                </span>

                {/* Status */}
                <div>
                  {license.revoked ? (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-red-50 text-red-500 w-fit">
                      Revoked
                    </span>
                  ) : isExpired(license.expiresAt) ? (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-orange-50 text-orange-500 w-fit">
                      Expired
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 w-fit">
                      Active
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-0.5">
                  {revokingId === license.id ? (
                    <>
                      <span className="text-[11px] text-red-400 mr-1">Revoke?</span>
                      <button
                        onClick={() => handleRevoke(license.id)}
                        className="p-2 rounded-lg text-red-500 hover:bg-red-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setRevokingId(null)}
                        className="p-2 rounded-lg text-gray-300 hover:bg-gray-50"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleDownload(license.id, license.customerName)}
                        className="p-2 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-50 transition-colors"
                        title="Download license key"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      {!license.revoked && (
                        <button
                          onClick={() => setRevokingId(license.id)}
                          className="p-2 rounded-lg text-red-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Revoke license"
                        >
                          <Ban className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Generate License Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl border border-gray-200/60 shadow-xl w-full max-w-md">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-gray-900">Generate License</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-gray-300 hover:text-gray-500 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {formError && (
                <div className="text-[13px] text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                  {formError}
                </div>
              )}

              {/* Customer Name */}
              <FormField label="Customer Name">
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  placeholder="Company or customer name"
                  required
                  className="w-full px-3.5 py-2.5 text-[14px] text-gray-900 bg-white border border-gray-200 rounded-xl outline-none placeholder:text-gray-300 focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all"
                />
              </FormField>

              {/* Customer Email */}
              <FormField label="Customer Email">
                <input
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                  placeholder="customer@example.com"
                  required
                  className="w-full px-3.5 py-2.5 text-[14px] text-gray-900 bg-white border border-gray-200 rounded-xl outline-none placeholder:text-gray-300 focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all"
                />
              </FormField>

              {/* Plan */}
              <FormField label="Plan">
                <div className="grid grid-cols-4 gap-1.5">
                  {PLANS.map((plan) => (
                    <button
                      key={plan}
                      type="button"
                      onClick={() => setFormData({ ...formData, plan })}
                      className={cn(
                        'py-2.5 rounded-xl text-[12px] font-medium border transition-colors capitalize',
                        formData.plan === plan
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                      )}
                    >
                      {plan}
                    </button>
                  ))}
                </div>
              </FormField>

              {/* Duration */}
              <FormField label="Duration">
                <div className="grid grid-cols-3 gap-1.5">
                  {DURATIONS.map((d) => (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, durationDays: d.value })}
                      className={cn(
                        'py-2.5 rounded-xl text-[13px] font-medium border transition-colors',
                        formData.durationDays === d.value
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                      )}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </FormField>

              {/* Max Devices */}
              <FormField label="Max Devices">
                <input
                  type="number"
                  value={formData.maxDevices}
                  onChange={(e) =>
                    setFormData({ ...formData, maxDevices: parseInt(e.target.value) || 1 })
                  }
                  min={1}
                  max={10000}
                  required
                  className="w-full px-3.5 py-2.5 text-[14px] text-gray-900 bg-white border border-gray-200 rounded-xl outline-none placeholder:text-gray-300 focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all"
                />
              </FormField>

              {/* Actions */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={isSaving}
                  className="px-4 py-2 text-[13px] font-medium text-gray-500 hover:text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-[13px] font-medium rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-40"
                >
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Generate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[13px] font-medium text-gray-500">{label}</label>
      {children}
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Trash2,
  Edit2,
  X,
  Lock,
  RefreshCw,
  Power,
  PowerOff,
  Loader2,
  Radio,
} from 'lucide-react';
import { brokersApi } from '../services/api';
import { BrokerConfig, BrokerFormData } from '../types';
import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';

const initialFormData: BrokerFormData = {
  name: '',
  host: '',
  port: 1883,
  username: '',
  password: '',
  useTls: false,
  topics: '',
};

const statusDot: Record<string, string> = {
  connected: 'bg-emerald-400',
  connecting: 'bg-amber-400 animate-pulse',
  disconnected: 'bg-gray-300',
  error: 'bg-red-400',
};

const statusLabel: Record<string, string> = {
  connected: 'Connected',
  connecting: 'Connecting',
  disconnected: 'Disconnected',
  error: 'Error',
};

export function Configuration() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [brokers, setBrokers] = useState<BrokerConfig[]>([]);
  const [activeBrokerId, setActiveBrokerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<BrokerFormData>(initialFormData);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchBrokers = useCallback(async () => {
    try {
      setError(null);
      const status = await brokersApi.getStatus();
      setBrokers(status.brokers);
      setActiveBrokerId(status.activeBrokerId);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('configuration.errorLoadingBrokers'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBrokers();
  }, [fetchBrokers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading('submit');
    try {
      const data: BrokerFormData = { ...formData, username: formData.username || '', password: formData.password || '' };
      if (editingId) await brokersApi.update(editingId, data);
      else await brokersApi.create(data);
      setFormData(initialFormData);
      setEditingId(null);
      setShowForm(false);
      await fetchBrokers();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('configuration.errorSavingBroker'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleEdit = (broker: BrokerConfig) => {
    setFormData({
      name: broker.name, host: broker.host, port: broker.port,
      username: broker.username || '', password: broker.password || '',
      useTls: broker.useTls, topics: broker.topics.join(', '),
    });
    setEditingId(broker.id);
    setShowForm(true);
  };

  const handleCancel = () => { setFormData(initialFormData); setEditingId(null); setShowForm(false); };

  const handleDelete = async (id: string) => {
    if (!confirm(t('configuration.confirmDelete'))) return;
    setActionLoading(id);
    try { await brokersApi.delete(id); await fetchBrokers(); }
    catch (err) { setError(err instanceof Error ? err.message : t('configuration.errorRemovingBroker')); }
    finally { setActionLoading(null); }
  };

  const refetchAll = () => Promise.all([
    queryClient.refetchQueries({ queryKey: ['active-broker'], type: 'all' }),
    queryClient.refetchQueries({ queryKey: ['brokers-status'], type: 'all' }),
    queryClient.refetchQueries({ queryKey: ['broker-status'], type: 'all' }),
    queryClient.refetchQueries({ queryKey: ['topics-tree'], type: 'all' }),
    queryClient.refetchQueries({ queryKey: ['dashboard-metrics'], type: 'all' }),
    queryClient.refetchQueries({ queryKey: ['system-metrics'], type: 'all' }),
  ]);

  const handleConnect = async (id: string) => {
    setActionLoading(id);
    try { await brokersApi.activate(id); await fetchBrokers(); await refetchAll(); }
    catch (err) { setError(err instanceof Error ? err.message : t('configuration.errorConnecting')); }
    finally { setActionLoading(null); }
  };

  const handleDisconnect = async (id: string) => {
    setActionLoading(id);
    try { await brokersApi.disconnect(id); await fetchBrokers(); await refetchAll(); }
    catch (err) { setError(err instanceof Error ? err.message : t('configuration.errorDisconnecting')); }
    finally { setActionLoading(null); }
  };

  const handleActivate = async (id: string) => {
    setActionLoading(id);
    try { await brokersApi.activate(id); await fetchBrokers(); await refetchAll(); }
    catch (err) { setError(err instanceof Error ? err.message : t('configuration.errorActivating')); }
    finally { setActionLoading(null); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-5 h-5 text-gray-300 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-gray-900 tracking-tight">MQTT Brokers</h1>
          <p className="text-[12px] sm:text-[13px] text-gray-400 mt-0.5">{t('configuration.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={fetchBrokers}
            className="p-2 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-900 text-white text-[13px] font-medium rounded-xl hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            {t('configuration.newBroker')}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center justify-between bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          <p className="text-[13px] text-red-500">{error}</p>
          <button onClick={() => setError(null)} className="text-red-300 hover:text-red-500 p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200/60 overflow-hidden">
          <div className="px-5 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-[14px] font-semibold text-gray-900">
              {editingId ? t('configuration.editBroker') : t('configuration.newBroker')}
            </h3>
            <button onClick={handleCancel} className="p-1.5 text-gray-300 hover:text-gray-500 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="px-5 sm:px-6 py-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label={`${t('configuration.brokerName')} *`}>
                <input
                  type="text" required placeholder="HiveMQ Cloud" value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-[14px] text-gray-900 bg-white border border-gray-200 rounded-xl outline-none placeholder:text-gray-300 focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all"
                />
              </FormField>
              <FormField label={`${t('configuration.host')} *`}>
                <input
                  type="text" required placeholder="broker.hivemq.com" value={formData.host}
                  onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-[14px] text-gray-900 font-mono bg-white border border-gray-200 rounded-xl outline-none placeholder:text-gray-300 focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all"
                />
              </FormField>
              <FormField label={`${t('configuration.port')} *`}>
                <input
                  type="number" required placeholder="1883" value={formData.port}
                  onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
                  className="w-full px-3.5 py-2.5 text-[14px] text-gray-900 bg-white border border-gray-200 rounded-xl outline-none placeholder:text-gray-300 focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all"
                />
              </FormField>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <div
                    onClick={() => setFormData({ ...formData, useTls: !formData.useTls })}
                    className={cn(
                      'w-9 h-5 rounded-full transition-colors relative cursor-pointer',
                      formData.useTls ? 'bg-gray-900' : 'bg-gray-200'
                    )}
                  >
                    <div className={cn(
                      'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform',
                      formData.useTls ? 'translate-x-4' : 'translate-x-0.5'
                    )} />
                  </div>
                  <span className="text-[13px] font-medium text-gray-700 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-gray-400" />
                    TLS / SSL
                  </span>
                </label>
              </div>
              <FormField label={t('configuration.username')}>
                <input
                  type="text" placeholder={t('common.optional')} value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-[14px] text-gray-900 bg-white border border-gray-200 rounded-xl outline-none placeholder:text-gray-300 focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all"
                />
              </FormField>
              <FormField label={t('common.password')}>
                <input
                  type="password" placeholder={t('common.optional')} value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-[14px] text-gray-900 bg-white border border-gray-200 rounded-xl outline-none placeholder:text-gray-300 focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all"
                />
              </FormField>
              <div className="sm:col-span-2">
                <FormField label={t('configuration.topicsSubscription')}>
                  <input
                    type="text" placeholder="topic/#, other/topic/#" value={formData.topics}
                    onChange={(e) => setFormData({ ...formData, topics: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-[14px] text-gray-900 font-mono bg-white border border-gray-200 rounded-xl outline-none placeholder:text-gray-300 focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all"
                  />
                </FormField>
                <p className="text-[11px] text-gray-300 mt-1.5">{t('configuration.topicsHint')}</p>
              </div>
            </div>
            <div className="flex justify-end gap-2.5 pt-5 mt-5 border-t border-gray-100">
              <button
                type="button" onClick={handleCancel}
                className="px-4 py-2 text-[13px] font-medium text-gray-500 hover:text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit" disabled={actionLoading === 'submit'}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-[13px] font-medium rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-40"
              >
                {actionLoading === 'submit' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {editingId ? t('configuration.saveChanges') : t('configuration.addBroker')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Brokers List */}
      <div className="bg-white rounded-2xl border border-gray-200/60 overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-gray-100">
          <h3 className="text-[13px] font-semibold text-gray-900">{t('configuration.configuredBrokers')}</h3>
        </div>

        {brokers.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-[14px] text-gray-400">{t('configuration.noBrokers')}</p>
            <p className="text-[12px] text-gray-300 mt-1">{t('configuration.noBrokersHint')}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {brokers.map((broker) => {
              const isActive = broker.id === activeBrokerId;
              const isBusy = actionLoading === broker.id;
              return (
                <div key={broker.id} className="px-5 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  {/* Info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', statusDot[broker.status])} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[14px] font-medium text-gray-900">{broker.name}</p>
                        {broker.useTls && <Lock className="w-3 h-3 text-gray-300" />}
                        {isActive && (
                          <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                            Active
                          </span>
                        )}
                        {broker.isDefault && (
                          <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] text-gray-400 font-mono truncate mt-0.5">
                        {broker.host}:{broker.port}
                      </p>
                    </div>
                  </div>

                  {/* Status + actions */}
                  <div className="flex items-center gap-3 sm:gap-4 ml-4 sm:ml-0">
                    <div className="text-right mr-auto sm:mr-0">
                      <p className={cn(
                        'text-[12px] font-medium',
                        broker.status === 'connected' ? 'text-emerald-600' :
                        broker.status === 'error' ? 'text-red-500' : 'text-gray-400'
                      )}>
                        {statusLabel[broker.status] || broker.status}
                      </p>
                      {(broker.messageCount ?? 0) > 0 && (
                        <p className="text-[11px] text-gray-300 tabular-nums mt-0.5">
                          {(broker.messageCount ?? 0).toLocaleString()} msgs
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-0.5">
                      {/* Connect / Disconnect */}
                      {broker.status === 'connected' ? (
                        <IconBtn onClick={() => handleDisconnect(broker.id)} disabled={isBusy} title="Disconnect">
                          {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PowerOff className="w-3.5 h-3.5" />}
                        </IconBtn>
                      ) : (
                        <IconBtn onClick={() => handleConnect(broker.id)} disabled={isBusy} title="Connect">
                          {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Power className="w-3.5 h-3.5" />}
                        </IconBtn>
                      )}
                      {/* Activate */}
                      {!isActive && (
                        <IconBtn onClick={() => handleActivate(broker.id)} disabled={isBusy} title="Set active">
                          <Radio className="w-3.5 h-3.5" />
                        </IconBtn>
                      )}
                      {/* Edit */}
                      <IconBtn onClick={() => handleEdit(broker)} title="Edit">
                        <Edit2 className="w-3.5 h-3.5" />
                      </IconBtn>
                      {/* Delete */}
                      {!broker.isDefault && (
                        <IconBtn onClick={() => handleDelete(broker.id)} disabled={isBusy} title="Delete" danger>
                          <Trash2 className="w-3.5 h-3.5" />
                        </IconBtn>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="px-5 py-4 bg-gray-50 rounded-2xl">
        <p className="text-[12px] text-gray-400 leading-relaxed space-y-0.5">
          <span className="font-medium text-gray-500">{t('configuration.aboutConnections')}</span>
          <br />
          {t('configuration.aboutTip1')} &middot; {t('configuration.aboutTip2')} &middot; {t('configuration.aboutTip3')}
        </p>
      </div>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[13px] font-medium text-gray-500">{label}</label>
      {children}
    </div>
  );
}

function IconBtn({ onClick, disabled, title, danger, children }: {
  onClick: () => void; disabled?: boolean; title?: string; danger?: boolean; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'p-2 rounded-lg transition-colors disabled:opacity-30',
        danger
          ? 'text-red-300 hover:text-red-500 hover:bg-red-50'
          : 'text-gray-300 hover:text-gray-500 hover:bg-gray-50'
      )}
    >
      {children}
    </button>
  );
}

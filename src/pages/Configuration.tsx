import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Server,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Wifi,
  WifiOff,
  Lock,
  Unlock,
  Radio,
  Settings,
  AlertCircle,
  RefreshCw,
  Power,
  PowerOff,
  Loader2,
} from 'lucide-react';
import { brokersApi } from '../services/api';
import { BrokerConfig, BrokerFormData } from '../types';
import { clsx } from 'clsx';
import { useQueryClient } from '@tanstack/react-query';
import { OpcUaConnections } from '../components/OpcUa';

const initialFormData: BrokerFormData = {
  name: '',
  host: '',
  port: 1883,
  username: '',
  password: '',
  useTls: false,
  topics: '',
};

type ConfigTab = 'brokers' | 'opcua';

export function Configuration() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<ConfigTab>('brokers');
  const [brokers, setBrokers] = useState<BrokerConfig[]>([]);
  const [activeBrokerId, setActiveBrokerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<BrokerFormData>(initialFormData);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch brokers from API
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
      const brokerData: BrokerFormData = {
        name: formData.name,
        host: formData.host,
        port: formData.port,
        username: formData.username || '',
        password: formData.password || '',
        useTls: formData.useTls,
        topics: formData.topics,
      };

      if (editingId) {
        await brokersApi.update(editingId, brokerData);
      } else {
        await brokersApi.create(brokerData);
      }

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
      name: broker.name,
      host: broker.host,
      port: broker.port,
      username: broker.username || '',
      password: broker.password || '',
      useTls: broker.useTls,
      topics: broker.topics.join(', '),
    });
    setEditingId(broker.id);
    setShowForm(true);
  };

  const handleCancel = () => {
    setFormData(initialFormData);
    setEditingId(null);
    setShowForm(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('configuration.confirmDelete'))) return;

    setActionLoading(id);
    try {
      await brokersApi.delete(id);
      await fetchBrokers();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('configuration.errorRemovingBroker'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleConnect = async (id: string) => {
    setActionLoading(id);
    try {
      // Connect and activate the broker (so data shows immediately)
      await brokersApi.activate(id);
      await fetchBrokers();
      // Force immediate refetch of all data
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['active-broker'], type: 'all' }),
        queryClient.refetchQueries({ queryKey: ['brokers-status'], type: 'all' }),
        queryClient.refetchQueries({ queryKey: ['broker-status'], type: 'all' }),
        queryClient.refetchQueries({ queryKey: ['topics-tree'], type: 'all' }),
        queryClient.refetchQueries({ queryKey: ['dashboard-metrics'], type: 'all' }),
        queryClient.refetchQueries({ queryKey: ['system-metrics'], type: 'all' }),
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('configuration.errorConnecting'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDisconnect = async (id: string) => {
    setActionLoading(id);
    try {
      await brokersApi.disconnect(id);
      await fetchBrokers();
      // Force immediate refetch
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['active-broker'], type: 'all' }),
        queryClient.refetchQueries({ queryKey: ['brokers-status'], type: 'all' }),
        queryClient.refetchQueries({ queryKey: ['broker-status'], type: 'all' }),
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('configuration.errorDisconnecting'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleActivate = async (id: string) => {
    setActionLoading(id);
    try {
      await brokersApi.activate(id);
      await fetchBrokers();

      // Force immediate refetch of all broker-related queries
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['active-broker'], type: 'all' }),
        queryClient.refetchQueries({ queryKey: ['brokers-status'], type: 'all' }),
        queryClient.refetchQueries({ queryKey: ['topics-tree'], type: 'all' }),
        queryClient.refetchQueries({ queryKey: ['dashboard-metrics'], type: 'all' }),
        queryClient.refetchQueries({ queryKey: ['broker-status'], type: 'all' }),
        queryClient.refetchQueries({ queryKey: ['system-metrics'], type: 'all' }),
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('configuration.errorActivating'));
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusIcon = (status: BrokerConfig['status']) => {
    switch (status) {
      case 'connected':
        return <Wifi className="w-4 h-4 text-green-500" />;
      case 'connecting':
        return <Radio className="w-4 h-4 text-yellow-500 animate-pulse" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <WifiOff className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: BrokerConfig['status']) => {
    switch (status) {
      case 'connected':
        return t('configuration.connected');
      case 'connecting':
        return t('configuration.connecting');
      case 'error':
        return t('configuration.errorStatus');
      default:
        return t('configuration.disconnected');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('configuration.title')}</h1>
          <p className="text-gray-500 mt-1">{t('configuration.subtitle')}</p>
        </div>
        {activeTab === 'brokers' && (
          <div className="flex gap-2">
            <button
              onClick={fetchBrokers}
              className="btn btn-secondary flex items-center gap-2"
              disabled={loading}
            >
              <RefreshCw className={clsx("w-4 h-4", loading && "animate-spin")} />
              {t('common.refresh')}
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="btn btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {t('configuration.newBroker')}
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          <button
            onClick={() => setActiveTab('brokers')}
            className={clsx(
              'pb-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'brokers'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            )}
          >
            MQTT Brokers
          </button>
          <button
            onClick={() => setActiveTab('opcua')}
            className={clsx(
              'pb-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'opcua'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            )}
          >
            OPC-UA
          </button>
        </nav>
      </div>

      {/* OPC-UA Tab */}
      {activeTab === 'opcua' && <OpcUaConnections />}

      {/* Brokers Tab */}
      {activeTab === 'brokers' && <>
      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-800">{error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Broker Form */}
      {showForm && (
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary-600" />
              {editingId ? t('configuration.editBroker') : t('configuration.newBroker')}
            </h3>
            <button
              onClick={handleCancel}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('configuration.brokerName')} *
                </label>
                <input
                  type="text"
                  required
                  className="input"
                  placeholder="Ex: HiveMQ Local, Mosquitto"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('configuration.host')} *
                </label>
                <input
                  type="text"
                  required
                  className="input font-mono"
                  placeholder="192.168.1.34"
                  value={formData.host}
                  onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('configuration.port')} *
                </label>
                <input
                  type="number"
                  required
                  className="input"
                  placeholder="1883"
                  value={formData.port}
                  onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                    checked={formData.useTls}
                    onChange={(e) => setFormData({ ...formData, useTls: e.target.checked })}
                  />
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    {formData.useTls ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                    {t('configuration.useTls')}
                  </span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('configuration.username')}
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder={t('common.optional')}
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('common.password')}
                </label>
                <input
                  type="password"
                  className="input"
                  placeholder={t('common.optional')}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('configuration.topicsSubscription')}
                </label>
                <input
                  type="text"
                  className="input font-mono"
                  placeholder="topic/#, other/topic/#"
                  value={formData.topics}
                  onChange={(e) => setFormData({ ...formData, topics: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t('configuration.topicsHint')}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={handleCancel}
                className="btn btn-secondary"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                className="btn btn-primary flex items-center gap-2"
                disabled={actionLoading === 'submit'}
              >
                {actionLoading === 'submit' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                {editingId ? t('configuration.saveChanges') : t('configuration.addBroker')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Brokers List */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold flex items-center gap-2">
            <Server className="w-5 h-5 text-primary-600" />
            {t('configuration.configuredBrokers')}
          </h3>
        </div>
        <div className="divide-y divide-gray-100">
          {brokers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Server className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>{t('configuration.noBrokers')}</p>
              <p className="text-sm">{t('configuration.noBrokersHint')}</p>
            </div>
          ) : (
            brokers.map((broker) => (
              <div
                key={broker.id}
                className={clsx(
                  'p-4 flex items-center justify-between hover:bg-gray-50 transition-colors',
                  broker.id === activeBrokerId && 'bg-primary-50 border-l-4 border-primary-500'
                )}
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(broker.status)}
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900">{broker.name}</h4>
                        {broker.isDefault && (
                          <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded">
                            {t('common.default')}
                          </span>
                        )}
                        {broker.id === activeBrokerId && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                            {t('common.active')}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 font-mono">
                        {broker.host}:{broker.port}
                        {broker.useTls && (
                          <Lock className="w-3 h-3 inline ml-1 text-green-600" />
                        )}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right text-sm">
                    <p className={clsx(
                      'font-medium',
                      broker.status === 'connected' && 'text-green-600',
                      broker.status === 'error' && 'text-red-600',
                      broker.status === 'disconnected' && 'text-gray-500'
                    )}>
                      {getStatusText(broker.status)}
                    </p>
                    {(broker.messageCount ?? 0) > 0 && (
                      <p className="text-gray-400">
                        {(broker.messageCount ?? 0).toLocaleString()} msgs
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {/* Connect/Disconnect */}
                    {broker.status === 'connected' ? (
                      <button
                        onClick={() => handleDisconnect(broker.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title={t('configuration.disconnect')}
                        disabled={actionLoading === broker.id}
                      >
                        {actionLoading === broker.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <PowerOff className="w-4 h-4" />
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleConnect(broker.id)}
                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title={t('configuration.connect')}
                        disabled={actionLoading === broker.id}
                      >
                        {actionLoading === broker.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Power className="w-4 h-4" />
                        )}
                      </button>
                    )}
                    {/* Activate */}
                    {broker.id !== activeBrokerId && (
                      <button
                        onClick={() => handleActivate(broker.id)}
                        className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title={t('configuration.activateHint')}
                        disabled={actionLoading === broker.id}
                      >
                        <Radio className="w-4 h-4" />
                      </button>
                    )}
                    {/* Edit */}
                    <button
                      onClick={() => handleEdit(broker)}
                      className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      title={t('common.edit')}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {/* Delete */}
                    {!broker.isDefault && (
                      <button
                        onClick={() => handleDelete(broker.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title={t('configuration.remove')}
                        disabled={actionLoading === broker.id}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
        <h4 className="font-medium text-primary-900 mb-2">{t('configuration.aboutConnections')}</h4>
        <ul className="text-sm text-primary-800 space-y-1">
          <li>• {t('configuration.aboutTip1')}</li>
          <li>• {t('configuration.aboutTip2')}</li>
          <li>• {t('configuration.aboutTip3')}</li>
          <li>• {t('configuration.aboutTip4')}</li>
          <li>• {t('configuration.aboutTip5')}</li>
        </ul>
      </div>
      </>}
    </div>
  );
}

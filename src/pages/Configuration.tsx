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
import { PageHeader } from '../components/ui/page-header';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

const initialFormData: BrokerFormData = {
  name: '',
  host: '',
  port: 1883,
  username: '',
  password: '',
  useTls: false,
  topics: '',
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
      await brokersApi.activate(id);
      await fetchBrokers();
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

  const statusBadgeVariant = (status: string): 'success' | 'warning' | 'destructive' | 'secondary' => {
    switch (status) {
      case 'connected': return 'success';
      case 'connecting': return 'warning';
      case 'error': return 'destructive';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="MQTT Brokers"
        description={t('configuration.subtitle')}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchBrokers} disabled={loading} className="gap-2">
              <RefreshCw className={clsx("w-4 h-4", loading && "animate-spin")} />
              {t('common.refresh')}
            </Button>
            <Button onClick={() => setShowForm(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              {t('configuration.newBroker')}
            </Button>
          </div>
        }
      />

      {/* Error Alert */}
      {error && (
        <Card className="border-destructive/50">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
            <p className="text-destructive flex-1">{error}</p>
            <Button variant="ghost" size="icon" onClick={() => setError(null)}>
              <X className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Broker Form */}
      {showForm && (
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Server className="w-5 h-5 text-primary" />
              {editingId ? t('configuration.editBroker') : t('configuration.newBroker')}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={handleCancel}>
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
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
                  <label className="block text-sm font-medium mb-1">
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
                  <label className="block text-sm font-medium mb-1">
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
                    <span className="text-sm font-medium flex items-center gap-1">
                      {formData.useTls ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                      {t('configuration.useTls')}
                    </span>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
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
                  <label className="block text-sm font-medium mb-1">
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
                  <label className="block text-sm font-medium mb-1">
                    {t('configuration.topicsSubscription')}
                  </label>
                  <input
                    type="text"
                    className="input font-mono"
                    placeholder="topic/#, other/topic/#"
                    value={formData.topics}
                    onChange={(e) => setFormData({ ...formData, topics: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('configuration.topicsHint')}
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" type="button" onClick={handleCancel}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={actionLoading === 'submit'} className="gap-2">
                  {actionLoading === 'submit' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  {editingId ? t('configuration.saveChanges') : t('configuration.addBroker')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Brokers List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Server className="w-5 h-5 text-primary" />
            {t('configuration.configuredBrokers')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {brokers.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Server className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>{t('configuration.noBrokers')}</p>
                <p className="text-sm">{t('configuration.noBrokersHint')}</p>
              </div>
            ) : (
              brokers.map((broker) => (
                <div
                  key={broker.id}
                  className={clsx(
                    'px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors',
                    broker.id === activeBrokerId && 'bg-primary-50/50 border-l-4 border-l-primary-500'
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(broker.status)}
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-medium">{broker.name}</h4>
                          {broker.isDefault && (
                            <Badge variant="secondary" className="text-[10px]">
                              {t('common.default')}
                            </Badge>
                          )}
                          {broker.id === activeBrokerId && (
                            <Badge variant="success" className="text-[10px]">
                              {t('common.active')}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground font-mono">
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
                      <Badge variant={statusBadgeVariant(broker.status)}>
                        {getStatusText(broker.status)}
                      </Badge>
                      {(broker.messageCount ?? 0) > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {(broker.messageCount ?? 0).toLocaleString()} msgs
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {broker.status === 'connected' ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDisconnect(broker.id)}
                          title={t('configuration.disconnect')}
                          disabled={actionLoading === broker.id}
                        >
                          {actionLoading === broker.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <PowerOff className="w-4 h-4" />
                          )}
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleConnect(broker.id)}
                          title={t('configuration.connect')}
                          disabled={actionLoading === broker.id}
                        >
                          {actionLoading === broker.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Power className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                      {broker.id !== activeBrokerId && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleActivate(broker.id)}
                          title={t('configuration.activateHint')}
                          disabled={actionLoading === broker.id}
                        >
                          <Radio className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(broker)}
                        title={t('common.edit')}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      {!broker.isDefault && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(broker.id)}
                          title={t('configuration.remove')}
                          disabled={actionLoading === broker.id}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-primary-50/50 border-primary-200">
        <CardContent className="p-4">
          <h4 className="font-medium text-primary-900 mb-2">{t('configuration.aboutConnections')}</h4>
          <ul className="text-sm text-primary-800 space-y-1">
            <li>• {t('configuration.aboutTip1')}</li>
            <li>• {t('configuration.aboutTip2')}</li>
            <li>• {t('configuration.aboutTip3')}</li>
            <li>• {t('configuration.aboutTip4')}</li>
            <li>• {t('configuration.aboutTip5')}</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

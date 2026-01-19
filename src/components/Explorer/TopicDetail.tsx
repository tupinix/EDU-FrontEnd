import { Clock, Hash, Info, Signal, RefreshCw } from 'lucide-react';
import { TopicDetail as TopicDetailType } from '../../types';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { clsx } from 'clsx';

interface TopicDetailProps {
  topic: string;
  detail: TopicDetailType;
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function TopicDetail({ topic, detail, isLoading, onRefresh }: TopicDetailProps) {
  return (
    <div className="card">
      <div className="card-header flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <Hash className="w-5 h-5 text-primary-500 flex-shrink-0" />
          <h3 className="font-semibold text-gray-900 truncate font-mono text-sm">{topic}</h3>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="Atualizar"
          >
            <RefreshCw className={clsx('w-4 h-4', isLoading && 'animate-spin')} />
          </button>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <MetadataItem
            icon={Signal}
            label="QoS"
            value={detail.qos.toString()}
          />
          <MetadataItem
            icon={Info}
            label="Retained"
            value={detail.retain ? 'Sim' : 'Não'}
            valueColor={detail.retain ? 'text-green-600' : 'text-gray-500'}
          />
          <MetadataItem
            icon={Clock}
            label="Última Atualização"
            value={formatDistanceToNow(new Date(detail.updatedAt), { addSuffix: true, locale: ptBR })}
            title={format(new Date(detail.updatedAt), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
          />
          <MetadataItem
            icon={Hash}
            label="Tipo"
            value={getPayloadType(detail.payload)}
          />
        </div>

        {/* Equipment info from metadata */}
        {detail.metadata?.equipment ? (
          <div className="bg-gray-50 rounded-lg p-3">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Equipamento Associado</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Nome:</span>{' '}
                <span className="font-medium">{String((detail.metadata.equipment as Record<string, unknown>).name ?? '')}</span>
              </div>
              {(detail.metadata.equipment as Record<string, unknown>).type ? (
                <div>
                  <span className="text-gray-500">Tipo:</span>{' '}
                  <span className="font-medium">{String((detail.metadata.equipment as Record<string, unknown>).type ?? '')}</span>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {/* Tag type and unit from metadata */}
        {(detail.metadata?.type || detail.metadata?.unit) ? (
          <div className="flex gap-4 text-sm">
            {detail.metadata?.type ? (
              <div>
                <span className="text-gray-500">Tipo de Tag:</span>{' '}
                <span className="font-medium capitalize">{String(detail.metadata.type)}</span>
              </div>
            ) : null}
            {detail.metadata?.unit ? (
              <div>
                <span className="text-gray-500">Unidade:</span>{' '}
                <span className="font-medium">{String(detail.metadata.unit)}</span>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

interface MetadataItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  valueColor?: string;
  title?: string;
}

function MetadataItem({ icon: Icon, label, value, valueColor, title }: MetadataItemProps) {
  return (
    <div className="flex items-start gap-2" title={title}>
      <Icon className="w-4 h-4 text-gray-400 mt-0.5" />
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className={clsx('text-sm font-medium', valueColor || 'text-gray-900')}>{value}</p>
      </div>
    </div>
  );
}

function getPayloadType(payload: unknown): string {
  if (payload === null) return 'null';
  if (Array.isArray(payload)) return 'array';
  if (typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    if (obj.value !== undefined) {
      return typeof obj.value;
    }
    return 'object';
  }
  return typeof payload;
}

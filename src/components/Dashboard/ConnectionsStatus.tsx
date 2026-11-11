import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Lock, Radio, Network, Cpu, CircuitBoard, Plus } from 'lucide-react';
import { useBrokersStatus } from '../../hooks/useMetrics';
import { useModbusConnections } from '../../hooks/useModbus';
import { useOpcUaConnections } from '../../hooks/useOpcUa';
import { useEthipConnections } from '../../hooks/useEthernetIp';
import type { BrokerConfig, ModbusConnection, OpcUaConnection, EthipConnection } from '../../types';
import { cn } from '@/lib/utils';

type ProtoKind = 'mqtt' | 'opcua' | 'modbus' | 'ethip';

interface UnifiedConnection {
  id: string;
  kind: ProtoKind;
  name: string;
  host: string;          // display host (e.g. "broker.hivemq.com:8883" or "opc.tcp://...")
  status: string;
  isActive?: boolean;    // for MQTT
  useTls?: boolean;      // for MQTT
}

// Display order, colour (sampled from the logo gradient) and, when Cloud has one, the page
// that manages each protocol.
const META: Record<ProtoKind, { label: string; color: string; icon: typeof Radio; path?: string }> = {
  mqtt:   { label: 'MQTT',        color: '#22a04a', icon: Radio,        path: '/configuration' },
  opcua:  { label: 'OPC UA',      color: '#2177c0', icon: Network },
  modbus: { label: 'Modbus',      color: '#12a8b7', icon: Cpu },
  ethip:  { label: 'EtherNet/IP', color: '#6d5bd0', icon: CircuitBoard },
};

const STATUS_DOT: Record<string, string> = {
  connected:    'bg-emerald-500',
  connecting:   'bg-amber-400 animate-pulse',
  disconnected: 'bg-gray-300 dark:bg-gray-600',
  error:        'bg-red-500',
};

export function ConnectionsStatus() {
  const { t } = useTranslation();
  const { data: brokersData } = useBrokersStatus();
  const { data: modbusList } = useModbusConnections();
  const { data: opcuaList } = useOpcUaConnections();
  const { data: ethipList } = useEthipConnections();

  const all: UnifiedConnection[] = [
    ...(brokersData?.brokers ?? []).map((b: BrokerConfig): UnifiedConnection => ({
      id: `mqtt-${b.id}`,
      kind: 'mqtt',
      name: b.name,
      host: `${b.host}:${b.port}`,
      status: b.status,
      isActive: b.id === brokersData?.activeBrokerId,
      useTls: b.useTls,
    })),
    ...((modbusList ?? []) as ModbusConnection[]).map((c): UnifiedConnection => ({
      id: `modbus-${c.id}`,
      kind: 'modbus',
      name: c.name,
      host: `${c.host}:${c.port}`,
      status: c.status,
    })),
    ...((opcuaList ?? []) as OpcUaConnection[]).map((c): UnifiedConnection => ({
      id: `opcua-${c.id}`,
      kind: 'opcua',
      name: c.name,
      host: c.endpointUrl,
      status: c.status,
    })),
    ...((ethipList ?? []) as EthipConnection[]).map((c): UnifiedConnection => ({
      id: `ethip-${c.id}`,
      kind: 'ethip',
      name: c.name,
      host: `${c.host}/${c.slot}`,
      status: c.status,
    })),
  ];

  const connected = all.filter((c) => c.status === 'connected').length;
  const groups = (Object.keys(META) as ProtoKind[])
    .map((kind) => ({ kind, list: all.filter((c) => c.kind === kind) }))
    .filter((g) => g.list.length > 0);

  if (all.length === 0) {
    return (
      <section className="rounded-2xl border border-gray-200/80 bg-white px-6 py-10 text-center dark:border-gray-800 dark:bg-gray-900">
        <p className="text-[14.5px] font-medium text-gray-900 dark:text-gray-100">{t('dashboard.connections.emptyTitle')}</p>
        <p className="mx-auto mt-1 max-w-sm text-[13px] text-gray-500 dark:text-gray-400">{t('dashboard.connections.emptyDesc')}</p>
        <Link
          to="/configuration"
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#03140c] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#0b3a26] dark:bg-primary dark:hover:bg-primary/90"
        >
          <Plus className="h-3.5 w-3.5" />
          {t('dashboard.connections.add')}
        </Link>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-baseline justify-between px-6 pb-3 pt-5">
        <h2 className="text-[15px] font-semibold text-gray-950 dark:text-gray-50">{t('dashboard.connections.title')}</h2>
        <span className="text-[13px] text-gray-500 dark:text-gray-400">
          {t('dashboard.connections.summary', { connected, total: all.length })}
        </span>
      </div>
      <div className="max-h-[520px] overflow-y-auto">
        {groups.map(({ kind, list }) => {
          const meta = META[kind];
          const Icon = meta.icon;
          const on = list.filter((c) => c.status === 'connected').length;
          return (
            <div key={kind} className="border-t border-gray-100 px-6 py-3 dark:border-gray-800">
              {(() => {
                const head = (
                  <>
                    <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: meta.color }} />
                    <span className="text-[13px] font-medium text-gray-800 group-hover:underline dark:text-gray-200">{meta.label}</span>
                    <span className="text-[12.5px] tabular-nums text-gray-400">{on}/{list.length}</span>
                    <span className="ml-2 flex h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800" aria-hidden>
                      <span className="rounded-full" style={{ width: `${(on / list.length) * 100}%`, background: meta.color }} />
                    </span>
                  </>
                );
                const cls = 'group mb-1.5 flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary/40';
                return meta.path ? <Link to={meta.path} className={cls}>{head}</Link> : <div className={cls}>{head}</div>;
              })()}
              {list.map((conn) => (
                <div key={conn.id} className="flex items-center gap-3 py-1.5 pl-5">
                  <span className={cn('h-2 w-2 shrink-0 rounded-full', STATUS_DOT[conn.status] ?? 'bg-gray-300')} />
                  <span className="sr-only">{t(`header.status.${conn.status}`, conn.status)}</span>
                  <span className="truncate text-[13.5px] text-gray-900 dark:text-gray-100">{conn.name}</span>
                  {conn.useTls && <Lock className="h-3 w-3 shrink-0 text-gray-400" aria-label="TLS" />}
                  {conn.isActive && (
                    <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[11.5px] font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                      {t('dashboard.connections.active')}
                    </span>
                  )}
                  <span className="ml-auto hidden truncate pl-3 font-mono text-[12px] text-gray-400 sm:block">{conn.host}</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </section>
  );
}

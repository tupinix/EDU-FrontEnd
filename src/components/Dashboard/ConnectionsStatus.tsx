import { Lock, Radio, Network, Cpu, CircuitBoard } from 'lucide-react';
import { useBrokersStatus } from '../../hooks/useMetrics';
import { useModbusConnections } from '../../hooks/useModbus';
import { useOpcUaConnections } from '../../hooks/useOpcUa';
import { useEthipConnections } from '../../hooks/useEthernetIp';
import type { BrokerConfig, ModbusConnection, OpcUaConnection, EthipConnection } from '../../types';
import { cn } from '@/lib/utils';

type ProtoKind = 'mqtt' | 'modbus' | 'opcua' | 'ethip';

interface UnifiedConnection {
  id: string;
  kind: ProtoKind;
  name: string;
  host: string;          // display host (e.g. "broker.hivemq.com:8883" or "opc.tcp://...")
  status: string;
  isActive?: boolean;    // for MQTT
  useTls?: boolean;      // for MQTT
}

const META: Record<ProtoKind, { label: string; color: string; icon: typeof Radio }> = {
  mqtt:   { label: 'MQTT',        color: 'bg-orange-500',  icon: Radio },
  modbus: { label: 'Modbus',      color: 'bg-blue-500',    icon: Cpu },
  opcua:  { label: 'OPC-UA',      color: 'bg-purple-500',  icon: Network },
  ethip:  { label: 'EtherNet/IP', color: 'bg-emerald-500', icon: CircuitBoard },
};

const STATUS_DOT: Record<string, string> = {
  connected:    'bg-emerald-400',
  connecting:   'bg-amber-400 animate-pulse',
  disconnected: 'bg-gray-300',
  error:        'bg-red-400',
};

export function ConnectionsStatus() {
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

  const totals = {
    total: all.length,
    connected: all.filter((c) => c.status === 'connected').length,
  };

  if (all.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 p-8 text-center">
        <p className="text-[13px] text-gray-300">No connections configured</p>
        <p className="text-[11px] text-gray-300 mt-1">Add an MQTT broker, OPC-UA server, Modbus or EtherNet/IP device</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <h3 className="text-[13px] font-semibold text-gray-900 dark:text-gray-100">Connections</h3>
        <span className="text-[11px] text-gray-400">
          <span className="font-medium text-emerald-600 dark:text-emerald-400">{totals.connected}</span>
          <span className="text-gray-300"> / {totals.total} active</span>
        </span>
      </div>
      <div className="divide-y divide-gray-50 dark:divide-gray-800/50 max-h-[420px] overflow-y-auto">
        {all.map((conn) => {
          const meta = META[conn.kind];
          const Icon = meta.icon;
          return (
            <div key={conn.id} className="px-6 py-3 flex items-center gap-3">
              <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', STATUS_DOT[conn.status] ?? 'bg-gray-300')} />
              <span className={cn(
                'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider shrink-0',
                'bg-gray-50 dark:bg-gray-800/60 text-gray-600 dark:text-gray-400 border border-gray-100 dark:border-gray-800'
              )}>
                <Icon className="w-2.5 h-2.5" />
                {meta.label}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-[13px] font-medium text-gray-900 dark:text-gray-100 truncate">{conn.name}</p>
                  {conn.useTls && <Lock className="w-3 h-3 text-gray-300 shrink-0" />}
                  {conn.isActive && (
                    <span className="text-[9px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded shrink-0">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 font-mono truncate">{conn.host}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

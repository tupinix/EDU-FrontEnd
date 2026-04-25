import { useState, useEffect, useRef } from 'react';
import {
  Radar, Loader2, AlertTriangle, Wifi, Cpu, CircuitBoard, Network, Radio,
  Cable, MonitorSmartphone,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { discoveryApi } from '../services/api';
import type { DiscoveryScan, DiscoveredDevice, DiscoveredProtocol, DiscoveryProtocolKind } from '../types';
import { cn } from '@/lib/utils';

const PROTOCOL_META: Record<DiscoveryProtocolKind, { label: string; color: string; icon: typeof Cpu }> = {
  modbus: { label: 'Modbus', color: 'bg-blue-500', icon: Cpu },
  ethernetip: { label: 'EtherNet/IP', color: 'bg-emerald-500', icon: CircuitBoard },
  opcua: { label: 'OPC-UA', color: 'bg-purple-500', icon: Network },
  mqtt: { label: 'MQTT', color: 'bg-orange-500', icon: Radio },
  s7: { label: 'S7', color: 'bg-teal-500', icon: Cable },
  'http-hmi': { label: 'HTTP', color: 'bg-gray-500', icon: MonitorSmartphone },
};

const PROTOCOL_ROUTE: Record<string, string> = {
  modbus: '/modbus',
  ethernetip: '/ethip',
  opcua: '/opcua',
  mqtt: '/configuration',
  s7: '/modbus',  // fallback — S7 form not implemented yet
  'http-hmi': '',
};

export function NetworkScan() {
  const navigate = useNavigate();
  const [cidr, setCidr] = useState('');
  const [suggestedIp, setSuggestedIp] = useState('');
  const [scan, setScan] = useState<DiscoveryScan | null>(null);
  const [error, setError] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Suggest CIDR from backend interfaces
  useEffect(() => {
    let cancelled = false;
    discoveryApi.getSuggestedCidr()
      .then((s) => {
        if (cancelled) return;
        if (s) { setCidr(s.cidr); setSuggestedIp(s.ip); }
        else setCidr('192.168.1.0/24');
      })
      .catch(() => { if (!cancelled) setCidr('192.168.1.0/24'); });
    return () => { cancelled = true; };
  }, []);

  // Load latest scan on mount
  useEffect(() => {
    let cancelled = false;
    discoveryApi.getLatest().then((s) => { if (!cancelled && s) setScan(s); }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Poll running scan
  useEffect(() => {
    if (!scan || scan.status !== 'running') return;
    pollRef.current = setInterval(async () => {
      try {
        const updated = await discoveryApi.getScan(scan.id);
        setScan(updated);
        if (updated.status !== 'running' && pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      } catch { /* noop */ }
    }, 1500);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [scan?.id, scan?.status]);

  const handleStart = async () => {
    setError('');
    try {
      const s = await discoveryApi.startScan(cidr);
      setScan(s);
    } catch (err) {
      // Surface backend's user-friendly message ("CIDR too large", etc.) instead of "Request failed with status code 400"
      // axios attaches it on err.response.data.error
      const axiosErr = err as { response?: { data?: { error?: string } }; message?: string };
      const msg = axiosErr.response?.data?.error || axiosErr.message || 'Scan failed';
      setError(msg);
    }
  };

  const handleCancel = async () => {
    if (!scan) return;
    try {
      await discoveryApi.cancelScan(scan.id);
      const s = await discoveryApi.getScan(scan.id);
      setScan(s);
    } catch { /* noop */ }
  };

  const isRunning = scan?.status === 'running';
  const progress = scan ? Math.round((scan.hostsScanned / Math.max(scan.hostsTotal, 1)) * 100) : 0;

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight flex items-center gap-2">
            <Radar className="w-5 h-5 text-gray-400" />
            Network Scan
          </h1>
          <p className="text-[12px] sm:text-[13px] text-gray-400 mt-0.5">
            Find industrial devices on the local network (Modbus / EtherNet-IP / OPC-UA / MQTT)
            {suggestedIp && <span className="ml-2">— interface: <span className="font-mono text-gray-500">{suggestedIp}</span></span>}
          </p>
        </div>
      </div>

      {/* Scan controls */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-end gap-3">
        <div className="flex-1">
          <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1.5">CIDR / IP Range</label>
          <input
            type="text" value={cidr} onChange={(e) => setCidr(e.target.value)}
            placeholder="192.168.1.0/24"
            disabled={isRunning}
            className="input-clean font-mono text-[13px]"
          />
        </div>
        {isRunning ? (
          <button
            onClick={handleCancel}
            className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-[13px] font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Cancel
          </button>
        ) : (
          <button
            onClick={handleStart}
            disabled={!cidr.trim()}
            className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[13px] font-medium rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-40"
          >
            <Radar className="w-3.5 h-3.5" />
            Scan Now
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-xl px-4 py-3 text-[13px] text-red-500 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Progress bar */}
      {scan && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 overflow-hidden">
          <div className="px-4 sm:px-5 py-3 flex items-center gap-3">
            <div className="flex-1">
              <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 mb-1.5">
                <span>
                  {scan.hostsScanned} / {scan.hostsTotal} hosts scanned
                  <span className="ml-2 text-gray-300">({scan.cidr})</span>
                </span>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Found: {scan.devicesFound}
                </span>
              </div>
              <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full transition-all',
                    scan.status === 'running' ? 'bg-blue-500' :
                    scan.status === 'completed' ? 'bg-emerald-500' :
                    scan.status === 'cancelled' ? 'bg-gray-400' :
                    'bg-red-500'
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <StatusBadge status={scan.status} />
          </div>
        </div>
      )}

      {/* Devices table */}
      {scan && scan.devices.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-[13px] font-semibold text-gray-900 dark:text-gray-100">Discovered Devices</h3>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
            {scan.devices
              .slice()
              .sort((a, b) => a.ip.localeCompare(b.ip, undefined, { numeric: true }))
              .map((device) => (
                <DeviceRow key={device.id} device={device} onConnect={(hint) => {
                  const route = PROTOCOL_ROUTE[hint.protocol];
                  if (!route) return;
                  navigate(route, { state: { prefill: hint.fields, scannerIp: device.ip } });
                }} />
              ))}
          </div>
        </div>
      )}

      {scan && scan.status !== 'running' && scan.devices.length === 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 px-6 py-12 text-center">
          <Wifi className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-[14px] text-gray-400">No industrial devices found on {scan.cidr}</p>
          <p className="text-[12px] text-gray-300 mt-1">Try a different CIDR or check if your gateway is on the same subnet</p>
        </div>
      )}

      {!scan && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 px-6 py-12 text-center">
          <Radar className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-[14px] text-gray-400">Ready to scan</p>
          <p className="text-[12px] text-gray-300 mt-1">Click "Scan Now" to find devices on your network</p>
        </div>
      )}
    </div>
  );
}

// ── Device row ──────────────────────────────────────────────────────

function DeviceRow({ device, onConnect }: { device: DiscoveredDevice; onConnect: (hint: { protocol: string; fields: Record<string, unknown> }) => void }) {
  return (
    <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-[14px] font-mono font-medium text-gray-900 dark:text-gray-100">{device.ip}</p>
          {device.hostname && <span className="text-[11px] text-gray-400">({device.hostname})</span>}
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {device.protocols.map((proto, i) => <ProtocolChip key={i} proto={proto} />)}
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 shrink-0">
        {device.protocols
          .filter((p) => p.connectHint && PROTOCOL_ROUTE[p.connectHint.protocol])
          .map((proto, i) => (
            <button
              key={i}
              onClick={() => proto.connectHint && onConnect(proto.connectHint)}
              className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Connect {PROTOCOL_META[proto.kind].label}
            </button>
          ))}
      </div>
    </div>
  );
}

function ProtocolChip({ proto }: { proto: DiscoveredProtocol }) {
  const meta = PROTOCOL_META[proto.kind];
  const Icon = meta.icon;
  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
      <span className={cn('w-1.5 h-1.5 rounded-full', meta.color)} />
      <Icon className="w-3 h-3 text-gray-400" />
      <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300">{meta.label}</span>
      {proto.vendor && <span className="text-[11px] text-gray-400 border-l border-gray-200 dark:border-gray-700 pl-1.5 ml-0.5">{proto.vendor}</span>}
      {proto.product && <span className="text-[11px] text-gray-500 dark:text-gray-400 font-mono">{proto.product}</span>}
      {proto.firmware && <span className="text-[10px] text-gray-400">v{proto.firmware}</span>}
    </div>
  );
}

function StatusBadge({ status }: { status: DiscoveryScan['status'] }) {
  const meta: Record<DiscoveryScan['status'], { label: string; className: string }> = {
    running:   { label: 'Running',   className: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' },
    completed: { label: 'Complete',  className: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' },
    cancelled: { label: 'Cancelled', className: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400' },
    error:     { label: 'Error',     className: 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400' },
  };
  const m = meta[status];
  return (
    <span className={cn('text-[10px] font-medium px-2 py-1 rounded uppercase tracking-wider shrink-0', m.className)}>
      {m.label}
    </span>
  );
}

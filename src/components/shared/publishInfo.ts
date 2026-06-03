import { useBrokersStatus } from '../../hooks/useMetrics';

/**
 * Shared helpers for showing WHERE and HOW OFTEN a tag/register/subscription
 * publishes — surfaced in the protocol monitor tables (Modbus, EtherNet/IP,
 * OPC-UA). The publish target (brokerId) and sampling interval already live on
 * each config row; these helpers just resolve the broker's display name and
 * format the frequency consistently.
 */

export function useBrokerNameMap(): (brokerId?: string | null) => string {
  const { data } = useBrokersStatus();
  const brokers = data?.brokers ?? [];
  const activeId = data?.activeBrokerId ?? null;
  return (brokerId?: string | null) => {
    const id = brokerId || activeId;
    if (!id) return '—';
    const b = brokers.find((x) => x.id === id);
    const name = b?.name ?? id;
    return brokerId ? name : `${name} (ativo)`;
  };
}

// 1000 → "1.0s", 500 → "500ms", 250 → "250ms". Also shows the rate in Hz when ≥1s.
export function fmtFrequency(ms?: number): string {
  if (!ms || ms <= 0) return '—';
  if (ms < 1000) return `${ms}ms`;
  const s = ms / 1000;
  return `${s % 1 === 0 ? s : s.toFixed(1)}s`;
}

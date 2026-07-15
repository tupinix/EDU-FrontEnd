import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, ChevronRight, Loader2, Minus, Plus, RefreshCw, Search, Send, X } from 'lucide-react';
import {
  opcuaApi,
  southboundApi,
  DiscoveredMethod,
  DiscoveredMethodArgument,
  MethodCallArgument,
  MethodDiscovery,
  SouthboundCommandRow,
} from '../../services/api';
import { OpcUaConnection } from '../../types';
import { cn } from '@/lib/utils';

const POLL_INTERVAL_MS = 1000;
const POLL_ATTEMPTS = 15;
const METHODS_STALE_MS = 60_000;
const MAX_ARRAY_ELEMENTS = 16;

/** crypto.randomUUID only exists in secure contexts (https/localhost); the UI
 *  is also served over plain http on the LAN, so fall back to getRandomValues. */
function newIdempotencyKey(): string {
  const c = globalThis.crypto as Crypto | undefined;
  if (c?.randomUUID) return `MC-${c.randomUUID()}`;
  const bytes = c
    ? c.getRandomValues(new Uint8Array(16))
    : Uint8Array.from({ length: 16 }, () => Math.floor(Math.random() * 256));
  return `MC-${[...bytes].map((x) => x.toString(16).padStart(2, '0')).join('')}`;
}

const NUMERIC_TYPES = new Set([
  'Int16', 'Int32', 'Int64', 'UInt16', 'UInt32', 'UInt64', 'Byte', 'SByte', 'Float', 'Double', 'Duration',
]);

/** dataTypeName -> node-opcua DataType name used by the backend dispatcher. */
const DATA_TYPE_MAP: Record<string, string> = {
  String: 'String',
  Boolean: 'Boolean',
  Int16: 'Int16',
  Int32: 'Int32',
  Int64: 'Int64',
  UInt16: 'UInt16',
  UInt32: 'UInt32',
  UInt64: 'UInt64',
  Byte: 'Byte',
  SByte: 'SByte',
  Float: 'Float',
  Double: 'Double',
  Duration: 'Double',
  DateTime: 'DateTime',
  NodeId: 'NodeId',
  LocalizedText: 'LocalizedText',
};

// ---- field model -----------------------------------------------------------
// An argument is either "simple" (one basic-typed input) or "struct" (its type
// has a DataTypeDefinition): scalar structs get one field group, array structs
// get a UaExpert-style size stepper where each element expands into the typed
// fields of the structure.

interface FieldSpec {
  name: string;
  dataTypeName: string;
  dataTypeNodeId: string;
  valueRank: number;
  description?: string;
  structure?: FieldSpec[];
  enumValues?: Array<{ name: string; value: number }>;
}

type SimpleKind = 'text' | 'checkbox' | 'number' | 'datetime' | 'stringLines' | 'enum' | 'json';

function simpleKindOf(f: FieldSpec): SimpleKind {
  if (f.enumValues && f.enumValues.length > 0) return 'enum';
  const isArray = f.valueRank >= 1;
  if (f.dataTypeName === 'String') return isArray ? 'stringLines' : 'text';
  if (f.dataTypeName === 'LocalizedText' && !isArray) return 'text';
  if (isArray) return 'json';
  if (f.structure) return 'json'; // nested struct inside a struct: raw JSON
  if (f.dataTypeName === 'Boolean') return 'checkbox';
  if (NUMERIC_TYPES.has(f.dataTypeName)) return 'number';
  if (f.dataTypeName === 'DateTime') return 'datetime';
  if (DATA_TYPE_MAP[f.dataTypeName]) return 'text';
  return 'json';
}

type Raw = string | boolean;
type ElementValues = Record<string, Raw>;
type ArgState = { kind: 'simple'; raw: Raw } | { kind: 'struct'; elements: ElementValues[] };

function defaultRaw(f: FieldSpec): Raw {
  const kind = simpleKindOf(f);
  if (kind === 'checkbox') return false;
  if (kind === 'enum') return String(f.enumValues![0]?.value ?? 0);
  if (kind === 'json') return f.valueRank >= 1 ? '[]' : '{}';
  return '';
}

function newElement(structure: FieldSpec[]): ElementValues {
  return Object.fromEntries(structure.map((f) => [f.name, defaultRaw(f)]));
}

function initialArgStates(method: DiscoveredMethod): ArgState[] {
  return method.inputArguments.map((arg) => {
    if (arg.structure && arg.structure.length > 0) {
      // Scalar struct: exactly one element. Array struct: start at 1 like UaExpert.
      return { kind: 'struct', elements: [newElement(arg.structure)] };
    }
    return { kind: 'simple', raw: defaultRaw(arg) };
  });
}

// ---- coercion (raw input -> JS value for the OPC UA call) -------------------

class FieldError extends Error {
  constructor(public readonly field: string, public readonly errorKey: string) { super(errorKey); }
}

function coerceField(f: FieldSpec, raw: Raw): unknown {
  switch (simpleKindOf(f)) {
    case 'text':
      return String(raw);
    case 'checkbox':
      return raw === true;
    case 'enum':
      return Number(raw);
    case 'number': {
      const text = String(raw).trim();
      if (text === '') return 0;
      const n = Number(text);
      if (Number.isNaN(n)) throw new FieldError(f.name, 'southbound.methods.modal.invalidNumber');
      return n;
    }
    case 'datetime': {
      const text = String(raw).trim();
      if (text === '') return new Date(0).toISOString();
      const d = new Date(text);
      if (Number.isNaN(d.getTime())) throw new FieldError(f.name, 'southbound.methods.modal.invalidDate');
      return d.toISOString();
    }
    case 'stringLines':
      return String(raw).split('\n').filter((l) => l.trim().length > 0);
    case 'json':
      try {
        return JSON.parse(String(raw));
      } catch {
        throw new FieldError(f.name, 'southbound.methods.modal.invalidJson');
      }
  }
}

function buildArgument(arg: DiscoveredMethodArgument, state: ArgState): MethodCallArgument {
  if (state.kind === 'struct') {
    const elements = state.elements.map((el) =>
      Object.fromEntries((arg.structure ?? []).map((f) => [f.name, coerceField(f, el[f.name] ?? defaultRaw(f))])),
    );
    const body = arg.valueRank >= 1 ? elements : elements[0] ?? {};
    return { dataType: 'ExtensionObject', value: { typeId: arg.dataTypeNodeId, body } };
  }
  const value = coerceField(arg, state.raw);
  const mapped = DATA_TYPE_MAP[arg.dataTypeName];
  if (mapped) return { dataType: mapped, value };
  return { dataType: 'ExtensionObject', value: { typeId: arg.dataTypeNodeId, body: value } };
}

// ---- presentation helpers ---------------------------------------------------

/** Strip the DeviceSet/machine prefix: "DeviceSet/IMM_x/Jobs/ActiveJob" -> "Jobs / ActiveJob". */
function groupLabel(path: string): string {
  const parts = path.split('/').filter(Boolean);
  const start = parts.findIndex((p) => p === 'DeviceSet');
  const rest = start >= 0 ? parts.slice(start + 2) : parts;
  return (rest.length > 0 ? rest : parts).join(' / ');
}

const inputCls = 'mt-1 w-full px-3 py-2 text-[13px] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-white/10';
const ghostBtn = 'px-3 py-1.5 text-[12px] font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors';
const typeBadge = 'text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-500 shrink-0';
const stepBtn = 'p-1 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/60 disabled:opacity-30 transition-colors';

// ---- browser ----------------------------------------------------------------

export function MethodBrowser() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<DiscoveredMethod | null>(null);

  // Machine picker: EUROMAP-enabled connections, no free-typing.
  const { data: connections } = useQuery<OpcUaConnection[], Error>({
    queryKey: ['opcua-connections'],
    queryFn: opcuaApi.getConnections,
    refetchInterval: 5000,
  });
  const machines = useMemo(
    () => (connections ?? []).filter((c) => c.euromapEnabled).map((c) => c.machineId || c.name),
    [connections],
  );
  const [machineId, setMachineId] = useState('');
  const activeMachine = machineId || machines[0] || '';

  const { data, isFetching, refetch, error } = useQuery<MethodDiscovery, Error>({
    queryKey: ['southbound-methods', activeMachine],
    queryFn: () => southboundApi.listMethods(activeMachine),
    staleTime: METHODS_STALE_MS,
    retry: false,
    enabled: activeMachine.length > 0,
  });

  const groups = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = (data?.methods ?? []).filter(
      (m) => !q || m.browseName.toLowerCase().includes(q) || m.displayName.toLowerCase().includes(q),
    );
    const map = new Map<string, DiscoveredMethod[]>();
    for (const m of filtered) map.set(m.objectPath, [...(map.get(m.objectPath) ?? []), m]);
    return [...map.entries()];
  }, [data, search]);

  const loading = isFetching && !data;

  return (
    <section className="space-y-2">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h2 className="text-[13px] font-semibold text-gray-900 dark:text-gray-100">{t('southbound.methods.title')}</h2>
          <p className="text-[12px] text-gray-400 mt-0.5">{t('southbound.methods.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <label className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('southbound.methods.searchPlaceholder')}
              className="w-32 bg-transparent text-[12px] text-gray-900 dark:text-gray-100 focus:outline-none"
            />
          </label>
          {machines.length > 0 && (
            <select
              value={activeMachine}
              onChange={(e) => setMachineId(e.target.value)}
              className="px-2.5 py-1.5 text-[12px] font-mono rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              {machines.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          )}
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 px-2 py-1.5 text-[12px] text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
            title={t('southbound.methods.refresh')}
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isFetching && 'animate-spin')} />
          </button>
        </div>
      </div>

      {data && !data.armed && (
        <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30 rounded-xl px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-[12px] text-amber-700 dark:text-amber-400">{t('southbound.methods.notArmed', { machineId: activeMachine })}</p>
        </div>
      )}

      {activeMachine === '' ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 px-6 py-8 text-center text-[13px] text-gray-400">
          {t('southbound.methods.empty')}
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-xl px-4 py-3 text-[13px] text-red-500">
          {error.message}
        </div>
      ) : loading ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 flex items-center justify-center gap-2 py-10 text-[12px] text-gray-400">
          <Loader2 className="w-4 h-4 text-gray-300 animate-spin" /> {t('southbound.methods.loading')}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 overflow-hidden">
          {groups.length === 0 ? (
            <div className="px-6 py-8 text-center text-[13px] text-gray-400">
              {search.trim() ? t('southbound.methods.noMatch') : t('southbound.methods.empty')}
            </div>
          ) : (
            groups.map(([path, methods]) => (
              <div key={path}>
                <div className="px-5 py-2 bg-gray-50/60 dark:bg-gray-800/40 border-b border-gray-100 dark:border-gray-800" title={path}>
                  <p className="text-[11px] font-medium text-gray-500 truncate">{groupLabel(path)}</p>
                </div>
                <div className="divide-y divide-gray-50 dark:divide-gray-800/50 border-b border-gray-100 dark:border-gray-800 last:border-b-0">
                  {methods.map((m) => (
                    <button
                      key={m.methodNodeId}
                      onClick={() => setSelected(m)}
                      title={m.userExecutable ? m.methodNodeId : t('southbound.methods.notExecutable')}
                      className={cn(
                        'w-full px-5 py-2.5 flex items-center gap-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors',
                        !m.userExecutable && 'opacity-50',
                      )}
                    >
                      <span className="text-[13px] min-w-0 truncate">
                        <span className="font-medium text-gray-900 dark:text-gray-100">{m.browseName}</span>
                        <span className="text-gray-400 font-mono text-[12px]">
                          ({m.inputArguments.map((a) => a.name).join(', ')})
                        </span>
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-300 shrink-0 ml-auto" />
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {selected && (
        <MethodCallModal key={selected.methodNodeId} machineId={activeMachine} method={selected} onClose={() => setSelected(null)} />
      )}
    </section>
  );
}

// ---- call modal -------------------------------------------------------------

function MethodCallModal({ machineId, method, onClose }: { machineId: string; method: DiscoveredMethod; onClose: () => void }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [states, setStates] = useState<ArgState[]>(() => initialArgStates(method));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<SouthboundCommandRow | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  // StrictMode mounts, unmounts and remounts in dev; re-assert `true` on every
  // mount or the poll loop bails out and the spinner never resolves.
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; };
  }, []);

  const setState = (i: number, next: ArgState) => setStates((cur) => cur.map((s, j) => (j === i ? next : s)));

  const send = async () => {
    const errors: Record<string, string> = {};
    const args: MethodCallArgument[] = [];
    method.inputArguments.forEach((arg, i) => {
      try {
        args.push(buildArgument(arg, states[i]));
      } catch (e) {
        if (e instanceof FieldError) errors[`${i}:${e.field}`] = t(e.errorKey);
        else errors[`${i}:${arg.name}`] = e instanceof Error ? e.message : String(e);
      }
    });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setBusy(true);
    setSendError(null);
    setResult(null);
    setTimedOut(false);
    try {
      // New key per send so a resend is a fresh command, never deduplicated.
      const idempotencyKey = newIdempotencyKey();
      await southboundApi.dispatchMethodCall(machineId, {
        idempotencyKey,
        methodName: method.browseName,
        objectNodeId: method.objectNodeId,
        methodNodeId: method.methodNodeId,
        arguments: args,
      });
      for (let i = 0; i < POLL_ATTEMPTS; i++) {
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
        if (!alive.current) return;
        try {
          const row = await southboundApi.getCommandByKey(idempotencyKey);
          if (row.status !== 'received') {
            if (alive.current) {
              setResult(row);
              setBusy(false);
            }
            qc.invalidateQueries({ queryKey: ['southbound-commands'] });
            return;
          }
        } catch {
          // Row may not be visible yet (404 until persisted); keep polling.
        }
      }
      if (alive.current) {
        setTimedOut(true);
        setBusy(false);
      }
      qc.invalidateQueries({ queryKey: ['southbound-commands'] });
    } catch (e) {
      if (alive.current) {
        setSendError(e instanceof Error ? e.message : String(e));
        setBusy(false);
      }
    }
  };

  const ack = result?.ack_payload ?? null;
  const ackError = result?.error || ack?.error || null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-3xl max-h-[88vh] flex flex-col bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[14px] font-semibold text-gray-900 dark:text-gray-100 truncate">{method.displayName}</p>
              {method.description && <p className="text-[12px] text-gray-400 mt-0.5">{method.description}</p>}
              <p className="text-[11px] font-mono text-gray-400 mt-1.5 truncate" title={`${method.objectNodeId} / ${method.methodNodeId}`}>
                {method.methodNodeId} · {machineId}
              </p>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto px-5 py-4 space-y-4">
          {method.inputArguments.length === 0 ? (
            <p className="text-[12px] text-gray-400">{t('southbound.methods.modal.noArgs')}</p>
          ) : (
            <div className="space-y-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{t('southbound.methods.modal.inputArgs')}</p>
              {method.inputArguments.map((arg, i) =>
                states[i].kind === 'struct' ? (
                  <StructArg
                    key={`${i}-${arg.name}`}
                    arg={arg}
                    state={states[i] as { kind: 'struct'; elements: ElementValues[] }}
                    errors={fieldErrors}
                    argIndex={i}
                    onChange={(next) => setState(i, next)}
                  />
                ) : (
                  <SimpleField
                    key={`${i}-${arg.name}`}
                    field={arg}
                    value={(states[i] as { kind: 'simple'; raw: Raw }).raw}
                    error={fieldErrors[`${i}:${arg.name}`]}
                    onChange={(raw) => setState(i, { kind: 'simple', raw })}
                  />
                ),
              )}
            </div>
          )}

          {result && (
            <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-4 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{t('southbound.methods.modal.result')}</span>
                <span
                  className={cn(
                    'text-[11px] px-2 py-0.5 rounded-md font-medium',
                    result.status === 'ACK'
                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
                      : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
                  )}
                >
                  {result.status}
                </span>
                {ack?.statusCode !== undefined && (
                  <span className="text-[11px] font-mono text-gray-500">
                    {t('southbound.methods.modal.statusCode')}: {String(ack.statusCode)}
                  </span>
                )}
              </div>
              {ackError && <p className="text-[12px] text-red-500">{ackError}</p>}
              {ack?.outputs !== undefined && ack.outputs !== null && (
                <div>
                  <p className="text-[11px] text-gray-400 mb-1">{t('southbound.methods.modal.outputs')}</p>
                  <pre className="text-[11px] font-mono text-gray-600 dark:text-gray-300 overflow-auto max-h-48">
                    {JSON.stringify(ack.outputs, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {timedOut && (
            <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30 rounded-xl px-4 py-3">
              <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <p className="text-[12px] text-amber-700 dark:text-amber-400">{t('southbound.methods.modal.timeout')}</p>
            </div>
          )}

          {sendError && <p className="text-[12px] text-red-500">{sendError}</p>}
        </div>

        <div className="px-5 py-3 flex items-center justify-between gap-3 border-t border-gray-100 dark:border-gray-800">
          <span className="text-[12px] text-gray-400 flex items-center gap-1.5 min-w-0">
            {busy && (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" /> {t('southbound.methods.modal.waiting')}
              </>
            )}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={onClose} className={ghostBtn}>{t('southbound.methods.modal.close')}</button>
            <button
              onClick={send}
              disabled={busy}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[13px] font-medium rounded-xl disabled:opacity-50"
            >
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} {t('southbound.methods.modal.send')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- struct argument (UaExpert-style array editor) --------------------------

function StructArg({
  arg, state, errors, argIndex, onChange,
}: {
  arg: DiscoveredMethodArgument;
  state: { kind: 'struct'; elements: ElementValues[] };
  errors: Record<string, string>;
  argIndex: number;
  onChange: (next: ArgState) => void;
}) {
  const { t } = useTranslation();
  const isArray = arg.valueRank >= 1;
  const structure = arg.structure ?? [];

  const setSize = (n: number) => {
    const size = Math.max(isArray ? 0 : 1, Math.min(MAX_ARRAY_ELEMENTS, n));
    const elements = [...state.elements];
    while (elements.length < size) elements.push(newElement(structure));
    elements.length = size;
    onChange({ kind: 'struct', elements });
  };
  const setField = (elIdx: number, field: string, raw: Raw) => {
    const elements = state.elements.map((el, j) => (j === elIdx ? { ...el, [field]: raw } : el));
    onChange({ kind: 'struct', elements });
  };

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="px-4 py-2.5 bg-gray-50/60 dark:bg-gray-800/40 flex items-center gap-2 flex-wrap">
        <span className="text-[12px] font-medium text-gray-700 dark:text-gray-200">{arg.name}</span>
        <span className={typeBadge}>{arg.dataTypeName}{isArray ? '[]' : ''}</span>
        {arg.description && <span className="text-[11px] text-gray-400 truncate">{arg.description}</span>}
        {isArray && (
          <span className="ml-auto flex items-center gap-2">
            <span className="text-[11px] text-gray-400">{t('southbound.methods.modal.arraySize')}</span>
            <button onClick={() => setSize(state.elements.length - 1)} disabled={state.elements.length === 0} className={stepBtn}>
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="text-[12px] tabular-nums text-gray-700 dark:text-gray-200 w-4 text-center">{state.elements.length}</span>
            <button onClick={() => setSize(state.elements.length + 1)} disabled={state.elements.length >= MAX_ARRAY_ELEMENTS} className={stepBtn}>
              <Plus className="w-3.5 h-3.5" />
            </button>
          </span>
        )}
      </div>

      {state.elements.length === 0 ? (
        <p className="px-4 py-3 text-[12px] text-gray-400">{t('southbound.methods.modal.emptyArray')}</p>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {state.elements.map((el, elIdx) => (
            <div key={elIdx} className="px-4 py-3">
              {isArray && (
                <p className="text-[11px] font-mono text-gray-400 mb-2">[{elIdx}]</p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                {structure.map((f) => (
                  <SimpleField
                    key={f.name}
                    field={f}
                    value={el[f.name] ?? defaultRaw(f)}
                    error={errors[`${argIndex}:${f.name}`]}
                    onChange={(raw) => setField(elIdx, f.name, raw)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- one basic-typed input --------------------------------------------------

function SimpleField({
  field, value, error, onChange,
}: {
  field: FieldSpec;
  value: Raw;
  error?: string;
  onChange: (v: Raw) => void;
}) {
  const { t } = useTranslation();
  const kind = simpleKindOf(field);
  const typeLabel = `${field.dataTypeName}${field.valueRank >= 1 ? '[]' : ''}`;

  return (
    <label className="block min-w-0">
      <span className="flex items-center gap-2 min-w-0">
        <span className="text-[11px] font-medium text-gray-500 truncate">{field.name}</span>
        <span className={typeBadge}>{typeLabel}</span>
      </span>
      {field.description && <span className="block text-[11px] text-gray-400 mt-0.5 truncate" title={field.description}>{field.description}</span>}

      {kind === 'checkbox' ? (
        <span className="mt-2 flex items-center h-[22px]">
          <input
            type="checkbox"
            checked={value === true}
            onChange={(e) => onChange(e.target.checked)}
            className="accent-gray-900 dark:accent-white"
          />
        </span>
      ) : kind === 'enum' ? (
        <select value={String(value)} onChange={(e) => onChange(e.target.value)} className={inputCls}>
          {(field.enumValues ?? []).map((ev) => (
            <option key={ev.value} value={String(ev.value)}>{ev.name} ({ev.value})</option>
          ))}
        </select>
      ) : kind === 'number' ? (
        <input type="number" step="any" placeholder="0" value={String(value)} onChange={(e) => onChange(e.target.value)} className={inputCls} />
      ) : kind === 'datetime' ? (
        <input type="datetime-local" value={String(value)} onChange={(e) => onChange(e.target.value)} className={inputCls} />
      ) : kind === 'stringLines' ? (
        <textarea
          rows={2}
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t('southbound.methods.modal.linesPlaceholder')}
          className={inputCls}
        />
      ) : kind === 'json' ? (
        <textarea
          rows={3}
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          className={cn(inputCls, 'font-mono text-[12px]')}
        />
      ) : (
        <input type="text" value={String(value)} onChange={(e) => onChange(e.target.value)} className={inputCls} />
      )}

      {error && <span className="block text-[11px] text-red-500 mt-1">{error}</span>}
    </label>
  );
}

import { useState, useEffect, useMemo } from 'react';
import { Loader2, ArrowLeft, ChevronRight, Search, Save } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useCreateAlert, useUpdateAlert } from '../../hooks/useAlerts';
import { AlertRule, TopicNode } from '../../types';
import { topicsApi } from '../../services/api';
import apiClient from '../../services/api';
import { cn } from '@/lib/utils';

interface Props {
  alert: AlertRule | null;
  onClose: () => void;
}

// ── Mini Topic Tree ──────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getChildren(node: any): TopicNode[] {
  if (!node.children) return [];
  if (Array.isArray(node.children)) return node.children;
  if (node.children instanceof Map) return Array.from(node.children.values());
  if (typeof node.children === 'object') return Object.values(node.children);
  return [];
}

function MiniTreeItem({ node, level, onSelect, selected }: { node: TopicNode; level: number; onSelect: (path: string) => void; selected: string }) {
  const [expanded, setExpanded] = useState(level < 1);
  const children = getChildren(node);
  const hasChildren = children.length > 0;
  const isSelected = selected === node.fullPath;

  return (
    <div>
      <div
        onClick={() => {
          if (hasChildren) setExpanded(!expanded);
          if (node.hasValue) onSelect(node.fullPath);
        }}
        className={cn(
          'flex items-center gap-1 w-full text-left py-1 pr-2 rounded-md text-[11px] transition-colors cursor-pointer',
          isSelected ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800',
        )}
        style={{ paddingLeft: `${level * 12 + 6}px` }}
      >
        <ChevronRight className={cn(
          'w-2.5 h-2.5 shrink-0 transition-transform',
          expanded && 'rotate-90',
          !hasChildren && 'invisible'
        )} />
        <span className={cn('w-1 h-1 rounded-full shrink-0', node.hasValue ? isSelected ? 'bg-emerald-400' : 'bg-emerald-300' : 'bg-gray-200')} />
        <span className="truncate font-mono">{node.name}</span>
      </div>
      {expanded && hasChildren && children.map((child) => (
        <MiniTreeItem key={child.fullPath} node={child} level={level + 1} onSelect={onSelect} selected={selected} />
      ))}
    </div>
  );
}

// ── Cooldown options ────────────────────────────────────────────────

const COOLDOWN_OPTIONS = [
  { label: '30s', value: 30 },
  { label: '60s', value: 60 },
  { label: '5min', value: 300 },
  { label: '15min', value: 900 },
];

// ── Status helpers ──────────────────────────────────────────────────

function getStatusFromValue(
  value: number | undefined,
  goodMin?: number, goodMax?: number,
  warnMin?: number, warnMax?: number,
): string {
  if (value == null) return 'unknown';
  if (goodMin != null && goodMax != null && value >= goodMin && value <= goodMax) return 'good';
  if (warnMin != null && warnMax != null && value >= warnMin && value <= warnMax) return 'warn';
  return 'bad';
}

const statusColors: Record<string, { ring: string; bg: string; text: string }> = {
  good: { ring: 'ring-emerald-200', bg: 'bg-emerald-400', text: 'text-emerald-600' },
  warn: { ring: 'ring-amber-200', bg: 'bg-amber-400', text: 'text-amber-600' },
  bad: { ring: 'ring-red-200', bg: 'bg-red-400', text: 'text-red-600' },
  unknown: { ring: 'ring-gray-200', bg: 'bg-gray-300', text: 'text-gray-400' },
};

// ── Main Form ───────────────────────────────────────────────────────

export function AlertForm({ alert, onClose }: Props) {
  const createMutation = useCreateAlert();
  const updateMutation = useUpdateAlert();
  const isEditing = !!alert;

  // Core state
  const [name, setName] = useState(alert?.name ?? '');
  const [sourceTopic, setSourceTopic] = useState(alert?.sourceTopic ?? '');
  const [valueField, setValueField] = useState(alert?.valueField ?? 'value');
  const [treeSearch, setTreeSearch] = useState('');

  // Thresholds
  const [goodMin, setGoodMin] = useState<string>(alert?.goodMin != null ? String(alert.goodMin) : '');
  const [goodMax, setGoodMax] = useState<string>(alert?.goodMax != null ? String(alert.goodMax) : '');
  const [warnMin, setWarnMin] = useState<string>(alert?.warnMin != null ? String(alert.warnMin) : '');
  const [warnMax, setWarnMax] = useState<string>(alert?.warnMax != null ? String(alert.warnMax) : '');

  // Notification settings
  const [webhookUrl, setWebhookUrl] = useState(alert?.webhookUrl ?? '');
  const [notifyOnGood, setNotifyOnGood] = useState(alert?.notifyOnGood ?? false);
  const [notifyOnWarn, setNotifyOnWarn] = useState(alert?.notifyOnWarn ?? true);
  const [notifyOnBad, setNotifyOnBad] = useState(alert?.notifyOnBad ?? true);
  const [cooldownSeconds, setCooldownSeconds] = useState(alert?.cooldownSeconds ?? 60);
  const [notifyDiscord, setNotifyDiscord] = useState(alert?.notifyDiscord !== false);
  const [notifyWhatsapp, setNotifyWhatsapp] = useState(alert?.notifyWhatsapp ?? false);
  const [whatsappTo, setWhatsappTo] = useState(alert?.whatsappTo ?? '');

  // Source payload preview
  const [sourcePayload, setSourcePayload] = useState<Record<string, unknown> | null>(null);
  const [payloadFields, setPayloadFields] = useState<string[]>([]);

  // Data fetching
  const { data: topicTree = [] } = useQuery<TopicNode[]>({
    queryKey: ['topics-tree'], queryFn: topicsApi.getTree, staleTime: 15000,
  });

  // Fetch payload when source topic changes
  useEffect(() => {
    if (!sourceTopic.trim()) { setSourcePayload(null); setPayloadFields([]); return; }
    let cancelled = false;
    const fetch = async () => {
      try {
        const { data } = await apiClient.get(`/topics/${encodeURIComponent(sourceTopic)}/details`);
        if (!cancelled && data.data?.payload != null) {
          const p = typeof data.data.payload === 'object' ? data.data.payload : { value: data.data.payload };
          setSourcePayload(p);
          setPayloadFields(Object.keys(p));
        }
      } catch { if (!cancelled) { setSourcePayload(null); setPayloadFields([]); } }
    };
    const timer = setTimeout(fetch, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [sourceTopic]);

  // Filter topic tree
  const filteredTree = useMemo(() => {
    if (!treeSearch.trim()) return topicTree;
    const q = treeSearch.toLowerCase();
    const filterNode = (node: TopicNode): TopicNode | null => {
      if (node.fullPath.toLowerCase().includes(q) || node.name.toLowerCase().includes(q)) return node;
      const children = getChildren(node);
      const filteredChildren = children.map(filterNode).filter(Boolean) as TopicNode[];
      if (filteredChildren.length > 0) return { ...node, children: filteredChildren as unknown as TopicNode['children'] };
      return null;
    };
    return topicTree.map(filterNode).filter(Boolean) as TopicNode[];
  }, [topicTree, treeSearch]);

  // Compute preview status
  const currentValue = useMemo(() => {
    if (!sourcePayload || !valueField) return undefined;
    const v = sourcePayload[valueField];
    return typeof v === 'number' ? v : typeof v === 'string' ? parseFloat(v) : undefined;
  }, [sourcePayload, valueField]);

  const previewStatus = useMemo(() => {
    const gMin = goodMin !== '' ? parseFloat(goodMin) : undefined;
    const gMax = goodMax !== '' ? parseFloat(goodMax) : undefined;
    const wMin = warnMin !== '' ? parseFloat(warnMin) : undefined;
    const wMax = warnMax !== '' ? parseFloat(warnMax) : undefined;
    return getStatusFromValue(currentValue, gMin, gMax, wMin, wMax);
  }, [currentValue, goodMin, goodMax, warnMin, warnMax]);

  const wouldNotify = useMemo(() => {
    if (previewStatus === 'good' && notifyOnGood) return true;
    if (previewStatus === 'warn' && notifyOnWarn) return true;
    if (previewStatus === 'bad' && notifyOnBad) return true;
    return false;
  }, [previewStatus, notifyOnGood, notifyOnWarn, notifyOnBad]);

  const colors = statusColors[previewStatus] || statusColors.unknown;

  // Submit
  const handleSubmit = async () => {
    const body: Record<string, unknown> = {
      name: name.trim(),
      sourceTopic: sourceTopic.trim(),
      valueField: valueField.trim() || 'value',
      goodMin: goodMin !== '' ? parseFloat(goodMin) : null,
      goodMax: goodMax !== '' ? parseFloat(goodMax) : null,
      warnMin: warnMin !== '' ? parseFloat(warnMin) : null,
      warnMax: warnMax !== '' ? parseFloat(warnMax) : null,
      webhookUrl: webhookUrl.trim() || null,
      notifyOnGood,
      notifyOnWarn,
      notifyOnBad,
      cooldownSeconds,
      notifyDiscord,
      notifyWhatsapp,
      whatsappTo: whatsappTo.trim() || null,
    };

    try {
      if (isEditing) await updateMutation.mutateAsync({ id: alert.id, ...body });
      else await createMutation.mutateAsync(body);
      onClose();
    } catch { /* handled */ }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <p className="text-[11px] text-gray-400 mb-1">{isEditing ? 'Edit Alert' : 'New Alert Rule'}</p>
            <input
              type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="Enter alert name..."
              autoFocus
              className="text-[16px] font-semibold text-gray-900 dark:text-gray-100 bg-transparent outline-none placeholder:text-gray-300 border-b border-gray-200 dark:border-gray-700 focus:border-gray-400 dark:focus:border-gray-500 transition-colors w-64 pb-0.5"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onClose} className="px-3 py-1.5 text-[12px] font-medium text-gray-400 hover:text-gray-600 rounded-lg transition-colors">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={isPending || !name.trim() || !sourceTopic.trim()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[12px] font-medium rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-30"
          >
            {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            {isEditing ? 'Update' : 'Save'}
          </button>
        </div>
      </div>

      {/* Three-panel workspace */}
      <div className="flex gap-4 flex-1 min-h-0">

        {/* LEFT -- Mini Explorer */}
        <div className="w-56 lg:w-64 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 flex flex-col overflow-hidden shrink-0 hidden md:flex">
          <div className="px-3 py-3 border-b border-gray-100 dark:border-gray-800">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Source Topic</p>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-300" />
              <input type="text" value={treeSearch} onChange={e => setTreeSearch(e.target.value)} placeholder="Search topics..."
                className="w-full pl-7 pr-2 py-1.5 text-[11px] bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-lg outline-none placeholder:text-gray-300 focus:border-gray-200 dark:focus:border-gray-700 transition-all" />
            </div>
          </div>
          <div className="flex-1 overflow-auto py-1 px-1">
            {filteredTree.length === 0 ? (
              <p className="text-[11px] text-gray-300 text-center py-4">No topics</p>
            ) : (
              filteredTree.map(node => (
                <MiniTreeItem key={node.fullPath} node={node} level={0} onSelect={setSourceTopic} selected={sourceTopic} />
              ))
            )}
          </div>
          {sourceTopic && (
            <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-800">
              <p className="text-[10px] text-gray-400">Selected:</p>
              <p className="text-[11px] font-mono text-gray-700 dark:text-gray-300 truncate">{sourceTopic}</p>
            </div>
          )}
        </div>

        {/* CENTER -- Alert Configuration */}
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto min-w-0 pr-1">

          {/* Source topic (mobile) */}
          <div className="md:hidden bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 px-4 py-3">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Source Topic</p>
            <input type="text" value={sourceTopic} onChange={e => setSourceTopic(e.target.value)} placeholder="Select from tree or type..."
              className="input-clean font-mono text-[12px]" />
          </div>

          {/* Value Field */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 px-4 py-3">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Value Field</p>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="text-[11px] text-gray-400 mb-1 block">Field to monitor in payload</label>
                {payloadFields.length > 0 ? (
                  <select value={valueField} onChange={e => setValueField(e.target.value)} className="input-clean font-mono text-[12px]">
                    {payloadFields.map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                ) : (
                  <input type="text" value={valueField} onChange={e => setValueField(e.target.value)}
                    placeholder="value" className="input-clean font-mono text-[12px]" />
                )}
              </div>
            </div>
          </div>

          {/* Source Payload Preview */}
          {sourcePayload && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Source Payload</p>
              </div>
              <div className="px-4 py-2 flex flex-wrap gap-1.5">
                {payloadFields.map(field => {
                  const val = sourcePayload[field];
                  const isSelected = field === valueField;
                  return (
                    <button
                      key={field}
                      onClick={() => setValueField(field)}
                      className={cn(
                        'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-mono transition-colors',
                        isSelected
                          ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 cursor-default'
                          : 'bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer'
                      )}
                    >
                      <span className="font-semibold">{field}</span>
                      <span className="text-gray-400">: {typeof val === 'number' ? val : typeof val === 'string' ? `"${val.slice(0, 15)}"` : String(val)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Threshold Configuration */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 overflow-hidden shrink-0">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Threshold Configuration</p>
              <p className="text-[10px] text-gray-300 mt-0.5">Define value ranges for each status level</p>
            </div>
            <div className="px-4 py-3 space-y-4">
              {/* Good Range */}
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/30 px-4 py-3">
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span className="text-[12px] font-medium text-emerald-700">Good Range</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="text-[10px] text-emerald-600/70 mb-1 block">Min</label>
                    <input type="number" value={goodMin} onChange={e => setGoodMin(e.target.value)}
                      placeholder="--" className="input-clean font-mono text-[12px]" />
                  </div>
                  <span className="text-gray-300 text-[12px] mt-4">to</span>
                  <div className="flex-1">
                    <label className="text-[10px] text-emerald-600/70 mb-1 block">Max</label>
                    <input type="number" value={goodMax} onChange={e => setGoodMax(e.target.value)}
                      placeholder="--" className="input-clean font-mono text-[12px]" />
                  </div>
                </div>
              </div>

              {/* Warning Range */}
              <div className="rounded-xl border border-amber-100 bg-amber-50/30 px-4 py-3">
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span className="text-[12px] font-medium text-amber-700">Warning Range</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="text-[10px] text-amber-600/70 mb-1 block">Min</label>
                    <input type="number" value={warnMin} onChange={e => setWarnMin(e.target.value)}
                      placeholder="--" className="input-clean font-mono text-[12px]" />
                  </div>
                  <span className="text-gray-300 text-[12px] mt-4">to</span>
                  <div className="flex-1">
                    <label className="text-[10px] text-amber-600/70 mb-1 block">Max</label>
                    <input type="number" value={warnMax} onChange={e => setWarnMax(e.target.value)}
                      placeholder="--" className="input-clean font-mono text-[12px]" />
                  </div>
                </div>
              </div>

              {/* Bad Range (informational) */}
              <div className="rounded-xl border border-red-100 bg-red-50/30 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <span className="text-[12px] font-medium text-red-700">Bad</span>
                  <span className="text-[11px] text-red-400 ml-1">anything outside warning range</span>
                </div>
              </div>

              {/* Visual Range Indicator */}
              {warnMin !== '' && warnMax !== '' && goodMin !== '' && goodMax !== '' && (
                <div className="px-1 pt-2">
                  <div className="flex h-3 rounded-full overflow-hidden">
                    <div className="bg-red-300 flex-1" />
                    <div className="bg-amber-300 flex-1" />
                    <div className="bg-emerald-300 flex-[2]" />
                    <div className="bg-amber-300 flex-1" />
                    <div className="bg-red-300 flex-1" />
                  </div>
                  <div className="flex justify-between text-[9px] text-gray-400 mt-1 font-mono">
                    <span>{warnMin}</span>
                    <span>{goodMin}</span>
                    <span>{goodMax}</span>
                    <span>{warnMax}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 px-4 py-3 shrink-0">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Notification Settings</p>

            {/* Channels */}
            <div className="mb-4">
              <label className="text-[11px] text-gray-400 mb-2 block">Channels</label>
              <div className="flex flex-wrap gap-3 mb-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <div
                    onClick={() => setNotifyDiscord(!notifyDiscord)}
                    className={cn('w-9 h-5 rounded-full transition-colors relative cursor-pointer', notifyDiscord ? 'bg-[#5865F2]' : 'bg-gray-200')}
                  >
                    <div className={cn('absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform', notifyDiscord ? 'translate-x-4' : 'translate-x-0.5')} />
                  </div>
                  <span className="text-[11px] text-gray-600">Discord</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <div
                    onClick={() => setNotifyWhatsapp(!notifyWhatsapp)}
                    className={cn('w-9 h-5 rounded-full transition-colors relative cursor-pointer', notifyWhatsapp ? 'bg-[#25D366]' : 'bg-gray-200')}
                  >
                    <div className={cn('absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform', notifyWhatsapp ? 'translate-x-4' : 'translate-x-0.5')} />
                  </div>
                  <span className="text-[11px] text-gray-600">WhatsApp</span>
                </label>
              </div>

              {/* Discord webhook URL */}
              {notifyDiscord && (
                <div className="mb-3">
                  <label className="text-[10px] text-gray-400 mb-1 block">Discord Webhook URL</label>
                  <input type="text" value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)}
                    placeholder="Uses default from env"
                    className="input-clean text-[12px] font-mono" />
                </div>
              )}

              {/* WhatsApp number */}
              {notifyWhatsapp && (
                <div>
                  <label className="text-[10px] text-gray-400 mb-1 block">WhatsApp Number</label>
                  <input type="text" value={whatsappTo} onChange={e => setWhatsappTo(e.target.value)}
                    placeholder="Uses default from env (e.g. +5511970713832)"
                    className="input-clean text-[12px] font-mono" />
                </div>
              )}
            </div>

            {/* Notify on status */}
            <div className="flex flex-wrap gap-4 mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <div
                  onClick={() => setNotifyOnGood(!notifyOnGood)}
                  className={cn('w-9 h-5 rounded-full transition-colors relative cursor-pointer', notifyOnGood ? 'bg-emerald-500' : 'bg-gray-200')}
                >
                  <div className={cn('absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform', notifyOnGood ? 'translate-x-4' : 'translate-x-0.5')} />
                </div>
                <span className="text-[11px] text-gray-600">Good</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <div
                  onClick={() => setNotifyOnWarn(!notifyOnWarn)}
                  className={cn('w-9 h-5 rounded-full transition-colors relative cursor-pointer', notifyOnWarn ? 'bg-amber-500' : 'bg-gray-200')}
                >
                  <div className={cn('absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform', notifyOnWarn ? 'translate-x-4' : 'translate-x-0.5')} />
                </div>
                <span className="text-[11px] text-gray-600">Warn</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <div
                  onClick={() => setNotifyOnBad(!notifyOnBad)}
                  className={cn('w-9 h-5 rounded-full transition-colors relative cursor-pointer', notifyOnBad ? 'bg-red-500' : 'bg-gray-200')}
                >
                  <div className={cn('absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform', notifyOnBad ? 'translate-x-4' : 'translate-x-0.5')} />
                </div>
                <span className="text-[11px] text-gray-600">Bad</span>
              </label>
            </div>

            {/* Cooldown */}
            <div>
              <label className="text-[11px] text-gray-400 mb-1.5 block">Cooldown</label>
              <div className="flex gap-1">
                {COOLDOWN_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setCooldownSeconds(opt.value)}
                    className={cn(
                      'px-3 py-1.5 text-[11px] font-medium rounded-lg transition-colors',
                      cooldownSeconds === opt.value
                        ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                        : 'bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT -- Status Preview */}
        <div className="w-64 lg:w-72 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 flex flex-col overflow-hidden shrink-0 hidden lg:flex">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Live Preview</p>
            <p className="text-[11px] font-mono text-gray-500 truncate mt-1">{sourceTopic || '...'}</p>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 gap-4">
            {/* Big colored circle */}
            <div className={cn('w-24 h-24 rounded-full flex items-center justify-center ring-4', colors.ring, colors.bg)}>
              <span className="text-white text-[10px] font-semibold uppercase tracking-wider">
                {previewStatus}
              </span>
            </div>

            {/* Current value */}
            <div className="text-center">
              <p className="text-[32px] font-bold text-gray-900 dark:text-gray-100 tabular-nums font-mono leading-none">
                {currentValue != null ? currentValue : '--'}
              </p>
              <p className="text-[11px] text-gray-400 mt-1 font-mono">{valueField || 'value'}</p>
            </div>

            {/* Status label */}
            <div className={cn('px-3 py-1 rounded-lg text-[12px] font-medium', `${statusColors[previewStatus]?.bg.replace('bg-', 'bg-')}/10`, colors.text)}>
              {previewStatus === 'good' && 'Good'}
              {previewStatus === 'warn' && 'Warning'}
              {previewStatus === 'bad' && 'Bad'}
              {previewStatus === 'unknown' && 'Unknown'}
            </div>

            {/* Would notify */}
            <div className="mt-2 text-center">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Would notify</p>
              <p className={cn('text-[14px] font-semibold', wouldNotify ? 'text-gray-900 dark:text-gray-100' : 'text-gray-300')}>
                {previewStatus === 'unknown' ? '--' : wouldNotify ? 'Yes' : 'No'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

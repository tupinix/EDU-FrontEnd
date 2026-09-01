import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, Mic, Send, Save, Loader2, AlertTriangle, Check, KeyRound, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { WidgetRenderer } from '../components/ProcessDashboard/WidgetRenderer';
import {
  useDashboardLiveValues,
  widgetToBinding,
  widgetBindingKey,
  LiveBinding,
} from '../hooks/useDashboardLiveValues';
import { DashboardWidget } from '../types';
import {
  aiApi,
  dashboardsApi,
  AiProviderId,
  AiProviderInfo,
  GenerateDashboardResult,
} from '../services/api';

const KEYS_STORAGE = 'edu.ai.keys';
const PROVIDER_STORAGE = 'edu.ai.provider';

type UserKeys = Partial<Record<AiProviderId, string>>;

function loadKeys(): UserKeys {
  try { return JSON.parse(localStorage.getItem(KEYS_STORAGE) || '{}'); } catch { return {}; }
}
function saveKeys(keys: UserKeys) {
  try { localStorage.setItem(KEYS_STORAGE, JSON.stringify(keys)); } catch { /* ignore */ }
}

// ── Read-only, auto-scaling preview of a generated dashboard ──
function DashboardPreview({ dashboard }: { dashboard: GenerateDashboardResult['dashboard'] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.4);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setScale(Math.min(1, el.clientWidth / (dashboard.canvasWidth || 1920)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [dashboard.canvasWidth]);

  const bindings: LiveBinding[] = useMemo(
    () => dashboard.widgets.map(widgetToBinding).filter((b): b is LiveBinding => b !== null),
    [dashboard.widgets],
  );
  const liveValues = useDashboardLiveValues(bindings);

  const noop = useCallback(() => {}, []);

  return (
    <div ref={wrapRef} className="w-full overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
      <div
        style={{
          width: dashboard.canvasWidth,
          height: dashboard.canvasHeight,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          backgroundColor: dashboard.backgroundColor || '#0f1117',
          position: 'relative',
        }}
      >
        {dashboard.widgets.map((w: DashboardWidget) => (
          <WidgetRenderer
            key={w.id}
            widget={w}
            liveValue={liveValues.get(widgetBindingKey(w))}
            isEditMode={false}
            isSelected={false}
            onSelect={noop}
            onMove={noop}
            onResize={noop}
          />
        ))}
      </div>
      {/* Spacer so the scaled (absolutely transformed) canvas reserves height */}
      <div style={{ height: (dashboard.canvasHeight || 1080) * scale }} />
    </div>
  );
}

const SUGGESTIONS_FALLBACK = [
  'Dashboard de OEE da linha de produção',
  'Visão geral do broker MQTT com mensagens e tópicos',
  'Tela da estação de bombeamento com pressão e vazão',
  'Painel de nível dos tanques com alarmes',
];

export function Comando() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateDashboardResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  const [providers, setProviders] = useState<AiProviderInfo[]>([]);
  const [provider, setProvider] = useState<AiProviderId>(
    () => (localStorage.getItem(PROVIDER_STORAGE) as AiProviderId) || 'groq',
  );
  const [keys, setKeys] = useState<UserKeys>(loadKeys);
  const [showKeys, setShowKeys] = useState(false);

  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    aiApi.getProviders(keys).then((r) => setProviders(r.providers)).catch(() => setProviders([]));
  }, [keys]);

  useEffect(() => { localStorage.setItem(PROVIDER_STORAGE, provider); }, [provider]);

  const submit = useCallback(async (text?: string) => {
    const p = (text ?? prompt).trim();
    if (!p || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setSavedId(null);
    try {
      const res = await aiApi.generateDashboard({ prompt: p, provider, apiKey: keys[provider] });
      setResult(res);
    } catch (err: any) {
      const data = err?.response?.data;
      if (data?.error === 'rate_limited') {
        const secs = data.resetSeconds ? ` (~${Math.ceil(data.resetSeconds)}s)` : '';
        setError(t('comando.errors.rateLimited') + secs);
      } else if (data?.error === 'not_configured') {
        setError(data.message || t('comando.errors.notConfigured'));
      } else {
        setError(data?.message || data?.error || err?.message || t('comando.errors.generic'));
      }
    } finally {
      setLoading(false);
    }
  }, [prompt, loading, provider, keys, t]);

  const save = useCallback(async () => {
    if (!result || saving) return;
    setSaving(true);
    try {
      const created = await dashboardsApi.create({
        name: result.dashboard.name,
        description: t('comando.savedFrom', { prompt: prompt.slice(0, 120) }),
        canvasWidth: result.dashboard.canvasWidth,
        canvasHeight: result.dashboard.canvasHeight,
        backgroundColor: result.dashboard.backgroundColor,
        widgets: result.dashboard.widgets,
      });
      setSavedId(created?.id ?? 'saved');
    } catch (err: any) {
      setError(err?.message || t('comando.errors.saveFailed'));
    } finally {
      setSaving(false);
    }
  }, [result, saving, prompt, t]);

  const toggleVoice = useCallback(() => {
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setError(t('comando.errors.noVoice')); return; }
    if (listening) { recognitionRef.current?.stop(); return; }
    const rec = new SR();
    rec.lang = 'pt-BR';
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (e: any) => {
      const text = Array.from(e.results).map((r: any) => r[0].transcript).join('');
      setPrompt(text);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
    setListening(true);
    rec.start();
  }, [listening, t]);

  const usage = result?.usage;
  const nearLimit = usage?.nearLimit;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{t('comando.title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('comando.subtitle')}</p>
        </div>
      </div>

      {/* Ask box */}
      <div className="rounded-2xl border border-gray-200 bg-white p-2 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-end gap-2">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
            }}
            rows={2}
            placeholder={t('comando.placeholder')}
            className="flex-1 resize-none border-0 bg-transparent px-3 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-white"
          />
          <button
            onClick={toggleVoice}
            title={t('comando.voice')}
            className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${
              listening
                ? 'animate-pulse bg-red-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
            }`}
          >
            <Mic className="h-5 w-5" />
          </button>
          <Button
            onClick={() => submit()}
            disabled={loading || !prompt.trim()}
            className="h-10 gap-2 bg-emerald-600 hover:bg-emerald-700"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {t('comando.generate')}
          </Button>
        </div>

        {/* Provider row */}
        <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 px-2 pt-2 dark:border-gray-800">
          <span className="text-xs text-gray-400">{t('comando.model')}:</span>
          {providers.map((p) => (
            <button
              key={p.id}
              onClick={() => setProvider(p.id)}
              disabled={!p.ready}
              title={!p.ready ? t('comando.needsKey') : p.model}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs transition ${
                provider === p.id
                  ? 'bg-emerald-600 text-white'
                  : p.ready
                    ? 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                    : 'cursor-not-allowed bg-gray-50 text-gray-400 dark:bg-gray-800/50 dark:text-gray-600'
              }`}
            >
              {p.label}
              {!p.ready && p.needsUserKey && <KeyRound className="h-3 w-3" />}
            </button>
          ))}
          <button
            onClick={() => setShowKeys((s) => !s)}
            className="ml-auto flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <KeyRound className="h-3.5 w-3.5" />
            {t('comando.keys')}
            <ChevronDown className={`h-3 w-3 transition ${showKeys ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Keys panel */}
        {showKeys && (
          <div className="grid gap-2 border-t border-gray-100 p-3 dark:border-gray-800 sm:grid-cols-2">
            {(['anthropic', 'openai'] as AiProviderId[]).map((id) => (
              <label key={id} className="text-xs text-gray-500">
                <span className="mb-1 block capitalize">{id === 'openai' ? 'OpenAI (ChatGPT)' : 'Anthropic (Claude)'} API key</span>
                <input
                  type="password"
                  value={keys[id] || ''}
                  onChange={(e) => setKeys((k) => ({ ...k, [id]: e.target.value }))}
                  onBlur={() => saveKeys(keys)}
                  placeholder={id === 'openai' ? 'sk-...' : 'sk-ant-...'}
                  className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-900 outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </label>
            ))}
            <p className="col-span-full text-[11px] text-gray-400">{t('comando.keysHint')}</p>
          </div>
        )}
      </div>

      {/* Suggestions (empty state) */}
      {!result && !loading && (
        <div className="mt-4 flex flex-wrap gap-2">
          {SUGGESTIONS_FALLBACK.map((s) => (
            <button
              key={s}
              onClick={() => { setPrompt(s); submit(s); }}
              className="rounded-full border border-gray-200 px-3 py-1.5 text-xs text-gray-600 transition hover:border-emerald-400 hover:text-emerald-600 dark:border-gray-800 dark:text-gray-300"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="mt-6 flex h-64 items-center justify-center rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
          <div className="flex flex-col items-center gap-2 text-gray-400">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
            <span className="text-sm">{t('comando.building')}</span>
          </div>
        </div>
      )}

      {/* Result */}
      {result && !loading && (
        <div className="mt-6">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{result.dashboard.name}</h2>
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-600">
              {t('comando.grounded', { count: result.topicsGrounded })}
            </span>
            <div className="ml-auto flex items-center gap-2">
              {savedId ? (
                <>
                  <span className="flex items-center gap-1 text-sm text-emerald-600">
                    <Check className="h-4 w-4" /> {t('comando.saved')}
                  </span>
                  <Button variant="outline" onClick={() => navigate('/process')} className="h-9">
                    {t('comando.openInScreens')}
                  </Button>
                </>
              ) : (
                <Button onClick={save} disabled={saving} className="h-9 gap-2 bg-emerald-600 hover:bg-emerald-700">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {t('comando.save')}
                </Button>
              )}
            </div>
          </div>

          {result.notes && (
            <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">{result.notes}</p>
          )}

          {nearLimit && (
            <div className="mb-3 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {t('comando.nearLimit')}
              {usage?.resetSeconds ? ` (~${Math.ceil(usage.resetSeconds)}s)` : ''}
            </div>
          )}

          <DashboardPreview dashboard={result.dashboard} />
        </div>
      )}
    </div>
  );
}

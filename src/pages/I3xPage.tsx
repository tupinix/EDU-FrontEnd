import { useState, useEffect, useCallback } from 'react';
import { Copy, Check, ExternalLink, ShieldCheck, ShieldAlert, KeyRound, Loader2 } from 'lucide-react';
import { useAuthStore } from '../hooks/useStore';
import apiClient from '../services/api';

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) || 'https://api.espacodedadosunificado.com.br/api';
const HOST_BASE = API_BASE.replace(/\/api\/?$/, '');
const I3X_DOCS = `${HOST_BASE}/i3x/docs`;

export function I3xPage() {
  const user = useAuthStore((s) => s.user);
  const subdomain = user?.tenant?.subdomain ?? 'tupinix';
  const isAdmin = user?.role === 'admin';
  const i3xUrl = `${HOST_BASE}/${subdomain}/i3x/v1`;

  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    apiClient.get('/i3x/config').then((r) => setHasKey(!!r.data?.data?.hasKey)).catch(() => setHasKey(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const generate = async () => {
    setBusy(true);
    try {
      const r = await apiClient.post('/i3x/config/key');
      setNewKey(r.data?.data?.apiKey ?? null);
      setHasKey(true);
    } catch { /* ignore */ } finally { setBusy(false); }
  };
  const remove = async () => {
    setBusy(true);
    try { await apiClient.delete('/i3x/config/key'); setHasKey(false); setNewKey(null); }
    catch { /* ignore */ } finally { setBusy(false); }
  };

  return (
    <div className="space-y-5 sm:space-y-6 max-w-3xl">
      <div>
        <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">i3X</h1>
        <p className="text-[12px] sm:text-[13px] text-gray-400 mt-0.5">
          Superfície REST CESMII / i3X. Sua organização tem uma URL exclusiva; proteja-a com uma chave de API opcional.
          Configure no i3X Explorer, Ignition, HighByte, BI tools.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 p-5 space-y-4">
        <UrlBlock label={`URL do i3X (sua organização: ${subdomain})`} url={i3xUrl} external />
        <UrlBlock label="Documentação OpenAPI / Swagger" url={I3X_DOCS} external />
      </div>

      {/* Autenticação */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 p-5 space-y-4">
        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-[0.14em]">Autenticação</p>

        <div className="flex items-center gap-2 text-[13px]">
          {hasKey === null ? (
            <span className="flex items-center gap-2 text-gray-400"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Verificando…</span>
          ) : hasKey ? (
            <span className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400"><ShieldCheck className="w-4 h-4" /> Protegida por chave de API</span>
          ) : (
            <span className="flex items-center gap-2 text-amber-600 dark:text-amber-400"><ShieldAlert className="w-4 h-4" /> Aberta (isolamento só por URL)</span>
          )}
        </div>

        {newKey && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900/50 dark:bg-emerald-950/30">
            <p className="text-[12px] font-medium text-emerald-800 dark:text-emerald-300 mb-1.5">Copie a sua chave agora, ela não será mostrada de novo.</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 font-mono text-[11px] bg-white dark:bg-gray-800 border border-emerald-200 dark:border-gray-700 rounded px-2 py-1.5 text-gray-800 dark:text-gray-100 truncate">{newKey}</code>
              <button onClick={() => navigator.clipboard?.writeText(newKey).catch(() => {})} className="px-2.5 py-1.5 rounded-md bg-emerald-600 text-white text-[11px] font-medium hover:bg-emerald-700 flex items-center gap-1"><Copy className="w-3 h-3" /> Copiar</button>
            </div>
          </div>
        )}

        {isAdmin ? (
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={generate} disabled={busy} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[12px] font-medium hover:opacity-90 disabled:opacity-50">
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
              {hasKey ? 'Gerar nova chave' : 'Gerar chave de API'}
            </button>
            {hasKey && (
              <button onClick={remove} disabled={busy} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-[12px] font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50">
                Remover (deixar aberto)
              </button>
            )}
          </div>
        ) : (
          <p className="text-[12px] text-gray-400">Apenas administradores podem gerenciar a chave.</p>
        )}

        <p className="text-[11px] text-gray-400 leading-relaxed">
          Com a chave ativa, envie em cada requisição: <code className="text-gray-500">X-API-Key: &lt;chave&gt;</code>, <code className="text-gray-500">Authorization: Bearer &lt;chave&gt;</code> ou <code className="text-gray-500">?apiKey=&lt;chave&gt;</code>. Gerar uma nova chave invalida a anterior.
        </p>
      </div>
    </div>
  );
}

function UrlBlock({ label, url, external }: { label: string; url: string; external?: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  };
  return (
    <div>
      <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-[0.14em] mb-1.5">{label}</p>
      <div className="flex items-center gap-2">
        <code className="flex-1 font-mono text-[12px] bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-700 dark:text-gray-200 truncate">{url}</code>
        <button
          onClick={copy}
          className="px-3 py-2 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[11px] font-medium hover:opacity-90 transition flex items-center gap-1.5"
          title="Copiar"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copiado' : 'Copiar'}
        </button>
        {external && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-[11px] font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition flex items-center gap-1.5"
            title="Abrir"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}

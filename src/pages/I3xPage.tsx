import { useState } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { useAuthStore } from '../hooks/useStore';

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) || 'https://api.espacodedadosunificado.com.br/api';
const HOST_BASE = API_BASE.replace(/\/api\/?$/, '');
const I3X_DOCS = `${HOST_BASE}/i3x/docs`;

export function I3xPage() {
  const user = useAuthStore((s) => s.user);
  const subdomain = user?.tenant?.subdomain ?? 'tupinix';
  const i3xUrl = `${HOST_BASE}/${subdomain}/i3x/v1`;

  return (
    <div className="space-y-5 sm:space-y-6 max-w-3xl">
      <div>
        <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">i3X</h1>
        <p className="text-[12px] sm:text-[13px] text-gray-400 mt-0.5">
          Superfície REST CESMII / i3X. Isolamento por URL — sua org tem uma URL exclusiva, sem cabeçalho de auth.
          Configure no i3X Explorer, Ignition, HighByte, BI tools.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 p-5 space-y-4">
        <UrlBlock label={`URL do i3X (sua organização: ${subdomain})`} url={i3xUrl} external />
        <UrlBlock label="Documentação OpenAPI / Swagger" url={I3X_DOCS} external />
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

import { useState } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) || 'https://api.espacodedadosunificado.com.br/api';
const I3X_BASE = API_BASE.replace(/\/api\/?$/, '/i3x/v1');

export function I3xPage() {
  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">i3X</h1>
        <p className="text-[12px] sm:text-[13px] text-gray-400 mt-0.5">
          Endpoint público compatível com a superfície canônica CESMII / i3X. Permissivo a CORS para BI tools, HighByte, Ignition. Não exige autenticação JWT (read-only sobre a tenant pública).
        </p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 p-5 space-y-4">
        <UrlBlock label="Base URL" url={I3X_BASE} />
        <UrlBlock label="Listar tipos (Type elements)" url={`${I3X_BASE}/typeelements`} external />
        <UrlBlock label="Listar instâncias" url={`${I3X_BASE}/elements`} external />
        <UrlBlock label="Eventos / time-series por elemento" url={`${I3X_BASE}/elements/{id}/values`} />
      </div>

      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-200/60 dark:border-gray-800 p-5">
        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-[0.14em] mb-2">Exemplo</p>
        <pre className="text-[12px] font-mono text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{`# todos os tipos modelados
curl ${I3X_BASE}/typeelements

# instâncias de um tipo específico
curl "${I3X_BASE}/elements?typeElementId=CoolingTower"

# valores correntes de um elemento
curl ${I3X_BASE}/elements/<id>/values

# subscribe SSE para mudanças em tempo real
curl -N "${I3X_BASE}/elements/<id>/subscribe"`}</pre>
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
        {external && url.indexOf('{id}') === -1 && (
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

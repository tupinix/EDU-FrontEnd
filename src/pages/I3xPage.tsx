import { useState } from 'react';
import { Copy, Check, ExternalLink, Lock } from 'lucide-react';

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) || 'https://api.espacodedadosunificado.com.br/api';
const I3X_BASE = API_BASE.replace(/\/api\/?$/, '/i3x/v1');

export function I3xPage() {
  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">i3X</h1>
        <p className="text-[12px] sm:text-[13px] text-gray-400 mt-0.5">
          Superfície REST compatível com a especificação canônica CESMII / i3X. Cada usuário enxerga apenas os
          dados da sua organização — namespaces, objetos e eventos são escopados pelo tenant autenticado.
        </p>
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-2xl p-4 flex items-start gap-3">
        <Lock className="w-4 h-4 text-amber-600 dark:text-amber-300 mt-0.5 shrink-0" />
        <div className="text-[12px] text-amber-800 dark:text-amber-200 leading-relaxed">
          <p className="font-semibold mb-0.5">Exige autenticação</p>
          <p>
            Todas as rotas (exceto <code className="font-mono text-[11px]">/info</code> e
            <code className="font-mono text-[11px]"> /relationshiptypes</code>) requerem o cookie de sessão
            <code className="font-mono text-[11px]"> edu_token</code> emitido pelo login da plataforma. Para
            chamadas via <span className="font-mono">curl</span> use o cookie do navegador ou um
            <code className="font-mono text-[11px]"> Authorization: Bearer &lt;jwt&gt;</code>.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 p-5 space-y-4">
        <UrlBlock label="Base URL" url={I3X_BASE} />
        <UrlBlock label="Info do servidor (público)" url={`${I3X_BASE}/info`} external />
        <UrlBlock label="Namespace da sua organização" url={`${I3X_BASE}/namespaces`} external />
        <UrlBlock label="Catálogo de tipos (CESMII SM Profiles)" url={`${I3X_BASE}/objecttypes`} external />
        <UrlBlock label="Listar objetos (instâncias da sua org)" url={`${I3X_BASE}/objects`} external />
        <UrlBlock label="Browse por parent" url={`${I3X_BASE}/objects?parentId={path}`} />
        <UrlBlock label="Valores atuais (POST elementIds)" url={`${I3X_BASE}/objects/value`} />
        <UrlBlock label="Subscriptions / SSE stream" url={`${I3X_BASE}/subscriptions`} />
        <UrlBlock label="Swagger / OpenAPI" url={`${API_BASE.replace(/\/api\/?$/, '')}/api/docs`} external />
      </div>

      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-200/60 dark:border-gray-800 p-5">
        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-[0.14em] mb-2">Exemplo (curl com cookie de login)</p>
        <pre className="text-[12px] font-mono text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{`# 1) login — salva o cookie de sessão num arquivo
curl -c cookie.txt -X POST ${API_BASE}/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"voce@suaorg.com","password":"…"}'

# 2) namespace da sua organização (somente a sua aparece)
curl -b cookie.txt ${I3X_BASE}/namespaces

# 3) listar todos os tipos modelados (catálogo CESMII)
curl -b cookie.txt ${I3X_BASE}/objecttypes

# 4) instâncias da sua org (filtradas pelo tenant do cookie)
curl -b cookie.txt "${I3X_BASE}/objects?limit=50"

# 5) valores atuais de elementos
curl -b cookie.txt -X POST ${I3X_BASE}/objects/value \\
  -H "Content-Type: application/json" \\
  -d '{"elementIds":["BR-Plant1/Cooling/Temp"]}'

# 6) subscribe SSE para mudanças em tempo real
curl -b cookie.txt -X POST ${I3X_BASE}/subscriptions \\
  -H "Content-Type: application/json" -d '{"name":"my-sub"}'
# → recebe { subscriptionId }
curl -b cookie.txt -N "${I3X_BASE}/subscriptions/stream?subscriptionId=<id>"`}</pre>
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
        {external && url.indexOf('{') === -1 && (
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

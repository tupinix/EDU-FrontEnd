import { useState } from 'react';
import { Copy, Check, ExternalLink, Lock } from 'lucide-react';

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) || 'https://api.espacodedadosunificado.com.br/api';
const DOCS_URL = API_BASE.replace(/\/api\/?$/, '/api/docs');

interface EndpointGroup {
  title: string;
  items: { method: string; path: string; desc: string }[];
}

const GROUPS: EndpointGroup[] = [
  {
    title: 'Auth',
    items: [
      { method: 'POST', path: '/auth/login',  desc: 'Login (email + password) → cookie edu_token' },
      { method: 'POST', path: '/auth/logout', desc: 'Encerra a sessão atual' },
      { method: 'GET',  path: '/auth/me',     desc: 'Usuário logado + tenant' },
    ],
  },
  {
    title: 'Unified Namespace (MQTT)',
    items: [
      { method: 'GET', path: '/topics',                       desc: 'Árvore de tópicos do broker ativo' },
      { method: 'GET', path: '/topics/list',                  desc: 'Lista flat de paths' },
      { method: 'GET', path: '/topics/{topic}/details',       desc: 'Metadados + último valor' },
      { method: 'GET', path: '/topics/{topic}/history?limit', desc: 'Série histórica (TimescaleDB)' },
      { method: 'GET', path: '/topics/search?q=…',            desc: 'Busca por substring' },
    ],
  },
  {
    title: 'Plant Model (ISA-95 + Knowledge Graph)',
    items: [
      { method: 'GET',    path: '/hierarchy',              desc: 'Hierarquia ISA-95 completa' },
      { method: 'GET',    path: '/hierarchy/graph',        desc: 'Grafo bruto (nós + relacionamentos)' },
      { method: 'POST',   path: '/hierarchy/nodes',        desc: 'Cria nó (label + properties)' },
      { method: 'PATCH',  path: '/hierarchy/nodes/{id}',   desc: 'Atualiza propriedades' },
      { method: 'DELETE', path: '/hierarchy/nodes/{id}',   desc: 'Remove nó + relacionamentos' },
      { method: 'POST',   path: '/hierarchy/relationships', desc: 'Cria relacionamento entre 2 nós' },
      { method: 'POST',   path: '/hierarchy/cypher',       desc: 'Query Cypher (somente admin, read-only)' },
    ],
  },
  {
    title: 'Conexões industriais',
    items: [
      { method: 'GET / POST', path: '/brokers',              desc: 'Brokers MQTT (CRUD)' },
      { method: 'GET / POST', path: '/modbus/connections',   desc: 'Conexões Modbus TCP' },
      { method: 'GET / POST', path: '/opcua/connections',    desc: 'Servidores OPC-UA' },
      { method: 'GET / POST', path: '/ethip/connections',    desc: 'CLPs EtherNet/IP' },
      { method: 'POST',       path: '/discovery/scan',       desc: 'Network scan de protocolos industriais' },
    ],
  },
  {
    title: 'Dashboards & Alertas',
    items: [
      { method: 'GET / POST', path: '/dashboards',         desc: 'CRUD de dashboards' },
      { method: 'GET / POST', path: '/data-models',        desc: 'Modelos de dados (templates CESMII)' },
      { method: 'GET / POST', path: '/alerts',             desc: 'Regras de alerta + canais' },
    ],
  },
  {
    title: 'Sistema',
    items: [
      { method: 'GET', path: '/health',           desc: 'Health check' },
      { method: 'GET', path: '/metrics/summary',  desc: 'Métricas agregadas (mensagens, brokers)' },
      { method: 'GET', path: '/metrics/system',   desc: 'CPU, memória, uptime' },
    ],
  },
];

const METHOD_COLOR: Record<string, string> = {
  GET:    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/40',
  POST:   'bg-blue-50    text-blue-700    border-blue-200    dark:bg-blue-900/30    dark:text-blue-300    dark:border-blue-800/40',
  PATCH:  'bg-amber-50   text-amber-700   border-amber-200   dark:bg-amber-900/30   dark:text-amber-300   dark:border-amber-800/40',
  DELETE: 'bg-red-50     text-red-700     border-red-200     dark:bg-red-900/30     dark:text-red-300     dark:border-red-800/40',
};
const methodTone = (m: string) => METHOD_COLOR[m.split(' ')[0]] ?? METHOD_COLOR.GET;

export function ApiRestPage() {
  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">API REST</h1>
        <p className="text-[12px] sm:text-[13px] text-gray-400 mt-0.5">
          Superfície REST principal do EDU. Toda a UI da plataforma consome essas mesmas rotas — use-as
          para integrar BI, ETL, dashboards externos, scripts ou ferramentas como Ignition / HighByte.
        </p>
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-2xl p-4 flex items-start gap-3">
        <Lock className="w-4 h-4 text-amber-600 dark:text-amber-300 mt-0.5 shrink-0" />
        <div className="text-[12px] text-amber-800 dark:text-amber-200 leading-relaxed">
          <p className="font-semibold mb-0.5">Exige autenticação</p>
          <p>
            Todas as rotas (exceto <code className="font-mono text-[11px]">/health</code> e
            <code className="font-mono text-[11px]"> /auth/login</code>) requerem o cookie de sessão
            <code className="font-mono text-[11px]"> edu_token</code> emitido pelo login. Para chamadas via
            <span className="font-mono"> curl</span> use o cookie do navegador ou um
            <code className="font-mono text-[11px]"> Authorization: Bearer &lt;jwt&gt;</code>.
            Todos os dados retornados são escopados ao tenant da sua sessão.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 p-5 space-y-4">
        <UrlBlock label="Base URL" url={API_BASE} />
        <UrlBlock label="Swagger / OpenAPI (todos os endpoints)" url={DOCS_URL} external />
        <UrlBlock label="Health check (público)" url={`${API_BASE}/health`} external />
        <UrlBlock label="Login" url={`${API_BASE}/auth/login`} />
      </div>

      {GROUPS.map((g) => (
        <div key={g.title} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 p-5">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-[0.14em] mb-3">{g.title}</p>
          <div className="space-y-1.5">
            {g.items.map((it) => (
              <div key={`${it.method}-${it.path}`} className="flex items-start gap-3 py-1.5 border-b border-gray-50 dark:border-gray-800/50 last:border-b-0">
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold font-mono border ${methodTone(it.method)} shrink-0`}>
                  {it.method}
                </span>
                <code className="text-[12px] font-mono text-gray-700 dark:text-gray-200 shrink-0 pt-0.5">{it.path}</code>
                <span className="text-[12px] text-gray-400 dark:text-gray-500 ml-auto text-right pt-0.5">{it.desc}</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-200/60 dark:border-gray-800 p-5">
        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-[0.14em] mb-2">Exemplo (curl com cookie de login)</p>
        <pre className="text-[12px] font-mono text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{`# 1) login — salva o cookie de sessão num arquivo
curl -c cookie.txt -X POST ${API_BASE}/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"voce@suaorg.com","password":"…"}'

# 2) qualquer endpoint subsequente reusa o cookie
curl -b cookie.txt ${API_BASE}/topics
curl -b cookie.txt ${API_BASE}/hierarchy
curl -b cookie.txt ${API_BASE}/brokers
curl -b cookie.txt ${API_BASE}/metrics/summary

# 3) criar um nó no Knowledge Graph
curl -b cookie.txt -X POST ${API_BASE}/hierarchy/nodes \\
  -H "Content-Type: application/json" \\
  -d '{"label":"Equipment","properties":{"name":"Pump-01"}}'

# 4) alternativa: header Authorization Bearer (sem cookie)
TOKEN=$(curl -s -X POST ${API_BASE}/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"voce@suaorg.com","password":"…"}' | jq -r '.data.token')
curl -H "Authorization: Bearer $TOKEN" ${API_BASE}/topics`}</pre>
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

import { useState, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  Copy, Check, ArrowLeft, Menu, X, BookOpen, Rocket, LayoutDashboard, Search,
  Radio, Workflow, LayoutGrid, Sparkles, Server, Code2, Network, Download,
  Cpu, KeyRound, Globe, ShieldCheck,
} from 'lucide-react';

// ── Copyable code block ──
function Code({ children }: { children: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => navigator.clipboard?.writeText(children).then(() => {
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  }).catch(() => {});
  return (
    <div className="group relative my-3 overflow-hidden rounded-lg border border-gray-800 bg-[#0d1117]">
      <button onClick={copy} className="absolute right-2 top-2 flex items-center gap-1 rounded-md bg-white/5 px-2 py-1 text-[11px] text-gray-400 opacity-0 transition hover:bg-white/10 hover:text-gray-200 group-hover:opacity-100">
        {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}{copied ? 'Copiado' : 'Copiar'}
      </button>
      <pre className="overflow-x-auto px-4 py-3 text-[13px] leading-relaxed text-gray-100"><code>{children}</code></pre>
    </div>
  );
}

// A screenshot with caption. Falls back to a labeled placeholder until the
// image exists at /docs/img/<name>.png.
function Shot({ src, alt }: { src: string; alt: string }) {
  const [ok, setOk] = useState(true);
  return (
    <figure className="my-4">
      {ok ? (
        <img src={src} alt={alt} onError={() => setOk(false)}
          className="w-full rounded-xl border border-gray-200 shadow-sm dark:border-gray-800" />
      ) : (
        <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-gray-300 text-xs text-gray-400 dark:border-gray-700">
          Captura de tela em breve
        </div>
      )}
      <figcaption className="mt-2 text-center text-xs text-gray-400">{alt}</figcaption>
    </figure>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-gray-100 py-9 first:border-t-0 first:pt-0 dark:border-gray-800">
      <h2 className="mb-4 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{title}</h2>
      <div className="space-y-3 text-[15px] leading-relaxed text-gray-600 dark:text-gray-300">{children}</div>
    </section>
  );
}

function H3({ children }: { children: ReactNode }) {
  return <h3 className="mt-6 mb-1 text-base font-semibold text-gray-900 dark:text-white">{children}</h3>;
}

const K = ({ children }: { children: ReactNode }) => (
  <code className="rounded bg-gray-100 px-1.5 py-0.5 text-[13px] text-gray-800 dark:bg-gray-800 dark:text-gray-200">{children}</code>
);

// Sidebar structure (Asaas-style categories).
const NAV = [
  { group: 'Introdução', items: [
    { id: 'overview', label: 'O que é o EDU', icon: BookOpen },
    { id: 'first-steps', label: 'Primeiros passos', icon: Rocket },
  ] },
  { group: 'As abas do EDU', items: [
    { id: 'tab-dashboard', label: 'Painel', icon: LayoutDashboard },
    { id: 'tab-explorer', label: 'Explorer (UNS)', icon: Search },
    { id: 'tab-brokers', label: 'Brokers MQTT', icon: Radio },
    { id: 'tab-models', label: 'Modelos de dados', icon: Workflow },
    { id: 'tab-screens', label: 'Telas', icon: LayoutGrid },
    { id: 'tab-aibot', label: 'AI Bot', icon: Sparkles },
    { id: 'tab-i3x', label: 'i3X', icon: Network },
  ] },
  { group: 'Integração', items: [
    { id: 'integr-http', label: 'Via HTTP (REST)', icon: Code2 },
    { id: 'integr-i3x', label: 'Via i3X (CESMII)', icon: Network },
  ] },
  { group: 'EDU Edge', items: [
    { id: 'install-edge', label: 'Instalar o EDU Edge', icon: Server },
  ] },
];

const API = 'https://api.espacodedadosunificado.com.br/api';
const I3X = 'https://api.espacodedadosunificado.com.br/tupinix/i3x/v1';

export function Docs() {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/85 backdrop-blur dark:border-gray-800 dark:bg-gray-950/85">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <button onClick={() => setOpen((o) => !o)} className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 lg:hidden dark:hover:bg-gray-800" aria-label="Menu">
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Link to="/" className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 text-white"><BookOpen className="h-4 w-4" /></span>
              <span className="text-sm font-semibold">EDU · Documentação</span>
            </Link>
          </div>
          <Link to="/" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Voltar ao site
          </Link>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl">
        {/* Sidebar */}
        <aside className={`${open ? 'block' : 'hidden'} fixed inset-x-0 top-[57px] z-20 max-h-[calc(100vh-57px)] overflow-y-auto border-b border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-gray-950 lg:sticky lg:top-[57px] lg:block lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r`}>
          <nav className="space-y-5">
            {NAV.map((g) => (
              <div key={g.group}>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">{g.group}</p>
                <ul className="space-y-0.5">
                  {g.items.map((it) => {
                    const I = it.icon;
                    return (
                      <li key={it.id}>
                        <a href={`#${it.id}`} onClick={() => setOpen(false)}
                          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white">
                          <I className="h-4 w-4 shrink-0 text-gray-400" /> {it.label}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="min-w-0 flex-1 px-5 py-8 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-3xl">
            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Documentação</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">Guia do EDU</h1>
            <p className="mt-3 text-lg text-gray-600 dark:text-gray-300">Como usar cada parte da plataforma, integrar seus sistemas via HTTP ou i3X, e rodar o EDU na sua máquina.</p>

            <Section id="overview" title="O que é o EDU">
              <p>O <strong>Espaço de Dados Unificado (EDU)</strong> é uma plataforma de <strong>Unified Namespace (UNS)</strong> para a Indústria 4.0: a fonte única da verdade dos seus dados industriais em tempo real, integrando OT e IT via MQTT, Sparkplug B, OPC-UA, Modbus e EtherNet/IP.</p>
              <p>Existe em duas edições: <strong>EDU Cloud</strong> (SaaS, multi-tenant) e <strong>EDU Edge</strong> (local, roda na sua máquina via Docker, offline, com IA local).</p>
            </Section>

            <Section id="first-steps" title="Primeiros passos">
              <p>Depois de entrar, o caminho típico é:</p>
              <ol className="ml-5 list-decimal space-y-1">
                <li>Conectar uma fonte de dados (um broker MQTT em <strong>Brokers</strong>, ou OPC-UA / Modbus / EtherNet/IP).</li>
                <li>Ver os dados chegarem e a hierarquia (UNS) se montar no <strong>Explorer</strong>.</li>
                <li>Montar dashboards em <strong>Telas</strong> ou pedir ao <strong>AI Bot</strong> para gerar.</li>
                <li>Configurar alertas, modelos de dados e integrações.</li>
              </ol>
            </Section>

            {/* ── As abas ── */}
            <Section id="tab-dashboard" title="Painel">
              <p>Visão geral do sistema: status das conexões, mensagens por minuto, tópicos ativos e as últimas leituras. É a primeira tela após o login.</p>
              <Shot src="/docs/img/dashboard.jpg" alt="Painel do EDU" />
            </Section>

            <Section id="tab-explorer" title="Explorer (UNS)">
              <p>Navega a árvore de tópicos e a hierarquia ISA-95 (Empresa → Site → Área → Linha → Equipamento) montada a partir dos seus dados. Clique em um tópico para ver o valor atual, o payload e o histórico.</p>
              <Shot src="/docs/img/explorer.jpg" alt="Explorer / UNS" />
            </Section>

            <Section id="tab-brokers" title="Brokers MQTT">
              <p>Em <strong>Configuração / Brokers</strong> você adiciona e conecta brokers MQTT (e vê o broker interno da UNS). Informe host, porta, TLS e credenciais; o EDU passa a ingerir os tópicos.</p>
              <Shot src="/docs/img/brokers.jpg" alt="Configuração de brokers" />
            </Section>

            <Section id="tab-models" title="Modelos de dados">
              <p>Modele os seus dados: agrupe tags em equipamentos e ativos, crie sensores virtuais (tags derivadas) e organize a UNS conforme a sua planta.</p>
            </Section>

            <Section id="tab-screens" title="Telas">
              <p>Monte dashboards de processo arrastando widgets (gauge, tendência, tanque, KPI, tabela, alarme e outros) e ligando cada um a uma tag. As telas são compartilhadas com toda a organização.</p>
              <Shot src="/docs/img/screens.jpg" alt="Editor de telas" />
            </Section>

            <Section id="tab-aibot" title="AI Bot">
              <p>O assistente de IA tem três modos: <strong>Screens Creator</strong> (gera um dashboard a partir de uma descrição), <strong>Organization Data</strong> (analisa suas conexões e sugere como organizar os dados) e <strong>Insight</strong> (detecta anomalias e tendências nas suas tags). No EDU Edge, roda com um modelo local, sem enviar nada para fora.</p>
              <Shot src="/docs/img/aibot.jpg" alt="AI Bot" />
            </Section>

            <Section id="tab-i3x" title="i3X">
              <p>A aba i3X expõe a sua UNS no padrão de interoperabilidade <strong>CESMII i3X</strong>, para que outros sistemas consultem objetos, valores e histórico de forma padronizada. Veja a seção de integração abaixo.</p>
              <Shot src="/docs/img/i3x.jpg" alt="i3X" />
            </Section>

            {/* ── Integração HTTP ── */}
            <Section id="integr-http" title="Integração via HTTP (REST)">
              <p>Toda a plataforma é acessível por uma API REST. A referência completa (Swagger) está em <a href={`${API}/docs`} className="text-emerald-600 hover:underline dark:text-emerald-400">{`${API}/docs`}</a>.</p>

              <H3>1. Autenticar</H3>
              <p>Faça login e use o token <K>Bearer</K> retornado nas próximas chamadas.</p>
              <Code>{`curl -X POST ${API}/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"voce@empresa.com","password":"sua-senha"}'
# resposta: { "success": true, "data": { "token": "eyJ...", "user": { ... } } }`}</Code>

              <H3>2. Listar os tópicos da UNS</H3>
              <Code>{`TOKEN="eyJ..."
curl ${API}/topics/list -H "Authorization: Bearer $TOKEN"`}</Code>

              <H3>3. Valores e histórico de um tópico</H3>
              <Code>{`# detalhes/valor atual
curl "${API}/topics/details?topic=Tupinix/BRPlant15/Process/OEE" \\
  -H "Authorization: Bearer $TOKEN"

# histórico
curl "${API}/topics/history?topic=Tupinix/BRPlant15/Process/OEE&hours=24" \\
  -H "Authorization: Bearer $TOKEN"`}</Code>
              <p className="text-sm text-gray-500">Os mesmos endpoints existem para brokers, OPC-UA, Modbus, dashboards, alertas e IA. Consulte o Swagger para o contrato completo.</p>
            </Section>

            {/* ── Integração i3X ── */}
            <Section id="integr-i3x" title="Integração via i3X (CESMII)">
              <p>O EDU implementa o padrão <strong>CESMII i3X</strong>, cada organização tem uma URL dedicada: <K>{'/<tenant>/i3x/v1'}</K>. Para a Tupinix, a base é <a href={I3X} className="text-emerald-600 hover:underline dark:text-emerald-400">{I3X}</a>. Referência (Swagger): <a href="https://api.espacodedadosunificado.com.br/i3x/docs" className="text-emerald-600 hover:underline dark:text-emerald-400">/i3x/docs</a>.</p>

              <H3>Listar objetos</H3>
              <Code>{`curl ${I3X}/objects`}</Code>

              <H3>Valor atual de um objeto</H3>
              <Code>{`# por caminho
curl ${I3X}/objects/<id-ou-caminho>/value

# em lote
curl -X POST ${I3X}/objects/value \\
  -H "Content-Type: application/json" \\
  -d '{"ids":["<id1>","<id2>"]}'`}</Code>

              <H3>Histórico e relacionamentos</H3>
              <Code>{`curl ${I3X}/objects/<id>/history
curl ${I3X}/objects/<id>/related`}</Code>
              <p className="text-sm text-gray-500">Também há <K>/namespaces</K>, <K>/objecttypes</K> e <K>/relationshiptypes</K>, seguindo o contrato CESMII i3X 1.0.</p>
            </Section>

            {/* ── Instalar Edge ── */}
            <Section id="install-edge" title="Instalar o EDU Edge">
              <p>O EDU Edge roda inteiro na sua máquina via Docker, offline, com a IA local. Baixe o pacote e siga os passos.</p>
              <a href="/downloads/edu-edge.zip" download className="my-2 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">
                <Download className="h-4 w-4" /> Baixar o pacote (.zip)
              </a>
              <div className="mt-2 grid gap-3 sm:grid-cols-3">
                {[
                  { icon: Cpu, t: 'Docker Desktop', s: 'ou Podman / Rancher' },
                  { icon: KeyRound, t: 'Licença', s: 'você recebe ao contratar' },
                  { icon: ShieldCheck, t: 'Local e offline', s: 'nada sai da máquina' },
                ].map((r) => { const I = r.icon; return (
                  <div key={r.t} className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
                    <I className="h-4 w-4 text-emerald-500" /><p className="mt-1 text-sm font-medium">{r.t}</p><p className="text-xs text-gray-500">{r.s}</p>
                  </div>
                ); })}
              </div>
              <H3>Subir</H3>
              <Code>{`cd edu-edge
./start.sh          # ou:  docker compose up -d`}</Code>
              <p className="flex items-start gap-2"><Globe className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" /> Abra <strong>http://localhost:8080</strong>, ative a sua licença e faça login.</p>
              <H3>IA local (opcional)</H3>
              <Code>docker compose exec ollama ollama pull llama3.1:8b</Code>
              <H3>Atualizar</H3>
              <Code>{`docker compose pull && docker compose up -d`}</Code>
            </Section>

            <div className="mt-10 rounded-2xl border border-gray-200 bg-gray-50 p-6 text-center dark:border-gray-800 dark:bg-gray-900/50">
              <p className="text-sm text-gray-600 dark:text-gray-300">Precisa de ajuda ou de uma licença?</p>
              <Link to="/#demo" className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">Falar com a gente</Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

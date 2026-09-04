import { useState, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  Download, Copy, Check, Cpu, HardDrive, ShieldCheck, Terminal, KeyRound,
  Globe, RefreshCw, HelpCircle, ArrowLeft, Server,
} from 'lucide-react';

// ── Copyable command block ──
function Code({ children }: { children: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(children).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }).catch(() => {});
  };
  return (
    <div className="group relative my-3 overflow-hidden rounded-lg border border-gray-800 bg-[#0d1117]">
      <button
        onClick={copy}
        className="absolute right-2 top-2 flex items-center gap-1 rounded-md bg-white/5 px-2 py-1 text-[11px] text-gray-400 opacity-0 transition hover:bg-white/10 hover:text-gray-200 group-hover:opacity-100"
      >
        {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
        {copied ? 'Copiado' : 'Copiar'}
      </button>
      <pre className="overflow-x-auto px-4 py-3 text-[13px] leading-relaxed text-gray-100"><code>{children}</code></pre>
    </div>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-gray-100 py-8 first:border-t-0 first:pt-0 dark:border-gray-800">
      <h2 className="mb-3 text-xl font-semibold tracking-tight text-gray-900 dark:text-white">{title}</h2>
      <div className="space-y-3 text-[15px] leading-relaxed text-gray-600 dark:text-gray-300">{children}</div>
    </section>
  );
}

const TOC = [
  { id: 'overview', label: 'Visão geral' },
  { id: 'requirements', label: 'Requisitos' },
  { id: 'download', label: 'Baixar o pacote' },
  { id: 'docker', label: 'Instalar o Docker' },
  { id: 'run', label: 'Subir o EDU Edge' },
  { id: 'license', label: 'Ativar a licença' },
  { id: 'ai', label: 'IA local' },
  { id: 'manage', label: 'Atualizar e parar' },
  { id: 'faq', label: 'Problemas comuns' },
];

export function InstallEdge() {
  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/80 backdrop-blur dark:border-gray-800 dark:bg-gray-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 text-white">
              <Server className="h-4 w-4" />
            </span>
            <span className="text-sm font-semibold">Espaço de Dados Unificado</span>
          </Link>
          <Link to="/" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Voltar ao site
          </Link>
        </div>
      </header>

      {/* Hero */}
      <div className="border-b border-gray-100 bg-gradient-to-b from-emerald-50/60 to-white dark:border-gray-800 dark:from-emerald-950/20 dark:to-gray-950">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
            <Server className="h-3.5 w-3.5" /> EDU Edge
          </span>
          <h1 className="mt-4 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
            Rode o EDU na sua máquina, local e offline
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-gray-600 dark:text-gray-300">
            O EDU Edge roda inteiro no seu computador via Docker: seus dados, a UNS, os dashboards e a IA, sem depender da nuvem. Siga o guia abaixo para instalar.
          </p>
          <a
            href="/downloads/edu-edge.zip"
            download
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            <Download className="h-4 w-4" /> Baixar o pacote (.zip)
          </a>
        </div>
      </div>

      {/* Body: TOC + content */}
      <div className="mx-auto max-w-6xl gap-10 px-4 py-10 lg:flex">
        {/* TOC */}
        <aside className="mb-8 lg:mb-0 lg:w-56 lg:shrink-0">
          <nav className="lg:sticky lg:top-20">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Nesta página</p>
            <ul className="space-y-1.5">
              {TOC.map((t) => (
                <li key={t.id}>
                  <a href={`#${t.id}`} className="block rounded-md px-2 py-1 text-sm text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-white">
                    {t.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Content */}
        <main className="min-w-0 flex-1">
          <Section id="overview" title="Visão geral">
            <p>
              O EDU Edge é a edição local do EDU: uma stack completa (bancos, backend com o broker UNS embutido, frontend e um modelo de IA local) que roda na sua máquina via Docker. Nada sai para a internet, ideal para plantas industriais e ambientes offline.
            </p>
            <p>Você baixa um pacote pequeno de configuração; as imagens são baixadas automaticamente pelo Docker.</p>
          </Section>

          <Section id="requirements" title="Requisitos">
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { icon: Cpu, t: 'Docker Desktop', s: 'ou Podman / Rancher Desktop' },
                { icon: HardDrive, t: '~8 GB de RAM', s: '~10 GB de disco livre' },
                { icon: ShieldCheck, t: 'Licença EDU Edge', s: 'você recebe ao contratar' },
              ].map((r) => {
                const I = r.icon;
                return (
                  <div key={r.t} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                    <I className="h-5 w-5 text-emerald-500" />
                    <p className="mt-2 text-sm font-medium text-gray-900 dark:text-white">{r.t}</p>
                    <p className="text-xs text-gray-500">{r.s}</p>
                  </div>
                );
              })}
            </div>
          </Section>

          <Section id="download" title="1. Baixar o pacote">
            <p>Baixe e descompacte o pacote do EDU Edge. Ele contém o <code className="rounded bg-gray-100 px-1 text-sm dark:bg-gray-800">docker-compose.yml</code>, um <code className="rounded bg-gray-100 px-1 text-sm dark:bg-gray-800">.env.example</code>, o script de inicialização e este guia.</p>
            <a href="/downloads/edu-edge.zip" download className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
              <Download className="h-4 w-4" /> edu-edge.zip
            </a>
          </Section>

          <Section id="docker" title="2. Instalar o Docker">
            <p className="flex items-start gap-2"><Cpu className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" /> Instale o <strong>Docker Desktop</strong> (Windows/Mac) ou o Docker Engine (Linux). Para empresas que precisam de alternativa gratuita ao Docker Desktop, use <strong>Podman</strong> ou <strong>Rancher Desktop</strong>.</p>
          </Section>

          <Section id="run" title="3. Subir o EDU Edge">
            <p className="flex items-start gap-2"><Terminal className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" /> Dentro da pasta descompactada, rode:</p>
            <Code>{`cd edu-edge
./start.sh          # ou:  docker compose up -d`}</Code>
            <p>Na primeira vez, o Docker baixa as imagens (pode levar alguns minutos).</p>
            <p className="flex items-start gap-2"><Globe className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" /> Depois é só abrir <strong>http://localhost:8080</strong> no navegador.</p>
          </Section>

          <Section id="license" title="4. Ativar a licença">
            <p className="flex items-start gap-2"><KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" /> Na primeira vez, cole a <strong>chave de licença</strong> que você recebeu. Sem ela os recursos ficam bloqueados. Depois, faça login com o usuário administrador.</p>
          </Section>

          <Section id="ai" title="5. IA local (opcional)">
            <p>O AI Bot e o modo Insight rodam com um modelo <strong>local</strong> (Ollama), sem enviar nada para fora. Baixe o modelo uma vez:</p>
            <Code>docker compose exec ollama ollama pull llama3.1:8b</Code>
            <p className="text-sm text-gray-500">Para aceleração por GPU NVIDIA, veja o README dentro do pacote.</p>
          </Section>

          <Section id="manage" title="Atualizar e parar">
            <p className="flex items-start gap-2"><RefreshCw className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" /> Atualizar para a versão mais nova (mantém seus dados):</p>
            <Code>{`docker compose pull
docker compose up -d`}</Code>
            <p>Parar (mantém os dados): <code className="rounded bg-gray-100 px-1 text-sm dark:bg-gray-800">docker compose stop</code>. Remover os containers (mantém os volumes): <code className="rounded bg-gray-100 px-1 text-sm dark:bg-gray-800">docker compose down</code>.</p>
          </Section>

          <Section id="faq" title="Problemas comuns">
            <div className="space-y-4">
              {[
                { q: 'A porta 8080 já está em uso', a: 'Altere EDU_HTTP_PORT no arquivo .env para outra porta (ex: 8090) e rode docker compose up -d de novo.' },
                { q: 'O Docker Desktop pede licença na minha empresa', a: 'O Docker Desktop é pago para empresas grandes. Use Podman ou Rancher Desktop, que são gratuitos e rodam o mesmo docker-compose.' },
                { q: 'A IA está lenta', a: 'O modelo roda em CPU por padrão. Em máquinas sem GPU, o Llama responde mais devagar; considere habilitar a GPU (veja o README) ou usar um provedor externo.' },
              ].map((f) => (
                <div key={f.q} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                  <p className="flex items-start gap-2 text-sm font-medium text-gray-900 dark:text-white"><HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> {f.q}</p>
                  <p className="mt-1 pl-6 text-sm text-gray-600 dark:text-gray-300">{f.a}</p>
                </div>
              ))}
            </div>
          </Section>

          <div className="mt-10 rounded-2xl border border-gray-200 bg-gray-50 p-6 text-center dark:border-gray-800 dark:bg-gray-900/50">
            <p className="text-sm text-gray-600 dark:text-gray-300">Ainda não tem uma licença do EDU Edge?</p>
            <Link to="/#demo" className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
              Falar com a gente
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}

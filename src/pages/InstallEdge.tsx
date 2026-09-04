import { ReactNode } from 'react';
import {
  Server, Download, Terminal, KeyRound, Globe, Cpu, HardDrive, ShieldCheck,
  ArrowRight, Info,
} from 'lucide-react';

function Cmd({ children }: { children: ReactNode }) {
  return (
    <pre className="mt-2 overflow-x-auto rounded-lg bg-gray-900 px-3 py-2 text-xs text-gray-100 dark:bg-black/60">
      <code>{children}</code>
    </pre>
  );
}

interface Step {
  icon: typeof Server;
  title: string;
  body: ReactNode;
}

const STEPS: Step[] = [
  {
    icon: Download,
    title: '1. Baixe o pacote',
    body: (
      <>Baixe e descompacte o pacote do EDU Edge (é pequeno, só os arquivos de configuração; as imagens vêm depois pelo Docker).</>
    ),
  },
  {
    icon: Cpu,
    title: '2. Instale o Docker',
    body: (
      <>Instale o <strong>Docker Desktop</strong> (Windows/Mac) ou o Docker Engine (Linux). Alternativas grátis para empresas: <strong>Podman</strong> ou <strong>Rancher Desktop</strong>.</>
    ),
  },
  {
    icon: Terminal,
    title: '3. Suba o EDU Edge',
    body: (
      <>
        Dentro da pasta descompactada, rode:
        <Cmd>{`cd edu-edge
./start.sh        # ou:  docker compose up -d`}</Cmd>
        Na primeira vez o Docker baixa as imagens (alguns minutos).
      </>
    ),
  },
  {
    icon: Globe,
    title: '4. Abra o EDU',
    body: (
      <>Acesse <strong>http://localhost:8080</strong> no navegador.</>
    ),
  },
  {
    icon: KeyRound,
    title: '5. Ative sua licença',
    body: (
      <>Cole a chave de licença que você recebeu. Sem ela, os recursos ficam bloqueados. Depois é só fazer login.</>
    ),
  },
  {
    icon: Cpu,
    title: '6. Ative a IA local (opcional)',
    body: (
      <>
        Para usar o AI Bot / Insight com o modelo local (offline), baixe o modelo uma vez:
        <Cmd>docker compose exec ollama ollama pull llama3.1:8b</Cmd>
      </>
    ),
  },
];

export function InstallEdge() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
          <Server className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Instalar o EDU Edge</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Rode o EDU na sua máquina, local e offline, com a IA rodando por lá.
          </p>
        </div>
      </div>

      {/* Download CTA */}
      <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900/50 dark:bg-emerald-950/30 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">Pacote do EDU Edge</h2>
          <p className="text-xs text-emerald-700 dark:text-emerald-300/80">
            docker-compose + configuração. As imagens são baixadas pelo Docker.
          </p>
        </div>
        <a
          href="/downloads/edu-edge.zip"
          download
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
        >
          <Download className="h-4 w-4" /> Baixar (.zip)
        </a>
      </div>

      {/* Requirements */}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-3 text-xs text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
          <Cpu className="h-4 w-4 text-gray-400" /> Docker Desktop / Podman
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-3 text-xs text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
          <HardDrive className="h-4 w-4 text-gray-400" /> ~8 GB RAM, ~10 GB disco
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-3 text-xs text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
          <ShieldCheck className="h-4 w-4 text-gray-400" /> Licença EDU Edge
        </div>
      </div>

      {/* Steps */}
      <ol className="space-y-3">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          return (
            <li key={i} className="flex gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{step.title}</h3>
                <div className="mt-0.5 text-sm text-gray-600 dark:text-gray-300">{step.body}</div>
              </div>
            </li>
          );
        })}
      </ol>

      {/* Update / tips */}
      <div className="mt-6 flex items-start gap-2 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900/50 dark:text-gray-300">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
        <div>
          <p><strong>Atualizar depois:</strong> <code className="rounded bg-white px-1 dark:bg-gray-800">docker compose pull &amp;&amp; docker compose up -d</code> (mantém seus dados).</p>
          <p className="mt-1"><strong>Parar:</strong> <code className="rounded bg-white px-1 dark:bg-gray-800">docker compose stop</code>. O guia completo está no README dentro do pacote.</p>
        </div>
      </div>

      <a
        href="https://espacodedadosunificado.com.br"
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
      >
        Não tem licença? Fale com a gente <ArrowRight className="h-4 w-4" />
      </a>
    </div>
  );
}

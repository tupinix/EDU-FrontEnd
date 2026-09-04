import { ReactNode } from 'react';
import {
  Rocket, Download, KeyRound, LogIn, Cable, Network, LayoutGrid, Sparkles,
  Users, Terminal, CheckCircle2, ArrowRight,
} from 'lucide-react';

type Edition = 'cloud' | 'edge';

const EDITION: Edition = (import.meta.env.VITE_EDU_EDITION === 'edge' ? 'edge' : 'cloud');

interface Step {
  icon: typeof Rocket;
  title: string;
  body: ReactNode;
}

const EDGE_STEPS: Step[] = [
  {
    icon: Download,
    title: '1. Instale o Docker',
    body: (
      <>Instale o <strong>Docker Desktop</strong> (Windows/Mac) ou o Docker Engine (Linux). Alternativas grátis para empresas: <strong>Podman</strong> ou <strong>Rancher Desktop</strong>.</>
    ),
  },
  {
    icon: Terminal,
    title: '2. Suba o EDU Edge',
    body: (
      <>Na pasta do EDU Edge, rode <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs dark:bg-gray-800">./start.sh</code> (ou <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs dark:bg-gray-800">docker compose up -d</code>). Depois abra <strong>http://localhost:8080</strong>.</>
    ),
  },
  {
    icon: KeyRound,
    title: '3. Ative sua licença',
    body: <>Cole a chave de licença que você recebeu ao se cadastrar. Sem ela, os recursos ficam bloqueados.</>,
  },
  {
    icon: LogIn,
    title: '4. Entre',
    body: <>Faça login com o usuário administrador da sua instalação.</>,
  },
  {
    icon: Network,
    title: '5. Conecte seus dados',
    body: <>Adicione um broker MQTT em <strong>Configuração</strong>, ou conecte OPC-UA, Modbus TCP ou EtherNet/IP. Seus dados começam a fluir para a UNS.</>,
  },
  {
    icon: LayoutGrid,
    title: '6. Explore e monte telas',
    body: <>Veja a hierarquia no <strong>Explorer</strong> e monte dashboards em <strong>Telas</strong>, com os seus dados reais.</>,
  },
  {
    icon: Sparkles,
    title: '7. Use o AI Bot (local)',
    body: <>O <strong>AI Bot</strong> gera dashboards, analisa a organização dos dados e traz Insights, rodando com o Llama local, sem enviar nada para fora.</>,
  },
];

const CLOUD_STEPS: Step[] = [
  {
    icon: LogIn,
    title: '1. Acesse seu ambiente',
    body: <>Entre pelo seu subdomínio (ex: <em>suaempresa</em>.espacodedadosunificado.com.br) com o seu usuário.</>,
  },
  {
    icon: Network,
    title: '2. Conecte um broker',
    body: <>Em <strong>Configuração</strong>, adicione o seu broker MQTT (ou conecte OPC-UA, Modbus, EtherNet/IP). É por aqui que os dados entram.</>,
  },
  {
    icon: Cable,
    title: '3. Veja os dados chegarem',
    body: <>Abra o <strong>Explorer</strong> para ver os tópicos e a hierarquia (UNS) sendo montada em tempo real.</>,
  },
  {
    icon: LayoutGrid,
    title: '4. Monte dashboards',
    body: <>Crie telas em <strong>Telas</strong>, ou peça ao <strong>AI Bot</strong> para gerar um dashboard a partir de uma descrição.</>,
  },
  {
    icon: Sparkles,
    title: '5. Explore o AI Bot',
    body: <>Gere telas, receba sugestões de organização dos dados (Organization Data) e Insights automáticos sobre as suas tags.</>,
  },
  {
    icon: Users,
    title: '6. Convide sua equipe',
    body: <>Em <strong>Usuários</strong>, adicione engenheiros e defina papéis (admin, engenheiro, viewer).</>,
  },
];

export function HowToStart() {
  const steps = EDITION === 'edge' ? EDGE_STEPS : CLOUD_STEPS;
  const editionLabel = EDITION === 'edge' ? 'EDU Edge (local)' : 'EDU Cloud';

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
          <Rocket className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Como começar</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Coloque o {editionLabel} para rodar em poucos passos.
          </p>
        </div>
      </div>

      <ol className="space-y-3">
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <li
              key={i}
              className="flex gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{step.title}</h3>
                <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-300">{step.body}</p>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="mt-6 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          Pronto! A partir daqui, explore os conectores, a UNS, os alertas e o AI Bot. Cada seção do menu à esquerda tem a sua função.
          {EDITION === 'edge' && (
            <>
              {' '}Para atualizar depois: <code className="rounded bg-white/60 px-1 dark:bg-black/30">docker compose pull &amp;&amp; up -d</code>.
            </>
          )}
        </span>
      </div>

      <a
        href={EDITION === 'edge' ? '/configuration' : '/configuration'}
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
      >
        Conectar meus dados agora <ArrowRight className="h-4 w-4" />
      </a>
    </div>
  );
}

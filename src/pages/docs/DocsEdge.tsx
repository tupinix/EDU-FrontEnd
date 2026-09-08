import { Download, Cpu, HardDrive, ShieldCheck } from 'lucide-react';
import { DocTitle, Section, Code, Callout, H3, K, useL } from './DocsUI';

export function DocsEdge() {
  const L = useL();
  return (
    <>
      <DocTitle
        eyebrow="EDU Edge"
        title={L({ pt: 'Instalar o EDU Edge', en: 'Install EDU Edge' })}
        intro={L({
          pt: 'O EDU Edge roda inteiro na sua máquina via Docker: os bancos, o backend com o broker UNS embutido, o frontend e a IA local. Tudo offline, nada sai da máquina.',
          en: 'EDU Edge runs entirely on your machine via Docker: the databases, the backend with the embedded UNS broker, the frontend and local AI. All offline, nothing leaves the machine.',
        })}
      />

      <div className="my-4 flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900/50 dark:bg-emerald-950/30 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">{L({ pt: 'Pacote do EDU Edge', en: 'EDU Edge package' })}</p>
          <p className="text-xs text-emerald-700 dark:text-emerald-300/80">{L({ pt: 'docker-compose + configuração. As imagens vêm pelo Docker.', en: 'docker-compose + config. The images come via Docker.' })}</p>
        </div>
        <a href="/downloads/edu-edge.zip" download className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">
          <Download className="h-4 w-4" /> {L({ pt: 'Baixar (.zip)', en: 'Download (.zip)' })}
        </a>
      </div>

      <Section id="requisitos" title={L({ pt: 'Requisitos', en: 'Requirements' })}>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { icon: Cpu, t: 'Docker Desktop', s: L({ pt: 'ou Podman / Rancher', en: 'or Podman / Rancher' }) },
            { icon: HardDrive, t: L({ pt: '~8 GB RAM', en: '~8 GB RAM' }), s: L({ pt: '~10 GB de disco', en: '~10 GB of disk' }) },
            { icon: ShieldCheck, t: L({ pt: 'Licença EDU Edge', en: 'EDU Edge license' }), s: L({ pt: 'você recebe ao contratar', en: 'you get it when you sign up' }) },
          ].map((r, i) => { const I = r.icon; return (
            <div key={i} className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
              <I className="h-4 w-4 text-emerald-500" /><p className="mt-1 text-sm font-medium">{r.t}</p><p className="text-xs text-gray-500">{r.s}</p>
            </div>
          ); })}
        </div>
      </Section>

      <Section id="instalar" title={L({ pt: 'Instalar e rodar', en: 'Install and run' })}>
        <H3>{L({ pt: '1. Instale o Docker', en: '1. Install Docker' })}</H3>
        <p>{L({ pt: 'Docker Desktop (Windows/Mac) ou Docker Engine (Linux). Para empresas que precisam de alternativa gratuita ao Docker Desktop: Podman ou Rancher Desktop.', en: 'Docker Desktop (Windows/Mac) or Docker Engine (Linux). For companies needing a free alternative to Docker Desktop: Podman or Rancher Desktop.' })}</p>
        <H3>{L({ pt: '2. Suba a stack', en: '2. Start the stack' })}</H3>
        <p>{L({ pt: 'Descompacte o pacote e, dentro da pasta:', en: 'Unzip the package and, inside the folder:' })}</p>
        <Code lang="bash">{`cd edu-edge
./start.sh          # ${L({ pt: 'ou:', en: 'or:' })}  docker compose up -d`}</Code>
        <p>{L({ pt: 'Na primeira vez o Docker baixa as imagens (alguns minutos).', en: 'On the first run Docker downloads the images (a few minutes).' })}</p>
        <H3>{L({ pt: '3. Abra e ative', en: '3. Open and activate' })}</H3>
        <p>{L({ pt: 'Acesse http://localhost:8080, cole a sua chave de licença e faça login.', en: 'Open http://localhost:8080, paste your license key and log in.' })}</p>
        <Callout tone="warn">{L({ pt: 'Sem licença válida os recursos ficam bloqueados. A chave você recebe ao contratar.', en: 'Without a valid license the features are locked. You get the key when you sign up.' })}</Callout>
      </Section>

      <Section id="ia-local" title={L({ pt: 'IA local (opcional)', en: 'Local AI (optional)' })}>
        <p>{L({ pt: 'O AI Bot e o Insight rodam com um modelo local (Ollama), sem enviar nada para fora. Baixe o modelo uma vez:', en: 'The AI Bot and Insight run on a local model (Ollama), sending nothing outside. Pull the model once:' })}</p>
        <Code lang="bash">docker compose exec ollama ollama pull llama3.1:8b</Code>
        <p className="text-sm text-gray-500">{L({ pt: 'Para GPU NVIDIA, veja o bloco', en: 'For NVIDIA GPU, see the' })} <K>deploy.resources</K> {L({ pt: 'no README do pacote.', en: 'block in the package README.' })}</p>
      </Section>

      <Section id="operar" title={L({ pt: 'Atualizar, parar e portas', en: 'Update, stop and ports' })}>
        <H3>{L({ pt: 'Atualizar (mantém seus dados)', en: 'Update (keeps your data)' })}</H3>
        <Code lang="bash">{`docker compose pull
docker compose up -d`}</Code>
        <H3>{L({ pt: 'Parar / remover', en: 'Stop / remove' })}</H3>
        <Code lang="bash">{`docker compose stop     # ${L({ pt: 'pausa (mantém dados)', en: 'pause (keeps data)' })}
docker compose down     # ${L({ pt: 'remove containers (mantém volumes)', en: 'remove containers (keeps volumes)' })}
docker compose down -v  # ${L({ pt: 'remove tudo, inclusive os dados', en: 'remove everything, including data' })}`}</Code>
        <p>{L({ pt: 'Só a porta 8080 é exposta na sua máquina; bancos e IA ficam na rede interna do Docker.', en: 'Only port 8080 is exposed on your machine; databases and AI stay on Docker’s internal network.' })}</p>
      </Section>
    </>
  );
}

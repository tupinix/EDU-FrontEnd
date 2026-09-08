import { Download, Cpu, HardDrive, ShieldCheck } from 'lucide-react';
import { DocTitle, Section, Code, Callout, H3, K } from './DocsUI';

export function DocsEdge() {
  return (
    <>
      <DocTitle
        eyebrow="EDU Edge"
        title="Instalar o EDU Edge"
        intro="O EDU Edge roda inteiro na sua máquina via Docker: os bancos, o backend com o broker UNS embutido, o frontend e a IA local. Tudo offline, nada sai da máquina."
      />

      <div className="my-4 flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900/50 dark:bg-emerald-950/30 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">Pacote do EDU Edge</p>
          <p className="text-xs text-emerald-700 dark:text-emerald-300/80">docker-compose + configuração. As imagens vêm pelo Docker.</p>
        </div>
        <a href="/downloads/edu-edge.zip" download className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">
          <Download className="h-4 w-4" /> Baixar (.zip)
        </a>
      </div>

      <Section id="requisitos" title="Requisitos">
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { icon: Cpu, t: 'Docker Desktop', s: 'ou Podman / Rancher' },
            { icon: HardDrive, t: '~8 GB RAM', s: '~10 GB de disco' },
            { icon: ShieldCheck, t: 'Licença EDU Edge', s: 'você recebe ao contratar' },
          ].map((r) => { const I = r.icon; return (
            <div key={r.t} className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
              <I className="h-4 w-4 text-emerald-500" /><p className="mt-1 text-sm font-medium">{r.t}</p><p className="text-xs text-gray-500">{r.s}</p>
            </div>
          ); })}
        </div>
      </Section>

      <Section id="instalar" title="Instalar e rodar">
        <H3>1. Instale o Docker</H3>
        <p>Docker Desktop (Windows/Mac) ou Docker Engine (Linux). Para empresas que precisam de alternativa gratuita ao Docker Desktop: <strong>Podman</strong> ou <strong>Rancher Desktop</strong>.</p>
        <H3>2. Suba a stack</H3>
        <p>Descompacte o pacote e, dentro da pasta:</p>
        <Code lang="bash">{`cd edu-edge
./start.sh          # ou:  docker compose up -d`}</Code>
        <p>Na primeira vez o Docker baixa as imagens (alguns minutos).</p>
        <H3>3. Abra e ative</H3>
        <p>Acesse <strong>http://localhost:8080</strong>, cole a sua <strong>chave de licença</strong> e faça login.</p>
        <Callout tone="warn">Sem licença válida os recursos ficam bloqueados. A chave você recebe ao contratar.</Callout>
      </Section>

      <Section id="ia-local" title="IA local (opcional)">
        <p>O AI Bot e o Insight rodam com um modelo local (Ollama), sem enviar nada para fora. Baixe o modelo uma vez:</p>
        <Code lang="bash">docker compose exec ollama ollama pull llama3.1:8b</Code>
        <p className="text-sm text-gray-500">Para GPU NVIDIA, veja o bloco <K>deploy.resources</K> no README do pacote.</p>
      </Section>

      <Section id="operar" title="Atualizar, parar e portas">
        <H3>Atualizar (mantém seus dados)</H3>
        <Code lang="bash">{`docker compose pull
docker compose up -d`}</Code>
        <H3>Parar / remover</H3>
        <Code lang="bash">{`docker compose stop     # pausa (mantém dados)
docker compose down     # remove containers (mantém volumes)
docker compose down -v  # remove tudo, inclusive os dados`}</Code>
        <p>Só a porta <strong>8080</strong> é exposta na sua máquina; bancos e IA ficam na rede interna do Docker.</p>
      </Section>
    </>
  );
}

import { Link } from 'react-router-dom';
import { LayoutGrid, Code2, Network, Server, ArrowRight } from 'lucide-react';
import { DocTitle, Section, Callout } from './DocsUI';

const CARDS = [
  { to: '/docs/plataforma', icon: LayoutGrid, title: 'Pages & fluxo do EDU', desc: 'O que cada aba faz e como os dados fluem, do broker à tela.' },
  { to: '/docs/http', icon: Code2, title: 'Integração via HTTP', desc: 'Consuma a UNS pela API REST: login, tópicos, valores e histórico.' },
  { to: '/docs/i3x', icon: Network, title: 'Integração via i3X', desc: 'Exponha a sua UNS no padrão CESMII i3X para outros sistemas.' },
  { to: '/docs/edu-edge', icon: Server, title: 'Instalar o EDU Edge', desc: 'Rode o EDU na sua máquina via Docker, local e offline.' },
];

export function DocsHome() {
  return (
    <>
      <DocTitle
        eyebrow="Documentação"
        title="Comece pelo EDU"
        intro="O Espaço de Dados Unificado é a fonte única da verdade dos seus dados industriais em tempo real. Esta documentação cobre o uso da plataforma, as integrações e a instalação local."
      />

      <Section id="o-que-e" title="O que é o EDU">
        <p>O <strong>EDU</strong> é uma plataforma de <strong>Unified Namespace (UNS)</strong> para a Indústria 4.0. Ele conecta o chão de fábrica (OT) e a TI, ingerindo dados de <strong>MQTT, Sparkplug B, OPC-UA, Modbus TCP e EtherNet/IP</strong>, e organiza tudo numa hierarquia padronizada (ISA-95) que os seus times e sistemas consomem em tempo real.</p>
        <p>Duas edições, o mesmo produto:</p>
        <ul className="ml-5 list-disc space-y-1">
          <li><strong>EDU Cloud</strong>: SaaS multi-tenant, acessível pelo navegador.</li>
          <li><strong>EDU Edge</strong>: roda na sua máquina via Docker, offline, com IA local.</li>
        </ul>
      </Section>

      <Section id="fluxo" title="O fluxo em 4 passos">
        <ol className="ml-5 list-decimal space-y-1.5">
          <li><strong>Conecte</strong> uma fonte de dados (um broker MQTT, ou OPC-UA / Modbus / EtherNet/IP).</li>
          <li><strong>Explore</strong> a UNS: veja os tópicos e a hierarquia se montarem no Explorer.</li>
          <li><strong>Visualize</strong>: monte telas de processo ou peça ao AI Bot para gerar.</li>
          <li><strong>Integre</strong>: consuma tudo por HTTP ou i3X, e configure alertas e modelos.</li>
        </ol>
        <Callout tone="tip">Novo por aqui? Comece por <Link to="/docs/plataforma" className="font-medium underline">Pages &amp; fluxo do EDU</Link> para conhecer cada aba.</Callout>
      </Section>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {CARDS.map((c) => {
          const I = c.icon;
          return (
            <Link key={c.to} to={c.to} className="group flex flex-col rounded-xl border border-gray-200 bg-white p-4 transition hover:border-emerald-300 hover:shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:hover:border-emerald-800">
              <I className="h-5 w-5 text-emerald-500" />
              <p className="mt-2 flex items-center gap-1 text-sm font-semibold text-gray-900 dark:text-white">{c.title}<ArrowRight className="h-3.5 w-3.5 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" /></p>
              <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{c.desc}</p>
            </Link>
          );
        })}
      </div>
    </>
  );
}

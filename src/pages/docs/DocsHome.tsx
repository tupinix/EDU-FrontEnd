import { Link } from 'react-router-dom';
import { LayoutGrid, Code2, Network, Server, ArrowRight } from 'lucide-react';
import { DocTitle, Section, Callout, useL } from './DocsUI';

export function DocsHome() {
  const L = useL();
  const cards = [
    { to: '/docs/plataforma', icon: LayoutGrid, title: L({ pt: 'Pages & fluxo do EDU', en: 'Pages & EDU flow' }), desc: L({ pt: 'O que cada aba faz e como os dados fluem, do broker à tela.', en: 'What each page does and how data flows, from broker to screen.' }) },
    { to: '/docs/http', icon: Code2, title: L({ pt: 'Integração via HTTP', en: 'Integrate over HTTP' }), desc: L({ pt: 'Consuma a UNS pela API REST: login, tópicos, valores e histórico.', en: 'Consume the UNS via the REST API: login, topics, values and history.' }) },
    { to: '/docs/i3x', icon: Network, title: L({ pt: 'Integração via i3X', en: 'Integrate over i3X' }), desc: L({ pt: 'Exponha a sua UNS no padrão CESMII i3X para outros sistemas.', en: 'Expose your UNS in the CESMII i3X standard to other systems.' }) },
    { to: '/docs/edu-edge', icon: Server, title: L({ pt: 'Instalar o EDU Edge', en: 'Install EDU Edge' }), desc: L({ pt: 'Rode o EDU na sua máquina via Docker, local e offline.', en: 'Run EDU on your machine via Docker, local and offline.' }) },
  ];

  return (
    <>
      <DocTitle
        eyebrow={L({ pt: 'Documentação', en: 'Documentation' })}
        title={L({ pt: 'Comece pelo EDU', en: 'Get started with EDU' })}
        intro={L({
          pt: 'O Espaço de Dados Unificado é a fonte única da verdade dos seus dados industriais em tempo real. Esta documentação cobre o uso da plataforma, as integrações e a instalação local.',
          en: 'The Unified Data Space is the single source of truth for your industrial data in real time. These docs cover using the platform, integrations, and local install.',
        })}
      />

      <Section id="o-que-e" title={L({ pt: 'O que é o EDU', en: 'What EDU is' })}>
        <p>{L({
          pt: 'O EDU é uma plataforma de Unified Namespace (UNS) para a Indústria 4.0. Ele conecta o chão de fábrica (OT) e a TI, ingerindo dados de MQTT, Sparkplug B, OPC-UA, Modbus TCP e EtherNet/IP, e organiza tudo numa hierarquia padronizada (ISA-95) que os seus times e sistemas consomem em tempo real.',
          en: 'EDU is a Unified Namespace (UNS) platform for Industry 4.0. It bridges the shop floor (OT) and IT, ingesting data from MQTT, Sparkplug B, OPC-UA, Modbus TCP and EtherNet/IP, and organizes everything into a standardized hierarchy (ISA-95) that your teams and systems consume in real time.',
        })}</p>
        <p>{L({ pt: 'Duas edições, o mesmo produto:', en: 'Two editions, the same product:' })}</p>
        <ul className="ml-5 list-disc space-y-1">
          <li>{L({ pt: 'EDU Cloud: SaaS multi-tenant, acessível pelo navegador.', en: 'EDU Cloud: multi-tenant SaaS, accessible from the browser.' })}</li>
          <li>{L({ pt: 'EDU Edge: roda na sua máquina via Docker, offline, com IA local.', en: 'EDU Edge: runs on your machine via Docker, offline, with local AI.' })}</li>
        </ul>
      </Section>

      <Section id="fluxo" title={L({ pt: 'O fluxo em 4 passos', en: 'The flow in 4 steps' })}>
        <ol className="ml-5 list-decimal space-y-1.5">
          <li>{L({ pt: 'Conecte uma fonte de dados (um broker MQTT, ou OPC-UA / Modbus / EtherNet/IP).', en: 'Connect a data source (an MQTT broker, or OPC-UA / Modbus / EtherNet/IP).' })}</li>
          <li>{L({ pt: 'Explore a UNS: veja os tópicos e a hierarquia se montarem no Explorer.', en: 'Explore the UNS: watch topics and the hierarchy build up in the Explorer.' })}</li>
          <li>{L({ pt: 'Visualize: monte telas de processo ou peça ao AI Bot para gerar.', en: 'Visualize: build process screens or ask the AI Bot to generate them.' })}</li>
          <li>{L({ pt: 'Integre: consuma tudo por HTTP ou i3X, e configure alertas e modelos.', en: 'Integrate: consume everything over HTTP or i3X, and set up alerts and models.' })}</li>
        </ol>
        <Callout tone="tip">{L({ pt: 'Novo por aqui? Comece por Pages & fluxo do EDU para conhecer cada aba.', en: 'New here? Start with Pages & EDU flow to learn each page.' })} <Link to="/docs/plataforma" className="font-medium underline">Pages &amp; fluxo</Link></Callout>
      </Section>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {cards.map((c) => {
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

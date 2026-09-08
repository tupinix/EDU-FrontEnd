import { Link } from 'react-router-dom';
import { DocTitle, Section, Shot, Callout, K, useL } from './DocsUI';

export function DocsPlatform() {
  const L = useL();
  return (
    <>
      <DocTitle
        eyebrow={L({ pt: 'Guia da plataforma', en: 'Platform guide' })}
        title={L({ pt: 'Pages & fluxo do EDU', en: 'Pages & EDU flow' })}
        intro={L({
          pt: 'Um tour por cada aba do menu, na ordem em que você as usa no dia a dia: conectar, explorar, modelar, visualizar e analisar.',
          en: 'A tour of each page in the menu, in the order you use them day to day: connect, explore, model, visualize and analyze.',
        })}
      />

      <Section id="painel" title={L({ pt: 'Painel (Home)', en: 'Dashboard (Home)' })}>
        <p>{L({
          pt: 'A primeira tela após o login. Mostra a saúde do sistema em números: mensagens por dia e por minuto, total de tópicos, taxa de erro, o estado de cada conexão e os tópicos mais ativos.',
          en: 'The first screen after login. Shows system health in numbers: messages per day and per minute, total topics, error rate, the state of each connection and the most active topics.',
        })}</p>
        <p>{L({ pt: 'Use o Painel para confirmar, num olhar, que os dados estão fluindo e as conexões no ar.', en: 'Use the Dashboard to confirm at a glance that data is flowing and connections are up.' })}</p>
        <Shot src="/docs/img/dashboard.jpg" alt={L({ pt: 'Painel do EDU com métricas em tempo real', en: 'EDU dashboard with real-time metrics' })} />
      </Section>

      <Section id="brokers" title={L({ pt: 'Brokers MQTT', en: 'MQTT brokers' })}>
        <p>{L({ pt: 'Em MQTT / Configuração você gerencia as conexões com brokers. Clique em Novo Broker, informe host, porta, TLS e credenciais, e o EDU passa a ingerir os tópicos daquele broker para a UNS.', en: 'Under MQTT / Settings you manage broker connections. Click New Broker, enter host, port, TLS and credentials, and EDU starts ingesting that broker’s topics into the UNS.' })}</p>
        <p>{L({ pt: 'Todo EDU já vem com o broker interno da UNS (marcado como Interno/padrão): o broker embutido onde o próprio EDU e a IA publicam. Ele não pode ser apagado.', en: 'Every EDU ships with the internal UNS broker (labeled Internal/default): the embedded broker where EDU itself and the AI publish. It cannot be deleted.' })}</p>
        <Callout tone="tip">{L({ pt: 'Use TLS/SSL (porta 8883) para brokers na nuvem. Tópicos com wildcard', en: 'Use TLS/SSL (port 8883) for cloud brokers. Wildcard topics' })} <K>#</K> {L({ pt: 'capturam toda a hierarquia.', en: 'capture the whole hierarchy.' })}</Callout>
        <Shot src="/docs/img/brokers.jpg" alt={L({ pt: 'Gerenciamento de brokers MQTT', en: 'MQTT broker management' })} />
      </Section>

      <Section id="explorer" title={L({ pt: 'Explorer (UNS)', en: 'Explorer (UNS)' })}>
        <p>{L({ pt: 'O coração do EDU. Navega a árvore de tópicos e a hierarquia ISA-95 (Empresa → Site → Área → Linha → Equipamento) montada automaticamente a partir dos dados que chegam.', en: 'The heart of EDU. Browse the topic tree and the ISA-95 hierarchy (Enterprise → Site → Area → Line → Equipment) built automatically from incoming data.' })}</p>
        <p>{L({ pt: 'Clique em qualquer tópico para ver, no painel da direita: o valor atual, os metadados (QoS, retido, tipo, última atualização), o payload completo (em árvore ou cru), a tendência e o histórico.', en: 'Click any topic to see, in the right panel: the current value, metadata (QoS, retained, type, last update), the full payload (tree or raw), the trend and the history.' })}</p>
        <Shot src="/docs/img/explorer.jpg" alt={L({ pt: 'Explorer com um tópico selecionado mostrando valor, payload e histórico', en: 'Explorer with a topic selected showing value, payload and history' })} />
      </Section>

      <Section id="modelos" title={L({ pt: 'Modelos de dados & Sensores virtuais', en: 'Data models & virtual sensors' })}>
        <p>{L({ pt: 'Em Data Models você enriquece e organiza a UNS: agrupa tags em equipamentos e ativos, e cria sensores virtuais, tags derivadas calculadas a partir de outras (ex: OEE, potência total, eficiência), publicadas de volta na UNS como se fossem tags reais.', en: 'Under Data Models you enrich and organize the UNS: group tags into equipment and assets, and create virtual sensors, derived tags computed from others (e.g. OEE, total power, efficiency), published back into the UNS as if they were real tags.' })}</p>
        <p>{L({ pt: 'É assim que você transforma tags cruas em informação de negócio, sem tocar no chão de fábrica.', en: 'This is how you turn raw tags into business information, without touching the shop floor.' })}</p>
      </Section>

      <Section id="telas" title={L({ pt: 'Telas (dashboards de processo)', en: 'Screens (process dashboards)' })}>
        <p>{L({ pt: 'Monte painéis estilo SCADA arrastando widgets, gauge, tendência, tanque, KPI, valor, tabela, alarme, tubulação e outros, e ligando cada um a uma tag da UNS. As telas são compartilhadas com toda a organização e podem ser publicadas por um link.', en: 'Build SCADA-like screens by dragging widgets, gauge, trend, tank, KPI, value, table, alarm, pipe and more, and binding each to a UNS tag. Screens are shared across the organization and can be published via a link.' })}</p>
        <Shot src="/docs/img/telas.jpg" alt={L({ pt: 'Dashboard de processo montado no EDU', en: 'A process dashboard built in EDU' })} />
        <Callout>{L({ pt: 'As telas também podem ser geradas pelo AI Bot a partir de uma descrição, veja abaixo.', en: 'Screens can also be generated by the AI Bot from a description, see below.' })}</Callout>
      </Section>

      <Section id="aibot" title={L({ pt: 'AI Bot', en: 'AI Bot' })}>
        <p>{L({ pt: 'O assistente de IA do EDU, com três modos:', en: 'EDU’s AI assistant, with three modes:' })}</p>
        <ul className="ml-5 list-disc space-y-1">
          <li>{L({ pt: 'Screens Creator: descreva uma tela e a IA monta o dashboard com os seus dados reais.', en: 'Screens Creator: describe a screen and the AI builds the dashboard with your real data.' })}</li>
          <li>{L({ pt: 'Organization Data: a IA analisa as suas conexões e sugere como organizar a UNS (mapeamento ISA-95), publicando a sugestão de volta na UNS.', en: 'Organization Data: the AI analyzes your connections and suggests how to organize the UNS (ISA-95 mapping), publishing the suggestion back into the UNS.' })}</li>
          <li>{L({ pt: 'Insight: detecta anomalias e tendências nas suas tags e publica os achados como insights.', en: 'Insight: detects anomalies and trends in your tags and publishes the findings as insights.' })}</li>
        </ul>
        <p>{L({ pt: 'No EDU Edge, o AI Bot roda com um modelo local (Llama), sem enviar nada para fora.', en: 'On EDU Edge, the AI Bot runs on a local model (Llama), sending nothing outside.' })}</p>
        <Shot src="/docs/img/aibot.jpg" alt={L({ pt: 'AI Bot com os modos Screens Creator, Organization Data e Insight', en: 'AI Bot with the Screens Creator, Organization Data and Insight modes' })} />
      </Section>

      <Section id="i3x" title={L({ pt: 'i3X (interoperabilidade)', en: 'i3X (interoperability)' })}>
        <p>{L({ pt: 'A aba i3X expõe a sua UNS no padrão CESMII i3X por uma URL dedicada da sua organização, para que ferramentas como Ignition, HighByte e BI consultem objetos, valores e histórico de forma padronizada.', en: 'The i3X page exposes your UNS in the CESMII i3X standard via a dedicated URL for your organization, so tools like Ignition, HighByte and BI can query objects, values and history in a standardized way.' })} {L({ pt: 'O passo a passo está em', en: 'The step-by-step is in' })} <Link to="/docs/i3x" className="text-emerald-600 hover:underline dark:text-emerald-400">{L({ pt: 'Integração via i3X', en: 'Integrate over i3X' })}</Link>.</p>
        <Shot src="/docs/img/i3x.jpg" alt={L({ pt: 'Aba i3X com a URL da organização', en: 'i3X page with the organization URL' })} />
      </Section>

      <Section id="mais" title={L({ pt: 'Alertas, Usuários e mais', en: 'Alerts, Users and more' })}>
        <p>{L({ pt: 'Alertas: crie regras de limite sobre tags e receba notificações. Usuários e Organizations: gerencie acesso e papéis (admin, engenheiro, viewer). API REST e MCP Server: pontos de integração para sistemas e para assistentes de IA.', en: 'Alerts: create threshold rules on tags and get notified. Users and Organizations: manage access and roles (admin, engineer, viewer). REST API and MCP Server: integration points for systems and AI assistants.' })}</p>
      </Section>
    </>
  );
}

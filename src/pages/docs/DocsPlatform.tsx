import { Link } from 'react-router-dom';
import { DocTitle, Section, Shot, Callout, K } from './DocsUI';

export function DocsPlatform() {
  return (
    <>
      <DocTitle
        eyebrow="Guia da plataforma"
        title="Pages & fluxo do EDU"
        intro="Um tour por cada aba do menu, na ordem em que você as usa no dia a dia: conectar, explorar, modelar, visualizar e analisar."
      />

      <Section id="painel" title="Painel (Home)">
        <p>A primeira tela após o login. Mostra a saúde do sistema em números, mensagens por dia e por minuto, total de tópicos, taxa de erro, o estado de cada conexão e os tópicos mais ativos.</p>
        <p>Use o Painel para confirmar, num olhar, que os dados estão fluindo e que as conexões estão no ar.</p>
        <Shot src="/docs/img/dashboard.jpg" alt="Painel do EDU com métricas em tempo real" />
      </Section>

      <Section id="brokers" title="Brokers MQTT">
        <p>Em <strong>MQTT / Configuração</strong> você gerencia as conexões com brokers. Clique em <K>Novo Broker</K>, informe host, porta, TLS e credenciais, e o EDU passa a ingerir os tópicos daquele broker para a UNS.</p>
        <p>Todo EDU já vem com o <strong>broker interno da UNS</strong> (marcado como <em>Interno (padrão)</em>): é o broker embutido onde o próprio EDU e a IA publicam. Ele não pode ser apagado.</p>
        <Callout tone="tip">Use <strong>TLS/SSL (porta 8883)</strong> para brokers na nuvem. Tópicos com wildcard <K>#</K> capturam toda a hierarquia.</Callout>
        <Shot src="/docs/img/brokers.jpg" alt="Gerenciamento de brokers MQTT" />
      </Section>

      <Section id="explorer" title="Explorer (UNS)">
        <p>O coração do EDU. Navega a árvore de tópicos e a hierarquia ISA-95 (Empresa → Site → Área → Linha → Equipamento) montada automaticamente a partir dos dados que chegam.</p>
        <p>Clique em qualquer tópico para ver, no painel da direita: o <strong>valor atual</strong>, os metadados (QoS, retido, tipo, última atualização), o <strong>payload</strong> completo (em árvore ou cru), a <strong>tendência</strong> e o <strong>histórico</strong>.</p>
        <Shot src="/docs/img/explorer.jpg" alt="Explorer com um tópico selecionado mostrando valor, payload e histórico" />
      </Section>

      <Section id="modelos" title="Modelos de dados & Sensores virtuais">
        <p>Em <strong>Data Models</strong> você enriquece e organiza a UNS: agrupa tags em equipamentos e ativos, e cria <strong>sensores virtuais</strong>, tags derivadas calculadas a partir de outras (ex: OEE, potência total, eficiência), publicadas de volta na UNS como se fossem tags reais.</p>
        <p>É assim que você transforma tags cruas em informação de negócio, sem tocar no chão de fábrica.</p>
      </Section>

      <Section id="telas" title="Telas (dashboards de processo)">
        <p>Monte painéis estilo SCADA arrastando widgets, gauge, tendência, tanque, KPI, valor, tabela, alarme, tubulação e outros, e ligando cada um a uma tag da UNS. As telas são compartilhadas com toda a organização e podem ser publicadas por um link.</p>
        <Shot src="/docs/img/telas.jpg" alt="Dashboard de processo montado no EDU" />
        <Callout>As telas também podem ser geradas pelo <strong>AI Bot</strong> a partir de uma descrição, veja abaixo.</Callout>
      </Section>

      <Section id="aibot" title="AI Bot">
        <p>O assistente de IA do EDU, com três modos:</p>
        <ul className="ml-5 list-disc space-y-1">
          <li><strong>Screens Creator</strong>: descreva uma tela e a IA monta o dashboard com os seus dados reais.</li>
          <li><strong>Organization Data</strong>: a IA analisa as suas conexões e sugere como organizar a UNS (mapeamento ISA-95), publicando a sugestão de volta na UNS.</li>
          <li><strong>Insight</strong>: detecta anomalias e tendências nas suas tags e publica os achados como insights.</li>
        </ul>
        <p>No <strong>EDU Edge</strong>, o AI Bot roda com um modelo local (Llama), sem enviar nada para fora.</p>
        <Shot src="/docs/img/aibot.jpg" alt="AI Bot com os modos Screens Creator, Organization Data e Insight" />
      </Section>

      <Section id="i3x" title="i3X (interoperabilidade)">
        <p>A aba i3X expõe a sua UNS no padrão <strong>CESMII i3X</strong> por uma URL dedicada da sua organização, para que ferramentas como Ignition, HighByte e BI consultem objetos, valores e histórico de forma padronizada. O passo a passo está em <Link to="/docs/i3x" className="text-emerald-600 hover:underline dark:text-emerald-400">Integração via i3X</Link>.</p>
        <Shot src="/docs/img/i3x.jpg" alt="Aba i3X com a URL da organização" />
      </Section>

      <Section id="mais" title="Alertas, Usuários e mais">
        <p><strong>Alertas</strong>: crie regras de limite sobre tags e receba notificações. <strong>Usuários</strong> e <strong>Organizations</strong>: gerencie acesso e papéis (admin, engenheiro, viewer). <strong>API REST</strong> e <strong>MCP Server</strong>: pontos de integração para sistemas e para assistentes de IA.</p>
      </Section>
    </>
  );
}

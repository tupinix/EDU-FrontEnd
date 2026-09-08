import { DocTitle, Section, Code, Callout, H3, K } from './DocsUI';

const I3X = 'https://api.espacodedadosunificado.com.br/tupinix/i3x/v1';

export function DocsI3x() {
  return (
    <>
      <DocTitle
        eyebrow="Integração"
        title="Integração via i3X (CESMII)"
        intro="O EDU expõe a sua UNS no padrão de interoperabilidade CESMII i3X, para que ferramentas como Ignition, HighByte e BI consultem os seus objetos de forma padronizada."
      />

      <Section id="base" title="A URL da sua organização">
        <p>Cada organização tem uma URL i3X exclusiva, no formato <K>{'/<tenant>/i3x/v1'}</K>, sem cabeçalho de autenticação (o isolamento é por URL). Para a organização <em>tupinix</em>:</p>
        <Code>{I3X}</Code>
        <p>A URL exata e a documentação OpenAPI aparecem na aba <strong>i3X</strong> do EDU. A referência interativa fica em:</p>
        <Code>https://api.espacodedadosunificado.com.br/i3x/docs</Code>
        <Callout>No EDU Edge, a base é <K>http://localhost:8080/&lt;tenant&gt;/i3x/v1</K>.</Callout>
      </Section>

      <Section id="objetos" title="Objetos, tipos e namespaces">
        <H3>Listar objetos</H3>
        <Code lang="bash">{`curl ${I3X}/objects`}</Code>

        <H3>Tipos de objeto e namespaces</H3>
        <Code lang="bash">{`curl ${I3X}/objecttypes
curl ${I3X}/namespaces
curl ${I3X}/relationshiptypes`}</Code>
      </Section>

      <Section id="valores" title="Valores e histórico">
        <H3>Valor atual</H3>
        <Code lang="bash">{`# por caminho/id
curl ${I3X}/objects/<id>/value

# em lote
curl -X POST ${I3X}/objects/value \\
  -H "Content-Type: application/json" \\
  -d '{"ids":["<id1>","<id2>"]}'`}</Code>

        <H3>Histórico e relacionamentos</H3>
        <Code lang="bash">{`curl ${I3X}/objects/<id>/history
curl ${I3X}/objects/<id>/related`}</Code>
      </Section>

      <Section id="escrita" title="Escrever valores (opcional)">
        <p>O i3X do EDU também aceita escrita de valor e de histórico (<K>PUT</K>), útil para sistemas que empurram dados para a UNS:</p>
        <Code lang="bash">{`curl -X PUT ${I3X}/objects/<id>/value \\
  -H "Content-Type: application/json" \\
  -d '{"value": 42.5, "quality": "good"}'`}</Code>
        <Callout tone="tip">Tudo segue o contrato <strong>CESMII i3X 1.0</strong>, então clientes i3X existentes (i3X Explorer, conectores) funcionam apontando para a sua URL.</Callout>
      </Section>
    </>
  );
}

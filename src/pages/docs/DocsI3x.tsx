import { DocTitle, Section, Code, Callout, H3, K, useL } from './DocsUI';

const I3X = 'https://api.espacodedadosunificado.com.br/tupinix/i3x/v1';

export function DocsI3x() {
  const L = useL();
  return (
    <>
      <DocTitle
        eyebrow={L({ pt: 'Integração', en: 'Integration' })}
        title={L({ pt: 'Integração via i3X (CESMII)', en: 'Integrate over i3X (CESMII)' })}
        intro={L({
          pt: 'O EDU expõe a sua UNS no padrão de interoperabilidade CESMII i3X, para que ferramentas como Ignition, HighByte e BI consultem os seus objetos de forma padronizada.',
          en: 'EDU exposes your UNS in the CESMII i3X interoperability standard, so tools like Ignition, HighByte and BI can query your objects in a standardized way.',
        })}
      />

      <Section id="base" title={L({ pt: 'A URL da sua organização', en: 'Your organization URL' })}>
        <p>{L({ pt: 'Cada organização tem uma URL i3X exclusiva, no formato', en: 'Each organization has a dedicated i3X URL, shaped like' })} <K>{'/<tenant>/i3x/v1'}</K>, {L({ pt: 'sem cabeçalho de autenticação (o isolamento é por URL). Para a organização tupinix:', en: 'with no auth header (isolation is per URL). For the tupinix organization:' })}</p>
        <Code>{I3X}</Code>
        <p>{L({ pt: 'A URL exata e a documentação OpenAPI aparecem na aba i3X do EDU. A referência interativa fica em:', en: 'The exact URL and the OpenAPI docs appear on EDU’s i3X page. The interactive reference is at:' })}</p>
        <Code>https://api.espacodedadosunificado.com.br/i3x/docs</Code>
        <Callout>{L({ pt: 'No EDU Edge, a base é', en: 'On EDU Edge, the base is' })} <K>http://localhost:8080/&lt;tenant&gt;/i3x/v1</K>.</Callout>
      </Section>

      <Section id="objetos" title={L({ pt: 'Objetos, tipos e namespaces', en: 'Objects, types and namespaces' })}>
        <H3>{L({ pt: 'Listar objetos', en: 'List objects' })}</H3>
        <Code lang="bash">{`curl ${I3X}/objects`}</Code>

        <H3>{L({ pt: 'Tipos de objeto e namespaces', en: 'Object types and namespaces' })}</H3>
        <Code lang="bash">{`curl ${I3X}/objecttypes
curl ${I3X}/namespaces
curl ${I3X}/relationshiptypes`}</Code>
      </Section>

      <Section id="valores" title={L({ pt: 'Valores e histórico', en: 'Values and history' })}>
        <H3>{L({ pt: 'Valor atual', en: 'Current value' })}</H3>
        <Code lang="bash">{`# ${L({ pt: 'por caminho/id', en: 'by path/id' })}
curl ${I3X}/objects/<id>/value

# ${L({ pt: 'em lote', en: 'in batch' })}
curl -X POST ${I3X}/objects/value \\
  -H "Content-Type: application/json" \\
  -d '{"ids":["<id1>","<id2>"]}'`}</Code>

        <H3>{L({ pt: 'Histórico e relacionamentos', en: 'History and relationships' })}</H3>
        <Code lang="bash">{`curl ${I3X}/objects/<id>/history
curl ${I3X}/objects/<id>/related`}</Code>
      </Section>

      <Section id="escrita" title={L({ pt: 'Escrever valores (opcional)', en: 'Write values (optional)' })}>
        <p>{L({ pt: 'O i3X do EDU também aceita escrita de valor e de histórico (PUT), útil para sistemas que empurram dados para a UNS:', en: 'EDU’s i3X also accepts value and history writes (PUT), useful for systems that push data into the UNS:' })}</p>
        <Code lang="bash">{`curl -X PUT ${I3X}/objects/<id>/value \\
  -H "Content-Type: application/json" \\
  -d '{"value": 42.5, "quality": "good"}'`}</Code>
        <Callout tone="tip">{L({ pt: 'Tudo segue o contrato CESMII i3X 1.0, então clientes i3X existentes (i3X Explorer, conectores) funcionam apontando para a sua URL.', en: 'Everything follows the CESMII i3X 1.0 contract, so existing i3X clients (i3X Explorer, connectors) work pointing at your URL.' })}</Callout>
      </Section>
    </>
  );
}

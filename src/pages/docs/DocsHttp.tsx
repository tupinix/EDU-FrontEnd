import { DocTitle, Section, Code, Callout, H3, K, useL } from './DocsUI';

const API = 'https://api.espacodedadosunificado.com.br/api';

export function DocsHttp() {
  const L = useL();
  return (
    <>
      <DocTitle
        eyebrow={L({ pt: 'Integração', en: 'Integration' })}
        title={L({ pt: 'Integração via HTTP (REST)', en: 'Integrate over HTTP (REST)' })}
        intro={L({
          pt: 'Toda a plataforma é acessível por uma API REST com autenticação por token. Consuma a UNS, os brokers, os dashboards e a IA a partir de qualquer sistema.',
          en: 'The whole platform is reachable through a REST API with token auth. Consume the UNS, brokers, dashboards and AI from any system.',
        })}
      />

      <Section id="base" title={L({ pt: 'Base e referência', en: 'Base URL & reference' })}>
        <p>{L({ pt: 'A base da API é', en: 'The API base is' })} <K>{API}</K> ({L({ pt: 'no EDU Edge,', en: 'on EDU Edge,' })} <K>http://localhost:8080/api</K>). {L({ pt: 'A referência completa e interativa (Swagger / OpenAPI) fica em:', en: 'The full interactive reference (Swagger / OpenAPI) is at:' })}</p>
        <Code>{`${API}/docs`}</Code>
        <Callout>{L({ pt: 'Todas as respostas seguem o formato', en: 'Every response follows the shape' })} <K>{'{ success, data, error, timestamp }'}</K>. {L({ pt: 'Um success:false traz o motivo em error.', en: 'A success:false carries the reason in error.' })}</Callout>
      </Section>

      <Section id="auth" title={L({ pt: '1. Autenticação', en: '1. Authentication' })}>
        <p>{L({ pt: 'Faça login com e-mail e senha. A resposta traz um token Bearer (JWT) que você envia no cabeçalho Authorization das próximas chamadas.', en: 'Log in with email and password. The response returns a Bearer token (JWT) that you send in the Authorization header of subsequent calls.' })}</p>
        <Code lang="bash">{`curl -X POST ${API}/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"you@company.com","password":"your-password"}'`}</Code>
        <p>{L({ pt: 'Resposta:', en: 'Response:' })}</p>
        <Code lang="json">{`{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJI...",
    "user": { "email": "you@company.com", "role": "admin", "tenant": { ... } }
  }
}`}</Code>
        <Callout tone="tip">{L({ pt: 'Guarde o token e reutilize-o. Ele expira em 24h, refaça o login para renovar.', en: 'Keep the token and reuse it. It expires in 24h, log in again to renew.' })}</Callout>
      </Section>

      <Section id="topics" title={L({ pt: '2. Ler a UNS', en: '2. Read the UNS' })}>
        <H3>{L({ pt: 'Listar todos os tópicos', en: 'List all topics' })}</H3>
        <Code lang="bash">{`TOKEN="eyJhbGciOiJI..."
curl ${API}/topics/list -H "Authorization: Bearer $TOKEN"`}</Code>

        <H3>{L({ pt: 'Valor atual de um tópico', en: 'Current value of a topic' })}</H3>
        <Code lang="bash">{`curl "${API}/topics/details?topic=Tupinix/BRPlant02/Utilities/CoolingTower/AT2101" \\
  -H "Authorization: Bearer $TOKEN"`}</Code>

        <H3>{L({ pt: 'Histórico', en: 'History' })}</H3>
        <Code lang="bash">{`curl "${API}/topics/history?topic=Tupinix/BRPlant02/Utilities/CoolingTower/AT2101&hours=24" \\
  -H "Authorization: Bearer $TOKEN"`}</Code>
      </Section>

      <Section id="outros" title={L({ pt: '3. Outros recursos', en: '3. Other resources' })}>
        <p>{L({ pt: 'Os mesmos padrões (Bearer + JSON) valem para o resto da plataforma:', en: 'The same patterns (Bearer + JSON) apply to the rest of the platform:' })}</p>
        <ul className="ml-5 list-disc space-y-1">
          <li><K>/brokers</K> — {L({ pt: 'listar, criar, conectar brokers.', en: 'list, create, connect brokers.' })}</li>
          <li><K>/opcua</K>, <K>/modbus</K>, <K>/ethip</K> — {L({ pt: 'conexões e valores dos gateways.', en: 'gateway connections and values.' })}</li>
          <li><K>/dashboards</K> — {L({ pt: 'telas de processo.', en: 'process screens.' })}</li>
          <li><K>/alerts</K> — {L({ pt: 'regras de alerta.', en: 'alert rules.' })}</li>
          <li><K>/ai</K> — {L({ pt: 'gerar dashboards, Organization Data e Insight.', en: 'generate dashboards, Organization Data and Insight.' })}</li>
          <li><K>/hierarchy</K> — {L({ pt: 'a hierarquia ISA-95.', en: 'the ISA-95 hierarchy.' })}</li>
        </ul>
        <p>{L({ pt: 'Consulte o Swagger em', en: 'See the Swagger at' })} <K>{`${API}/docs`}</K> {L({ pt: 'para o contrato completo de cada um.', en: 'for the full contract of each.' })}</p>
      </Section>

      <Section id="exemplo" title={L({ pt: 'Exemplo: um leitor em Python', en: 'Example: a reader in Python' })}>
        <Code lang="python">{`import requests

BASE = "${API}"
s = requests.Session()

# login
r = s.post(f"{BASE}/auth/login", json={"email": "you@company.com", "password": "your-password"})
token = r.json()["data"]["token"]
s.headers["Authorization"] = f"Bearer {token}"

# value of a tag
topic = "Tupinix/BRPlant02/Utilities/CoolingTower/AT2101"
val = s.get(f"{BASE}/topics/details", params={"topic": topic}).json()
print(val["data"])`}</Code>
      </Section>
    </>
  );
}

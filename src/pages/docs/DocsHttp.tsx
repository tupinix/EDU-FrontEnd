import { DocTitle, Section, Code, Callout, H3, K } from './DocsUI';

const API = 'https://api.espacodedadosunificado.com.br/api';

export function DocsHttp() {
  return (
    <>
      <DocTitle
        eyebrow="Integração"
        title="Integração via HTTP (REST)"
        intro="Toda a plataforma é acessível por uma API REST com autenticação por token. Consuma a UNS, os brokers, os dashboards e a IA a partir de qualquer sistema."
      />

      <Section id="base" title="Base e referência">
        <p>A base da API é <K>{API}</K> (no EDU Edge, <K>http://localhost:8080/api</K>). A referência completa e interativa (Swagger / OpenAPI) fica em:</p>
        <Code>{`${API}/docs`}</Code>
        <Callout>Todas as respostas seguem o formato <K>{'{ success, data, error, timestamp }'}</K>. Um <K>success:false</K> traz o motivo em <K>error</K>.</Callout>
      </Section>

      <Section id="auth" title="1. Autenticação">
        <p>Faça login com e-mail e senha. A resposta traz um token <K>Bearer</K> (JWT) que você envia no cabeçalho <K>Authorization</K> das próximas chamadas.</p>
        <Code lang="bash">{`curl -X POST ${API}/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"voce@empresa.com","password":"sua-senha"}'`}</Code>
        <p>Resposta:</p>
        <Code lang="json">{`{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJI...",
    "user": { "email": "voce@empresa.com", "role": "admin", "tenant": { ... } }
  }
}`}</Code>
        <Callout tone="tip">Guarde o token e reutilize-o. Ele expira em 24h, refaça o login para renovar.</Callout>
      </Section>

      <Section id="topics" title="2. Ler a UNS">
        <H3>Listar todos os tópicos</H3>
        <Code lang="bash">{`TOKEN="eyJhbGciOiJI..."
curl ${API}/topics/list -H "Authorization: Bearer $TOKEN"`}</Code>

        <H3>Valor atual de um tópico</H3>
        <Code lang="bash">{`curl "${API}/topics/details?topic=Tupinix/BRPlant02/Utilities/CoolingTower/AT2101" \\
  -H "Authorization: Bearer $TOKEN"`}</Code>

        <H3>Histórico</H3>
        <Code lang="bash">{`curl "${API}/topics/history?topic=Tupinix/BRPlant02/Utilities/CoolingTower/AT2101&hours=24" \\
  -H "Authorization: Bearer $TOKEN"`}</Code>
      </Section>

      <Section id="outros" title="3. Outros recursos">
        <p>Os mesmos padrões (Bearer + JSON) valem para o resto da plataforma:</p>
        <ul className="ml-5 list-disc space-y-1">
          <li><K>/brokers</K> — listar, criar, conectar brokers.</li>
          <li><K>/opcua</K>, <K>/modbus</K>, <K>/ethip</K> — conexões e valores dos gateways.</li>
          <li><K>/dashboards</K> — telas de processo.</li>
          <li><K>/alerts</K> — regras de alerta.</li>
          <li><K>/ai</K> — gerar dashboards, Organization Data e Insight.</li>
          <li><K>/hierarchy</K> — a hierarquia ISA-95.</li>
        </ul>
        <p>Consulte o Swagger em <K>{`${API}/docs`}</K> para o contrato completo de cada um.</p>
      </Section>

      <Section id="exemplo" title="Exemplo: um leitor em Python">
        <Code lang="python">{`import requests

BASE = "${API}"
s = requests.Session()

# login
r = s.post(f"{BASE}/auth/login", json={"email": "voce@empresa.com", "password": "sua-senha"})
token = r.json()["data"]["token"]
s.headers["Authorization"] = f"Bearer {token}"

# valor de uma tag
topic = "Tupinix/BRPlant02/Utilities/CoolingTower/AT2101"
val = s.get(f"{BASE}/topics/details", params={"topic": topic}).json()
print(val["data"])`}</Code>
      </Section>
    </>
  );
}

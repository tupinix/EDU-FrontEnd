# EDU Frontend

Aplicação React SPA para visualização do Unified Namespace.

## Requisitos

- Node.js 20+
- npm ou yarn

## Instalação

```bash
# Instalar dependências
npm install
```

## Variáveis de Ambiente

Crie um arquivo `.env` na raiz (opcional):

```env
# URL da API (padrão: /api via proxy)
VITE_API_URL=http://localhost:3000/api
```

## Executar

### Desenvolvimento (com hot-reload)

```bash
npm run dev
```

Acesse: http://localhost:5173

### Build de Produção

```bash
npm run build
npm run preview
```

### Docker

```bash
docker build -t edu-frontend .
docker run -p 80:80 edu-frontend
```

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run preview` | Preview do build |
| `npm run lint` | Verifica código com ESLint |
| `npm test` | Executa testes |

## Estrutura

```
frontend/
├── src/
│   ├── main.tsx              # Entry point
│   ├── App.tsx               # Router principal
│   ├── types/                # TypeScript types
│   ├── styles/               # CSS/Tailwind
│   ├── services/
│   │   └── api.ts            # Cliente API (axios)
│   ├── hooks/
│   │   ├── useMetrics.ts     # Hooks de métricas
│   │   ├── useTopics.ts      # Hooks de tópicos
│   │   └── useStore.ts       # Zustand stores
│   ├── components/
│   │   ├── Layout/           # Sidebar, Header
│   │   ├── Dashboard/        # Componentes dashboard
│   │   └── Explorer/         # Componentes explorer
│   └── pages/
│       ├── Dashboard.tsx     # Página inicial
│       ├── Explorer.tsx      # Navegador de tópicos
│       ├── Configuration.tsx # Configuração ISA-95
│       └── About.tsx         # Sobre o projeto
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── nginx.conf                # Config nginx para Docker
└── Dockerfile
```

## Páginas

### Dashboard (`/`)
- Status do broker MQTT
- Métricas de mensagens (dia/minuto)
- Total de tópicos
- Status dos conectores (Neo4j, TimescaleDB)
- Tópicos mais ativos

### Explorer (`/explorer`)
- Árvore navegável de tópicos MQTT
- Busca de tópicos
- Visualização de payload (JSON tree/raw)
- Histórico de mensagens
- Metadados do tópico

### Configuration (`/configuration`)
- Visualização da hierarquia ISA-95
- Gerenciamento de mapeamentos topic → hierarchy
- Associação de tópicos a equipamentos

### About (`/about`)
- Informações do projeto
- Stack tecnológico
- Arquitetura
- Links de referência

## Tecnologias

- **React 18** - UI Library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **React Router** - Routing
- **React Query** - Data fetching/caching
- **Zustand** - State management
- **Axios** - HTTP client
- **Recharts** - Charts
- **Lucide React** - Icons
- **date-fns** - Date formatting

## Proxy de Desenvolvimento

O `vite.config.ts` está configurado para proxy das requisições `/api` para `http://localhost:3000`:

```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
    },
  },
}
```

Isso permite desenvolver frontend e backend separadamente sem CORS issues.

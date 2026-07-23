# CLAUDE.md — AGRO TUR

Plataforma mobile-first para gestão e descoberta de experiências rurais, reservas, produtos agrícolas e áreas GIS.

## Stack Técnico

| Camada | Tecnologia |
|--------|-----------|
| **Frontend** | React 18 + Vite + Tailwind CSS + shadcn/ui |
| **Backend** | Node.js + Express |
| **Base de Dados** | PostgreSQL + Prisma ORM |
| **Deploy** | Docker + Docker Compose |
| **Autenticação** | JWT (server) |

## Estrutura do Projeto

```
fazenda/
├── client/              ← Frontend React (Vite)
│   ├── src/
│   │   ├── components/  ← Componentes reutilizáveis
│   │   ├── pages/       ← Páginas principais
│   │   ├── lib/         ← Utilitários (API client, demo-data)
│   │   └── styles.css   ← Tailwind CSS
│   ├── Dockerfile       ← Build e serve com Nginx
│   └── nginx.conf       ← Proxy reverso
│
├── server/              ← Backend Node.js + Express
│   ├── src/
│   │   ├── routes/      ← Rotas de API (auth, experiences, bookings, etc)
│   │   ├── middleware/  ← Autenticação JWT
│   │   └── db.js        ← Inicialização Prisma
│   ├── prisma/
│   │   ├── schema.prisma  ← Schema da base de dados
│   │   ├── migrations/    ← Migrações automáticas
│   │   └── seed.js        ← Seeds iniciais
│   ├── Dockerfile         ← Container Node
│   └── docker-entrypoint.sh ← Inicialização (migrations + seed)
│
├── docker-compose.yml   ← Orquestração local (client, server, postgres)
├── .dockerignore         ← Otimizar Docker builds
├── .env.example          ← Variáveis de ambiente
└── README.md              ← Documentação pública
```

## Variáveis de Ambiente

Copia `.env.example` para `server/.env`:

```bash
DATABASE_URL=postgresql://user:password@postgres:5432/agrotur
NODE_ENV=development
JWT_SECRET=seu-secret-jwt
OPENAI_API_KEY=sk-... (opcional, chatbot funciona offline)
```

## Desenvolvimento Local

### Via Docker Compose (recomendado)

```bash
docker-compose up --build
# Frontend: http://localhost:5173
# API: http://localhost:3333/api
# PostgreSQL: localhost:5432
```

### Via npm directo

```bash
# 1. Setup inicial
cp .env.example server/.env
npm install

# 2. Preparar base de dados
npm run db:generate
npm run db:migrate
npm run db:seed

# 3. Correr em desenvolvimento
npm run dev
# Frontend: http://localhost:5173
# API: http://localhost:3333/api
```

## Utilizador Inicial (seed)

Email: `admin@agrotur.ao`  
Senha: `AgroTur@2026`

## Convenções de Código

- **Linguagem UI**: Português (PT)
- **Identificadores técnicos**: Inglês (variáveis, funções, types)
- **Componentes React**: Funcionais, hooks, sem class components
- **Estado**: TanStack Query (servidor) + Context (local) conforme necessário
- **Estilos**: Tailwind CSS + shadcn/ui, sem CSS custom a não ser que imprescindível
- **Async**: async/await, nunca `.then()/.catch()`
- **TypeScript**: Strict mode sempre ativo

## Rotas de API

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/api/auth/register` | Registar novo utilizador |
| `POST` | `/api/auth/login` | Login |
| `GET` | `/api/experiences` | Listar todas as experiências |
| `POST` | `/api/experiences` | Criar experiência (admin) |
| `GET` | `/api/products` | Listar produtos |
| `GET` | `/api/areas` | Listar áreas GIS |
| `POST` | `/api/bookings` | Criar reserva |
| `GET` | `/api/chatbot` | Chat com IA (integração OpenAI ou local) |
| `GET` | `/api/dashboard` | Dados do dashboard (admin) |

## Git Workflow

```bash
# Sempre trabalhar no branch dev
git checkout dev

# Fazer commits em português (Conventional Commits)
git commit -m "feat: descrição da feature"
git commit -m "fix: descrição do bug"
git commit -m "chore: tarefas de manutenção"

# Fazer push
git push origin dev

# Para produção (main) — apenas via merge deliberado
git checkout main
git merge dev
git push origin main
git checkout dev
```

## Permissões e Modificações

**Pode modificar:**
- `client/src/` — frontend
- `server/src/` — backend
- `server/prisma/schema.prisma` — schema (com cuidado)
- Ficheiros de configuração do projeto

**Não modificar:**
- `.git/`, `node_modules/`
- Migrações já deployadas (criar nova em vez de editar)
- `.env` ou `.env.local` (só `.env.example`)

## Chatbot

O chatbot tem dois modos:

1. **Com OpenAI** (se `OPENAI_API_KEY` definida)
   - Respostas geradas por IA baseadas em experiências/produtos da base de dados

2. **Offline** (sem chave)
   - Respostas determinísticas baseadas em dados de demonstração

Ambos os modos retornam sempre experiências e produtos relevantes do sistema.

## Dicas

- Frontend acede a API via `client/src/lib/api.js`
- Dados de demonstração em `client/src/lib/demo-data.js` — usado quando API ainda não tem dados
- Mapa público (`/`) mostra dados reais + demo conforme disponibilidade
- Admin dashboard (`/dashboard`) requer login com `admin@agrotur.ao`

## Próximos Passos

- [ ] Implementar upload de imagens para experiências/produtos
- [ ] Adicionar geolocalização ao mapa
- [ ] Integração pagamento (reservas)
- [ ] Notificações email (confirmação de reserva)
- [ ] Analytics (Posthog ou similar)
- [ ] Tests E2E (Playwright)

---

**Última atualização:** 2026-07-23

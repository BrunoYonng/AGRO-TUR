# AGRO TUR

Plataforma mobile-first para gestão e descoberta de experiências rurais, reservas,
produtos agrícolas e áreas GIS.

Para configuração completa, onboarding e troubleshooting, consulte
[COMO_RODAR.md](./COMO_RODAR.md).

## Executar

1. Copie `.env.example` para `server/.env` e ajuste o PostgreSQL.
2. Instale e prepare a base:

```bash
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Frontend: `http://localhost:5173`  
API: `http://localhost:3333/api`

Utilizador inicial do seed: `admin@agrotur.ao` / `AgroTur@2026`.

Sem `OPENAI_API_KEY`, o chatbot continua operacional com respostas locais baseadas
nas experiências cadastradas. O mapa público também inclui dados de demonstração
quando a API ainda não estiver ligada.

## Executar com Docker

O Docker Compose inicia PostgreSQL, API e frontend. A API aplica as migrações e
carrega o seed idempotente antes de aceitar pedidos.

```bash
cp .env.example .env
docker compose up --build -d
docker compose ps
```

A aplicação fica disponível em `http://localhost:8080`.

Comandos úteis:

```bash
# Acompanhar os serviços
docker compose logs -f

# Reexecutar o seed
docker compose exec backend npm run db:seed

# Parar sem apagar os dados
docker compose down

# Parar e apagar também o volume PostgreSQL
docker compose down -v
```

Antes de publicar, altere `JWT_SECRET` e `POSTGRES_PASSWORD` no `.env` e ajuste
`CLIENT_URL` para o domínio público.

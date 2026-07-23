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

Perfis de demonstração criados pelo seed:

| Perfil | Email | Palavra-passe |
| --- | --- | --- |
| Gestor | `gestor@agrotur.ao` | `Gestor@2026` |
| Fazendeiro | `fazendeiro@agrotur.ao` | `Fazenda@2026` |
| Visitante | `visitante@agrotur.ao` | `Visitante@2026` |

O gestor controla indicadores, faturamento e reservas. O fazendeiro mantém
experiências, produtos, estoque e áreas GIS. Cada perfil possui painel, menus e
permissões de API próprios. Novos registos feitos por `/api/auth/register` recebem
sempre o perfil seguro `TOURIST`.

A área do visitante está disponível em `/conta` e inclui criação de conta, perfil,
reservas associadas ao email, próxima visita e recomendações de fazendas.

Os chats são separados por contexto e permissão:

- visitante: serviços, produtos, experiências, preços e recomendações;
- gestor: reservas, faturamento, ocupação e indicadores;
- fazendeiro: agenda, experiências, estoque, produtos e áreas GIS.

Os contextos internos exigem JWT e o perfil correspondente; não dependem apenas
da interface para proteger os dados.

O chatbot suporta Gemini, Groq e OpenAI, com fallback automático entre providers.
Sem nenhuma chave configurada, continua operacional com respostas locais baseadas
nas experiências cadastradas. O mapa público também inclui dados de demonstração
quando a API ainda não estiver ligada.

No frontend, o assistente funciona como motor de recomendação e possui módulos de
descoberta, mapa e território, ecologia e sustentabilidade, preços e ofertas, e
lazer e conforto. Recomendações geográficas podem abrir diretamente o ponto,
polígono ou fazenda correspondente no mapa.

O catálogo `/fazendas` compara lugares por proximidade, preço, sustentabilidade e
conforto. A localização do visitante é opcional e só é solicitada após uma ação
explícita no navegador.

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

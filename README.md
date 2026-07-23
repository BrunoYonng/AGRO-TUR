# AGRO TUR

Plataforma mobile-first para gestão e descoberta de experiências rurais, reservas,
produtos agrícolas e áreas GIS.

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

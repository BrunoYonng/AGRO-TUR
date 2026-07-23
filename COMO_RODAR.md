# Como rodar o AGRO TUR

Este documento contém o procedimento de configuração e execução do projeto para
ambientes de desenvolvimento.

## 1. Visão geral

O projeto é composto por:

- `client`: React, Vite, TailwindCSS e React-Leaflet;
- `server`: Node.js, Express, Prisma e autenticação JWT;
- `db`: PostgreSQL;
- `frontend` em Docker: build estático servido pelo Nginx;
- `backend` em Docker: aplica migrações e inicia a API automaticamente.

## 2. Pré-requisitos

### Execução com Docker — recomendada

- Docker Desktop ou Docker Engine;
- Docker Compose v2 ou superior;
- portas `8080` livres na máquina.

Verifique a instalação:

```bash
docker --version
docker compose version
```

### Execução local

- Node.js 20 ou superior;
- npm 10 ou superior;
- PostgreSQL 15 ou superior;
- portas `5173` e `3333` livres.

Verifique a instalação:

```bash
node --version
npm --version
psql --version
```

## 3. Variáveis de ambiente

O arquivo de referência é `.env.example`. Nunca grave credenciais reais no
repositório.

Variáveis importantes:

| Variável | Descrição |
| --- | --- |
| `DATABASE_URL` | Ligação PostgreSQL usada pelo Prisma na execução local |
| `JWT_SECRET` | Chave usada para assinar tokens de autenticação |
| `CLIENT_URL` | Origem autorizada pelo CORS |
| `OPENAI_API_KEY` | Opcional; ativa as respostas OpenAI no chatbot |
| `OPENAI_MODEL` | Modelo usado pelo chatbot |
| `WHATSAPP_NUMBER` | Número associado às pré-reservas |
| `APP_PORT` | Porta pública do frontend em Docker |
| `POSTGRES_DB` | Nome da base criada pelo Compose |
| `POSTGRES_USER` | Utilizador PostgreSQL do Compose |
| `POSTGRES_PASSWORD` | Palavra-passe PostgreSQL do Compose |
| `SEED_DATABASE` | Executa o seed durante a inicialização do backend |

Antes de usar o projeto em produção, defina valores fortes para
`JWT_SECRET` e `POSTGRES_PASSWORD`.

## 4. Rodar com Docker Compose

Este é o caminho recomendado porque cria o PostgreSQL, aplica as migrações,
executa o seed e inicia frontend e backend numa única operação.

### 4.1 Preparar o ambiente

Na raiz do projeto:

#### Linux ou macOS

```bash
cp .env.example .env
```

#### Windows PowerShell

```powershell
Copy-Item .env.example .env
```

Edite o `.env` e altere pelo menos:

```dotenv
JWT_SECRET="uma-chave-longa-e-aleatoria"
POSTGRES_PASSWORD="uma-palavra-passe-segura"
```

`OPENAI_API_KEY` pode ficar vazio. Nesse caso, o chatbot utiliza o mecanismo
local baseado nas experiências cadastradas.

### 4.2 Construir e iniciar

```bash
docker compose up --build -d
```

Verifique o estado:

```bash
docker compose ps
```

Os serviços devem aparecer como `healthy`.

### 4.3 Acessar

| Serviço | Endereço |
| --- | --- |
| Aplicação | http://localhost:8080 |
| Healthcheck da API | http://localhost:8080/api/health |
| Login administrativo | http://localhost:8080/dashboard |

Credenciais iniciais criadas pelo seed:

```text
Email: admin@agrotur.ao
Palavra-passe: AgroTur@2026
```

Altere estas credenciais antes de disponibilizar o sistema publicamente.

### 4.4 Ver logs

Todos os serviços:

```bash
docker compose logs -f
```

Apenas o backend:

```bash
docker compose logs -f backend
```

Apenas o PostgreSQL:

```bash
docker compose logs -f db
```

### 4.5 Parar

Parar os containers e preservar a base:

```bash
docker compose down
```

Parar e apagar também os dados PostgreSQL:

```bash
docker compose down -v
```

O segundo comando é destrutivo e deve ser usado apenas quando a perda dos dados
locais for aceitável.

## 5. Rodar localmente

### 5.1 Instalar dependências

Na raiz:

```bash
npm install
```

### 5.2 Configurar o backend

#### Linux ou macOS

```bash
cp .env.example server/.env
```

#### Windows PowerShell

```powershell
Copy-Item .env.example server/.env
```

No `server/.env`, use uma ligação PostgreSQL acessível a partir da máquina:

```dotenv
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/agrotur?schema=public"
JWT_SECRET="uma-chave-longa-e-aleatoria"
PORT=3333
CLIENT_URL="http://localhost:5173"
OPENAI_API_KEY=""
OPENAI_MODEL="gpt-5.6-luna"
WHATSAPP_NUMBER="244923000000"
```

Crie previamente a base `agrotur` no PostgreSQL, caso ela ainda não exista.

### 5.3 Preparar a base

Gerar o Prisma Client:

```bash
npm run db:generate
```

Aplicar as migrações:

```bash
npm run db:migrate
```

Carregar os dados iniciais:

```bash
npm run db:seed
```

### 5.4 Iniciar frontend e backend

```bash
npm run dev
```

Endereços locais:

| Serviço | Endereço |
| --- | --- |
| Frontend Vite | http://localhost:5173 |
| API Express | http://localhost:3333/api |
| Healthcheck | http://localhost:3333/api/health |

## 6. Comandos de desenvolvimento

```bash
# Frontend e backend
npm run dev

# Build de produção do frontend
npm run build

# Gerar o Prisma Client
npm run db:generate

# Criar/aplicar uma migração durante o desenvolvimento
npm run db:migrate

# Executar o seed
npm run db:seed
```

Comandos dentro dos containers:

```bash
# Reexecutar o seed
docker compose exec backend npm run db:seed

# Consultar o estado das migrações
docker compose exec backend npx prisma migrate status

# Abrir um terminal no backend
docker compose exec backend sh

# Abrir o cliente PostgreSQL
docker compose exec db psql -U agrotur -d agrotur
```

## 7. Validar a instalação

### Healthcheck

#### Linux ou macOS

```bash
curl http://localhost:8080/api/health
```

#### Windows PowerShell

```powershell
Invoke-RestMethod http://localhost:8080/api/health
```

Resposta esperada:

```json
{
  "ok": true,
  "service": "AGRO TUR API"
}
```

### Catálogo público

```bash
curl http://localhost:8080/api/experiences
```

Após o seed, a resposta deve conter três experiências.

## 8. Migrações Prisma

Ao alterar `server/prisma/schema.prisma`:

1. Execute o PostgreSQL local ou o serviço `db`.
2. Crie a migração:

```bash
npm run db:migrate
```

3. Confirme que uma nova pasta foi criada em `server/prisma/migrations`.
4. Inclua a migração no commit.
5. Reconstrua o backend:

```bash
docker compose up --build -d backend
```

Na inicialização, o container executa `prisma migrate deploy`; ele não cria
migrações automaticamente em produção.

## 9. Problemas frequentes

### Docker não consegue ligar ao daemon

Mensagem comum:

```text
failed to connect to the docker API
```

Inicie o Docker Desktop ou o serviço Docker e repita:

```bash
docker compose up --build -d
```

### Porta 8080 ocupada

Altere `APP_PORT` no `.env`:

```dotenv
APP_PORT=8081
CLIENT_URL="http://localhost:8081"
```

Depois recrie a stack:

```bash
docker compose up -d --force-recreate
```

### Backend não fica saudável

Consulte:

```bash
docker compose logs backend
docker compose logs db
```

Confirme se `POSTGRES_USER`, `POSTGRES_PASSWORD` e `POSTGRES_DB` são consistentes.

Se as credenciais do PostgreSQL forem alteradas depois que o volume já tiver
sido criado, o banco existente continuará com as credenciais antigas. Em um
ambiente local descartável, recrie o volume:

```bash
docker compose down -v
docker compose up --build -d
```

Esse procedimento apaga os dados locais.

### Chatbot responde em modo local

Confirme se `OPENAI_API_KEY` está definida no `.env` e recrie o backend:

```bash
docker compose up -d --force-recreate backend
```

Nunca envie ou grave a chave da API em commits, logs ou mensagens.

### Alterações do frontend não aparecem no Docker

O frontend Docker é um build estático. Reconstrua:

```bash
docker compose up --build -d frontend
```

Para desenvolvimento com atualização automática, prefira `npm run dev`.

## 10. Estrutura relevante

```text
.
├── client/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── src/
├── server/
│   ├── Dockerfile
│   ├── docker-entrypoint.sh
│   ├── prisma/
│   │   ├── migrations/
│   │   ├── schema.prisma
│   │   └── seed.js
│   └── src/
├── .dockerignore
├── .env.example
├── docker-compose.yml
└── package.json
```

## 11. Checklist antes de abrir um pull request

- `npm run build` termina sem erros;
- novas alterações no schema possuem uma migração;
- nenhuma credencial foi adicionada ao Git;
- frontend e backend iniciam com `docker compose up --build -d`;
- `docker compose ps` mostra todos os serviços como saudáveis;
- `/api/health` responde com `ok: true`;
- login, catálogo e mapa continuam operacionais.

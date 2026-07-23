#!/bin/sh
set -eu

echo "A aplicar migrações da base de dados..."
npm run db:deploy

if [ "${SEED_DATABASE:-false}" = "true" ]; then
  echo "A garantir os dados iniciais..."
  npm run db:seed
fi

echo "A iniciar a API AGRO TUR..."
exec node src/index.js

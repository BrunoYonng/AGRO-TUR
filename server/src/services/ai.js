import OpenAI from "openai";

const SUPPORTED_PROVIDERS = ["gemini", "groq", "openai"];

export const CHAT_MODULES = {
  management: {
    label: "Gestão geral",
    instruction: "Analisa indicadores operacionais e ajuda o gestor a priorizar decisões.",
    suggestions: ["Resume a operação deste mês", "O que precisa de atenção?", "Como está a ocupação?"],
  },
  booking_ops: {
    label: "Gestão de reservas",
    instruction: "Analisa volume, estados e próximas reservas sem inventar dados.",
    suggestions: ["Quantas reservas estão pendentes?", "Resume as últimas reservas", "Que reservas exigem ação?"],
  },
  finance: {
    label: "Financeiro",
    instruction: "Explica faturamento e desempenho comercial apenas com os indicadores fornecidos.",
    suggestions: ["Qual é o faturamento do mês?", "Qual produto vende mais?", "Resume o desempenho comercial"],
  },
  farm_ops: {
    label: "Operação da fazenda",
    instruction: "Ajuda o fazendeiro a organizar atividades, áreas e recursos da fazenda.",
    suggestions: ["Resume a operação da fazenda", "Que atividade acontece primeiro?", "Que área precisa de atenção?"],
  },
  catalog_ops: {
    label: "Experiências",
    instruction: "Ajuda a gerir agenda, capacidade e conteúdo das experiências cadastradas.",
    suggestions: ["Lista as próximas experiências", "Qual atividade tem mais vagas?", "Compara capacidades"],
  },
  inventory: {
    label: "Estoque e produtos",
    instruction: "Analisa produtos, estoque e vendas e sinaliza níveis baixos.",
    suggestions: ["Quais produtos têm estoque baixo?", "Qual produto vende mais?", "Resume o estoque"],
  },
  gis_ops: {
    label: "Mapa GIS",
    instruction: "Ajuda a interpretar e organizar áreas, tipos e descrições do mapa da fazenda.",
    suggestions: ["Lista as áreas GIS", "Que zonas estão mapeadas?", "Resume a área de plantação"],
  },
  discovery: {
    label: "Descobrir fazendas",
    instruction:
      "Age como motor de recomendação. Compara as fazendas por proximidade, preço inicial, perfil, conforto e sustentabilidade. Explica em uma frase por que cada sugestão combina com o visitante.",
    suggestions: ["Quais fazendas estão perto de mim?", "Quero a opção mais económica", "Recomenda uma fazenda sustentável"],
  },
  general: {
    label: "Assistente geral",
    instruction:
      "Ajuda a escolher a experiência mais adequada combinando data, grupo, interesses e disponibilidade.",
    suggestions: ["O que recomenda para este fim de semana?", "Somos 4 pessoas", "Quero conhecer a fazenda"],
  },
  map: {
    label: "Mapa e território",
    instruction:
      "Age como guia geográfico da fazenda. Explica localização, proximidade, organização espacial, áreas e pontos de interesse usando apenas o contexto GIS fornecido.",
    suggestions: ["Onde fica o lago?", "Mostra a horta no mapa", "Que áreas posso visitar?"],
  },
  sustainability: {
    label: "Ecologia e sustentabilidade",
    instruction:
      "Explica práticas ecológicas, uso responsável do território, biodiversidade, solo, água e relação entre agricultura e ambiente. Não inventes certificações nem práticas ausentes do contexto.",
    suggestions: ["Como cuidam do solo?", "Há atividades sobre biodiversidade?", "Como usam a água?"],
  },
  offers: {
    label: "Preços e ofertas",
    instruction:
      "Compara preços, duração, vagas e custo por visitante. Recomenda o melhor valor disponível, mas nunca inventes descontos, promoções ou preços não cadastrados.",
    suggestions: ["Qual é a opção mais económica?", "Compara os preços", "Melhor opção para 4 pessoas"],
  },
  leisure: {
    label: "Lazer e conforto",
    instruction:
      "Recomenda experiências considerando ritmo, duração, alimentação, natureza, crianças, descanso e conforto. Usa apenas características existentes nas descrições e no mapa.",
    suggestions: ["O que fazer com crianças?", "Quero uma visita tranquila", "Qual experiência é mais curta?"],
  },
};

export const CHAT_SCOPES = {
  tourist: {
    label: "Assistente do visitante",
    modules: ["discovery", "general", "map", "sustainability", "offers", "leisure"],
    instruction:
      "Responde apenas sobre serviços, produtos, experiências, preços, vagas, localização, pré-reservas e recomendações ao visitante. Não reveles dados internos de gestão, faturamento global, estoque interno ou dados de outros clientes. Se a pergunta for administrativa, explica que deve ser feita na área da equipa.",
  },
  manager: {
    label: "Copiloto de gestão",
    modules: ["management", "booking_ops", "finance"],
    instruction:
      "Responde apenas sobre gestão: indicadores, faturamento, ocupação, reservas, desempenho e prioridades operacionais. Não ages como guia turístico nem ofereces recomendações de lazer. Usa somente o contexto interno autorizado.",
  },
  farmer: {
    label: "Assistente da fazenda",
    modules: ["farm_ops", "catalog_ops", "inventory", "gis_ops"],
    instruction:
      "Responde apenas sobre a operação da fazenda: experiências, agenda, capacidade, produtos, estoque, áreas GIS, cultivo, animais e recursos. Não aproves reservas, não exponhas dados pessoais de visitantes e não forneças indicadores financeiros de gestão.",
  },
};

function getTimeout() {
  const timeout = Number(process.env.AI_TIMEOUT_MS);
  return Number.isFinite(timeout) && timeout >= 1000 ? timeout : 12_000;
}

function getProviderConfig(name) {
  const configs = {
    gemini: {
      apiKey: process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY,
      model: process.env.GOOGLE_MODEL || process.env.GEMINI_MODEL || "gemini-2.5-flash",
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    },
    groq: {
      apiKey: process.env.GROQ_API_KEY,
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      baseURL: "https://api.groq.com/openai/v1",
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || "gpt-5.6-luna",
    },
  };
  return configs[name];
}

export function getConfiguredProviders() {
  return SUPPORTED_PROVIDERS.map((name) => {
    const config = getProviderConfig(name);
    return { name, configured: Boolean(config.apiKey), model: config.model };
  });
}

function getProviderOrder() {
  const requested = (process.env.AI_PROVIDER_ORDER || "gemini,groq,openai")
    .split(",")
    .map((name) => name.trim().toLowerCase())
    .filter((name) => SUPPORTED_PROVIDERS.includes(name));
  return [...new Set([...requested, ...SUPPORTED_PROVIDERS])];
}

function buildMessages({
  catalog,
  farmAreas,
  farms,
  history,
  location,
  managementContext,
  message,
  module,
  points,
  products,
  scope,
}) {
  const selectedModule = CHAT_MODULES[module] || CHAT_MODULES.general;
  const selectedScope = CHAT_SCOPES[scope] || CHAT_SCOPES.tourist;
  const systemPrompt = [
    "És o assistente oficial da AGRO TUR, uma plataforma de agroturismo em Angola.",
    "Responde sempre em português claro, caloroso e conciso, com no máximo 140 palavras.",
    `Âmbito obrigatório: ${selectedScope.label}. ${selectedScope.instruction}`,
    "Se uma pergunta estiver fora do âmbito, não a respondas parcialmente: indica em uma frase qual é o canal correto e oferece ajuda dentro do teu âmbito.",
    "Usa exclusivamente o catálogo fornecido; nunca inventes experiências, preços, datas ou vagas.",
    "Quando houver data ou número de pessoas, compara com availableSeats e sugere no máximo 2 opções compatíveis.",
    "Se não houver vagas suficientes, explica isso e sugere a alternativa mais próxima.",
    "Nunca confirmes uma reserva. Chama ao processo 'pré-reserva' e encaminha a conclusão para o WhatsApp.",
    "Quando faltarem dados, pede apenas os essenciais: data, número de pessoas e contacto.",
    "Nos dados geográficos, position usa [latitude, longitude] e coordenadas GeoJSON usam [longitude, latitude].",
    "Quando existirem fazendas recomendadas, apresenta no máximo 3, ordenadas como recebidas, e justifica a escolha com recommendationReason.",
    "Não afirmes que conheces a localização do visitante quando location for null.",
    `Módulo ativo: ${selectedModule.label}. ${selectedModule.instruction}`,
    `Data atual: ${new Date().toISOString().slice(0, 10)}.`,
  ].join(" ");

  const historyText = history.length
    ? history
        .map((entry) => `Visitante: ${entry.message}\nAGRO TUR: ${entry.response}`)
        .join("\n\n")
    : "Sem histórico anterior.";

  return [
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: [
        `CATÁLOGO ATUAL:\n${JSON.stringify(catalog)}`,
        `PRODUTOS E ESTOQUE AUTORIZADOS:\n${JSON.stringify(products)}`,
        `CONTEXTO DE GESTÃO AUTORIZADO:\n${JSON.stringify(managementContext)}`,
        `FAZENDAS RECOMENDADAS:\n${JSON.stringify(farms)}`,
        `LOCALIZAÇÃO CONSENTIDA DO VISITANTE:\n${JSON.stringify(location)}`,
        `ÁREAS GIS DA FAZENDA:\n${JSON.stringify(farmAreas)}`,
        `PONTOS DE INTERESSE:\n${JSON.stringify(points)}`,
        `HISTÓRICO RECENTE:\n${historyText}`,
        `MENSAGEM ATUAL:\n${message}`,
      ].join("\n\n"),
    },
  ];
}

async function callCompatibleProvider(name, config, messages) {
  const client = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
    timeout: getTimeout(),
    maxRetries: 1,
  });
  const response = await client.chat.completions.create({
    model: config.model,
    messages,
    temperature: 0.35,
    max_tokens: 420,
  });
  return response.choices?.[0]?.message?.content?.trim();
}

async function callOpenAI(config, messages) {
  const client = new OpenAI({
    apiKey: config.apiKey,
    timeout: getTimeout(),
    maxRetries: 1,
  });
  const response = await client.responses.create({
    model: config.model,
    input: messages,
    max_output_tokens: 420,
  });
  return response.output_text?.trim();
}

export async function generateAIReply(input) {
  const messages = buildMessages(input);
  const failures = [];

  for (const name of getProviderOrder()) {
    const config = getProviderConfig(name);
    if (!config.apiKey) continue;

    try {
      const answer =
        name === "openai"
          ? await callOpenAI(config, messages)
          : await callCompatibleProvider(name, config, messages);
      if (answer) return { answer, provider: name, model: config.model, failures };
      failures.push({ provider: name, reason: "empty_response" });
    } catch (error) {
      const reason = error?.status ? `http_${error.status}` : error?.code || "request_failed";
      failures.push({ provider: name, reason });
      console.warn(`[chatbot] Provider ${name} indisponível: ${reason}`);
    }
  }

  return { answer: null, provider: "local", model: "catalog-rules", failures };
}

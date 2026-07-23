import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { prisma } from "../db.js";
import {
  CHAT_MODULES,
  generateAIReply,
  getConfiguredProviders,
} from "../services/ai.js";
import { recommendFarms } from "../data/farms.js";

export const chatbotRouter = Router();

chatbotRouter.use(rateLimit({ windowMs: 60_000, limit: 20 }));

const farmPoints = [
  {
    id: "curral",
    name: "Curral",
    type: "ANIMALS",
    description: "Cavalos e rotina acompanhada dos animais.",
    position: [-14.8902, 13.4992],
    aliases: ["cavalo", "cavalos", "animais"],
  },
  {
    id: "horta",
    name: "Horta",
    type: "PLANTATION",
    description: "Hortaliças, ervas aromáticas e colheita guiada.",
    position: [-14.8896, 13.4943],
    aliases: ["plantação", "plantacao", "cultivo", "solo"],
  },
  {
    id: "lago",
    name: "Lago",
    type: "LEISURE",
    description: "Observação de aves, percurso tranquilo e piqueniques.",
    position: [-14.8941, 13.4938],
    aliases: ["água", "agua", "aves", "piquenique"],
  },
  {
    id: "restaurante",
    name: "Restaurante",
    type: "SERVICE",
    description: "Refeições preparadas com sabores e produtos da fazenda.",
    position: [-14.891, 13.4972],
    aliases: ["comida", "almoço", "almoco", "refeição", "refeicao"],
  },
];

function normalize(value) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function localReply(module, message, experiences, farmAreas, recommendedFarms) {
  if (module === "discovery") {
    const list = recommendedFarms
      .slice(0, 3)
      .map((farm) => `${farm.name} — ${farm.recommendationReason}`)
      .join("; ");
    return `Estas são as melhores sugestões para começar: ${list}. Posso refinar por proximidade, preço, conforto ou sustentabilidade.`;
  }
  if (module === "map") {
    const places = farmPoints.map((point) => point.name).join(", ");
    return `Pode explorar ${places}. Também temos ${farmAreas
      .map((area) => area.name)
      .join(" e ")} delimitadas no mapa. Diga-me o local que deseja conhecer e eu mostro-o no mapa.`;
  }
  if (module === "sustainability") {
    const ecologicalAreas = farmAreas
      .filter((area) => ["PLANTATION", "ANIMALS", "LEISURE"].includes(area.type))
      .map((area) => `${area.name}: ${area.description}`)
      .join("; ");
    return `A leitura ambiental começa pelas áreas da fazenda: ${
      ecologicalAreas || "as áreas ecológicas estão a ser atualizadas"
    }. Posso explicar o solo, a água, os animais ou a biodiversidade de cada zona.`;
  }

  const ordered =
    module === "offers"
      ? [...experiences].sort((a, b) => a.priceKz - b.priceKz)
      : experiences;
  const list = ordered
    .slice(0, 3)
    .map(
      (item) =>
        `${item.name} — ${Number(item.priceKz).toLocaleString("pt-AO")} Kz, ${new Intl.DateTimeFormat(
          "pt-AO",
          { day: "2-digit", month: "short" },
        ).format(new Date(item.date))}, ${item.availableSeats} vagas`,
    )
    .join("; ");
  const prefix =
    module === "offers"
      ? "As opções com melhor preço começam por"
      : module === "leisure"
        ? "Para lazer e conforto, pode considerar"
        : "Encontrei estas opções";
  return `${prefix}: ${list || "a agenda está a ser atualizada"}. ${
    /data|quando|fim de semana/i.test(message)
      ? "Diga-me a data e o número de pessoas para verificar a melhor combinação."
      : "Posso ajudar a escolher pela data, preço ou tipo de experiência."
  }`;
}

function findMapTargets(module, message, farmAreas) {
  const haystack = normalize(message);
  const pointTargets = farmPoints
    .filter((point) => {
      const terms = [point.name, ...point.aliases].map(normalize);
      return terms.some((term) => haystack.includes(term));
    })
    .map((point) => ({
      id: point.id,
      name: point.name,
      type: point.type,
      description: point.description,
      kind: "point",
      mapUrl: `/mapa?focus=${encodeURIComponent(point.id)}`,
    }));
  const areaTargets = farmAreas
    .filter((area) => haystack.includes(normalize(area.name)))
    .map((area) => ({
      id: area.id,
      name: area.name,
      type: area.type,
      description: area.description,
      kind: "area",
      mapUrl: `/mapa?focus=${encodeURIComponent(area.id)}`,
    }));
  const found = [...pointTargets, ...areaTargets];
  if (found.length) return found.slice(0, 3);
  if (module === "map") {
    return farmPoints.slice(0, 3).map((point) => ({
      id: point.id,
      name: point.name,
      type: point.type,
      description: point.description,
      kind: "point",
      mapUrl: `/mapa?focus=${encodeURIComponent(point.id)}`,
    }));
  }
  if (module === "sustainability") {
    return farmAreas
      .filter((area) => ["PLANTATION", "ANIMALS", "LEISURE"].includes(area.type))
      .slice(0, 2)
      .map((area) => ({
        id: area.id,
        name: area.name,
        type: area.type,
        description: area.description,
        kind: "area",
        mapUrl: `/mapa?focus=${encodeURIComponent(area.id)}`,
      }));
  }
  return [];
}

chatbotRouter.get("/providers", (_req, res) => {
  res.json({
    order: (process.env.AI_PROVIDER_ORDER || "gemini,groq,openai").split(","),
    providers: getConfiguredProviders(),
  });
});

chatbotRouter.post("/", async (req, res, next) => {
  try {
    const { message, sessionId, module, location, preference } = z
      .object({
        message: z.string().min(1).max(1000),
        sessionId: z.string().optional(),
        module: z.enum(Object.keys(CHAT_MODULES)).default("general"),
        location: z
          .object({
            latitude: z.number().min(-90).max(90),
            longitude: z.number().min(-180).max(180),
          })
          .nullable()
          .optional(),
        preference: z.enum(["nearby", "price", "sustainability", "comfort"]).optional(),
      })
      .parse(req.body);
    const normalizedMessage = normalize(message);
    const inferredPreference =
      preference ||
      (module === "offers" || /preco|econom|barat/.test(normalizedMessage)
        ? "price"
        : module === "sustainability" || /sustent|ecolog|ambient/.test(normalizedMessage)
          ? "sustainability"
          : module === "leisure" || /confort|crianca|familia|descans/.test(normalizedMessage)
            ? "comfort"
            : "nearby");
    const recommendedFarms = recommendFarms({ location, preference: inferredPreference });
    const [experiences, farmAreas, recentHistory] = await Promise.all([
      prisma.experience.findMany({
        where: { active: true, date: { gte: new Date() } },
        orderBy: { date: "asc" },
        take: 8,
        include: {
          bookings: {
            where: { status: { in: ["PENDING", "APPROVED"] } },
            select: { guests: true },
          },
        },
      }),
      prisma.farmArea.findMany({
        where: { public: true },
        orderBy: { name: "asc" },
        select: { id: true, name: true, type: true, description: true, geojson: true },
      }),
      sessionId
        ? prisma.chatLog.findMany({
            where: { sessionId },
            orderBy: { createdAt: "desc" },
            take: 4,
            select: { message: true, response: true },
          })
        : Promise.resolve([]),
    ]);
    const catalog = experiences.map((item) => {
      const reservedSeats = item.bookings.reduce((sum, booking) => sum + booking.guests, 0);
      return {
        id: item.id,
        name: item.name,
        description: item.description,
        priceKz: Number(item.price),
        capacity: item.capacity,
        availableSeats: Math.max(item.capacity - reservedSeats, 0),
        date: item.date.toISOString(),
        duration: item.duration,
      };
    });
    const history = recentHistory.reverse();

    const aiResult = await generateAIReply({
      message,
      module,
      catalog,
      farmAreas,
      farms: recommendedFarms.slice(0, 4),
      points: farmPoints.map(({ aliases, ...point }) => point),
      history,
      location: location || null,
    });
    const answer =
      aiResult.answer ||
      localReply(module, message, catalog, farmAreas, recommendedFarms);
    const mapTargets = findMapTargets(module, message, farmAreas);

    await prisma.chatLog.create({ data: { message, response: answer, sessionId } });
    const whatsappText = encodeURIComponent(`Olá AGRO TUR! Gostaria de fazer uma pré-reserva. ${message}`);
    res.json({
      answer,
      whatsappUrl: `https://wa.me/${process.env.WHATSAPP_NUMBER}?text=${whatsappText}`,
      provider: aiResult.provider,
      model: aiResult.model,
      module,
      suggestions: CHAT_MODULES[module].suggestions,
      mapTargets,
      farmRecommendations: recommendedFarms.slice(0, 3).map((farm) => ({
        id: farm.id,
        name: farm.name,
        location: farm.location,
        distanceKm: farm.distanceKm,
        startingPriceKz: farm.startingPriceKz,
        rating: farm.rating,
        recommendationReason: farm.recommendationReason,
        mapUrl: `/fazendas?focus=${encodeURIComponent(farm.id)}`,
      })),
      locationUsed: Boolean(location),
      preference: inferredPreference,
    });
  } catch (error) {
    next(error);
  }
});

import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { prisma } from "../db.js";
import {
  CHAT_MODULES,
  CHAT_SCOPES,
  generateAIReply,
  getConfiguredProviders,
} from "../services/ai.js";
import { recommendFarms } from "../data/farms.js";
import { optionalAuth } from "../middleware/auth.js";

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

function scopedLocalReply({
  scope,
  module,
  message,
  catalog,
  farmAreas,
  products,
  managementContext,
  recommendedFarms,
}) {
  if (scope === "manager") {
    const summary = managementContext?.summary;
    if (!summary) return "Os indicadores de gestão estão a ser atualizados.";
    if (module === "booking_ops") {
      return `Existem ${summary.pendingBookings} reservas pendentes, ${summary.approvedBookings} aprovadas e ${summary.cancelledBookings} canceladas no período analisado. Posso ajudar a priorizar as pendentes ou resumir as reservas mais recentes.`;
    }
    if (module === "finance") {
      return `O faturamento aprovado do mês é ${summary.revenueKz.toLocaleString("pt-AO")} Kz. O produto mais vendido é ${summary.topProduct || "ainda não definido"}. Posso comparar estes indicadores e apontar o que merece atenção.`;
    }
    const pendingLabel = summary.pendingBookings === 1 ? "pedido pendente" : "pedidos pendentes";
    return `Resumo da gestão: ${summary.monthBookings} reservas no mês, ${summary.revenueKz.toLocaleString("pt-AO")} Kz de faturamento aprovado, ${summary.occupancy}% de ocupação e ${summary.pendingBookings} ${pendingLabel}.`;
  }

  if (scope === "farmer") {
    if (module === "inventory") {
      const lowStock = products.filter((product) => product.stock < 10);
      return lowStock.length
        ? `Atenção ao estoque: ${lowStock.map((product) => `${product.name} (${product.stock} ${product.unit})`).join("; ")}. Posso também resumir vendas e os restantes produtos.`
        : `Os ${products.length} produtos cadastrados estão acima do nível crítico de 10 unidades.`;
    }
    if (module === "gis_ops") {
      return `O mapa possui ${farmAreas.length} áreas cadastradas: ${farmAreas.map((area) => `${area.name} (${area.type})`).join("; ")}. Posso explicar cada zona ou ajudar a organizar os tipos GIS.`;
    }
    if (module === "catalog_ops") {
      return `Há ${catalog.length} experiências futuras ativas. As próximas são: ${catalog.slice(0, 3).map((item) => `${item.name}, ${item.availableSeats} vagas`).join("; ")}.`;
    }
    return `Operação atual: ${catalog.length} experiências futuras, ${products.length} produtos ativos e ${farmAreas.length} áreas GIS cadastradas. Posso aprofundar agenda, capacidade, estoque ou território.`;
  }

  return localReply(module, message, catalog, farmAreas, recommendedFarms);
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

chatbotRouter.post("/", optionalAuth, async (req, res, next) => {
  try {
    const { message, sessionId, module, location, preference, scope } = z
      .object({
        message: z.string().min(1).max(1000),
        sessionId: z.string().optional(),
        module: z.enum(Object.keys(CHAT_MODULES)).default("general"),
        scope: z.enum(Object.keys(CHAT_SCOPES)).default("tourist"),
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
    if (!CHAT_SCOPES[scope].modules.includes(module)) {
      return res.status(400).json({ error: "Módulo incompatível com esta interface." });
    }
    const requiredRole = { manager: "MANAGER", farmer: "FARMER" }[scope];
    if (requiredRole && req.user?.role !== requiredRole) {
      return res.status(403).json({ error: "O seu perfil não pode usar este assistente." });
    }
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
    const recommendedFarms =
      scope === "tourist" ? recommendFarms({ location, preference: inferredPreference }) : [];
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const [experiences, farmAreas, recentHistory, productRows, managerBookings] = await Promise.all([
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
        where: scope === "farmer" ? {} : { public: true },
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
      prisma.product.findMany({
        where: { active: true },
        orderBy: { stock: "asc" },
        take: 20,
        select: { id: true, name: true, price: true, stock: true, sold: true, unit: true },
      }),
      scope === "manager"
        ? prisma.booking.findMany({
            where: { createdAt: { gte: monthStart } },
            orderBy: { createdAt: "desc" },
            take: 50,
            select: {
              id: true,
              guestName: true,
              guests: true,
              totalAmount: true,
              visitDate: true,
              status: true,
              experience: { select: { name: true } },
            },
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
    const products = productRows.map((product) => ({
      ...product,
      priceKz: Number(product.price),
      ...(scope === "tourist" ? { stock: undefined, sold: undefined } : {}),
    }));
    const approvedManagerBookings = managerBookings.filter((booking) => booking.status === "APPROVED");
    const totalCapacity = catalog.reduce((sum, item) => sum + item.capacity, 0);
    const occupiedSeats = approvedManagerBookings.reduce((sum, booking) => sum + booking.guests, 0);
    const managementContext =
      scope === "manager"
        ? {
            summary: {
              monthBookings: managerBookings.length,
              approvedBookings: approvedManagerBookings.length,
              pendingBookings: managerBookings.filter((booking) => booking.status === "PENDING").length,
              cancelledBookings: managerBookings.filter((booking) => booking.status === "CANCELLED").length,
              revenueKz: approvedManagerBookings.reduce((sum, booking) => sum + Number(booking.totalAmount), 0),
              occupancy: totalCapacity ? Math.min(Math.round((occupiedSeats / totalCapacity) * 100), 100) : 0,
              topProduct: [...productRows].sort((a, b) => b.sold - a.sold)[0]?.name || null,
            },
            recentBookings: managerBookings.slice(0, 10),
          }
        : null;
    const history = recentHistory.reverse();

    const aiResult = await generateAIReply({
      message,
      module,
      scope,
      catalog,
      farmAreas,
      farms: recommendedFarms.slice(0, 4),
      products,
      managementContext,
      points: farmPoints.map(({ aliases, ...point }) => point),
      history,
      location: location || null,
    });
    const answer =
      aiResult.answer ||
      scopedLocalReply({
        scope,
        module,
        message,
        catalog,
        farmAreas,
        products,
        managementContext,
        recommendedFarms,
      });
    const mapTargets = scope === "tourist" ? findMapTargets(module, message, farmAreas) : [];

    await prisma.chatLog.create({ data: { message, response: answer, sessionId } });
    const whatsappText = encodeURIComponent(`Olá AGRO TUR! Gostaria de fazer uma pré-reserva. ${message}`);
    res.json({
      answer,
      whatsappUrl:
        scope === "tourist"
          ? `https://wa.me/${process.env.WHATSAPP_NUMBER}?text=${whatsappText}`
          : null,
      provider: aiResult.provider,
      model: aiResult.model,
      module,
      scope,
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
      scopeLabel: CHAT_SCOPES[scope].label,
    });
  } catch (error) {
    next(error);
  }
});

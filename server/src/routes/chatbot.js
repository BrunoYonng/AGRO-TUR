import { Router } from "express";
import rateLimit from "express-rate-limit";
import OpenAI from "openai";
import { z } from "zod";
import { prisma } from "../db.js";

export const chatbotRouter = Router();

chatbotRouter.use(rateLimit({ windowMs: 60_000, limit: 20 }));

function localReply(message, experiences) {
  const list = experiences
    .slice(0, 3)
    .map(
      (item) =>
        `${item.name} — ${Number(item.price).toLocaleString("pt-AO")} Kz, ${new Intl.DateTimeFormat(
          "pt-AO",
          { day: "2-digit", month: "short" },
        ).format(item.date)}`,
    )
    .join("; ");
  return `Encontrei estas opções: ${list || "a agenda está a ser atualizada"}. ${
    /data|quando|fim de semana/i.test(message)
      ? "Diga-me a data e o número de pessoas para verificar a melhor combinação."
      : "Posso ajudar a escolher pela data, preço ou tipo de experiência."
  }`;
}

chatbotRouter.post("/", async (req, res, next) => {
  try {
    const { message, sessionId } = z
      .object({ message: z.string().min(1).max(1000), sessionId: z.string().optional() })
      .parse(req.body);
    const experiences = await prisma.experience.findMany({
      where: { active: true, date: { gte: new Date() } },
      orderBy: { date: "asc" },
      take: 8,
    });
    let answer = localReply(message, experiences);

    if (process.env.OPENAI_API_KEY) {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const catalog = experiences.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        priceKz: Number(item.price),
        capacity: item.capacity,
        date: item.date.toISOString(),
      }));
      const response = await openai.responses.create({
        model: process.env.OPENAI_MODEL || "gpt-5.6-luna",
        reasoning: { effort: "low" },
        input: [
          {
            role: "system",
            content:
              "És o assistente da AGRO TUR em Angola. Responde em português claro e curto. Usa apenas o catálogo fornecido. Sugere no máximo 2 pacotes adequados à data. Nunca confirma uma reserva; chama-lhe pré-reserva e termina pedindo data, número de pessoas e contacto WhatsApp quando faltar algum dado.",
          },
          { role: "user", content: `Catálogo: ${JSON.stringify(catalog)}\n\nPergunta: ${message}` },
        ],
      });
      answer = response.output_text || answer;
    }

    await prisma.chatLog.create({ data: { message, response: answer, sessionId } });
    const whatsappText = encodeURIComponent(`Olá AGRO TUR! Gostaria de fazer uma pré-reserva. ${message}`);
    res.json({
      answer,
      whatsappUrl: `https://wa.me/${process.env.WHATSAPP_NUMBER}?text=${whatsappText}`,
    });
  } catch (error) {
    next(error);
  }
});

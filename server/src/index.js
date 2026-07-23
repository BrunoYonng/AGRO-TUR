import "dotenv/config";
import cors from "cors";
import express from "express";
import { ZodError } from "zod";
import { authRouter } from "./routes/auth.js";
import { experiencesRouter } from "./routes/experiences.js";
import { bookingsRouter } from "./routes/bookings.js";
import { productsRouter } from "./routes/products.js";
import { areasRouter } from "./routes/areas.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { chatbotRouter } from "./routes/chatbot.js";

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET não definido. Copie .env.example para server/.env.");
  process.exit(1);
}

const app = express();
app.disable("x-powered-by");
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => res.json({ ok: true, service: "AGRO TUR API" }));
app.use("/api/auth", authRouter);
app.use("/api/experiences", experiencesRouter);
app.use("/api/bookings", bookingsRouter);
app.use("/api/products", productsRouter);
app.use("/api/areas", areasRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/chatbot", chatbotRouter);

app.use((error, _req, res, _next) => {
  if (error instanceof ZodError) {
    return res.status(400).json({ error: "Dados inválidos.", details: error.flatten() });
  }
  if (error?.code === "P2025") return res.status(404).json({ error: "Registo não encontrado." });
  if (error?.code === "P2002") return res.status(409).json({ error: "Este registo já existe." });
  console.error(error);
  res.status(500).json({ error: "Não foi possível concluir o pedido." });
});

const port = Number(process.env.PORT) || 3333;
app.listen(port, () => console.log(`AGRO TUR API disponível em http://localhost:${port}/api`));

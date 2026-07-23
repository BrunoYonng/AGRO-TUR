import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

export const dashboardRouter = Router();
dashboardRouter.use(requireAuth);

dashboardRouter.get("/summary", async (_req, res, next) => {
  try {
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    const [bookings, approved, experienceCount, topProduct] = await Promise.all([
      prisma.booking.count({ where: { createdAt: { gte: start } } }),
      prisma.booking.findMany({
        where: { createdAt: { gte: start }, status: "APPROVED" },
        select: { totalAmount: true, guests: true },
      }),
      prisma.experience.aggregate({ where: { active: true }, _sum: { capacity: true } }),
      prisma.product.findFirst({ orderBy: { sold: "desc" } }),
    ]);
    const revenue = approved.reduce((sum, item) => sum + Number(item.totalAmount), 0);
    const occupied = approved.reduce((sum, item) => sum + item.guests, 0);
    const capacity = experienceCount._sum.capacity || 0;
    res.json({
      bookings,
      revenue,
      occupancy: capacity ? Math.min(Math.round((occupied / capacity) * 100), 100) : 0,
      topProduct: topProduct?.name || "Sem vendas",
    });
  } catch (error) {
    next(error);
  }
});

dashboardRouter.get("/weekly", async (_req, res, next) => {
  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const rows = await prisma.booking.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
    });
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(since);
      date.setDate(since.getDate() + index);
      const key = date.toISOString().slice(0, 10);
      return {
        day: new Intl.DateTimeFormat("pt", { weekday: "short" }).format(date),
        reservas: rows.filter((row) => row.createdAt.toISOString().slice(0, 10) === key).length,
      };
    });
    res.json(days);
  } catch (error) {
    next(error);
  }
});

import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { allowRoles, requireAuth } from "../middleware/auth.js";

export const experiencesRouter = Router();

const schema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().min(10),
  price: z.coerce.number().nonnegative(),
  capacity: z.coerce.number().int().positive(),
  date: z.coerce.date(),
  duration: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  active: z.boolean().optional(),
});

experiencesRouter.get("/", async (_req, res, next) => {
  try {
    const items = await prisma.experience.findMany({
      where: { active: true },
      orderBy: { date: "asc" },
      include: { _count: { select: { bookings: true } } },
    });
    res.json(items);
  } catch (error) {
    next(error);
  }
});

experiencesRouter.post("/", requireAuth, allowRoles("FARMER"), async (req, res, next) => {
  try {
    res.status(201).json(await prisma.experience.create({ data: schema.parse(req.body) }));
  } catch (error) {
    next(error);
  }
});

experiencesRouter.put("/:id", requireAuth, allowRoles("FARMER"), async (req, res, next) => {
  try {
    res.json(
      await prisma.experience.update({
        where: { id: req.params.id },
        data: schema.partial().parse(req.body),
      }),
    );
  } catch (error) {
    next(error);
  }
});

experiencesRouter.delete("/:id", requireAuth, allowRoles("FARMER"), async (req, res, next) => {
  try {
    await prisma.experience.update({ where: { id: req.params.id }, data: { active: false } });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

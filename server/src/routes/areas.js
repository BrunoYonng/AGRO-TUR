import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { allowRoles, requireAuth } from "../middleware/auth.js";

export const areasRouter = Router();

const schema = z.object({
  name: z.string().min(2),
  type: z.enum(["PLANTATION", "ANIMALS", "LEISURE", "SERVICE"]),
  description: z.string().min(3),
  geojson: z.record(z.any()),
  public: z.boolean().optional(),
});

areasRouter.get("/", async (_req, res, next) => {
  try {
    res.json(await prisma.farmArea.findMany({ where: { public: true }, orderBy: { name: "asc" } }));
  } catch (error) {
    next(error);
  }
});

areasRouter.post("/", requireAuth, allowRoles("MANAGER", "FARMER"), async (req, res, next) => {
  try {
    res.status(201).json(await prisma.farmArea.create({ data: schema.parse(req.body) }));
  } catch (error) {
    next(error);
  }
});

areasRouter.put("/:id", requireAuth, allowRoles("MANAGER", "FARMER"), async (req, res, next) => {
  try {
    res.json(
      await prisma.farmArea.update({
        where: { id: req.params.id },
        data: schema.partial().parse(req.body),
      }),
    );
  } catch (error) {
    next(error);
  }
});

areasRouter.delete("/:id", requireAuth, allowRoles("MANAGER", "FARMER"), async (req, res, next) => {
  try {
    await prisma.farmArea.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

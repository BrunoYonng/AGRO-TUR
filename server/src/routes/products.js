import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

export const productsRouter = Router();
productsRouter.use(requireAuth);

const schema = z.object({
  name: z.string().min(2),
  sku: z.string().min(2),
  price: z.coerce.number().nonnegative(),
  stock: z.coerce.number().int().nonnegative(),
  unit: z.string().min(1),
  active: z.boolean().optional(),
});

productsRouter.get("/", async (_req, res, next) => {
  try {
    res.json(await prisma.product.findMany({ where: { active: true }, orderBy: { stock: "asc" } }));
  } catch (error) {
    next(error);
  }
});

productsRouter.post("/", async (req, res, next) => {
  try {
    res.status(201).json(await prisma.product.create({ data: schema.parse(req.body) }));
  } catch (error) {
    next(error);
  }
});

productsRouter.put("/:id", async (req, res, next) => {
  try {
    res.json(
      await prisma.product.update({
        where: { id: req.params.id },
        data: schema.partial().parse(req.body),
      }),
    );
  } catch (error) {
    next(error);
  }
});

productsRouter.delete("/:id", async (req, res, next) => {
  try {
    await prisma.product.update({ where: { id: req.params.id }, data: { active: false } });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

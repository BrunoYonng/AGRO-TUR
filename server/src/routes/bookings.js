import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { allowRoles, requireAuth } from "../middleware/auth.js";

export const bookingsRouter = Router();

const createSchema = z.object({
  guestName: z.string().min(2),
  guestEmail: z.string().email().optional().nullable(),
  guestPhone: z.string().min(7),
  guests: z.coerce.number().int().positive(),
  visitDate: z.coerce.date(),
  experienceId: z.string(),
  notes: z.string().optional().nullable(),
});

bookingsRouter.post("/", async (req, res, next) => {
  try {
    const data = createSchema.parse(req.body);
    const experience = await prisma.experience.findUnique({ where: { id: data.experienceId } });
    if (!experience || !experience.active) {
      return res.status(404).json({ error: "Experiência indisponível." });
    }
    const booking = await prisma.booking.create({
      data: { ...data, totalAmount: Number(experience.price) * data.guests },
      include: { experience: true },
    });
    res.status(201).json(booking);
  } catch (error) {
    next(error);
  }
});

bookingsRouter.get("/mine", requireAuth, async (req, res, next) => {
  try {
    res.json(
      await prisma.booking.findMany({
        where: {
          guestEmail: { equals: req.user.email, mode: "insensitive" },
        },
        orderBy: { visitDate: "desc" },
        include: {
          experience: {
            select: { id: true, name: true, description: true, duration: true },
          },
        },
      }),
    );
  } catch (error) {
    next(error);
  }
});

bookingsRouter.get("/", requireAuth, allowRoles("MANAGER", "FARMER"), async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 10, 100);
    res.json(
      await prisma.booking.findMany({
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { experience: { select: { name: true } } },
      }),
    );
  } catch (error) {
    next(error);
  }
});

bookingsRouter.patch("/:id/status", requireAuth, allowRoles("MANAGER"), async (req, res, next) => {
  try {
    const { status } = z
      .object({ status: z.enum(["PENDING", "APPROVED", "CANCELLED"]) })
      .parse(req.body);
    res.json(await prisma.booking.update({ where: { id: req.params.id }, data: { status } }));
  } catch (error) {
    next(error);
  }
});

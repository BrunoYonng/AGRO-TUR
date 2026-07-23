import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

export const authRouter = Router();

authRouter.post("/login", async (req, res, next) => {
  try {
    const { email, password } = z
      .object({ email: z.string().email(), password: z.string().min(8) })
      .parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: "Email ou palavra-passe incorretos." });
    }
    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "8h" },
    );
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/register", async (req, res, next) => {
  try {
    const data = z
      .object({
        name: z.string().min(2).max(100),
        email: z.string().email(),
        password: z.string().min(8).max(128),
      })
      .parse(req.body);
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        passwordHash: await bcrypt.hash(data.password, 12),
        role: "TOURIST",
      },
      select: { id: true, name: true, email: true, role: true },
    });
    res.status(201).json({ user });
  } catch (error) {
    next(error);
  }
});

authRouter.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.sub },
      select: { id: true, name: true, email: true, role: true },
    });
    if (!user) return res.status(404).json({ error: "Utilizador não encontrado." });
    res.json({ user });
  } catch (error) {
    next(error);
  }
});

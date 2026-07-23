import { Router } from "express";
import { z } from "zod";
import { recommendFarms } from "../data/farms.js";

export const farmsRouter = Router();

farmsRouter.get("/", (req, res) => {
  const query = z
    .object({
      lat: z.coerce.number().min(-90).max(90).optional(),
      lng: z.coerce.number().min(-180).max(180).optional(),
      preference: z.enum(["nearby", "price", "sustainability", "comfort"]).default("nearby"),
    })
    .parse(req.query);

  const location =
    query.lat !== undefined && query.lng !== undefined
      ? { latitude: query.lat, longitude: query.lng }
      : null;

  res.json({
    farms: recommendFarms({ location, preference: query.preference }),
    locationUsed: Boolean(location),
    preference: query.preference,
  });
});

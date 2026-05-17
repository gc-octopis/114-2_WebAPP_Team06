import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { getEvents, getUpcomingEvents } from "../queries/calendar";
import type { Language } from "../types";

export const calendar = new Hono();

const querySchema = z.object({
  lang: z.enum(["zh", "en"]).default("zh"),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

calendar.get("/", zValidator("query", querySchema), (c) => {
  const { lang, start_date, end_date } = c.req.valid("query");
  const events = getEvents(lang as Language, start_date, end_date);
  // Frontend expects an object with an "events" key
  return c.json({ events });
});
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { getAnnouncements, getAnnouncementCategories } from "../queries/announcements";
import type { Language } from "../types";

export const announcements = new Hono();

const querySchema = z.object({
  lang: z.enum(["zh", "en"]).default("zh"),
  category: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(10),
});

announcements.get("/", zValidator("query", querySchema), (c) => {
  const { lang, category, page, page_size } = c.req.valid("query");
  const result = getAnnouncements({
    lang: lang as Language,
    category,
    page,
    pageSize: page_size,
  });
  return c.json(result);
});

announcements.get("/categories", (c) => {
  const lang = (c.req.query("lang") ?? "zh") as Language;
  return c.json(getAnnouncementCategories(lang));
});

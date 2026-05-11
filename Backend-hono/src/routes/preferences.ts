import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { getPreferences, upsertPreferences } from "../queries/preferences";

export const preferences = new Hono();

// Middleware: require X-User-Id header on all /preferences routes
preferences.use("*", async (c, next) => {
  const userId = c.req.header("X-User-Id");
  if (!userId?.trim()) {
    return c.json({ error: "Missing X-User-Id header" }, 400);
  }
  // Store on context so route handlers can read it
  c.set("userId" as never, userId.trim());
  await next();
});

preferences.get("/", (c) => {
  const userId = c.get("userId" as never) as string;
  return c.json(getPreferences(userId));
});

const postSchema = z.object({
  pinned_links: z.array(
    z.object({
      label: z.string(),
      label_en: z.string().nullable(),
      url: z.string().url(),
      icon: z.string().url()
    })
  ),
});

// Frontend uses POST to update preferences
preferences.post("/", zValidator("json", postSchema), (c) => {
  const userId = c.get("userId" as never) as string;
  const { pinned_links } = c.req.valid("json");
  return c.json(upsertPreferences(userId, pinned_links));
});

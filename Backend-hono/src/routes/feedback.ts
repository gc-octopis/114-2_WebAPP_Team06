import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { getTopLevelPosts, createPost } from "../queries/feedback";

export const feedback = new Hono();

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(10),
});

feedback.get("/", zValidator("query", querySchema), (c) => {
  const { page, page_size } = c.req.valid("query");
  return c.json(getTopLevelPosts(page, page_size));
});

const createSchema = z.object({
  parent_id: z.number().int().positive().nullable().optional(),
  nickname: z.string().max(80).optional(),
  avatar_color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  title: z.string().min(1).max(200).default(""),
  content: z.string().min(1).max(3000),
});

feedback.post("/", zValidator("json", createSchema), (c) => {
  const input = c.req.valid("json");
  const post = createPost(input);
  return c.json(post, 201);
});

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { getTopLevelPosts, createPost } from "../queries/feedback";

export const feedback = new Hono();

feedback.get("/", (c) => {
  return c.json(getTopLevelPosts());
});

const createSchema = z.object({
  parent_id: z.number().int().positive().nullable().optional(),
  nickname: z.string().max(80).optional(),
  avatar_color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(3000),
});

feedback.post("/", zValidator("json", createSchema), (c) => {
  const input = c.req.valid("json");
  const post = createPost(input);
  return c.json(post, 201);
});

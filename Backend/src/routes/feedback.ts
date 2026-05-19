import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { getTopLevelPosts, createPost } from "../queries/feedback";
import Redis from 'ioredis'

const redisUrl = process.env.REDIS_URL ?? 'redis://127.0.0.1:6379/0'
const redis = new Redis(redisUrl, { lazyConnect: true, maxRetriesPerRequest: 1 })
redis.on('error', () => {
  // Feedback can still be listed without Redis-backed user names.
})

export const feedback = new Hono();

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(10),
});

feedback.get("/", zValidator("query", querySchema), async (c) => {
  const { page, page_size } = c.req.valid("query");
  const data = getTopLevelPosts(page, page_size);

  // Collect all user_ids from posts and replies
  const ids = new Set<string>();
  function collect(posts) {
    for (const p of posts) {
      if (p.user_id) ids.add(p.user_id);
      if (Array.isArray(p.replies) && p.replies.length) collect(p.replies);
    }
  }
  collect(data.posts);

  // Fetch user records from Redis
  const users: Record<string, any> = {};
  if (ids.size > 0) {
    await Promise.all(Array.from(ids).map(async (id) => {
      try {
        const v = await redis.get(`myntupp:user:${id}`)
        if (v) {
          try { users[id] = JSON.parse(v) } catch { users[id] = null }
        }
      } catch (err) {
        users[id] = null
      }
    }))
  }

  // Determine current request user id
  const currentUser = (c.req as any).user
  const currentId = currentUser?.email ?? null

  // Replace nickname with current user's name when user_id present, and set is_me
  function applyUsers(posts) {
    for (const p of posts) {
      if (p.user_id) {
        const u = users[p.user_id]
        if (u && (u.name || u.email)) {
          p.nickname = (u.name && u.name.trim()) || (u.email || '').split('@')[0] || p.nickname
        }
        p.is_me = currentId && p.user_id && (p.user_id.toLowerCase() === currentId.toLowerCase())
      } else {
        p.is_me = false
      }
      if (Array.isArray(p.replies) && p.replies.length) applyUsers(p.replies)
    }
  }
  applyUsers(data.posts)

  return c.json(data)
});

const createSchema = z.object({
  parent_id: z.number().int().positive().nullable().optional(),
  nickname: z.string().max(80).optional(),
  post_as: z.enum(['nickname', 'anonymous']).optional(),
  avatar_color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  title: z.string().min(1).max(200).default(""),
  content: z.string().min(1).max(3000),
});

feedback.post("/", zValidator("json", createSchema), (c) => {
  const input = c.req.valid("json");

  // If the client requested to post as the logged-in nickname, but didn't
  // supply a nickname field, derive it from the session-attached user.
  try {
    if ((input.post_as === 'nickname' || !input.post_as) && !input.nickname) {
      const user = (c.req as any).user;
      if (user && user.email) {
        input.nickname = (user.name && user.name.trim()) || (user.email.split('@')[0] || 'Anonymous');
        (input as any).user_id = user.email;
      }
    }
  } catch (err) {
    // ignore and let createPost handle defaults
  }

  const post = createPost(input);
  return c.json(post, 201);
});

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { saveContactMessage } from "../queries/contact";
import { sendMail } from "../services/email";

export const contact = new Hono();

const createSchema = z.object({
  name: z.string().max(100).optional(),
  email: z.string().email().optional().or(z.literal("")),
  message: z.string().min(1).max(3000),
});

contact.post("/", zValidator("json", createSchema), async (c) => {
  const input = c.req.valid("json");
  const saved = saveContactMessage(input);

  // Fire-and-forget email — don't block the response if SMTP fails
  sendMail({
    replyTo: input.email || undefined,
    subject: `[NTU Contact] New message from ${input.name || "Anonymous"}`,
    text: `Name: ${input.name || "Anonymous"}\nEmail: ${input.email || "—"}\n\n${input.message}`,
  }).catch((err) => console.error("Email send failed:", err));

  return c.json({ ok: true, id: saved.id }, 201);
});

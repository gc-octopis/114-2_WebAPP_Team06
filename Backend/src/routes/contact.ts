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
  const adminEmail = process.env.ADMIN_EMAIL;

  if (input.email)
  sendMail({
    to: input.email,
    subject: `[MyNTU++] 感謝您的意見回饋}`,
    content: `${input.name || ""}您好，\n您剛剛在 MyNTU++ 上填寫的建議已成功接收。內容將交於工作人員進行審核，若有進一步的消息將再回信給您！\n感謝您提供寶貴的意見！\nMyNTU++ 團隊 敬上`,
  }).catch((err) => console.error("Email send failed:", err));

  if (adminEmail)
  sendMail({
    to: adminEmail,
    subject: `[MyNTU++] New message from ${input.name || "Anonymous"}`,
    content: `Name: ${input.name || "Anonymous"}\nEmail: ${input.email || "—"}\n\n${input.message}`,
  }).catch((err) => console.error("Email send failed:", err));

  return c.json({ ok: true, id: saved.id }, 201);
});

import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST ?? "smtps.ntu.edu.tw",
  port: Number(process.env.EMAIL_PORT ?? 465),
  secure: true, // SSL — matches Django's EMAIL_USE_SSL = True
  auth: {
    user: process.env.EMAIL_HOST_USER ?? "",
    pass: process.env.EMAIL_HOST_PASSWORD ?? "",
  },
});

export interface MailOptions {
  from?: string;
  replyTo?: string;
  subject: string;
  text: string;
}

export async function sendMail(options: MailOptions): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL ?? process.env.EMAIL_HOST_USER;
  await transporter.sendMail({
    from: options.from ?? process.env.EMAIL_HOST_USER,
    to: adminEmail,
    replyTo: options.replyTo,
    subject: options.subject,
    text: options.text,
  });
}

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
  to: string;
  subject: string;
  content: string;
}

export async function sendMail(options: MailOptions): Promise<void> {
  await transporter.sendMail({
    from: `MyNTU++ <${process.env.EMAIL_HOST_USER}@ntu.edu.tw>`,
    to: options.to,
    subject: options.subject,
    text: options.content,
  });
  console.log(`Mail Sent to ${options.to}"`);
}

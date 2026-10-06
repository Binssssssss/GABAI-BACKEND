import nodemailer from 'nodemailer';

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV?: string;
      MAIL_HOST?: string;
      MAIL_PORT?: string;
      MAIL_USER?: string;
      MAIL_PASSWORD?: string;
      MAIL_FROM?: string;
      [key: string]: string | undefined;
    }
  }
}

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD,
  },
});

interface SendEmailParams {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendEmail({
  to,
  subject,
  text,
  html,
}: SendEmailParams) {
  if (!process.env.MAIL_HOST) {
    throw new Error('MAIL_HOST is not configured.');
  }

  if (!process.env.MAIL_USER) {
    throw new Error('MAIL_USER is not configured.');
  }

  if (!process.env.MAIL_PASSWORD) {
    throw new Error('MAIL_PASSWORD is not configured.');
  }

  if (!process.env.MAIL_FROM) {
    throw new Error('MAIL_FROM is not configured.');
  }

  const info = await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject,
    text,
    html,
  });

  return info;
}
import nodemailer from 'nodemailer';

/**
 * Sends email through Resend (RESEND_API_KEY) when it is configured,
 * otherwise through the SMTP settings (MAIL_HOST, MAIL_USER, ...).
 */

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV?: string;
      RESEND_API_KEY?: string;
      RESEND_FROM?: string;
      MAIL_HOST?: string;
      MAIL_PORT?: string;
      MAIL_USER?: string;
      MAIL_PASSWORD?: string;
      MAIL_FROM?: string;
      [key: string]: string | undefined;
    }
  }
}

interface SendEmailParams {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

const RESEND_URL = 'https://api.resend.com/emails';

async function sendWithResend({ to, subject, text, html }: SendEmailParams) {
  const response = await fetch(RESEND_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || 'GabAi <onboarding@resend.dev>',
      to: [to],
      subject,
      text,
      html,
    }),
  });

  const body = (await response.json().catch(() => ({}))) as {
    id?: string;
    message?: string;
  };

  if (!response.ok) {
    // Never log the API key; the message is enough to debug.
    throw new Error(
      `Resend error (${response.status}): ${body?.message ?? 'Unknown error'}`,
    );
  }

  return { messageId: body.id ?? '' };
}

async function sendWithSmtp({ to, subject, text, html }: SendEmailParams) {
  const missing = ['MAIL_HOST', 'MAIL_USER', 'MAIL_PASSWORD', 'MAIL_FROM'].filter(
    (key) => !process.env[key],
  );

  if (missing.length) {
    throw new Error(
      `Email is not configured. Set RESEND_API_KEY (or ${missing.join(', ')}).`,
    );
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

  const info = await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject,
    text,
    html,
  });

  return { messageId: info.messageId };
}

export async function sendEmail(params: SendEmailParams) {
  if (process.env.RESEND_API_KEY) {
    return sendWithResend(params);
  }

  return sendWithSmtp(params);
}

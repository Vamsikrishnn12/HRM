import nodemailer from 'nodemailer';
import { env } from './env';

let transporter: nodemailer.Transporter | null = null;

const smtpReady =
  !!env.SMTP_HOST && !!env.SMTP_PORT && !!env.SMTP_USER && !!env.SMTP_PASS;

if (smtpReady) {
  const isGmail = env.SMTP_HOST?.toLowerCase() === 'smtp.gmail.com';
  transporter = nodemailer.createTransport({
    ...(isGmail ? { service: 'gmail' } : {}),
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    requireTLS: env.SMTP_PORT === 587,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
    connectionTimeout: 20_000,
    greetingTimeout: 20_000,
    socketTimeout: 45_000,
    tls: {
      minVersion: 'TLSv1.2',
      servername: env.SMTP_HOST,
    },
  });

  // Avoid an extra SMTP connection on every Vercel cold start.
  if (!process.env.VERCEL) transporter.verify().then(() => {
    console.log('✅ SMTP connection verified');
  }).catch((err) => {
    console.error('❌ SMTP connection failed:', err.message);
  });
}

export { transporter };

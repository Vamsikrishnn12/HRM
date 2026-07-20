import nodemailer from 'nodemailer';
import { env } from './env';

let transporter: nodemailer.Transporter | null = null;

const smtpReady =
  !!env.SMTP_HOST && !!env.SMTP_PORT && !!env.SMTP_USER && !!env.SMTP_PASS;

if (smtpReady) {
  // Gmail STARTTLS on 587 is more reliable from serverless environments than
  // holding an implicit-TLS socket open on 465.
  const smtpPort = process.env.VERCEL && env.SMTP_HOST?.toLowerCase() === 'smtp.gmail.com'
    ? 587
    : env.SMTP_PORT!;
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: smtpPort,
    secure: smtpPort === 465,
    requireTLS: smtpPort === 587,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 30_000,
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

import nodemailer from 'nodemailer';
import { env } from './env';
import { logger } from '../utils/logger';

let transporter: nodemailer.Transporter | null = null;

const smtpReady =
  !!env.SMTP_HOST && !!env.SMTP_PORT && !!env.SMTP_USER && !!env.SMTP_PASS;

if (smtpReady) {
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
  logger.info('SMTP transporter initialised', { host: env.SMTP_HOST, port: env.SMTP_PORT });
} else {
  const missing = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'].filter(
    (k) => !env[k as keyof typeof env],
  );
  logger.warn(`SMTP not configured — missing env vars: ${missing.join(', ')}. Emails will be logged to console.`);
}

export { transporter };

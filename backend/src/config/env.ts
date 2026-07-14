import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  // One canonical connection string for the active database.
  DATABASE_URL: z.string().url(),

  JWT_ACCESS_SECRET: z.string().min(10),
  JWT_REFRESH_SECRET: z.string().min(10),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),

  PORT: z.string().default('5000').transform(Number).pipe(z.number().positive()),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  APP_URL: z.string().url().default('http://localhost:3000'),
  COOKIE_SAME_SITE: z.enum(['strict', 'lax', 'none']).optional(),

  ADMIN_EMAIL: z.string().email().default('admin@hrms.com'),
  ADMIN_PASSWORD: z.string().min(6).default('Admin@123'),
  ADMIN_FIRST_NAME: z.string().default('System'),
  ADMIN_LAST_NAME: z.string().default('Admin'),

  // SMTP (optional – when not set, credentials are logged to console)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).pipe(z.number().positive()).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().email().optional(),
  SMTP_FROM_NAME: z.string().default('Connect HR'),
  CHROME_PATH: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const invalidKeys = Object.keys(parsed.error.flatten().fieldErrors);
  throw new Error(`Invalid or missing environment variables: ${invalidKeys.join(', ')}`);
}

export const env = parsed.data;

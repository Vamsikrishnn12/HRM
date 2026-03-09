import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  // Prefer DATABASE_URL (single connection string) for production / Neon DB.
  // Fall back to individual host/port/user/password/name for local dev.
  DATABASE_URL: z.string().url().optional(),
  DATABASE_HOST: z.string().min(1).optional(),
  DATABASE_PORT: z.string().transform(Number).pipe(z.number().positive()).optional(),
  DATABASE_USER: z.string().min(1).optional(),
  DATABASE_PASSWORD: z.string().min(1).optional(),
  DATABASE_NAME: z.string().min(1).optional(),

  JWT_ACCESS_SECRET: z.string().min(10),
  JWT_REFRESH_SECRET: z.string().min(10),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),

  PORT: z.string().default('5000').transform(Number).pipe(z.number().positive()),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  CORS_ORIGIN: z.string().default('http://localhost:3000'),

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
  SMTP_FROM_NAME: z.string().default('HRMS'),
});

const parsed = envSchema
  .refine(
    (d) => !!d.DATABASE_URL || (!!d.DATABASE_HOST && !!d.DATABASE_USER && !!d.DATABASE_NAME),
    { message: 'Provide DATABASE_URL or DATABASE_HOST + DATABASE_USER + DATABASE_NAME' },
  )
  .safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

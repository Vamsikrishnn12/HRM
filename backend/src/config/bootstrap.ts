import { AppDataSource } from './database';
import { seedAdmin } from '../seed/seedAdmin';

let bootstrapPromise: Promise<void> | null = null;

/** Reuses one initialization promise per warm Vercel function instance. */
export const ensureBackendReady = async (): Promise<void> => {
  if (AppDataSource.isInitialized) return;

  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      await AppDataSource.initialize();
      // Vercel runs the TypeScript serverless entry directly and does not run
      // the package's production migration command. Keep additive runtime
      // schema changes idempotent so a newly deployed function can safely
      // bring an existing database forward before repositories query it.
      await AppDataSource.query(
        `ALTER TABLE "attendance_punches"
         ADD COLUMN IF NOT EXISTS "photoUrl" character varying(1000)`,
      );
      // OrgSettings is loaded by attendance, payroll, dashboard, and settings.
      // Keep these additive payslip-branding columns available before TypeORM
      // performs any entity SELECT in a Vercel serverless function.
      await AppDataSource.query(
        `ALTER TABLE "org_settings"
         ADD COLUMN IF NOT EXISTS "companyLogoUrl" text,
         ADD COLUMN IF NOT EXISTS "cinNumber" character varying(21),
         ADD COLUMN IF NOT EXISTS "gstNumber" character varying(15),
         ADD COLUMN IF NOT EXISTS "payslipAdditionalFields" jsonb NOT NULL DEFAULT '[]'::jsonb`,
      );
      await AppDataSource.query(`CREATE TABLE IF NOT EXISTS "push_subscriptions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "endpoint" text NOT NULL,
        "p256dh" text NOT NULL,
        "auth" text NOT NULL,
        "userAgent" character varying(500),
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_push_subscriptions" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_push_subscriptions_endpoint" UNIQUE ("endpoint"),
        CONSTRAINT "FK_push_subscriptions_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )`);
      await AppDataSource.query(
        `CREATE INDEX IF NOT EXISTS "IDX_push_subscriptions_user" ON "push_subscriptions" ("userId")`,
      );
      await seedAdmin();
    })().catch((error) => {
      bootstrapPromise = null;
      throw error;
    });
  }

  await bootstrapPromise;
};

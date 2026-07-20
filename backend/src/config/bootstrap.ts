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
      await seedAdmin();
    })().catch((error) => {
      bootstrapPromise = null;
      throw error;
    });
  }

  await bootstrapPromise;
};

import { AppDataSource } from './database';
import { seedAdmin } from '../seed/seedAdmin';

let bootstrapPromise: Promise<void> | null = null;

/** Reuses one initialization promise per warm Vercel function instance. */
export const ensureBackendReady = async (): Promise<void> => {
  if (AppDataSource.isInitialized) return;

  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      await AppDataSource.initialize();
      await seedAdmin();
    })().catch((error) => {
      bootstrapPromise = null;
      throw error;
    });
  }

  await bootstrapPromise;
};

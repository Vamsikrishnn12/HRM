import type { Request, Response } from 'express';

let appPromise: Promise<typeof import('../src/app').default> | null = null;

export default async function handler(req: Request, res: Response) {
  try {
    appPromise ??= import('../src/app').then((module) => module.default);
    const app = await appPromise;
    return app(req, res);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Backend initialization failed';
    console.error('Connect HR serverless initialization failed:', error);
    return res.status(500).json({
      success: false,
      message,
      errorCode: 'BACKEND_INITIALIZATION_FAILED',
    });
  }
}

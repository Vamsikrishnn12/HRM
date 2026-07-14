import os from 'os';
import path from 'path';

export const uploadRoot = process.env.VERCEL
  ? path.join(os.tmpdir(), 'connecthr-uploads')
  : path.resolve('uploads');

export const getUploadPath = (...segments: string[]): string =>
  path.join(uploadRoot, ...segments);

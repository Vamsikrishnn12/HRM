import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { del, put } from '@vercel/blob';
import { getUploadPath } from './uploadPath';
import { ApiError } from './apiError';

const extensionFor = (file: Express.Multer.File): string => {
  const extensions: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
  };
  return extensions[file.mimetype] || path.extname(file.originalname).toLowerCase();
};

export async function storeCompanyLogo(file: Express.Multer.File): Promise<string> {
  const filename = `${randomUUID()}${extensionFor(file)}`;
  if (process.env.VERCEL) {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw ApiError.badRequest(
        'Logo storage is not configured. Add BLOB_READ_WRITE_TOKEN in Vercel.',
        'LOGO_STORAGE_NOT_CONFIGURED',
      );
    }
    const blob = await put(`company-logos/${filename}`, file.buffer, {
      access: 'public',
      contentType: file.mimetype,
    });
    return blob.url;
  }

  const directory = getUploadPath('company-logos');
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(path.join(directory, filename), file.buffer);
  return `/uploads/company-logos/${filename}`;
}

export async function deleteCompanyLogo(logoUrl?: string | null): Promise<void> {
  if (!logoUrl) return;
  if (logoUrl.includes('.blob.vercel-storage.com/')) {
    if (process.env.BLOB_READ_WRITE_TOKEN) await del(logoUrl).catch(() => undefined);
    return;
  }
  if (logoUrl.startsWith('/uploads/company-logos/')) {
    await fs.unlink(getUploadPath('company-logos', path.basename(logoUrl))).catch(() => undefined);
  }
}

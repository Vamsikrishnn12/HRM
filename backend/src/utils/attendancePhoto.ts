import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { del, put } from '@vercel/blob';
import { ApiError } from './apiError';
import { getUploadPath } from './uploadPath';

const extensionFor = (file: Express.Multer.File): string => {
  const original = path.extname(file.originalname).toLowerCase();
  if (['.jpg', '.jpeg', '.png', '.webp'].includes(original)) return original;
  if (file.mimetype === 'image/png') return '.png';
  if (file.mimetype === 'image/webp') return '.webp';
  return '.jpg';
};

export async function saveAttendancePhoto(
  employeeId: string,
  file: Express.Multer.File,
): Promise<string> {
  const filename = `${randomUUID()}${extensionFor(file)}`;

  if (process.env.VERCEL) {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw ApiError.internal(
        'Attendance photo storage is not configured. Add BLOB_READ_WRITE_TOKEN in Vercel.',
        'BLOB_STORAGE_NOT_CONFIGURED',
      );
    }
    const blob = await put(`attendance-photos/${employeeId}/${filename}`, file.buffer, {
      access: 'public',
      contentType: file.mimetype,
      addRandomSuffix: false,
    });
    return blob.url;
  }

  const directory = getUploadPath('attendance-photos', employeeId);
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(path.join(directory, filename), file.buffer);
  return `/uploads/attendance-photos/${employeeId}/${filename}`;
}

export async function deleteAttendancePhoto(photoUrl: string): Promise<void> {
  if (photoUrl.includes('.blob.vercel-storage.com/')) {
    if (process.env.BLOB_READ_WRITE_TOKEN) await del(photoUrl).catch(() => undefined);
    return;
  }

  if (photoUrl.startsWith('/uploads/attendance-photos/')) {
    const relativePath = photoUrl.replace('/uploads/attendance-photos/', '');
    const safeSegments = relativePath.split('/').filter((segment) => segment && segment !== '..');
    await fs.unlink(getUploadPath('attendance-photos', ...safeSegments)).catch(() => undefined);
  }
}

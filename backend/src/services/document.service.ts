import path from 'path';
import fs from 'fs';
import { DocumentRepository } from '../repositories/document.repository';

/** Relative path usable as a URL segment — works across OS and in production */
const UPLOAD_REL = 'uploads/documents';
import { EmployeeRepository } from '../repositories/employee.repository';
import { ApiError } from '../utils/apiError';
import { getUploadPath } from '../utils/uploadPath';
import { del, put } from '@vercel/blob';
import { randomUUID } from 'crypto';

export class DocumentService {
  private docRepo: DocumentRepository;
  private employeeRepo: EmployeeRepository;

  constructor() {
    this.docRepo = new DocumentRepository();
    this.employeeRepo = new EmployeeRepository();
  }

  async listAll() {
    const records = await this.docRepo.findAll();
    return {
      data: records.map((r) => this.formatRecord(r)),
      total: records.length,
    };
  }

  async getByUserId(userId: string) {
    const records = await this.docRepo.findByUserId(userId);
    return {
      data: records.map((r) => this.formatRecord(r)),
      total: records.length,
    };
  }

  async upload(
    userId: string,
    files: Express.Multer.File[],
    documentType: string,
  ) {
    const profile = await this.employeeRepo.findByUserId(userId);
    if (!profile) {
      throw ApiError.notFound('Employee not found', 'EMPLOYEE_NOT_FOUND');
    }

    const saved = [];
    for (const file of files) {
      const extension = path.extname(file.originalname).toLowerCase();
      const storedFileName = file.filename || `${randomUUID()}${extension}`;
      let filePath: string;
      if (process.env.VERCEL) {
        if (!process.env.BLOB_READ_WRITE_TOKEN) {
          throw ApiError.internal(
            'Document storage is not configured. Connect Vercel Blob and add BLOB_READ_WRITE_TOKEN.',
            'BLOB_STORAGE_NOT_CONFIGURED',
          );
        }
        const blob = await put(
          `employee-documents/${userId}/${randomUUID()}${extension}`,
          file.buffer,
          { access: 'public', contentType: file.mimetype, addRandomSuffix: false },
        );
        filePath = blob.url;
      } else {
        filePath = `${UPLOAD_REL}/${storedFileName}`;
      }
      const record = await this.docRepo.create({
        userId,
        documentType: documentType || 'Other',
        originalName: file.originalname,
        fileName: storedFileName,
        mimeType: file.mimetype,
        size: file.size,
        filePath,
      });
      saved.push(this.formatRecord(record));
    }

    return saved;
  }

  async deleteDocument(id: string) {
    const record = await this.docRepo.findById(id);
    if (!record) {
      throw ApiError.notFound('Document not found', 'DOCUMENT_NOT_FOUND');
    }

    if (record.filePath.startsWith('http')) {
      await del(record.filePath).catch(() => undefined);
    } else {
      const fullPath = getUploadPath('documents', path.basename(record.filePath));
      try { if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath); } catch { /* ignore */ }
    }

    await this.docRepo.deleteById(id);
  }

  async getFile(id: string): Promise<{ buffer: Buffer; mimeType: string; originalName: string }> {
    const record = await this.docRepo.findById(id);
    if (!record) throw ApiError.notFound('Document not found', 'DOCUMENT_NOT_FOUND');

    if (record.filePath.startsWith('http')) {
      const response = await fetch(record.filePath);
      if (!response.ok) throw ApiError.notFound('Stored document file not found', 'DOCUMENT_FILE_NOT_FOUND');
      return {
        buffer: Buffer.from(await response.arrayBuffer()),
        mimeType: record.mimeType,
        originalName: record.originalName,
      };
    }

    const fullPath = getUploadPath('documents', path.basename(record.filePath));
    if (!fs.existsSync(fullPath)) {
      throw ApiError.notFound(
        'This document was stored in temporary server storage and is no longer available. Please upload it again.',
        'LEGACY_DOCUMENT_UNAVAILABLE',
      );
    }
    return { buffer: fs.readFileSync(fullPath), mimeType: record.mimeType, originalName: record.originalName };
  }

  private formatRecord(r: any) {
    return {
      id: r.id,
      userId: r.userId,
      documentType: r.documentType,
      originalName: r.originalName,
      fileName: r.fileName,
      mimeType: r.mimeType,
      size: r.size,
      filePath: r.filePath,
      employeeName: r.user
        ? `${r.user.firstName} ${r.user.lastName}`
        : '',
      empId: r.user?.empId || '',
      email: r.user?.email || '',
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  }
}

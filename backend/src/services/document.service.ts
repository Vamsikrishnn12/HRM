import path from 'path';
import fs from 'fs';
import { DocumentRepository } from '../repositories/document.repository';

/** Relative path usable as a URL segment — works across OS and in production */
const UPLOAD_REL = 'uploads/documents';
import { EmployeeRepository } from '../repositories/employee.repository';
import { ApiError } from '../utils/apiError';

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
      const record = await this.docRepo.create({
        userId,
        documentType: documentType || 'Other',
        originalName: file.originalname,
        fileName: file.filename,
        mimeType: file.mimetype,
        size: file.size,
        filePath: `${UPLOAD_REL}/${file.filename}`,
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

    // Resolve the relative stored path against project root
    const fullPath = path.resolve(record.filePath);
    try { if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath); } catch { /* ignore */ }

    await this.docRepo.deleteById(id);
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

import { Request, Response } from 'express';
import { DocumentService } from '../services/document.service';
import { ApiResponse } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';
import { NotificationService } from '../services/notification.service';

const documentService = new DocumentService();
const notificationService = new NotificationService();

export class DocumentController {
  static async list(_req: Request, res: Response): Promise<void> {
    const result = await documentService.listAll();
    ApiResponse.success(res, 'Documents retrieved', result);
  }

  static async getByUserId(req: Request, res: Response): Promise<void> {
    const userId = req.params.userId as string;
    const result = await documentService.getByUserId(userId);
    ApiResponse.success(res, 'Documents retrieved', result);
  }

  static async upload(req: Request, res: Response): Promise<void> {
    const userId = req.params.userId as string;
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      throw ApiError.badRequest('No files uploaded', 'NO_FILES');
    }
    const documentType = (req.body.documentType as string) || 'Other';
    const result = await documentService.upload(userId, files, documentType);
    await notificationService.notifyUser(userId, 'DOCUMENTS_UPDATED', 'Employee documents updated', `HR uploaded ${documentType} document${files.length > 1 ? 's' : ''} to your record.`, '/employee/profile')
      .catch((err) => console.error('Failed to create document notification', err.message));
    ApiResponse.success(res, 'Documents uploaded', result);
  }

  static async remove(req: Request, res: Response): Promise<void> {
    const id = req.params.id as string;
    await documentService.deleteDocument(id);
    ApiResponse.success(res, 'Document deleted', null);
  }

  static async view(req: Request, res: Response): Promise<void> {
    const file = await documentService.getFile(req.params.id as string);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.originalName)}"`);
    res.send(file.buffer);
  }

  static async download(req: Request, res: Response): Promise<void> {
    const file = await documentService.getFile(req.params.id as string);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalName)}"`);
    res.send(file.buffer);
  }
}

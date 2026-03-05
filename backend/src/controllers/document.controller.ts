import { Request, Response } from 'express';
import { DocumentService } from '../services/document.service';
import { ApiResponse } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';

const documentService = new DocumentService();

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
    ApiResponse.success(res, 'Documents uploaded', result);
  }

  static async remove(req: Request, res: Response): Promise<void> {
    const id = req.params.id as string;
    await documentService.deleteDocument(id);
    ApiResponse.success(res, 'Document deleted', null);
  }
}

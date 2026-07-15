import { Request, Response } from 'express';
import { NotificationService } from '../services/notification.service';
import { ApiResponse } from '../utils/apiResponse';

const notificationService = new NotificationService();

export class NotificationController {
  static async list(req: Request, res: Response): Promise<void> {
    const result = await notificationService.list(req.user!.userId, Number(req.query.limit) || 20);
    ApiResponse.success(res, 'Notifications retrieved', result);
  }

  static async markRead(req: Request, res: Response): Promise<void> {
    const result = await notificationService.markRead(req.params.id as string, req.user!.userId);
    ApiResponse.success(res, 'Notification marked as read', result);
  }

  static async markAllRead(req: Request, res: Response): Promise<void> {
    await notificationService.markAllRead(req.user!.userId);
    ApiResponse.success(res, 'All notifications marked as read', null);
  }
}

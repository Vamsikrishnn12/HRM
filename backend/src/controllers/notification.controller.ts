import { Request, Response } from 'express';
import { NotificationService } from '../services/notification.service';
import { ApiResponse } from '../utils/apiResponse';
import { z } from 'zod';
import { ApiError } from '../utils/apiError';
import { PushNotificationService } from '../services/pushNotification.service';

const notificationService = new NotificationService();
const pushService = new PushNotificationService();
const subscriptionSchema = z.object({
  endpoint: z.string().url().max(4000),
  keys: z.object({ p256dh: z.string().min(1), auth: z.string().min(1) }),
});

export class NotificationController {
  static async pushConfig(_req: Request, res: Response): Promise<void> {
    ApiResponse.success(res, 'Push notification configuration retrieved', pushService.getPublicConfig());
  }

  static async subscribe(req: Request, res: Response): Promise<void> {
    const parsed = subscriptionSchema.safeParse(req.body);
    if (!parsed.success) throw ApiError.badRequest('Invalid push subscription', 'INVALID_PUSH_SUBSCRIPTION');
    await pushService.subscribe(req.user!.userId, parsed.data, req.get('user-agent'));
    ApiResponse.success(res, 'Push notifications enabled', { subscribed: true });
  }

  static async unsubscribe(req: Request, res: Response): Promise<void> {
    const endpoint = z.string().url().safeParse(req.body?.endpoint);
    if (!endpoint.success) throw ApiError.badRequest('Invalid push endpoint', 'INVALID_PUSH_ENDPOINT');
    await pushService.unsubscribe(req.user!.userId, endpoint.data);
    ApiResponse.success(res, 'Push notifications disabled', { subscribed: false });
  }
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

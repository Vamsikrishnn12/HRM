import { AppDataSource } from '../config/database';
import { Notification } from '../entities/Notification.entity';
import { User, UserRole } from '../entities/User.entity';
import { ApiError } from '../utils/apiError';

export interface CreateNotificationInput {
  recipientId: string;
  type: string;
  title: string;
  message: string;
  actionUrl?: string | null;
}

export class NotificationService {
  private get repo() {
    return AppDataSource.getRepository(Notification);
  }

  async create(input: CreateNotificationInput) {
    return this.repo.save(this.repo.create({ ...input, actionUrl: input.actionUrl || null }));
  }

  async notifyUser(recipientId: string, type: string, title: string, message: string, actionUrl?: string) {
    return this.create({ recipientId, type, title, message, actionUrl });
  }

  async notifyAdmins(type: string, title: string, message: string, actionUrl?: string) {
    const admins = await AppDataSource.getRepository(User).find({
      where: { role: UserRole.ADMIN, isActive: true },
      select: ['id'],
    });
    if (!admins.length) return [];
    return this.repo.save(admins.map((admin) => this.repo.create({
      recipientId: admin.id,
      type,
      title,
      message,
      actionUrl: actionUrl || null,
    })));
  }

  async list(recipientId: string, limit = 20) {
    const [items, unreadCount] = await Promise.all([
      this.repo.find({
        where: { recipientId },
        order: { createdAt: 'DESC' },
        take: Math.min(Math.max(limit, 1), 50),
      }),
      this.repo.count({ where: { recipientId, isRead: false } }),
    ]);
    return { items, unreadCount };
  }

  async markRead(id: string, recipientId: string) {
    const notification = await this.repo.findOne({ where: { id, recipientId } });
    if (!notification) throw ApiError.notFound('Notification not found');
    if (!notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();
      await this.repo.save(notification);
    }
    return notification;
  }

  async markAllRead(recipientId: string) {
    await this.repo.createQueryBuilder()
      .update(Notification)
      .set({ isRead: true, readAt: new Date() })
      .where('"recipientId" = :recipientId AND "isRead" = false', { recipientId })
      .execute();
  }
}

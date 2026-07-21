import webPush from 'web-push';
import { AppDataSource } from '../config/database';
import { env } from '../config/env';
import { PushSubscription } from '../entities/PushSubscription.entity';

export interface BrowserPushSubscription {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export interface PushPayload {
  title: string;
  message: string;
  actionUrl?: string | null;
  notificationId?: string;
  type?: string;
}

export class PushNotificationService {
  private get repo() {
    return AppDataSource.getRepository(PushSubscription);
  }

  isConfigured(): boolean {
    return Boolean(env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY);
  }

  getPublicConfig() {
    return { configured: this.isConfigured(), publicKey: env.VAPID_PUBLIC_KEY || null };
  }

  private configure(): boolean {
    if (!this.isConfigured()) return false;
    webPush.setVapidDetails(
      env.VAPID_SUBJECT || `mailto:${env.ADMIN_EMAIL}`,
      env.VAPID_PUBLIC_KEY!,
      env.VAPID_PRIVATE_KEY!,
    );
    return true;
  }

  async subscribe(userId: string, subscription: BrowserPushSubscription, userAgent?: string) {
    const existing = await this.repo.findOne({ where: { endpoint: subscription.endpoint } });
    const record = existing || this.repo.create();
    record.userId = userId;
    record.endpoint = subscription.endpoint;
    record.p256dh = subscription.keys.p256dh;
    record.auth = subscription.keys.auth;
    record.userAgent = userAgent?.slice(0, 500) || null;
    return this.repo.save(record);
  }

  async unsubscribe(userId: string, endpoint: string): Promise<void> {
    await this.repo.delete({ userId, endpoint });
  }

  async sendToUser(userId: string, payload: PushPayload): Promise<void> {
    if (!this.configure()) return;
    const subscriptions = await this.repo.find({ where: { userId } });
    if (!subscriptions.length) return;

    await Promise.allSettled(subscriptions.map(async (subscription) => {
      try {
        await webPush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
          },
          JSON.stringify(payload),
          { TTL: 60 * 60 * 24, urgency: 'high' },
        );
      } catch (error: any) {
        if (error?.statusCode === 404 || error?.statusCode === 410) {
          await this.repo.delete(subscription.id);
          return;
        }
        console.error('Push notification delivery failed', error?.message || error);
      }
    }));
  }
}

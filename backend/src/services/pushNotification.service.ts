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

export interface PushDeliveryResult {
  configured: boolean;
  subscriptions: number;
  delivered: number;
  expired: number;
  failed: number;
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

  async getStatus(userId: string) {
    const subscriptionCount = await this.repo.count({ where: { userId } });
    return { configured: this.isConfigured(), subscriptionCount, enabled: this.isConfigured() && subscriptionCount > 0 };
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

  async sendToUser(userId: string, payload: PushPayload): Promise<PushDeliveryResult> {
    if (!this.configure()) return { configured: false, subscriptions: 0, delivered: 0, expired: 0, failed: 0 };
    const subscriptions = await this.repo.find({ where: { userId } });
    const result: PushDeliveryResult = {
      configured: true,
      subscriptions: subscriptions.length,
      delivered: 0,
      expired: 0,
      failed: 0,
    };
    if (!subscriptions.length) return result;

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
        result.delivered += 1;
      } catch (error: any) {
        if (error?.statusCode === 404 || error?.statusCode === 410) {
          await this.repo.delete(subscription.id);
          result.expired += 1;
          return;
        }
        result.failed += 1;
        console.error('Push notification delivery failed', error?.message || error);
      }
    }));
    return result;
  }
}

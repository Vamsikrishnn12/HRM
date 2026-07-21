import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
router.use(authMiddleware);
router.get('/push/config', asyncHandler(NotificationController.pushConfig));
router.get('/push/status', asyncHandler(NotificationController.pushStatus));
router.post('/push/test', asyncHandler(NotificationController.testPush));
router.post('/push/subscribe', asyncHandler(NotificationController.subscribe));
router.post('/push/unsubscribe', asyncHandler(NotificationController.unsubscribe));
router.get('/', asyncHandler(NotificationController.list));
router.patch('/read-all', asyncHandler(NotificationController.markAllRead));
router.patch('/:id/read', asyncHandler(NotificationController.markRead));
export default router;

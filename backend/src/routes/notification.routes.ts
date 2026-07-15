import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
router.use(authMiddleware);
router.get('/', asyncHandler(NotificationController.list));
router.patch('/read-all', asyncHandler(NotificationController.markAllRead));
router.patch('/:id/read', asyncHandler(NotificationController.markRead));
export default router;

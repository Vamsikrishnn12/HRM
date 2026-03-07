import { Router } from 'express';
import { ProfileController } from '../controllers/profile.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// All profile routes require authentication (any role)
router.use(authMiddleware);

router.get('/me', asyncHandler(ProfileController.getMe));
router.patch('/me', asyncHandler(ProfileController.updateMe));
router.post('/change-password', asyncHandler(ProfileController.changePassword));

export default router;

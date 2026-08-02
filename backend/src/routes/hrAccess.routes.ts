import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { roleMiddleware } from '../middlewares/role.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { HrAccessController } from '../controllers/hrAccess.controller';

const router = Router();
// Exact ADMIN-only guard: HR delegates must never manage other administrators.
router.use(authMiddleware, roleMiddleware('MAIN_ADMIN'));
router.get('/', asyncHandler(HrAccessController.list));
router.post('/', asyncHandler(HrAccessController.grant));
router.post('/:id/revoke', asyncHandler(HrAccessController.revoke));
export default router;

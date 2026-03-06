import { Router } from 'express';
import { LeaveController } from '../controllers/leave.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { roleMiddleware } from '../middlewares/role.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// All leave routes require authentication
router.use(authMiddleware);

// ══════════════════════════════════════════════════════
//  Employee Routes
// ══════════════════════════════════════════════════════

router.get('/me/summary', asyncHandler(LeaveController.getMySummary));
router.get('/me/policies', asyncHandler(LeaveController.getMyPolicies));
router.get('/me/history', asyncHandler(LeaveController.getMyHistory));
router.post('/me/apply', asyncHandler(LeaveController.applyLeave));
router.patch('/me/:id/cancel', asyncHandler(LeaveController.cancelLeave));

// ══════════════════════════════════════════════════════
//  Admin Routes
// ══════════════════════════════════════════════════════

router.get(
  '/admin/requests',
  roleMiddleware('ADMIN'),
  asyncHandler(LeaveController.getAdminRequests),
);

router.get(
  '/admin/requests/:id',
  roleMiddleware('ADMIN'),
  asyncHandler(LeaveController.getAdminRequestDetail),
);

router.patch(
  '/admin/requests/:id/approve',
  roleMiddleware('ADMIN'),
  asyncHandler(LeaveController.approveRequest),
);

router.patch(
  '/admin/requests/:id/reject',
  roleMiddleware('ADMIN'),
  asyncHandler(LeaveController.rejectRequest),
);

router.patch(
  '/admin/requests/:id/override',
  roleMiddleware('ADMIN'),
  asyncHandler(LeaveController.overrideRequest),
);

// ── Policy Management (Admin) ──

router.get(
  '/admin/policies',
  roleMiddleware('ADMIN'),
  asyncHandler(LeaveController.getPolicy),
);

router.put(
  '/admin/policies',
  roleMiddleware('ADMIN'),
  asyncHandler(LeaveController.updatePolicy),
);

export default router;

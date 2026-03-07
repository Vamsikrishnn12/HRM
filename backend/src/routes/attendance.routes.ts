import { Router } from 'express';
import { AttendanceController } from '../controllers/attendance.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { roleMiddleware } from '../middlewares/role.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// ── Employee attendance routes ──
router.get('/me/today', asyncHandler(AttendanceController.getMyToday));
router.post('/me/start-work', asyncHandler(AttendanceController.startWork));
router.post('/me/end-work', asyncHandler(AttendanceController.endWork));
router.get('/me/history', asyncHandler(AttendanceController.getMyHistory));

// ── Admin attendance routes ──
router.get(
  '/admin',
  roleMiddleware('ADMIN'),
  asyncHandler(AttendanceController.getAdminAttendance),
);

router.get(
  '/admin/:employeeId',
  roleMiddleware('ADMIN'),
  asyncHandler(AttendanceController.getAdminEmployeeAttendance),
);

router.patch(
  '/admin/:employeeId/status',
  roleMiddleware('ADMIN'),
  asyncHandler(AttendanceController.overrideStatus),
);

router.patch(
  '/admin/:employeeId/manual-entry',
  roleMiddleware('ADMIN'),
  asyncHandler(AttendanceController.manualEntry),
);

router.patch(
  '/admin/:employeeId/re-enable-start-work',
  roleMiddleware('ADMIN'),
  asyncHandler(AttendanceController.reEnableStartWork),
);

export default router;

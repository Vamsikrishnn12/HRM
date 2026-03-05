import { Router } from 'express';
import { SalaryDetailsController } from '../controllers/salaryDetails.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { roleMiddleware } from '../middlewares/role.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.use(authMiddleware, roleMiddleware('ADMIN'));

/**
 * @swagger
 * /api/salary-details:
 *   get:
 *     tags: [SalaryDetails]
 *     summary: List all salary details records
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Salary details list
 */
router.get('/', asyncHandler(SalaryDetailsController.list));

/**
 * @swagger
 * /api/salary-details/user/{userId}:
 *   get:
 *     tags: [SalaryDetails]
 *     summary: Get salary details by user ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Salary details
 *       404:
 *         description: Not found
 */
router.get('/user/:userId', asyncHandler(SalaryDetailsController.getByUserId));

/**
 * @swagger
 * /api/salary-details/user/{userId}:
 *   put:
 *     tags: [SalaryDetails]
 *     summary: Create or update salary details for an employee
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Salary details saved
 */
router.put('/user/:userId', asyncHandler(SalaryDetailsController.save));

/**
 * @swagger
 * /api/salary-details/{id}:
 *   get:
 *     tags: [SalaryDetails]
 *     summary: Get salary details by record ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Salary details
 *       404:
 *         description: Not found
 */
router.get('/:id', asyncHandler(SalaryDetailsController.getById));

/**
 * @swagger
 * /api/salary-details/{id}:
 *   patch:
 *     tags: [SalaryDetails]
 *     summary: Update salary details by record ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Salary details updated
 *       404:
 *         description: Not found
 */
router.patch('/:id', asyncHandler(SalaryDetailsController.update));

export default router;

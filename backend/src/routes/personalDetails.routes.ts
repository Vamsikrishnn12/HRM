import { Router } from 'express';
import { PersonalDetailsController } from '../controllers/personalDetails.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { roleMiddleware } from '../middlewares/role.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/me', authMiddleware, roleMiddleware('EMPLOYEE'), asyncHandler(PersonalDetailsController.getMe));
router.put('/me', authMiddleware, roleMiddleware('EMPLOYEE'), asyncHandler(PersonalDetailsController.saveMe));

router.use(authMiddleware, roleMiddleware('ADMIN'));

/**
 * @swagger
 * /api/personal-details:
 *   get:
 *     tags: [PersonalDetails]
 *     summary: List all personal details records
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Personal details list
 */
router.get('/', asyncHandler(PersonalDetailsController.list));

/**
 * @swagger
 * /api/personal-details/user/{userId}:
 *   get:
 *     tags: [PersonalDetails]
 *     summary: Get personal details by user ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Personal details
 *       404:
 *         description: Not found
 */
router.get('/user/:userId', asyncHandler(PersonalDetailsController.getByUserId));

/**
 * @swagger
 * /api/personal-details/user/{userId}:
 *   put:
 *     tags: [PersonalDetails]
 *     summary: Create or update personal details for an employee
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
 *         description: Personal details saved
 */
router.put('/user/:userId', asyncHandler(PersonalDetailsController.save));

/**
 * @swagger
 * /api/personal-details/{id}:
 *   get:
 *     tags: [PersonalDetails]
 *     summary: Get personal details by record ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Personal details
 *       404:
 *         description: Not found
 */
router.get('/:id', asyncHandler(PersonalDetailsController.getById));

/**
 * @swagger
 * /api/personal-details/{id}:
 *   patch:
 *     tags: [PersonalDetails]
 *     summary: Update personal details by record ID
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
 *         description: Personal details updated
 *       404:
 *         description: Not found
 */
router.patch('/:id', asyncHandler(PersonalDetailsController.update));

export default router;

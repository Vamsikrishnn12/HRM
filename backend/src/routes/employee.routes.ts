import { Router } from 'express';
import { EmployeeController } from '../controllers/employee.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { roleMiddleware } from '../middlewares/role.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// All employee routes require ADMIN role
router.use(authMiddleware, roleMiddleware('ADMIN'));

/**
 * @swagger
 * /api/employees:
 *   post:
 *     tags: [Employees]
 *     summary: Create a new employee
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [firstName, lastName, email, department, designation, employmentType, dateOfJoining, reportingManager, shiftSchedule]
 *             properties:
 *               firstName: { type: string }
 *               lastName: { type: string }
 *               email: { type: string, format: email }
 *               department: { type: string }
 *               designation: { type: string }
 *               employmentType: { type: string }
 *               dateOfJoining: { type: string, format: date }
 *               reportingManager: { type: string }
 *               shiftSchedule: { type: string }
 *               allowLoginOnlyInsideOffice: { type: boolean }
 *               officeLatitude: { type: number }
 *               officeLongitude: { type: number }
 *               officeRadiusMeters: { type: number }
 *     responses:
 *       201:
 *         description: Employee created
 *       400:
 *         description: Validation error
 *       409:
 *         description: Duplicate email
 */
router.post('/', asyncHandler(EmployeeController.create));

/**
 * @swagger
 * /api/employees:
 *   get:
 *     tags: [Employees]
 *     summary: List all employees
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Employees list
 */
router.get('/', asyncHandler(EmployeeController.list));

/**
 * @swagger
 * /api/employees/dropdown:
 *   get:
 *     tags: [Employees]
 *     summary: Get employee dropdown list
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Employee dropdown list
 */
router.get('/dropdown', asyncHandler(EmployeeController.dropdown));

/**
 * @swagger
 * /api/employees/{id}:
 *   get:
 *     tags: [Employees]
 *     summary: Get employee by profile ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Employee details
 *       404:
 *         description: Not found
 */
router.get('/:id', asyncHandler(EmployeeController.getById));

/**
 * @swagger
 * /api/employees/{id}:
 *   patch:
 *     tags: [Employees]
 *     summary: Update employee
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
 *             properties:
 *               isActive: { type: boolean }
 *               officeLocationRequired: { type: boolean }
 *               officeLatitude: { type: number }
 *               officeLongitude: { type: number }
 *               officeRadiusMeters: { type: number }
 *               department: { type: string }
 *               designation: { type: string }
 *     responses:
 *       200:
 *         description: Employee updated
 *       404:
 *         description: Not found
 */
router.patch('/:id', asyncHandler(EmployeeController.update));

export default router;

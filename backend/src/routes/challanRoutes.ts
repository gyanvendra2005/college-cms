import { Router } from 'express';
import {
  getChallans,
  getChallanById,
  createChallan,
  confirmChallan,
  cancelChallan,
} from '../controllers/challanController';
import { authenticateJWT } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { validateBody } from '../middleware/validation';
import { createChallanSchema } from '../schemas/challanSchema';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticateJWT);

// View challans (Sales, Accounts, Admin, Warehouse)
router.get('/', getChallans);
router.get('/:id', getChallanById);

// Create challan (Sales, Admin)
router.post(
  '/',
  requireRole(Role.SALES, Role.ADMIN),
  validateBody(createChallanSchema),
  createChallan
);

// Confirm challan (Sales, Admin)
router.patch('/:id/confirm', requireRole(Role.SALES, Role.ADMIN), confirmChallan);

// Cancel challan (Admin only, or Sales manager logic)
router.patch('/:id/cancel', requireRole(Role.ADMIN, Role.SALES), cancelChallan);

export default router;

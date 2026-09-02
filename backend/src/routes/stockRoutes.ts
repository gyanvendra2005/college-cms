import { Router } from 'express';
import { adjustStock, getStockMovements } from '../controllers/stockController';
import { authenticateJWT } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { validateBody } from '../middleware/validation';
import { stockAdjustmentSchema } from '../schemas/stockSchema';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticateJWT);

// View stock movements is accessible to all except Sales (unless granted by admin)
router.get('/', requireRole(Role.WAREHOUSE, Role.ACCOUNTS, Role.ADMIN), getStockMovements);

// Only warehouse and admin can manually adjust stock
router.post(
  '/adjust',
  requireRole(Role.WAREHOUSE, Role.ADMIN),
  validateBody(stockAdjustmentSchema),
  adjustStock
);

export default router;

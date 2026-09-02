import { Router } from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  getLowStockAlerts,
  getCategories,
} from '../controllers/productController';
import { authenticateJWT } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { validateBody } from '../middleware/validation';
import { createProductSchema, updateProductSchema } from '../schemas/productSchema';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticateJWT);

// Viewing products is accessible by all authenticated roles
router.get('/', getProducts);
router.get('/categories', getCategories);
router.get('/low-stock', getLowStockAlerts);
router.get('/:id', getProductById);

// Product creation and editing (Warehouse & Admin)
router.post(
  '/',
  requireRole(Role.WAREHOUSE),
  validateBody(createProductSchema),
  createProduct
);

router.put(
  '/:id',
  requireRole(Role.WAREHOUSE),
  validateBody(updateProductSchema),
  updateProduct
);

export default router;

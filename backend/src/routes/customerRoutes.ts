import { Router } from 'express';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  addCustomerNote,
  deleteCustomer,
} from '../controllers/customerController';
import { authenticateJWT } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { validateBody } from '../middleware/validation';
import {
  createCustomerSchema,
  updateCustomerSchema,
  addCustomerNoteSchema,
} from '../schemas/customerSchema';
import { Role } from '@prisma/client';

const router = Router();

// All customer routes require authentication
router.use(authenticateJWT);

// View customers is accessible by ADMIN, SALES, ACCOUNTS
router.get('/', requireRole(Role.SALES, Role.ACCOUNTS, Role.WAREHOUSE), getCustomers);
router.get('/:id', requireRole(Role.SALES, Role.ACCOUNTS, Role.WAREHOUSE), getCustomerById);

// Create / Edit customer can be done by SALES & ADMIN
router.post(
  '/',
  requireRole(Role.SALES),
  validateBody(createCustomerSchema),
  createCustomer
);

router.put(
  '/:id',
  requireRole(Role.SALES),
  validateBody(updateCustomerSchema),
  updateCustomer
);

// Add follow-up note (Sales & Admin)
router.post(
  '/:id/notes',
  requireRole(Role.SALES),
  validateBody(addCustomerNoteSchema),
  addCustomerNote
);

// Delete customer (Admin only)
router.delete('/:id', requireRole(Role.ADMIN), deleteCustomer);

export default router;

import { Router } from 'express';
import { login, getMe, getUsers } from '../controllers/authController';
import { authenticateJWT } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { validateBody } from '../middleware/validation';
import { loginSchema } from '../schemas/authSchema';
import { Role } from '@prisma/client';

const router = Router();

router.post('/login', validateBody(loginSchema), login);
router.get('/me', authenticateJWT, getMe);
router.get('/users', authenticateJWT, requireRole(Role.ADMIN), getUsers);

export default router;

import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboardController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT);

router.get('/metrics', getDashboardStats);

export default router;

import express from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import digitalLibraryManagementRoutes from './shared/digital-library-management.routes';

const router = express.Router();

router.use(authenticate);
router.use(authorize('ADMIN', 'SUPER_ADMIN'));
router.use(digitalLibraryManagementRoutes);

export default router;

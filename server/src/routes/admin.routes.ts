import { Router } from 'express';
import * as admin from '../controllers/admin.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { updateUserSchema } from '../validators/payment.validator';

const router = Router();

router.use(authenticate, authorize('admin'));
router.get('/stats', admin.getStats);
router.get('/analytics', admin.getAnalytics);
router.get('/users', admin.listUsers);
router.get('/users/:userId', admin.getUserDetail);
router.patch('/users/:userId', validate({ body: updateUserSchema }), admin.updateUser);

export default router;

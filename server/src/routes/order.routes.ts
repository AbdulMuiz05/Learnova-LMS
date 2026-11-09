import { Router } from 'express';
import * as orders from '../controllers/order.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/my', authenticate, orders.getMyOrders);
router.get('/totals', authenticate, orders.getOrderTotals);
router.get('/admin/all', authenticate, authorize('admin'), orders.listAdminOrders);
router.get('/admin/export', authenticate, authorize('admin'), orders.exportOrdersCsv);
router.get('/:orderId', authenticate, orders.getOrderById);

export default router;

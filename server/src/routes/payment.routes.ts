import { Router } from 'express';
import * as payments from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth';
import { checkoutLimiter } from '../middleware/rateLimit';
import { validate } from '../middleware/validate';
import { checkoutSchema, demoConfirmSchema } from '../validators/payment.validator';

const router = Router();

router.get('/config', payments.getPaymentConfig);
router.post(
  '/checkout',
  authenticate,
  checkoutLimiter,
  validate({ body: checkoutSchema }),
  payments.createCheckout
);
router.post(
  '/demo/confirm',
  authenticate,
  checkoutLimiter,
  validate({ body: demoConfirmSchema }),
  payments.confirmDemoPayment
);

export default router;

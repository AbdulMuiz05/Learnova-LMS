import { Router } from 'express';
import * as reviews from '../controllers/review.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { reviewReplySchema, reviewSchema } from '../validators/engagement.validator';

const router = Router();

router.get('/course/:courseId', reviews.listCourseReviews);
router.post(
  '/course/:courseId',
  authenticate,
  validate({ body: reviewSchema }),
  reviews.createReview
);
router.get('/admin/all', authenticate, authorize('admin'), reviews.listAdminReviews);
router.patch(
  '/:reviewId/reply',
  authenticate,
  authorize('admin'),
  validate({ body: reviewReplySchema }),
  reviews.replyToReview
);
router.delete('/:reviewId', authenticate, reviews.deleteReview);

export default router;

import { Router } from 'express';
import * as enrollments from '../controllers/enrollment.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/my', authenticate, enrollments.getMyEnrollments);
router.get('/course/:courseId', authenticate, enrollments.getCourseProgress);
router.get('/:enrollmentId', authenticate, enrollments.getEnrollmentById);

export default router;

import { Router } from 'express';
import * as courses from '../controllers/course.controller';
import { authenticate, authorize, optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { uploadImage } from '../middleware/upload';
import {
  courseQuerySchema,
  createCourseSchema,
  publishCourseSchema,
  updateCourseSchema,
} from '../validators/course.validator';

const router = Router();

router.get('/', validate({ query: courseQuerySchema }), courses.listCourses);
router.get('/admin/all', authenticate, authorize('admin'), courses.listAdminCourses);
router.get('/:id/stats', authenticate, authorize('admin'), courses.getCourseStats);
router.get('/:slug', optionalAuth, courses.getCourseBySlug);

router.post(
  '/',
  authenticate,
  authorize('admin'),
  validate({ body: createCourseSchema }),
  courses.createCourse
);
router.patch(
  '/:id',
  authenticate,
  authorize('admin'),
  validate({ body: updateCourseSchema }),
  courses.updateCourse
);
router.delete('/:id', authenticate, authorize('admin'), courses.deleteCourse);
router.patch(
  '/:id/status',
  authenticate,
  authorize('admin'),
  validate({ body: publishCourseSchema }),
  courses.setCourseStatus
);
router.post(
  '/:id/thumbnail',
  authenticate,
  authorize('admin'),
  uploadImage,
  courses.uploadCourseThumbnail
);

export default router;

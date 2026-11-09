import { Router } from 'express';
import * as curriculum from '../controllers/curriculum.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  lessonSchema,
  reorderSchema,
  sectionSchema,
  updateLessonSchema,
} from '../validators/course.validator';

const router = Router();

router.get(
  '/courses/:courseId/curriculum',
  authenticate,
  authorize('admin'),
  curriculum.getAdminCurriculum
);

router.post(
  '/courses/:courseId/sections',
  authenticate,
  authorize('admin'),
  validate({ body: sectionSchema }),
  curriculum.createSection
);
router.put(
  '/courses/:courseId/sections/reorder',
  authenticate,
  authorize('admin'),
  validate({ body: reorderSchema }),
  curriculum.reorderSections
);
router.patch(
  '/sections/:sectionId',
  authenticate,
  authorize('admin'),
  validate({ body: sectionSchema.partial() }),
  curriculum.updateSection
);
router.delete('/sections/:sectionId', authenticate, authorize('admin'), curriculum.deleteSection);

router.post(
  '/sections/:sectionId/lessons',
  authenticate,
  authorize('admin'),
  validate({ body: lessonSchema }),
  curriculum.createLesson
);
router.patch(
  '/lessons/:lessonId',
  authenticate,
  authorize('admin'),
  validate({ body: updateLessonSchema }),
  curriculum.updateLesson
);
router.delete('/lessons/:lessonId', authenticate, authorize('admin'), curriculum.deleteLesson);
router.put(
  '/courses/:courseId/lessons/reorder',
  authenticate,
  authorize('admin'),
  validate({ body: reorderSchema }),
  curriculum.reorderLessons
);

router.get('/lessons/:lessonId/content', authenticate, curriculum.getLessonContent);
router.post('/lessons/:lessonId/complete', authenticate, curriculum.completeLesson);
router.get('/courses/:courseId/learn', authenticate, curriculum.getLearnCourse);

export default router;

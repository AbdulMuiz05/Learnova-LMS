import { Router } from 'express';
import * as questions from '../controllers/question.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { answerSchema, questionSchema } from '../validators/engagement.validator';

const router = Router();

router.get('/admin/all', authenticate, authorize('admin'), questions.listAdminQuestions);
router.get('/course/:courseId', authenticate, questions.listCourseQuestions);
router.get('/lesson/:lessonId', authenticate, questions.listLessonQuestions);
router.post('/', authenticate, validate({ body: questionSchema }), questions.askQuestion);
router.post(
  '/:questionId/answers',
  authenticate,
  authorize('admin'),
  validate({ body: answerSchema }),
  questions.answerQuestion
);
router.patch('/:questionId/resolve', authenticate, authorize('admin'), questions.resolveQuestion);

export default router;

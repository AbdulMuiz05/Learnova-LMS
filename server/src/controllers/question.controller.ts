import { Request, Response } from 'express';
import { Question } from '../models/Question';
import { Lesson } from '../models/Lesson';
import { Course } from '../models/Course';
import { Enrollment } from '../models/Enrollment';
import { User } from '../models/User';
import { ApiError } from '../utils/ApiError';
import { asyncHandler, sendSuccess } from '../utils/response';
import { parsePagination, paginationMeta } from '../utils/pagination';
import { notifyAdmins, notifyUser } from '../services/notification.service';
import { sendAnswerEmail } from '../services/email.service';

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function assertCourseAccess(userId: string, courseId: unknown, role: string) {
  if (role === 'admin') return;
  const enrolled = await Enrollment.exists({ user: userId, course: courseId });
  if (!enrolled) throw ApiError.forbidden('Enroll in this course to join the discussion', 'NOT_ENROLLED');
}

export const listLessonQuestions = asyncHandler(async (req: Request, res: Response) => {
  const lesson = await Lesson.findById(req.params.lessonId).select('course title').lean();
  if (!lesson) throw ApiError.notFound('Lesson not found', 'LESSON_NOT_FOUND');
  await assertCourseAccess(String(req.user!._id), lesson.course, req.user!.role);

  const pagination = parsePagination(req, 20);
  const [items, total] = await Promise.all([
    Question.find({ lesson: lesson._id })
      .populate('user', 'name avatar role')
      .populate('answers.user', 'name avatar role')
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean(),
    Question.countDocuments({ lesson: lesson._id }),
  ]);
  sendSuccess(res, { items, meta: paginationMeta(total, pagination.page, pagination.limit) });
});

export const askQuestion = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const { lessonId, content } = req.body as { lessonId: string; content: string };
  const lesson = await Lesson.findById(lessonId).select('course title').lean();
  if (!lesson) throw ApiError.notFound('Lesson not found', 'LESSON_NOT_FOUND');

  const enrolled = await Enrollment.exists({ user: user._id, course: lesson.course });
  if (!enrolled) throw ApiError.forbidden('Enroll in this course to ask questions', 'NOT_ENROLLED');

  const question = await Question.create({
    user: user._id,
    course: lesson.course,
    lesson: lesson._id,
    content,
  });

  const course = await Course.findById(lesson.course).select('title').lean();
  notifyAdmins({
    type: 'question',
    title: 'New student question',
    message: `${user.name} asked a question in "${course?.title ?? 'a course'}" · ${lesson.title}`,
    link: '/admin/questions',
    meta: { questionId: String(question._id), lessonId: String(lesson._id) },
  }).catch(() => undefined);

  const populated = await question.populate('user', 'name avatar role');
  sendSuccess(res, { question: populated }, 'Question submitted', 201);
});

export const answerQuestion = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const question = await Question.findById(req.params.questionId);
  if (!question) throw ApiError.notFound('Question not found', 'QUESTION_NOT_FOUND');

  question.answers.push({
    user: user._id,
    content: req.body.content,
    isAdmin: true,
    createdAt: new Date(),
  });
  question.isResolved = true;
  await question.save();

  const course = await Course.findById(question.course).select('title slug').lean();
  const student = await User.findById(question.user).select('name email').lean();
  if (student) {
    notifyUser(student._id, {
      type: 'question',
      title: 'Instructor answered your question',
      message: `Your question in "${course?.title ?? 'a course'}" has a new reply.`,
      link: `/learn/${question.course}?lesson=${question.lesson}`,
    }).catch(() => undefined);
    sendAnswerEmail(student.email, student.name, question.content).catch(() => undefined);
  }

  const populated = await question.populate([
    { path: 'user', select: 'name avatar role' },
    { path: 'answers.user', select: 'name avatar role' },
  ]);
  sendSuccess(res, { question: populated }, 'Answer posted');
});

export const resolveQuestion = asyncHandler(async (req: Request, res: Response) => {
  const question = await Question.findById(req.params.questionId);
  if (!question) throw ApiError.notFound('Question not found', 'QUESTION_NOT_FOUND');
  question.isResolved = req.body.isResolved ?? true;
  await question.save();
  sendSuccess(res, { question }, 'Question updated');
});

export const listAdminQuestions = asyncHandler(async (req: Request, res: Response) => {
  const { status, search, course } = req.query as Record<string, string | undefined>;
  const pagination = parsePagination(req, 20);
  const filter: Record<string, unknown> = {};
  if (status === 'unanswered') filter.isResolved = false;
  if (status === 'answered') filter.isResolved = true;
  if (course) filter.course = course;
  if (search) filter.content = new RegExp(escapeRegex(search), 'i');

  const [items, total] = await Promise.all([
    Question.find(filter)
      .populate('user', 'name email avatar')
      .populate('course', 'title slug')
      .populate('lesson', 'title')
      .populate('answers.user', 'name role avatar')
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean(),
    Question.countDocuments(filter),
  ]);
  const unanswered = await Question.countDocuments({ isResolved: false });
  sendSuccess(res, {
    items,
    meta: paginationMeta(total, pagination.page, pagination.limit),
    unanswered,
  });
});

export const listCourseQuestions = asyncHandler(async (req: Request, res: Response) => {
  const course = await Course.findById(req.params.courseId).select('_id').lean();
  if (!course) throw ApiError.notFound('Course not found', 'COURSE_NOT_FOUND');
  await assertCourseAccess(String(req.user!._id), course._id, req.user!.role);

  const questions = await Question.find({ course: course._id })
    .populate('user', 'name avatar role')
    .populate('lesson', 'title')
    .populate('answers.user', 'name avatar role')
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();
  sendSuccess(res, { items: questions });
});

import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Enrollment } from '../models/Enrollment';
import { Section } from '../models/Section';
import { Lesson } from '../models/Lesson';
import { Course } from '../models/Course';
import { ApiError } from '../utils/ApiError';
import { asyncHandler, sendSuccess } from '../utils/response';

export const getMyEnrollments = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const enrollments = await Enrollment.find({ user: user._id })
    .populate({
      path: 'course',
      select: 'title slug thumbnail level instructor totalLessons totalDuration rating category',
      populate: { path: 'category', select: 'name slug' },
    })
    .populate('lastLesson', 'title')
    .sort({ lastAccessedAt: -1, enrolledAt: -1 })
    .lean();

  const items = enrollments.filter((enrollment) => enrollment.course);
  const completed = items.filter((enrollment) => enrollment.progress >= 100).length;
  const inProgress = items.filter((enrollment) => enrollment.progress > 0 && enrollment.progress < 100).length;

  sendSuccess(res, {
    items,
    stats: {
      total: items.length,
      completed,
      inProgress,
      notStarted: items.length - completed - inProgress,
      totalMinutes: items.reduce((sum, enrollment) => {
        const course = enrollment.course as unknown as { totalDuration?: number };
        return sum + (course?.totalDuration ?? 0);
      }, 0) / 60,
    },
  });
});

export const getCourseProgress = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const course = await Course.findById(req.params.courseId).select('title slug').lean();
  if (!course) throw ApiError.notFound('Course not found', 'COURSE_NOT_FOUND');

  const enrollment = await Enrollment.findOne({ user: user._id, course: course._id }).lean();
  if (!enrollment) throw ApiError.forbidden('You are not enrolled in this course', 'NOT_ENROLLED');

  const [sections, lessons] = await Promise.all([
    Section.find({ course: course._id }).sort('order').lean(),
    Lesson.find({ course: course._id }).sort('order').select('section title duration order isPreview').lean(),
  ]);

  sendSuccess(res, {
    enrollment,
    curriculum: sections.map((section) => ({
      ...section,
      lessons: lessons.filter((lesson) => String(lesson.section) === String(section._id)),
    })),
  });
});

export const getEnrollmentById = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  if (!Types.ObjectId.isValid(req.params.enrollmentId)) {
    throw ApiError.badRequest('Invalid enrollment id', 'INVALID_ID');
  }
  const enrollment = await Enrollment.findOne({ _id: req.params.enrollmentId, user: user._id })
    .populate('course', 'title slug thumbnail')
    .lean();
  if (!enrollment) throw ApiError.notFound('Enrollment not found', 'ENROLLMENT_NOT_FOUND');
  sendSuccess(res, { enrollment });
});

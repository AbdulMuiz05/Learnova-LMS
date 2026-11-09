import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Course } from '../models/Course';
import { Section } from '../models/Section';
import { Lesson, IVideo } from '../models/Lesson';
import { Enrollment } from '../models/Enrollment';
import { ApiError } from '../utils/ApiError';
import { asyncHandler, sendSuccess } from '../utils/response';
import { invalidateCourseCaches } from '../config/redis';
import { signVideoUrl } from '../config/cloudinary';
import {
  effectivePrice,
  ensureCourseAccess,
  recalculateCourseStats,
} from '../services/course.service';

async function courseOrThrow(courseId: string) {
  const course = await Course.findById(courseId);
  if (!course) throw ApiError.notFound('Course not found', 'COURSE_NOT_FOUND');
  return course;
}

async function syncEnrollmentProgress(courseId: Types.ObjectId, totalLessons: number): Promise<void> {
  const enrollments = await Enrollment.find({ course: courseId });
  for (const enrollment of enrollments) {
    const completed = enrollment.completedLessons.length;
    enrollment.progress = totalLessons === 0 ? 0 : Math.round((completed / totalLessons) * 100);
    await enrollment.save();
  }
}

async function invalidate(courseId: Types.ObjectId): Promise<void> {
  const course = await Course.findById(courseId).select('slug').lean();
  if (course) await invalidateCourseCaches(course.slug);
}

export const getAdminCurriculum = asyncHandler(async (req: Request, res: Response) => {
  const course = await Course.findById(req.params.courseId).populate('category', 'name slug').lean();
  if (!course) throw ApiError.notFound('Course not found', 'COURSE_NOT_FOUND');

  const [sections, lessons] = await Promise.all([
    Section.find({ course: course._id }).sort('order').lean(),
    Lesson.find({ course: course._id }).sort('order').lean(),
  ]);

  sendSuccess(res, {
    course: { ...course, effectivePrice: effectivePrice(course) },
    curriculum: sections.map((section) => ({
      ...section,
      lessons: lessons.filter((lesson) => String(lesson.section) === String(section._id)),
    })),
    unassignedLessons: lessons.filter((lesson) => !sections.some((s) => String(s._id) === String(lesson.section))),
  });
});

export const createSection = asyncHandler(async (req: Request, res: Response) => {
  const course = await courseOrThrow(req.params.courseId);
  const last = await Section.findOne({ course: course._id }).sort('-order').select('order').lean();
  const section = await Section.create({
    title: req.body.title,
    course: course._id,
    order: (last?.order ?? -1) + 1,
  });
  await invalidate(course._id);
  sendSuccess(res, { section }, 'Section added', 201);
});

export const updateSection = asyncHandler(async (req: Request, res: Response) => {
  const section = await Section.findById(req.params.sectionId);
  if (!section) throw ApiError.notFound('Section not found', 'SECTION_NOT_FOUND');
  if (req.body.title !== undefined) section.title = req.body.title;
  await section.save();
  await invalidate(section.course);
  sendSuccess(res, { section }, 'Section updated');
});

export const deleteSection = asyncHandler(async (req: Request, res: Response) => {
  const section = await Section.findById(req.params.sectionId);
  if (!section) throw ApiError.notFound('Section not found', 'SECTION_NOT_FOUND');

  const lessons = await Lesson.find({ section: section._id }).select('_id').lean();
  const lessonIds = lessons.map((lesson) => lesson._id);
  await Promise.all([
    Lesson.deleteMany({ section: section._id }),
    section.deleteOne(),
  ]);
  if (lessonIds.length) {
    await Enrollment.updateMany(
      { course: section.course },
      { $pull: { completedLessons: { $in: lessonIds } } }
    );
    await Enrollment.updateMany(
      { course: section.course, lastLesson: { $in: lessonIds } },
      { $set: { lastLesson: null } }
    );
  }
  await recalculateCourseStats(section.course);
  const total = await Lesson.countDocuments({ course: section.course });
  await syncEnrollmentProgress(section.course, total);
  await invalidate(section.course);
  sendSuccess(res, null, 'Section deleted');
});

export const reorderSections = asyncHandler(async (req: Request, res: Response) => {
  const course = await courseOrThrow(req.params.courseId);
  const { orderedIds } = req.body as { orderedIds: string[] };
  const sections = await Section.find({ course: course._id }).select('_id').lean();
  const validIds = new Set(sections.map((section) => String(section._id)));
  if (orderedIds.some((id) => !validIds.has(id))) {
    throw ApiError.badRequest('One or more sections do not belong to this course', 'INVALID_ORDER');
  }
  await Section.bulkWrite(
    orderedIds.map((id, index) => ({
      updateOne: { filter: { _id: id, course: course._id }, update: { $set: { order: index } } },
    }))
  );
  await invalidate(course._id);
  sendSuccess(res, null, 'Sections reordered');
});

export const createLesson = asyncHandler(async (req: Request, res: Response) => {
  const section = await Section.findById(req.params.sectionId);
  if (!section) throw ApiError.notFound('Section not found', 'SECTION_NOT_FOUND');

  const body = req.body;
  const last = await Lesson.findOne({ course: section.course }).sort('-order').select('order').lean();
  const duration = Math.max(0, Number(body.duration ?? body.video?.duration ?? 0));
  const lesson = await Lesson.create({
    course: section.course,
    section: section._id,
    title: body.title,
    description: body.description ?? '',
    video: {
      publicId: body.video?.publicId ?? '',
      provider: body.video?.provider ?? 'external',
      type: body.video?.type ?? 'upload',
      url: body.video?.url ?? '',
      duration: body.video?.duration ?? duration,
      poster: body.video?.poster ?? '',
    },
    duration,
    resources: body.resources ?? [],
    isPreview: body.isPreview ?? false,
    order: (last?.order ?? -1) + 1,
  });

  await recalculateCourseStats(section.course);
  await invalidate(section.course);
  sendSuccess(res, { lesson }, 'Lesson added', 201);
});

export const updateLesson = asyncHandler(async (req: Request, res: Response) => {
  const lesson = await Lesson.findById(req.params.lessonId);
  if (!lesson) throw ApiError.notFound('Lesson not found', 'LESSON_NOT_FOUND');

  const body = { ...req.body };
  if (body.section && String(body.section) !== String(lesson.section)) {
    const section = await Section.findOne({ _id: body.section, course: lesson.course }).lean();
    if (!section) throw ApiError.badRequest('Target section does not belong to this course', 'INVALID_SECTION');
  }
  if (body.video) {
    lesson.video = { ...(lesson.video as unknown as IVideo), ...body.video };
    if (body.duration === undefined && body.video.duration !== undefined) {
      body.duration = body.video.duration;
    }
    delete body.video;
  }
  Object.assign(lesson, body);
  await lesson.save();
  await recalculateCourseStats(lesson.course);
  await invalidate(lesson.course);
  sendSuccess(res, { lesson }, 'Lesson updated');
});

export const deleteLesson = asyncHandler(async (req: Request, res: Response) => {
  const lesson = await Lesson.findById(req.params.lessonId);
  if (!lesson) throw ApiError.notFound('Lesson not found', 'LESSON_NOT_FOUND');

  await lesson.deleteOne();
  await Enrollment.updateMany(
    { course: lesson.course },
    { $pull: { completedLessons: lesson._id } }
  );
  await Enrollment.updateMany(
    { course: lesson.course, lastLesson: lesson._id },
    { $set: { lastLesson: null } }
  );
  await recalculateCourseStats(lesson.course);
  const total = await Lesson.countDocuments({ course: lesson.course });
  await syncEnrollmentProgress(lesson.course, total);
  await invalidate(lesson.course);
  sendSuccess(res, null, 'Lesson deleted');
});

export const reorderLessons = asyncHandler(async (req: Request, res: Response) => {
  const course = await courseOrThrow(req.params.courseId);
  const { orderedIds } = req.body as { orderedIds: string[] };
  const lessons = await Lesson.find({ course: course._id }).select('_id').lean();
  const validIds = new Set(lessons.map((lesson) => String(lesson._id)));
  if (orderedIds.some((id) => !validIds.has(id))) {
    throw ApiError.badRequest('One or more lessons do not belong to this course', 'INVALID_ORDER');
  }
  await Lesson.bulkWrite(
    orderedIds.map((id, index) => ({
      updateOne: { filter: { _id: id, course: course._id }, update: { $set: { order: index } } },
    }))
  );
  await invalidate(course._id);
  sendSuccess(res, null, 'Lessons reordered');
});

export const getLessonContent = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const lesson = await Lesson.findById(req.params.lessonId).populate('course', 'title slug status');
  if (!lesson) throw ApiError.notFound('Lesson not found', 'LESSON_NOT_FOUND');

  const courseDoc = lesson.course as unknown as {
    _id: Types.ObjectId;
    title: string;
    slug: string;
    status: string;
  };
  if (courseDoc.status !== 'published' && user.role !== 'admin') {
    throw ApiError.notFound('Lesson not found', 'LESSON_NOT_FOUND');
  }

  const access = await ensureCourseAccess(user, courseDoc._id, {
    allowPreview: true,
    lessonId: lesson._id,
  });

  let videoUrl: string | null = null;
  if (lesson.video.provider === 'cloudinary' && lesson.video.publicId) {
    videoUrl = signVideoUrl(lesson.video.publicId, lesson.video.type) || null;
  } else if (lesson.video.url) {
    videoUrl = lesson.video.url;
  }

  const allLessons = await Lesson.find({ course: courseDoc._id })
    .select('title section order duration isPreview')
    .lean();
  const sections = await Section.find({ course: courseDoc._id }).sort('order').select('_id order').lean();
  const sectionOrder = new Map(sections.map((section) => [String(section._id), section.order]));
  const ordered = allLessons.sort((a, b) => {
    const sectionDelta = (sectionOrder.get(String(a.section)) ?? 0) - (sectionOrder.get(String(b.section)) ?? 0);
    return sectionDelta !== 0 ? sectionDelta : a.order - b.order;
  });
  const currentIndex = ordered.findIndex((item) => String(item._id) === String(lesson._id));

  let progress = 0;
  let completedLessons: string[] = [];
  if (access.enrollment) {
    progress = access.enrollment.progress;
    completedLessons = access.enrollment.completedLessons.map(String);
    if (access.enrollment.lastLesson?.toString() !== lesson._id.toString()) {
      access.enrollment.lastLesson = lesson._id;
      access.enrollment.lastAccessedAt = new Date();
      await access.enrollment.save();
    }
  } else if (user.role === 'admin') {
    progress = 100;
    completedLessons = ordered.map((item) => String(item._id));
  }

  sendSuccess(res, {
    lesson: {
      _id: lesson._id,
      title: lesson.title,
      description: lesson.description,
      duration: lesson.duration,
      resources: lesson.resources,
      isPreview: lesson.isPreview,
      video: { url: videoUrl, poster: lesson.video.poster, duration: lesson.video.duration },
      course: { _id: courseDoc._id, title: courseDoc.title, slug: courseDoc.slug },
    },
    access: { enrolled: access.enrolled, isAdmin: access.isAdmin, isPreview: lesson.isPreview },
    navigation: {
      previous: currentIndex > 0 ? { _id: ordered[currentIndex - 1]._id, title: ordered[currentIndex - 1].title } : null,
      next:
        currentIndex >= 0 && currentIndex < ordered.length - 1
          ? { _id: ordered[currentIndex + 1]._id, title: ordered[currentIndex + 1].title }
          : null,
      index: currentIndex + 1,
      total: ordered.length,
    },
    progress,
    completedLessons,
  });
});

export const completeLesson = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const lesson = await Lesson.findById(req.params.lessonId).select('course').lean();
  if (!lesson) throw ApiError.notFound('Lesson not found', 'LESSON_NOT_FOUND');

  const enrollment = await Enrollment.findOne({ user: user._id, course: lesson.course });
  if (!enrollment) throw ApiError.forbidden('You are not enrolled in this course', 'NOT_ENROLLED');

  const lessonIdString = String(lesson._id);
  if (!enrollment.completedLessons.map(String).includes(lessonIdString)) {
    enrollment.completedLessons.push(lesson._id);
    const totalLessons = await Lesson.countDocuments({ course: lesson.course });
    enrollment.progress = totalLessons === 0 ? 0 : Math.round((enrollment.completedLessons.length / totalLessons) * 100);
    enrollment.lastLesson = lesson._id;
    enrollment.lastAccessedAt = new Date();
    await enrollment.save();
  } else {
    enrollment.lastLesson = lesson._id;
    enrollment.lastAccessedAt = new Date();
    await enrollment.save();
  }

  sendSuccess(res, { enrollment }, 'Lesson marked as complete');
});

export const getLearnCourse = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const course = await Course.findById(req.params.courseId)
    .populate('category', 'name slug')
    .lean();
  if (!course) throw ApiError.notFound('Course not found', 'COURSE_NOT_FOUND');
  if (course.status !== 'published' && user.role !== 'admin') {
    throw ApiError.notFound('Course not found', 'COURSE_NOT_FOUND');
  }

  const enrollment = await Enrollment.findOne({ user: user._id, course: course._id });
  if (!enrollment && user.role !== 'admin') {
    throw ApiError.forbidden('Enroll in this course to start learning', 'NOT_ENROLLED');
  }

  const [sections, lessons] = await Promise.all([
    Section.find({ course: course._id }).sort('order').lean(),
    Lesson.find({ course: course._id }).sort('order').select('section title duration order isPreview').lean(),
  ]);

  const curriculum = sections.map((section) => ({
    ...section,
    lessons: lessons.filter((lesson) => String(lesson.section) === String(section._id)),
  }));

  const ordered = lessons;
  const resumeLesson = enrollment?.lastLesson ?? ordered[0]?._id ?? null;

  sendSuccess(res, {
    course: { ...course, effectivePrice: effectivePrice(course) },
    curriculum,
    enrollment: enrollment
      ? {
          _id: enrollment._id,
          progress: enrollment.progress,
          completedLessons: enrollment.completedLessons,
          lastLesson: enrollment.lastLesson,
          enrolledAt: enrollment.enrolledAt,
        }
      : null,
    resumeLesson,
    isAdminPreview: user.role === 'admin' && !enrollment,
  });
});

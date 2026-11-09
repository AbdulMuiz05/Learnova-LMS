import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Review } from '../models/Review';
import { Course } from '../models/Course';
import { Enrollment } from '../models/Enrollment';
import { ApiError } from '../utils/ApiError';
import { asyncHandler, sendSuccess } from '../utils/response';
import { parsePagination, paginationMeta } from '../utils/pagination';
import { recalculateCourseRating } from '../services/course.service';
import { invalidateCourseCaches } from '../config/redis';
import { notifyAdmins, notifyUser } from '../services/notification.service';

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const listCourseReviews = asyncHandler(async (req: Request, res: Response) => {
  const course = await Course.findOne(
    Types.ObjectId.isValid(req.params.courseId)
      ? { _id: req.params.courseId }
      : { slug: req.params.courseId }
  )
    .select('title slug')
    .lean();
  if (!course) throw ApiError.notFound('Course not found', 'COURSE_NOT_FOUND');

  const pagination = parsePagination(req, 8);
  const [items, total, facet] = await Promise.all([
    Review.find({ course: course._id })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean(),
    Review.countDocuments({ course: course._id }),
    Review.aggregate<{
      stats: { average: number; count: number }[];
      breakdown: { _id: number; count: number }[];
    }>([
      { $match: { course: course._id } },
      {
        $facet: {
          stats: [{ $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } }],
          breakdown: [{ $group: { _id: '$rating', count: { $sum: 1 } } }],
        },
      },
    ]),
  ]);

  const stats = facet[0]?.stats[0];
  const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<string, number>;
  for (const row of facet[0]?.breakdown ?? []) {
    breakdown[String(row._id)] = row.count;
  }

  sendSuccess(res, {
    items,
    meta: paginationMeta(total, pagination.page, pagination.limit),
    summary: {
      average: stats ? Math.round(stats.average * 10) / 10 : 0,
      count: stats?.count ?? 0,
      breakdown,
    },
  });
});

export const createReview = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const course = await Course.findById(req.params.courseId).select('title slug').lean();
  if (!course) throw ApiError.notFound('Course not found', 'COURSE_NOT_FOUND');

  const enrolled = await Enrollment.exists({ user: user._id, course: course._id });
  if (!enrolled) throw ApiError.forbidden('Only enrolled students can review this course', 'NOT_ENROLLED');

  const existing = await Review.findOne({ user: user._id, course: course._id }).lean();
  if (existing) throw ApiError.conflict('You already reviewed this course', 'REVIEW_EXISTS');

  const review = await Review.create({
    user: user._id,
    course: course._id,
    rating: req.body.rating,
    comment: req.body.comment,
  });

  await recalculateCourseRating(course._id);
  await invalidateCourseCaches(course.slug);
  notifyAdmins({
    type: 'review',
    title: 'New course review',
    message: `${user.name} rated "${course.title}" ${req.body.rating}/5.`,
    link: '/admin/reviews',
    meta: { reviewId: String(review._id), courseId: String(course._id) },
  }).catch(() => undefined);

  const populated = await review.populate('user', 'name avatar');
  sendSuccess(res, { review: populated }, 'Thanks for sharing your review!', 201);
});

export const replyToReview = asyncHandler(async (req: Request, res: Response) => {
  const review = await Review.findById(req.params.reviewId);
  if (!review) throw ApiError.notFound('Review not found', 'REVIEW_NOT_FOUND');

  review.adminReply = { content: req.body.content, repliedAt: new Date() };
  await review.save();

  const course = await Course.findById(review.course).select('title slug').lean();
  notifyUser(review.user, {
    type: 'review',
    title: 'Instructor replied to your review',
    message: `Your review of "${course?.title ?? 'a course'}" received a reply.`,
    link: `/courses/${course?.slug ?? ''}#reviews`,
  }).catch(() => undefined);

  const populated = await review.populate('user', 'name avatar');
  sendSuccess(res, { review: populated }, 'Reply published');
});

export const deleteReview = asyncHandler(async (req: Request, res: Response) => {
  const review = await Review.findById(req.params.reviewId);
  if (!review) throw ApiError.notFound('Review not found', 'REVIEW_NOT_FOUND');
  if (req.user!.role !== 'admin' && String(review.user) !== String(req.user!._id)) {
    throw ApiError.forbidden('You cannot delete this review');
  }
  const courseId = review.course;
  await review.deleteOne();
  await recalculateCourseRating(courseId);
  const course = await Course.findById(courseId).select('slug').lean();
  await invalidateCourseCaches(course?.slug);
  sendSuccess(res, null, 'Review deleted');
});

export const listAdminReviews = asyncHandler(async (req: Request, res: Response) => {
  const { search, rating } = req.query as Record<string, string | undefined>;
  const pagination = parsePagination(req, 20);
  const filter: Record<string, unknown> = {};
  if (rating && rating !== 'all') filter.rating = Number(rating);
  if (search) filter.comment = new RegExp(escapeRegex(search), 'i');

  const [items, total] = await Promise.all([
    Review.find(filter)
      .populate('user', 'name email avatar')
      .populate('course', 'title slug')
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean(),
    Review.countDocuments(filter),
  ]);
  sendSuccess(res, { items, meta: paginationMeta(total, pagination.page, pagination.limit) });
});

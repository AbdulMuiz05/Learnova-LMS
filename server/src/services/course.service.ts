import { Types } from 'mongoose';
import { Course } from '../models/Course';
import { Lesson } from '../models/Lesson';
import { Review } from '../models/Review';
import { Enrollment } from '../models/Enrollment';
import { IUser } from '../models/User';
import { ApiError } from '../utils/ApiError';

export async function recalculateCourseStats(courseId: Types.ObjectId | string): Promise<void> {
  const lessons = await Lesson.find({ course: courseId }).select('duration').lean();
  const totalDuration = lessons.reduce((sum, lesson) => sum + (lesson.duration || 0), 0);
  await Course.updateOne(
    { _id: courseId },
    { $set: { totalLessons: lessons.length, totalDuration } }
  );
}

export async function recalculateCourseRating(courseId: Types.ObjectId | string): Promise<void> {
  const [aggregate] = await Review.aggregate<{ average: number; count: number }>([
    { $match: { course: new Types.ObjectId(String(courseId)) } },
    { $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  await Course.updateOne(
    { _id: courseId },
    {
      $set: {
        'rating.average': aggregate ? Math.round(aggregate.average * 10) / 10 : 0,
        'rating.count': aggregate?.count ?? 0,
      },
    }
  );
}

export async function findEnrollment(
  userId: Types.ObjectId | string,
  courseId: Types.ObjectId | string
) {
  return Enrollment.findOne({ user: userId, course: courseId });
}

export async function ensureCourseAccess(
  user: IUser | undefined,
  courseId: Types.ObjectId | string,
  options: { allowPreview?: boolean; lessonId?: Types.ObjectId } = {}
) {
  if (!user) throw ApiError.unauthorized('Sign in to access course content', 'UNAUTHORIZED');
  if (user.role === 'admin') return { enrolled: true, isAdmin: true, enrollment: null };

  const enrollment = await findEnrollment(user._id, courseId);
  if (enrollment) return { enrolled: true, isAdmin: false, enrollment };

  if (options.allowPreview && options.lessonId) {
    const lesson = await Lesson.findOne({ _id: options.lessonId, course: courseId }).select('isPreview').lean();
    if (lesson?.isPreview) return { enrolled: false, isAdmin: false, enrollment: null };
  }

  throw ApiError.forbidden('Enroll in this course to access its lessons', 'NOT_ENROLLED');
}

export function effectivePrice(course: { price: number; discountPrice?: number | null }): number {
  if (course.discountPrice !== null && course.discountPrice !== undefined && course.discountPrice < course.price) {
    return course.discountPrice;
  }
  return course.price;
}

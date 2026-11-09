import { Types } from 'mongoose';
import { Order } from '../models/Order';
import { User } from '../models/User';
import { Course } from '../models/Course';
import { Enrollment } from '../models/Enrollment';
import { Review } from '../models/Review';
import { Question } from '../models/Question';

export interface MonthlyPoint {
  key: string;
  label: string;
  revenue: number;
  orders: number;
  students: number;
  enrollments: number;
}

function buildMonths(count: number) {
  const now = new Date();
  const months: { key: string; label: string; start: Date }[] = [];
  for (let index = count - 1; index >= 0; index -= 1) {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - index, 1));
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
    months.push({
      key,
      label: date.toLocaleString('en-US', { month: 'short', year: '2-digit', timeZone: 'UTC' }),
      start: date,
    });
  }
  return months;
}

function mergeSeries(
  months: { key: string; label: string }[],
  rows: { _id: string; revenue?: number; orders?: number; students?: number; enrollments?: number }[]
): MonthlyPoint[] {
  const map = new Map(rows.map((row) => [row._id, row]));
  return months.map((month) => {
    const row = map.get(month.key);
    return {
      key: month.key,
      label: month.label,
      revenue: Math.round((row?.revenue ?? 0) * 100) / 100,
      orders: row?.orders ?? 0,
      students: row?.students ?? 0,
      enrollments: row?.enrollments ?? 0,
    };
  });
}

export async function getAdminStats() {
  const now = new Date();
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const startOfLastMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));

  const [
    totalStudents,
    totalCourses,
    publishedCourses,
    totalEnrollments,
    revenueAgg,
    thisMonthAgg,
    lastMonthAgg,
    avgRatingAgg,
    unansweredQuestions,
    totalOrders,
  ] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    Course.countDocuments(),
    Course.countDocuments({ status: 'published' }),
    Enrollment.countDocuments(),
    Order.aggregate<{ total: number }>([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Order.aggregate<{ total: number; count: number }>([
      { $match: { status: 'paid', paidAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    Order.aggregate<{ total: number; count: number }>([
      { $match: { status: 'paid', paidAt: { $gte: startOfLastMonth, $lt: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    Review.aggregate<{ avg: number }>([{ $group: { _id: null, avg: { $avg: '$rating' } } }]),
    Question.countDocuments({ isResolved: false }),
    Order.countDocuments(),
  ]);

  const revenue = revenueAgg[0]?.total ?? 0;
  const thisMonth = thisMonthAgg[0]?.total ?? 0;
  const lastMonth = lastMonthAgg[0]?.total ?? 0;
  const revenueChange =
    lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 1000) / 10 : thisMonth > 0 ? 100 : 0;

  const [recentOrders, recentStudents, topCourses] = await Promise.all([
    Order.find({ status: 'paid' })
      .populate('user', 'name email avatar')
      .populate('course', 'title thumbnail')
      .sort({ paidAt: -1 })
      .limit(5)
      .lean(),
    User.find({ role: 'student' })
      .select('name email avatar createdAt isVerified')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    Course.find({ status: 'published' })
      .populate('category', 'name')
      .sort({ enrollmentCount: -1, 'rating.average': -1 })
      .limit(5)
      .select('title thumbnail enrollmentCount rating price discountPrice level category')
      .lean(),
  ]);

  return {
    totals: {
      students: totalStudents,
      courses: totalCourses,
      publishedCourses,
      enrollments: totalEnrollments,
      revenue: Math.round(revenue * 100) / 100,
      orders: totalOrders,
      averageRating: Math.round((avgRatingAgg[0]?.avg ?? 0) * 10) / 10,
      unansweredQuestions,
    },
    sales: {
      thisMonth: Math.round(thisMonth * 100) / 100,
      lastMonth: Math.round(lastMonth * 100) / 100,
      changePercent: revenueChange,
      ordersThisMonth: thisMonthAgg[0]?.count ?? 0,
    },
    recentOrders,
    recentStudents,
    topCourses,
  };
}

export async function getAdminAnalytics() {
  const months = buildMonths(12);
  const start = months[0].start;

  const [salesRows, studentRows, enrollmentRows, revenueByCourse, categoryRows, totals, reviewRows] =
    await Promise.all([
      Order.aggregate<{ _id: string; revenue: number; orders: number }>([
        { $match: { status: 'paid', $or: [{ paidAt: { $gte: start } }, { paidAt: null, createdAt: { $gte: start } }] } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: { $ifNull: ['$paidAt', '$createdAt'] }, timezone: 'UTC' } },
            revenue: { $sum: '$amount' },
            orders: { $sum: 1 },
          },
        },
      ]),
      User.aggregate<{ _id: string; students: number }>([
        { $match: { role: 'student', createdAt: { $gte: start } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt', timezone: 'UTC' } },
            students: { $sum: 1 },
          },
        },
      ]),
      Enrollment.aggregate<{ _id: string; enrollments: number }>([
        { $match: { createdAt: { $gte: start } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt', timezone: 'UTC' } },
            enrollments: { $sum: 1 },
          },
        },
      ]),
      Order.aggregate<{
        _id: Types.ObjectId;
        revenue: number;
        orders: number;
        course: { title: string; thumbnail: { url: string } } | null;
      }>([
        { $match: { status: 'paid' } },
        { $group: { _id: '$course', revenue: { $sum: '$amount' }, orders: { $sum: 1 } } },
        { $sort: { revenue: -1 } },
        { $limit: 6 },
        {
          $lookup: {
            from: 'courses',
            localField: '_id',
            foreignField: '_id',
            as: 'course',
          },
        },
        { $unwind: { path: '$course', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            revenue: 1,
            orders: 1,
            'course.title': 1,
            'course.thumbnail': 1,
          },
        },
      ]),
      Course.aggregate<{ _id: Types.ObjectId; count: number; name: string }>([
        { $match: { status: 'published' } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
        { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
        { $project: { count: 1, name: '$category.name' } },
        { $sort: { count: -1 } },
      ]),
      Promise.all([
        User.countDocuments({ role: 'student' }),
        Course.countDocuments({ status: 'published' }),
        Enrollment.countDocuments(),
        Order.countDocuments({ status: 'paid' }),
      ]),
      Review.aggregate<{ _id: string; count: number }>([
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt', timezone: 'UTC' } },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

  const monthly = mergeSeries(months, salesRows).map((month, index) => ({
    ...month,
    students: mergeSeries(months, studentRows)[index].students,
    enrollments: mergeSeries(months, enrollmentRows)[index].enrollments,
  }));

  return {
    monthly,
    monthlyReviews: months.map((month) => ({
      key: month.key,
      label: month.label,
      count: reviewRows.find((row) => row._id === month.key)?.count ?? 0,
    })),
    revenueByCourse: revenueByCourse.map((row) => ({
      courseId: row._id,
      title: row.course?.title ?? 'Deleted course',
      thumbnail: row.course?.thumbnail?.url ?? '',
      revenue: Math.round(row.revenue * 100) / 100,
      orders: row.orders,
    })),
    categoryDistribution: categoryRows.map((row) => ({
      name: row.name ?? 'Uncategorized',
      count: row.count,
    })),
    totals: {
      students: totals[0],
      publishedCourses: totals[1],
      enrollments: totals[2],
      paidOrders: totals[3],
    },
  };
}

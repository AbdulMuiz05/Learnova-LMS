export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface Paginated<T> {
  items: T[];
  meta: PaginationMeta;
}

export type UserRole = 'student' | 'admin';

export interface Avatar {
  url: string;
  publicId?: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: Avatar;
  bio: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  lastLoginAt?: string | null;
  enrollmentCount?: number;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  order: number;
  isActive: boolean;
  courseCount?: number;
  createdAt?: string;
}

export type CourseLevel = 'beginner' | 'intermediate' | 'advanced';
export type CourseStatus = 'draft' | 'published';

export interface Instructor {
  name: string;
  title: string;
  bio: string;
  avatar: string;
}

export interface Course {
  _id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  thumbnail: Avatar;
  category: Pick<Category, '_id' | 'name' | 'slug'> & { description?: string };
  level: CourseLevel;
  price: number;
  discountPrice: number | null;
  effectivePrice: number;
  benefits: string[];
  requirements: string[];
  instructor: Instructor;
  status: CourseStatus;
  featured: boolean;
  language: string;
  rating: { average: number; count: number };
  enrollmentCount: number;
  totalDuration: number;
  totalLessons: number;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface LessonVideo {
  publicId?: string;
  provider?: 'cloudinary' | 'external';
  type?: 'upload' | 'authenticated';
  url?: string;
  duration?: number;
  poster?: string;
}

export interface LessonResource {
  title: string;
  url: string;
}

export interface Lesson {
  _id: string;
  course: string;
  section: string;
  title: string;
  description: string;
  video: LessonVideo;
  duration: number;
  resources: LessonResource[];
  order: number;
  isPreview: boolean;
  createdAt?: string;
}

export interface Section {
  _id: string;
  course: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

export interface CourseDetail {
  course: Course;
  curriculum: Section[];
  isEnrolled: boolean;
  enrollment: Enrollment | null;
}

export interface AdminCourseDetail {
  course: Course;
  curriculum: Section[];
  unassignedLessons: Lesson[];
}

export interface LessonContent {
  lesson: {
    _id: string;
    title: string;
    description: string;
    duration: number;
    resources: LessonResource[];
    isPreview: boolean;
    video: { url: string | null; poster: string; duration: number };
    course: { _id: string; title: string; slug: string };
  };
  access: { enrolled: boolean; isAdmin: boolean; isPreview: boolean };
  navigation: {
    previous: { _id: string; title: string } | null;
    next: { _id: string; title: string } | null;
    index: number;
    total: number;
  };
  progress: number;
  completedLessons: string[];
}

export interface Enrollment {
  _id: string;
  user?: string;
  course: Course;
  completedLessons: string[];
  progress: number;
  lastLesson: { _id: string; title: string } | string | null;
  lastAccessedAt: string | null;
  enrolledAt: string;
}

export interface MyEnrollmentsResponse {
  items: Enrollment[];
  stats: {
    total: number;
    completed: number;
    inProgress: number;
    notStarted: number;
    totalMinutes: number;
  };
}

export interface CurriculumResponse {
  enrollment: {
    _id: string;
    progress: number;
    completedLessons: string[];
    lastLesson: string | null;
    enrolledAt: string;
  };
  curriculum: Section[];
}

export interface LearnCourseResponse {
  course: Course;
  curriculum: Section[];
  enrollment: {
    _id: string;
    progress: number;
    completedLessons: string[];
    lastLesson: string | null;
    enrolledAt: string;
  } | null;
  resumeLesson: string | null;
  isAdminPreview: boolean;
}

export type OrderStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type OrderProvider = 'stripe' | 'demo' | 'free';

export interface Order {
  _id: string;
  user: Pick<User, '_id' | 'name' | 'email'> & { avatar?: Avatar };
  course: Pick<Course, '_id' | 'title' | 'slug' | 'thumbnail' | 'level'> & {
    instructor?: Instructor;
  };
  amount: number;
  originalAmount: number;
  currency: string;
  status: OrderStatus;
  provider: OrderProvider;
  stripeSessionId?: string | null;
  invoiceNumber?: string | null;
  paidAt?: string | null;
  createdAt: string;
}

export interface OrderTotals {
  totalSpent: number;
  paidOrders: number;
}

export interface Review {
  _id: string;
  user: Pick<User, '_id' | 'name' | 'email'> & { avatar?: Avatar };
  course: Pick<Course, '_id' | 'title' | 'slug'>;
  rating: number;
  comment: string;
  adminReply?: { content: string; repliedAt: string } | null;
  createdAt: string;
}

export interface ReviewSummary {
  average: number;
  count: number;
  breakdown: Record<string, number>;
}

export interface ReviewListResponse extends Paginated<Review> {
  summary: ReviewSummary;
}

export interface Answer {
  user: Pick<User, '_id' | 'name' | 'role'> & { avatar?: Avatar };
  content: string;
  isAdmin: boolean;
  createdAt: string;
}

export interface Question {
  _id: string;
  user: Pick<User, '_id' | 'name' | 'email'> & { avatar?: Avatar; role?: UserRole };
  course: Pick<Course, '_id' | 'title' | 'slug'>;
  lesson: Pick<Lesson, '_id' | 'title'>;
  content: string;
  answers: Answer[];
  isResolved: boolean;
  createdAt: string;
}

export type NotificationType = 'order' | 'user' | 'question' | 'review' | 'system';

export interface AppNotification {
  _id: string;
  recipient: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string;
  isRead: boolean;
  meta?: Record<string, unknown>;
  createdAt: string;
}

export interface NotificationListResponse extends Paginated<AppNotification> {
  unread: number;
}

export interface Faq {
  _id: string;
  question: string;
  answer: string;
  order: number;
  isActive: boolean;
}

export interface SiteSettings {
  siteName: string;
  tagline: string;
  supportEmail: string;
  phone: string;
  address: string;
  footerText: string;
  currency: string;
  socials: {
    twitter: string;
    facebook: string;
    linkedin: string;
    youtube: string;
    instagram: string;
  };
}

export interface HeroContent {
  headline: string;
  subheadline: string;
  description: string;
  badge: string;
  image: Avatar;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
}

export interface Benefit {
  title: string;
  description: string;
  icon: string;
}

export interface HomepageContent {
  key?: string;
  hero: HeroContent;
  benefits: Benefit[];
  featuredCourses: string[];
  updatedAt?: string;
}

export interface HomepageData {
  hero: HeroContent;
  benefits: Benefit[];
  featuredCourses: Course[];
  categories: Category[];
  faqs: Faq[];
  testimonials: Review[];
  stats: {
    students: number;
    courses: number;
    enrollments: number;
    lessons: number;
    averageRating: number;
  };
}

export interface AdminSiteContent {
  homepage: HomepageContent;
  settings: SiteSettings;
  faqs: Faq[];
}

export interface AdminStats {
  totals: {
    students: number;
    courses: number;
    publishedCourses: number;
    enrollments: number;
    revenue: number;
    orders: number;
    averageRating: number;
    unansweredQuestions: number;
  };
  sales: {
    thisMonth: number;
    lastMonth: number;
    changePercent: number;
    ordersThisMonth: number;
  };
  recentOrders: Order[];
  recentStudents: User[];
  topCourses: Course[];
}

export interface MonthlyPoint {
  key: string;
  label: string;
  revenue: number;
  orders: number;
  students: number;
  enrollments: number;
}

export interface AdminAnalytics {
  monthly: MonthlyPoint[];
  monthlyReviews: { key: string; label: string; count: number }[];
  revenueByCourse: {
    courseId: string;
    title: string;
    thumbnail: string;
    revenue: number;
    orders: number;
  }[];
  categoryDistribution: { name: string; count: number }[];
  totals: {
    students: number;
    publishedCourses: number;
    enrollments: number;
    paidOrders: number;
  };
}

export interface AdminUserDetail {
  user: User;
  enrollments: Enrollment[];
  orders: Order[];
  stats: { enrolledCourses: number; orders: number; totalSpent: number };
}

export interface PaymentConfig {
  provider: 'stripe' | 'demo' | 'unavailable';
  stripeConfigured: boolean;
  demoPaymentsEnabled: boolean;
  currency: string;
}

export interface CheckoutResponse {
  provider: 'stripe' | 'demo' | 'free';
  orderId: string;
  url: string;
  sessionId?: string;
  message?: string;
}

export interface UploadStatus {
  cloudinary: boolean;
  folders: string[];
  maxImageSizeMb: number;
  note: string;
}

export interface UploadSignature {
  timestamp: number;
  signature: string;
  apiKey: string;
  cloudName: string;
  folder: string;
  resourceType: 'image' | 'video';
  type: 'upload' | 'authenticated';
  uploadUrl: string;
}

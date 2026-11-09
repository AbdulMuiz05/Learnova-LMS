/* eslint-disable no-console */
import mongoose, { Types } from 'mongoose';
import { connectDB, disconnectDB } from '../config/db';
import { env } from '../config/env';
import { User } from '../models/User';
import { Category } from '../models/Category';
import { Course } from '../models/Course';
import { Section } from '../models/Section';
import { Lesson } from '../models/Lesson';
import { Enrollment } from '../models/Enrollment';
import { Order } from '../models/Order';
import { Review } from '../models/Review';
import { Question } from '../models/Question';
import { Notification } from '../models/Notification';
import { Faq } from '../models/Faq';
import { Homepage } from '../models/Homepage';
import { SiteSettings } from '../models/SiteSettings';
import { recalculateCourseRating } from '../services/course.service';
import { randomInvoiceNumber } from '../utils/otp';

const ADMIN_PASSWORD = env.ADMIN_PASSWORD;
const STUDENT_PASSWORD = 'Student@12345';

const SAMPLE_VIDEOS = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
];

const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);
const hours = (value: number) => value * 3600;

interface SeedCourse {
  title: string;
  slug: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  price: number;
  discountPrice: number | null;
  shortDescription: string;
  description: string;
  thumbnail: string;
  featured: boolean;
  benefits: string[];
  requirements: string[];
  modules: { title: string; lessons: string[] }[];
}

const categoriesSeed = [
  { name: 'Web Development', slug: 'web-development', icon: 'Code2', description: 'Modern front-end and full-stack engineering.' },
  { name: 'Backend Engineering', slug: 'backend-engineering', icon: 'Server', description: 'APIs, databases, authentication and scale.' },
  { name: 'Product Design', slug: 'product-design', icon: 'Palette', description: 'UI, UX and design systems that ship.' },
  { name: 'DevOps & Cloud', slug: 'devops-cloud', icon: 'Cloud', description: 'Containers, CI/CD and reliable infrastructure.' },
  { name: 'Data Science', slug: 'data-science', icon: 'BarChart3', description: 'Analytics, Python, SQL and machine learning foundations.' },
  { name: 'Cybersecurity', slug: 'cybersecurity', icon: 'ShieldCheck', description: 'Secure engineering and defensive practices.' },
  { name: 'Mobile Development', slug: 'mobile-development', icon: 'Smartphone', description: 'Cross-platform apps with React Native.' },
];

const coursesSeed: SeedCourse[] = [
  {
    title: 'Full-Stack Next.js 15 & TypeScript Masterclass',
    slug: 'full-stack-nextjs-typescript-masterclass',
    category: 'web-development',
    level: 'advanced',
    price: 129.99,
    discountPrice: 89.99,
    shortDescription: 'Build and deploy a production SaaS with the App Router, server actions, auth and payments.',
    description:
      'Go beyond tutorials and ship a real production application. You will architect a multi-tenant SaaS using the Next.js App Router, TypeScript, Prisma, PostgreSQL and Stripe, then deploy it with observability, rate limiting and automated tests. Every module ends with a review checkpoint and a deployable milestone.',
    thumbnail:
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
    featured: true,
    benefits: [
      'Architect scalable App Router applications',
      'Implement secure cookie auth and RBAC',
      'Integrate Stripe subscriptions end-to-end',
      'Deploy with CI/CD and monitor production',
    ],
    requirements: ['Comfortable with React and TypeScript', 'Node.js 20+ installed locally'],
    modules: [
      {
        title: 'Architecture & Routing',
        lessons: ['App Router mental model', 'Layouts, loading and error boundaries', 'Typed server actions and data flow'],
      },
      {
        title: 'Authentication & Data',
        lessons: ['Cookie sessions and refresh tokens', 'Role-based access control patterns', 'Prisma schema design and migrations'],
      },
      {
        title: 'Payments & Production',
        lessons: ['Stripe checkout and verified webhooks', 'Caching, revalidation and performance', 'Deploying to Vercel with confidence'],
      },
    ],
  },
  {
    title: 'React & Redux Toolkit: Production Patterns',
    slug: 'react-redux-toolkit-production-patterns',
    category: 'web-development',
    level: 'intermediate',
    price: 79.99,
    discountPrice: 49.99,
    shortDescription: 'Design predictable state, caching and data flows for large React applications.',
    description:
      'Redux does not have to be painful. In this course you will build a real dashboard with Redux Toolkit and RTK Query, learn cache invalidation, optimistic updates and typed hooks, and leave with patterns that scale to large teams without boilerplate.',
    thumbnail:
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
    featured: true,
    benefits: [
      'Model normalized state with confidence',
      'Master RTK Query caching and invalidation',
      'Write optimistic updates that feel instant',
      'Test reducers and async flows',
    ],
    requirements: ['Working knowledge of React hooks'],
    modules: [
      {
        title: 'Foundations',
        lessons: ['Why global state? When not to use Redux', 'Slices, actions and typed selectors', 'RTK Query fundamentals'],
      },
      {
        title: 'Advanced Data Flows',
        lessons: ['Cache tags and invalidation strategy', 'Optimistic updates and rollbacks', 'Pagination and infinite scroll'],
      },
      {
        title: 'Team Scale',
        lessons: ['Feature folders and boundaries', 'Testing slices and components', 'Performance profiling'],
      },
    ],
  },
  {
    title: 'Node.js, Express & MongoDB API Engineering',
    slug: 'node-express-mongodb-api-engineering',
    category: 'backend-engineering',
    level: 'intermediate',
    price: 94.99,
    discountPrice: 64.99,
    shortDescription: 'Design secure REST APIs with authentication, validation, testing and documentation.',
    description:
      'Build an API you would be proud to run in production. Topics include layered architecture, Mongoose modelling, access and refresh tokens, rate limiting, input validation, integration testing and OpenAPI documentation.',
    thumbnail:
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
    featured: true,
    benefits: [
      'Structure Express apps for maintainability',
      'Implement hardened JWT authentication',
      'Validate every request boundary with Zod',
      'Ship tested, documented APIs',
    ],
    requirements: ['JavaScript fundamentals', 'Basic knowledge of HTTP'],
    modules: [
      {
        title: 'API Foundations',
        lessons: ['Routing, middleware and error handling', 'Mongoose models and indexes', 'Validation at the boundary'],
      },
      {
        title: 'Security',
        lessons: ['Access and refresh token rotation', 'Rate limiting and abuse prevention', 'OWASP top-10 mitigation'],
      },
      {
        title: 'Quality',
        lessons: ['Integration testing with an in-memory Mongo', 'Logging and observability', 'API documentation that stays current'],
      },
    ],
  },
  {
    title: 'UI/UX for Developers: Design Systems That Ship',
    slug: 'ui-ux-design-systems-for-developers',
    category: 'product-design',
    level: 'beginner',
    price: 59.99,
    discountPrice: null,
    shortDescription: 'Turn rough interfaces into polished, accessible products without a design team.',
    description:
      'Learn the practical 20% of design that makes 80% of the difference: spacing systems, type scales, color tokens, accessibility and interaction states. Build a reusable design system in Tailwind and Figma side by side.',
    thumbnail:
      'https://images.unsplash.com/photo-1559028012-481c04fa702d?auto=format&fit=crop&w=1200&q=80',
    featured: false,
    benefits: [
      'Build a consistent tokens-based design system',
      'Create accessible color and type scales',
      'Design responsive layouts with confidence',
      'Hand off components engineers love',
    ],
    requirements: ['No prior design experience required'],
    modules: [
      {
        title: 'Visual Foundations',
        lessons: ['Spacing, rhythm and layout grids', 'Typography systems', 'Color, contrast and accessibility'],
      },
      {
        title: 'Components',
        lessons: ['Buttons, inputs and interaction states', 'Cards, tables and data density', 'Dark mode done right'],
      },
      {
        title: 'Workflow',
        lessons: ['Figma to Tailwind tokens', 'Documenting a design system', 'Design reviews and critique'],
      },
    ],
  },
  {
    title: 'Cloud & DevOps: Docker, CI/CD and Kubernetes',
    slug: 'cloud-devops-docker-kubernetes',
    category: 'devops-cloud',
    level: 'advanced',
    price: 119.99,
    discountPrice: 89.99,
    shortDescription: 'Ship reliable services with containers, pipelines and production observability.',
    description:
      'From the first Dockerfile to a rolling deployment in Kubernetes, this course teaches the operational skills that separate hobby projects from dependable products. Includes secrets management, health checks, autoscaling and incident response drills.',
    thumbnail:
      'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?auto=format&fit=crop&w=1200&q=80',
    featured: false,
    benefits: [
      'Containerize any application correctly',
      'Build fast, secure CI/CD pipelines',
      'Operate Kubernetes workloads with confidence',
      'Instrument services for observability',
    ],
    requirements: ['Linux command line basics', 'Familiarity with Git'],
    modules: [
      {
        title: 'Containers',
        lessons: ['Dockerfiles that build fast', 'Compose for local environments', 'Image security and scanning'],
      },
      {
        title: 'Delivery',
        lessons: ['CI pipelines with quality gates', 'Zero-downtime deployment strategies', 'Secrets and configuration management'],
      },
      {
        title: 'Operations',
        lessons: ['Kubernetes workloads and services', 'Logs, metrics and traces', 'Incident response playbook'],
      },
    ],
  },
  {
    title: 'Data Analytics with Python, Pandas & SQL',
    slug: 'data-analytics-python-pandas-sql',
    category: 'data-science',
    level: 'beginner',
    price: 69.99,
    discountPrice: 39.99,
    shortDescription: 'Go from raw spreadsheets to decision-ready dashboards with Python and SQL.',
    description:
      'Learn to clean messy data, write analytical SQL, explore datasets with Pandas and communicate results with clear visualizations. Every module uses realistic business datasets and finishes with a portfolio-ready analysis.',
    thumbnail:
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
    featured: true,
    benefits: [
      'Write efficient analytical SQL',
      'Clean and reshape data with Pandas',
      'Build charts that tell a story',
      'Create a portfolio-ready analysis',
    ],
    requirements: ['Basic spreadsheet experience', 'No coding experience required'],
    modules: [
      {
        title: 'SQL Foundations',
        lessons: ['SELECT, joins and grouping', 'Window functions in practice', 'Query performance basics'],
      },
      {
        title: 'Python for Data',
        lessons: ['Pandas dataframes and indexing', 'Cleaning messy real-world data', 'Exploratory data analysis'],
      },
      {
        title: 'Communication',
        lessons: ['Visualization principles', 'Building an analytics narrative', 'Presenting findings to stakeholders'],
      },
    ],
  },
  {
    title: 'Cybersecurity Essentials for Engineers',
    slug: 'cybersecurity-essentials-for-engineers',
    category: 'cybersecurity',
    level: 'intermediate',
    price: 89.99,
    discountPrice: null,
    shortDescription: 'Understand attackers’ playbook and harden the applications you build.',
    description:
      'A practical defensive security course for developers. Learn threat modelling, secure authentication, OWASP Top 10 exploitation and mitigation, secure file handling, secrets management and how to respond when something goes wrong.',
    thumbnail:
      'https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=1200&q=80',
    featured: false,
    benefits: [
      'Threat model features before shipping',
      'Exploit and fix OWASP Top 10 issues',
      'Harden authentication and sessions',
      'Handle secrets and uploads safely',
    ],
    requirements: ['Experience building a web application'],
    modules: [
      {
        title: 'Threat Modelling',
        lessons: ['Thinking like an attacker', 'STRIDE in real features', 'Security requirements that stick'],
      },
      {
        title: 'Application Security',
        lessons: ['Injection and XSS defence', 'Session and token hardening', 'Safe file uploads and SSRF'],
      },
      {
        title: 'Response',
        lessons: ['Logging for detection', 'Dependency and supply chain hygiene', 'Post-incident review'],
      },
    ],
  },
  {
    title: 'React Native: Build Cross-Platform Apps',
    slug: 'react-native-cross-platform-apps',
    category: 'mobile-development',
    level: 'intermediate',
    price: 84.99,
    discountPrice: 59.99,
    shortDescription: 'Ship a polished iOS and Android app from one TypeScript codebase.',
    description:
      'Build a complete mobile product with React Native and Expo: navigation, native device features, offline caching, push notifications and app store release. Learn performance patterns that keep 60fps on real devices.',
    thumbnail:
      'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1200&q=80',
    featured: false,
    benefits: [
      'Structure scalable React Native apps',
      'Use device APIs and offline storage',
      'Optimize lists, images and animations',
      'Publish to the App Store and Play Store',
    ],
    requirements: ['React fundamentals', 'Node.js installed locally'],
    modules: [
      {
        title: 'Foundations',
        lessons: ['Expo project setup and structure', 'Navigation and deep links', 'Styling responsive layouts'],
      },
      {
        title: 'Capabilities',
        lessons: ['Camera, files and permissions', 'Offline-first data with SQLite', 'Push notifications'],
      },
      {
        title: 'Release',
        lessons: ['Performance profiling on device', 'OTA updates with EAS', 'Store submission checklist'],
      },
    ],
  },
];

const studentsSeed = [
  { name: 'Aisha Bello', email: 'aisha@student.learnova.local' },
  { name: 'John Mensah', email: 'john@student.learnova.local' },
  { name: 'Priya Sharma', email: 'priya@student.learnova.local' },
  { name: 'Lucas Silva', email: 'lucas@student.learnova.local' },
  { name: 'Fatima Noor', email: 'fatima@student.learnova.local' },
  { name: 'Emeka Obi', email: 'emeka@student.learnova.local' },
];

const reviewComments = [
  'Dense, practical and refreshingly free of filler. I shipped a feature at work the same week.',
  'The projects are the real deal — I finally understand how the pieces fit in production.',
  'Clear explanations and excellent pacing. The downloadable resources alone are worth it.',
  'Best structured course I have taken on this topic. The instructor answers questions quickly.',
  'Loved the focus on trade-offs instead of silver bullets. Highly recommended.',
  'A few sections moved fast, but the exercises made everything click. Great value.',
];

async function clearData() {
  await Promise.all([
    User.deleteMany({}),
    Category.deleteMany({}),
    Course.deleteMany({}),
    Section.deleteMany({}),
    Lesson.deleteMany({}),
    Enrollment.deleteMany({}),
    Order.deleteMany({}),
    Review.deleteMany({}),
    Question.deleteMany({}),
    Notification.deleteMany({}),
    Faq.deleteMany({}),
    Homepage.deleteMany({}),
    SiteSettings.deleteMany({}),
  ]);
}

async function seed() {
  console.log('Connecting to MongoDB…');
  await connectDB();
  console.log('Clearing existing data…');
  await clearData();

  const admin = await User.create({
    name: env.ADMIN_NAME,
    email: env.ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    role: 'admin',
    isVerified: true,
    isActive: true,
    bio: 'Platform administrator and lead instructor at Learnova.',
    lastLoginAt: new Date(),
  });

  const students = await User.create(
    studentsSeed.map((student, index) => ({
      ...student,
      password: STUDENT_PASSWORD,
      role: 'student',
      isVerified: true,
      isActive: true,
      bio: index % 2 === 0 ? 'Frontend developer learning full-stack engineering.' : 'Career switcher building production projects.',
      createdAt: daysAgo(210 - index * 27),
      lastLoginAt: daysAgo(index + 1),
    }))
  );
  for (let index = 0; index < students.length; index += 1) {
    await User.updateOne(
      { _id: students[index]._id },
      { $set: { createdAt: daysAgo(210 - index * 27) } },
      { timestamps: false }
    );
  }

  const categories = await Category.create(
    categoriesSeed.map((category, index) => ({ ...category, order: index }))
  );
  const categoryMap = new Map(categories.map((category) => [category.slug, category._id]));

  const instructorPool = [
    {
      name: 'Daniel Okafor',
      title: 'Staff Engineer · ex-Stripe',
      bio: 'Daniel has shipped payments infrastructure at scale and now teaches production engineering full time.',
      avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80',
    },
    {
      name: 'Sarah Chen',
      title: 'Principal Product Engineer',
      bio: 'Sarah leads design systems and frontend architecture for high-growth SaaS products.',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
    },
  ];

  const courses: (InstanceType<typeof Course>)[] = [];
  const lessonsByCourse = new Map<string, InstanceType<typeof Lesson>[]>();

  for (let courseIndex = 0; courseIndex < coursesSeed.length; courseIndex += 1) {
    const seedCourse = coursesSeed[courseIndex];
    const course = await Course.create({
      title: seedCourse.title,
      slug: seedCourse.slug,
      description: seedCourse.description,
      shortDescription: seedCourse.shortDescription,
      thumbnail: { url: seedCourse.thumbnail, publicId: '' },
      category: categoryMap.get(seedCourse.category),
      level: seedCourse.level,
      price: seedCourse.price,
      discountPrice: seedCourse.discountPrice,
      benefits: seedCourse.benefits,
      requirements: seedCourse.requirements,
      instructor: instructorPool[courseIndex % instructorPool.length],
      status: 'published',
      featured: seedCourse.featured,
      publishedAt: daysAgo(240 - courseIndex * 12),
      createdAt: daysAgo(250 - courseIndex * 12),
    });

    const allLessons: InstanceType<typeof Lesson>[] = [];
    let globalOrder = 0;
    for (let moduleIndex = 0; moduleIndex < seedCourse.modules.length; moduleIndex += 1) {
      const module = seedCourse.modules[moduleIndex];
      const section = await Section.create({
        course: course._id,
        title: module.title,
        order: moduleIndex,
      });
      for (let lessonIndex = 0; lessonIndex < module.lessons.length; lessonIndex += 1) {
        const duration = 420 + ((courseIndex * 7 + moduleIndex * 3 + lessonIndex * 5) % 12) * 60;
        const videoIndex = (courseIndex * 9 + moduleIndex * 3 + lessonIndex) % SAMPLE_VIDEOS.length;
        const lesson = await Lesson.create({
          course: course._id,
          section: section._id,
          title: module.lessons[lessonIndex],
          description: `In this lesson we cover ${module.lessons[lessonIndex].toLowerCase()} with a hands-on walkthrough, common pitfalls and a short exercise you can complete before the next module.`,
          video: {
            provider: 'external',
            type: 'upload',
            publicId: '',
            url: SAMPLE_VIDEOS[videoIndex],
            duration,
            poster: seedCourse.thumbnail,
          },
          duration,
          resources: [
            { title: 'Lesson slides (PDF)', url: `${env.CLIENT_URL}/resources/${seedCourse.slug}-slides.pdf` },
            { title: 'Starter repository', url: 'https://github.com/' },
          ],
          order: globalOrder,
          isPreview: moduleIndex === 0 && lessonIndex === 0,
        });
        allLessons.push(lesson);
        globalOrder += 1;
      }
    }
    lessonsByCourse.set(String(course._id), allLessons);

    const totalDuration = allLessons.reduce((sum, lesson) => sum + lesson.duration, 0);
    await Course.updateOne(
      { _id: course._id },
      {
        $set: {
          totalLessons: allLessons.length,
          totalDuration: Math.round(totalDuration),
          createdAt: daysAgo(250 - courseIndex * 12),
        },
      },
      { timestamps: false }
    );
    courses.push(course);
  }

  // Enrollments, paid orders and reviews.
  const enrollmentPlan: { student: number; courseIndexes: number[] }[] = [
    { student: 0, courseIndexes: [0, 1, 5] },
    { student: 1, courseIndexes: [2, 0] },
    { student: 2, courseIndexes: [3, 6, 7] },
    { student: 3, courseIndexes: [4, 2] },
    { student: 4, courseIndexes: [5, 1, 3] },
    { student: 5, courseIndexes: [0, 6] },
  ];

  let invoiceCounter = 1;
  let orderDayOffset = 190;

  for (const plan of enrollmentPlan) {
    const student = students[plan.student];
    for (let planIndex = 0; planIndex < plan.courseIndexes.length; planIndex += 1) {
      const courseIndex = plan.courseIndexes[planIndex];
      const course = courses[courseIndex];
      const courseLessons = lessonsByCourse.get(String(course._id)) ?? [];

      const amount = course.discountPrice ?? course.price;
      const purchasedDaysAgo = Math.max(5, orderDayOffset - planIndex * 24 - plan.student * 3);
      const paidAt = daysAgo(purchasedDaysAgo);

      const order = await Order.create({
        user: student._id,
        course: course._id,
        amount,
        originalAmount: course.price,
        currency: 'usd',
        status: 'paid',
        provider: 'demo',
        invoiceNumber: `INV-SEED-${String(invoiceCounter).padStart(4, '0')}`,
        paidAt,
        createdAt: paidAt,
      });
      await Order.updateOne(
        { _id: order._id },
        { $set: { createdAt: paidAt, paidAt } },
        { timestamps: false }
      );
      invoiceCounter += 1;

      const completedCount = Math.min(
        courseLessons.length,
        (plan.student + planIndex * 2 + courseIndex) % (courseLessons.length + 1)
      );
      const completedLessons = courseLessons.slice(0, completedCount).map((lesson) => lesson._id);
      const progress =
        courseLessons.length === 0 ? 0 : Math.round((completedCount / courseLessons.length) * 100);

      await Enrollment.create({
        user: student._id,
        course: course._id,
        completedLessons,
        progress,
        lastLesson: courseLessons[Math.max(0, completedCount - 1)]?._id ?? null,
        lastAccessedAt: daysAgo(Math.max(1, purchasedDaysAgo - 20)),
        enrolledAt: paidAt,
        createdAt: paidAt,
      });

      await Course.updateOne({ _id: course._id }, { $inc: { enrollmentCount: 1 } });

      if (planIndex < 2 && (plan.student + courseIndex) % 2 === 0) {
        const rating = (plan.student + courseIndex) % 2 === 0 ? 5 : 4;
        await Review.create({
          user: student._id,
          course: course._id,
          rating,
          comment: reviewComments[(plan.student + courseIndex) % reviewComments.length],
          createdAt: daysAgo(Math.max(2, purchasedDaysAgo - 12)),
          ...(courseIndex === 0
            ? {
                adminReply: {
                  content: 'Thank you for the detailed feedback — glad the production projects were useful!',
                  repliedAt: daysAgo(Math.max(1, purchasedDaysAgo - 15)),
                },
              }
            : {}),
        });
      }
      orderDayOffset += 1;
    }
  }

  for (const course of courses) {
    await recalculateCourseRating(course._id);
  }

  // Questions and answers.
  const firstCourseLessons = lessonsByCourse.get(String(courses[0]._id)) ?? [];
  const questionSeeds = [
    {
      student: students[0],
      lesson: firstCourseLessons[2],
      content: 'How do you decide when to use a server action versus a route handler in the App Router?',
      answer:
        'Use server actions for mutations initiated from your UI, and route handlers when you need a public HTTP endpoint, webhooks, or a non-React client. The key is the boundary: actions are called from components, handlers are called over HTTP.',
      resolved: true,
    },
    {
      student: students[1],
      lesson: firstCourseLessons[4],
      content: 'Should refresh tokens be stored in the database or Redis?',
      answer:
        'Either works. Store a hash of the refresh token with its expiry; Redis is great for automatic TTL and revocation at scale, while MongoDB keeps the audit trail simple. Never store the raw token.',
      resolved: true,
    },
    {
      student: students[4],
      lesson: lessonsByCourse.get(String(courses[5]._id))?.[1],
      content: 'Can I follow this module with Excel experience but no Python?',
      answer: 'Absolutely — the Python module starts from zero, and your Excel mental model is a real advantage.',
      resolved: true,
    },
    {
      student: students[3],
      lesson: lessonsByCourse.get(String(courses[4]._id))?.[3],
      content: 'What is the difference between a Kubernetes Deployment and a StatefulSet?',
      answer: '',
      resolved: false,
    },
  ];

  for (const item of questionSeeds) {
    if (!item.lesson) continue;
    await Question.create({
      user: item.student._id,
      course: item.lesson.course,
      lesson: item.lesson._id,
      content: item.content,
      isResolved: item.resolved,
      answers: item.answer
        ? [{ user: admin._id, content: item.answer, isAdmin: true, createdAt: daysAgo(3) }]
        : [],
      createdAt: daysAgo(6),
    });
  }

  // Admin notifications.
  await Notification.create([
    {
      recipient: admin._id,
      type: 'order',
      title: 'New course purchase',
      message: 'Aisha Bello purchased "Full-Stack Next.js 15 & TypeScript Masterclass".',
      link: '/admin/orders',
      isRead: false,
      createdAt: daysAgo(1),
    },
    {
      recipient: admin._id,
      type: 'question',
      title: 'New student question',
      message: 'A question is waiting for an answer in "Cloud & DevOps: Docker, CI/CD and Kubernetes".',
      link: '/admin/questions',
      isRead: false,
      createdAt: daysAgo(2),
    },
    {
      recipient: admin._id,
      type: 'user',
      title: 'New student registered',
      message: 'Emeka Obi joined the platform.',
      link: '/admin/students',
      isRead: true,
      createdAt: daysAgo(9),
    },
    {
      recipient: admin._id,
      type: 'review',
      title: 'New course review',
      message: 'Priya Sharma left a 5-star review on "UI/UX for Developers".',
      link: '/admin/reviews',
      isRead: true,
      createdAt: daysAgo(11),
    },
  ]);

  // Homepage, FAQs and site settings.
  await Homepage.create({
    key: 'homepage',
    hero: {
      headline: 'Learn the skills that move your career forward',
      subheadline: 'Industry-grade courses, taught by engineers who ship.',
      description:
        'Master full-stack engineering, cloud, data and design with project-based courses built for the modern workplace. Learn at your pace, build a portfolio, and get answers from real practitioners.',
      badge: 'Trusted by 12,000+ learners worldwide',
      image: {
        url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1400&q=80',
        publicId: '',
      },
      primaryCta: { label: 'Browse courses', href: '/courses' },
      secondaryCta: { label: 'Create free account', href: '/register' },
    },
    featuredCourses: courses.filter((course) => course.featured).map((course) => course._id),
    benefits: [
      {
        title: 'Project-based learning',
        description: 'Every module ends with something you can ship, not another quiz.',
        icon: 'Rocket',
      },
      {
        title: 'Learn from practitioners',
        description: 'Instructors who have built and operated real production systems.',
        icon: 'Users',
      },
      {
        title: 'Lifetime access',
        description: 'Revisit lessons, resources and updates whenever you need them.',
        icon: 'Infinity',
      },
      {
        title: 'Verified certificates',
        description: 'Showcase completed courses on your portfolio and LinkedIn.',
        icon: 'BadgeCheck',
      },
    ],
  });

  await Faq.create([
    {
      question: 'Do I get lifetime access to a course after purchase?',
      answer: 'Yes. Once you enroll, you keep access to every lesson, resource and future update for that course.',
      order: 1,
    },
    {
      question: 'Can I preview a course before buying?',
      answer: 'Every course includes at least one free preview lesson, and the full curriculum is visible on the course page.',
      order: 2,
    },
    {
      question: 'How do payments work?',
      answer: 'Checkout is handled by Stripe in test mode for this demo. Enrollment is only activated after the payment is verified by a signed Stripe webhook.',
      order: 3,
    },
    {
      question: 'Can I ask questions during a course?',
      answer: 'Absolutely. Every lesson has a Q&A thread where you can ask questions and read instructor replies.',
      order: 4,
    },
    {
      question: 'Is there a refund policy?',
      answer: 'This is a demonstration environment without real charges. In a production deployment you would configure the refund window in the admin settings.',
      order: 5,
    },
    {
      question: 'Are the videos downloadable?',
      answer: 'Videos are streamed securely and are only delivered to enrolled students. Downloading is intentionally disabled.',
      order: 6,
    },
  ]);

  await SiteSettings.create({
    key: 'site',
    siteName: 'Learnova',
    tagline: 'Learn. Build. Ship.',
    supportEmail: 'support@learnova.local',
    phone: '+1 (555) 010-2030',
    address: 'Remote-first · Worldwide',
    footerText: 'Learnova — practical, project-based education for modern engineers.',
    currency: 'usd',
    socials: {
      twitter: 'https://twitter.com',
      linkedin: 'https://linkedin.com',
      youtube: 'https://youtube.com',
      facebook: '',
      instagram: '',
    },
  });

  console.log('\nSeed complete!');
  console.log('──────────────────────────────────────────');
  console.log(`Admin:    ${env.ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log(`Students: ${studentsSeed.map((s) => s.email).join(', ')}`);
  console.log(`Password for all demo students: ${STUDENT_PASSWORD}`);
  console.log(`Courses:  ${courses.length} · Categories: ${categories.length}`);
  console.log('──────────────────────────────────────────');

  await disconnectDB();
}

seed().catch(async (error) => {
  console.error('Seed failed:', error);
  await mongoose.disconnect();
  process.exit(1);
});

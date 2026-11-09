/* eslint-disable no-console */
import http from 'http';

process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-that-is-long-enough';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-that-is-long-enough';
process.env.ALLOW_DEMO_PAYMENTS = 'true';
process.env.ADMIN_EMAIL = 'admin@test.local';
process.env.ADMIN_PASSWORD = 'Admin@12345';
process.env.CLIENT_URL = 'http://localhost:3000';

let passed = 0;
let failed = 0;

function check(name: string, condition: boolean, extra?: unknown) {
  if (condition) {
    passed += 1;
    console.log(`  \u2713 ${name}`);
  } else {
    failed += 1;
    console.error(`  \u2717 ${name}`, extra ?? '');
  }
}

class Session {
  cookie = '';

  async request(path: string, options: { method?: string; body?: unknown } = {}) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.cookie) headers.Cookie = this.cookie;
    const response = await fetch(`${baseUrl}/api${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
    const setCookies = response.headers.getSetCookie?.() ?? [];
    if (setCookies.length) {
      this.cookie = setCookies.map((cookie) => cookie.split(';')[0]).join('; ');
    }
    const text = await response.text();
    let body: any = text;
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
    return { status: response.status, body, headers: response.headers };
  }
}

let baseUrl = '';

async function main() {
  console.log('Starting in-memory MongoDB (first run downloads the binary)…');
  const { MongoMemoryServer } = await import('mongodb-memory-server');
  const mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri('lms_integration_test');

  const { connectDB } = await import('../config/db');
  await connectDB(process.env.MONGODB_URI);

  const { createApp } = await import('../app');
  const { User } = await import('../models/User');
  const { Faq } = await import('../models/Faq');
  const app = createApp();
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  baseUrl = `http://127.0.0.1:${port}`;
  console.log(`API test server on ${baseUrl}\n`);

  await User.create({
    name: 'Test Admin',
    email: 'admin@test.local',
    password: 'Admin@12345',
    role: 'admin',
    isVerified: true,
  });

  const health = await new Session().request('/health');
  check('Health endpoint responds', health.status === 200 && health.body.data.status === 'ok');

  const admin = new Session();
  const adminLogin = await admin.request('/auth/login', {
    method: 'POST',
    body: { email: 'admin@test.local', password: 'Admin@12345' },
  });
  check('Admin can sign in', adminLogin.status === 200 && adminLogin.body.data.user.role === 'admin', adminLogin.body);

  const student = new Session();
  const registerResponse = await student.request('/auth/register', {
    method: 'POST',
    body: { name: 'Test Student', email: 'student@test.local', password: 'Student@12345' },
  });
  check('Registration succeeds', registerResponse.status === 201, registerResponse.body);
  const otp = registerResponse.body.data?.devOtp;
  check('Development OTP is returned when SMTP is not configured', typeof otp === 'string' && otp.length === 6);

  const wrongOtp = await student.request('/auth/verify-otp', {
    method: 'POST',
    body: { email: 'student@test.local', code: '000000' },
  });
  check('Wrong OTP is rejected', wrongOtp.status === 400 && wrongOtp.body.code === 'OTP_INVALID');

  const verifyResponse = await student.request('/auth/verify-otp', {
    method: 'POST',
    body: { email: 'student@test.local', code: otp },
  });
  check('OTP verification signs the student in', verifyResponse.status === 200 && Boolean(student.cookie));

  const me = await student.request('/auth/me');
  check('Authenticated profile is available', me.status === 200 && me.body.data.user.email === 'student@test.local');

  const studentTwo = new Session();
  const registerTwo = await studentTwo.request('/auth/register', {
    method: 'POST',
    body: { name: 'Second Student', email: 'student2@test.local', password: 'Student@12345' },
  });
  await studentTwo.request('/auth/verify-otp', {
    method: 'POST',
    body: { email: 'student2@test.local', code: registerTwo.body.data.devOtp },
  });
  check('Second student account is ready', Boolean(studentTwo.cookie));

  const forbidden = await student.request('/admin/stats');
  check('Student cannot access admin analytics', forbidden.status === 403);

  const categoryResponse = await admin.request('/categories', {
    method: 'POST',
    body: { name: 'Test Engineering', description: 'Integration test category', icon: 'Code2', order: 1 },
  });
  const categoryId = categoryResponse.body.data?.category?._id;
  check('Admin can create a category', categoryResponse.status === 201 && Boolean(categoryId), categoryResponse.body);

  const courseResponse = await admin.request('/courses', {
    method: 'POST',
    body: {
      title: 'Integration Test Course',
      description: 'A complete integration test course used to verify the LMS backend end to end.',
      shortDescription: 'Integration testing the full LMS flow.',
      category: categoryId,
      level: 'intermediate',
      price: 49.99,
      discountPrice: 39.99,
      benefits: ['Test benefit one', 'Test benefit two'],
      requirements: ['Node.js'],
      status: 'draft',
    },
  });
  const course = courseResponse.body.data?.course;
  check('Admin can create a course', courseResponse.status === 201 && Boolean(course?._id), courseResponse.body);

  const draftPublic = await new Session().request(`/courses/${course?.slug}`);
  check('Draft courses are hidden from the public', draftPublic.status === 404);

  const sectionResponse = await admin.request(`/courses/${course._id}/sections`, {
    method: 'POST',
    body: { title: 'Getting Started' },
  });
  const sectionId = sectionResponse.body.data?.section?._id;
  check('Admin can add a section', sectionResponse.status === 201 && Boolean(sectionId));

  const lessonResponse = await admin.request(`/sections/${sectionId}/lessons`, {
    method: 'POST',
    body: {
      title: 'Locked premium lesson',
      description: 'Premium content',
      video: {
        provider: 'external',
        type: 'upload',
        url: 'https://example.com/private-video.mp4',
        duration: 600,
      },
      duration: 600,
      resources: [{ title: 'Cheat sheet', url: 'https://example.com/cheat-sheet.pdf' }],
      isPreview: false,
    },
  });
  const lessonId = lessonResponse.body.data?.lesson?._id;
  check('Admin can add a lesson', lessonResponse.status === 201 && Boolean(lessonId), lessonResponse.body);

  const previewResponse = await admin.request(`/sections/${sectionId}/lessons`, {
    method: 'POST',
    body: {
      title: 'Free preview lesson',
      video: { provider: 'external', type: 'upload', url: 'https://example.com/preview.mp4', duration: 300 },
      duration: 300,
      isPreview: true,
    },
  });
  const previewLessonId = previewResponse.body.data?.lesson?._id;

  const publish = await admin.request(`/courses/${course._id}/status`, {
    method: 'PATCH',
    body: { status: 'published' },
  });
  check('Admin can publish a course', publish.status === 200 && publish.body.data.course.status === 'published');

  const publicCourse = await new Session().request(`/courses/${course.slug}`);
  check(
    'Published course exposes curriculum but not video URLs',
    publicCourse.status === 200 &&
      publicCourse.body.data.curriculum.length === 1 &&
      !JSON.stringify(publicCourse.body).includes('private-video.mp4')
  );

  const anonymousContent = await new Session().request(`/lessons/${lessonId}/content`);
  check('Anonymous users cannot fetch lesson content', anonymousContent.status === 401);

  const previewAccess = await studentTwo.request(`/lessons/${previewLessonId}/content`);
  check('Preview lessons are available to signed-in users', previewAccess.status === 200);

  const lockedAccess = await studentTwo.request(`/lessons/${lessonId}/content`);
  check('Non-enrolled students cannot fetch locked lessons', lockedAccess.status === 403, lockedAccess.body);

  const checkout = await student.request('/payments/checkout', {
    method: 'POST',
    body: { courseId: course._id },
  });
  check('Demo checkout is created when Stripe is not configured', checkout.status === 201 && checkout.body.data.provider === 'demo', checkout.body);

  const beforeConfirm = await student.request('/enrollments/my');
  check('No enrollment exists before payment is confirmed', beforeConfirm.body.data.items.length === 0);

  const confirm = await student.request('/payments/demo/confirm', {
    method: 'POST',
    body: { orderId: checkout.body.data.orderId },
  });
  check('Demo payment confirmation marks the order paid', confirm.status === 200 && confirm.body.data.order.status === 'paid');
  check('Invoice number is generated after payment', Boolean(confirm.body.data.order.invoiceNumber));

  const afterConfirm = await student.request('/enrollments/my');
  check('Enrollment is created after verified payment', afterConfirm.body.data.items.length === 1);

  const duplicateConfirm = await student.request('/payments/demo/confirm', {
    method: 'POST',
    body: { orderId: checkout.body.data.orderId },
  });
  const afterDuplicate = await student.request('/enrollments/my');
  check(
    'Duplicate confirmations do not duplicate enrollment',
    duplicateConfirm.status === 200 && afterDuplicate.body.data.items.length === 1
  );

  const learn = await student.request(`/courses/${course._id}/learn`);
  check('Enrolled student can open the learning interface', learn.status === 200 && learn.body.data.curriculum.length === 1);

  const content = await student.request(`/lessons/${lessonId}/content`);
  check(
    'Enrolled student receives the protected video URL',
    content.status === 200 && content.body.data.lesson.video.url === 'https://example.com/private-video.mp4'
  );

  const complete = await student.request(`/lessons/${lessonId}/complete`, { method: 'POST', body: {} });
  check('Lesson completion updates progress', complete.status === 200 && complete.body.data.enrollment.progress === 50);

  const review = await student.request(`/reviews/course/${course._id}`, {
    method: 'POST',
    body: { rating: 5, comment: 'Excellent integration test course.' },
  });
  check('Enrolled student can review the course', review.status === 201, review.body);

  const duplicateReview = await student.request(`/reviews/course/${course._id}`, {
    method: 'POST',
    body: { rating: 4, comment: 'Trying to review twice.' },
  });
  check('Duplicate reviews are blocked', duplicateReview.status === 409);

  const reviews = await new Session().request(`/reviews/course/${course._id}`);
  check(
    'Review ratings update the course summary',
    reviews.status === 200 && reviews.body.data.summary.count === 1 && reviews.body.data.summary.average === 5
  );

  const question = await student.request('/questions', {
    method: 'POST',
    body: { lessonId, content: 'How does this integration test work?' },
  });
  check('Enrolled student can ask a question', question.status === 201, question.body);

  const adminNotifications = await admin.request('/notifications/unread-count');
  check('Admin receives unread realtime notification records', adminNotifications.body.data.unread >= 2);

  const adminQuestions = await admin.request('/questions/admin/all');
  const questionId = adminQuestions.body.data.items[0]?._id;
  check('Admin can list student questions', adminQuestions.status === 200 && Boolean(questionId));

  const answer = await admin.request(`/questions/${questionId}/answers`, {
    method: 'POST',
    body: { content: 'It exercises the real API against an in-memory database.' },
  });
  check('Admin can answer a question', answer.status === 200 && answer.body.data.question.isResolved === true);

  const courseList = await new Session().request('/courses?search=Integration');
  check('Course catalog search works', courseList.status === 200 && courseList.body.data.items.length === 1);

  const categories = await new Session().request('/categories');
  check('Categories endpoint includes course counts', categories.status === 200 && categories.body.data.categories[0].courseCount === 1);

  const coursesCsv = await admin.request('/orders/admin/export');
  check('Admin can export orders as CSV', coursesCsv.status === 200 && String(coursesCsv.body).includes('Invoice'));

  const stats = await admin.request('/admin/stats');
  check(
    'Admin analytics totals reflect real data',
    stats.status === 200 &&
      stats.body.data.totals.students === 2 &&
      stats.body.data.totals.revenue === 39.99 &&
      stats.body.data.totals.enrollments === 1,
    stats.body
  );

  const analytics = await admin.request('/admin/analytics');
  check('Analytics returns a 12-month series', analytics.status === 200 && analytics.body.data.monthly.length === 12);

  const users = await admin.request('/admin/users?search=student@test.local');
  check('Admin user search works', users.status === 200 && users.body.data.items.length === 1);
  const studentId = users.body.data.items[0]._id;

  const userDetail = await admin.request(`/admin/users/${studentId}`);
  check('Admin can view user enrollment history', userDetail.status === 200 && userDetail.body.data.enrollments.length === 1);

  const selfDemote = await admin.request(`/admin/users/${adminLogin.body.data.user._id}`, {
    method: 'PATCH',
    body: { role: 'student' },
  });
  check('Admin cannot demote their own account', selfDemote.status === 400);

  const refresh = await student.request('/auth/refresh', { method: 'POST' });
  check('Refresh token rotation works', refresh.status === 200);

  const homepageUpdate = await admin.request('/homepage', {
    method: 'PATCH',
    body: { hero: { headline: 'Integration headline for testing' } },
  });
  const homepage = await new Session().request('/homepage');
  check(
    'Homepage customization is persisted and public',
    homepageUpdate.status === 200 && homepage.body.data.hero.headline === 'Integration headline for testing',
    homepageUpdate.body
  );

  const faqCreate = await admin.request('/admin/faqs', {
    method: 'POST',
    body: { question: 'Is this tested?', answer: 'Yes, end to end.', order: 99 },
  });
  await Faq.deleteMany({});
  check('FAQ creation works', faqCreate.status === 201);

  const uploads = await admin.request('/uploads/status');
  check('Upload status reports missing Cloudinary credentials', uploads.body.data.cloudinary === false);

  const order = await student.request(`/orders/${checkout.body.data.orderId}`);
  check('Student can view their invoice/order', order.status === 200 && order.body.data.order.invoiceNumber);

  const logout = await student.request('/auth/logout', { method: 'POST' });
  const afterLogout = await student.request('/auth/me');
  check('Logout clears the session', logout.status === 200 && afterLogout.status === 401);

  const { default: serverlessApp } = await import('../../api/index');
  const serverlessServer = http.createServer(serverlessApp);
  await new Promise<void>((resolve) => serverlessServer.listen(0, '127.0.0.1', resolve));
  const serverlessAddress = serverlessServer.address();
  const serverlessPort =
    typeof serverlessAddress === 'object' && serverlessAddress ? serverlessAddress.port : 0;
  const serverlessBase = `http://127.0.0.1:${serverlessPort}`;

  const serverlessHealth = await fetch(`${serverlessBase}/api/health`);
  const serverlessHealthBody: any = await serverlessHealth.json();
  check(
    'Vercel entry serves the health route',
    serverlessHealth.status === 200 && serverlessHealthBody.data?.status === 'ok'
  );

  const serverlessLogin = await fetch(`${serverlessBase}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@test.local', password: 'Admin@12345' }),
  });
  const serverlessLoginBody: any = await serverlessLogin.json();
  check(
    'Vercel entry awaits MongoDB and preserves auth middleware',
    serverlessLogin.status === 200 && serverlessLoginBody.data?.user?.role === 'admin'
  );
  await new Promise<void>((resolve) => serverlessServer.close(() => resolve()));

  console.log(`\n${passed} passed, ${failed} failed`);

  server.close();
  const { disconnectDB } = await import('../config/db');
  await disconnectDB();
  await mongod.stop();
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error('Test run crashed:', error);
  process.exit(1);
});

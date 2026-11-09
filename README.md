# Learnova

**Learnova** is a modern, premium online learning platform for ambitious engineers and designers. This repository contains the complete Learnova LMS: a Next.js storefront and workspace, a secure Express API, verified payments, protected course delivery and a full admin console.

A production-oriented Learning Management System built as a monorepo:

| App | Stack | Location |
| --- | --- | --- |
| Frontend | Next.js 15 App Router, React 19, TypeScript, Tailwind CSS, Redux Toolkit + RTK Query, React Hook Form + Zod, Recharts, Lucide, Socket.IO client | `client/` |
| Backend | Node.js, Express 4, TypeScript, MongoDB + Mongoose, JWT access/refresh cookies, Socket.IO, Stripe, Cloudinary, Nodemailer + EJS, ioredis | `server/` |

The application covers the complete learning lifecycle: public storefront → account creation with email OTP → course catalog → verified payment → enrollment → protected lessons and progress → reviews and Q&A → admin operations, analytics and site customization.

---

## 1. Feature overview

### Storefront & accounts
- Server-driven homepage: hero, benefits, featured courses, categories, testimonials (from real reviews) and FAQs — all editable in the admin console.
- Course catalog with search, category/level/price filters, sorting, pagination and URL-synced filters.
- Course detail page with curriculum previews (free-preview lessons only), instructor, outcomes, requirements, reviews and rating breakdown.
- Registration with six-digit email OTP, resend, verification; login, logout, forgot/reset password; profile name/bio/avatar; password change.
- Access + refresh token pair in HTTP-only cookies with rotation; automatic 401 → refresh → retry in RTK Query.
- Light/dark themes, responsive layouts, loading skeletons, empty states, toasts, confirm dialogs and accessible controls.

### Students
- Dashboard overview: enrolled courses, progress, learning time, spend, resume lesson, recent payments, recommendations.
- My courses, payments/invoices (printable invoice dialog) and account settings.
- Learning interface: protected video player, section/lesson navigation, prev/next, mark-complete with progress recalculation, resources, lesson Q&A, review submission.
- In-app notifications inbox (persisted) plus real-time Socket.IO notifications.

### Payments
- Stripe Checkout creation on the server; no card data touches the app.
- Signed, raw-body Stripe webhook (`/api/payments/webhook`) verifies payments and grants enrollment — never the browser redirect.
- Idempotent confirmation: duplicate webhook deliveries or duplicate browser confirmations cannot double-charge or double-enroll.
- Automatic invoice number on paid orders; invoice dialog; CSV export for orders.
- Explicit demo mode when Stripe is not configured (development only, never in production), requiring the student to confirm deliberately.

### Admin console (required 11 sections + 2 extras)
1. **Overview** — revenue, students, courses, rating, monthly sales, attention queue, recent orders/students, top courses.
2. **Analytics** — Recharts revenue, enrollments, category split, revenue by course, review distribution.
3. **Courses** — searchable/filterable table, publish/unpublish, create/edit/delete, full course editor with sections, lessons, reordering, preview flags, resources, Cloudinary/external video and thumbnails.
4. **Categories** — create, edit, reorder visibility, hide/show, delete.
5. **Students** — search/filter, enrollments, role and active-state management with server-side self-protection.
6. **Orders** — search/status/provider filters, invoices, CSV export.
7. **Invoices** — paid orders only, printable invoice documents, CSV export.
8. **Notifications** — real-time admin inbox with mark-all-read and clear.
9. **Website customization** — homepage hero (text + image upload), benefits and featured courses with live preview.
10. **FAQs** — create, edit, reorder, show/hide and delete homepage/contact FAQs.
11. **Settings** — brand, currency, tagline, footer, contact details, social links and integration status.
12. **Questions** (extra) — answer lesson questions, resolve/reopen, unanswered queue.
13. **Reviews** (extra) — filter by rating, publish official replies, delete abusive reviews.

### Quality & security highlights
- Backend RBAC on every admin route (`authenticate` + `authorize('admin')`), not just hidden UI.
- Protected media: lesson content requires enrollment (or free preview / admin); Cloudinary video URLs are signed with short expiry at delivery time.
- Zod validation on request bodies/params; central error envelope; rate limits on auth and checkout; Helmet, CORS allow-list, request sanitization, httpOnly cookies, no secrets in code.
- Unique indexes prevent duplicate enrollments, duplicate reviews, duplicate Stripe sessions and invoice numbers.
- Redis cache wrapper with automatic in-memory fallback; cache invalidation on writes; RTK Query caching on the client.
- Mongo indexes for catalog/order/notification queries.

---

## 2. Repository layout

```
lms-platform/
├── client/
│   ├── src/app/                 # App Router routes
│   │   ├── (site)/              # Public storefront (header/footer)
│   │   ├── (auth)/              # Login, register, verify OTP, password reset
│   │   ├── dashboard/           # Student workspace
│   │   ├── admin/               # Admin console (11 sections + course editor)
│   │   └── learn/[courseId]/    # Standalone learning interface
│   ├── src/components/          # UI, layout, admin, invoice, notifications
│   ├── src/features/            # Redux slices (auth, notifications)
│   ├── src/hooks/               # useAuth, useRequireAuth, useDebounce
│   ├── src/services/            # RTK Query APIs + base query with refresh
│   ├── src/store/               # Redux store
│   ├── src/types/               # Shared TypeScript models
│   └── src/utils/               # Formatting, errors, socket helpers
├── server/
│   ├── src/config/              # env schema, db, redis cache, logger, cloudinary, stripe, mailer
│   ├── src/controllers/         # auth, course, curriculum, payment, admin, site…
│   ├── src/middleware/          # auth/RBAC, validation, rate limits, errors
│   ├── src/models/              # User, Course, Category, Enrollment, Order, Review, Question, Notification, Homepage, SiteSettings
│   ├── src/routes/              # Express routers
│   ├── src/services/            # email, enrollment, notification, cache, video signing
│   ├── src/sockets/             # Socket.IO user/admin rooms
│   ├── src/seed/                # seed.ts, createAdmin.ts
│   ├── src/__tests__/           # 49 integration tests (mongodb-memory-server)
│   └── src/validators/          # Zod request schemas
├── package.json                 # Root scripts (--prefix client/server)
├── .gitignore
└── README.md
```

---

## 3. Quick start (local)

### Prerequisites
- Node.js 20+ (verified on 24.18.0) and npm 10+
- A MongoDB connection string. Local MongoDB (`mongodb://127.0.0.1:27017/learnova_lms`) or a free MongoDB Atlas cluster.

### Steps
```bash
cd lms-platform

# 1. Install dependencies for both apps
npm run install:all

# 2. Configure the server
cp server/.env.example server/.env        # Windows PowerShell: Copy-Item server/.env.example server/.env
#    Edit MONGODB_URI (and optionally Stripe/Cloudinary/SMTP/Redis).

# 3. Configure the client
cp client/.env.example client/.env.local  # Windows PowerShell: Copy-Item client/.env.example client/.env.local

# 4. Seed demo content (drops the LMS collections first)
npm run seed

# 5. Run the API (terminal 1)
npm run dev:server      # http://localhost:5000

# 6. Run the web app (terminal 2)
npm run dev:client      # http://localhost:3000
```

### Seeded accounts
| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@learnova.local` | `Admin@12345` |
| Student | `aisha@student.learnova.local` | `Student@12345` |
| Student | `john@student.learnova.local` | `Student@12345` |
| Student | `priya@student.learnova.local` | `Student@12345` |
| Student | `lucas@student.learnova.local` | `Student@12345` |
| Student | `fatima@student.learnova.local` | `Student@12345` |
| Student | `emeka@student.learnova.local` | `Student@12345` |

Seed creates 7 categories, 8 courses × 3 sections × 3 lessons, enrollments with progress, paid demo orders with invoices, reviews and Q&A. The admin credentials above are also configurable via `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` before seeding. Change them for any real deployment.

### Root scripts
| Command | Purpose |
| --- | --- |
| `npm run install:all` | Install server + client dependencies |
| `npm run dev:server` / `dev:client` | Development servers |
| `npm run build:server` / `build:client` | Production builds (`server/dist`, `client/.next`) |
| `npm run seed` | Reset + seed demo data |
| `npm run create-admin` | Ensure an admin exists (add `-- --reset-password` to reset) |
| `npm run typecheck` | TypeScript check both apps |
| `npm test` | Backend integration suite |

---

## 4. Environment variables

### `server/.env`
| Variable | Required | Description |
| --- | --- | --- |
| `NODE_ENV` | Yes (prod) | `development`, `test` or `production` |
| `PORT` | No | API port, default `5000` |
| `MONGODB_URI` | Yes | MongoDB / Atlas connection string |
| `CLIENT_URL` | Yes | Exact browser origin allowed by CORS and used in emails; e.g. `https://app.example.com` |
| `APP_NAME` | No | Brand name used in emails |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | Yes (prod) | At least 16 chars; production refuses the default `change-me` values |
| `ACCESS_TOKEN_TTL`, `REFRESH_TOKEN_TTL` | No | Defaults `15m`, `7d` |
| `COOKIE_DOMAIN` | No | Only for shared parent domains, e.g. `.example.com` |
| `REDIS_URL` | No | Upstash/Redis; in-memory fallback otherwise |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | For uploads | Enables signed direct uploads (images + authenticated videos) |
| `CLOUDINARY_FOLDER` | No | Root folder name |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_CURRENCY` | For card payments | Enables Stripe Checkout and webhook verification |
| `ALLOW_DEMO_PAYMENTS` | No | Development-only demo checkout; forced off when `NODE_ENV=production` |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | For email | OTP and receipt emails; without SMTP, dev OTP is logged/returned |
| `ADMIN_*` | Seed only | Seed/create-admin defaults |
| `LOG_LEVEL` | No | `debug`, `info`, `warn`, `error` |

### `client/.env.local`
| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | Yes (prod) | API base including `/api`, default `http://localhost:5000/api` |
| `NEXT_PUBLIC_SOCKET_URL` | No | Socket.IO origin if different from the API origin |

`NEXT_PUBLIC_*` values are embedded at build time — rebuild the client after changing them.

---

## 5. External services setup

### MongoDB Atlas
1. Create a free M0 cluster and a database user.
2. Network access: allow your API host (or `0.0.0.0/0` for a demo, with a strong password).
3. Copy the SRV connection string into `MONGODB_URI` (include a database name, e.g. `/learnova_lms`).

### Cloudinary (media uploads)
1. Create a Cloudinary account and note cloud name, API key and secret.
2. Set the three `CLOUDINARY_*` variables on the API.
3. Images are signed and uploaded directly from the browser to `.../image/upload`; videos upload as **authenticated** assets to `.../video/upload`. Playback URLs are signed per request by the API for authorized users only.
4. Without credentials, admin upload controls show an explicit disabled state and support external video/image URLs instead.

### Stripe (real payments)
1. Set `STRIPE_SECRET_KEY` on the API.
2. Register the webhook endpoint: `https://<api-host>/api/payments/webhook`.
3. Subscribe to `checkout.session.completed`, `checkout.session.expired` and `payment_intent.payment_failed`.
4. Put the signing secret in `STRIPE_WEBHOOK_SECRET`.
5. Local testing:
   ```bash
   stripe listen --forward-to localhost:5000/api/payments/webhook
   # copy the printed whsec_... into STRIPE_WEBHOOK_SECRET and restart the API
   ```
6. Enrollment is granted only inside the verified webhook handler. The success page merely polls the order status; pending orders never grant access.

### SMTP (email OTP)
Set all `SMTP_*` variables and `MAIL_FROM`. In development without SMTP, the OTP is logged by the API and surfaced in the UI on the verification screen. In production, missing SMTP means users cannot receive codes.

### Upstash Redis (optional)
Set `REDIS_URL` to an Upstash `rediss://` URL. All cache access is wrapped with a safe in-memory fallback, so the app runs correctly without Redis.

---

## 6. Security model (summary)

- **RBAC**: admin APIs require an authenticated user with role `admin`; self-demotion and self-deactivation are blocked, as is removing the last admin.
- **Auth**: short-lived access JWT + rotating refresh JWT in `httpOnly` cookies; passwords hashed with bcrypt; OTP codes stored hashed with expiry and purpose; rate limits on login/OTP/checkout.
- **Payments**: server-created Stripe sessions; webhook signature verification with the raw body; idempotent, transactional enrollment; demo confirmation only for the order owner and only in non-production.
- **Content protection**: lesson playback and resources require enrollment (or an explicitly preview lesson), signed Cloudinary URLs expire, and lesson payloads never include protected URLs for unauthorized users.
- **Input/output**: Zod schemas on mutating endpoints, request sanitization, central error handling that hides internals, Helmet headers, CORS allow-list with credentials.
- **Secrets**: everything is read from environment variables; sample values exist only in `.env.example`.

---

## 7. Verification performed

These results reflect the actual state of the delivered project:

| Check | Result |
| --- | --- |
| Backend integration tests (`npm test`) | **49 passed, 0 failed** (in-memory MongoDB) |
| Server TypeScript build | Passes (`tsc`, emits `server/dist`) |
| Client TypeScript check | Passes (`tsc --noEmit`) |
| Client production build | Passes — all 37 routes compiled (36 pages + `/icon.svg`) |
| Production server smoke test (`next start`) | Login and admin console render; no hydration errors in the client console |
| API health and integration status | `GET /api/health` OK; integrations report Cloudinary off, Stripe off, in-memory cache, SMTP off |

Browser golden-path checks performed against the seeded database:
- Homepage, catalog search + filters + price sort, course detail.
- Register → dev OTP → verify → empty student dashboard.
- Seeded student login, dashboard stats, payments, invoice dialog (print), notifications.
- Demo checkout → explicit confirmation → paid order + invoice + enrollment; success page only after the order was actually paid.
- Learn interface: protected lesson loads, curriculum navigation, mark-complete updates progress (1/9, 11%), lesson Q&A posted.
- Student review submitted and rendered with rating summary.
- Admin login, overview metrics, analytics charts, courses table and editor (curriculum loaded, edit saved and verified through the API), students, orders, questions (admin reply published and unanswered count decreased), reviews, notifications (real-time events for purchase/question/review), categories, FAQs, website customization, settings.
- Access control: anonymous `/dashboard` redirects to login; a student visiting `/admin` is redirected to the student dashboard; all API RBAC behavior is covered by tests.

### Honest limitations of this environment
- No external credentials were available, so **real Stripe card payments, Cloudinary uploads, SMTP delivery and Upstash Redis were not exercised live**. Their code paths are implemented and unit/integration-tested where possible (including honest “not configured” behavior), but they require the credentials listed above to verify against the real services.
- Video playback used public sample MP4 URLs from the seed. The player element and signed-URL flow are implemented, but the automated headless browser could not decode remote MP4 media (`MEDIA_ERR_SRC_NOT_SUPPORTED`), so visual playback was not confirmed there. Cloudinary video signing requires Cloudinary credentials.
- Responsive layouts use Tailwind breakpoints throughout, but the automation browser did not expose viewport resizing, so mobile layouts were not visually verified in this run.
- The Next.js dev overlay in the automation browser reported a recoverable hydration warning; it disappeared in the production build (no hydration errors in the production console), so it is attributed to browser DOM instrumentation rather than the app.
- The project has **not** been deployed. Deployment instructions are provided below.

---

## 8. Deployment

### API (Render / Railway / Fly.io / any Node host)
1. Root directory: `server` (or use root scripts).
2. Build: `npm ci && npm run build`.
3. Start: `npm start` (runs `node dist/server.js`).
4. Set all production env vars:
   - `NODE_ENV=production`
   - `MONGODB_URI` (Atlas)
   - `CLIENT_URL=https://<your-client-domain>` (exact origin)
   - Strong `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`
   - `STRIPE_*`, `CLOUDINARY_*`, `SMTP_*`, `REDIS_URL` as available
5. The app trusts the first proxy hop, so HTTPS behind a load balancer works; production cookies are `Secure` + `SameSite=None`.
6. Register the Stripe webhook against the deployed URL.
7. Verify `GET https://<api-host>/api/health` returns `database: "connected"`.

### Client (Vercel or any Next.js host)
1. Root directory: `client`.
2. Set `NEXT_PUBLIC_API_URL=https://<api-host>/api` (and `NEXT_PUBLIC_SOCKET_URL` if needed) **before building**.
3. Build: `npm run build`; start: `npm start`.
4. `next.config.ts` already allows `res.cloudinary.com`, `images.unsplash.com` and `ui-avatars.com` for `next/image`. Add your own image hosts if you use different domains.
5. Ensure the API `CLIENT_URL` matches the deployed client origin exactly; no trailing slash.

### Seed an admin in production
```bash
cd server
npm run create-admin
# uses ADMIN_NAME / ADMIN_EMAIL / ADMIN_PASSWORD from the environment
```
Run `npm run seed` only on a demo/staging database — it clears LMS collections first.

### Post-deploy checklist
- [ ] Health endpoint connected to Atlas
- [ ] Register/login with a real email (SMTP configured)
- [ ] Stripe test card purchase → webhook shows in dashboard → enrollment appears
- [ ] Admin upload of a thumbnail and a video (Cloudinary configured)
- [ ] Student cannot open another student’s lesson URL
- [ ] Theme toggle and mobile navigation work on a real device
- [ ] `ALLOW_DEMO_PAYMENTS` is ineffective in production (by design)

---

## 9. API surface (high level)

| Group | Base | Notes |
| --- | --- | --- |
| Auth | `/api/auth` | register, verify-otp, resend-otp, login, logout, refresh, me, forgot/reset password |
| Courses | `/api/courses` | catalog, detail, admin CRUD, publish, curriculum |
| Curriculum | `/api` | sections/lessons, reorder, lesson content + signed playback URL |
| Enrollments | `/api/enrollments` | list, progress, complete lesson |
| Payments | `/api/payments` | config, checkout, demo confirm, Stripe webhook (raw body) |
| Orders | `/api/orders` | student orders, admin list, CSV export, invoice data |
| Reviews | `/api/reviews` | course reviews, create, admin reply/delete |
| Questions | `/api/questions` | lesson Q&A, answers, resolve |
| Notifications | `/api/notifications` | list, unread count, mark read/all, clear |
| Admin | `/api/admin` | stats, analytics, users, role/active management |
| Site | `/api` | homepage content, settings, FAQ CRUD (admin) |
| Uploads | `/api/uploads` | Cloudinary signature, status, legacy image endpoint |

All responses use `{ success, message, data }`; errors use `{ success: false, message, code, errors? }`.

---

## 10. Notes

- Learnova is the product and brand identity across the UI, metadata, emails, invoices, seed content and documentation. API routes, database collection names, model names and environment variable names were intentionally left unchanged so existing deployments and integrations keep working.
- Demo data is intentionally generic and is not production content. Replace it before launch.
- The demo checkout exists so the flow is testable without Stripe. It is disabled automatically in production and never grants access without explicit confirmation by the order owner.
- No real credentials are included in this repository. Configure the environment variables above to connect external services.

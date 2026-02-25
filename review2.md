# SOS Auto DZ — Comprehensive Project Review (v2)

> **Date:** Post-fixes review after resolving all 8 critical bugs from `review.md`  
> **Scope:** Full-stack code audit — backend (Express/MongoDB) + frontend (React/TypeScript/Vite)

---

## Table of Contents

1. [Summary of Completed Fixes](#1-summary-of-completed-fixes)
2. [Bugs Still Present](#2-bugs-still-present)
3. [Security Issues](#3-security-issues)
4. [Database & Data Model Issues](#4-database--data-model-issues)
5. [Backend Architecture Issues](#5-backend-architecture-issues)
6. [Frontend Architecture Issues](#6-frontend-architecture-issues)
7. [UX / UI Improvements](#7-ux--ui-improvements)
8. [Missing Features](#8-missing-features)
9. [Performance & Scalability](#9-performance--scalability)
10. [DevOps & Deployment](#10-devops--deployment)
11. [Code Quality & Maintenance](#11-code-quality--maintenance)
12. [Prioritized Action Plan](#12-prioritized-action-plan)

---

## 1. Summary of Completed Fixes

These issues from the original `review.md` have been **successfully resolved**:

| # | Issue | Status |
|---|-------|--------|
| 1.1 | Registration now sends `description`, `specialty`, `workingDays`, `workingHours` for professionals | ✅ Fixed |
| 1.2 | Vite proxy double `/api` path fixed with `rewrite` rule | ✅ Fixed |
| 1.3 | Availability toggle now persists to the database via `providersAPI.update()` | ✅ Fixed |
| 1.4 | Password change form works end-to-end with `PUT /api/auth/password` | ✅ Fixed |
| 1.5 | Admin dashboard uses real data from `adminAPI`, with `isVerified` field on ServiceProvider | ✅ Fixed |
| 1.6 | BookingModal no longer asks for redundant name/phone (uses `req.user`) | ✅ Fixed |
| 1.7 | Login no longer spams a "Welcome back" notification | ✅ Fixed |
| 1.8 | Professional stats computed from real bookings and provider profile data | ✅ Fixed |

---

## 2. Bugs Still Present

### 2.1 — `profileSaveMsg` success detection is fragile
**File:** `frontend/pages/Dashboard.tsx` (line ~695)  
**Problem:** Success/error color is decided by `profileSaveMsg.includes('success')`. If the translation for "Changes saved" doesn't contain "success", the message will show as red (error) even on success.  
**Fix:** Track a separate `profileSaveOk: boolean` state variable, similar to `pwMsg.ok`.

### 2.2 — `generateMockBookings` dead code still present
**File:** `frontend/pages/Dashboard.tsx` (lines ~16-42)  
**Problem:** The `generateMockBookings` function is defined but never called. Dead code wastes bundle size and confuses maintainers.  
**Fix:** Delete the entire function.

### 2.3 — CORS wildcard fallback
**File:** `backend/server.js` (line 24)  
```js
origin: process.env.FRONTED_URL || '*',
```
**Problem:** If `FRONTED_URL` env var is unset, any domain can make credentialed requests. Also `FRONTED_URL` has a typo (should be `FRONTEND_URL`).  
**Fix:** Remove the `|| '*'` fallback. Rename the env var to `FRONTEND_URL`.

### 2.4 — Notification model has redundant `timestamp` field
**File:** `backend/models/Notification.js`  
**Problem:** The schema has both a manual `timestamp: { type: Date, default: Date.now }` field AND `timestamps: true` (which auto-creates `createdAt` + `updatedAt`). This creates confusing duplicates.  
**Fix:** Remove the manual `timestamp` field and use `createdAt` everywhere (backend queries + frontend mapping).

### 2.5 — ServiceProvider default image is a random external URL
**File:** `backend/models/ServiceProvider.js` (line ~53)  
```js
image: { type: String, default: 'https://picsum.photos/400/300' }
```
**Problem:** `picsum.photos` returns a *different random image on every load*. This is unreliable for production and means every page refresh shows a different image for the same provider.  
**Fix:** Replace with a deterministic placeholder (e.g. a local SVG, or a Cloudinary-hosted default image, or generate one from the provider name).

### 2.6 — Booking `date` stored as String
**File:** `backend/models/Booking.js`  
```js
date: { type: String, required: true }
```
**Problem:** Storing dates as strings prevents date-range queries, sorting by date, and timezone handling.  
**Fix:** Change to `type: Date`. Update the booking creation route to parse the date string. The frontend already sends `YYYY-MM-DD` which can be parsed.

### 2.7 — Vite proxy rewrite strips `/api` incorrectly
**File:** `frontend/vite.config.ts`  
**Problem:** The proxy config targets `VITE_REACT_APP_BACKEND_BASEURL` and rewrites `/api` prefix to nothing. But in `api.ts`, the base URL is already `VITE_REACT_APP_BACKEND_BASEURL` which typically includes `/api`. This means in dev mode, requests go through the proxy AND through the direct URL. The proxy configuration only matters if the frontend code uses relative `/api/...` paths, but currently it uses the full URL via `API_URL`.  
**Impact:** The proxy is effectively unused. In production, the frontend directly calls the backend URL.  
**Fix:** Either use relative `/api/...` paths in `api.ts` during development (and let the proxy forward), or remove the proxy configuration entirely if you're relying on direct backend URLs.

### 2.8 — NotificationDropdown has hardcoded English strings
**File:** `frontend/components/NotificationDropdown.tsx`  
**Problem:** Contains hardcoded strings: `"Notifications"`, `"Clear all"`, `"No new notifications"`, `"Mark as read"`. This component doesn't receive a `language` prop.  
**Fix:** Pass `language` prop and use `translations[language]` for all strings.

### 2.9 — DistanceIndicator has hardcoded English strings
**File:** `frontend/components/DistanceIndicator.tsx`  
**Problem:** Contains: `"Distance unknown"`, `"Near you"`, `"Moderate distance"`, `"Far location"`. Not translated.  
**Fix:** Accept a `language` prop and use translations.

### 2.10 — Footer contact info is hardcoded placeholder
**File:** `frontend/components/Footer.tsx`  
**Problem:** `"123 Didouche Mourad St"`, `"+213 550 00 00 00"`, `"contact@sosautodz.com"` are hardcoded fake placeholders. Footer links (`#` hrefs) do nothing.  
**Fix:** Use real contact info or make them configurable. Hook footer nav links to actual `onChangeView()` calls.

### 2.11 — Home page stats are hardcoded marketing claims
**File:** `frontend/pages/Home.tsx`  
**Problem:** `"58"` wilayas, `"2k+"` mechanics, `"15m"` response time, `"5.0"` rating are all hardcoded. They don't reflect real data.  
**Fix:** Either fetch real stats from an API endpoint, or clearly mark them as marketing copy. Consider removing claims that can't be backed up.

---

## 3. Security Issues

### 3.1 — No request input validation
**Severity:** HIGH  
**Problem:** `express-validator` is installed in `package.json` but **never imported or used** in any route. User input goes directly into database queries without sanitization.  
**Risk:** NoSQL injection via crafted query parameters (e.g., `role[$ne]=CLIENT`), XSS via stored content (provider descriptions).  
**Fix:** Add validation middleware using `express-validator` to every route. At minimum validate: email format, password length, role enum, wilayaId range, ObjectId format.

### 3.2 — No rate limiting
**Severity:** HIGH  
**Problem:** No rate limiting on any endpoint. Login, registration, password change can all be brute-forced.  
**Fix:** Install `express-rate-limit`. Apply strict limits to `/api/auth/login` (e.g., 5 attempts/15min per IP) and `/api/auth/register`. Apply moderate limits to other endpoints.

### 3.3 — No security headers (Helmet)
**Severity:** MEDIUM  
**Problem:** No `helmet` middleware. Missing `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, `Content-Security-Policy`, etc.  
**Fix:** `npm install helmet` and add `app.use(helmet())` before routes.

### 3.4 — JWT token in localStorage
**Severity:** MEDIUM  
**Problem:** JWT is stored in `localStorage`, which is accessible to any JavaScript running on the page (XSS target).  
**Better:** Use HTTP-only cookies for JWT storage. If localStorage must be used, ensure strict CSP headers and XSS prevention.

### 3.5 — 30-day JWT expiry with no refresh mechanism
**Severity:** MEDIUM  
**Problem:** Tokens are valid for 30 days with no refresh token rotation. If a token is compromised, it remains valid for a month.  
**Fix:** Reduce token expiry to 1-7 days. Implement a refresh token mechanism with token rotation.

### 3.6 — No authorization check on provider update route
**File:** `backend/routes/providers.js`  
**Problem:** The `GET /api/providers/user/:userId` route allows any authenticated user to fetch any other user's provider profile by userId. While this may be intentional, the route could be abused to enumerate all providers by userId.  
**Fix:** Either make it public (no auth required if data is public anyway) or restrict to the user's own profile or admin.

### 3.7 — Admin role can be set during registration
**File:** `backend/routes/auth.js`  
**Problem:** The registration endpoint accepts any `role` value from the request body, including `'ADMIN'`. While the frontend filters ADMIN from the UI, a direct API call could create admin accounts.  
**Fix:** Add server-side validation: reject `role: 'ADMIN'` in the register route, or only allow admin creation via a specific seeded user/command.

### 3.8 — Password field exposure in User model
**File:** `backend/models/User.js`  
**Problem:** While `select: false` is set on the password field, some routes use `.select('+password')` to explicitly include it. If any of these responses accidentally send the full user object without filtering, the hash could leak.  
**Fix:** Always explicitly pick fields before sending responses. Consider using a `toJSON()` transform on the schema to strip sensitive fields.

### 3.9 — No CSRF protection
**Severity:** LOW (since using token-based auth, not cookies)  
**Note:** If you move to HTTP-only cookies for JWT, you'll need CSRF tokens (`csurf` or similar).

---

## 4. Database & Data Model Issues

### 4.1 — No indexes on frequently queried fields
**Severity:** MEDIUM  
**Problem:** No custom indexes defined on any model. Common queries like `ServiceProvider.find({ role, wilayaId })` and `Booking.find({ clientId })` will do full collection scans.  
**Fix:** Add compound indexes:
```js
// ServiceProvider
serviceProviderSchema.index({ role: 1, wilayaId: 1 });
serviceProviderSchema.index({ userId: 1 }, { unique: true });

// Booking
bookingSchema.index({ clientId: 1, createdAt: -1 });
bookingSchema.index({ providerId: 1, createdAt: -1 });

// Notification
notificationSchema.index({ userId: 1, createdAt: -1 });

// User
userSchema.index({ email: 1 }, { unique: true }); // already unique, but explicit index
```

### 4.2 — Booking model has denormalized data without sync
**Problem:** `providerName`, `providerPhone`, `clientName`, `clientPhone` are stored directly in the Booking document. If a user or provider updates their name/phone, existing bookings show stale data.  
**Options:**
- (A) Keep denormalized but add a background job to sync when names change.
- (B) Store only references (`providerId`, `clientId`) and populate at read time.
- (C) Accept the denormalization as a snapshot of the data at booking time (document this decision).

### 4.3 — No Review/Rating model
**Problem:** `ServiceProvider` has `rating` and `totalReviews` fields but **no Review model exists**. There's no way for users to submit, view, or manage reviews. The rating is always 0 for real providers.  
**Fix:** Create a `Review` model:
```js
const reviewSchema = new mongoose.Schema({
  bookingId: { type: ObjectId, ref: 'Booking', required: true, unique: true },
  providerId: { type: ObjectId, ref: 'ServiceProvider', required: true },
  userId: { type: ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, maxlength: 500 },
}, { timestamps: true });
```
Add review CRUD routes and update provider `rating`/`totalReviews` on each new review.

### 4.4 — No pagination on any list endpoint
**Problem:** All of `GET /providers`, `GET /bookings`, `GET /notifications` return all matching documents. With scale, this will timeout/OOM.  
**Fix:** Add `?page=1&limit=20` query params with skip/limit logic. Return `{ data: [...], total: N, page: 1, pages: 5 }`.

### 4.5 — No soft delete on bookings
**Problem:** `DELETE /api/bookings/:id` calls `booking.deleteOne()` — a permanent hard delete. Deleted booking data is lost forever.  
**Fix:** Add `isDeleted: Boolean` field, set it to `true` on delete, filter it out in queries. Or change the delete route to set status to `'CANCELLED'` instead.

### 4.6 — User model duplicates professional fields
**Problem:** `User` has `garageType`, `wilayaId`, `commune`, `isAvailable` — but `ServiceProvider` has the same fields. This creates dual source-of-truth issues. The `auth/profile` route manually syncs `name`/`phone` to ServiceProvider, but other fields like `isAvailable` can get out of sync between the two models.  
**Fix:** Consider removing professional-specific fields from User model and always reading from ServiceProvider for professionals.

---

## 5. Backend Architecture Issues

### 5.1 — DB connection middleware on every request
**File:** `backend/server.js` (lines 42-49)  
```js
app.use(async (req, res, next) => {
  await connectDB();
  next();
});
```
**Problem:** `connectDB()` is called on **every single request**. While the function caches the connection, the async overhead and the try/catch add latency to every request.  
**Fix:** Connect once at startup (outside middleware). For Vercel serverless, connect in the middleware but optimize the cached check.

### 5.2 — Redundant `dotenv.config()` in cloudinary.js
**File:** `backend/config/cloudinary.js`  
**Problem:** Calls `dotenv.config()` independently. `server.js` already loads env vars with an explicit path. The redundant call uses default path and may load different values.  
**Fix:** Remove `dotenv.config()` from `cloudinary.js`.

### 5.3 — Error responses leak stack traces in non-development mode
**File:** `backend/server.js`  
**Problem:** The 500 error handler:
```js
error: process.env.NODE_ENV === 'development' ? err : {}
```
This is good, but individual route handlers return `error: error.message` in catch blocks. The `error.message` from Mongoose validation errors can leak schema details.  
**Fix:** Standardize error responses. Only return `error.message` in development. In production, return generic messages.

### 5.4 — No structured logging
**Problem:** All logging uses `console.log/console.error`. No log levels, no timestamps, no request correlation.  
**Fix:** Use a structured logger like `winston` or `pino` with log levels (info, warn, error) and request IDs.

### 5.5 — No `process.env` validation at startup
**Problem:** If `JWT_SECRET`, `MONGODB_URI`, or `CLOUDINARY_*` env vars are missing, the server starts but crashes on the first request that uses them.  
**Fix:** Validate all required environment variables at startup. Fail fast with a clear error message.

### 5.6 — `@google/genai` dependency in frontend package.json
**File:** `frontend/package.json`  
**Problem:** `@google/genai` (v1.40.0) is listed as a dependency but **never imported or used anywhere** in the frontend code.  
**Fix:** Remove unused dependency: `npm uninstall @google/genai`.

---

## 6. Frontend Architecture Issues

### 6.1 — No client-side routing (React Router)
**Severity:** HIGH  
**Problem:** Navigation uses `useState<PageView>` and a `switch/case` in `renderContent()`. This means:
- Browser back/forward buttons don't work
- URLs never change (always shows `/`)
- Can't deep-link to a specific page
- Can't share a URL to a specific provider or page
- No SEO whatsoever  
**Fix:** Install `react-router-dom`. Define routes for `/`, `/garage`, `/parts`, `/towing`, `/dashboard`, `/providers/:id`. Replace `PageView` state with URL-based routing.

### 6.2 — No global state management
**Problem:** User state, notifications, dark mode, and language are all threaded through props from `App.tsx` down the component tree. This causes:
- Deep prop drilling (Navbar receives 13 props)
- Scattered state updates
- No centralized auth state  
**Fix:** Use React Context (at minimum for `user`, `theme`, `language`) or a state library like Zustand/Jotai.

### 6.3 — Dark mode and language not persisted
**Problem:** Dark mode defaults to `true` and language defaults to `'en'` on every page refresh. User preferences are lost.  
**Fix:** Save to `localStorage`:
```ts
const [isDarkMode, setIsDarkMode] = useState(() => 
  localStorage.getItem('darkMode') !== 'false' // default true
);
useEffect(() => localStorage.setItem('darkMode', String(isDarkMode)), [isDarkMode]);
```
Same for language.

### 6.4 — No loading/error states for many API calls
**Problem:** While `ServicesPage` and `Dashboard` have loading spinners, several API calls have no visible loading or error feedback:
- `App.tsx` auth check (`checkAuth`) — no loading indicator, no retry
- Notification fetching — silent failure
- Booking status changes — no optimistic UI, no error toast
- Admin approve — no loading, no error  
**Fix:** Add loading spinners and error toasts/alerts for all async operations.

### 6.5 — No error boundaries
**Problem:** If any component throws a runtime error, the entire app crashes to a white screen.  
**Fix:** Wrap the app (and key routes) in React Error Boundaries with a fallback UI.

### 6.6 — `any` type used extensively
**Problem:** Throughout `api.ts` and in API response mapping code, `any` type is used (~25+ occurrences). This defeats TypeScript's purpose.  
**Fix:** Define proper interfaces for API responses and use them consistently. E.g.:
```ts
interface ApiProvider {
  _id: string;
  name: string;
  role: string;
  // ...
}
```

### 6.7 — Dashboard.tsx is 728 lines — needs splitting
**Problem:** A single component file with 728 lines containing `ClientOverview`, `ProfessionalOverview`, `AdminOverview`, `StatCard`, settings form, password form, bookings list, and avatar upload logic.  
**Fix:** Extract into separate components:
- `components/dashboard/ClientOverview.tsx`
- `components/dashboard/ProfessionalOverview.tsx`
- `components/dashboard/AdminOverview.tsx`
- `components/dashboard/SettingsTab.tsx`
- `components/dashboard/BookingsTab.tsx`
- `components/dashboard/StatCard.tsx`

### 6.8 — AuthModal.tsx is 529 lines — needs splitting
**Problem:** Contains login form, registration form, role selection, professional fields, brand picker, day picker, all in one component.  
**Fix:** Extract into:
- `components/auth/LoginForm.tsx`
- `components/auth/RegisterForm.tsx`
- `components/auth/ProfessionalFields.tsx`
- `components/auth/BrandPicker.tsx`

### 6.9 — translations.ts is 927 lines of inline objects
**Problem:** All three languages (en, fr, ar) are in a single file. As translations grow, this becomes unmanageable.  
**Fix:** Split into `translations/en.ts`, `translations/fr.ts`, `translations/ar.ts`. Or use a proper i18n library like `react-intl` or `i18next`.

### 6.10 — No TypeScript strict mode
**File:** `frontend/tsconfig.json`  
**Problem:** Check if `strict: true` is enabled. Many type issues (implicit `any`, null checks) may be silently passing.  
**Fix:** Ensure `strict: true` in tsconfig. Address all resulting type errors.

---

## 7. UX / UI Improvements

### 7.1 — "Forgot Password" link does nothing
**File:** `frontend/components/AuthModal.tsx` (line ~527)  
**Problem:** The "Forgot Password?" text is a styled `<p>` element with `cursor-pointer` but no `onClick` handler. Clicking it does nothing.  
**Fix:** Either implement a password reset flow (email-based) or remove the link.

### 7.2 — "Leave Review" button does nothing
**File:** `frontend/pages/Dashboard.tsx` — `ClientOverview` component  
**Problem:** Completed bookings show a "Leave Review" button, but it has no click handler.  
**Fix:** Implement a review modal that submits to a review API endpoint (requires implementing the Review model first — see 4.3).

### 7.3 — "View All" button in ProfessionalOverview does nothing
**File:** `frontend/pages/Dashboard.tsx` — `ProfessionalOverview` component  
**Problem:** The "View All" button next to "Incoming Requests" has no click handler.  
**Fix:** Wire it to switch to the BOOKINGS tab: `onClick={() => setActiveTab('BOOKINGS')}`.

### 7.4 — No confirmation dialog for destructive actions
**Problem:** Booking cancellation/decline, notification clearing, and logout all happen immediately without confirmation.  
**Fix:** Add a confirmation modal for: cancel booking, decline request, clear all notifications, and logout.

### 7.5 — Booking date picker allows past dates
**File:** `frontend/components/BookingModal.tsx`  
**Problem:** The `<input type="date">` has no `min` attribute. Users can book for dates in the past.  
**Fix:** Add `min={new Date().toISOString().split('T')[0]}` to the date input.

### 7.6 — No booking time slot selection
**Problem:** The booking only captures a date, not a time. Users can't specify morning vs afternoon vs a specific hour.  
**Fix:** Add a time slot selector considering the provider's `workingHours`.

### 7.7 — WhatsApp link doesn't handle Algerian phone format correctly
**File:** `frontend/components/ServiceCard.tsx`  
```js
provider.phone.replace(/\D/g, '')
```
**Problem:** If the phone is `0550112233`, the WhatsApp link becomes `wa.me/0550112233` which is incorrect. WhatsApp requires the international format `wa.me/213550112233`.  
**Fix:** Convert Algerian numbers by stripping the leading `0` and prepending `213`:
```js
const phone = provider.phone.replace(/\D/g, '');
const waPhone = phone.startsWith('0') ? '213' + phone.slice(1) : phone;
```
(Note: Dashboard.tsx does this correctly for bookings, but ServiceCard.tsx does not.)

### 7.8 — No search results count
**File:** `frontend/pages/ServicesPage.tsx`  
**Problem:** After filtering, users don't see how many results were found.  
**Fix:** Show a count: `"Showing 12 providers"` above the results grid.

### 7.9 — Mobile notification bell missing in Navbar
**File:** `frontend/components/Navbar.tsx`  
**Problem:** On mobile, the notification bell is not shown. Users on mobile can't see or manage notifications.  
**Fix:** Add the notification bell to the mobile action bar (next to the dashboard icon).

### 7.10 — No empty state for admin pending approvals
**File:** `frontend/pages/Dashboard.tsx` — `AdminOverview`  
**Problem:** Shows `"No pending approvals"` but could be more helpful.  
**Fix:** Show a more descriptive empty state with an icon and explanation.

---

## 8. Missing Features

### 8.1 — Email verification
**Priority:** HIGH  
**Problem:** Users can register with any email without verification. Fake/mistyped emails are accepted.  
**Fix:** Send a verification email with a token link after registration. Require email verification before allowing login.

### 8.2 — Password reset (Forgot Password)
**Priority:** HIGH  
**Problem:** If a user forgets their password, there's no recovery mechanism.  
**Fix:** Implement `POST /api/auth/forgot-password` (sends email with reset token) and `POST /api/auth/reset-password/:token`.

### 8.3 — Rating & Review system
**Priority:** HIGH  
**Problem:** The platform's value depends on trust signals. Providers show `rating: 0` because there's no way to leave reviews.  
**Fix:** Create Review model, API routes, and frontend review modal (see 4.3 and 7.2).

### 8.4 — Real-time notifications (WebSocket/SSE)
**Priority:** MEDIUM  
**Problem:** Notifications are only fetched on login and page load. Users don't see new booking requests until they refresh.  
**Fix:** Implement Socket.IO or Server-Sent Events for real-time notification push.

### 8.5 — Provider image upload
**Priority:** MEDIUM  
**Problem:** Service providers can't upload their own shop/garage images. They're stuck with the random picsum.photos placeholder.  
**Fix:** Add an image upload feature similar to the avatar upload, but for the provider's `image` field.

### 8.6 — Search by provider name across all categories
**Priority:** MEDIUM  
**Problem:** The search on ServicesPage only searches within the currently selected category.  
**Fix:** Add a global search that searches across all provider types, or implement server-side text search with MongoDB text indexes.

### 8.7 — Booking management for professionals
**Priority:** MEDIUM  
**Problem:** Professionals can accept/decline bookings but can't:
- Set a price for a booking
- Add notes for the client
- Mark specific time slots as busy
- See a calendar view  
**Fix:** Add price-setting UI, notes field, calendar view for professionals.

### 8.8 — Client booking cancellation
**Priority:** MEDIUM  
**Problem:** Clients can see their bookings but the UI doesn't show a cancel button. The DELETE route exists but isn't exposed in the UI for clients.  
**Fix:** Add a cancel button for PENDING and CONFIRMED bookings in the client bookings tab.

### 8.9 — Provider profile editing for professionals
**Priority:** MEDIUM  
**Problem:** Professionals can change their name, phone, avatar, and availability — but can't edit their:
- Description
- Specialty/brands
- Working days/hours
- Shop image
- Wilaya/commune  
**Fix:** Add a "Business Settings" section in the professional dashboard.

### 8.10 — Map integration
**Priority:** LOW  
**Problem:** The app uses Haversine distance calculations based on wilaya center coordinates. There's no actual map view. Distance is very approximate.  
**Fix:** Integrate a map library (Leaflet or Google Maps) showing provider locations. Allow providers to set their exact GPS coordinates.

### 8.11 — Notification preferences
**Priority:** LOW  
**Problem:** Users can't control which notifications they receive.  
**Fix:** Add notification settings (email notifications, in-app notifications, notification types).

### 8.12 — Multi-image support for providers
**Priority:** LOW  
**Problem:** Each provider only has one `image` field.  
**Fix:** Change to `images: [String]` array. Allow providers to upload a gallery of their shop/work.

---

## 9. Performance & Scalability

### 9.1 — All providers loaded at once
**Problem:** `GET /providers` returns ALL matching providers. With thousands of providers, this will be slow and consume bandwidth.  
**Fix:** Implement pagination (see 4.4). Add infinite scroll or paginated navigation on the frontend.

### 9.2 — No API response caching
**Problem:** Every page visit fetches fresh data from the API. Provider listings, wilaya data, etc. are fetched on every view change.  
**Fix:** Implement client-side caching with libraries like `SWR` or `React Query`/`TanStack Query`. Add `Cache-Control` headers on stable endpoints.

### 9.3 — No image optimization
**Problem:** Provider images (from picsum or Cloudinary) are loaded at full resolution without srcset or lazy loading.  
**Fix:** Use Cloudinary transformations for responsive images. Add `loading="lazy"` to images. Consider using `<picture>` with WebP format.

### 9.4 — Large translations bundle always loaded
**Problem:** The 927-line translations file is always loaded in full, even though only one language is active at a time.  
**Fix:** Use dynamic imports to load translations per language:
```ts
const translations = await import(`./translations/${language}.ts`);
```

### 9.5 — No code splitting
**Problem:** The entire app is one bundle. Dashboard code (728 lines), all three page components, and all modals are loaded even for first-time visitors who only see the home page.  
**Fix:** Use `React.lazy()` and `Suspense` for:
- Dashboard (only for logged-in users)
- AuthModal (only when opened)
- BookingModal (only when booking)

### 9.6 — ServicesPage refetches on every filter change
**File:** `frontend/pages/ServicesPage.tsx`  
**Problem:** The `useEffect` that fetches providers runs on every change of `type`, `selectedWilaya`, `selectedCommune`, `selectedGarageType`, `selectedBrand`. Typing in the search box also fetches (via filter). This causes excessive API calls.  
**Fix:** Add debouncing for the search term. Consider fetching all providers for the current type once and filtering client-side for commune/brand.

---

## 10. DevOps & Deployment

### 10.1 — No test suite
**Priority:** HIGH  
**Problem:** Zero tests across the entire project. No unit tests, no integration tests, no e2e tests.  
**Fix:**
- Backend: Add API tests with `jest` + `supertest`
- Frontend: Add component tests with `vitest` + React Testing Library
- E2E: Add `playwright` or `cypress` for critical flows (register, login, book)

### 10.2 — No CI/CD pipeline
**Problem:** No GitHub Actions, no automated deployment, no PR checks.  
**Fix:** Add `.github/workflows/ci.yml` with: lint, type-check, tests, build.

### 10.3 — No environment variable documentation
**Problem:** No `.env.example` file. Other developers won't know which env vars are needed.  
**Fix:** Create `.env.example` files for both backend and frontend:
```env
# backend/.env.example
MONGODB_URI=
JWT_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
FRONTEND_URL=
NODE_ENV=development
PORT=5000

# frontend/.env.example
VITE_REACT_APP_BACKEND_BASEURL=http://localhost:5000/api
```

### 10.4 — No README setup instructions
**Problem:** `backend/` has no README. `frontend/README.md` is minimal. No instructions for:
- How to set up the development environment
- How to seed the database
- How to deploy
- Architecture overview  
**Fix:** Write comprehensive README files for both frontend and backend.

### 10.5 — No linting or formatting configuration
**Problem:** No ESLint config, no Prettier config. Code style is inconsistent.  
**Fix:** Add `.eslintrc.js` and `.prettierrc`. Run `eslint --fix` on the codebase.

---

## 11. Code Quality & Maintenance

### 11.1 — Duplicated User-to-Frontend mapping code
**Problem:** The pattern of mapping backend user data to frontend `User` interface is repeated in 4+ places:
- `App.tsx` `checkAuth()`
- `AuthModal.tsx` login handler
- `AuthModal.tsx` register handler
- `App.tsx` login success handler  
**Fix:** Create a reusable `mapUserResponse(data): User` function in a shared utils file.

### 11.2 — Duplicated booking mapping code
**Problem:** Similar mapping for bookings in Dashboard and ServicesPage. Backend `_id` to frontend `id`, etc.  
**Fix:** Create `mapBookingResponse(data): Booking` utility.

### 11.3 — Inconsistent error handling in API calls
**Problem:** Some API calls show errors in the UI (AuthModal, BookingModal), but many silently catch and `console.error` (availability toggle, notification mark-as-read, admin approve, profile save).  
**Fix:** Implement a toast notification system and show all API errors as toasts.

### 11.4 — `NAV_LINKS` constant defined but unused
**File:** `frontend/constants.ts`  
**Problem:** The `NAV_LINKS` array is defined but the Navbar component hardcodes navigation buttons instead of using it.  
**Fix:** Either use `NAV_LINKS` to generate nav buttons, or remove it.

### 11.5 — Imports not cleaned up
**Problem:** Several components import things they don't use (varies by file). Example: `constants.ts` imports `ServiceProvider` and `UserRole` types that aren't used.  
**Fix:** Run `eslint` with `no-unused-imports` rule.

### 11.6 — No JSDoc or code comments
**Problem:** Frontend has virtually zero code comments. Backend has route-level `@route/@desc/@access` comments (good) but no inline explanations for complex logic.  
**Fix:** Add JSDoc comments to key functions, especially business logic.

---

## 12. Prioritized Action Plan

### Phase 1 — Critical Fixes (Do First)
| # | Task | Effort |
|---|------|--------|
| 3.1 | Add express-validator to all routes | Medium |
| 3.2 | Add rate limiting (express-rate-limit) | Small |
| 3.3 | Add Helmet security headers | Small |
| 3.7 | Block ADMIN role in registration | Small |
| 2.3 | Fix CORS wildcard fallback + typo | Small |
| 2.1 | Fix profileSaveMsg success detection | Small |
| 2.2 | Remove generateMockBookings dead code | Small |
| 7.5 | Block past dates in booking | Small |

### Phase 2 — Core Missing Features
| # | Task | Effort |
|---|------|--------|
| 6.1 | Add React Router | Medium |
| 4.3/8.3 | Build Review & Rating system | Large |
| 8.1 | Email verification | Medium |
| 8.2 | Password reset (forgot password) | Medium |
| 6.3 | Persist dark mode & language to localStorage | Small |
| 8.5 | Provider image upload | Medium |
| 8.8 | Client booking cancellation button | Small |
| 8.9 | Provider profile editing dashboard | Medium |

### Phase 3 — Data & Performance
| # | Task | Effort |
|---|------|--------|
| 4.1 | Add DB indexes | Small |
| 4.4 | Add pagination to all list endpoints | Medium |
| 2.6 | Change Booking.date to Date type | Small |
| 2.4 | Remove redundant notification timestamp | Small |
| 2.5 | Fix picsum.photos default image | Small |
| 9.2 | Add React Query for caching | Medium |
| 9.5 | Code splitting with React.lazy | Medium |

### Phase 4 — Quality & Ops
| # | Task | Effort |
|---|------|--------|
| 10.1 | Add test suite (Jest + Vitest) | Large |
| 10.2 | Set up CI/CD | Medium |
| 10.3 | Create .env.example files | Small |
| 10.5 | Add ESLint + Prettier config | Small |
| 6.7/6.8 | Split Dashboard.tsx and AuthModal.tsx | Medium |
| 6.2 | Add React Context for global state | Medium |
| 2.8/2.9 | Translate remaining hardcoded strings | Small |

### Phase 5 — Enhancements
| # | Task | Effort |
|---|------|--------|
| 8.4 | Real-time notifications (Socket.IO) | Large |
| 8.6 | Global search | Medium |
| 8.7 | Professional booking management | Large |
| 8.10 | Map integration (Leaflet) | Large |
| 7.6 | Time slot booking | Medium |
| 7.7 | Fix WhatsApp phone format | Small |

---

**Total issues identified: 65+**  
**Previously fixed: 8 critical bugs**  
**Remaining: ~57 items across security, architecture, features, UX, performance, and code quality**

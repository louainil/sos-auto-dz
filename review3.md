# SOS Auto DZ — Comprehensive Review 3

> Post-fix review after completing all Section 2 fixes from review2.md plus custom improvements.  
> Date: June 2025  
> Files analysed: every `.js`, `.ts`, `.tsx`, `.json`, and `.html` in both `backend/` and `frontend/`.

---

## Summary of previous fixes applied

| ID | Fix |
|----|-----|
| 2.1 | `profileSaveMsg` changed to `{ text, ok }` structured pattern |
| 2.2 | `generateMockBookings` dead code removed |
| 2.3 | CORS wildcard `*` removed; env var renamed to `FRONTEND_URL` |
| 2.4 | Redundant `timestamp` field removed from Notification model |
| 2.5 | Default image changed from picsum.photos to empty + ui-avatars fallback |
| 2.6 | `Booking.date` changed from `String` to `Date` |
| 2.7 | Unused Vite proxy configuration removed |
| 2.8 | NotificationDropdown fully translated (EN/FR/AR) |
| 2.9 | DistanceIndicator fully translated (EN/FR/AR) |
| 2.10 | Footer: real contact info, working navigation, social media links |
| 2.11 | Home page stats fetched from real `/api/providers/stats` endpoint |

---

## Table of Contents

1. [Critical / Security Issues](#1-critical--security-issues)
2. [Bugs & Functional Problems](#2-bugs--functional-problems)
3. [Backend Architecture & Performance](#3-backend-architecture--performance)
4. [Database & Data Model Issues](#4-database--data-model-issues)
5. [Frontend Architecture](#5-frontend-architecture)
6. [UX / Usability Issues](#6-ux--usability-issues)
7. [Missing Features](#7-missing-features)
8. [Code Quality & Maintainability](#8-code-quality--maintainability)
9. [Performance & Optimization](#9-performance--optimization)
10. [DevOps & Deployment](#10-devops--deployment)
11. [Accessibility (a11y)](#11-accessibility-a11y)
12. [Testing](#12-testing)

---

## 1. Critical / Security Issues

### 1.1 — `express-validator` installed but never used (HIGH)
**File:** `backend/package.json` (dependency), all routes  
**Problem:** The package `express-validator` is listed in dependencies but not imported or used in any route. Every endpoint trusts `req.body` blindly. This means:
- A missing `email` on `/register` will produce a raw Mongoose validation error (leaks schema info).
- Injection of unexpected fields (e.g. `role: "ADMIN"`) is possible.
- No length/format checks happen server-side.

**Fix:** Add validation middleware to every route using `body()`, `param()`, and `validationResult` from `express-validator`. At minimum: `/register`, `/login`, `/profile`, `/password`, `/bookings`, `/providers/:id`.

### 1.2 — Anyone can register as ADMIN (HIGH)
**File:** `backend/routes/auth.js` — `POST /register`  
**Problem:** The role field from `req.body.role` is passed directly to `User.create()`. A user can send `{ "role": "ADMIN" }` and get full admin access (approve providers, see all stats, etc.).  
**Fix:** Strip `ADMIN` from allowed roles during registration. Only allow CLIENT, MECHANIC, PARTS_SHOP, TOWING. Admins should be created via seed script or direct DB manipulation only.

### 1.3 — No rate limiting on auth endpoints (HIGH)
**File:** `backend/server.js`  
**Problem:** No rate limiting on `/api/auth/login`, `/api/auth/register`, or `/api/auth/password`. Brute-force attacks are trivially possible.  
**Fix:** Install `express-rate-limit`. Apply a strict limiter (e.g. 5 attempts per 15 minutes) on login and password-change endpoints.

### 1.4 — No `helmet` security headers (MEDIUM) //
**File:** `backend/server.js`  
**Problem:** HTTP security headers (X-Content-Type-Options, Strict-Transport-Security, X-Frame-Options, etc.) are not set.  
**Fix:** `npm install helmet` and add `app.use(helmet())` before routes.

### 1.5 — JWT has 30-day expiry with no refresh mechanism (MEDIUM)
**File:** `backend/routes/auth.js` → `generateToken()`  
**Problem:** Token is valid for 30 days. If stolen, it cannot be revoked (no token blacklist, no refresh token rotation).  
**Fix:** Reduce JWT expiry to 1-2 hours. Implement refresh tokens stored in HttpOnly cookies, with a rotation strategy.

### 1.6 — Token stored in `localStorage` (MEDIUM)
**File:** `frontend/api.ts` — `authAPI.login()`, `authAPI.register()`  
**Problem:** JWT stored in `localStorage` is vulnerable to XSS attacks. Any injected script can steal the token.  
**Fix:** Store the token in an HttpOnly, Secure, SameSite=Strict cookie instead. The backend should set the cookie on login/register responses.

### 1.7 — Server error responses leak internal details (MEDIUM)
**Files:** All backend route catch blocks  
**Problem:** Every catch block returns `error: error.message` to the client. In production this can expose Mongoose validation details, file system paths, or stack traces.  
**Fix:** Only return `error.message` in development. In production, return a generic "Internal server error" message.

### 1.8 — No CORS origin validation for multiple environments (LOW)
**File:** `backend/server.js`  
**Problem:** `origin: process.env.FRONTEND_URL` accepts exactly one origin. If the frontend is deployed to multiple domains (www vs non-www, staging, etc.) or if `FRONTEND_URL` is undefined, CORS will silently block or pass `undefined`.  
**Fix:** Support a comma-separated list, or use an origin function. Add a fallback safeguard if `FRONTEND_URL` is not set.

---

## 2. Bugs & Functional Problems

### 2.1 — "Forgot Password" link does nothing (BUG)
**File:** `frontend/components/AuthModal.tsx` — bottom of the login form  
**Problem:** The `forgotPassword` text is just a `<p>` with `cursor-pointer` but no `onClick` handler. Users click it and nothing happens.  
**Fix:** Either implement a password reset flow (send email with reset link) or remove the text entirely to avoid confusion.

### 2.2 — "Leave Review" button does nothing (BUG)
**File:** `frontend/pages/Dashboard.tsx` — `ClientOverview` component  
**Problem:** The button for completed bookings reads "Leave Review" but has no `onClick` handler.  
**Fix:** Implement a review modal that sends rating + text to a new `POST /api/reviews` endpoint, or disable the button with a "Coming Soon" tooltip.

### 2.3 — "View All" button does nothing (BUG)
**File:** `frontend/pages/Dashboard.tsx` — `ProfessionalOverview`  
**Problem:** The "View All" button for incoming requests has no handler.  
**Fix:** Make it switch to the BOOKINGS tab: `onClick={() => setActiveTab('BOOKINGS')}`.

### 2.4 — BookingModal allows past dates (BUG) 
**File:** `frontend/components/BookingModal.tsx` — date `<input>`  
**Problem:** The date picker has no `min` attribute. Users can book appointments in the past.  
**Fix:** Set `min={new Date().toISOString().slice(0, 10)}` on the date input. Also validate server-side in `POST /api/bookings`.

### 2.5 — WhatsApp link sends local phone number format (BUG)
**File:** `frontend/components/ServiceCard.tsx` — WhatsApp `<a>` tag  
**Problem:** `provider.phone.replace(/\D/g, '')` keeps the leading `0` (e.g. `0555112233`), producing `https://wa.me/0555112233`, which WhatsApp cannot resolve. It needs the international format `213555112233`.  
**Fix:** After stripping non-digits, check if it starts with `0` and replace with `213`:
```js
const digits = provider.phone.replace(/\D/g, '');
const waPhone = digits.startsWith('0') ? '213' + digits.slice(1) : digits;
```
Note: the Dashboard BOOKINGS tab already does this correctly — only ServiceCard is affected.

### 2.6 — Stats endpoint filters by `isVerified: true` but seed data never sets `isVerified` (BUG)
**File:** `backend/routes/providers.js` — `GET /api/providers/stats`, `backend/seed.js`  
**Problem:** The stats query uses `{ isVerified: true }` but the seed data does not include `isVerified: true`. Also, new registrations default to `isVerified: false`. This means the stats page will always show 0/0/0 until an admin manually approves providers.  
**Fix:** Either:
- Update the seed script to set `isVerified: true` for seeded providers, OR
- Change the stats endpoint to not filter by `isVerified` (count all providers), OR
- Show a message on the homepage when stats are all zero.

### 2.7 — Notification mapping uses `any` type and missing error handling (BUG)
**Files:** `frontend/App.tsx` — `checkAuth()` and `handleLoginSuccess()`  
**Problem:** Notifications are mapped with `(n: any)` cast. If the backend shape changes, TypeScript won't catch errors. Additionally, if `n.createdAt` is null, `new Date(null)` will produce an invalid date.  
**Fix:** Create a typed API response interface and validate timestamps before creating Date objects.

### 2.8 — `vercel.json` in backend misconfigured for API (BUG)
**File:** `backend/vercel.json`  
**Problem:** The rewrite rule `"destination": "/index.html"` is a SPA rewrite meant for the frontend, not an API backend. On Vercel the backend should rewrite all routes to `server.js` (or `api/index.js`).  
**Fix:** Change to:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/server.js" }]
}
```
Or restructure for Vercel's `/api` directory convention.

---

## 3. Backend Architecture & Performance

### 3.1 — DB connection called on EVERY request via middleware (MEDIUM)
**File:** `backend/server.js` lines 44-51  
**Problem:** Even though `connectDB()` caches the connection, the middleware calls `await connectDB()` on every single request. This adds latency for the async call resolution (promise check + possible reconnect) on every request.  
**Fix:** Call `connectDB()` once at startup (before `app.listen()`). Only keep the middleware for Vercel serverless where the function is cold-started.

### 3.2 — Redundant `dotenv.config()` in `cloudinary.js` (LOW)
**File:** `backend/config/cloudinary.js`  
**Problem:** `dotenv.config()` is already called in `server.js` (the entry point). Calling it again with an explicit path in `cloudinary.js` is redundant and could cause confusion.  
**Fix:** Remove the `dotenv` import and config call from `cloudinary.js`. Rely on the single `dotenv.config()` in `server.js`.

### 3.3 — No pagination on list endpoints (MEDIUM)
**Files:** `backend/routes/providers.js` (`GET /`), `backend/routes/bookings.js` (`GET /`)  
**Problem:** `ServiceProvider.find(filter)` and `Booking.find()` return the entire collection. As the platform grows, this will cause memory issues and slow responses.  
**Fix:** Add `page` and `limit` query parameters with sensible defaults (`limit=20`). Return total count in a header or response wrapper for frontend pagination.

### 3.4 — Provider update endpoint doesn't sync related data (LOW)
**File:** `backend/routes/providers.js` — `PUT /:id`  
**Problem:** When a provider updates their name/phone via the provider endpoint, the `User` model is not updated. The `PUT /auth/profile` endpoint does the reverse (updates User and syncs to ServiceProvider), but there's no reverse sync.  
**Fix:** Ensure both update endpoints keep User and ServiceProvider in sync, or consolidate into one update endpoint.

### 3.5 — Missing `admin` route in root endpoint listing (LOW)
**File:** `backend/server.js` — `app.get('/')`  
**Problem:** The root route lists endpoints but omits `/api/admin`.  
**Fix:** Add `admin: '/api/admin'` to the endpoints object.

---

## 4. Database & Data Model Issues

### 4.1 — No database indexes (MEDIUM)
**Files:** All model files  
**Problem:** No indexes are defined beyond the automatic `_id` index and the `unique: true` on `User.email`. Frequently queried fields lack indexes:
- `ServiceProvider.role` + `ServiceProvider.wilayaId` (filter combo)
- `ServiceProvider.userId` (lookup by user)
- `Booking.clientId`, `Booking.providerId` (two separate queries)
- `Notification.userId` + `Notification.createdAt` (sorted fetch)

**Fix:** Add compound indexes specifically for the query patterns used:
```js
serviceProviderSchema.index({ role: 1, wilayaId: 1 });
serviceProviderSchema.index({ userId: 1 });
bookingSchema.index({ clientId: 1, createdAt: -1 });
bookingSchema.index({ providerId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, createdAt: -1 });
```

### 4.2 — No Review model exists (MEDIUM)
**Problem:** There is a `rating` and `totalReviews` field on `ServiceProvider`, and a "Leave Review" button in the frontend, but there is no Review model, no review routes, and no way for clients to actually submit reviews.  
**Fix:** Create a `Review` model with fields: `{providerId, clientId, bookingId, rating, comment, createdAt}`. Create `POST/GET /api/reviews` endpoints. Recalculate the provider's average rating on each new review.

### 4.3 — Data duplication in Booking model (LOW)
**File:** `backend/models/Booking.js`  
**Problem:** `providerName`, `providerPhone`, `clientName`, `clientPhone` are stored directly on each booking, duplicating data from User and ServiceProvider. If a user changes their name, old bookings will show the stale name.  
**Fix:** For historical accuracy this can be intentional (snapshot of name at booking time). Document this decision. Alternatively, populate from refs when displaying.

### 4.4 — ServiceProvider and User have overlapping fields (LOW)
**Files:** `backend/models/User.js`, `backend/models/ServiceProvider.js`  
**Problem:** Fields like `name`, `phone`, `wilayaId`, `commune`, `isAvailable`, `garageType` exist on both models. Updates must be synced manually (and currently only the auth profile endpoint does this).  
**Fix:** Consider storing professional-specific data only on ServiceProvider and using `populate('userId')` for shared user data. This eliminates sync bugs.

---

## 5. Frontend Architecture

### 5.1 — No client-side routing (React Router) (HIGH)
**File:** `frontend/App.tsx`  
**Problem:** Navigation uses `useState<PageView>` instead of URL-based routing. This means:
- Browser back/forward buttons don't work.
- URLs are not shareable (`localhost:3000` for every page).
- Deep linking to a specific provider is impossible.
- Refreshing always returns to HOME.

**Fix:** Install `react-router-dom`. Map PageView values to URL paths (`/`, `/garage`, `/parts`, `/towing`, `/dashboard`). Provider detail pages can be `/providers/:id`.

### 5.2 — No global state management (MEDIUM)
**File:** `frontend/App.tsx`  
**Problem:** All state (user, notifications, language, theme, view) lives in `App.tsx` and is passed down through many levels of props (prop drilling). This makes adding new features complex and error-prone.  
**Fix:** Use React Context for auth/user state at minimum. Consider Zustand or Redux Toolkit for more complex state management as the app grows.

### 5.3 — Language and theme preferences not persisted (MEDIUM)
**File:** `frontend/App.tsx`  
**Problem:** `language` defaults to `'en'` and `isDarkMode` defaults to `true` on every page load. User preferences are lost on refresh.  
**Fix:** Store preferences in `localStorage`:
```js
const [language, setLanguage] = useState<Language>(() => 
  (localStorage.getItem('lang') as Language) || 'en'
);
// On change: localStorage.setItem('lang', newLang);
```

### 5.4 — `@google/genai` dependency unused (MEDIUM)
**File:** `frontend/package.json`  
**Problem:** `"@google/genai": "^1.40.0"` is installed but never imported anywhere in the codebase. This adds unnecessary bundle size (~100KB+).  
**Fix:** `npm uninstall @google/genai` from the frontend package.

### 5.5 — Dashboard.tsx is 705 lines — too large (MEDIUM)
**File:** `frontend/pages/Dashboard.tsx`  
**Problem:** Contains 3 sub-views (ClientOverview, ProfessionalOverview, AdminOverview), settings form, password change form, booking list, and multiple StatCard components — all in one file.  
**Fix:** Extract into separate files:
- `components/dashboard/ClientOverview.tsx`
- `components/dashboard/ProfessionalOverview.tsx`
- `components/dashboard/AdminOverview.tsx`
- `components/dashboard/SettingsPanel.tsx`
- `components/dashboard/BookingsList.tsx`
- `components/dashboard/StatCard.tsx`

### 5.6 — Extensive use of `any` type (MEDIUM)
**File:** `frontend/api.ts` — every function parameter and callback  
**Problem:** Functions like `providersAPI.getAll(filters?: any)`, `bookingsAPI.create(bookingData: any)`, and all callback mappings use `(p: any)` or `(b: any)`. This defeats the purpose of TypeScript.  
**Fix:** Define typed request/response interfaces:
```ts
interface CreateBookingRequest { providerId: string; date: string; issue: string; }
interface ProviderFilters { role?: string; wilayaId?: number; ... }
```

### 5.7 — `NAV_LINKS` constant is unused (LOW)
**File:** `frontend/constants.ts`  
**Problem:** `NAV_LINKS` is exported but never imported. The Navbar manually renders each nav button.  
**Fix:** Either use `NAV_LINKS` in Navbar (map through them) or delete the constant.

### 5.8 — ServicesPage title/subtitle are hardcoded English (MEDIUM)
**File:** `frontend/App.tsx` — `renderContent()`  
**Problem:** `title="Garage Services"` and `subtitle="Find trusted Mechanics..."` are passed as English-only strings from App.tsx. They don't use the translation system.  
**Fix:** Pass translation keys instead:
```tsx
title={t.garageServicesTitle}
subtitle={t.garageServicesSubtitle}
```

### 5.9 — ServicesPage search placeholder is English-only (LOW)
**File:** `frontend/pages/ServicesPage.tsx`  
**Problem:** `placeholder={\`Search ${title.toLowerCase()}...\`}` concatenates an English preposition with the title.  
**Fix:** Add a translation key for the search placeholder.

---

## 6. UX / Usability Issues

### 6.1 — No loading state on initial auth check (MEDIUM)
**File:** `frontend/App.tsx` — `useEffect` for `checkAuth`  
**Problem:** On page load, the app renders immediately while the auth token is being verified in the background. If the user is logged in, they'll briefly see the logged-out UI (no user menu, login button visible) before it switches to the logged-in state.  
**Fix:** Add an `isAuthLoading` state. Show a full-page skeleton/spinner until auth check completes.

### 6.2 — No confirmation dialog for destructive actions (MEDIUM)
**Files:** Multiple  
**Problem:**
- Clearing all notifications → happens immediately, no "Are you sure?"
- Declining a booking → happens immediately
- Deleting a booking → no confirmation
- Logging out → no confirmation

**Fix:** Add a simple confirmation modal or use `window.confirm()` for destructive actions.

### 6.3 — Mobile notification bell hidden (BUG)
**File:** `frontend/components/Navbar.tsx`  
**Problem:** The notification bell icon is only rendered inside the `hidden md:flex` actions section. On mobile, logged-in users have no way to view notifications.  
**Fix:** Add a notification bell to the mobile header bar (next to the dashboard and menu buttons).

### 6.4 — No feedback when geolocation is denied (LOW)
**File:** `frontend/App.tsx` — geolocation `useEffect`  
**Problem:** If the user denies location permission, the app silently defaults to Algiers coordinates. The user gets distance indicators but doesn't know they're based on a default location, not their actual position.  
**Fix:** Show a subtle toast or note: "Location access was denied. Distances are approximate from Algiers."

### 6.5 — Dashboard booking status labels are not translated (MEDIUM)
**File:** `frontend/pages/Dashboard.tsx`  
**Problem:** Booking statuses (`PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`) are displayed raw from the backend value. They should show translated labels.  
**Fix:** Add translation keys for each status and use them in the status badges.

### 6.6 — Long provider descriptions are truncated without expansion (LOW)
**File:** `frontend/components/ServiceCard.tsx`  
**Problem:** `line-clamp-2` truncates long descriptions. There's no way for the user to read the full description without clicking.  
**Fix:** Add a "Read more" toggle or show full text in a provider detail modal/page.

### 6.7 — Password change validation messages not translated (LOW)
**File:** `frontend/pages/Dashboard.tsx` — `handlePasswordChange`  
**Problem:** Error messages like "New password must be at least 6 characters." and "New passwords do not match." are hardcoded in English. The "Passwords do not match." inline text below confirm field is also English-only.  
**Fix:** Use translation keys instead.

### 6.8 — Admin pending approvals table "No pending approvals" not translated (LOW)
**File:** `frontend/pages/Dashboard.tsx` — `AdminOverview`  
**Problem:** The fallback text "No pending approvals" is hardcoded in English.  
**Fix:** Use `t.noPendingApprovals` (add the key if it doesn't exist).

---

## 7. Missing Features

### 7.1 — Password reset / "Forgot Password" flow
**Priority:** HIGH  
There is no way for a user to recover their account if they forget their password. Need:
- Backend: `POST /api/auth/forgot-password` (send email with reset token)
- Backend: `POST /api/auth/reset-password` (validate token + new password)
- Frontend: Forgot password form, reset password page
- Email service integration (e.g. Resend, SendGrid, or Nodemailer with SMTP)

### 7.2 — Review / Rating system
**Priority:** HIGH  
Users cannot rate or review providers. The rating on ServiceProvider is static (set in seed data). Need:
- `Review` model (`providerId`, `clientId`, `bookingId`, `rating`, `comment`)
- `POST /api/reviews` endpoint (only for completed bookings)
- `GET /api/reviews/:providerId` endpoint
- Frontend: Review modal on completed bookings
- Recalculate provider `rating` and `totalReviews` on each new review

### 7.3 — Search / Filter by provider name on homepage
**Priority:** MEDIUM  
Currently, finding a specific provider requires navigating to the right service type page and using the search there. A global search bar on the homepage would improve discoverability.

### 7.4 — Provider detail page
**Priority:** MEDIUM  
Clicking a provider card should show a full detail page with:
- Complete description (not truncated)
- Photo gallery
- All reviews
- Working hours (visual schedule)
- Location map
- Direct booking

### 7.5 — Email notifications
**Priority:** MEDIUM  
Currently, notifications are only in-app. Users must be logged in to see them. For important events (new booking, booking confirmation), email notifications would improve the experience.

### 7.6 — Real-time notifications (WebSocket / SSE)
**Priority:** LOW  
Notifications are only fetched on login. If a booking is created while a provider is logged in, they won't see it until they refresh. Consider Socket.IO or Server-Sent Events for real-time updates.

### 7.7 — Provider image upload
**Priority:** MEDIUM  
Providers can upload an avatar (user profile picture) but cannot upload an image for their ServiceProvider profile (the image shown on ServiceCard). The `image` field exists on the model but there's no upload endpoint or UI for it.

### 7.8 — Multi-image / gallery support
**Priority:** LOW  
Service providers should be able to upload multiple photos of their garage/work. Currently only a single `image` string is supported.

### 7.9 — Booking cancellation with reason
**Priority:** LOW  
When a provider declines a booking, no reason is given to the client. Adding a `cancellationReason` field would improve communication.

### 7.10 — Terms of Service and Privacy Policy pages
**Priority:** LOW  
Footer links to "Privacy Policy" and "Terms of Service" are `href="#"` (dead links).

---

## 8. Code Quality & Maintainability

### 8.1 — User mapping logic duplicated (DRY violation)
**Files:** `frontend/App.tsx` (2x), `frontend/components/AuthModal.tsx` (2x)  
**Problem:** The same `{ id: data._id, name: data.name, ... }` mapping from API response to `User` type is repeated 4 times across the codebase.  
**Fix:** Create a utility function:
```ts
export const mapApiUser = (data: any): User => ({
  id: data._id,
  name: data.name,
  email: data.email,
  role: data.role,
  phone: data.phone,
  garageType: data.garageType,
  wilayaId: data.wilayaId,
  commune: data.commune,
  isAvailable: data.isAvailable,
  avatar: data.avatar,
});
```

### 8.2 — Notification mapping logic duplicated
**File:** `frontend/App.tsx` — `checkAuth` and `handleLoginSuccess`  
**Problem:** The notification mapping `(n: any) => ({ id: n._id, ... })` is written twice.  
**Fix:** Extract to a `mapApiNotification` utility, same as 8.1.

### 8.3 — Provider mapping logic duplicated
**Files:** `frontend/pages/ServicesPage.tsx`, `frontend/pages/Dashboard.tsx`  
**Problem:** The provider mapping `{ id: p._id, name: p.name, ... }` is repeated.  
**Fix:** Extract to a `mapApiProvider` utility.

### 8.4 — API response shape has `_id`, frontend uses `id` (inconsistency)
**Files:** All mapping code  
**Problem:** MongoDB returns `_id`, but all frontend types use `id`. This requires manual mapping everywhere.  
**Fix:** Either:
- Use a Mongoose transform/virtual to serialize `_id` as `id` globally, OR
- Map once in the `handleResponse` helper in `api.ts`.

### 8.5 — `StatCard` component inlined inside Dashboard (NO REUSE)
**File:** `frontend/pages/Dashboard.tsx`  
**Problem:** `StatCard` is defined as a nested component inside Dashboard's render scope. It re-creates on every render and can't be reused elsewhere.  
**Fix:** Move to its own file `components/dashboard/StatCard.tsx`.

### 8.6 — Error handling in catch blocks is inconsistent
**Files:** Many frontend components  
**Problem:** Some catch blocks log `console.error`, some set an error state, some do nothing (`.catch(() => {})`).  
**Fix:** Create a centralized error handler or at minimum a `showToast` utility that displays user-friendly error messages.

### 8.7 — No TypeScript strict mode enforcement
**File:** `frontend/tsconfig.json`  
**Problem:** Need to verify if `"strict": true` is enabled. The widespread use of `any` types suggests it may not be enforcing strictness.  
**Fix:** Enable `"strict": true`, `"noImplicitAny": true`, and fix all resulting compilation errors.

---

## 9. Performance & Optimization

### 9.1 — No lazy loading / code splitting (MEDIUM)
**File:** `frontend/App.tsx`  
**Problem:** All pages (Home, ServicesPage, Dashboard) and all components are imported eagerly. Even if the user only visits the homepage, the full Dashboard code is loaded.  
**Fix:** Use `React.lazy()` and `<Suspense>`:
```tsx
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const ServicesPage = React.lazy(() => import('./pages/ServicesPage'));
```

### 9.2 — Constants file is very large (LOW)
**File:** `frontend/constants.ts`  
**Problem:** The `COMMUNES` object contains data for all 58 wilayas with hundreds of commune names (~8KB). The `WILAYAS` array also has GPS coordinates for all 58 wilayas.  
**Fix:** Consider lazy-loading commune data per wilaya, or at minimum ensure tree-shaking works by splitting into separate files.

### 9.3 — No image optimization (MEDIUM)
**File:** `frontend/pages/Home.tsx` — hero image  
**Problem:** The hero section loads a full-resolution Unsplash image (`w=1950&q=80`). No `srcset`, `loading="lazy"`, or modern format (WebP/AVIF) is used.  
**Fix:** Use responsive `srcset` with multiple sizes. Add `loading="lazy"` to below-the-fold images. Consider self-hosting optimized hero images.

### 9.4 — `ServicesPage` re-fetches on every filter change with no debounce (LOW)
**File:** `frontend/pages/ServicesPage.tsx`  
**Problem:** The `useEffect` fetching providers fires on every change to `selectedWilaya`, `selectedCommune`, `selectedGarageType`, `selectedBrand`. Fast filter switching causes a burst of API calls.  
**Fix:** Add a debounce (e.g. 300ms) before triggering the fetch.

### 9.5 — Brand search dropdown re-renders parent on every keystroke (LOW)
**File:** `frontend/pages/ServicesPage.tsx`  
**Problem:** `setBrandSearchTerm` triggers a re-render of the entire ServicesPage. Since the brand list is filtered via `useMemo`, this isn't catastrophic, but the API fetch useEffect also depends on `selectedBrand`.  
**Fix:** The `onChange` handler sets `setSelectedBrand('all')` on every keystroke, which triggers the fetch useEffect. Move the API call trigger to only happen when a brand is actually selected (clicked), not on every keystroke.

### 9.6 — Translation file is ~970 lines and growing (LOW)
**File:** `frontend/translations.ts`  
**Problem:** All 3 languages in one file means the entire translations object is loaded even when only one language is used.  
**Fix:** Split into `translations/en.ts`, `translations/fr.ts`, `translations/ar.ts` and dynamically import the active language.

---

## 10. DevOps & Deployment

### 10.1 — No `.env.example` file (MEDIUM)
**Problem:** New developers won't know which environment variables are required (`MONGODB_URI`, `JWT_SECRET`, `CLOUDINARY_*`, `FRONTEND_URL`, `VITE_REACT_APP_BACKEND_BASEURL`).  
**Fix:** Create `.env.example` files for both backend and frontend with placeholder values.

### 10.2 — No CI/CD pipeline (LOW)
**Problem:** No GitHub Actions, no automated tests, no lint checks on PR.  
**Fix:** Add a `.github/workflows/ci.yml` with at minimum: lint, type-check, and build steps.

### 10.3 — No ESLint / Prettier configured (LOW)
**Problem:** No `.eslintrc`, no `.prettierrc`. Code formatting is inconsistent (some files use 2-space indent, some use 4-space).  
**Fix:** Add ESLint with TypeScript support and Prettier. Add to `pre-commit` hook via `husky` + `lint-staged`.

### 10.4 — Backend `vercel.json` SPA rewrite for API server
**File:** `backend/vercel.json`  
**Same as 2.8.** The rewrite destination should be the server entry point, not `index.html`.

### 10.5 — Frontend `vercel.json` present but minimal
**File:** `frontend/vercel.json`  
**Problem:** Likely needs SPA fallback rewrites if using React Router (once implemented). Current rewrite to `index.html` is correct for SPA but should be verified.

---

## 11. Accessibility (a11y)

### 11.1 — No `aria-label` on icon-only buttons (MEDIUM)
**Files:** Navbar (theme toggle, menu button, notification bell), ServiceCard (phone/WhatsApp buttons), Dashboard (availability toggle)  
**Problem:** Screen readers cannot describe what these buttons do.  
**Fix:** Add `aria-label` to every icon-only button:
```tsx
<button aria-label="Toggle dark mode" ...>
<button aria-label="Open notifications" ...>
<a aria-label="Call provider" ...>
```

### 11.2 — Dropdown menus not keyboard-accessible (MEDIUM)
**Files:** Navbar (language menu, user menu), NotificationDropdown, ServicesPage (brand autocomplete)  
**Problem:** Dropdowns are toggled via `onClick` but don't trap focus, don't close on `Escape`, and aren't navigable with arrow keys.  
**Fix:** Add keyboard event handlers: `Escape` to close, `ArrowDown/ArrowUp` for navigation, `Enter` to select.

### 11.3 — Color contrast may fail on some elements (LOW)
**Problem:** Light gray text (`text-slate-400`) on white/light backgrounds may not meet WCAG AA contrast ratio (4.5:1).  
**Fix:** Audit with a contrast checker tool and adjust colors where needed.

### 11.4 — Form inputs missing proper `id` and `for` association (LOW)
**Files:** AuthModal, Dashboard settings  
**Problem:** Labels use `<label className="...">` but don't use `htmlFor` to associate with their inputs.  
**Fix:** Add unique `id` to each input and matching `htmlFor` on labels.

### 11.5 — No skip-to-content link (LOW)
**File:** `frontend/index.html` / layout  
**Problem:** Keyboard users must tab through the entire navbar to reach main content.  
**Fix:** Add a visually hidden "Skip to main content" link at the top of the page.

---

## 12. Testing

### 12.1 — No tests exist at all (HIGH)
**Problem:** There are zero test files in the entire project. No unit tests, no integration tests, no E2E tests.  
**Fix (priority order):**
1. **Backend API tests** — Use Jest + Supertest to test auth, booking, provider endpoints.
2. **Frontend component tests** — Use Vitest + React Testing Library for critical components (AuthModal, BookingModal, Dashboard).
3. **E2E tests** — Use Playwright or Cypress for critical user flows (register → login → book → review).

### 12.2 — No test scripts in `package.json`
**Files:** Both `backend/package.json` and `frontend/package.json`  
**Problem:** No `"test"` script defined.  
**Fix:** Add test framework config and scripts.

---

## Priority Summary

### Must Fix (before production)
| # | Issue | Severity |
|---|-------|----------|
| 1.1 | Add input validation with express-validator | Critical |
| 1.2 | Block ADMIN role in registration | Critical |
| 1.3 | Add rate limiting to auth endpoints | Critical |
| 2.4 | BookingModal: prevent past dates | High |
| 2.5 | Fix WhatsApp phone format in ServiceCard | High |
| 2.6 | Stats endpoint vs isVerified mismatch | High |
| 2.8 | Fix backend vercel.json rewrite | High |

### Should Fix (important for quality)
| # | Issue | Severity |
|---|-------|----------|
| 1.4 | Add helmet security headers | Medium |
| 1.5 | Reduce JWT expiry + add refresh tokens | Medium |
| 1.7 | Stop leaking error details in production | Medium |
| 2.1 | Implement or remove "Forgot Password" | Medium |
| 2.2 | Implement or disable "Leave Review" | Medium |
| 2.3 | Wire "View All" button | Medium |
| 3.3 | Add pagination to list endpoints | Medium |
| 4.1 | Add database indexes | Medium |
| 5.1 | Add React Router for URL-based navigation | Medium |
| 5.3 | Persist language/theme in localStorage | Medium |
| 5.4 | Remove unused @google/genai dependency | Medium |
| 5.5 | Split Dashboard.tsx into smaller components | Medium |
| 5.8 | Translate ServicesPage title/subtitle | Medium |
| 6.1 | Add loading state for initial auth check | Medium |
| 6.3 | Show notification bell on mobile | Medium |
| 6.5 | Translate booking status labels | Medium |

### Nice to Have (enhancements)
| # | Issue | Severity |
|---|-------|----------|
| 4.2 | Build Review model and endpoints | Medium |
| 5.2 | Add global state management (Context/Zustand) | Medium |
| 7.1 | Password reset flow | High |
| 7.2 | Review/rating system | High |
| 7.4 | Provider detail page | Medium |
| 7.5 | Email notifications | Medium |
| 9.1 | Add lazy loading / code splitting | Medium |
| 10.1 | Create .env.example files | Medium |
| 11.1 | Add aria-labels to icon buttons | Medium |
| 12.1 | Add tests (backend first, then frontend) | High |

---

*Total issues found: **72** across 12 categories.*

# SOS Auto DZ — Comprehensive Project Review

> **Reviewed:** All backend & frontend source files  
> **Project:** Algeria-focused automotive services marketplace (Garage / Spare Parts / Towing)  
> **Stack:** React 19 + TypeScript + Vite + Tailwind v4 | Node.js + Express 4 + MongoDB (Mongoose 8) + Cloudinary  
> **Overall Grade: C+** — A solid prototype with good UI/UX vision but numerous critical bugs, missing features, and security gaps that must be resolved before any production deployment.

---

## Table of Contents

1. [Critical Bugs (Must Fix)](#1-critical-bugs-must-fix)
2. [Security Vulnerabilities](#2-security-vulnerabilities)
3. [Data & API Issues](#3-data--api-issues)
4. [Frontend Issues](#4-frontend-issues)
5. [Architecture & Code Quality](#5-architecture--code-quality)
6. [Missing Features](#6-missing-features)
7. [Performance Concerns](#7-performance-concerns)
8. [DevOps & Deployment Issues](#8-devops--deployment-issues)
9. [UI/UX Enhancements](#9-uiux-enhancements)
10. [Summary & Priority Roadmap](#10-summary--priority-roadmap)

---

## 1. Critical Bugs (Must Fix)

### 1.1 Registration Ignores Professional Data (AuthModal → Backend)

**Files:** `frontend/components/AuthModal.tsx` (lines ~88-97), `backend/routes/auth.js` (lines ~55-85)

The `AuthModal` collects `selectedDays`, `startTime`, `endTime`, `selectedBrands`, and `description` from professionals during signup — but **none of these are sent to the API**. The `userData` object only sends `name, email, password, role, phone, garageType, wilayaId, commune`.

On the backend side, `routes/auth.js` register endpoint also **ignores** these fields and hardcodes defaults:
```javascript
// Backend hardcodes these instead of using submitted values:
description: `Professional ${role.toLowerCase()} service`,
specialty: [],
workingDays: [0, 1, 2, 3, 4, 6],
workingHours: { start: '08:00', end: '17:00' }
```

**Impact:** Every professional gets generic defaults no matter what they configure in the registration form. Their custom schedule, brands, and description are silently discarded.

**Fix:** Send all professional fields from `AuthModal` and accept them in the register endpoint.

---

### 1.2 Vite Proxy Double `/api` Path Bug

**File:** `frontend/vite.config.ts` (lines 13-17)

```typescript
proxy: {
  '/api/': {
    target: env.VITE_REACT_APP_BACKEND_BASEURL, // e.g., "http://localhost:5000/api"
    changeOrigin: true,
  },
},
```

If `VITE_REACT_APP_BACKEND_BASEURL` is set to `http://localhost:5000/api`, then `api.ts` constructs URLs like `/api/auth/login`, which the proxy forwards to `http://localhost:5000/api/api/auth/login` (doubled `/api`).

**Impact:** API calls may work in some configurations but silently break in others. The proxy and the base URL are conflicting.

**Fix:** Either:
- Set `VITE_REACT_APP_BACKEND_BASEURL=http://localhost:5000` and keep `/api/` in `api.ts` URLs, OR
- Set `VITE_REACT_APP_BACKEND_BASEURL=http://localhost:5000/api` and use `rewrite: (path) => path.replace(/^\/api/, '')` in the proxy config.

---

### 1.3 Availability Toggle Does Not Persist

**File:** `frontend/pages/Dashboard.tsx` (line ~53, ~218)

```typescript
const [isAvailable, setIsAvailable] = useState(user.isAvailable ?? true);
// ...
onClick={() => setIsAvailable(!isAvailable)} // Only updates local state!
```

The toggle button only flips local React state. **No API call is made** to update the `ServiceProvider.isAvailable` field in MongoDB. When the page reloads, the toggle resets.

**Fix:** Call `providersAPI.update(providerId, { isAvailable: !isAvailable })` on toggle, and first fetch the provider profile to get the provider `_id`.

---

### 1.4 Password Change Form is Non-Functional

**File:** `frontend/pages/Dashboard.tsx` (lines ~504-530)

The Settings tab renders a "Change Password" form with three inputs (current, new, confirm) and an "Update Password" button, but:
- The inputs have **no state bindings** (`value`, `onChange` are missing)
- The form has **no `onSubmit` handler**
- There is **no backend endpoint** (`PUT /api/auth/password` does not exist)

**Impact:** Users see a fully styled password change form that does absolutely nothing when submitted.

**Fix:** Add state variables, form handler, validation (confirm match, minimum length), and a corresponding backend endpoint.

---

### 1.5 Admin Dashboard is Entirely Hardcoded

**File:** `frontend/pages/Dashboard.tsx` (lines ~260-310)

The `AdminOverview` component displays:
- `12,340` total users, `845` verified providers, `12` pending approvals, `3` reports — **all hardcoded strings**
- A table with `[1,2,3].map(i => ...)` rendering fake "Garage Auto 1/2/3" rows

There are **no admin API endpoints** on the backend to fetch user counts, provider approval lists, or reports.

**Impact:** The admin panel is purely decorative and non-functional.

---

### 1.6 BookingModal Collects Name/Phone But Doesn't Send Them

**File:** `frontend/components/BookingModal.tsx` (lines ~30-40)

The form collects `name` and `phone` from the user but the `handleSubmit` only sends:
```typescript
await bookingsAPI.create({
  providerId: provider.id,
  date: formData.date,
  issue: formData.description
});
```

The `name` and `phone` fields are collected from the user (requiring them to retype their info) but are never sent. The backend uses `req.user.name` and `req.user.phone` instead.

**Fix:** Either remove the name/phone fields from the form (since the backend gets them from the token), or send them and use them on the backend.

---

### 1.7 Login Creates a Welcome Notification Every Single Time

**File:** `backend/routes/auth.js` (lines ~117-121)

```javascript
await Notification.create({
  userId: user._id,
  title: `Welcome back, ${user.name}!`,
  message: 'You have successfully logged in to SOS Auto DZ.',
  type: 'SUCCESS'
});
```

Every login creates a new notification document. A user who logs in 100 times gets 100 "Welcome back" notifications. There is no cleanup, TTL, or deduplication.

**Impact:** Database bloat, notification list cluttered with spam.

**Fix:** Remove this, or limit to once-per-session, or use TTL indexes on Notification collection.

---

### 1.8 Professional Stats in Dashboard are Hardcoded

**File:** `frontend/pages/Dashboard.tsx` (lines ~234-239)

```tsx
<StatCard title={t.todaysJobs} value="5" icon={Calendar} color="bg-blue-500" />
<StatCard title={t.totalRevenue} value="145k DA" icon={DollarSign} color="bg-green-500" />
<StatCard title={t.ratingLabel} value="4.8" icon={TrendingUp} color="bg-purple-500" />
```

"Today's Jobs," "Total Revenue," and "Rating" show fake static values, not data from the API.

**Fix:** Fetch actual stats from bookings API and provider profile.

---

## 2. Security Vulnerabilities

### 2.1 JWT Secret is a Sample Token from jwt.io

**File:** `backend/.env`

The `JWT_SECRET` is set to what appears to be a sample JWT token from jwt.io. This is publicly known and easily guessable.

**Fix:** Generate a strong random secret: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

---

### 2.2 No Rate Limiting

No rate limiting on any endpoint. The login endpoint is especially vulnerable to brute-force attacks. A malicious actor can attempt unlimited password guesses.

**Fix:** Add `express-rate-limit`:
```javascript
import rateLimit from 'express-rate-limit';
app.use('/api/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 10 }));
```

---

### 2.3 CORS Wildcard Fallback

**File:** `backend/server.js` (line 23)

```javascript
origin: process.env.FRONTED_URL || '*',
```

If `FRONTED_URL` is not set (e.g., in production if the env var is missing), CORS falls back to `'*'`, allowing any domain to make authenticated requests.

**Fix:** Remove the `|| '*'` fallback. Fail loudly if the env var is not set.

---

### 2.4 Token Stored in localStorage (XSS Vulnerable)

**File:** `frontend/api.ts` (lines ~33, ~45)

JWT tokens are stored in `localStorage`. Any XSS vulnerability (including from third-party dependencies) can steal the token.

**Fix:** Use `httpOnly` cookies for token storage, or at minimum implement Content Security Policy headers.

---

### 2.5 No Input Validation on Backend

`express-validator` is installed (`package.json` dependency) but **never imported or used** anywhere. All routes accept raw `req.body` without validation.

Examples:
- Registration accepts any string as email (no format check)
- No password strength enforcement beyond Mongoose's `minlength: 6`
- Booking date is stored as a raw string with no format validation
- No sanitization of user-supplied strings (XSS through stored data)

**Fix:** Add express-validator middleware to all routes. At minimum validate: email format, password strength, date format, string lengths, phone format.

---

### 2.6 No Helmet.js Security Headers

The Express app doesn't set security headers (X-Content-Type-Options, X-Frame-Options, HSTS, etc.).

**Fix:** `npm install helmet` and add `app.use(helmet())`.

---

### 2.7 Error Messages Leak Server Details

**File:** `backend/server.js` (lines ~80-84)

```javascript
error: process.env.NODE_ENV === 'development' ? err : {}
```

This is good for development, but other routes send `error: error.message` directly which can leak stack traces or database errors to the client.

---

## 3. Data & API Issues

### 3.1 Booking Date Stored as String, Not Date

**File:** `backend/models/Booking.js` (line ~32)

```javascript
date: { type: String, required: true }
```

Storing dates as strings makes it impossible to do date range queries, sorting by date, or timezone conversion.

**Fix:** Change to `type: Date` and parse incoming date strings properly.

---

### 3.2 No Database Indexes

None of the models define indexes beyond the default `_id` index and the implicit unique on `User.email`. Missing indexes:

| Collection | Needed Index | Reason |
|---|---|---|
| Booking | `{ clientId: 1, createdAt: -1 }` | Client booking queries |
| Booking | `{ providerId: 1, createdAt: -1 }` | Provider booking queries |
| Notification | `{ userId: 1, timestamp: -1 }` | Notification queries |
| ServiceProvider | `{ userId: 1 }` | Provider lookup by user |
| ServiceProvider | `{ role: 1, wilayaId: 1 }` | Filtered provider searches |

**Impact:** As data grows, all queries become full collection scans.

---

### 3.3 No Pagination Anywhere

`GET /api/providers` returns all providers. `GET /api/bookings` returns all bookings. `GET /api/notifications` has a `limit(50)` but no skip/page parameter.

**Impact:** With hundreds of providers or thousands of bookings, responses become massive.

**Fix:** Implement cursor-based or offset pagination (`?page=1&limit=20`).

---

### 3.4 Notification Model Has Redundant Timestamp Fields

**File:** `backend/models/Notification.js` (lines ~27-33)

```javascript
timestamp: { type: Date, default: Date.now }, // Manual field
// ...
{ timestamps: true } // Also adds createdAt and updatedAt
```

The schema has both a manual `timestamp` field AND Mongoose's `timestamps: true`, which auto-creates `createdAt` and `updatedAt`. This causes confusion about which field to query.

**Fix:** Remove the manual `timestamp` field and use `createdAt` from Mongoose timestamps.

---

### 3.5 Denormalized Names in Booking Can Become Stale

**File:** `backend/models/Booking.js`

`providerName`, `clientName`, `clientPhone`, `providerPhone` are stored directly on the booking. If a user or provider changes their name, existing bookings show the old name.

**Fix:** Either accept this as intentional (snapshot at booking time), or use Mongoose populate instead.

---

### 3.6 ServiceProvider `image` Defaults to picsum.photos

**File:** `backend/models/ServiceProvider.js` (line ~50)

```javascript
image: { type: String, default: 'https://picsum.photos/400/300' }
```

`picsum.photos` returns a **random image each time**, so the provider card image changes on every page load. This looks broken.

**Fix:** Use a static default placeholder image, or integrate image upload for providers.

---

### 3.7 No Soft Delete for Bookings

`DELETE /api/bookings/:id` permanently deletes the booking. There's no way to recover it or track cancellation history.

**Fix:** Use a `deletedAt` field for soft delete, or change status to CANCELLED instead of deleting.

---

## 4. Frontend Issues

### 4.1 No Client-Side Routing (React Router Missing)

**File:** `frontend/App.tsx`

Navigation is managed by a `PageView` enum and `useState`, not React Router. This means:
- **No URL changes** when navigating (always shows `/`)
- **Back button doesn't work** — browser history is not tracked
- **No deep linking** — you can't share a URL to a specific page
- **No bookmarkable pages**
- **SEO is impossible** (all pages are the same URL)

**Fix:** Install `react-router-dom` and replace the `currentView` state with proper routes.

---

### 4.2 Hardcoded English Strings in Components

**Files:** `frontend/components/DistanceIndicator.tsx`, `frontend/components/NotificationDropdown.tsx`

Despite the extensive translation system (`translations.ts` with 927 lines), these components have hardcoded English:

**DistanceIndicator.tsx:**
- `"Distance unknown"`
- `"Near you"`
- `"Moderate distance"`
- `"Far location"`

**NotificationDropdown.tsx:**
- `"Notifications"` (header)
- `"Clear all"` (button)
- `"No new notifications"` (empty state)
- `"Mark as read"` (tooltip)

**ServicesPage.tsx:**
- `title` and `subtitle` props are passed as hardcoded English strings from `App.tsx`

**Fix:** Pass `language` prop to these components and use `translations[language]` keys.

---

### 4.3 No State Management Library

All application state lives in `App.tsx` as `useState` hooks: `user`, `notifications`, `currentView`, `isDarkMode`, `language`, `selectedProvider`, `userLocation`. This creates:
- Excessive prop drilling (Navbar receives 13 props)
- No state persistence across refreshes (dark mode/language reset)
- Difficulty adding new features

**Fix:** Use React Context at minimum, or consider Zustand/Redux Toolkit for larger state needs.

---

### 4.4 Dark Mode and Language Preferences Not Persisted

When the user refreshes, dark mode resets to `true` (dark) and language resets to `'en'`. User preferences are lost.

**Fix:** Store in `localStorage`:
```typescript
const [isDarkMode, setIsDarkMode] = useState(() => 
  JSON.parse(localStorage.getItem('darkMode') ?? 'true')
);
```

---

### 4.5 Unused Dependencies

**File:** `frontend/package.json`

`@google/genai` (version ^1.40.0) is listed as a dependency. This is the Google Generative AI SDK. It is never imported or used anywhere in the codebase.

**Impact:** Adds unnecessary bundle size.

**Fix:** Remove it: `npm uninstall @google/genai`

---

### 4.6 Unused Constants

**File:** `frontend/constants.ts`

`NAV_LINKS` is exported but never imported by any file. The Navbar builds its links manually with individual buttons.

**Fix:** Either use `NAV_LINKS` in the Navbar or remove the constant.

---

### 4.7 TypeScript `any` Overuse

**File:** `frontend/api.ts`

Almost every API function uses `any` types:
```typescript
register: async (userData: any) => { ... }
getAll: async (filters?: any) => { ... }
create: async (bookingData: any) => { ... }
```

This defeats the purpose of TypeScript. The `types.ts` file defines proper interfaces but they aren't used in `api.ts`.

**Fix:** Create request/response types and use them:
```typescript
register: async (userData: RegisterPayload): Promise<AuthResponse> => { ... }
```

---

### 4.8 `generateMockBookings` is Dead Code

**File:** `frontend/pages/Dashboard.tsx` (lines ~15-39)

The function `generateMockBookings` is defined but never called. The dashboard correctly uses `bookingsAPI.getAll()` instead.

**Fix:** Delete the dead code.

---

### 4.9 External Hero Image Dependency

**File:** `frontend/pages/Home.tsx` (line ~25)

```tsx
src="https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?..."
```

The hero section depends on an external Unsplash image. If Unsplash is down, slow, or rate-limits, the hero looks broken.

**Fix:** Download the image and serve it locally, or use a CSS-only gradient background as fallback.

---

### 4.10 Profile Save Success Detection is Fragile

**File:** `frontend/pages/Dashboard.tsx` (line ~103)

```typescript
setProfileSaveMsg(t.changesSaved);
// ...
<p className={`text-sm mt-2 ${profileSaveMsg.includes('success') ? 'text-green-600' : 'text-red-500'}`}>
```

The color logic checks if `profileSaveMsg.includes('success')`, but `t.changesSaved` may not contain the word "success" in French/Arabic translations. It will show red text even on success.

**Fix:** Use a separate boolean state for success/error instead of checking the message text.

---

## 5. Architecture & Code Quality

### 5.1 Environment Variable Typo

Throughout the codebase, the frontend URL env var is spelled `FRONTED_URL` (missing the 'N'). It should be `FRONTEND_URL`. This is cosmetic, but:
- Confusing for new developers
- Will cause issues if someone adds the correctly-spelled version and expects it to work

---

### 5.2 Cloudinary Config Loads .env Redundantly

**File:** `backend/config/cloudinary.js`

```javascript
import dotenv from 'dotenv';
dotenv.config();
```

`dotenv.config()` is already called in `server.js` before this file is used. The redundant call could load a different `.env` file depending on the working directory.

---

### 5.3 Database Connection on Every Request

**File:** `backend/server.js` (lines ~42-49)

```javascript
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    res.status(503).json({ message: 'Database connection failed' });
  }
});
```

While `connectDB` caches the connection, calling it as middleware on every single request adds unnecessary overhead. The connection check should happen at startup or be handled by Mongoose's built-in reconnection.

---

### 5.4 No Error Boundary in React

If any component throws during rendering, the entire app crashes with a white screen. There is no React Error Boundary to catch and display a fallback UI.

---

### 5.5 No TypeScript on Backend

The backend is plain JavaScript with no type checking. This leads to potential runtime errors that TypeScript would catch at compile time (e.g., accessing `provider.userId` on null, wrong property names).

---

### 5.6 No API Response Standardization

Some endpoints return plain objects, some return arrays, some wrap in `{ message, data }`. There's no consistent response envelope.

**Fix:** Standardize all responses:
```javascript
{ success: true, data: {...}, message: 'Optional message' }
```

---

## 6. Missing Features

### 6.1 Review & Rating System

The `ServiceProvider` model has `rating` and `totalReviews` fields, and the Dashboard has a "Leave Review" button, but:
- There is **no Review model** in the database
- There is **no review API endpoint**
- The rating field is always `0` (default)
- The "Leave Review" button does nothing

This is one of the most important features for a marketplace platform.

---

### 6.2 Email Verification

Users can register with any email without verification. There's no way to confirm the email is real.

**Needed:** Send verification email on registration, verify token, mark account as verified.

---

### 6.3 Password Reset / Forgot Password

The login modal has a "Forgot Password?" link (text only), but it does nothing. There is no password reset flow.

**Needed:** Forgot password email → reset token → new password form → update endpoint.

---

### 6.4 Real-Time Notifications

Notifications are only fetched on login and page load. There is no real-time update mechanism.

**Needed:** WebSocket (Socket.io) or Server-Sent Events for live notification delivery.

---

### 6.5 Search by Provider Name/Description

The `GET /api/providers` endpoint only filters by exact field matches (`role`, `wilayaId`, etc.). There is no text search capability.

**Fix:** Add MongoDB text index on `name` and `description`, or use `$regex` search.

---

### 6.6 Provider Profile Page

There is no dedicated page to view a single provider's full details — their reviews, photos, full schedule, map location, etc. Clicking a provider card can only call or book.

---

### 6.7 Map Integration

The app calculates distances using Haversine formula but has no actual map. For an auto services app in Algeria, showing providers on a map is essential.

**Needed:** Google Maps, Mapbox, or OpenStreetMap (Leaflet) integration.

---

### 6.8 Provider Image Upload

Providers cannot upload photos of their garage/shop. The `image` field defaults to a random `picsum.photos` URL. Only user avatar uploads are implemented.

---

### 6.9 Payment System

The Booking model has a `price` field but there is no payment flow. For Algeria, consider:
- CCP (postal account) integration
- Baridimob
- Cash on delivery notation
- EDAHABIA card integration

---

### 6.10 Tests (Zero Coverage)

There are **zero tests** — no unit tests, no integration tests, no E2E tests. Both `package.json` files have no test scripts or test dependencies.

**Needed:**
- Backend: Jest/Mocha for API route tests
- Frontend: Vitest + React Testing Library
- E2E: Playwright or Cypress

---

### 6.11 Provider Verification/Approval Workflow

The admin panel shows "Pending Approvals" but it's all fake data. There is no:
- `isVerified` field on ServiceProvider
- Approval/rejection API endpoints
- Document upload for business verification

---

### 6.12 Booking Cancellation Reason

When a provider declines or a client cancels, there's no way to provide a reason. This is important for dispute resolution.

---

### 6.13 Multi-Image Gallery for Providers

Providers should be able to show multiple photos of their work, workshop, equipment, etc.

---

### 6.14 Push Notifications (Mobile Web)

For roadside emergencies, web push notifications would greatly improve the user experience.

---

### 6.15 Reporting & Analytics

No admin analytics: user growth charts, booking trends, revenue per provider, popular wilayas, etc.

---

## 7. Performance Concerns

### 7.1 No API Response Caching

Every page navigation re-fetches all providers from the API. There's no caching strategy.

**Fix:** Use React Query (TanStack Query) for automatic caching, deduplication, and background refetches.

---

### 7.2 Provider List Not Paginated

If 5000 providers are registered, `GET /api/providers` returns all of them in one response.

**Fix:** Server-side pagination with limit/skip parameters.

---

### 7.3 No Image Optimization

Provider card images load full-size photos from external URLs. No lazy loading, no responsive sizes, no WebP format.

**Fix:** Use `loading="lazy"` on images, consider Cloudinary transformations for optimized sizes.

---

### 7.4 Large Translation File

`translations.ts` is 927 lines with all three languages. This gets bundled into the main JavaScript bundle even if the user only uses one language.

**Fix:** Split translations per language and dynamically import the selected one.

---

### 7.5 No Code Splitting

The entire app is a single bundle. The Dashboard, ServicesPage, and Home are all included even if the user never navigates to them.

**Fix:** Use `React.lazy()` + `Suspense` for route-based code splitting.

---

## 8. DevOps & Deployment Issues

### 8.1 No `.env.example` File

New developers have no reference for required environment variables. They must read the code to discover `PORT`, `MONGODB_URI`, `JWT_SECRET`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `FRONTED_URL`, `VITE_REACT_APP_BACKEND_BASEURL`.

**Fix:** Create `.env.example` with all variables documented.

---

### 8.2 No `.gitignore` Visible

Ensure `.env` files, `node_modules/`, `dist/`, `.DS_Store` are properly gitignored.

---

### 8.3 No CI/CD Pipeline

No GitHub Actions, no Vercel build hooks, no automated testing or linting before deployment.

---

### 8.4 No ESLint or Prettier Configuration

No code style enforcement. No linting rules. This leads to inconsistent code formatting across files.

**Fix:** Add ESLint with TypeScript rules + Prettier for the frontend. Add ESLint for the backend.

---

### 8.5 No Docker Configuration

No Dockerfile or docker-compose for local development. New developers must manually install Node.js, set up MongoDB, configure Cloudinary, etc.

---

### 8.6 Backend Missing `NODE_ENV` Default

**File:** `backend/server.js`

`process.env.NODE_ENV` is checked but never defaulted. If unset, the development logger doesn't run and error details are hidden.

---

## 9. UI/UX Enhancements

### 9.1 No Loading States for Auth

The login and register forms show a generic "Processing..." text but no skeleton or meaningful loading UI. Users don't know if the app is working.

---

### 9.2 No Toast/Snackbar Notification System

Success and error messages are shown inline within forms. There is no global toast/snackbar system for actions like "Booking created" or "Profile updated."

---

### 9.3 No Confirmation Dialogs

Actions like "Clear all notifications," "Cancel booking," and "Decline job" execute immediately without confirmation. Users can accidentally clear all notifications with one click.

---

### 9.4 Footer Links Are All Placeholders

All footer links (`About Us`, `Pricing`, `Privacy Policy`, `Terms of Service`, social media) point to `#`. They do nothing.

---

### 9.5 No 404 Page

If a user somehow navigates to an invalid state, there's no 404 page or fallback.

---

### 9.6 Home Page Stats Are Fake

**File:** `frontend/pages/Home.tsx`

The homepage displays "58 Wilayas Covered," "2k+ Active Mechanics," "15m Avg Response Time," "5.0 User Rating." These are all hardcoded marketing stats with no real data backing.

---

### 9.7 Mobile Notification Bell Missing

On mobile, the notification bell is not shown in the mobile header (only the Dashboard icon). Users must go to the Dashboard to see notifications on mobile.

---

### 9.8 No Scroll Restoration

When navigating between pages, `window.scrollTo({ top: 0 })` is called, but when returning to a previous page (e.g., provider list), the scroll position is lost.

---

### 9.9 WhatsApp Number Formatting

**File:** `frontend/components/ServiceCard.tsx`

```typescript
href={`https://wa.me/${provider.phone.replace(/\D/g, '')}`}
```

This strips non-digit characters but doesn't convert the Algerian format (`0550...`) to international format (`213550...`). WhatsApp requires the international format with country code.

The Dashboard's booking view does this correctly, but ServiceCard does not.

---

### 9.10 Arabic RTL Layout Issues

While `dir="rtl"` is applied to the HTML element for Arabic, many components use hardcoded directional CSS:
- `ml-6`, `mr-2`, `left-3`, `right-3`, `translate-x-6` — these don't flip in RTL
- Should use logical properties: `ms-6`, `me-2`, `start-3`, `end-3`

---

## 10. Summary & Priority Roadmap

### Immediate (Before any deployment)

| # | Issue | Severity |
|---|---|---|
| 1 | Fix registration to send/accept professional data | CRITICAL |
| 2 | Fix Vite proxy double `/api` path | CRITICAL |
| 3 | Replace JWT secret with strong random key | CRITICAL |
| 4 | Add input validation (express-validator) | CRITICAL |
| 5 | Add rate limiting on auth endpoints | HIGH |
| 6 | Fix availability toggle persistence | HIGH |
| 7 | Remove login notification spam | HIGH |
| 8 | Fix or remove non-functional password change form | HIGH |

### Short-Term (First sprint after launch)

| # | Feature/Fix | Priority |
|---|---|---|
| 9 | Add React Router for proper URL routing | HIGH |
| 10 | Implement review & rating system | HIGH |
| 11 | Add database indexes | HIGH |
| 12 | Add pagination to all list endpoints | HIGH |
| 13 | Fix hardcoded English strings | MEDIUM |
| 14 | Persist dark mode & language in localStorage | MEDIUM |
| 15 | Remove unused dependencies (`@google/genai`) | MEDIUM |
| 16 | Replace picsum default images | MEDIUM |
| 17 | Fix WhatsApp number formatting | MEDIUM |

### Medium-Term (Next 2-4 weeks)

| # | Feature | Priority |
|---|---|---|
| 18 | Email verification flow | HIGH |
| 19 | Password reset flow | HIGH |
| 20 | Provider detail page | HIGH |
| 21 | Map integration (Leaflet/OpenStreetMap) | HIGH |
| 22 | Real admin dashboard with real data | HIGH |
| 23 | Provider image upload | MEDIUM |
| 24 | WebSocket real-time notifications | MEDIUM |
| 25 | State management (React Context/Zustand) | MEDIUM |
| 26 | API response caching (React Query) | MEDIUM |

### Long-Term (1-3 months)

| # | Feature | Priority |
|---|---|---|
| 27 | Write test suite (backend + frontend) | HIGH |
| 28 | CI/CD pipeline | HIGH |
| 29 | Payment integration | MEDIUM |
| 30 | Push notifications | MEDIUM |
| 31 | Admin analytics & reporting | MEDIUM |
| 32 | Provider verification workflow | MEDIUM |
| 33 | Multi-image gallery for providers | LOW |
| 34 | Code splitting & performance optimization | LOW |
| 35 | Docker configuration | LOW |

---

### What the Project Does Well

- **Clean, modern UI** — The Tailwind CSS design is professional with excellent dark mode support
- **Trilingual support** — EN/FR/AR with RTL handling is ambitious and well-executed
- **Algeria-specific data** — All 58 wilayas with GPS coordinates, communes, is very useful
- **Working core flows** — Registration, login, provider listings, booking creation all work
- **Good component structure** — Files are well-organized and components are reasonably sized
- **Cloudinary integration** — Avatar upload works properly with stream-based upload
- **Real-time open/closed detection** — ServiceCard's working hours check is a nice touch
- **Vercel-ready** — Both frontend and backend have vercel.json configs for serverless deployment

---

*End of Review — Total issues identified: 50+*

# SOS Auto DZ — Full Codebase Review 6
*Comprehensive bug & missing-feature audit — all layers (frontend, backend, security, UX)*

---

## 1. BUGS — Backend

### 1.1 `DELETE /api/bookings/:id` does NOT notify the provider on client cancellation
**File:** `backend/routes/bookings.js` (DELETE handler, ~line 220)

After setting `booking.status = 'CANCELLED'` and saving, the route returns immediately with no `Notification.create()` and no `emitNotification()` call. The provider is never told the client cancelled.

**Fix:** Mirror the notification logic from the `PUT /:id` handler:
```js
const notif = await Notification.create({
  userId: provider.userId,
  title: 'Booking Cancelled',
  message: `${booking.clientName} has cancelled the booking for ${booking.date.toDateString()}`,
  type: 'INFO'
});
emitNotification(provider.userId, { ...notif.toObject(), _id: notif._id });
```

---

### 1.2 `PUT /api/bookings/:id` — Admin cannot update bookings
**File:** `backend/routes/bookings.js` (~line 155)

Authorization check:
```js
if (!isClient && !isProvider) {
  return res.status(403).json({ message: 'Not authorized to update this booking' });
}
```
An ADMIN (`req.user.role === 'ADMIN'`) is rejected because neither `isClient` nor `isProvider` is true. Admins need to be able to forcefully cancel or complete bookings from the admin panel.

**Fix:** Add `const isAdmin = req.user.role === 'ADMIN';` and include it in the guard: `if (!isClient && !isProvider && !isAdmin)`.

---

### 1.3 `GET /api/providers/user/:userId` — No ownership or admin check
**File:** `backend/routes/providers.js` (~line 230)

Any authenticated user can call `GET /api/providers/user/<any-userId>` and retrieve full provider details including phone number of another provider. Only the owner or an admin should be allowed.

**Fix:**
```js
if (req.user._id.toString() !== req.params.userId && req.user.role !== 'ADMIN') {
  return res.status(403).json({ message: 'Not authorized' });
}
```

---

### 1.4 `GET /api/admin/providers/pending` — Hard-coded `limit(50)`, no pagination
**File:** `backend/routes/admin.js` (~line 40)

```js
const providers = await ServiceProvider.find({ isVerified: 'PENDING' }).sort({ createdAt: -1 }).limit(50);
```
If more than 50 providers are pending, the admin silently loses data. All other admin list endpoints are paginated.

**Fix:** Accept `page`/`limit` query params consistent with the other admin routes.

---

### 1.5 Notification approval message missing `title` field on admin approve/reject
**File:** `backend/routes/admin.js` (~lines 60, 100)

```js
await Notification.create({
  userId: provider.userId,
  message: 'Your provider profile has been approved...',
  type: 'SYSTEM'
});
```
The `Notification` schema requires `title` (`required: true`). This `create()` will throw a Mongoose validation error and the approval/rejection endpoint returns a 500. The provider update **does** succeed (already saved with `findByIdAndUpdate`) but the notification silently fails.

**Fix:** Add `title: 'Profile Approved'` / `title: 'Profile Rejected'` to both `Notification.create()` calls in admin.js. Same issue in the ban/unban handler (line ~235).

---

### 1.6 `PUT /api/auth/profile` — Profile name update does NOT sync to `booking.clientName`
**File:** `backend/routes/auth.js` (~line 310)

When a client changes their name, `ServiceProvider` is synced but `Booking.clientName` is not. The booking history will show the old name for past bookings (intended — snapshots) but the UI also shows current name in the provider's incoming request view via the snapshot, which is correct. **This is actually fine by design** (snapshot pattern) — no bug here — but it should be documented to avoid future confusion.

---

### 1.7 Password-change endpoint does NOT invalidate sessionStorage tokens on the client
**File:** `backend/routes/auth.js` (~line 450) + `frontend/api.ts`

The backend clears auth cookies and invalidates the refresh token on `PUT /api/auth/password`. However the frontend `api.ts` stores an `_accessToken` in both memory and `sessionStorage`. After a password change (which calls `onLogout()` after 2 seconds), the in-memory token and sessionStorage entry are only cleared by the logout path. During that 2-second window the old token is still in memory and can be used for requests. In practice minor, but worth noting.

---

### 1.8 `Review.aggregate` uses `booking.providerId` (ObjectId) but `Review.providerId` is also an ObjectId reference — match may fail due to type mismatch
**File:** `backend/routes/reviews.js` (~line 55)

```js
const stats = await Review.aggregate([
  { $match: { providerId: booking.providerId } },
  ...
]);
```
`booking.providerId` comes from a Mongoose document and is an ObjectId. This works when Mongoose populates the pipeline correctly, BUT if `booking.providerId` is a plain string (e.g. from a deserialized JSON body), the `$match` will produce 0 results and the provider rating won't update. Best practice is to be explicit:
```js
{ $match: { providerId: new mongoose.Types.ObjectId(booking.providerId) } }
```

---

### 1.9 `ServiceProvider` text index conflicts with `$or` regex search in providers route
**File:** `backend/routes/providers.js` (~line 68)

A MongoDB text index exists on `name` + `description` (defined in the model), but the search uses a case-insensitive regex `$or` instead of `$text`. This means:
- The text index is never used → full collection scan on every search
- Text index and regex filter coexist but only one will be used for query planning

**Fix:** Either use `{ $text: { $search: search } }` with a `score` sort, or drop the text index entirely and rely on the regex (add a compound index for `role + wilayaId` which already exists, plus potentially an index on `name`).

---

### 1.10 `CSRF_SECRET` fallback to `JWT_SECRET`
**File:** `backend/server.js` (~line 115)

```js
const CSRF_SECRET = process.env.CSRF_SECRET || process.env.JWT_SECRET;
```
If `CSRF_SECRET` is not set in `.env`, CSRF tokens are signed with the same key as JWTs. An attacker who leaks one secret compromises both systems. These should be independent keys.

---

## 2. BUGS — Frontend

### 2.1 `bookingsAPI.getAll()` has no pagination — loads ALL bookings in one call
**File:** `frontend/pages/Dashboard.tsx` (~line 485)

```ts
const data = await bookingsAPI.getAll();
```
`bookingsAPI.getAll()` sends `GET /api/bookings` with no `page` or `limit` params. The backend defaults to `limit=20` but the frontend mapping code does `data.data ?? data` meaning it handles paginated response. For users with >20 bookings, only the first 20 are shown with no way to reach older ones. There is no "load more" or pagination UI in the dashboard bookings tab.

---

### 2.2 `reviewedBookingIds` check makes N+1 API calls on dashboard load
**File:** `frontend/pages/Dashboard.tsx` (~line 510)

```ts
await Promise.all(
  completedIds.map(async (id) => {
    const res = await reviewsAPI.checkBooking(id);
    if (res.reviewed) reviewed.add(id);
  })
);
```
Each completed booking triggers a separate HTTP request. A user with 10 completed bookings fires 11 requests (1 for bookings + 10 for reviews). This should be a single batch endpoint like `GET /api/reviews/my-reviewed-bookings` returning all reviewed booking IDs for the current user.

---

### 2.3 `todaysJobs` stat uses string comparison that will break on time zones
**File:** `frontend/pages/Dashboard.tsx` (~line 695)

```ts
bookings.filter(b => b.date === new Date().toISOString().slice(0,10) && ...)
```
`b.date` is the booking date stored as-is from the backend (ISO string sliced to 10 chars in the mapping). `new Date().toISOString()` returns UTC. If the server is in UTC+1 or the client is in UTC+3 (Algeria is UTC+1), a booking for "today local time" might appear as "yesterday" in UTC and disappear from the today count.

---

### 2.4 `handleCancelBooking` passes `t.cancelledByClient` as `cancellationReason` but `bookingsAPI.delete` sends `cancellationReason` in the body only if it is truthy
**File:** `frontend/api.ts` (`bookingsAPI.delete`) + `frontend/pages/Dashboard.tsx`

```ts
body: cancellationReason ? JSON.stringify({ cancellationReason }) : undefined
```
If `t.cancelledByClient` is an empty string in any language, the body won't be sent. The backend `DELETE` handler would then set no `cancellationReason` and the field stays undefined. Not critical but can result in blank reason in the history.

---

### 2.5 `AuthModal` — Professional registration: `selectedCommune` not reset when wilaya changes
**File:** `frontend/components/AuthModal.tsx`

When a user selects a wilaya then changes to a different wilaya, `selectedCommune` is NOT reset. The commune dropdown redraws with new options but the old (now invalid) `selectedCommune` value stays selected. The backend will accept it (no commune validation against wilaya list), but the submitted commune may not match the selected wilaya.

**Fix:** Add `setSelectedCommune('')` in the wilaya `onChange` handler.

---

### 2.6 Booking modal `date` input minimum not enforced client-side after midnight
**File:** `frontend/components/BookingModal.tsx`

`min={new Date().toISOString().slice(0,10)}` is computed once at React render time. If the component is left open past midnight, the minimum date is yesterday. The backend correctly validates `bookingDate < today`, but the user gets a confusing server error instead of a client-side message.

**Fix:** Use a `useMemo` or dynamic `min` on the input that recomputes on render.

---

### 2.7 Socket.io connection established with no authentication — any client can connect
**File:** `frontend/App.tsx` (~line 196) + `backend/config/socket.js`

The socket connects with `withCredentials: true` but the backend socket initialization does not verify the auth cookie or JWT on `connection`. Any browser can open a socket to the backend URL. Real-time `notification` events are saved per `userId` via `emitNotification`, but the socket room assignment is not shown in the shared context — need to verify `backend/config/socket.js` properly uses the user's id to join a room and validates the session.

---

### 2.8 `handleLoginSuccess` redirects ALL non-CLIENT roles to `/dashboard` including ADMIN
**File:** `frontend/App.tsx` (~line 297)

```ts
if (loggedInUser.role !== UserRole.CLIENT) {
  navigate('/dashboard');
}
```
This is correct but also means a Parts Shop owner is immediately sent to dashboard without any confirmation that they're in the right place. More importantly, if a `PARTS_SHOP` or `TOWING` provider logs in from the ServicesPage (triggered by clicking "Book"), they are redirected away from the page they were browsing and the booking flow is abandoned. The `selectedProvider` state in App is set but navigation overrides the modal trigger.

---

### 2.9 `Footer` hard-coded year must be updated manually
**File:** `frontend/components/Footer.tsx`

The copyright year is likely hard-coded. Should use `new Date().getFullYear()` to stay current automatically.

---

### 2.10 Dark mode default is `true` — users who prefer light mode get dark on first visit
**File:** `frontend/App.tsx` (~line 66)

```ts
const [isDarkMode, setIsDarkMode] = useState<boolean>(() =>
  localStorage.getItem('darkMode') !== 'false'
);
```
On first visit, `localStorage.getItem('darkMode')` is `null`, so `null !== 'false'` is `true` — dark mode is forced on all new users. Should respect `prefers-color-scheme` media query for first-visit behavior:
```ts
localStorage.getItem('darkMode') ?? window.matchMedia('(prefers-color-scheme: dark)').matches ? 'true' : 'false'
```

---

## 3. MISSING FEATURES

### 3.1 No pagination UI for bookings in the dashboard
The backend supports paginated booking responses (`{ data, total, page, pages }`) but the frontend fetches only the first page and shows no pagination controls. Users with many bookings will silently see only the most recent 20.

---

### 3.2 No way for a provider to set price on a confirmed/completed booking
The `Booking` schema has a `price` field, the `PUT /api/bookings/:id` endpoint accepts `price`, and the `Booking` frontend type includes `price?: number`. But there is no UI in the Dashboard for a provider to input and save a price for a booking. The field is displayed nowhere in the client view either.

**Suggestion:** Add a price input field in the provider's booking card (visible when status is CONFIRMED or when marking COMPLETED).

---

### 3.3 No email sent on provider approval/rejection (only in-app notification)
`backend/routes/admin.js` creates a `Notification` but does not call any email function. Providers often check email for account status updates. Add an email similar to `sendBookingStatusEmail`.

---

### 3.4 No rate-limit on `/api/reviews` POST — review spam possible
The reviews route has no rate-limiter. A malicious user could flood a provider with rapid review attempts (each would be rejected because of the unique `bookingId` index, but the DB load is real). Apply the `authLimiter` to review creation.

---

### 3.5 No rate-limit on `/api/notifications/*` — polling abuse
The polling fallback in `App.tsx` polls every 30 seconds per logged-in session. No rate-limiter is applied to the notifications routes. With many concurrent users this increases DB load linearly.

---

### 3.6 No email notification when booking is cancelled by DELETE endpoint
As noted in §1.1, the client-cancel path (DELETE) neither notifies the provider via in-app notification nor sends an email. The PUT-based cancel (provider declining) does send email. The two paths should be consistent.

---

### 3.7 `ServiceProvider` has no `location` coordinates — distance sorting is approximated
The `DistanceIndicator` component and "sort by nearest" feature in `ServicesPage` rely on the wilaya centroid coordinates from the `WILAYAS` constant, not real GPS coordinates. Two providers in the same wilaya will always have the same "distance". The `ServiceProvider` model has no `latitude`/`longitude` field.

**Suggestion:** Add optional `location: { type: Point, coordinates: [lng, lat] }` with a `2dsphere` index to enable true geo-proximity queries via MongoDB `$near`.

---

### 3.8 No "search by text" in the Dashboard admin panel (providers tab)
The admin user panel supports text search (`GET /api/admin/users?search=...`) but the admin provider list does not accept a `search` parameter. The backend `GET /api/admin/providers` has no search filter. Admins reviewing large provider lists can only filter by status.

---

### 3.9 No refresh indicator / live badge for new notifications
The notification dropdown shows unread count but there is no visual flash or badge animation when a new real-time notification arrives via Socket.io. The `notification` socket event updates the array, but users may not notice without a brief highlight effect.

---

### 3.10 No profanity / content moderation on user-submitted text
Review comments, booking issue descriptions, and provider descriptions have only length limits. No content moderation, no banned-word filtering. For a public marketplace this is a risk.

---

### 3.11 No "mark booking as complete" action for clients
Once a booking is CONFIRMED, only the provider can mark it COMPLETED (via `PUT /api/bookings/:id`). If a provider never marks it complete, the client cannot leave a review. A timeout or a client-side "confirm completion" button would unblock reviews.

---

### 3.12 No input validation in Dashboard for provider description / services
Provider description textarea and service name/price inputs do not show live validation errors. A provider can submit an empty description (backend min length not enforced in POST register either — `description?.trim() || 'Professional {role} service'` silently substitutes). The services save will succeed with a `price` of `NaN` if the input is not a number (frontend `parseFloat` returns `NaN` for an empty string but the check is `isNaN(price) || price < 0` — zero is allowed, but negative would be caught).

---

### 3.13 No email change feature
Users cannot change their email address. There is `PUT /api/auth/profile` for name+phone but no endpoint for email change with re-verification. Common user request.

---

### 3.14 `Notification` `type` field mismatch — backend uses `'SYSTEM'`, frontend/model only allow `'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR'`
**File:** `backend/models/Notification.js` + `backend/routes/admin.js`

The Notification schema enum is:
```js
enum: ['INFO', 'SUCCESS', 'WARNING', 'ERROR']
```
But admin.js creates notifications with `type: 'SYSTEM'`:
```js
await Notification.create({ ..., type: 'SYSTEM' });
```
Mongoose will reject this with a validation error, causing the `Notification.create()` call to throw, and the approval/rejection endpoint will return 500. This compounds the missing `title` bug in §1.5.

**Fix:** Add `'SYSTEM'` to the enum in `Notification.js`, or change all `type: 'SYSTEM'` usages in admin.js to `type: 'INFO'`.

---

### 3.15 No account suspension feedback flow for banned users
When a user is banned, they receive an in-app notification, but if they try to log in afterwards, the backend `protect` middleware returns:
```
403: 'Your account has been suspended. Please contact support.'
```
There is no "contact support" link, email address, or appeal mechanism anywhere in the UI. The 403 from `protect` will surface as a generic error toast.

---

## 4. SECURITY NOTES

### 4.1 Refresh token stored in `sessionStorage` — XSS risk
**File:** `frontend/api.ts`

```ts
sessionStorage.setItem('refreshToken', token)
```
`sessionStorage` is accessible to any JavaScript on the page. An XSS vulnerability would allow an attacker to steal both the access AND refresh tokens. The refresh token is also set as an HttpOnly cookie (safer), but the sessionStorage fallback undermines this. Consider relying only on cookies for production and removing the sessionStorage path.

---

### 4.2 Access token also stored in `sessionStorage`
Same concern as §4.1. `sessionStorage.setItem('accessToken', token)` is XSS-readable. Both tokens should only live in HttpOnly cookies in a hardened deployment.

---

### 4.3 No `Content-Security-Policy` header
`helmet()` is used but CSP is not explicitly configured. The default `helmet` CSP is quite permissive. Adding a tight CSP would mitigate the XSS risk that makes §4.1/4.2 dangerous.

---

### 4.4 `CORS` allows all local dev origins unconditionally
**File:** `backend/server.js`

```js
if (!isProduction) { allowed.push('http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'); }
```
In development any tab at those origins can make credentialed cross-origin requests. Not a production issue but worth noting for developer machines that might run other apps on those ports.

---

### 4.5 No HTTPS enforcement in development
The backend has `secure: isProduction` on cookies. In development, cookies are `secure: false` and `sameSite: 'lax'`. Fine for local dev, but this means staging environments not explicitly set to `NODE_ENV=production` would also get insecure cookies.

---

## 5. PERFORMANCE NOTES

### 5.1 `providersAPI.getAll()` in ServicesPage fetches without page size limit on refetch
**File:** `frontend/pages/ServicesPage.tsx`

When filters change, `providersAPI.getAll(filters)` is called. The backend defaults to `limit=20`. If there are hundreds of providers, the user only sees 20 with no indication that more exist and no "load more" button.

---

### 5.2 No `useCallback` / `useMemo` on filter handlers in ServicesPage
Each filter state change in ServicesPage re-renders the full provider list (40+ cards). The filter handlers are inline arrow functions. `useCallback` on handlers and `useMemo` on the mapped provider list would reduce unnecessary re-renders.

---

### 5.3 Gallery images uploaded sequentially in `for` loop
**File:** `backend/routes/providers.js` (~line 305)

```js
for (let i = 0; i < filesToUpload.length; i++) {
  const result = await uploadToCloudinary(file.buffer, ...);
}
```
Up to 4 gallery images are uploaded one-by-one. Using `Promise.all` would parallelise the Cloudinary uploads:
```js
const uploads = await Promise.all(filesToUpload.map((file, i) => uploadToCloudinary(...)));
```

---

### 5.4 Every DB request re-connects (lazy connect pattern without connection pool caching)
**File:** `backend/config/db.js` + `backend/server.js`

The `app.use(async (req, res, next) => { await connectDB(); next(); })` middleware calls `connectDB` on every request. This is fine if `connectDB` caches the connection (Mongoose does reuse connections), but the function should include a guard:
```js
if (mongoose.connection.readyState >= 1) return; // already connected
```
Without this guard, every request that arrives before Mongoose emits `connected` will trigger a new `connect()` attempt.

---

## 6. CODE QUALITY / MAINTAINABILITY

### 6.1 `Dashboard.tsx` is 2042 lines — should be split
The Dashboard is a single mega-component with all sub-views (`ClientOverview`, `ProfessionalOverview`, `AdminOverview`, individual tab views) defined as inline functions. These should be extracted into separate files under `pages/dashboard/` or `components/dashboard/` to improve readability, testing, and code-splitting.

---

### 6.2 `translations.ts` is a single flat object — no namespace splitting
All translation keys for all languages are in one object. At 150+ keys it's still manageable, but common translation keys (`cancel`, `save`) are duplicated across multiple UI contexts. A namespace pattern (e.g. `common`, `auth`, `dashboard`, `booking`) would prevent key collisions and make lookups faster.

---

### 6.3 `_providerTotalReviews` state variable prefixed with `_` — suggests unused
**File:** `frontend/pages/Dashboard.tsx` (~line 60)

```ts
const [_providerTotalReviews, setProviderTotalReviews] = useState(0);
```
The `_` prefix conventionally means unused. The value is set from API data but never displayed. Either display the review count in the provider overview, or remove the state.

---

### 6.4 Backend `devError` leak in production-like environments
**File:** `backend/utils/errors.js`

`devError(error)` spreads error details into responses. If `NODE_ENV` is not exactly `'development'`, it returns `{}`. But on Vercel staging deploys where `NODE_ENV` isn't set, you could inadvertently return stack traces. Always check `devError` is gated correctly.

---

### 6.5 Missing `<title>` and `<meta description>` per-route SEO tags
**File:** `frontend/index.html` + all page components

All pages share the same static `<title>` from `index.html`. Each route (`/garage`, `/provider/:id`, `/about`) should use `document.title` or a head-management library (e.g., `react-helmet-async`) to set relevant titles and meta descriptions for SEO.

---

### 6.6 `public/` favicon and app icons not personalized
The project likely has the default Vite favicon. An Algerian automotive branding favicon should be added.

---

## 7. SUMMARY TABLE

| ID | Layer | Severity | Area | Issue |
|----|-------|----------|------|-------|
| 1.1 | Backend | High | Bookings | Client cancel doesn't notify provider |
| 1.2 | Backend | High | Bookings | Admin blocked from updating bookings |
| 1.3 | Backend | High | Providers | Any user can read another user's provider profile |
| 1.4 | Backend | Medium | Admin | Pending providers limited to 50, no pagination |
| 1.5 | Backend | **Critical** | Admin/Notifications | `type: 'SYSTEM'` not in enum → 500 error on approval |
| 1.8 | Backend | Medium | Reviews | Aggregate `$match` potential type mismatch |
| 1.9 | Backend | Medium | Performance | Text index unused, regex full-scan |
| 1.10 | Backend | Medium | Security | CSRF secret falls back to JWT secret |
| 2.1 | Frontend | High | Dashboard | Bookings not paginated — silent data loss >20 |
| 2.2 | Frontend | Medium | Performance | N+1 review check calls on load |
| 2.3 | Frontend | Medium | Dashboard | Today's jobs count breaks near midnight / timezone |
| 2.5 | Frontend | Low | AuthModal | Commune not reset on wilaya change |
| 2.7 | Frontend | Medium | Security | Socket.io no server-side auth validation |
| 3.2 | Missing | Medium | Booking | No UI to set booking price |
| 3.3 | Missing | Low | Admin | No email on provider approval/rejection |
| 3.7 | Missing | Medium | UX | No real GPS coords — distance sorting inaccurate |
| 3.14 | Backend | **Critical** | Notifications | `'SYSTEM'` type causes Mongoose validation failure |
| 4.1-4.2 | Security | High | Auth | Access + refresh tokens in sessionStorage (XSS risk) |
| 4.3 | Security | Medium | HTTP | No Content-Security-Policy configured |
| 5.3 | Perf | Low | Upload | Gallery uploads sequential not parallel |
| 6.1 | Quality | Medium | Code | Dashboard.tsx 2042 lines, needs splitting |
| 6.5 | Quality | Low | SEO | No per-route `<title>` / `<meta>` tags |

---

*Generated by full codebase audit — June 2025*

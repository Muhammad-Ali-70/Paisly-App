# Paisly: Pre-Launch Audit (v1.0.4, versionCode 4)

**Audited:** 2026-11-10. Covers the app (`Expenzo`) and the backend (`Expenzo-Backend`).
**Severity:** 🔴 Critical = fix before production · 🟠 High = fix before production, or in the first patch at the latest · 🟡 Medium = soon after launch · 🟢 Low = polish / optimization

Each item is tagged **[App]**, **[Backend]** or **[Both]**.

**Status (2026-11-10, second pass):** Everything is ✅ **FIXED** in code (not committed; it ships with 1.0.4) except the items marked ⏳ below, which need you or a later release:

| # | Still open | Why / what to do |
|---|---|---|
| 1 | Sentry token | Revoke it in Sentry and set `SENTRY_AUTH_TOKEN` on the build machine |
| 6 | Sleeping backend | Hosting decision. Then lower the app timeout to 15s |
| 14 (part) | Token in unencrypted MMKV | Needs a new native lib (`react-native-keychain`) plus a migration of every stored session. Deferred to 1.0.5. Revocation and sliding sessions **are** done |
| 20 (part) | Real `.csv` file share | Needs a file-system lib. Crash fixed: large exports are emailed automatically |
| 22 (part) | Play Data Safety form | Fill in Play Console: App activity, Diagnostics, Device IDs (Sentry + PostHog). Session replay is now off (errors only) |
| 41 | `.env` secrets | Your secrets file, so I didn't touch it. Remove or rotate the Resend, Maileroo and Gmail keys. Set `BREVO_API_KEY`, `NODE_ENV=production`, and the new optional `PUBLIC_API_URL` (opt-out links) and `CRON_SECRET` (jobs endpoint) on the host |

**New backend env vars (optional):**
- `PUBLIC_API_URL=https://<your-api>` adds an "Unsubscribe" link to counterparty emails.
- `CRON_SECRET=<16+ chars>` enables `POST /api/jobs/investment-returns`. Call it from a cron with the header `X-Cron-Secret`.

**Deploy note:** OTP codes sent before the backend deploy stop working, because they are now stored hashed. Users just tap "Resend". Existing logins keep working.

### Fixed in the second pass (quick reference)
- **Low #25–#44:**
  - Foreground notification taps work.
  - Reminders are private on the lock screen and are never scheduled after logout.
  - The profile refreshes on launch.
  - A partial failure when adding several accounts no longer duplicates them on retry.
  - A reminder of 0 days is kept.
  - The Investments list refreshes after you add one.
  - Phone numbers are ignored as amounts in bulk add.
  - Sentry metro is wrapped once.
  - Images shrunk: the splash went from 692KB to 7KB WebP, logos from 160–180KB to 18–28KB, and 2 unused files (1.5MB) were deleted.
  - Native splash background, so there's no white flash.
  - `react-native-quick-actions` is replaced by native static shortcuts (`res/xml/shortcuts.xml`, no library). Old dynamic shortcuts are cleared on launch.
  - `ApiError` is now a real Error class.
  - Stale ProGuard rules removed. Lottie's rule stays, because Lottie *is* used.
  - Generic 500 messages.
  - Money is limited to 2 decimals and rounded.
  - Investment lookup is scoped by user.
  - JSON request logs with `X-Request-Id`.
  - `npm test` now runs 15 unit tests.
  - **Low balance (#44):** expenses, bulk add, bill payments, investments and lent debts **warn and then allow** a negative balance. Transfers still block.
- **Medium #9–#24:**
  - Double-tap guard on Save.
  - Deleting a debt reverses its transactions and balances and unlinks the expenses paid from it.
  - Seeding is idempotent and validated.
  - Logout resets payday, reminders, defaults and categories, and a late fetch can't restore the old user's accounts.
  - OTPs are hashed with 5 attempts max, emails are type-checked and normalised, and signup uses the strict limiter.
  - Password reset signs out all sessions, and reset links are single-use.
  - Sliding 30-day sessions.
  - 10 reminder emails per user per day, plus a signed opt-out link.
  - Release builds always use the production https URL, and dev URLs are verified absent from the bundle.
  - notifee's exact-alarm and foreground-service entries removed from the manifest.
  - Investment returns are claimed atomically (no duplicates across instances), catch up after downtime, and can run from an external cron.
  - **Safe-to-spend:**
    - Subtracts udhar owed before payday.
    - Budget is spread over the days left in this month.
    - Refreshes at midnight.
  - Cache is discarded on version change, and History is persisted as page 1 only.
  - Lucide icons are imported per icon: release JS bundle **8.45MB → 6.86MB (−19%)**.
  - Page and limit are clamped on every list endpoint.
- **Your extra requests:**
  - **History not showing a new transaction until refresh:** root cause was the History mount/focus refetch landing before the POST saved and wiping the optimistic row. Pending rows now survive any early refetch. A regression test fails without the fix and passes with it.
  - **Odometer animation:** `components/common/RollingNumber.js` on the Total Balance and Safe-to-spend amounts. Soft roll of about 0.6s, no animation on first render, respects reduce-motion.

---

## Launch checklist (minimum before you press "Release")

1. ⏳ Revoke the Sentry token (#1) and add the new one as an env var.
2. ✅ Fix the signup account-takeover (#2).
3. ✅ Make account deletion wipe recurring bills (#3).
4. ✅ Add a `keep.xml` so the notification icon survives the release build (#4).
5. ⏳ Move the backend off a sleeping free tier (#6).
6. ✅ Fix the "Remember me off" data leak (#5).
7. ✅ Timezone fix (#7) and debt repayments (#8).
8. ⏳ **Deploy the backend changes first** (the app's new debt rules and timezone header depend on them), then build the 1.0.4 AAB and test the build installed from Play internal testing (Google sign-in, notifications, widget, a debt repayment, an expense logged after midnight).

---

## 🔴 Critical

### 1. Sentry auth token committed to a public GitHub repo [App] ⏳ OPEN: revoke the token yourself in Sentry
- **Where:** `android/sentry.properties:1` (`auth.token=sntrys_…`). It has been tracked since commit `e86fe66`. `Muhammad-Ali-70/Paisly-App` is **public**.
- **Risk:** Anyone can use your Sentry org (`mak-0x`). Depending on the token's scopes they can read events and session replays from a finance app, or upload fake releases and source maps.
- **Fix:**
  1. Revoke the token now in Sentry → Settings → Auth Tokens.
  2. `git rm --cached android/sentry.properties` and add it to `.gitignore`.
  3. Pass the new token through the `SENTRY_AUTH_TOKEN` env var when building.
  4. Optionally scrub it from history (`git filter-repo`). Revoking the token is what actually protects you.
- **Also consider:** making the repo private.

### 2. Signup "squatting" allows account takeover [Backend]
- **Where:** `Expenzo-Backend/src/controllers/authController.js`, `signup()` (the `existing && !existing.isEmailVerified` branch).
- **What happens:**
  1. An attacker signs up with `victim@gmail.com` and their own password, and never verifies.
  2. Later the real victim signs up with the same email. The server sees an unverified account, **only sends a new OTP, and keeps the attacker's password and name**.
  3. The victim verifies the OTP and starts using the app.
  4. The attacker logs in with their original password and sees all of the victim's finances.
- **Fix:** In that branch, overwrite `password` (new bcrypt hash) and `name` with the new signup's values before sending the OTP. Optionally delete unverified accounts older than 24h.
- ✅ **FIXED:** Re-signing up an unverified email now replaces the stored password hash and name, so only the latest signup's credentials work (`authController.js`, `signup()`).

### 3. "Delete account" leaves recurring bills behind [Backend]
- **Where:** `Expenzo-Backend/src/controllers/userController.js`, `deleteAccount()`. The model list is `[Transaction, Debt, Investment, Budget, Notification, CustomCategory, Account]` and is missing **`RecurringTransaction`**.
- **Risk:** Google Play's account-deletion policy requires deleting the user's data. Bill titles, amounts and accountIds stay in the database forever, orphaned.
- **Fix:** Add `RecurringTransaction` to the list. Consider running the deletes inside a session and adding a unit test that asserts every model with `userId` is covered.
- ✅ **FIXED:** `RecurringTransaction` is now in the delete list. I checked all 9 models, and every collection with a `userId` is now wiped.

---

## 🟠 High

### 4. Notification icon is missing from git and will likely be stripped in release [App]
- **Where:** `android/app/src/main/res/drawable/ic_notification.xml` is **untracked**. It is referenced only from JS (`src/services/remindersService.js` → `smallIcon: 'ic_notification'`).
- **Risk:** `shrinkResources true` removes resources that aren't referenced from native code or XML, and JS strings don't count. In the last release build, other `ic_*` drawables were listed as unused. The likely result is that reminder, debt and bill notifications show a blank or white icon or fail, but **only in release**, so debug testing won't catch it.
- **Fix:** Commit the file and add `android/app/src/main/res/raw/keep.xml`:
  ```xml
  <resources xmlns:tools="http://schemas.android.com/tools"
      tools:keep="@drawable/ic_notification" />
  ```
- ✅ **FIXED:** The uncommitted file is expected, since it ships in the 1.0.4 build. Added `android/app/src/main/res/raw/keep.xml`, which keeps `ic_notification` and the three long-press shortcut icons (`ic_shortcut_expense/income/history`). Those are also referenced only from JS and had the same stripping risk.

### 5. With "Remember me" off, the previous user's data stays on the device [App]
- **Where:** `src/store/useAuthStore.js` → `login()` always runs `storage.set('token', token)`. Only the zustand copy is gated by `rememberMe` (in `partialize`).
- **What happens:** The user logs in with Remember me off and closes the app. On reopen they see the login screen, but their JWT (valid for 7 days), the persisted query cache (dashboard, transactions, debts, bills), the account cache, the **home-screen widget** and the scheduled debt reminders all remain. If a second person logs in on the same phone, they briefly see the first user's data. The `activity` query (`staleTime: Infinity`) carries over permanently.
- **Fix:**
  - When `rememberMe` is false, keep the token in memory only.
  - On a cold start with no persisted token, run the same cleanup that `logout()` does: clear the query cache, accounts, widget and reminders, and remove `token`.
  - Consider namespacing the persister key by userId.
- ✅ **FIXED:**
  - The token is no longer written to raw MMKV. `apiClient` reads it from the auth store, which keeps it in memory and persists it only when Remember me is on.
  - A shared `clearLocalUserData()` (query cache, accounts, widget, reminders, legacy `token` key) runs on logout **and** on any cold start with no persisted session. That also cleans up devices that already have leftover data.
  - Signup-OTP verification now explicitly sets `rememberMe: true`.

### 6. Production backend sleeps when idle (Render free tier) [Backend/Infra]
- **Where:** `.env` `APP_ENV=production-onrender`. `apiClient.js` has a 30s timeout and its comment notes 20–30s cold starts. The Brevo commit also says Render blocks SMTP (free tier).
- **Risk:** Real users regularly wait 20–30s on splash, login and dashboard, and some requests time out. That means bad first reviews and uninstalls. It also causes duplicate onboarding seeds (#11) and stops the hourly investment-return job from running (#18).
- **Fix:** Use a paid always-on instance (or the Railway URL you already configured), then lower the client timeout to about 15s.
- ⏳ **OPEN (infra decision for you):** No code change can fix this. Once production is on an always-on host, lower `timeout` in `src/services/apiClient.js` from 30000 to about 15000.

### 7. Day and month boundaries are computed in UTC, but users are in PKT (UTC+5) [Both]
- **Where:**
  - Backend: `homeController.js` (`new Date(y, m, 1)`, `$dayOfMonth: "$date"` with no timezone), `budgetController.calculateSpending`, `notificationService`, `transactionController.getTransactions`/`getSummary` (`setHours(0,0,0,0)` runs in server-local time, which is UTC), `exportController`.
  - App: `src/hooks/useSafeToSpend.js`, `src/components/history/DateRangeSection.js:29` (`toISOString().split('T')[0]` turns Nov 10 into "2026-11-09" before 5am).
- **What happens:**
  - An expense at 01:30 on the 10th is counted on the **9th**, so the "Safe to spend today" card and widget are too high.
  - Anything logged between 00:00 and 05:00 on the 1st counts in **last month's** total and budget.
  - History date filters are off by a day and shifted by 5 hours.
- **Fix:**
  - The app sends its IANA timezone (`Intl.DateTimeFormat().resolvedOptions().timeZone`) or UTC offset with every date-based request.
  - The backend uses `$dayOfMonth: { date: "$date", timezone }` and builds month and day bounds in that zone.
  - In the app, format local dates with the existing `toDayString()` (`src/utils/recurring.js`) instead of `toISOString()`.
- ✅ **FIXED:**
  - **App:** `apiClient` sends an `X-Timezone` header (the device's IANA zone) on every request. `DateRangeSection` uses `toDayString()` and parses picked days as local dates. The optimistic History filter (`matchesFilters`) now treats `dateFrom`/`dateTo` as inclusive local days, which also covers Low item #15.
  - **Backend:** a new `middleware/timezone.js` sets `req.tz` (validated; defaults to `Asia/Karachi`, so older app builds behave correctly for PK users). A new `utils/timezone.js` does month, day and day-range math in that zone (tested for PKT, month rollover and US DST).
  - **Applied to:** dashboard (month bounds plus `$dayOfMonth` with timezone), transactions list and summary, budgets (spending, days elapsed, current month), budget-alert notifications, and CSV/email export (filters, and row dates written as the local day).

### 8. Editing a debt's amount corrupts it, and there is no way to record a repayment [Both]
- **Where:** Backend `debtController.updateDebt()` sets `totalAmount` without touching `remainingAmount` or the account balance, and changing `sourceAccountId` doesn't move money either. App `AddEditDebtScreen.js` sends both fields on edit. `recordPaymentApi` and `settleDebtApi` exist in `src/services/debtService.js` but **no screen calls them**.
- **What happens:**
  - You lend Rs 1,000 and edit it to Rs 5,000. The debt then shows "partially paid (80%)" even though nothing was repaid, and the account balance is never debited the extra Rs 4,000.
  - Users can't record an udhar repayment at all, which is the core "Udhar Book" feature.
- **Fix:**
  - Either lock `totalAmount` and `sourceAccountId` after creation, or have the backend adjust `remainingAmount` and the balance inside a transaction.
  - Add "Record payment" and "Settle" buttons on `DebtDetailScreen` using the existing APIs, invalidating `['debts']` and the transaction data.
- ✅ **FIXED:**
  - **Backend:** `updateDebt` rejects any change to `totalAmount` or `sourceAccountId` with a clear message. Resending the unchanged values is allowed.
  - **App:** in edit mode the type toggle, amount and account are locked (the account is shown read-only) and are no longer sent.
  - **New:** a "Record Payment" / "Record Money Received" sheet (`components/modals/debt/RecordDebtPaymentModal.js`), opened from a footer button on `DebtDetailScreen`. It takes an amount (pre-filled with the remaining balance, with a "use full amount" shortcut), an account and a note. Paying the full remaining amount settles the debt, because the server auto-settles at 0. It has a double-tap guard, and on success refreshes debts, transactions, balances and reminders.
  - **Detail screen:** now shows "Still to pay/receive" and the debt's status.

---

## 🟡 Medium

### 9. Double-tapping "Save" can create a transaction twice [App]
- **Where:** `src/screens/tabs/AddTrasaction/AddTransactionScreen.js` (~L234–282). The normal path calls `createTransaction.mutate()` but never sets `saving`, so `disabled={saving}` doesn't help.
- **Fix:** Add a `useRef` in-flight guard before `mutate`. Best practice is also an idempotency key (client UUID) that the server dedupes on.

### 10. Deleting a debt leaves its money and locked transactions behind [Backend]
- **Where:** `debtController.deleteDebt()` only sets `isDeleted = true`. The account-balance effect of the original loan stays. The linked transactions can never be edited or deleted, because `transactionController` blocks anything with a `debtId`.
- **Fix:** On delete, either reverse the linked transactions and balances in a session, or block deleting active debts and offer "Settle" or "Waive" instead.

### 11. Onboarding account seeding is not idempotent [Both]
- **Where:** Backend `accountController.seedAccounts()`:
  - It accepts arbitrary fields (`...a`) with no balance validation, can be called repeatedly, and bypasses the 5-account and wallet rules.
  - On a duplicate it returns 207 from `catch` **before** setting `isOnboarded: true`.
  - App `OnboardingScreen.js` marks the user onboarded whatever the response. `ManageAccountsScreen.js` → `setOnboarded(false)` re-enters onboarding and seeds another "Wallet Cash".
- **What happens:** A cold-start timeout followed by a retry gives the user two wallets and doubles their total balance.
- **Fix:**
  - On the server, return the existing accounts if the user already has any, whitelist the fields, validate balances, and always set `isOnboarded`.
  - In the app, don't re-seed from ManageAccounts.

### 12. Logout leaves the previous user's settings behind [App]
- **Where:** `useAuthStore.logout()` resets only `checklistDismissed`. The payday, reminders (incl. `lastLoggedDay`), investment defaults and currency persist, and `useCategoryStore` and the custom-category registry are not cleared. A `fetchAccounts()` still in flight at logout can write the old accounts back into the cache.
- **Fix:** Reset those `useAppStore` fields and the category store. Guard `fetchAccounts` with a session counter, or check that the token is unchanged before calling `set`.

### 13. OTP brute force and storage [Backend]
- OTPs are 6 digits with only per-IP rate limiting (10/15min) and no **per-account attempt counter**, so a distributed attacker can try many codes.
- OTPs are stored in plaintext.
- `verifyOtp`, `verifySignupOtp` and `resendSignupOtp` don't check `typeof email === 'string'`, so a JSON body like `{"email":{"$ne":null}}` is passed straight into `findOne`.
- `signup` sits only under the loose limiter (60/15min), so it can be used to email-bomb any address with OTPs.
- **Fix:** Store `otpAttempts` and invalidate the OTP after 5 failures. Hash the OTP (sha256). Type-check every email. Put `strictLimiter` on `/signup`. Trim and lowercase email everywhere.

### 14. Sessions: 7-day JWT, no refresh, no revocation [Both]
- A password reset doesn't invalidate existing tokens, and the reset token is reusable for 15 minutes.
- Every user is force-logged-out exactly 7 days after login.
- The token sits in **unencrypted MMKV** (`src/services/storage.js`).
- **Fix:**
  - Add `tokenVersion` (or `passwordChangedAt`) to User, put it in the JWT, and check it in `protect`. Increment it on password reset.
  - Add a refresh token or sliding expiry.
  - Give MMKV an encryption key kept in the Android Keystore, or store the token with `react-native-keychain`.

### 15. Debt reminder emails can be abused for spam [Backend]
- Users can send emails to any `counterpartyEmail`. The 7-day limit is per debt, so creating many debts gets around it.
- These emails share a sender with your OTP emails. Spam complaints will hurt OTP deliverability and could get the Brevo account suspended.
- **Fix:** Add a per-user daily cap (e.g. 10 reminder emails per day) and an unsubscribe line for recipients.

### 16. Release build can silently point to the dev API [App]
- **Where:** `src/config/env.js`. Any `APP_ENV` other than the two production values falls back to `BASE_URL_DEV` (http), and `IS_DEV` also disables Sentry. Cleartext is blocked in release, so the app would be fully broken with no crash reports.
- Dev, emulator and Railway URLs are also all inlined into the release bundle.
- **Fix:** Base it on `__DEV__`: `const BASE_URL = __DEV__ ? devUrl : PROD_URL` and `IS_DEV = __DEV__`. Fail the build if the release URL isn't https.

### 17. Remove unneeded permissions merged in from notifee [App]
- `SCHEDULE_EXACT_ALARM`, `FOREGROUND_SERVICE` and the notifee `ForegroundService` are merged into the release manifest but never used. The app only uses inexact alarms. They trigger extra Play Console declarations and questions.
- **Fix:** Add `xmlns:tools` to `AndroidManifest.xml` and include:
  ```xml
  <uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" tools:node="remove"/>
  <uses-permission android:name="android.permission.FOREGROUND_SERVICE" tools:node="remove"/>
  <service android:name="app.notifee.core.ForegroundService" tools:node="remove"/>
  ```

### 18. Investment returns job runs in-process on a sleeping server [Backend]
- **Where:** `server.js` → `startReturnChecker()` (`setInterval` every hour).
- **What happens:**
  - While Render sleeps, returns aren't generated.
  - After a long sleep it catches up only one period per run.
  - With 2+ instances, both would create duplicate pending returns.
- **Fix:** Use an always-on instance, plus an external cron (Render Cron Job, GitHub Action or cron-job.org) calling a protected endpoint. Make generation idempotent with a unique `(investmentId, dueDate)` check.

### 19. Safe-to-spend logic gaps [App]
- **Where:** `src/utils/safeToSpend.js`, `src/hooks/useSafeToSpend.js`.
- **Problems:**
  - Debts you owe that are due before payday aren't subtracted.
  - Borrowed money counts as spendable.
  - This month's budget remainder is spread over days that run into next month.
  - The memo has no date dependency, so a card left open overnight shows yesterday's figures and the widget falls back to "Open Paisly to refresh".
- **Fix:**
  - Subtract `upcomingDebts` (type outstanding) due before payday.
  - Cap the budget pool to the days left in the month.
  - Add a `dayKey` state that refreshes on AppState `active` and at midnight.

### 20. CSV export is shared as a text message [App]
- **Where:** `src/components/modals/export/ExportModal.js` → `Share.share({ message: csvData })`.
- **Risk:** A large history goes over Android's ~1MB Binder limit (`TransactionTooLargeException`), and there is never a real `.csv` file.
- **Fix:** Write the CSV to the cache directory (react-native-fs / blob-util) and share the file URI.

### 21. Persisted query cache: no version buster, no page cap [App]
- **Where:** `src/services/queryClient.js` has no `buster`. The infinite transactions list (`src/queries/transactions.js`) is persisted with no `maxPages`.
- **Risk:**
  - After an update that changes the API shape, old cached data can crash the first render.
  - Deep scrolling makes every persist write (JSON.stringify on the JS thread) and every cold-start refetch slower.
- **Fix:** Set `buster: DeviceInfo.getVersion()` and `maxPages: 3`, or keep only page 1 when dehydrating.

### 22. Play Data Safety must declare Sentry Replay and PostHog [App]
- **Where:** `src/services/sentry.js` records 10% of sessions and 100% of error sessions (masked). PostHog captures lifecycle events.
- **Fix:** Declare "App activity", "Diagnostics" and "Device IDs" accurately in Data Safety. For a finance app, consider `replaysSessionSampleRate: 0` and keeping only on-error replay. Disable PostHog in `__DEV__`.

### 23. Lucide icons imported through the barrel file [App] (performance)
- **Where:** 67 files `import { … } from 'lucide-react-native'`. Metro doesn't tree-shake, so all ~3,400 icon modules end up in the 8.4MB bundle.
- **Fix:** Use per-icon imports (`lucide-react-native/icons/<name>`), or a babel transform-imports plugin. This gives a smaller bundle, faster startup and less memory.

### 24. Unbounded list queries [Backend]
- **Where:** `getTransactions` and the debt and investment lists take `limit` straight from the query (`?limit=1000000` works), and a non-numeric `page` or `limit` produces `NaN` skips.
- **Fix:** Clamp the values: `limit = Math.min(Math.max(parseInt(limit) || 20, 1), 100)`.

---

## 🟢 Low / polish

| # | Area | Issue | Fix |
|---|------|-------|-----|
| 25 | App | Notification taps while the app is open or backgrounded do nothing: only `onBackgroundEvent` is registered (`src/services/reminderEvents.js`) | Register `notifee.onForegroundEvent(handleNotificationEvent)` |
| 26 | App | A debt-reminder sync can land after logout and schedule the old user's reminders. Reminders show amounts on the lock screen | Check the session inside the queued task. Set `android.visibility: PRIVATE` |
| 27 | App | The user profile is never refreshed on launch (`fetchMe` is only called from EditProfile), so `hasPassword` and `isGoogleLinked` go stale | Call `fetchMe()` on startup when a token exists |
| 28 | App | Adding several accounts uses `Promise.all`, so a partial failure followed by a retry creates duplicates (`AddAccountModal.js`) | Use a bulk endpoint, or remove the succeeded rows from the form |
| 29 | App | Reminder days set to 0 are overridden to 3 (`parseInt(x) \|\| 3`) | `Number.isFinite(n) ? n : 3` |
| 30 | App | Creating an investment doesn't invalidate `['investments']` | Add the invalidation |
| 31 | App | The bulk-entry parser treats phone numbers as amounts ("jazzcash 03001234567") | Cap the digits and flag `03xxxxxxxxx` |
| 32 | App | `withSentryConfig` is applied twice in `metro.config.js`, which can break source-map matching | Wrap it once |
| 33 | App | Large PNGs: `splashbackground.png` (692KB, decoded on every cold start) and 160–180KB bank logos. `glow.png` and `auth/login.png` are unused | Convert to WebP, downscale the logos, delete the unused files |
| 34 | App | No native `windowBackground` or splash theme, so there's a white or black flash before the JS splash | Set `windowBackground` to the brand colour, or use `core-splashscreen` |
| 35 | App | `react-native-quick-actions@0.3.13` is unmaintained (SDK 25 fallback, `react-native:+`) | Replace it, or test it carefully on Android 14 and 15 |
| 36 | App | API errors are rejected as plain objects, giving Sentry "Non-Error promise rejection" events with no stack | Wrap them in an `ApiError extends Error` |
| 37 | App | Leftover ProGuard keeps for WatermelonDB, Glide and Lottie (unused) | Remove them |
| 38 | Backend | Creating a "lent" debt has no insufficient-balance check, unlike expenses, so the balance can go negative | Make the rules consistent |
| 39 | Backend | 500 responses return the raw `error.message`, which leaks internals | Return a generic message and log the detail |
| 40 | Backend | Money is stored as floating-point `Number`. Decimals are accepted and `remainingAmount -= x` can drift (e.g. 0.30000000000000004) | Round to 2dp on write, or store integer paisa |
| 41 | Backend | `.env` holds unused secrets (Resend, Maileroo, Gmail SMTP). `BREVO_API_KEY` is not in the local `.env` | Remove or rotate the unused ones. Confirm `BREVO_API_KEY` and `NODE_ENV=production` are set on the host |
| 42 | Backend | `investmentController.update` does `Investment.findById(id)` unscoped. It only reads and the update itself is scoped, but it's inconsistent | Add `userId` to the query |
| 43 | Backend | No tests, no structured logging, no request IDs | Add `pino-http`, and integration tests for money paths (create, edit and delete transactions, debt pay and settle, account delete) |
| 44 | Product | Expenses are blocked when an account balance is lower than the amount. Real users' tracked balances drift, so this frustrates logging | Consider allowing negative balances with a warning |

---

## ✅ Checked and fine (no action)

- **Ownership checks:** every backend query is scoped by `userId`. Money mutations use Mongo transactions and revert correctly on edit and delete.
- **Auth hygiene:** helmet, a 1MB body limit, Swagger off in production, `purpose` tokens rejected as access tokens, Google ID token verification with audience, re-authentication required for account deletion, CSV formula-injection guard, regex escaping.
- **Android build:** targetSdk and compileSdk 36, Hermes and new arch on, 16KB page-aligned `.so` files, R8 and shrinkResources on, release signing from the git-ignored `keystore.properties`, `allowBackup="false"`, cleartext off in release, widget receiver not exported.
- **Sentry and PostHog privacy:** `sendDefaultPii: false`, no user identification, replays masked. `transform-remove-console` runs in production.
- **App performance basics:** FlashList with memoized rows, granular zustand selectors, a sensible TanStack `staleTime` and AppState focus manager.
- **Play listing:** account deletion is in the app, privacy, terms and delete-account pages are live, and the feature graphic and 6 screenshots are present.
- **Google Sign-In:** the app code is fine. Make sure the **Play App Signing SHA-1/SHA-256** is registered on the Android OAuth client, or sign-in will fail only in Play-installed builds.

# PaisaPilot Android Implementation Plan

**Goal:** Ship an installable Android test app using the existing website and private profiles.

**Architecture:** Bundle the React/Vite frontend with Capacitor 8. Use native HTTPS requests to the existing production API, retaining its HttpOnly session cookies and CSRF checks. Android's cookie manager owns session persistence; no database credentials or invite code enter the APK.

**Tech stack:** React, TypeScript, Capacitor 8, Android SDK 36, Java 21.

**Spec:** User-approved Android-only plan in this conversation; implementation explicitly authorized on 2026-10-12. Execute directly in this session. This authorization supersedes the planning skill's additional handoff approval.

## Global constraints
- Preserve the website, existing profiles, budget calculations and server authorization.
- First release requires internet. Offline writes, notifications, iOS and Play Store publishing are separate work.
- Application ID: `com.karthik.paisapilot`. Build secrets, SDK paths and APKs stay outside Git.
- Explicit native transport only; do not globally patch fetch or relax browser CORS/CSRF rules.

## Design contract and research
- Compact screens: five stable bottom destinations: Home, History, Budget, Tools, Debts. Keep desktop sidebar.
- Primary flow: create/sign in → choose month → set budget → record expense or money received → see saved balance.
- Make save state, retry and backup accessible on phones. Dark mode and profile controls remain reachable.
- Keep the existing green/cream identity; minimum 48px touch targets, readable form text, safe-area spacing, keyboard-aware dialogs.
- Back closes the current dialog, then returns home. Do not exit with unsaved changes.
- Export uses Android's share sheet; website keeps file downloads.
- Sources: [Material navigation](https://m3.material.io/components/navigation-bar/overview), [Android accessibility](https://developer.android.com/design/ui/mobile/guides/foundations/accessibility), [Capacitor HTTP](https://capacitorjs.com/docs/apis/http), [Android setup](https://capacitorjs.com/docs/getting-started/environment-setup), [App events](https://capacitorjs.com/docs/apis/app), [Share](https://capacitorjs.com/docs/apis/share).

## Review focus
1. Cookie sessions survive process restart and sign-out revokes them.
2. Offline/failed saves remain visible; Back does not discard changes.
3. Small screens, keyboard and system bars do not cover navigation or submit.
4. Android exports work and temporary financial files are cleaned up.
5. Existing browser auth and cross-profile isolation remain intact.

## Task 1: Native runtime and transport
Files: `capacitor.config.ts`, `android/`, `package.json`, `.gitignore`, `src/utils/profileClient.ts`, `scripts/test-mobile.mjs`.
- [x] Install pinned official Capacitor 8 packages and generate Android project.
- [x] Add transport tests covering fixed HTTPS endpoint, Origin, CSRF, HTTP errors and connectivity failures.
- [x] Add native request branch using `CapacitorHttp.request`; preserve browser fetch.
- [x] Disable backups and cleartext traffic; package only built frontend assets.
- [x] Verify native cookie implementation and run auth regression tests.

## Task 2: Mobile interface and lifecycle
Files: `src/components/Navbar.tsx`, `src/App.tsx`, `src/Workspace.tsx`, `src/index.css`, `index.html`, `scripts/test-browser.mjs`.
- [x] Add compact bottom navigation and reachable profile/theme/sign-out controls.
- [x] Add safe-area spacing, larger inputs and touch targets, visible save status.
- [x] Handle Android Back and foreground session checks with cleanup.
- [x] Test narrow/mobile layouts, dark mode, dialogs and navigation with Playwright/axe.

## Task 3: Exports and Android build
Files: `src/utils/exportFile.ts`, its callers in App/TransactionList, `docs/ANDROID.md`, native build scripts.
- [x] Share exports through official Filesystem/Share plugins; handle cancellation/errors and clean temporary files.
- [x] Install local Android toolchain and compile a debug APK.
- [x] Run lint, unit/auth tests, browser tests, dependency audit and Android build.
- [x] Exercise login, saved data and lifecycle on emulator/device when available; document remaining hardware checks.
- [x] Document install/build steps and provide APK path. Review the complete diff before committing.

## Completion evidence

2026-10-13: 29 tests pass; browser/axe and simulated native lifecycle checks pass; debug APK and Android lint pass; app security instrumentation passes on Android 16/API 36; live emulator registration, money tracking, native Back/share, process-restart session persistence and profile deletion pass. Disposable cloud test profiles are removed. Physical-phone delivery and release signing remain separate checks, documented in `docs/ANDROID.md`.

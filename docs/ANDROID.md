# PaisaPilot for Android

The Android app bundles this repository's React frontend with Capacitor 8. It uses the same private profiles and financial records as [the website](https://paisa-pilot-umber.vercel.app/). Application ID: `com.karthik.paisapilot`. Minimum Android version: Android 7 / API 24; target and compile SDK: 36.

## Build and install a test APK

Requirements: Node.js 24, Java **21**, Android SDK Platform 36, Build Tools 35.0.0 (the Android Gradle Plugin's default) and Platform Tools. Install them through Android Studio / SDK Manager. Recent Android Studio versions may bundle Java 25: select Java 21 for this project's Gradle JVM instead.

```powershell
npm ci --ignore-scripts
npm test
npm run lint
npm run test:browser
npm run android:build
```

`android:build` builds the website, syncs native plugins/assets, runs Gradle `assembleDebug lintDebug`, and copies the result to `artifacts/PaisaPilot-debug.apk`. The script detects the standard Windows Temurin 21 and Android SDK installation paths. On other setups, set `JAVA_HOME` and `ANDROID_HOME` explicitly. `npm run android:open` opens the native project in Android Studio.

Copy the APK to your phone, open it and allow installation from that source when Android asks. Alternatively, enable USB debugging, authorize your computer and run:

```powershell
adb install -r artifacts/PaisaPilot-debug.apk
```

This is a **debug build for testing**, signed with the local Android debug key. Before public distribution, create and back up an owner-controlled release signing key and build a signed release. Never commit the key or passwords. Play Store publication is separate work.

## Screens and flow

1. Enter the owner's six-digit invite and sign in, or choose **Create a profile** for a new username.
2. **Home:** choose the month; inspect balance, daily allowance, priorities and notes.
3. **Budget:** set starting pocket money and your own category allocations.
4. **Add expense / Add money received:** enter amount, category, date and note. Receipts increase that month's available budget.
5. **History:** review records, filter and export CSV. **Tools:** calculators. **Debts:** lend, borrow and repayments.
6. Use the top-right options for settings, alerts, sound and sign-out. Theme has its own button.

The bottom navigation stays in reach on phones. Desktop keeps its sidebar. Android Back closes a dialog/options, returns from another destination to Home, then minimizes the app when records are saved. Failed/pending saves prevent this last step. Android's Home gesture and OS process termination cannot be blocked.

## Data, sessions and networking

- Internet is required to sign in, load records and save. There is no offline database or guaranteed draft recovery. Wait for **Saved to your profile** before closing. If saving fails, retry or export a backup.
- Native HTTPS uses the fixed production host in `src/utils/profileClient.ts`. No database URL, invite code, session secret or password is packaged into the APK. The website still uses same-origin fetch.
- Capacitor's Android HTTP transport owns the cookie jar. Existing seven-day HttpOnly/Secure sessions and server CSRF, invite, rate-limit and per-profile checks are reused. Redirects are disabled. No wildcard CORS or alternate authentication bypass is added.
- Native networking supplies the canonical website Origin header. Origin is browser CSRF defense, not proof of app identity; the server still requires credentials and a valid session.
- Android app backup/device transfer is disabled for private storage. Cleartext HTTP and mixed content are disabled. Capacitor bridge logging is disabled, including debug builds, because its built-in logs can contain cookie values.
- Browser saves and app saves share optimistic revisions. If another device changed your profile, export pending edits before reloading/signing in again. Conflicting data is never silently overwritten.
- Exports use Android's share sheet. Temporary files remain in the app's private cache so the receiving app can read them; exports older than 24 hours are cleaned on a later app start/export. Files you choose to save/share elsewhere are your own copies.

## Verification

`npm test` covers finance, account isolation, server protection, mobile transport and export lifetime. `npm run test:browser` runs the website and compact layouts through Playwright/axe, plus a simulated Capacitor bridge to test Back and pending-save behavior. The simulation does not replace Android runtime testing.

With an emulator/device attached, run `./gradlew :app:connectedDebugAndroidTest` from `android/` with Java 21/SDK environment configured (`.\gradlew.bat` on Windows). `AppSecurityTest` verifies the installed package, cleartext policy and backup flags. Target the app module: the unqualified command also builds unused upstream plugin test suites.

The live emulator smoke test is opt-in. Install the current debug APK on a dedicated emulator, then run from the repository root:

```powershell
$env:PAISAPILOT_LIVE_ANDROID_TEST='1'
node scripts/test-android-device.mjs
```

It needs the owner's local `.env.local` with `DATABASE_URL` and `INVITE_CODE`. It creates a random disposable profile, exercises the real production HTTPS API through the app, and deletes only that test profile in cleanup. It never uses existing personal records. Do not run it on someone else's emulator session.

Verified on 2026-10-13: 29 unit/auth/mobile tests; browser and compact-layout accessibility checks; Android debug build and lint; one installed-package security test; Android 16/API 36 emulator signup, budget/receipt/expense saves, correct balance, dark system bars, Back, backup share-sheet open/cancel, force-stop session/data persistence, HttpOnly cookie protection and profile deletion. Dependency audit reported zero known vulnerabilities. Android app lint has six non-blocking warnings, mainly upstream version notices and generated resource references.

Startup connection recovery is covered for website and native transport. On the real emulator, disabling Wi-Fi/data reproduced the unavailable screen; restoring connectivity and choosing **Try again** correctly opened sign-in and cleared the old error.

Before wider distribution, check on a physical phone: sign-out/sign-in, keyboard and cutouts, gesture and three-button navigation, JSON/CSV delivery to a receiving app, and airplane-mode save failure/recovery. Password recovery, offline writes, reminders, biometrics, iOS and Play Store submission are outside this first release.

## Design and dependency decisions

The compact layout follows [Material navigation guidance](https://m3.material.io/components/navigation-bar/overview): stable destinations with icons and short labels. Controls use [Android's accessibility guidance](https://developer.android.com/design/ui/mobile/guides/foundations/accessibility), including 48px minimum touch targets for primary controls. The existing green palette and financial hierarchy remain.

Native integrations use official Capacitor [HTTP](https://capacitorjs.com/docs/apis/http), [App](https://capacitorjs.com/docs/apis/app), [System Bars](https://capacitorjs.com/docs/apis/system-bars), [Filesystem](https://capacitorjs.com/docs/apis/filesystem) and [Share](https://capacitorjs.com/docs/apis/share) APIs.

The small local `AppAppearance` bridge updates Android's window background to match the selected theme. Capacitor uses native margins on older WebViews; their background otherwise stays light even when system icons turn white. It follows Capacitor's [custom Android plugin pattern](https://capacitorjs.com/docs/android/custom-code), with only two accepted theme values and no extra permissions.

Capacitor CLI's unused iOS parser depends on an old UUID package. The scoped `xcode → uuid@11.1.1` override applies the [upstream security fix](https://github.com/uuidjs/uuid/releases/tag/v11.1.1) while retaining CommonJS and the parser's v4 API. Remove the override when the upstream CLI/parser adopts a patched version. No iOS project is generated.

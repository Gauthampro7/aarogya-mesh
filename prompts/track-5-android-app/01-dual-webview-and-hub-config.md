# T5-01 — Native Android APK Dual-WebView State & Hub URL Config

- **Task ID**: `T5-01`
- **Track & Owner**: Track 5 — `apps/android-app/` Native Android Shell (**Core `@Gauthampro7`**)
- **Difficulty**: Hard / Native Android WebView & Packaging
- **Branch**: `feat/android-dual-webview-and-hub-config`
- **Allowed Paths**:
  - `apps/android-app/src/com/aarogyamesh/app/MainActivity.java`
  - `apps/android-app/src/com/aarogyamesh/app/LocalAssetServer.java`
  - `apps/android-app/res/values/strings.xml` (if needed)
  - `apps/android-app/README.md` (if updating build/config docs)
  - `apps/android-app/dist/aarogya-mesh.apk` (rebuilt via `./build_apk.sh`)
- **Forbidden Paths**: `packages/`, `services/`, `apps/field-pwa/`, `apps/watch-companion/`, root `pyproject.toml`
- **Depends On**: Existing `apps/android-app/` native shell on `main` (and ideally rebuilt with `REBUILD_WEB=1` once `T2-04`/`T2-05`/`T3-05`/`T3-06` land for final demo APK)

---

## Copy-Paste Starter Prompt

```text
You are working on Aarogya Mesh (`/home/gautham/Personal/Gautham/Hackathon/1/aarogya-mesh`), Task T5-01.
First read `AGENTS.md`, `apps/android-app/src/com/aarogyamesh/app/MainActivity.java`, `apps/android-app/src/com/aarogyamesh/app/LocalAssetServer.java`, and `apps/android-app/build_apk.sh`.

Goal: Upgrade the native Android shell (`com.aarogyamesh.app`) so switching between `ASHA Field` (`/phone/`) and `Watch / SOS` (`/watch/`) preserves all live state with zero reloads, stop clobbering user Hub URL settings on every page load, add a native "Set Hub URL" dialog, modernize back navigation, and keep the APK slim and 100% offline-first.

CRITICAL INVARIANTS:
1. ALLOWED PATHS ONLY: Touch ONLY files inside `apps/android-app/`. Do NOT edit `packages/`, `services/`, `apps/field-pwa/`, or `apps/watch-companion/`.
2. JAVA 8 SOURCE/TARGET COMPATIBILITY: `build_apk.sh` compiles with `javac -parameters -source 8 -target 8` against `android-34/android.jar` and `d8 --min-api 26` with ZERO AndroidX/Gradle dependencies. Use pure `android.*` framework APIs only (`AlertDialog`, `EditText`, `FrameLayout`, `SharedPreferences`, `OnBackInvokedCallback` guarded by `Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU`).
3. PRESERVE `AarogyaNativeBridge` CONTRACT: Keep every existing `@JavascriptInterface` method on `window.AarogyaNativeBridge` (`getBatteryPercent`, `isCharging`, `getTotalRamMb`, `getAvailableRamMb`, `getCpuCores`, `isOnline`, `getNetworkType`, `vibrateEmergency`, `vibratePulse`, `dialEmergency`, `switchMode`, `getDefaultHubUrl`, `getActiveMode`, `showToast`, `getDeviceInfoJson`) backwards-compatible and attached to BOTH WebViews.
4. PURE SHUDDH TATSAMA HINDI: If displaying Hindi labels in the native top bar / dialog, use pure *Shuddh Tatsama* Hindi with zero Perso-Arabic/Hinglish/nukta (e.g., `"आशा क्षेत्र"`, `"घटिका / आपात"`, `"मुख्य केन्द्र पता"`).
5. SECURE CONTEXT LOOPBACK: Keep `LocalAssetServer` bound strictly to `127.0.0.1` (preferred port `49842`) so IndexedDB, `crypto.randomUUID()`, Service Workers, and `getUserMedia()` microphone capture work offline on Android.

Exact 4 Changes to Implement:
1. Dual Persistent WebViews (`MainActivity.java`):
   - Replace single `WebView webView` with `FrameLayout webContainer` holding two persistent instances: `phoneWebView` (loaded once with `assetServer.getBaseUrl() + "/phone/"`) and `watchWebView` (loaded once on first visit or at startup with `assetServer.getBaseUrl() + "/watch/"`).
   - Switching `ASHA Field ↔ Watch / SOS` (via top bar tabs or `AarogyaNativeBridge.switchMode(mode)`) strictly toggles `View.VISIBLE` / `View.GONE` (plus `onResume()`/`onPause()` focus hygiene) — NEVER calling `loadUrl(...)` again so unsaved triage forms, partial checklists, and active voice recordings survive mode switches untouched!
   - Clean up BOTH WebViews safely in `onDestroy()` (`removeJavascriptInterface`, `stopLoading`, `destroy`).
2. Stop Clobbering Hub URL + Native "Set Hub URL" Dialog (`MainActivity.java` & `LocalAssetServer.java`):
   - Remove `HUB_PRESEED_SCRIPT` HTML injection in `LocalAssetServer.java` and remove `seedDefaultHubUrlIfUnset(view)` from `onPageFinished(...)` in `MainActivity.java` so `clearHubUrl()` and custom Wi-Fi subnets are NEVER overwritten on reload.
   - Store the configured Hub URL in Android `SharedPreferences` (defaulting to `""` / optional user value, with `LocalAssetServer.DEFAULT_HUB_URL` shown only as a quick hint/placeholder in the dialog).
   - Tapping `telemetryBadge` in the native top bar opens a native `AlertDialog` showing device telemetry + an `EditText` for the PHC Hub LAN URL (`http://<hub-ip>:8000`) with **Save**, **Clear**, and **Cancel** buttons. On Save/Clear, persist to `SharedPreferences` and update `localStorage` (`aarogya.hubUrl` and `aarogya.watch.hubUrl`) in both active WebViews cleanly via `evaluateJavascript` (removing the keys on Clear).
3. Slim Top Bar, Back Navigation & Dead Shell Cleanup (`MainActivity.java` & `LocalAssetServer.java`):
   - Slim the top bar vertical padding (`padV = dp(4)`), show compact mode pills + tappable telemetry/hub pill, and keep clean high-contrast slate/teal styling.
   - Replace deprecated `onBackPressed()` with `OnBackInvokedCallback` on API 33+ (`Build.VERSION_CODES.TIRAMISU`) plus a clean fallback for API 26–32 that delegates `canGoBack()` / `goBack()` strictly to the currently visible WebView (`activeWebView()`) before `moveTaskToBack(true)`.
   - Remove the unused duplicate `LANDING_SHELL_HTML` iframe shell from `LocalAssetServer.java` and redirect `/` and `/index.html` cleanly to `/phone/`.
4. Build & Verify Signed APK:
   - Run `cd apps/android-app && ./build_apk.sh` and verify `apksigner verify --verbose --print-certs dist/aarogya-mesh.apk` succeeds with zero javac errors or d8 crashes.
```

---

## Step-by-Step Checklist

1. Refactor `MainActivity.java` to hold `phoneWebView` and `watchWebView` inside a `FrameLayout`, toggling `View.VISIBLE`/`View.GONE` without reloading on tab switch.
2. Remove `HUB_PRESEED_SCRIPT` from `LocalAssetServer.java` (and replace `LANDING_SHELL_HTML` with a redirect `/` -> `/phone/`) and remove `seedDefaultHubUrlIfUnset` from `onPageFinished` in `MainActivity.java`.
3. Add a `SharedPreferences`-backed native **"Set Hub URL"** `AlertDialog` on `telemetryBadge` tap (Save / Clear / Cancel) that updates `aarogya.hubUrl` and `aarogya.watch.hubUrl` across both WebViews on explicit user action only.
4. Slim the native top bar and wire API 33+ `OnBackInvokedCallback` (with API 26–32 fallback) delegating back navigation to the active WebView.
5. Rebuild via `cd apps/android-app && ./build_apk.sh` and verify the signed APK.

---

## Verification Commands & Definition of Done

```bash
cd apps/android-app
./build_apk.sh

# Verify APK signature & metadata explicitly
"${ANDROID_BUILD_TOOLS:-$HOME/.local/share/android-sdk/build-tools/34.0.0}/apksigner" \
  verify --verbose --print-certs dist/aarogya-mesh.apk

# Confirm repo checks stay green
cd ../..
make verify
```

- [ ] Switching `ASHA Field ↔ Watch / SOS` toggles two persistent WebViews (`VISIBLE`/`GONE`) with zero page reloads or lost form state.
- [ ] Hardcoded `192.168.1.14:8000` is NEVER forced back into `localStorage` on `onPageFinished`; native `AlertDialog` sets or clears Hub URL cleanly across both WebViews.
- [ ] API 33+ `OnBackInvokedCallback` + per-WebView back stack handling works with zero deprecated `onBackPressed` warnings on modern Android.
- [ ] `./build_apk.sh` succeeds cleanly and `apksigner verify` passes 100%.

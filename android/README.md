# TV box app (legacy Android)

`PointSteakhouse-tvbox.apk` — a minimal WebView wrapper around the dashboard
mockup, built for old Android TV boxes (tested against Android 7.1.2 /
kernel 3.14 class hardware) where the system browser can't run modern JS.
It launches straight into `Main.tvbox.html` (see the root `README.md`'s "TV
box (legacy Android) build" section) bundled as offline assets — no browser,
no URL, no network required.

- Package: `com.pointsteakhouse.dashboard`
- `minSdk`/`targetSdk`: 25 (Android 7.1)
- Signing: debug-signed only (fine for sideloading; not for Play Store)

## Installing on the box

Copy the `.apk` to the box (USB drive, or `adb install PointSteakhouse-tvbox.apk`
if it has USB debugging/ADB over network enabled) and install it through a
file manager, or via `adb install`. Most of these boxes need "install from
unknown sources" enabled for their file manager app.

## Rebuilding

The `PointSteakhouseApp/` folder is the full Gradle project (assets already
bundled under `app/src/main/assets/`, copied from the repo root's
`Main.tvbox.html`, `support.legacy.js`, `vendor/*.legacy.js`,
`vendor/react*.js`). If those files change, re-copy them into
`PointSteakhouseApp/app/src/main/assets/` and rebuild:

```
cd PointSteakhouseApp
./gradlew assembleDebug
```

Output lands at `app/build/outputs/apk/debug/app-debug.apk`. Requires a JDK
and the Android SDK (the Gradle wrapper downloads Gradle itself on first
run; `sdk.dir` in `local.properties`, which is gitignored, must point at an
installed Android SDK with platform 36 + build-tools 36 available).

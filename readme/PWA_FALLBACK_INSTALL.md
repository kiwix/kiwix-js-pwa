Installing the Kiwix JS PWA When the Install Event Is Not Supported

Some browsers do not support the beforeinstallprompt event, or they intentionally suppress it for security or UX reasons. As a result, the automatic Install App prompt may not appear.

However, the Kiwix JS PWA can still be installed manually on all major platforms. This document explains how to install or “Add to Home Screen” when the install event does not fire.

🟦 Why the Install Prompt May Not Appear

The following situations prevent the normal PWA install prompt:

-> Safari on iOS/iPadOS: does not support beforeinstallprompt at all

-> Firefox on Android: PWA install UI exists, but does not use the install event

-> Firefox on desktop: install support varies by version

-> Vivaldi (Chromium-based): suppresses PWA installation for security reasons

-> Custom Chromium builds: may disable install event or treat PWAs differently

Even in these cases, the PWA can still be installed manually through the browser’s built-in menu.

📱 Android (Chrome, Edge, Brave, Firefox, Vivaldi)
Chromium browsers (Chrome / Edge / Brave / Samsung Internet)

These browsers normally support the install event, but if it does not appear:

1. Open https://pwa.kiwix.org

2. Tap the menu (⋮) icon

3. Choose Add to Home screen or Install App

4. Confirm installation

Firefox for Android

Firefox does NOT support the install event, but PWAs still work:

1. Open Kiwix JS

2. Tap the menu (⋮)

3. Tap Add to Home screen

The PWA will install and open in a standalone window.

Vivaldi (Android)

Vivaldi suppresses the install event:

1. Open the browser menu

2. Tap Add to Home screen

(Works like other Chromium browsers but without the install prompt.)

🍎 iPhone / iPad (Safari)

Safari does not support the install event.
Manual installation is required:

1. Open https://pwa.kiwix.org
 in Safari

2. Tap the Share icon

3. Scroll down and tap Add to Home Screen

4. Tap Add

The PWA will launch without browser UI and works offline.

💻 Desktop (Windows, macOS, Linux – Chrome, Edge, Brave)

Even if beforeinstallprompt is not triggered, Chromium browsers allow installation manually:

Chrome / Brave:

1. Open Kiwix PWA

2. Click the Install icon in the address bar

3. Confirm

Edge:

1. Open Kiwix PWA

2. Click Apps in the toolbar

3. Select Install this site as an app

Firefox (Windows/macOS/Linux):

Firefox does not use the install event.

-> In versions ≥ 143 (Windows): click the Add to taskbar icon in the URL bar

-> In other versions: PWAs cannot be installed but still work offline in a tab

🐧 Linux (Chrome, Chromium, Edge)

1. Open the PWA

2. Click the install icon (computer with arrow) in the URL bar

3. Confirm installation

Installed PWAs appear in the application launcher.

🪟 Windows (Chrome / Edge)

1. Same behavior as desktop:

2. Open the PWA

3. Click the Install App icon

4. Confirm installation

The app appears in Start Menu and can be pinned to taskbar
# Installing the Kiwix JS PWA When the Install Event Is Not Supported

Some browsers do not support the `beforeinstallprompt` event, or intentionally suppress it for security or UX reasons.  
As a result, the automatic **Install App** prompt may not appear.

However, the Kiwix JS PWA can still be installed manually on all major platforms.  
This document explains how to install or “Add to Home Screen” when the install event does not fire.


## Why the Install Prompt May Not Appear

The install prompt may not show in the following cases:

- **Safari on iOS/iPadOS** — does not support `beforeinstallprompt` at all  
- **Firefox on Android** — has PWA support but does not use the install event  
- **Firefox on Desktop** — installation support varies by version  
- **Vivaldi (Chromium-based)** — suppresses PWA installation for security reasons  
- **Custom Chromium builds** — may disable or modify install event behavior  

Even in these cases, the PWA can still be installed manually through the browser’s menu.


## Android (Chrome, Edge, Brave, Firefox, Vivaldi)

### Chromium Browsers (Chrome / Edge / Brave / Samsung Internet)

These browsers normally support the install event, but if the prompt does not appear:

1. Open **https://pwa.kiwix.org**
2. Tap the menu (⋮) icon
3. Select **Add to Home screen** or **Install App**
4. Confirm installation

### Firefox for Android

Firefox does not support the install event, but PWAs can still be installed:

1. Open the Kiwix PWA
2. Tap the menu (⋮)
3. Tap **Add to Home screen**

The PWA will open in a standalone window.

### Vivaldi (Android)

Vivaldi suppresses the install event:

1. Open the browser menu
2. Tap **Add to Home screen**


## iPhone / iPad (Safari)

Safari does not support the install event, so installation is manual:

1. Open **https://pwa.kiwix.org** in Safari
2. Tap the **Share** icon
3. Scroll and select **Add to Home Screen**
4. Tap **Add**

The PWA opens without browser UI and works offline.


## Desktop Browsers (Windows, macOS, Linux)

### Chrome / Brave

1. Open the Kiwix PWA
2. Click the **Install** icon in the address bar
3. Confirm

### Microsoft Edge

1. Open the PWA
2. Click **Apps** in the toolbar
3. Select **Install this site as an app**

### Firefox (Windows, macOS, Linux)

Firefox does not use the install event:

- **Firefox ≥ 143 (Windows):** Click the **Add to taskbar** icon in the URL bar  
- **Other versions:** PWAs cannot be installed but still work offline in a tab


## Linux (Chrome, Chromium, Edge)

1. Open the PWA
2. Click the install icon (computer-with-arrow) in the URL bar
3. Confirm installation

Installed PWAs appear in the system application launcher.


## Windows (Chrome / Edge)

Same behavior as other desktop Chromium browsers:

1. Open the PWA
2. Click the **Install App** icon
3. Confirm

The PWA will appear in the Start Menu and can be pinned to the taskbar.


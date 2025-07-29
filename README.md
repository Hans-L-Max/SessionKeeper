# Session Keeper for Firefox & Chrome 🦊/🤖

Never get logged out automatically again! This addon keeps your sessions active.

**Session Keeper** is a lightweight browser extension for **Firefox and Chrome** designed to prevent session timeouts. It keeps your session active by automatically performing an action on a specific tab at a user-defined interval. This is useful for web applications that log you out after a short period of inactivity.


<br>

[► **Get for Firefox**](PASTE-YOUR-FIREFOX-STORE-LINK-HERE) | [► **Get for Chrome**](PASTE-YOUR-CHROME-STORE-LINK-HERE)

<br>

---

## ✨ Features

* **Cross-Browser:** Works seamlessly on both Firefox and Chrome.

* **Simple UI:** An easy-to-use popup interface to start and stop the addon's activity on the active tab.

* **Clear Status:** The icon is **green** with an **'ON' badge** when active and **gray** when inactive. You always know what's happening at a glance.

* **Two Flexible Modes:** Choose between a full **page reload** or just **clicking a specific element** (like a "refresh" button). Perfect for modern web apps.

* **Smart & Reliable:** Uses modern browser APIs (`alarms`) for reliable, battery-efficient execution.

* **Saves Your Settings:** The addon remembers your last used mode and interval.

---

## 🚀 How to Use

1.  Go to the website you want to keep active.
2.  Click the **Session Keeper icon** in your browser's toolbar.
3.  Choose your desired **Mode**.
        - **Reload Tab:** Simply reloads the page.
        - **Click Element(s):** Allows you to specify one or more elements to be clicked.
4.  If using "Click Element(s)":
        - You must provide one or more **CSS selectors** for the elements you want to click, separated by commas.
        - **To find a CSS selector:** Right-click the element on the page → `Inspect` → In the developer tools, right-click the highlighted HTML code → `Copy` → `CSS Selector`.
        - *Example:* `.btn-refresh, #user-menu`

5.  Set the **Interval** in minutes (e.g., `5` for 5 minutes).
6.  Click **Start**.

That's it! The icon will show you it's working. ✅

---

### 🛠️ For Developers: Manual Installation

If you want to install the addon from the source code:

1.  Download the project as a ZIP file and unzip it into a folder.
2.  **For Firefox:**
    *   Open Firefox and go to `about:debugging`.
    *   Click on "This Firefox", then "Load Temporary Add-on...".
    *   Select the `manifest.json` file from the project folder.
3.  **For Chrome:**
    *   Open Chrome and go to `chrome://extensions`.
    *   Enable "Developer mode" in the top right corner.
    *   Click "Load unpacked" and select the project folder.
// Polyfill to use the 'browser' namespace on both Chrome and Firefox.
const browser = self.browser || self.chrome;

const ALARM_NAME = 'session-keeper-alarm';

/**
 * Updates the browser action icon, title, and badge based on the active state.
 * @param {boolean} active - Whether the addon is currently active.
 */
async function updateVisualState(active = false) {
  const state = active
    ? {
        path: { "48": "icons/icon-active-48.png" },
        title: "Session Keeper (Active)",
        badgeText: 'ON',
        badgeColor: '#28a745'
      }
    : {
        path: { "48": "icons/icon-inactive-48.png" },
        title: "Session Keeper (Inactive)",
        badgeText: '',
        badgeColor: null
      };

  await browser.action.setIcon({ path: state.path });
  await browser.action.setTitle({ title: state.title });
  await browser.action.setBadgeText({ text: state.badgeText });
  if (state.badgeColor) {
    try {
      await browser.action.setBadgeBackgroundColor({ color: state.badgeColor });
    } catch (e) {
      // Firefox MV3 might throw an error here. We can safely ignore it.
      // See: https://bugzilla.mozilla.org/show_bug.cgi?id=1774708
    }
  }
}

/**
 * Stops the currently running alarm and updates the visual state to inactive.
 */
async function stopAction() {
  await browser.alarms.clear(ALARM_NAME);
  await browser.storage.local.set({ isActive: false });
  await updateVisualState(false);
}

/**
 * Performs the configured action (reload or click).
 */
async function performAction() {
  const { config } = await browser.storage.local.get('config');
  if (!config) {
    await stopAction();
    return;
  }

  const [activeTab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!activeTab) return;

  if (config.mode === 'reload') {
    // Perform a clean navigation to the current URL to avoid form resubmission warnings.
    await browser.tabs.update(activeTab.id, { url: activeTab.url });
  } else if (config.mode === 'click') {
    try {
      await browser.tabs.sendMessage(activeTab.id, {
        action: 'clickElements',
        selectors: config.selectors,
      });
    } catch (error) {
      console.error("Could not send message to content script. Is the tab protected or the content script injected?", error);
    }
  }
}

// Listener for the alarm.
browser.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_NAME) {
    await performAction();
    // Re-create the alarm for the next interval, as Firefox doesn't support sub-minute periodic alarms.
    const { config } = await browser.storage.local.get('config');
    if (config && config.interval) {
        const delayInMinutes = config.interval / 60;
        browser.alarms.create(ALARM_NAME, { delayInMinutes });
    }
  }
});

// Set the initial state to inactive when the extension is installed or the browser starts.
browser.runtime.onInstalled.addListener(() => {
  stopAction();
});
browser.runtime.onStartup.addListener(() => {
  stopAction();
});

// Listen for messages from the popup script.
browser.runtime.onMessage.addListener(async (request) => {
  if (request.action === 'start') {
    const config = {
      mode: request.mode,
      selectors: request.selectors,
      interval: request.interval // Interval is in seconds
    };

    await browser.storage.local.set({ isActive: true, config });
    
    // Convert seconds to minutes for the alarm API. Fractional values are allowed.
    const delayInMinutes = config.interval / 60;
    
    await browser.alarms.create(ALARM_NAME, {
      delayInMinutes: delayInMinutes
    });
    await updateVisualState(true);

  } else if (request.action === 'stop') {
    await stopAction();
  }
});
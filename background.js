/**
 * Filename: background.js
 * Description: Background service worker for Session Keeper extension handling alarms and tab actions.
 * Copyright © 2025 Hans-L-Max
 * License: MIT
 */

/**
 * Browser API polyfill for cross-browser compatibility
 * @type {object}
 */
const browser = self.browser || self.chrome;

/**
 * Alarm name constant for session keeper functionality
 * @type {string}
 */
const ALARM_NAME = 'session-keeper-alarm';

/**
 * Updates the browser action icon, title, and badge based on the active state.
 * @param {boolean} [active=false] - Whether the addon is currently active.
 * @returns {Promise<void>}
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

  try {
    await browser.action.setIcon({ path: state.path });
    await browser.action.setTitle({ title: state.title });
    await browser.action.setBadgeText({ text: state.badgeText });
    
    if (state.badgeColor) {
      await browser.action.setBadgeBackgroundColor({ color: state.badgeColor });
    }
  } catch (error) {
    // Firefox MV3 might throw an error for badge color. Safe to ignore.
    console.warn('Failed to update visual state:', error);
  }
}

/**
 * Stops the currently running alarm and updates the visual state to inactive.
 * @returns {Promise<void>}
 */
async function stopAction() {
  try {
    await browser.alarms.clear(ALARM_NAME);
    await browser.storage.local.set({ isActive: false });
    await updateVisualState(false);
  } catch (error) {
    console.error('Failed to stop action:', error);
  }
}

/**
 * Performs the configured action (reload or click) on the active tab.
 * @returns {Promise<void>}
 */
async function performAction() {
  try {
    const { config } = await browser.storage.local.get('config');
    if (!config) {
      await stopAction();
      return;
    }

    const [activeTab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (!activeTab) {
      console.warn('No active tab found');
      return;
    }

    if (config.mode === 'reload') {
      // Perform a clean navigation to avoid form resubmission warnings
      await browser.tabs.update(activeTab.id, { url: activeTab.url });
    } else if (config.mode === 'click') {
      await browser.tabs.sendMessage(activeTab.id, {
        action: 'clickElements',
        selectors: config.selectors,
      });
    }
  } catch (error) {
    console.error('Failed to perform action:', error);
  }
}

/**
 * Handles alarm events and reschedules the next alarm.
 * @param {chrome.alarms.Alarm} alarm - The triggered alarm object.
 * @returns {Promise<void>}
 */
async function handleAlarm(alarm) {
  if (alarm.name === ALARM_NAME) {
    await performAction();
    
    // Re-create alarm for next interval (Firefox compatibility)
    try {
      const { config } = await browser.storage.local.get('config');
      if (config?.interval) {
        const delayInMinutes = config.interval / 60;
        await browser.alarms.create(ALARM_NAME, { delayInMinutes });
      }
    } catch (error) {
      console.error('Failed to reschedule alarm:', error);
    }
  }
}

/**
 * Handles messages from popup and other extension components.
 * @param {object} request - The message request object.
 * @returns {Promise<void>}
 */
async function handleMessage(request) {
  try {
    if (request.action === 'start') {
      const config = {
        mode: request.mode,
        selectors: request.selectors,
        interval: request.interval
      };

      await browser.storage.local.set({ isActive: true, config });
      
      const delayInMinutes = config.interval / 60;
      await browser.alarms.create(ALARM_NAME, { delayInMinutes });
      await updateVisualState(true);

    } else if (request.action === 'stop') {
      await stopAction();
    }
  } catch (error) {
    console.error('Failed to handle message:', error);
  }
}

// Event listeners
browser.alarms.onAlarm.addListener(handleAlarm);
browser.runtime.onMessage.addListener(handleMessage);

// Initialize extension state
browser.runtime.onInstalled.addListener(() => stopAction());
browser.runtime.onStartup.addListener(() => stopAction());
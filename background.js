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
 * Simple hash function for strings.
 * @param {string} str The string to hash.
 * @returns {number} A 32-bit integer hash.
 */
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

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
    await browser.storage.local.set({ isActive: false, contentHashes: {} });
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
    const { config, contentHashes = {} } = await browser.storage.local.get(['config', 'contentHashes']);
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
      await browser.tabs.update(activeTab.id, { url: activeTab.url });
    } else if (config.mode === 'click') {
      await browser.tabs.sendMessage(activeTab.id, {
        action: 'clickElements',
        selectors: config.selectors,
      });
    }

    // Check for content changes if enabled
    if (config.notifyOnChange || config.stopOnChange) {
      setTimeout(async () => {
        try {
          const results = await browser.scripting.executeScript({
            target: { tabId: activeTab.id },
            func: () => document.body.innerText,
          });

          if (results && results[0] && results[0].result) {
            const newHash = simpleHash(results[0].result);
            const oldHash = contentHashes[activeTab.id];

            if (oldHash !== undefined && newHash !== oldHash) {
              // Notify if enabled
              if (config.notifyOnChange) {
                browser.notifications.create({
                  type: 'basic',
                  iconUrl: 'icons/icon-active-96.png',
                  title: 'Session Keeper: Content Changed',
                  message: `The content on "${activeTab.title}" has changed.`,
                });
              }

              // Stop session keeper if enabled
              if (config.stopOnChange) {
                await stopAction();
                browser.notifications.create({
                  type: 'basic',
                  iconUrl: 'icons/icon-inactive-48.png',
                  title: 'Session Keeper: Stopped',
                  message: `Session Keeper stopped due to content change on "${activeTab.title}".`,
                });
                return; // Exit early, don't update hash
              }
            }
            contentHashes[activeTab.id] = newHash;
            await browser.storage.local.set({ contentHashes });
          }
        } catch (e) {
          console.warn('Could not check for content changes. The tab might have been closed or navigated away.', e);
        }
      }, 2000); // 2-second delay
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
        interval: request.interval,
        notifyOnChange: request.notifyOnChange,
        stopOnChange: request.stopOnChange
      };

      await browser.storage.local.set({ isActive: true, config, contentHashes: {} });
      
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
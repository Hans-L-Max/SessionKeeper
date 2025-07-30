/**
 * Filename: content.js
 * Description: Content script for Session Keeper extension handling element clicks on web pages.
 * Copyright © 2025 Hans-L-Max
 * License: MIT
 */

/**
 * Handles clicking elements based on provided CSS selectors.
 * @param {string[]} selectors - Array of CSS selectors to click.
 * @returns {void}
 */
function clickElements(selectors) {
  if (!Array.isArray(selectors) || selectors.length === 0) {
    console.warn('Session Keeper: No valid selectors provided');
    return;
  }

  selectors.forEach(selector => {
    try {
      const element = document.querySelector(selector);
      if (element) {
        console.log('Session Keeper: Clicking element ->', selector);
        const clickEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window
        });
        element.dispatchEvent(clickEvent);
      } else {
        console.warn('Session Keeper: Element not found for selector ->', selector);
      }
    } catch (error) {
      console.error('Session Keeper: Error clicking element with selector', selector, error);
    }
  });
}

/**
 * Handles messages from the background script.
 * @param {object} request - The message request object.
 * @param {chrome.runtime.MessageSender} sender - The message sender.
 * @param {function} sendResponse - Function to send response back.
 * @returns {void}
 */
function handleMessage(request, sender, sendResponse) {
  if (request.action === 'clickElements') {
    clickElements(request.selectors);
  }
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener(handleMessage);
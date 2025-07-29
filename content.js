// Listen for messages from the background script.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Check if the requested action is to click elements.
  if (request.action === 'clickElements') {
    if (!request.selectors || request.selectors.length === 0) {
      return; // Do nothing if no selectors are provided.
    }

    // Iterate through each selector provided and click the corresponding element.
    request.selectors.forEach(selector => {
      const element = document.querySelector(selector);
      if (element && typeof element.click === 'function') {
        console.log('Session Keeper: Clicking element ->', selector);
        element.click();
      } else {
        console.warn('Session Keeper: Element not found or not clickable for selector ->', selector);
      }
    });
  }
});
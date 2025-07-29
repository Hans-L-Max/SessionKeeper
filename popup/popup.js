// Polyfill to use the 'browser' namespace on both Chrome and Firefox.
const browser = window.browser || window.chrome;

document.addEventListener('DOMContentLoaded', () => {
  // Get references to all UI elements
  const statusIndicator = document.getElementById('status-indicator');
  const statusText = statusIndicator.querySelector('.status-text');
  const modeSelect = document.getElementById('mode');
  const selectorsContainer = document.getElementById('selectors-container');
  const selectorsInput = document.getElementById('selectors');
  const intervalInput = document.getElementById('interval');
  const startButton = document.getElementById('start');
  const stopButton = document.getElementById('stop');
  const errorMessage = document.getElementById('error-message');

  /**
   * Shows an error message in the popup.
   * @param {string} message - The error message to display.
   */
  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
  }

  /**
   * Hides the error message.
   */
  function hideError() {
    errorMessage.classList.add('hidden');
  }

  /**
   * Updates the entire popup UI based on data from storage.
   * @param {object} data - The result from browser.storage.local.get.
   */
  function updateUI(data) {
    // Set status indicator
    if (data.isActive) {
      statusIndicator.classList.add('active');
      statusText.textContent = 'Active';
    } else {
      statusIndicator.classList.remove('active');
      statusText.textContent = 'Inactive';
    }

    // Pre-fill form with the last used configuration, if available
    if (data.config) {
      modeSelect.value = data.config.mode;
      selectorsInput.value = data.config.selectors ? data.config.selectors.join(', ') : '';
      intervalInput.value = data.config.interval;
    }

    // Ensure the selector input visibility is correct based on the mode
    if (modeSelect.value === 'click') {
      selectorsContainer.classList.remove('hidden');
    } else {
      selectorsContainer.classList.add('hidden');
    }
  }

  // Load status and config from storage when the popup opens.
  (async () => {
    const result = await browser.storage.local.get(['isActive', 'config']);
    if (result) {
      updateUI(result);
    }
  })();

  // Event listener to show/hide the selector input when the mode changes.
  modeSelect.addEventListener('change', () => {
    selectorsContainer.classList.toggle('hidden', modeSelect.value !== 'click');
  });

  // Event listener for the Start button.
  startButton.addEventListener('click', async () => {
    hideError(); // Hide previous errors
    const mode = modeSelect.value;
    const interval = parseInt(intervalInput.value, 10);
    const selectors = selectorsInput.value.split(',').map(s => s.trim()).filter(Boolean);

    if (interval < 5) {
      showError('Interval must be at least 5 seconds.');
      return;
    }
    if (interval > 18000) {
      showError('Interval cannot be more than 18000 seconds (5 hours).');
      return;
    }
    if (mode === 'click' && selectors.length === 0) {
      showError('Please provide at least one CSS selector for click mode.');
      return;
    }

    await browser.runtime.sendMessage({
      action: 'start',
      mode,
      selectors,
      interval,
    });
    window.close();
  });

  // Event listener for the Stop button.
  stopButton.addEventListener('click', async () => {
    await browser.runtime.sendMessage({ action: 'stop' });
    window.close();
  });
});
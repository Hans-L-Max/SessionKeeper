/**
 * Filename: popup.js
 * Description: Popup interface controller for Session Keeper extension configuration.
 * Copyright © 2025 Hans-L-Max
 * License: MIT
 */

/**
 * Browser API polyfill for cross-browser compatibility
 * @type {object}
 */
const browser = window.browser || window.chrome;

/**
 * DOM element references
 * @type {object}
 */
const elements = {};

/**
 * Initializes DOM element references.
 * @returns {void}
 */
function initializeElements() {
  elements.statusIndicator = document.getElementById('status-indicator');
  elements.statusText = elements.statusIndicator.querySelector('.status-text');
  elements.modeSelect = document.getElementById('mode');
  elements.selectorsContainer = document.getElementById('selectors-container');
  elements.selectorsInput = document.getElementById('selectors');
  elements.intervalInput = document.getElementById('interval');
  elements.notifyOnChangeCheckbox = document.getElementById('notifyOnChange');
  elements.stopOnChangeCheckbox = document.getElementById('stopOnChange');
  elements.startButton = document.getElementById('start');
  elements.stopButton = document.getElementById('stop');
  elements.errorMessage = document.getElementById('error-message');
}

/**
 * Shows an error message in the popup.
 * @param {string} message - The error message to display.
 * @returns {void}
 */
function showError(message) {
  elements.errorMessage.textContent = message;
  elements.errorMessage.classList.remove('hidden');
}

/**
 * Hides the error message.
 * @returns {void}
 */
function hideError() {
  elements.errorMessage.classList.add('hidden');
}

/**
 * Updates the entire popup UI based on data from storage.
 * @param {object} data - The result from browser.storage.local.get.
 * @returns {void}
 */
function updateUI(data) {
  // Update status indicator
  if (data.isActive) {
    elements.statusIndicator.classList.add('active');
    elements.statusText.textContent = 'Active';
  } else {
    elements.statusIndicator.classList.remove('active');
    elements.statusText.textContent = 'Inactive';
  }

  // Pre-fill form with last used configuration
  if (data.config) {
    elements.modeSelect.value = data.config.mode;
    elements.selectorsInput.value = data.config.selectors ? data.config.selectors.join(', ') : '';
    elements.intervalInput.value = data.config.interval;
    elements.notifyOnChangeCheckbox.checked = !!data.config.notifyOnChange;
    elements.stopOnChangeCheckbox.checked = !!data.config.stopOnChange;
  }

  // Update selector input visibility
  updateSelectorsVisibility();
}

/**
 * Updates the visibility of the selectors container based on selected mode.
 * @returns {void}
 */
function updateSelectorsVisibility() {
  const shouldShow = elements.modeSelect.value === 'click';
  elements.selectorsContainer.classList.toggle('hidden', !shouldShow);
}

/**
 * Validates the form inputs.
 * @returns {object} Validation result with isValid boolean and config object.
 */
function validateForm() {
  const mode = elements.modeSelect.value;
  const interval = parseInt(elements.intervalInput.value, 10);
  const selectors = elements.selectorsInput.value
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  const notifyOnChange = elements.notifyOnChangeCheckbox.checked;
  const stopOnChange = elements.stopOnChangeCheckbox.checked;

  if (interval < 5) {
    showError('Interval must be at least 5 seconds.');
    return { isValid: false };
  }

  if (interval > 18000) {
    showError('Interval cannot be more than 18000 seconds (5 hours).');
    return { isValid: false };
  }

  if (mode === 'click' && selectors.length === 0) {
    showError('Please provide at least one CSS selector for click mode.');
    return { isValid: false };
  }

  return {
    isValid: true,
    config: { mode, selectors, interval, notifyOnChange, stopOnChange }
  };
}

/**
 * Handles the start button click event.
 * @returns {Promise<void>}
 */
async function handleStart() {
  hideError();
  
  const validation = validateForm();
  if (!validation.isValid) {
    return;
  }

  try {
    await browser.runtime.sendMessage({
      action: 'start',
      ...validation.config
    });
    window.close();
  } catch (error) {
    showError('Failed to start Session Keeper. Please try again.');
    console.error('Start error:', error);
  }
}

/**
 * Handles the stop button click event.
 * @returns {Promise<void>}
 */
async function handleStop() {
  try {
    await browser.runtime.sendMessage({ action: 'stop' });
    window.close();
  } catch (error) {
    showError('Failed to stop Session Keeper. Please try again.');
    console.error('Stop error:', error);
  }
}

/**
 * Initializes the popup interface.
 * @returns {Promise<void>}
 */
async function initializePopup() {
  initializeElements();
  
  // Load status and config from storage
  try {
    const result = await browser.storage.local.get(['isActive', 'config']);
    updateUI(result);
  } catch (error) {
    console.error('Failed to load configuration:', error);
  }

  // Event listeners
  elements.modeSelect.addEventListener('change', updateSelectorsVisibility);
  elements.startButton.addEventListener('click', handleStart);
  elements.stopButton.addEventListener('click', handleStop);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializePopup);
// Loads and renders the full captured conversation on the messages.html page.

/** @typedef {{ role: 'user' | 'assistant' | 'system', content: string, timestamp: number }} StoredMessage */

const STORAGE_KEY = 'messages';
const SESSION_MARKER_CONTENT = 'Session started';

const messageListElement = document.getElementById('message-list');
const copyAllButtonElement = document.getElementById('copy-all-button');
const copyStatusElement = document.getElementById('copy-status');

/** @type {StoredMessage[]} */
let allMessages = [];

/**
 * Escapes text before inserting it into the page HTML.
 * @param {string} text
 * @returns {string}
 */
function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Formats a Unix timestamp as "Jun 15, 2026 7:28 PM".
 * @param {number} timestamp
 * @returns {string}
 */
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const datePart = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timePart = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return `${datePart} ${timePart}`;
}

/**
 * Returns true when a message is a session boundary marker.
 * @param {StoredMessage} message
 * @returns {boolean}
 */
function isSessionMarker(message) {
  return message.role === 'system' && message.content === SESSION_MARKER_CONTENT;
}

/**
 * Returns a display label for the role badge.
 * @param {string} role
 * @returns {string}
 */
function getRoleLabel(role) {
  if (role === 'user') {
    return 'User';
  }

  if (role === 'assistant') {
    return 'Assistant';
  }

  return 'System';
}

/**
 * Builds HTML for a single session divider message.
 * @param {StoredMessage} message
 * @returns {string}
 */
function renderSessionMarker(message) {
  const formattedTime = formatTimestamp(message.timestamp);

  return `
    <article class="message-item session-divider">
      <div class="session-divider-label">${escapeHtml(SESSION_MARKER_CONTENT)} · ${escapeHtml(formattedTime)}</div>
    </article>
  `;
}

/**
 * Builds HTML for a standard user, assistant, or system message.
 * @param {StoredMessage} message
 * @returns {string}
 */
function renderMessageItem(message) {
  const formattedTime = formatTimestamp(message.timestamp);
  const roleLabel = getRoleLabel(message.role);

  return `
    <article class="message-item">
      <div class="message-meta">
        <span class="role-badge ${message.role}">${escapeHtml(roleLabel)}</span>
        <time class="message-time" datetime="${message.timestamp}">${escapeHtml(formattedTime)}</time>
      </div>
      <div class="message-content">${escapeHtml(message.content)}</div>
    </article>
  `;
}

/**
 * Renders all messages in chronological order (oldest first).
 * @param {StoredMessage[]} messages
 */
function renderAllMessages(messages) {
  if (messages.length === 0) {
    messageListElement.innerHTML =
      '<div class="empty-state">No messages captured yet.</div>';
    return;
  }

  messageListElement.innerHTML = messages
    .map((message) => {
      if (isSessionMarker(message)) {
        return renderSessionMarker(message);
      }

      return renderMessageItem(message);
    })
    .join('');
}

/**
 * Shows feedback next to the copy button.
 * @param {string} text
 * @param {'default' | 'success' | 'error'} tone
 */
function setCopyStatus(text, tone = 'default') {
  copyStatusElement.textContent = text;
  copyStatusElement.className = 'copy-status';

  if (tone === 'success') {
    copyStatusElement.classList.add('success');
  }

  if (tone === 'error') {
    copyStatusElement.classList.add('error');
  }
}

/**
 * Loads messages from chrome.storage.local and renders the full list.
 * @returns {Promise<void>}
 */
async function loadAndRenderMessages() {
  try {
    const stored = await chrome.storage.local.get(STORAGE_KEY);
    allMessages = Array.isArray(stored[STORAGE_KEY]) ? stored[STORAGE_KEY] : [];
    renderAllMessages(allMessages);
  } catch (error) {
    console.error('[Ripple Memory] Failed to load messages:', error);
    messageListElement.innerHTML =
      '<div class="empty-state">Could not load stored messages.</div>';
  }
}

/**
 * Copies the full conversation as JSON to the clipboard.
 * @returns {Promise<void>}
 */
async function copyAllAsJson() {
  if (allMessages.length === 0) {
    setCopyStatus('Nothing to copy.', 'error');
    return;
  }

  const payload = JSON.stringify({ messages: allMessages }, null, 2);

  try {
    await navigator.clipboard.writeText(payload);
    setCopyStatus('Copied!', 'success');
  } catch (error) {
    console.error('[Ripple Memory] Clipboard copy failed:', error);
    setCopyStatus('Copy failed.', 'error');
  }
}

copyAllButtonElement.addEventListener('click', () => {
  void copyAllAsJson();
});

void loadAndRenderMessages();

// Watches claude.ai conversation pages and appends new message text to chrome.storage.local.

/*
 * DOM SELECTORS (update here if claude.ai changes its markup):
 *
 * Conversation root — `main` holds the scrollable chat; falls back to `document.body`.
 *
 * User messages (first match wins per element):
 *   [data-testid="user-message"]  — primary Anthropic test id for human turns
 *   [data-testid="human-message"] — alternate test id used in some UI versions
 *   .font-user-message            — font-scoped class for user text blocks
 *   .human-turn                    — legacy turn wrapper class
 *
 * Assistant messages (first match wins per element):
 *   .font-claude-response          — primary class for Claude reply text (most stable)
 *   [data-testid="ai-message"]     — test id fallback for assistant turns
 *   [data-testid="message-assistant"] — alternate assistant test id
 *
 * Message body text — nested inside the message element:
 *   .standard-markdown, .progressive-markdown, .markdown, .prose, [class*="markdown"]
 *   Falls back to the message element's own innerText if none match.
 *
 * Why these: claude.ai does not expose a public API; community extensions rely on
 * data-testid and font-* classes. Multiple fallbacks keep capture working across UI updates.
 */

/** @typedef {{ role: 'user' | 'assistant' | 'system', content: string, timestamp: number }} StoredMessage */

/** CSS selectors grouped by role — order matters (most stable first). */
const USER_MESSAGE_SELECTORS = [
  '[data-testid="user-message"]',
  '[data-testid="human-message"]',
  '.font-user-message',
  '.human-turn',
];

const ASSISTANT_MESSAGE_SELECTORS = [
  '.font-claude-response',
  '[data-testid="ai-message"]',
  '[data-testid="message-assistant"]',
];

const CONTENT_SELECTORS = [
  '.standard-markdown',
  '.progressive-markdown',
  '.markdown',
  '.prose',
  '[class*="markdown"]',
];

const ALL_MESSAGE_SELECTORS = [
  ...USER_MESSAGE_SELECTORS,
  ...ASSISTANT_MESSAGE_SELECTORS,
].join(', ');

const STORAGE_KEY = 'messages';
const SESSION_MARKER_CONTENT = 'Session started';
const SESSION_MARKER_COOLDOWN_MS = 60_000;

/** Debounce timer id for batched MutationObserver rescans. */
let rescanTimerId = null;

/** In-memory copy of stored messages — loaded on init, appended to over time. */
/** @type {StoredMessage[]} */
let storedMessages = [];

/** Dedupe keys already present in storage so we never append the same message twice. */
/** @type {Set<string>} */
const seenDedupeKeys = new Set();

/**
 * Returns the scrollable conversation container on claude.ai.
 * @returns {Element}
 */
function getConversationContainer() {
  return document.querySelector('main') ?? document.body;
}

/**
 * Determines whether a DOM element is a user or assistant message.
 * @param {Element} element
 * @returns {'user' | 'assistant' | null}
 */
function getMessageRole(element) {
  for (const selector of USER_MESSAGE_SELECTORS) {
    if (element.matches(selector)) {
      return 'user';
    }
  }

  for (const selector of ASSISTANT_MESSAGE_SELECTORS) {
    if (element.matches(selector)) {
      return 'assistant';
    }
  }

  return null;
}

/**
 * Extracts plain text from a message element, stripping HTML structure.
 * @param {Element} messageElement
 * @returns {string}
 */
function extractPlainText(messageElement) {
  let contentElement = messageElement;

  for (const selector of CONTENT_SELECTORS) {
    const match = messageElement.querySelector(selector);
    if (match) {
      contentElement = match;
      break;
    }
  }

  return contentElement.innerText.trim();
}

/**
 * Finds top-level message elements in document order (ignores nested duplicates).
 * @returns {Element[]}
 */
function findMessageElements() {
  const container = getConversationContainer();
  const candidates = Array.from(container.querySelectorAll(ALL_MESSAGE_SELECTORS));

  return candidates.filter((element) => {
    return !candidates.some(
      (other) => other !== element && other.contains(element)
    );
  });
}

/**
 * Reads all conversation messages from the current page DOM.
 * @returns {Array<{ role: 'user' | 'assistant', content: string }>}
 */
function extractMessagesFromDom() {
  const elements = findMessageElements();

  /** @type {Array<{ role: 'user' | 'assistant', content: string }>} */
  const messages = [];

  for (const element of elements) {
    const role = getMessageRole(element);
    const content = extractPlainText(element);

    if (!role || content.length === 0) {
      continue;
    }

    messages.push({ role, content });
  }

  return messages;
}

/**
 * Builds a stable dedupe key from role and the first 100 characters of content.
 * @param {string} role
 * @param {string} content
 * @returns {string}
 */
function buildDedupeKey(role, content) {
  return `${role}:${content.slice(0, 100)}`;
}

/**
 * Registers a message's dedupe key so duplicate DOM hits are skipped later.
 * @param {StoredMessage} message
 */
function registerDedupeKey(message) {
  seenDedupeKeys.add(buildDedupeKey(message.role, message.content));
}

/**
 * Reads existing messages from chrome.storage.local into memory without wiping history.
 * @returns {Promise<void>}
 */
async function loadStoredMessages() {
  try {
    const stored = await chrome.storage.local.get(STORAGE_KEY);
    storedMessages = Array.isArray(stored[STORAGE_KEY])
      ? stored[STORAGE_KEY]
      : [];

    seenDedupeKeys.clear();
    for (const message of storedMessages) {
      registerDedupeKey(message);
    }
  } catch (error) {
    console.error('[Ripple Memory] Failed to load stored messages:', error);
    storedMessages = [];
    seenDedupeKeys.clear();
  }
}

/**
 * Persists the in-memory messages array back to chrome.storage.local.
 * @returns {Promise<void>}
 */
async function saveStoredMessages() {
  try {
    await chrome.storage.local.set({ [STORAGE_KEY]: storedMessages });
  } catch (error) {
    console.error('[Ripple Memory] Failed to save messages:', error);
  }
}

/**
 * Appends a session boundary marker unless one was already written within the last 60 seconds.
 * @returns {boolean} True when a new session marker was appended.
 */
function maybeAppendSessionMarker() {
  const lastMessage = storedMessages[storedMessages.length - 1];
  const cooldownStart = Date.now() - SESSION_MARKER_COOLDOWN_MS;

  if (
    lastMessage &&
    lastMessage.role === 'system' &&
    lastMessage.content === SESSION_MARKER_CONTENT &&
    lastMessage.timestamp > cooldownStart
  ) {
    return false;
  }

  /** @type {StoredMessage} */
  const sessionMarker = {
    role: 'system',
    content: SESSION_MARKER_CONTENT,
    timestamp: Date.now(),
  };

  storedMessages.push(sessionMarker);
  registerDedupeKey(sessionMarker);
  return true;
}

/**
 * Scans the DOM and appends any messages whose dedupe key is not already in storage.
 * @returns {Promise<void>}
 */
async function appendNewMessagesFromDom() {
  const domMessages = extractMessagesFromDom();
  let hasNewMessages = false;

  for (const domMessage of domMessages) {
    const dedupeKey = buildDedupeKey(domMessage.role, domMessage.content);

    if (seenDedupeKeys.has(dedupeKey)) {
      continue;
    }

    /** @type {StoredMessage} */
    const newMessage = {
      role: domMessage.role,
      content: domMessage.content,
      timestamp: Date.now(),
    };

    storedMessages.push(newMessage);
    seenDedupeKeys.add(dedupeKey);
    hasNewMessages = true;
  }

  if (hasNewMessages) {
    await saveStoredMessages();
  }
}

/**
 * Schedules a debounced DOM scan so rapid MutationObserver events trigger one append pass.
 */
function scheduleRescan() {
  if (rescanTimerId !== null) {
    clearTimeout(rescanTimerId);
  }

  rescanTimerId = setTimeout(() => {
    rescanTimerId = null;
    void appendNewMessagesFromDom();
  }, 500);
}

/**
 * Starts watching the conversation container for newly appearing messages.
 */
function startMutationObserver() {
  const container = getConversationContainer();

  const observer = new MutationObserver(() => {
    scheduleRescan();
  });

  observer.observe(container, {
    childList: true,
    subtree: true,
    characterData: true,
  });
}

/**
 * Loads history, marks the session boundary, seeds from the current page, then watches for more.
 * @returns {Promise<void>}
 */
async function init() {
  await loadStoredMessages();

  if (maybeAppendSessionMarker()) {
    await saveStoredMessages();
  }

  await appendNewMessagesFromDom();
  startMutationObserver();
}

// Popup "Re-scan page" sends this message to force a fresh DOM read.
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message && message.type === 'RESCAN') {
    void appendNewMessagesFromDom().then(() => {
      sendResponse({ ok: true });
    });
    return true;
  }

  return false;
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    void init();
  });
} else {
  void init();
}

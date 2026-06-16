// Reads captured messages from storage and drives the popup UI actions.

/** @typedef {{ role: 'user' | 'assistant' | 'system', content: string, timestamp: number }} StoredMessage */

/** @typedef {{ role: 'user' | 'assistant' | 'system', content: string, timestamp?: number }} ParsedMessage */

const STORAGE_KEY = 'messages';
const PREVIEW_CHAR_LIMIT = 100;
const SESSION_MARKER_CONTENT = 'Session started';

const TIMESTAMP_LINE_PATTERN =
  /^[A-Z][a-z]{2}\s+\d{1,2},\s+\d{4}\s+\d{1,2}:\d{2}\s+[AP]M$/;

const ROLE_LINE_PATTERN =
  /^(User|Assistant|Human|Claude|System)\s*:?\s*$/i;

const INLINE_ROLE_PATTERN =
  /^(User|Assistant|Human|Claude|System)\s*:\s*(.+)$/i;

/** Splits raw claude.ai copy-paste text on role delimiter labels. */
const CLAUDE_AI_DELIMITER_PATTERN = /(You said:|Claude responded:)/gi;

/** Minimum content length — shorter segments are usually timestamps or noise. */
const MIN_IMPORTED_MESSAGE_LENGTH = 10;

/** Matches a line that is only a time like "7:24 PM". */
const TIME_ONLY_LINE_PATTERN = /^\d{1,2}:\d{2}\s*[AP]M$/i;

/** Matches a line that is only a short date like "Jun 6". */
const DATE_ONLY_LINE_PATTERN = /^[A-Z][a-z]{2,8}\s+\d{1,2}(?:,?\s+\d{4})?$/;

/**
 * Escapes text before inserting it into the preview HTML.
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

const messageCountElement = document.getElementById('message-count');
const previewListElement = document.getElementById('preview-list');
const copyButtonElement = document.getElementById('copy-button');
const rescanButtonElement = document.getElementById('rescan-button');
const viewAllButtonElement = document.getElementById('view-all-button');
const pasteToggleButtonElement = document.getElementById('paste-toggle-button');
const pasteSectionElement = document.getElementById('paste-section');
const pasteTextareaElement = document.getElementById('paste-textarea');
const importButtonElement = document.getElementById('import-button');
const importStatusElement = document.getElementById('import-status');
const statusElement = document.getElementById('status');

/** @type {StoredMessage[]} */
let currentMessages = [];

/**
 * Shows a short status line below the action buttons.
 * @param {string} text
 * @param {'default' | 'success' | 'error'} tone
 */
function setStatus(text, tone = 'default') {
  statusElement.textContent = text;
  statusElement.className = 'status';

  if (tone === 'success') {
    statusElement.classList.add('success');
  }

  if (tone === 'error') {
    statusElement.classList.add('error');
  }
}

/**
 * Shows import feedback inside the paste section.
 * @param {string} text
 * @param {'default' | 'success' | 'error'} tone
 */
function setImportStatus(text, tone = 'default') {
  importStatusElement.textContent = text;
  importStatusElement.className = 'import-status';

  if (tone === 'success') {
    importStatusElement.classList.add('success');
  }

  if (tone === 'error') {
    importStatusElement.classList.add('error');
  }
}

/**
 * Truncates message text for the preview panel.
 * @param {string} text
 * @returns {string}
 */
function truncatePreview(text) {
  if (text.length <= PREVIEW_CHAR_LIMIT) {
    return text;
  }

  return `${text.slice(0, PREVIEW_CHAR_LIMIT)}…`;
}

/**
 * Renders the message count and last-three preview list.
 * @param {StoredMessage[]} messages
 */
function renderPreview(messages) {
  messageCountElement.textContent = String(messages.length);

  if (messages.length === 0) {
    previewListElement.innerHTML =
      '<div class="empty-state">No messages captured yet</div>';
    return;
  }

  const lastThree = messages.slice(-3);
  previewListElement.innerHTML = lastThree
    .map((message) => {
      return `
        <div class="preview-item">
          <div class="preview-role ${message.role}">${message.role}</div>
          <div class="preview-text">${escapeHtml(truncatePreview(message.content))}</div>
        </div>
      `;
    })
    .join('');
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
 * Maps pasted role labels to the stored role values.
 * @param {string} label
 * @returns {'user' | 'assistant' | 'system' | null}
 */
function normalizeRoleLabel(label) {
  const normalized = label.toLowerCase();

  if (normalized === 'user' || normalized === 'human') {
    return 'user';
  }

  if (normalized === 'assistant' || normalized === 'claude') {
    return 'assistant';
  }

  if (normalized === 'system') {
    return 'system';
  }

  return null;
}

/**
 * Returns true when a line is a formatted timestamp from messages.html.
 * @param {string} line
 * @returns {boolean}
 */
function isTimestampLine(line) {
  return TIMESTAMP_LINE_PATTERN.test(line);
}

/**
 * Returns true when a line is a standalone role header.
 * @param {string} line
 * @returns {boolean}
 */
function isRoleLine(line) {
  return ROLE_LINE_PATTERN.test(line);
}

/**
 * Returns true when a line marks a session boundary in pasted text.
 * @param {string} line
 * @returns {boolean}
 */
function isSessionMarkerLine(line) {
  return /^session started(?:\s*·.*)?$/i.test(line);
}

/**
 * Validates and normalizes a message object from JSON import.
 * @param {unknown} value
 * @returns {ParsedMessage | null}
 */
function parseJsonMessage(value) {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = /** @type {Record<string, unknown>} */ (value);
  const role = typeof record.role === 'string' ? normalizeRoleLabel(record.role) : null;
  const content = typeof record.content === 'string' ? record.content.trim() : '';

  if (!role || content.length === 0) {
    return null;
  }

  const timestamp =
    typeof record.timestamp === 'number' ? record.timestamp : undefined;

  return { role, content, timestamp };
}

/**
 * Attempts to parse pasted text as Ripple Memory JSON export.
 * @param {string} text
 * @returns {ParsedMessage[] | null}
 */
function tryParseJsonConversation(text) {
  if (!text.startsWith('{')) {
    return null;
  }

  try {
    const parsed = JSON.parse(text);
    const rawMessages =
      parsed && typeof parsed === 'object' && Array.isArray(parsed.messages)
        ? parsed.messages
        : null;

    if (!rawMessages) {
      return null;
    }

    const messages = rawMessages
      .map((message) => parseJsonMessage(message))
      .filter((message) => message !== null);

    return messages.length > 0 ? messages : null;
  } catch (error) {
    console.error('[Ripple Memory] JSON parse failed:', error);
    return null;
  }
}

/**
 * Removes timestamp lines and glued times from imported message content.
 * @param {string} content
 * @returns {string}
 */
function cleanImportedMessageContent(content) {
  const withoutTimestampLines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => {
      if (line.length === 0) {
        return false;
      }

      if (TIME_ONLY_LINE_PATTERN.test(line)) {
        return false;
      }

      if (DATE_ONLY_LINE_PATTERN.test(line)) {
        return false;
      }

      return true;
    })
    .join('\n');

  return withoutTimestampLines
    .replace(/\d{1,2}:\d{2}\s*[AP]M\s*$/i, '')
    .trim();
}

/**
 * Parses raw claude.ai copy-paste text split on "You said:" / "Claude responded:".
 * @param {string} text
 * @returns {ParsedMessage[]}
 */
function parseClaudeAiPaste(text) {
  /** @type {Array<{ role: 'user' | 'assistant', start: number, contentStart: number }>} */
  const markers = [];

  for (const match of text.matchAll(CLAUDE_AI_DELIMITER_PATTERN)) {
    if (match.index === undefined) {
      continue;
    }

    const label = match[1].toLowerCase();
    const role = label === 'you said:' ? 'user' : 'assistant';

    markers.push({
      role,
      start: match.index,
      contentStart: match.index + match[0].length,
    });
  }

  if (markers.length === 0) {
    return [];
  }

  /** @type {ParsedMessage[]} */
  const messages = [];

  for (let index = 0; index < markers.length; index += 1) {
    const currentMarker = markers[index];
    const nextMarker = markers[index + 1];
    const rawContent = text.slice(
      currentMarker.contentStart,
      nextMarker ? nextMarker.start : text.length
    );
    const content = cleanImportedMessageContent(rawContent);

    if (content.length < MIN_IMPORTED_MESSAGE_LENGTH) {
      continue;
    }

    messages.push({ role: currentMarker.role, content });
  }

  return messages;
}

/**
 * Parses role-labeled plain text from messages.html exports.
 * @param {string} text
 * @returns {ParsedMessage[]}
 */
function parseMessagesHtmlConversation(text) {
  const lines = text.split(/\r?\n/);
  /** @type {ParsedMessage[]} */
  const messages = [];
  let lineIndex = 0;

  while (lineIndex < lines.length) {
    const trimmedLine = lines[lineIndex].trim();

    if (trimmedLine.length === 0) {
      lineIndex += 1;
      continue;
    }

    if (isSessionMarkerLine(trimmedLine)) {
      messages.push({
        role: 'system',
        content: SESSION_MARKER_CONTENT,
      });
      lineIndex += 1;
      continue;
    }

    const inlineMatch = trimmedLine.match(INLINE_ROLE_PATTERN);
    if (inlineMatch) {
      const role = normalizeRoleLabel(inlineMatch[1]);
      const content = inlineMatch[2].trim();

      if (role && content.length > 0) {
        messages.push({ role, content: cleanImportedMessageContent(content) });
      }

      lineIndex += 1;
      continue;
    }

    const roleMatch = trimmedLine.match(ROLE_LINE_PATTERN);
    if (!roleMatch) {
      lineIndex += 1;
      continue;
    }

    const role = normalizeRoleLabel(roleMatch[1]);
    lineIndex += 1;

    if (!role) {
      continue;
    }

    if (lineIndex < lines.length && isTimestampLine(lines[lineIndex].trim())) {
      lineIndex += 1;
    }

    const contentLines = [];
    while (lineIndex < lines.length) {
      const nextTrimmed = lines[lineIndex].trim();

      if (
        isRoleLine(nextTrimmed) ||
        isSessionMarkerLine(nextTrimmed) ||
        INLINE_ROLE_PATTERN.test(nextTrimmed)
      ) {
        break;
      }

      contentLines.push(lines[lineIndex]);
      lineIndex += 1;
    }

    const content = cleanImportedMessageContent(contentLines.join('\n'));
    if (content.length > 0) {
      messages.push({ role, content });
    }
  }

  return messages;
}

/**
 * Parses pasted conversation text into normalized message objects.
 * @param {string} text
 * @returns {ParsedMessage[]}
 */
function parsePastedConversation(text) {
  const trimmedText = text.trim();

  if (trimmedText.length === 0) {
    return [];
  }

  const jsonMessages = tryParseJsonConversation(trimmedText);
  if (jsonMessages) {
    return jsonMessages;
  }

  const claudeAiMessages = parseClaudeAiPaste(trimmedText);
  if (claudeAiMessages.length > 0) {
    return claudeAiMessages;
  }

  return parseMessagesHtmlConversation(trimmedText);
}

/**
 * Loads messages from chrome.storage.local and updates the popup.
 * @returns {Promise<void>}
 */
async function loadMessagesFromStorage() {
  try {
    const stored = await chrome.storage.local.get(STORAGE_KEY);
    currentMessages = Array.isArray(stored[STORAGE_KEY])
      ? stored[STORAGE_KEY]
      : [];
    renderPreview(currentMessages);
  } catch (error) {
    console.error('[Ripple Memory] Failed to load messages:', error);
    setStatus('Could not read stored messages.', 'error');
  }
}

/**
 * Copies the full conversation as JSON to the clipboard.
 * @returns {Promise<void>}
 */
async function copyConversationToClipboard() {
  if (currentMessages.length === 0) {
    setStatus('Nothing to copy yet.', 'error');
    return;
  }

  const payload = JSON.stringify({ messages: currentMessages }, null, 2);

  try {
    await navigator.clipboard.writeText(payload);
    setStatus('Copied conversation JSON to clipboard.', 'success');
  } catch (error) {
    console.error('[Ripple Memory] Clipboard copy failed:', error);
    setStatus('Clipboard copy failed.', 'error');
  }
}

/**
 * Asks the active tab's content script to re-scan the Claude.ai DOM.
 * @returns {Promise<void>}
 */
async function requestPageRescan() {
  setStatus('Re-scanning page…');

  try {
    const [activeTab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!activeTab || !activeTab.id) {
      setStatus('No active tab found.', 'error');
      return;
    }

    if (!activeTab.url || !activeTab.url.startsWith('https://claude.ai/')) {
      setStatus('Open a claude.ai conversation first.', 'error');
      return;
    }

    await chrome.tabs.sendMessage(activeTab.id, { type: 'RESCAN' });
    await loadMessagesFromStorage();
    setStatus('Page re-scanned.', 'success');
  } catch (error) {
    console.error('[Ripple Memory] Re-scan failed:', error);
    setStatus('Re-scan failed — refresh the Claude page and try again.', 'error');
  }
}

/**
 * Opens the full messages page in a new browser tab.
 */
function openFullMessagesPage() {
  const messagesPageUrl = chrome.runtime.getURL('messages.html');
  chrome.tabs.create({ url: messagesPageUrl });
}

/**
 * Shows or hides the paste conversation import section.
 */
function togglePasteSection() {
  const isHidden = pasteSectionElement.classList.contains('hidden');
  pasteSectionElement.classList.toggle('hidden');

  if (!isHidden) {
    return;
  }

  pasteTextareaElement.focus();
}

/**
 * Merges parsed pasted messages into storage using dedupe keys.
 * @returns {Promise<void>}
 */
async function importPastedConversation() {
  const pastedText = pasteTextareaElement.value.trim();

  if (pastedText.length === 0) {
    setImportStatus('Paste a conversation first.', 'error');
    return;
  }

  const parsedMessages = parsePastedConversation(pastedText);

  if (parsedMessages.length === 0) {
    setImportStatus('No messages found in pasted text.', 'error');
    return;
  }

  try {
    const stored = await chrome.storage.local.get(STORAGE_KEY);
    /** @type {StoredMessage[]} */
    const existingMessages = Array.isArray(stored[STORAGE_KEY])
      ? stored[STORAGE_KEY]
      : [];

    const seenDedupeKeys = new Set(
      existingMessages.map((message) =>
        buildDedupeKey(message.role, message.content)
      )
    );

    let addedCount = 0;
    let skippedCount = 0;

    for (const parsedMessage of parsedMessages) {
      const dedupeKey = buildDedupeKey(
        parsedMessage.role,
        parsedMessage.content
      );

      if (seenDedupeKeys.has(dedupeKey)) {
        skippedCount += 1;
        continue;
      }

      existingMessages.push({
        role: parsedMessage.role,
        content: parsedMessage.content,
        timestamp: parsedMessage.timestamp ?? Date.now(),
      });
      seenDedupeKeys.add(dedupeKey);
      addedCount += 1;
    }

    await chrome.storage.local.set({ [STORAGE_KEY]: existingMessages });
    currentMessages = existingMessages;
    renderPreview(currentMessages);

    setImportStatus(
      `Added ${addedCount} new, skipped ${skippedCount} duplicates`,
      'success'
    );
    pasteTextareaElement.value = '';
  } catch (error) {
    console.error('[Ripple Memory] Import failed:', error);
    setImportStatus('Import failed.', 'error');
  }
}

copyButtonElement.addEventListener('click', () => {
  void copyConversationToClipboard();
});

rescanButtonElement.addEventListener('click', () => {
  void requestPageRescan();
});

viewAllButtonElement.addEventListener('click', () => {
  openFullMessagesPage();
});

pasteToggleButtonElement.addEventListener('click', () => {
  togglePasteSection();
});

importButtonElement.addEventListener('click', () => {
  void importPastedConversation();
});

void loadMessagesFromStorage();

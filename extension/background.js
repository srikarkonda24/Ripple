// Service worker — discovers ChatGPT tabs and relays collect/broadcast commands to content scripts.
importScripts('selectors.js', 'agentDetector.js', 'formatter.js');

const selectors = RippleTeamSync.selectors;
const formatter = RippleTeamSync.formatter;

const CONTENT_PING_TIMEOUT_MS = 3000;
const TAB_FOCUS_DELAY_MS = 350;

/**
 * @typedef {{ tabId: number, title: string, agentName: string, url: string }} ChatGptTabInfo
 */

/**
 * Returns all open tabs that look like ChatGPT conversation pages.
 * @returns {Promise<ChatGptTabInfo[]>}
 */
async function findChatGptTabs() {
  const tabs = await chrome.tabs.query({});
  const chatTabs = tabs.filter((tab) => {
    return (
      typeof tab.id === 'number' &&
      typeof tab.url === 'string' &&
      selectors.isChatGptConversationUrl(tab.url)
    );
  });

  /** @type {ChatGptTabInfo[]} */
  const results = [];

  for (const tab of chatTabs) {
    const tabId = tab.id;
    if (typeof tabId !== 'number') {
      continue;
    }

    let agentName = RippleTeamSync.agentDetector.cleanTitle(tab.title || '');

    if (agentName.length === 0) {
      agentName = 'Unknown Agent';
    }

    try {
      const pageName = await sendTabMessage(tabId, { type: 'GET_AGENT_NAME' });
      if (pageName && typeof pageName.agentName === 'string' && pageName.agentName.length > 0) {
        agentName = pageName.agentName;
      }
    } catch {
      // Content script may not be ready — fall back to tab title.
    }

    results.push({
      tabId,
      title: tab.title || agentName,
      agentName,
      url: tab.url || '',
    });
  }

  results.sort((left, right) => left.agentName.localeCompare(right.agentName));
  return results;
}

/**
 * Sends a message to a tab's content script with a timeout fallback.
 * @param {number} tabId
 * @param {object} message
 * @returns {Promise<object>}
 */
function sendTabMessage(tabId, message) {
  return new Promise((resolve, reject) => {
    let settled = false;

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(new Error('content_script_timeout'));
      }
    }, CONTENT_PING_TIMEOUT_MS);

    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);

      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      resolve(response ?? {});
    });
  });
}

/**
 * Ensures the content script is reachable, injecting it manually if needed.
 * @param {number} tabId
 * @returns {Promise<void>}
 */
async function ensureContentScript(tabId) {
  try {
    await sendTabMessage(tabId, { type: 'PING' });
    return;
  } catch {
    // Attempt programmatic injection when the tab loaded before install.
  }

  await chrome.scripting.executeScript({
    target: { tabId },
    files: ['selectors.js', 'agentDetector.js', 'content.js'],
  });

  await sendTabMessage(tabId, { type: 'PING' });
}

/**
 * Collects the latest assistant response from each selected tab.
 * @param {number[]} tabIds
 * @returns {Promise<{ combined: string, results: object[], skipped: object[] }>}
 */
async function collectLatestResponses(tabIds) {
  /** @type {{ agentName: string, response: string }[]} */
  const collected = [];
  /** @type {object[]} */
  const skipped = [];

  for (const tabId of tabIds) {
    let tabInfo;
    try {
      tabInfo = await chrome.tabs.get(tabId);
    } catch {
      skipped.push({ tabId, reason: 'tab_not_found' });
      continue;
    }

    try {
      await ensureContentScript(tabId);
      const result = await sendTabMessage(tabId, { type: 'COLLECT_LATEST' });

      if (result.skipped) {
        skipped.push({
          tabId,
          agentName: tabInfo.title || 'Unknown',
          reason: result.reason || 'skipped',
        });
        continue;
      }

      collected.push({
        agentName: result.agentName || tabInfo.title || 'Unknown',
        response: result.response || '',
      });
    } catch (error) {
      skipped.push({
        tabId,
        agentName: tabInfo.title || 'Unknown',
        reason: error instanceof Error ? error.message : 'collect_failed',
      });
    }
  }

  return {
    combined: formatter.buildCombinedDocument(collected),
    results: collected,
    skipped,
  };
}

/**
 * Focuses each tab and pastes the combined prompt into its ChatGPT input.
 * @param {number[]} tabIds
 * @param {string} text
 * @param {boolean} autoSend
 * @returns {Promise<{ successes: number[], failures: object[] }>}
 */
async function broadcastToTabs(tabIds, text, autoSend) {
  /** @type {number[]} */
  const successes = [];
  /** @type {object[]} */
  const failures = [];

  for (const tabId of tabIds) {
    try {
      await chrome.tabs.update(tabId, { active: true });
      await new Promise((resolve) => setTimeout(resolve, TAB_FOCUS_DELAY_MS));

      await ensureContentScript(tabId);
      const result = await sendTabMessage(tabId, {
        type: 'BROADCAST',
        text,
        autoSend,
      });

      if (result.ok) {
        successes.push(tabId);
      } else {
        failures.push({ tabId, error: result.error || 'broadcast_failed' });
      }
    } catch (error) {
      failures.push({
        tabId,
        error: error instanceof Error ? error.message : 'broadcast_failed',
      });
    }
  }

  return { successes, failures };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || !message.type) {
    return false;
  }

  if (message.type === 'FIND_CHATGPT_TABS') {
    void findChatGptTabs().then(sendResponse);
    return true;
  }

  if (message.type === 'COLLECT_RESPONSES') {
    const tabIds = Array.isArray(message.tabIds) ? message.tabIds : [];
    void collectLatestResponses(tabIds).then(sendResponse);
    return true;
  }

  if (message.type === 'BROADCAST_PROMPT') {
    const tabIds = Array.isArray(message.tabIds) ? message.tabIds : [];
    const text = typeof message.text === 'string' ? message.text : '';
    const autoSend = message.autoSend === true;
    void broadcastToTabs(tabIds, text, autoSend).then(sendResponse);
    return true;
  }

  return false;
});

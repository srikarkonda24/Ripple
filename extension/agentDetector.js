// Derives a human-readable agent name from a ChatGPT tab title or page DOM.
(function attachAgentDetector(globalScope) {
  const CHATGPT_TITLE_SUFFIXES = [
    ' - ChatGPT',
    ' | ChatGPT',
    ' - OpenAI',
    ' | OpenAI',
    'ChatGPT',
  ];

  /**
   * Returns the first element matching any selector in the list.
   * @param {string[]} selectorList
   * @returns {Element | null}
   */
  function queryFirstMatch(selectorList) {
    for (const selector of selectorList) {
      const element = document.querySelector(selector);
      if (element) {
        return element;
      }
    }
    return null;
  }

  /**
   * Strips common ChatGPT branding from a raw title string.
   * @param {string} rawTitle
   * @returns {string}
   */
  function cleanTitle(rawTitle) {
    let cleaned = rawTitle.trim();

    for (const suffix of CHATGPT_TITLE_SUFFIXES) {
      if (cleaned.endsWith(suffix)) {
        cleaned = cleaned.slice(0, -suffix.length).trim();
      }
    }

    cleaned = cleaned.replace(/\s*[-|]\s*ChatGPT\s*$/i, '').trim();
    return cleaned;
  }

  /**
   * Reads the active conversation name from the ChatGPT page when available.
   * @returns {string | null}
   */
  function readNameFromPage() {
    const selectors = globalScope.RippleTeamSync?.selectors?.CHAT_TITLE_SELECTORS;
    if (!selectors) {
      return null;
    }

    const titleElement = queryFirstMatch(selectors);
    if (!titleElement) {
      return null;
    }

    const text = titleElement.textContent?.trim();
    return text && text.length > 0 ? text : null;
  }

  /**
   * Determines the agent label for a tab — page DOM first, then tab title fallback.
   * @param {string} tabTitle
   * @returns {string}
   */
  function detectAgentName(tabTitle) {
    const pageName = readNameFromPage();
    if (pageName) {
      return pageName;
    }

    const cleaned = cleanTitle(tabTitle || '');
    if (cleaned.length > 0) {
      return cleaned;
    }

    return 'Unknown Agent';
  }

  globalScope.RippleTeamSync = globalScope.RippleTeamSync || {};
  globalScope.RippleTeamSync.agentDetector = {
    detectAgentName,
    cleanTitle,
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);

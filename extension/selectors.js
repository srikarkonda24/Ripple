// Central CSS selectors for ChatGPT DOM — update here when OpenAI changes markup.
(function attachSelectors(globalScope) {
  /**
   * ChatGPT tab URL patterns used to detect open conversations.
   */
  const CHATGPT_URL_PATTERNS = [
    'https://chatgpt.com/*',
    'https://chat.openai.com/*',
  ];

  /**
   * Match URLs that are actual ChatGPT conversation pages (not settings, etc.).
   * @param {string} url
   * @returns {boolean}
   */
  function isChatGptConversationUrl(url) {
    try {
      const parsed = new URL(url);
      const host = parsed.hostname;
      return (
        host === 'chatgpt.com' ||
        host === 'chat.openai.com' ||
        host.endsWith('.chatgpt.com')
      );
    } catch {
      return false;
    }
  }

  /**
   * Selectors for assistant message containers, most stable first.
   */
  const ASSISTANT_MESSAGE_SELECTORS = [
    '[data-message-author-role="assistant"]',
    '[data-role="assistant"]',
    '[data-message-author="assistant"]',
    '.agent-turn',
  ];

  /**
   * Nested content inside a message bubble.
   */
  const MESSAGE_CONTENT_SELECTORS = [
    '.markdown',
    '.prose',
    '[class*="markdown"]',
  ];

  /**
   * Indicators that ChatGPT is still generating a response.
   */
  const GENERATING_INDICATORS = [
    'button[data-testid="stop-button"]',
    'button[aria-label="Stop streaming"]',
    'button[aria-label="Stop generating"]',
    '[data-testid="stop-button"]',
  ];

  /**
   * Streaming class markers on the latest assistant turn.
   */
  const STREAMING_CLASS_MARKERS = [
    '.result-streaming',
    '[class*="streaming"]',
  ];

  /**
   * Chat input editor selectors — ChatGPT uses contenteditable divs.
   */
  const INPUT_SELECTORS = [
    '#prompt-textarea',
    '[data-testid="prompt-textarea"]',
    'div#prompt-textarea[contenteditable="true"]',
    'div.ProseMirror[contenteditable="true"]',
    'div[contenteditable="true"][data-placeholder]',
    'div[contenteditable="true"][role="textbox"]',
    'textarea[placeholder*="Message"]',
  ];

  /**
   * Send button selectors.
   */
  const SEND_BUTTON_SELECTORS = [
    'button[data-testid="send-button"]',
    'button[aria-label="Send prompt"]',
    'button[aria-label="Send message"]',
  ];

  /**
   * Sidebar or page elements that may hold the chat title.
   */
  const CHAT_TITLE_SELECTORS = [
    '[data-testid="conversation-title"]',
    'nav [aria-current="page"]',
    'aside a[aria-current="page"]',
    '.group\\/conversation-turn span.truncate',
  ];

  globalScope.RippleTeamSync = globalScope.RippleTeamSync || {};
  globalScope.RippleTeamSync.selectors = {
    CHATGPT_URL_PATTERNS,
    isChatGptConversationUrl,
    ASSISTANT_MESSAGE_SELECTORS,
    MESSAGE_CONTENT_SELECTORS,
    GENERATING_INDICATORS,
    STREAMING_CLASS_MARKERS,
    INPUT_SELECTORS,
    SEND_BUTTON_SELECTORS,
    CHAT_TITLE_SELECTORS,
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);

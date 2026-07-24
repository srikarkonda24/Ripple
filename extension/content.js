// Runs inside ChatGPT tabs — reads the latest assistant reply and injects broadcast prompts.
(function initContentScript() {
  const selectors = RippleTeamSync.selectors;
  const agentDetector = RippleTeamSync.agentDetector;

  const GENERATION_POLL_MS = 400;
  const GENERATION_TIMEOUT_MS = 120_000;
  const EDITOR_POLL_MS = 200;
  const EDITOR_TIMEOUT_MS = 10_000;

  /**
   * Returns the first visible element matching any selector in the list.
   * @param {string[]} selectorList
   * @param {ParentNode} [root]
   * @returns {Element | null}
   */
  function queryFirstMatch(selectorList, root = document) {
    for (const selector of selectorList) {
      const element = root.querySelector(selector);
      if (element instanceof Element) {
        return element;
      }
    }
    return null;
  }

  /**
   * Finds all top-level assistant message elements in conversation order.
   * @returns {Element[]}
   */
  function findAssistantMessages() {
    for (const selector of selectors.ASSISTANT_MESSAGE_SELECTORS) {
      const matches = Array.from(document.querySelectorAll(selector));
      if (matches.length > 0) {
        return matches.filter(
          (element) =>
            !matches.some(
              (other) => other !== element && other.contains(element)
            )
        );
      }
    }
    return [];
  }

  /**
   * Extracts plain text from a single assistant message element.
   * @param {Element} messageElement
   * @returns {string}
   */
  function extractMessageText(messageElement) {
    const contentElement =
      queryFirstMatch(selectors.MESSAGE_CONTENT_SELECTORS, messageElement) ??
      messageElement;

    return (contentElement.textContent || contentElement.innerText || '').trim();
  }

  /**
   * Returns true when a global stop button is visible (generation in progress).
   * @returns {boolean}
   */
  function hasGlobalGeneratingIndicator() {
    for (const selector of selectors.GENERATING_INDICATORS) {
      const button = document.querySelector(selector);
      if (button instanceof HTMLElement && button.offsetParent !== null) {
        return true;
      }
    }
    return false;
  }

  /**
   * Returns true when the latest assistant turn is still streaming.
   * @param {Element | null} latestAssistant
   * @returns {boolean}
   */
  function isLatestMessageStreaming(latestAssistant) {
    if (!latestAssistant) {
      return false;
    }

    for (const marker of selectors.STREAMING_CLASS_MARKERS) {
      if (latestAssistant.querySelector(marker) || latestAssistant.matches(marker)) {
        return true;
      }
    }

    const stopInMessage = latestAssistant.querySelector(
      selectors.GENERATING_INDICATORS.join(', ')
    );
    if (stopInMessage instanceof HTMLElement && stopInMessage.offsetParent !== null) {
      return true;
    }

    return false;
  }

  /**
   * Determines whether ChatGPT is currently generating a response.
   * @returns {boolean}
   */
  function isGenerating() {
    if (hasGlobalGeneratingIndicator()) {
      return true;
    }

    const assistants = findAssistantMessages();
    const latest = assistants[assistants.length - 1] ?? null;
    return isLatestMessageStreaming(latest);
  }

  /**
   * Waits until generation finishes or times out.
   * @returns {Promise<{ ready: boolean, timedOut: boolean }>}
   */
  function waitForGenerationComplete() {
    return new Promise((resolve) => {
      const startedAt = Date.now();

      const poll = () => {
        if (!isGenerating()) {
          resolve({ ready: true, timedOut: false });
          return;
        }

        if (Date.now() - startedAt >= GENERATION_TIMEOUT_MS) {
          resolve({ ready: false, timedOut: true });
          return;
        }

        setTimeout(poll, GENERATION_POLL_MS);
      };

      poll();
    });
  }

  /**
   * Reads only the most recent completed assistant message — never full history.
   * @returns {{ response: string, agentName: string } | { skipped: true, reason: string }}
   */
  function readLatestAssistantResponse() {
    if (isGenerating()) {
      return { skipped: true, reason: 'still_generating' };
    }

    const assistants = findAssistantMessages();
    if (assistants.length === 0) {
      return { skipped: true, reason: 'no_assistant_message' };
    }

    const latest = assistants[assistants.length - 1];
    const response = extractMessageText(latest);

    if (response.length === 0) {
      return { skipped: true, reason: 'empty_response' };
    }

    const agentName = agentDetector.detectAgentName(document.title);
    return { response, agentName };
  }

  /**
   * Polls until the chat input editor appears in the DOM.
   * @returns {Promise<Element | null>}
   */
  function waitForInputEditor() {
    return new Promise((resolve) => {
      const startedAt = Date.now();

      const poll = () => {
        const editor = queryFirstMatch(selectors.INPUT_SELECTORS);
        if (editor) {
          resolve(editor);
          return;
        }

        if (Date.now() - startedAt >= EDITOR_TIMEOUT_MS) {
          resolve(null);
          return;
        }

        setTimeout(poll, EDITOR_POLL_MS);
      };

      poll();
    });
  }

  /**
   * Clears and sets text inside a contenteditable or textarea input.
   * @param {Element} editor
   * @param {string} text
   * @returns {boolean}
   */
  function setEditorText(editor, text) {
    try {
      editor.focus();

      if (editor instanceof HTMLTextAreaElement) {
        const prototype = Object.getPrototypeOf(editor);
        const valueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
        if (valueSetter) {
          valueSetter.call(editor, text);
        } else {
          editor.value = text;
        }
        editor.dispatchEvent(new Event('input', { bubbles: true }));
        editor.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }

      if (editor instanceof HTMLElement && editor.isContentEditable) {
        editor.textContent = '';
        editor.innerHTML = '';

        const selection = window.getSelection();
        if (selection) {
          const range = document.createRange();
          range.selectNodeContents(editor);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
        }

        const execSuccess = document.execCommand('insertText', false, text);
        if (!execSuccess) {
          editor.textContent = text;
          editor.dispatchEvent(
            new InputEvent('input', {
              bubbles: true,
              inputType: 'insertFromPaste',
              data: text,
            })
          );
        }

        editor.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }

      return false;
    } catch (error) {
      console.error('[Ripple Team Sync] Failed to set editor text:', error);
      return false;
    }
  }

  /**
   * Clicks the ChatGPT send button when it is enabled.
   * @returns {boolean}
   */
  function clickSendButton() {
    for (const selector of selectors.SEND_BUTTON_SELECTORS) {
      const button = document.querySelector(selector);
      if (!(button instanceof HTMLButtonElement)) {
        continue;
      }

      if (button.disabled || button.offsetParent === null) {
        continue;
      }

      button.click();
      return true;
    }

    return false;
  }

  /**
   * Replaces the draft in the input and optionally sends it.
   * @param {string} text
   * @param {boolean} autoSend
   * @returns {Promise<{ ok: boolean, error?: string }>}
   */
  async function broadcastPrompt(text, autoSend) {
    const editor = await waitForInputEditor();
    if (!editor) {
      return { ok: false, error: 'input_not_found' };
    }

    const setOk = setEditorText(editor, text);
    if (!setOk) {
      return { ok: false, error: 'input_set_failed' };
    }

    if (!autoSend) {
      return { ok: true };
    }

    await new Promise((resolve) => setTimeout(resolve, 150));

    const sent = clickSendButton();
    if (!sent) {
      return { ok: false, error: 'send_button_not_found' };
    }

    return { ok: true };
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!message || !message.type) {
      return false;
    }

    if (message.type === 'PING') {
      sendResponse({ ok: true });
      return false;
    }

    if (message.type === 'GET_AGENT_NAME') {
      sendResponse({
        agentName: agentDetector.detectAgentName(document.title),
      });
      return false;
    }

    if (message.type === 'COLLECT_LATEST') {
      void (async () => {
        const waitResult = await waitForGenerationComplete();
        if (!waitResult.ready) {
          sendResponse({
            skipped: true,
            reason: waitResult.timedOut ? 'generation_timeout' : 'still_generating',
          });
          return;
        }

        sendResponse(readLatestAssistantResponse());
      })();
      return true;
    }

    if (message.type === 'BROADCAST') {
      void broadcastPrompt(message.text || '', message.autoSend === true).then(
        sendResponse
      );
      return true;
    }

    return false;
  });
})();

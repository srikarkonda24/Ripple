// Popup controller — tab selection, collect, broadcast, and local settings persistence.
(function initPopup() {
  const storage = RippleTeamSync.storage;

  /** @type {Array<{ tabId: number, agentName: string, title: string }>} */
  let detectedTabs = [];

  const tabListElement = document.getElementById('tab-list');
  const emptyTabsElement = document.getElementById('empty-tabs');
  const selectAllButton = document.getElementById('select-all-button');
  const collectButton = document.getElementById('collect-button');
  const combinedPromptElement = document.getElementById('combined-prompt');
  const autoSendCheckbox = document.getElementById('auto-send-checkbox');
  const broadcastButton = document.getElementById('broadcast-button');
  const statusElement = document.getElementById('status');

  /**
   * Shows a short status message below the popup actions.
   * @param {string} message
   * @param {'default' | 'success' | 'error' | 'warning'} [tone]
   */
  function setStatus(message, tone = 'default') {
    statusElement.textContent = message;
    statusElement.className = 'status';
    if (tone !== 'default') {
      statusElement.classList.add(tone);
    }
  }

  /**
   * Sends a message to the background service worker.
   * @param {object} message
   * @returns {Promise<object>}
   */
  function sendBackgroundMessage(message) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve(response ?? {});
      });
    });
  }

  /**
   * Returns tab IDs for all currently checked checkboxes.
   * @returns {number[]}
   */
  function getSelectedTabIds() {
    if (!tabListElement) {
      return [];
    }

    const checkboxes = tabListElement.querySelectorAll(
      'input[type="checkbox"][data-tab-id]:checked'
    );

    return Array.from(checkboxes)
      .map((input) => Number(input.getAttribute('data-tab-id')))
      .filter((tabId) => Number.isFinite(tabId));
  }

  /**
   * Persists the current checkbox selection to storage.
   */
  function persistSelectedTabs() {
    void storage.saveSelectedTabIds(getSelectedTabIds());
  }

  /**
   * Renders detected ChatGPT tabs as unchecked checkboxes by default.
   * @param {number[]} previouslySelected
   */
  function renderTabList(previouslySelected) {
    if (!tabListElement) {
      return;
    }

    tabListElement.innerHTML = '';

    if (detectedTabs.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-tabs';
      empty.textContent = 'No ChatGPT tabs found. Open chats and reopen this popup.';
      tabListElement.appendChild(empty);
      return;
    }

    const selectedSet = new Set(previouslySelected);

    for (const tab of detectedTabs) {
      const row = document.createElement('div');
      row.className = 'tab-item';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = `tab-${tab.tabId}`;
      checkbox.setAttribute('data-tab-id', String(tab.tabId));
      checkbox.checked = selectedSet.has(tab.tabId);
      checkbox.addEventListener('change', persistSelectedTabs);

      const label = document.createElement('label');
      label.setAttribute('for', checkbox.id);
      label.textContent = tab.agentName;

      row.appendChild(checkbox);
      row.appendChild(label);
      tabListElement.appendChild(row);
    }
  }

  /**
   * Loads ChatGPT tabs from the background worker when the popup opens.
   */
  async function refreshTabs() {
    setStatus('Scanning ChatGPT tabs…');

    try {
      const settings = await storage.loadSettings();
      const response = await sendBackgroundMessage({ type: 'FIND_CHATGPT_TABS' });
      detectedTabs = Array.isArray(response) ? response : [];
      renderTabList(settings.selectedTabIds);
      setStatus(
        detectedTabs.length > 0
          ? `Found ${detectedTabs.length} ChatGPT tab${detectedTabs.length === 1 ? '' : 's'}.`
          : 'No ChatGPT tabs detected.'
      );
    } catch (error) {
      console.error('[Ripple Team Sync] Failed to refresh tabs:', error);
      setStatus('Could not scan tabs. Try reopening the popup.', 'error');
    }
  }

  /**
   * Toggles all tab checkboxes on or off.
   */
  function handleSelectAll() {
    if (!tabListElement) {
      return;
    }

    const checkboxes = tabListElement.querySelectorAll(
      'input[type="checkbox"][data-tab-id]'
    );
    if (checkboxes.length === 0) {
      return;
    }

    const shouldSelectAll = Array.from(checkboxes).some((box) => !box.checked);
    checkboxes.forEach((box) => {
      box.checked = shouldSelectAll;
    });
    persistSelectedTabs();
  }

  /**
   * Collects the latest assistant reply from each checked tab.
   */
  async function handleCollect() {
    const tabIds = getSelectedTabIds();
    if (tabIds.length === 0) {
      setStatus('Select at least one tab to collect.', 'warning');
      return;
    }

    collectButton.disabled = true;
    setStatus('Collecting latest responses…');

    try {
      const result = await sendBackgroundMessage({
        type: 'COLLECT_RESPONSES',
        tabIds,
      });

      const combined =
        typeof result.combined === 'string' ? result.combined : '';

      if (combined.length === 0) {
        const skippedCount = Array.isArray(result.skipped) ? result.skipped.length : 0;
        setStatus(
          skippedCount > 0
            ? 'No responses collected — tabs may still be generating.'
            : 'No assistant responses found in selected tabs.',
          'warning'
        );
        return;
      }

      combinedPromptElement.value = combined;
      await storage.saveCombinedPrompt(combined);

      const collectedCount = Array.isArray(result.results) ? result.results.length : 0;
      const skippedCount = Array.isArray(result.skipped) ? result.skipped.length : 0;

      if (skippedCount > 0) {
        setStatus(
          `Collected ${collectedCount} response${collectedCount === 1 ? '' : 's'}. Skipped ${skippedCount} tab${skippedCount === 1 ? '' : 's'}.`,
          'warning'
        );
      } else {
        setStatus(
          `Collected ${collectedCount} response${collectedCount === 1 ? '' : 's'}.`,
          'success'
        );
      }
    } catch (error) {
      console.error('[Ripple Team Sync] Collect failed:', error);
      setStatus('Collect failed. Check the console for details.', 'error');
    } finally {
      collectButton.disabled = false;
    }
  }

  /**
   * Sends the combined prompt to each checked tab.
   */
  async function handleBroadcast() {
    const tabIds = getSelectedTabIds();
    if (tabIds.length === 0) {
      setStatus('Select at least one tab to broadcast.', 'warning');
      return;
    }

    const text = combinedPromptElement.value.trim();
    if (text.length === 0) {
      setStatus('Combined prompt is empty.', 'warning');
      return;
    }

    broadcastButton.disabled = true;
    setStatus('Broadcasting…');

    try {
      const autoSend = autoSendCheckbox.checked;
      const result = await sendBackgroundMessage({
        type: 'BROADCAST_PROMPT',
        tabIds,
        text: combinedPromptElement.value,
        autoSend,
      });

      const successCount = Array.isArray(result.successes)
        ? result.successes.length
        : 0;
      const failureCount = Array.isArray(result.failures)
        ? result.failures.length
        : 0;

      if (failureCount > 0) {
        setStatus(
          `Sent to ${successCount} tab${successCount === 1 ? '' : 's'}. ${failureCount} failed.`,
          'warning'
        );
      } else {
        setStatus(
          autoSend
            ? `Broadcast and sent to ${successCount} tab${successCount === 1 ? '' : 's'}.`
            : `Pasted into ${successCount} tab${successCount === 1 ? '' : 's'}.`,
          'success'
        );
      }
    } catch (error) {
      console.error('[Ripple Team Sync] Broadcast failed:', error);
      setStatus('Broadcast failed. Check the console for details.', 'error');
    } finally {
      broadcastButton.disabled = false;
    }
  }

  /**
   * Restores saved settings when the popup opens.
   */
  async function loadSavedSettings() {
    const settings = await storage.loadSettings();
    autoSendCheckbox.checked = settings.autoSend;
    combinedPromptElement.value = settings.combinedPrompt;
  }

  selectAllButton.addEventListener('click', handleSelectAll);
  collectButton.addEventListener('click', () => {
    void handleCollect();
  });
  broadcastButton.addEventListener('click', () => {
    void handleBroadcast();
  });

  autoSendCheckbox.addEventListener('change', () => {
    void storage.saveAutoSend(autoSendCheckbox.checked);
  });

  let promptSaveTimer = null;
  combinedPromptElement.addEventListener('input', () => {
    if (promptSaveTimer !== null) {
      clearTimeout(promptSaveTimer);
    }
    promptSaveTimer = setTimeout(() => {
      void storage.saveCombinedPrompt(combinedPromptElement.value);
    }, 300);
  });

  void loadSavedSettings().then(refreshTabs);
})();

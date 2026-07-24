// Persists popup preferences and the combined prompt draft in chrome.storage.local.
(function attachStorage(globalScope) {
  const STORAGE_KEYS = {
    autoSend: 'rippleTeamSync_autoSend',
    combinedPrompt: 'rippleTeamSync_combinedPrompt',
    selectedTabIds: 'rippleTeamSync_selectedTabIds',
  };

  /**
   * Reads persisted popup settings.
   * @returns {Promise<{ autoSend: boolean, combinedPrompt: string, selectedTabIds: number[] }>}
   */
  async function loadSettings() {
    try {
      const stored = await chrome.storage.local.get(Object.values(STORAGE_KEYS));
      return {
        autoSend: stored[STORAGE_KEYS.autoSend] === true,
        combinedPrompt:
          typeof stored[STORAGE_KEYS.combinedPrompt] === 'string'
            ? stored[STORAGE_KEYS.combinedPrompt]
            : '',
        selectedTabIds: Array.isArray(stored[STORAGE_KEYS.selectedTabIds])
          ? stored[STORAGE_KEYS.selectedTabIds]
          : [],
      };
    } catch (error) {
      console.error('[Ripple Team Sync] Failed to load settings:', error);
      return { autoSend: false, combinedPrompt: '', selectedTabIds: [] };
    }
  }

  /**
   * Saves the auto-send checkbox state.
   * @param {boolean} autoSend
   * @returns {Promise<void>}
   */
  async function saveAutoSend(autoSend) {
    try {
      await chrome.storage.local.set({ [STORAGE_KEYS.autoSend]: autoSend });
    } catch (error) {
      console.error('[Ripple Team Sync] Failed to save auto-send:', error);
    }
  }

  /**
   * Saves the combined prompt textarea contents.
   * @param {string} combinedPrompt
   * @returns {Promise<void>}
   */
  async function saveCombinedPrompt(combinedPrompt) {
    try {
      await chrome.storage.local.set({
        [STORAGE_KEYS.combinedPrompt]: combinedPrompt,
      });
    } catch (error) {
      console.error('[Ripple Team Sync] Failed to save combined prompt:', error);
    }
  }

  /**
   * Saves which tab IDs were last checked in the popup.
   * @param {number[]} selectedTabIds
   * @returns {Promise<void>}
   */
  async function saveSelectedTabIds(selectedTabIds) {
    try {
      await chrome.storage.local.set({
        [STORAGE_KEYS.selectedTabIds]: selectedTabIds,
      });
    } catch (error) {
      console.error('[Ripple Team Sync] Failed to save selected tabs:', error);
    }
  }

  globalScope.RippleTeamSync = globalScope.RippleTeamSync || {};
  globalScope.RippleTeamSync.storage = {
    loadSettings,
    saveAutoSend,
    saveCombinedPrompt,
    saveSelectedTabIds,
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);

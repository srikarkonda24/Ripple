// Builds the combined multi-agent document shown in the popup textbox.
(function attachFormatter(globalScope) {
  const SECTION_DIVIDER = '================================';

  /**
   * @typedef {{ agentName: string, response: string }} AgentResponse
   */

  /**
   * Formats one agent section with the required divider layout.
   * @param {string} agentName
   * @param {string} response
   * @returns {string}
   */
  function formatSection(agentName, response) {
    return [
      SECTION_DIVIDER,
      '',
      agentName,
      '',
      response.trim(),
      '',
    ].join('\n');
  }

  /**
   * Combines multiple agent responses into one editable document.
   * Skips entries with empty responses.
   * @param {AgentResponse[]} responses
   * @returns {string}
   */
  function buildCombinedDocument(responses) {
    const sections = responses
      .filter((entry) => entry.response && entry.response.trim().length > 0)
      .map((entry) => formatSection(entry.agentName, entry.response));

    if (sections.length === 0) {
      return '';
    }

    return sections.join('\n') + SECTION_DIVIDER + '\n';
  }

  globalScope.RippleTeamSync = globalScope.RippleTeamSync || {};
  globalScope.RippleTeamSync.formatter = {
    buildCombinedDocument,
    formatSection,
    SECTION_DIVIDER,
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);

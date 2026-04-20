(() => {
  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function escapeHtmlAttr(value) {
    return escapeHtml(value);
  }

  window.NetoDom = {
    escapeHtml,
    escapeHtmlAttr,
  };
})();

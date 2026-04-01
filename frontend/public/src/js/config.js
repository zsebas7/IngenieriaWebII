const DEFAULT_API_URL = 'https://ingenieriawebii-production.up.railway.app';
const storedApiUrl = localStorage.getItem('neto_api_url') || '';

function resolveApiUrl() {
  if (!storedApiUrl) {
    return DEFAULT_API_URL;
  }

  // Avoid mixed-content failures when a previous local value uses http on an https page.
  if (window.location.protocol === 'https:' && storedApiUrl.startsWith('http://')) {
    return DEFAULT_API_URL;
  }

  return storedApiUrl;
}

window.NETO_CONFIG = {
  API_URL: resolveApiUrl(),
  FORMSPREE_ENDPOINT: localStorage.getItem('neto_formspree') || '',
};

window.NetoUI = {
  showMessage(target, message, type = 'error') {
    if (!target) return;

    const host =
      target instanceof HTMLFormElement
        ? target
        : target.closest('form') || target.closest('.panel-card') || target.closest('section') || target;

    if (!host) return;

    let node = host.querySelector('.neto-inline-message');
    if (!node) {
      node = document.createElement('div');
      node.className = 'neto-inline-message';
      host.prepend(node);
    }

    node.className = `neto-inline-message neto-inline-message--${type}`;
    node.textContent = message;
  },
  clearMessage(target) {
    if (!target) return;
    const host =
      target instanceof HTMLFormElement
        ? target
        : target.closest('form') || target.closest('.panel-card') || target.closest('section') || target;
    const node = host?.querySelector('.neto-inline-message');
    if (node) {
      node.remove();
    }
  },
};

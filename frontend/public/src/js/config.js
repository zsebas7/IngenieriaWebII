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

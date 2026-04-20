const runtimeApiUrl = (window.NETO_RUNTIME_CONFIG && window.NETO_RUNTIME_CONFIG.API_URL) || '';
const DEFAULT_API_URL = runtimeApiUrl
  ? String(runtimeApiUrl)
  : window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3001'
    : 'https://ingenieriawebii-production.up.railway.app';
const storedApiUrl = localStorage.getItem('neto_api_url') || '';

function detectBasePath() {
  const marker = '/html/';
  const markerIndex = window.location.pathname.indexOf(marker);

  if (markerIndex === -1) {
    return '';
  }

  const prefix = window.location.pathname.slice(0, markerIndex);
  return prefix.endsWith('/') ? prefix.slice(0, -1) : prefix;
}

const NETO_BASE_PATH = detectBasePath();
const route = (path) => `${NETO_BASE_PATH}${path}`;

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

window.NetoBasePath = NETO_BASE_PATH;

window.NetoRoutes = {
  public: {
    index: route('/html/public/index.html'),
    login: route('/html/public/login.html'),
    register: route('/html/public/register.html'),
    forgotPassword: route('/html/public/forgot-password.html'),
    demo: route('/html/public/demo.html'),
    terms: route('/html/public/terms.html'),
    privacy: route('/html/public/privacy.html'),
  },
  user: {
    dashboard: route('/html/user/dashboard.html'),
    stats: route('/html/user/stats.html'),
    expenses: route('/html/user/expenses.html'),
    expensesUpload: route('/html/user/expenses-upload.html'),
    expensesOrganize: route('/html/user/expenses-organize.html'),
    planning: route('/html/user/planning.html'),
    goals: route('/html/user/goals.html'),
    chatAi: route('/html/user/chat-ai.html'),
    chatAdvisor: route('/html/user/chat-advisor-user.html'),
    profile: route('/html/user/profile.html'),
  },
  advisor: {
    dashboard: route('/html/advisor/advisor.html'),
    users: route('/html/advisor/advisor-users.html'),
    detail: route('/html/advisor/advisor-detail.html'),
    chats: route('/html/advisor/advisor-chats.html'),
  },
  admin: {
    dashboard: route('/html/admin/admin.html'),
  },
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

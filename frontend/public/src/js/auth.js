function saveAuth(payload) {
  localStorage.setItem('neto_access_token', payload.accessToken);
  localStorage.setItem('neto_refresh_token', payload.refreshToken);
  localStorage.setItem('neto_user', JSON.stringify(payload.user));
}

function isLocalPreviewHost() {
  const host = window.location.hostname || '';
  if (window.location.protocol === 'file:') return true;
  if (['localhost', '127.0.0.1', '0.0.0.0', '::1', ''].includes(host)) return true;
  if (/^192\.168\./.test(host)) return true;
  if (/^10\./.test(host)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) return true;
  return false;
}

function buildLocalPreviewPayload(role = 'USER') {
  return {
    accessToken: 'local-preview-token',
    refreshToken: 'local-preview-refresh',
    user: {
      id: 'local-preview-user',
      fullName: 'Vista Local',
      email: 'local@neto.app',
      role,
      isActive: true,
      language: 'es',
      preferredCurrency: 'ARS',
    },
  };
}

function enableLocalPreview(role = 'USER', force = false) {
  if (!force && !isLocalPreviewHost()) return false;
  localStorage.setItem('neto_local_preview', '1');
  saveAuth(buildLocalPreviewPayload(role));
  return true;
}

function maybeAutoEnableLocalPreview() {
  if (!isLocalPreviewHost()) return false;
  const params = new URLSearchParams(window.location.search);
  if (params.get('preview') === '1') {
    localStorage.setItem('neto_local_preview', '1');
  }

  if (localStorage.getItem('neto_local_preview') === '1' && !getCurrentUser()) {
    saveAuth(buildLocalPreviewPayload('USER'));
  }

  return localStorage.getItem('neto_local_preview') === '1';
}

function getCurrentUser() {
  const raw = localStorage.getItem('neto_user');
  return raw ? JSON.parse(raw) : null;
}

function requireAuth() {
  maybeAutoEnableLocalPreview();
  const user = getCurrentUser();
  if (!user) {
    window.location.href = 'login.html';
  }
}

window.NetoAuth = {
  saveAuth,
  getCurrentUser,
  requireAuth,
  enableLocalPreview,
  canUseLocalPreview: isLocalPreviewHost,
  logout() {
    localStorage.removeItem('neto_access_token');
    localStorage.removeItem('neto_refresh_token');
    localStorage.removeItem('neto_user');
    window.location.href = 'index.html';
  },
};

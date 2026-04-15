(() => {
const AUTH_KEYS = ['neto_access_token', 'neto_refresh_token', 'neto_user'];

function getStoredAuthValue(key) {
  const sessionValue = sessionStorage.getItem(key);
  if (sessionValue !== null) return sessionValue;
  return localStorage.getItem(key);
}

function hasAuthInStorage(storage) {
  return AUTH_KEYS.some((key) => storage.getItem(key) !== null);
}

function getActiveAuthStorage() {
  if (hasAuthInStorage(sessionStorage)) return sessionStorage;
  if (hasAuthInStorage(localStorage)) return localStorage;
  return sessionStorage;
}

function writeAuth(storage, payload) {
  storage.setItem('neto_access_token', payload.accessToken);
  storage.setItem('neto_refresh_token', payload.refreshToken);
  storage.setItem('neto_user', JSON.stringify(payload.user));
}

function saveAuth(payload, options = {}) {
  const persist = Boolean(options.persist);
  if (persist) {
    clearAuthState();
    writeAuth(localStorage, payload);
    return;
  }

  AUTH_KEYS.forEach((key) => sessionStorage.removeItem(key));
  writeAuth(sessionStorage, payload);
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
  const raw = getStoredAuthValue('neto_user');
  return raw ? JSON.parse(raw) : null;
}

function getAccessToken() {
  return getStoredAuthValue('neto_access_token');
}

function getRefreshToken() {
  return getStoredAuthValue('neto_refresh_token');
}

function setCurrentUser(user) {
  const storage = getActiveAuthStorage();
  storage.setItem('neto_user', JSON.stringify(user));
}

function clearAuthState() {
  AUTH_KEYS.forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
}

function decodeJwtPayload(token) {
  if (!token || !token.includes('.')) return null;

  try {
    const payload = token.split('.')[1];
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    const decoded = window.atob(padded);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

function isAccessTokenExpired(token) {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== 'number') {
    return true;
  }

  const nowInSeconds = Math.floor(Date.now() / 1000);
  const safetyWindow = 10;
  return nowInSeconds >= payload.exp - safetyWindow;
}

function requireAuth() {
  const localPreviewEnabled = maybeAutoEnableLocalPreview();
  if (localPreviewEnabled) {
    return;
  }

  const user = getCurrentUser();
  const accessToken = getAccessToken();

  if (!user || !accessToken || isAccessTokenExpired(accessToken)) {
    clearAuthState();
    window.location.href = 'index.html';
  }
}

window.NetoAuth = {
  saveAuth,
  getCurrentUser,
  getAccessToken,
  getRefreshToken,
  setCurrentUser,
  clearAuthState,
  requireAuth,
  enableLocalPreview,
  canUseLocalPreview: isLocalPreviewHost,
  logout() {
    clearAuthState();
    window.location.href = 'index.html';
  },
};
})();

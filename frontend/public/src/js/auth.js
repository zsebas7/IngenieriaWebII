function saveAuth(payload) {
  localStorage.setItem('neto_access_token', payload.accessToken);
  localStorage.setItem('neto_refresh_token', payload.refreshToken);
  localStorage.setItem('neto_user', JSON.stringify(payload.user));
}

function getCurrentUser() {
  const raw = localStorage.getItem('neto_user');
  return raw ? JSON.parse(raw) : null;
}

function requireAuth() {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = 'login.html';
  }
}

window.NetoAuth = {
  saveAuth,
  getCurrentUser,
  requireAuth,
  logout() {
    localStorage.removeItem('neto_access_token');
    localStorage.removeItem('neto_refresh_token');
    localStorage.removeItem('neto_user');
    window.location.href = 'index.html';
  },
};

(() => {
const AUTH_KEYS = ['neto_access_token', 'neto_refresh_token', 'neto_user'];

function getStoredAuthValue(key) {
  const sessionValue = sessionStorage.getItem(key);
  if (sessionValue !== null) return sessionValue;
  return localStorage.getItem(key);
}

function detectAuthStorageByRefreshToken(refreshToken) {
  if (sessionStorage.getItem('neto_refresh_token') === refreshToken) return sessionStorage;
  if (localStorage.getItem('neto_refresh_token') === refreshToken) return localStorage;
  return sessionStorage;
}

function getAuthHeaders() {
  const token = getStoredAuthValue('neto_access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

let refreshInFlight = null;

function clearAuthState() {
  AUTH_KEYS.forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
}

async function tryRefreshToken() {
  const refreshToken = getStoredAuthValue('neto_refresh_token');
  if (!refreshToken) return false;
  const authStorage = detectAuthStorageByRefreshToken(refreshToken);

  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const response = await fetch(`${window.NETO_CONFIG.API_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (!response.ok) return false;
        const payload = await response.json();
        if (!payload?.accessToken || !payload?.refreshToken || !payload?.user) return false;

        authStorage.setItem('neto_access_token', payload.accessToken);
        authStorage.setItem('neto_refresh_token', payload.refreshToken);
        authStorage.setItem('neto_user', JSON.stringify(payload.user));
        return true;
      } catch {
        return false;
      } finally {
        refreshInFlight = null;
      }
    })();
  }

  return refreshInFlight;
}

async function rawApiRequest(path, options = {}) {
  return fetch(`${window.NETO_CONFIG.API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
  });
}

async function parseResponse(response) {
  if (!response.ok) {
    const contentType = (response.headers.get('content-type') || '').toLowerCase();
    let message = '';

    if (contentType.includes('application/json')) {
      try {
        const data = await response.json();
        const rawMessage = data?.message;

        if (Array.isArray(rawMessage)) {
          message = rawMessage.filter(Boolean).join(' | ');
        } else if (typeof rawMessage === 'string') {
          message = rawMessage;
        } else if (typeof data?.error === 'string') {
          message = data.error;
        }
      } catch {
        message = '';
      }
    }

    if (!message) {
      try {
        message = (await response.text()).trim();
      } catch {
        message = '';
      }
    }

    throw new Error(message || 'Error en la solicitud');
  }

  const type = response.headers.get('content-type') || '';
  if (type.includes('application/json')) {
    return response.json();
  }

  return response.text();
}

async function apiRequest(path, options = {}) {
  let response = await rawApiRequest(path, options);

  if (response.status === 401) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      response = await rawApiRequest(path, options);
    } else {
      clearAuthState();
      if (!window.location.pathname.endsWith('/index.html')) {
        window.location.href = 'index.html';
      }
      throw new Error('Sesión vencida. Inicia sesión nuevamente.');
    }
  }

  return parseResponse(response);
}

window.NetoApi = {
  register: (body) => apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  forgotPassword: (body) => apiRequest('/auth/forgot-password', { method: 'POST', body: JSON.stringify(body) }),
  myDashboard: (month) => apiRequest(`/dashboard/me?month=${month}`),
  listExpenses: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.month) params.set('month', String(filters.month));
    if (filters.category) params.set('category', String(filters.category));
    const query = params.toString();
    return apiRequest(query ? `/expenses?${query}` : '/expenses');
  },
  createExpense: (body) => apiRequest('/expenses', { method: 'POST', body: JSON.stringify(body) }),
  updateExpense: (id, body) => apiRequest(`/expenses/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteExpense: (id) => apiRequest(`/expenses/${id}`, { method: 'DELETE' }),
  uploadTicket: async (file) => {
    const form = new FormData();
    form.append('ticket', file);
    const response = await fetch(`${window.NETO_CONFIG.API_URL}/tickets/upload`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: form,
    });
    if (!response.ok) {
      throw new Error(await response.text());
    }
    return response.json();
  },
  listBudgets: () => apiRequest('/budgets'),
  createBudget: (body) => apiRequest('/budgets', { method: 'POST', body: JSON.stringify(body) }),
  updateBudget: (id, body) => apiRequest(`/budgets/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteBudget: (id) => apiRequest(`/budgets/${id}`, { method: 'DELETE' }),
  listGoals: () => apiRequest('/goals'),
  createGoal: (body) => apiRequest('/goals', { method: 'POST', body: JSON.stringify(body) }),
  updateGoal: (id, body) => apiRequest(`/goals/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  addGoalSavings: (id, body) => apiRequest(`/goals/${id}/savings`, { method: 'POST', body: JSON.stringify(body) }),
  withdrawGoalSavings: (id, body) =>
    apiRequest(`/goals/${id}/withdrawals`, { method: 'POST', body: JSON.stringify(body) }),
  deleteGoal: (id) => apiRequest(`/goals/${id}`, { method: 'DELETE' }),
  generateRecommendation: () => apiRequest('/recommendations/generate', { method: 'POST' }),
  listRecommendations: () => apiRequest('/recommendations'),
  listAdvisorRecommendationsForUser: (userId) => apiRequest(`/recommendations/user/${userId}`),
  createAdvisorRecommendation: (body) => apiRequest('/recommendations/advisor', { method: 'POST', body: JSON.stringify(body) }),
  deleteRecommendation: (id) => apiRequest(`/recommendations/${id}`, { method: 'DELETE' }),
  listAiChatSessions: () => apiRequest('/ai-chat/sessions'),
  createAiChatSession: (body = {}) => apiRequest('/ai-chat/sessions', { method: 'POST', body: JSON.stringify(body) }),
  deleteAiChatSession: (sessionId) => apiRequest(`/ai-chat/sessions/${sessionId}`, { method: 'DELETE' }),
  listAiChatMessages: (sessionId) => apiRequest(`/ai-chat/sessions/${sessionId}/messages`),
  sendAiChatMessage: (sessionId, body) =>
    apiRequest(`/ai-chat/sessions/${sessionId}/messages`, { method: 'POST', body: JSON.stringify(body) }),
  listAdvisorConversations: () => apiRequest('/chat/conversations'),
  openAdvisorConversation: (body) => apiRequest('/chat/conversations/open', { method: 'POST', body: JSON.stringify(body) }),
  closeAdvisorConversation: (conversationId) => apiRequest(`/chat/conversations/${conversationId}/close`, { method: 'PATCH' }),
  listAdvisorConversationMessages: (conversationId) => apiRequest(`/chat/conversations/${conversationId}/messages`),
  sendAdvisorConversationMessage: (conversationId, body) =>
    apiRequest(`/chat/conversations/${conversationId}/messages`, { method: 'POST', body: JSON.stringify(body) }),
  myProfile: () => apiRequest('/users/me'),
  updateMyProfile: (body) => apiRequest('/users/me', { method: 'PATCH', body: JSON.stringify(body) }),
  changeMyPassword: (body) => apiRequest('/users/me/password', { method: 'PATCH', body: JSON.stringify(body) }),
  listUsers: () => apiRequest('/users'),
  updateUserRole: (id, role) => apiRequest(`/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),
  updateUserActive: (id, isActive) =>
    apiRequest(`/users/${id}/active`, { method: 'PATCH', body: JSON.stringify({ isActive }) }),
};
})();

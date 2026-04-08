function getAuthHeaders() {
  const token = localStorage.getItem('neto_access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${window.NETO_CONFIG.API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Error en la solicitud');
  }

  const type = response.headers.get('content-type') || '';
  if (type.includes('application/json')) {
    return response.json();
  }

  return response.text();
}

window.NetoApi = {
  register: (body) => apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  forgotPassword: (body) => apiRequest('/auth/forgot-password', { method: 'POST', body: JSON.stringify(body) }),
  myDashboard: (month) => apiRequest(`/dashboard/me?month=${month}`),
  listExpenses: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.month) {
      params.set('month', filters.month);
    }
    if (filters.category) {
      params.set('category', filters.category);
    }

    const query = params.toString();
    return apiRequest(`/expenses${query ? `?${query}` : ''}`);
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
  generateRecommendation: () => apiRequest('/recommendations/generate', { method: 'POST' }),
  listRecommendations: () => apiRequest('/recommendations'),
  myProfile: () => apiRequest('/users/me'),
  updateMyProfile: (body) => apiRequest('/users/me', { method: 'PATCH', body: JSON.stringify(body) }),
  changeMyPassword: (body) => apiRequest('/users/me/password', { method: 'PATCH', body: JSON.stringify(body) }),
  listUsers: () => apiRequest('/users'),
  updateUserRole: (id, role) => apiRequest(`/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),
  updateUserActive: (id, isActive) =>
    apiRequest(`/users/${id}/active`, { method: 'PATCH', body: JSON.stringify({ isActive }) }),
};

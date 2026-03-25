// API Configuration
const API_URL = 'http://localhost:3000';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  getToken() {
    return localStorage.getItem('token');
  }

  clearToken() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.token = null;
  }

  getAuthHeader() {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.token}`,
    };
  }

  async handleResponse(response) {
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Error en la API');
    }

    return data;
  }

  // AUTH ENDPOINTS
  async login(email, password) {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await this.handleResponse(response);
    this.setToken(data.access_token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  }

  async register(userData) {
    const response = await fetch(`${API_URL}/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    return this.handleResponse(response);
  }

  async verifyToken() {
    const response = await fetch(`${API_URL}/auth/verify`, {
      method: 'POST',
      headers: this.getAuthHeader(),
    });

    return this.handleResponse(response);
  }

  // USER ENDPOINTS
  async getProfile() {
    const response = await fetch(`${API_URL}/users/profile`, {
      headers: this.getAuthHeader(),
    });

    return this.handleResponse(response);
  }

  async updateProfile(userData) {
    const user = JSON.parse(localStorage.getItem('user'));
    const response = await fetch(`${API_URL}/users/${user.id}`, {
      method: 'PUT',
      headers: this.getAuthHeader(),
      body: JSON.stringify(userData),
    });

    return this.handleResponse(response);
  }

  async changePassword(passwordActual, passwordNueva) {
    const user = JSON.parse(localStorage.getItem('user'));
    const response = await fetch(
      `${API_URL}/users/${user.id}/change-password`,
      {
        method: 'POST',
        headers: this.getAuthHeader(),
        body: JSON.stringify({ passwordActual, passwordNueva }),
      }
    );

    return this.handleResponse(response);
  }

  // EXPENSE ENDPOINTS
  async createExpense(expenseData) {
    const response = await fetch(`${API_URL}/expenses`, {
      method: 'POST',
      headers: this.getAuthHeader(),
      body: JSON.stringify(expenseData),
    });

    return this.handleResponse(response);
  }

  async getExpenses() {
    const response = await fetch(`${API_URL}/expenses`, {
      headers: this.getAuthHeader(),
    });

    return this.handleResponse(response);
  }

  async getExpenseById(id) {
    const response = await fetch(`${API_URL}/expenses/${id}`, {
      headers: this.getAuthHeader(),
    });

    return this.handleResponse(response);
  }

  async updateExpense(id, expenseData) {
    const response = await fetch(`${API_URL}/expenses/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeader(),
      body: JSON.stringify(expenseData),
    });

    return this.handleResponse(response);
  }

  async deleteExpense(id) {
    const response = await fetch(`${API_URL}/expenses/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeader(),
    });

    return this.handleResponse(response);
  }

  async getExpenseStats(mes = null, año = null) {
    let url = `${API_URL}/expenses/stats/summary`;
    if (mes && año) {
      url += `?mes=${mes}&año=${año}`;
    }

    const response = await fetch(url, {
      headers: this.getAuthHeader(),
    });

    return this.handleResponse(response);
  }

  async filterExpenses(filterData) {
    const response = await fetch(`${API_URL}/expenses/filter`, {
      method: 'POST',
      headers: this.getAuthHeader(),
      body: JSON.stringify(filterData),
    });

    return this.handleResponse(response);
  }

  async getRecurringExpenses() {
    const response = await fetch(`${API_URL}/expenses/recurring`, {
      headers: this.getAuthHeader(),
    });

    return this.handleResponse(response);
  }

  // CATEGORY ENDPOINTS
  async getCategories() {
    const response = await fetch(`${API_URL}/categories`, {
      headers: { 'Content-Type': 'application/json' },
    });

    return this.handleResponse(response);
  }

  async initializeCategories() {
    const response = await fetch(`${API_URL}/categories/init`, {
      headers: { 'Content-Type': 'application/json' },
    });

    return this.handleResponse(response);
  }

  async createCategory(categoryData) {
    const response = await fetch(`${API_URL}/categories`, {
      method: 'POST',
      headers: this.getAuthHeader(),
      body: JSON.stringify(categoryData),
    });

    return this.handleResponse(response);
  }

  async updateCategory(id, categoryData) {
    const response = await fetch(`${API_URL}/categories/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeader(),
      body: JSON.stringify(categoryData),
    });

    return this.handleResponse(response);
  }

  async deleteCategory(id) {
    const response = await fetch(`${API_URL}/categories/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeader(),
    });

    return this.handleResponse(response);
  }

  isAuthenticated() {
    return !!this.getToken();
  }

  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  logout() {
    this.clearToken();
  }
}

// Create global instance
const api = new ApiService();

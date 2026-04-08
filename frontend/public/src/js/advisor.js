const ADVISOR_RECOMMENDATIONS_KEY = 'neto_advisor_recommendations';

const advisorState = {
  currentUser: null,
  users: [],
  expenses: [],
  selectedUserId: null,
  page: 1,
  pageSize: 8,
  filters: {
    search: '',
    role: 'ALL',
    status: 'ALL',
    detailSearch: '',
    detailDateFrom: '',
    detailDateTo: '',
    detailUserSearch: '',
  },
  charts: {
    detailCategory: null,
    detailTrend: null,
  },
  recommendations: {},
};

function getAdvisorPage() {
  return document.body?.dataset?.advisorPage || 'overview';
}

function isOverviewPage() {
  return getAdvisorPage() === 'overview';
}

function isUsersPage() {
  return getAdvisorPage() === 'users';
}

function isDetailPage() {
  return getAdvisorPage() === 'detail';
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatArs(value) {
  return `ARS ${Number(value || 0).toFixed(2)}`;
}

function formatOriginal(value, currency = 'ARS') {
  return `${currency} ${Number(value || 0).toFixed(2)}`;
}

function parseDateToIso(value) {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const match = String(value).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const [, day, month, year] = match;
  return `${year}-${month}-${day}`;
}

function formatDateDisplay(dateValue) {
  if (!dateValue) return '-';
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateValue)) return dateValue;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    const [year, month, day] = dateValue.split('-');
    return `${day}/${month}/${year}`;
  }
  return new Date(dateValue).toLocaleDateString('es-AR');
}

function getExpenseUserId(expense) {
  return expense?.user?.id || expense?.userId || null;
}

function groupByCategory(expenses) {
  const map = {};
  expenses.forEach((expense) => {
    const category = expense.category || 'Sin categoría';
    map[category] = (map[category] || 0) + Number(expense.amountArs || 0);
  });
  return map;
}

function groupByDay(expenses) {
  const map = {};
  expenses.forEach((expense) => {
    const key = parseDateToIso(expense.expenseDate);
    if (!key) return;
    map[key] = (map[key] || 0) + Number(expense.amountArs || 0);
  });

  const labels = Object.keys(map).sort((a, b) => new Date(a) - new Date(b));
  return {
    labels: labels.map((label) => formatDateDisplay(label)),
    values: labels.map((label) => map[label]),
  };
}

function getChartPalette() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  return {
    axis: isDark ? '#9ca3af' : '#4b5563',
    grid: isDark ? 'rgba(148, 163, 184, 0.16)' : 'rgba(148, 163, 184, 0.22)',
    primary: isDark ? '#60a5fa' : '#1e3a8a',
    line: isDark ? '#f87171' : '#ef4444',
    lineFill: isDark ? 'rgba(248, 113, 113, 0.2)' : 'rgba(239, 68, 68, 0.16)',
    donut: ['#1e3a8a', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#14b8a6', '#a855f7'],
  };
}

function destroyChart(key) {
  if (advisorState.charts[key]) {
    advisorState.charts[key].destroy();
    advisorState.charts[key] = null;
  }
}

function readRecommendationsStore() {
  try {
    const raw = localStorage.getItem(ADVISOR_RECOMMENDATIONS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeRecommendationsStore(store) {
  localStorage.setItem(ADVISOR_RECOMMENDATIONS_KEY, JSON.stringify(store));
}

function getUserMetrics(expenses) {
  const map = new Map();
  expenses.forEach((expense) => {
    const userId = getExpenseUserId(expense);
    if (!userId) return;

    if (!map.has(userId)) {
      map.set(userId, { count: 0, total: 0 });
    }

    const target = map.get(userId);
    target.count += 1;
    target.total += Number(expense.amountArs || 0);
  });
  return map;
}

function findTopCategory(expenses) {
  const byCategory = groupByCategory(expenses);
  const entries = Object.entries(byCategory);
  if (!entries.length) return '-';
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0];
}

function syncSelectedUserQueryParam() {
  const url = new URL(window.location.href);
  if (advisorState.selectedUserId) {
    url.searchParams.set('userId', advisorState.selectedUserId);
  } else {
    url.searchParams.delete('userId');
  }
  window.history.replaceState({}, '', url);
}

function getSelectedUser() {
  return advisorState.users.find((item) => item.id === advisorState.selectedUserId) || null;
}

function getFilteredUsersForUsersPage() {
  const search = advisorState.filters.search.trim().toLowerCase();
  return advisorState.users.filter((user) => {
    if (advisorState.filters.role !== 'ALL' && user.role !== advisorState.filters.role) {
      return false;
    }

    if (advisorState.filters.status === 'ACTIVE' && !user.isActive) {
      return false;
    }

    if (advisorState.filters.status === 'INACTIVE' && user.isActive) {
      return false;
    }

    if (!search) {
      return true;
    }

    return `${user.fullName} ${user.email}`.toLowerCase().includes(search);
  });
}

function getFilteredUsersForDetailPicker() {
  const search = advisorState.filters.detailUserSearch.trim().toLowerCase();
  if (!search) {
    return advisorState.users;
  }

  return advisorState.users.filter((user) => `${user.fullName} ${user.email}`.toLowerCase().includes(search));
}

function getSelectedUserExpenses() {
  if (!advisorState.selectedUserId) return [];

  const search = advisorState.filters.detailSearch.trim().toLowerCase();
  const dateFrom = advisorState.filters.detailDateFrom || '';
  const dateTo = advisorState.filters.detailDateTo || '';

  return advisorState.expenses
    .filter((expense) => getExpenseUserId(expense) === advisorState.selectedUserId)
    .filter((expense) => {
      if (!search) return true;
      const text = `${expense.merchant || ''} ${expense.category || ''} ${expense.description || ''}`.toLowerCase();
      return text.includes(search);
    })
    .filter((expense) => {
      const dateIso = parseDateToIso(expense.expenseDate);
      if (!dateIso) return false;
      if (dateFrom && dateIso < dateFrom) return false;
      if (dateTo && dateIso > dateTo) return false;
      return true;
    })
    .sort((a, b) => new Date(b.expenseDate) - new Date(a.expenseDate));
}

function renderOverviewPage() {
  if (!isOverviewPage()) return;

  const totalArs = advisorState.expenses.reduce((acc, item) => acc + Number(item.amountArs || 0), 0);
  const userMetrics = getUserMetrics(advisorState.expenses);
  const usersWithExpenses = userMetrics.size;
  const avgPerUser = usersWithExpenses ? totalArs / usersWithExpenses : 0;
  const topCategory = findTopCategory(advisorState.expenses);

  const welcomeName = document.getElementById('advisorWelcomeName');
  if (welcomeName) {
    welcomeName.textContent = advisorState.currentUser?.fullName || 'Asesor';
  }

  const summaryMeta = document.getElementById('advisorSummaryMeta');
  if (summaryMeta) {
    summaryMeta.textContent = `${advisorState.users.length} usuarios registrados · ${advisorState.expenses.length} gastos cargados.`;
  }

  const kpiTotal = document.getElementById('advisorKpiTotal');
  const kpiUsers = document.getElementById('advisorKpiUsers');
  const kpiAvg = document.getElementById('advisorKpiAvg');
  const kpiTopCategory = document.getElementById('advisorKpiTopCategory');

  if (kpiTotal) kpiTotal.textContent = formatArs(totalArs);
  if (kpiUsers) kpiUsers.textContent = String(usersWithExpenses);
  if (kpiAvg) kpiAvg.textContent = formatArs(avgPerUser);
  if (kpiTopCategory) kpiTopCategory.textContent = topCategory;
}

function renderUsersTable() {
  if (!isUsersPage()) return;

  const tbody = document.getElementById('advisorUsersBody');
  const usersResultCount = document.getElementById('advisorUsersResultCount');
  const pageInfo = document.getElementById('advisorUsersPageInfo');
  const prevBtn = document.getElementById('advisorUsersPrev');
  const nextBtn = document.getElementById('advisorUsersNext');
  if (!tbody || !usersResultCount || !pageInfo || !prevBtn || !nextBtn) return;

  const filteredUsers = getFilteredUsersForUsersPage();
  const userMetrics = getUserMetrics(advisorState.expenses);

  const totalUsers = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalUsers / advisorState.pageSize));
  if (advisorState.page > totalPages) {
    advisorState.page = totalPages;
  }

  const start = (advisorState.page - 1) * advisorState.pageSize;
  const rows = filteredUsers.slice(start, start + advisorState.pageSize);

  usersResultCount.textContent = `${totalUsers} resultados`;
  pageInfo.textContent = `Página ${advisorState.page} de ${totalPages}`;
  prevBtn.disabled = advisorState.page <= 1;
  nextBtn.disabled = advisorState.page >= totalPages;

  if (!rows.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center text-secondary py-4">No hay usuarios que coincidan con los filtros.</td></tr>';
    return;
  }

  tbody.innerHTML = rows
    .map((user) => {
      const metrics = userMetrics.get(user.id) || { count: 0, total: 0 };

      return `
      <tr>
        <td>${escapeHtml(user.fullName)}</td>
        <td>${escapeHtml(user.email)}</td>
        <td><span class="status-chip advisor-role-chip">${escapeHtml(user.role)}</span></td>
        <td><span class="status-chip ${user.isActive ? 'good' : 'warn'}">${user.isActive ? 'Activo' : 'Inactivo'}</span></td>
        <td>${metrics.count}</td>
        <td>${formatArs(metrics.total)}</td>
        <td class="text-end"><a class="btn btn-sm btn-neto advisor-view-user" href="advisor-detail.html?userId=${encodeURIComponent(user.id)}">Ver perfil</a></td>
      </tr>`;
    })
    .join('');
}

function renderDetailUserSelect() {
  if (!isDetailPage()) return;

  const select = document.getElementById('advisorDetailUserSelect');
  if (!(select instanceof HTMLSelectElement)) return;

  const visibleUsers = [...getFilteredUsersForDetailPicker()];
  const selectedUser = getSelectedUser();
  if (selectedUser && !visibleUsers.some((user) => user.id === selectedUser.id)) {
    visibleUsers.unshift(selectedUser);
  }

  select.innerHTML = ['<option value="">Seleccionar usuario</option>']
    .concat(
      visibleUsers.map(
        (user) =>
          `<option value="${escapeHtml(user.id)}">${escapeHtml(user.fullName)} · ${escapeHtml(user.email)}</option>`,
      ),
    )
    .join('');

  select.value = advisorState.selectedUserId || '';
}

function renderDetailCharts(expenses) {
  const categoryEmpty = document.getElementById('advisorDetailCategoryEmpty');
  const categoryWrap = document.getElementById('advisorDetailCategoryWrap');
  const trendEmpty = document.getElementById('advisorDetailTrendEmpty');
  const trendWrap = document.getElementById('advisorDetailTrendWrap');
  const categoryCanvas = document.getElementById('advisorDetailCategoryChart');
  const trendCanvas = document.getElementById('advisorDetailTrendChart');

  destroyChart('detailCategory');
  destroyChart('detailTrend');

  if (!categoryEmpty || !categoryWrap || !trendEmpty || !trendWrap || !categoryCanvas || !trendCanvas) return;

  if (!expenses.length) {
    categoryEmpty.classList.remove('d-none');
    categoryWrap.classList.add('d-none');
    trendEmpty.classList.remove('d-none');
    trendWrap.classList.add('d-none');
    return;
  }

  categoryEmpty.classList.add('d-none');
  categoryWrap.classList.remove('d-none');
  trendEmpty.classList.add('d-none');
  trendWrap.classList.remove('d-none');

  const palette = getChartPalette();
  const byCategory = groupByCategory(expenses);
  const byDay = groupByDay(expenses);

  advisorState.charts.detailCategory = new Chart(categoryCanvas, {
    type: 'bar',
    data: {
      labels: Object.keys(byCategory),
      datasets: [
        {
          label: 'Monto ARS',
          data: Object.values(byCategory),
          borderRadius: 8,
          backgroundColor: palette.primary,
        },
      ],
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: palette.axis }, grid: { color: palette.grid } },
        y: { ticks: { color: palette.axis }, grid: { color: palette.grid }, beginAtZero: true },
      },
    },
  });

  advisorState.charts.detailTrend = new Chart(trendCanvas, {
    type: 'line',
    data: {
      labels: byDay.labels,
      datasets: [
        {
          label: 'Gasto diario ARS',
          data: byDay.values,
          borderColor: palette.line,
          backgroundColor: palette.lineFill,
          fill: true,
          tension: 0.35,
        },
      ],
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: palette.axis }, grid: { color: palette.grid } },
        y: { ticks: { color: palette.axis }, grid: { color: palette.grid }, beginAtZero: true },
      },
    },
  });
}

function renderDetailExpensesTable(expenses) {
  const tbody = document.getElementById('advisorDetailExpensesBody');
  if (!tbody) return;

  if (!expenses.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-secondary py-4">No hay gastos para este usuario con el filtro actual.</td></tr>';
    return;
  }

  tbody.innerHTML = expenses
    .slice(0, 14)
    .map(
      (expense) => `
      <tr>
        <td>${formatDateDisplay(expense.expenseDate)}</td>
        <td>${escapeHtml(expense.merchant || '-')}</td>
        <td>${escapeHtml(expense.category || '-')}</td>
        <td>${escapeHtml(expense.source || 'manual')}</td>
        <td>${formatOriginal(expense.originalAmount, expense.currency)}</td>
        <td>${formatArs(expense.amountArs)}</td>
      </tr>`,
    )
    .join('');
}

function renderRecommendations() {
  if (!isDetailPage()) return;

  const list = document.getElementById('advisorRecommendationList');
  if (!list) return;

  if (!advisorState.selectedUserId) {
    list.innerHTML = '<p class="text-secondary mb-0">Seleccioná un usuario para registrar recomendaciones.</p>';
    return;
  }

  const items = advisorState.recommendations[advisorState.selectedUserId] || [];
  if (!items.length) {
    list.innerHTML = '<p class="text-secondary mb-0">Todavía no hay recomendaciones cargadas para este usuario.</p>';
    return;
  }

  list.innerHTML = items
    .map(
      (item) => `
      <div class="recommendation-item advisor-recommendation-item">
        <div class="advisor-recommendation-meta">
          <small class="text-secondary">${new Date(item.createdAt).toLocaleString('es-AR')}</small>
          <button class="btn btn-sm btn-outline-danger" data-recommendation-id="${item.id}" type="button">Eliminar</button>
        </div>
        <p class="mb-0">${escapeHtml(item.content)}</p>
      </div>`,
    )
    .join('');
}

function renderDetailPage() {
  if (!isDetailPage()) return;

  renderDetailUserSelect();

  const empty = document.getElementById('advisorDetailEmpty');
  const content = document.getElementById('advisorDetailContent');
  const user = getSelectedUser();

  if (!user) {
    empty?.classList.remove('d-none');
    content?.classList.add('d-none');
    destroyChart('detailCategory');
    destroyChart('detailTrend');
    renderRecommendations();
    return;
  }

  const expenses = getSelectedUserExpenses();
  const total = expenses.reduce((acc, item) => acc + Number(item.amountArs || 0), 0);
  const avg = expenses.length ? total / expenses.length : 0;

  empty?.classList.add('d-none');
  content?.classList.remove('d-none');

  const detailName = document.getElementById('advisorDetailName');
  const detailEmail = document.getElementById('advisorDetailEmail');
  if (detailName) detailName.textContent = user.fullName;
  if (detailEmail) detailEmail.textContent = user.email;

  const roleNode = document.getElementById('advisorDetailRole');
  if (roleNode) {
    roleNode.textContent = user.role;
    roleNode.className = 'status-chip advisor-role-chip';
  }

  const statusNode = document.getElementById('advisorDetailStatus');
  if (statusNode) {
    statusNode.textContent = user.isActive ? 'Activo' : 'Inactivo';
    statusNode.className = `status-chip ${user.isActive ? 'good' : 'warn'}`;
  }

  const kpiTotal = document.getElementById('advisorDetailKpiTotal');
  const kpiCount = document.getElementById('advisorDetailKpiCount');
  const kpiAvg = document.getElementById('advisorDetailKpiAvg');
  const kpiCategory = document.getElementById('advisorDetailKpiCategory');
  const tableMeta = document.getElementById('advisorDetailTableMeta');

  if (kpiTotal) kpiTotal.textContent = formatArs(total);
  if (kpiCount) kpiCount.textContent = String(expenses.length);
  if (kpiAvg) kpiAvg.textContent = formatArs(avg);
  if (kpiCategory) kpiCategory.textContent = findTopCategory(expenses);
  if (tableMeta) tableMeta.textContent = `${expenses.length} registros`;

  renderDetailCharts(expenses);
  renderDetailExpensesTable(expenses);
  renderRecommendations();
}

function saveRecommendation(text) {
  if (!advisorState.selectedUserId) return;

  const next = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    content: text,
    createdAt: new Date().toISOString(),
    advisorName: advisorState.currentUser?.fullName || 'Asesor',
  };

  const current = advisorState.recommendations[advisorState.selectedUserId] || [];
  advisorState.recommendations[advisorState.selectedUserId] = [next, ...current].slice(0, 25);
  writeRecommendationsStore(advisorState.recommendations);
}

function removeRecommendation(recommendationId) {
  if (!advisorState.selectedUserId || !recommendationId) return;

  const current = advisorState.recommendations[advisorState.selectedUserId] || [];
  advisorState.recommendations[advisorState.selectedUserId] = current.filter((item) => item.id !== recommendationId);
  writeRecommendationsStore(advisorState.recommendations);
}

function bindUsersPageEvents() {
  if (!isUsersPage()) return;

  document.getElementById('advisorSearchInput')?.addEventListener('input', (event) => {
    advisorState.filters.search = event.target.value;
    advisorState.page = 1;
    renderUsersTable();
  });

  document.getElementById('advisorRoleFilter')?.addEventListener('change', (event) => {
    advisorState.filters.role = event.target.value;
    advisorState.page = 1;
    renderUsersTable();
  });

  document.getElementById('advisorStatusFilter')?.addEventListener('change', (event) => {
    advisorState.filters.status = event.target.value;
    advisorState.page = 1;
    renderUsersTable();
  });

  document.getElementById('advisorUsersPrev')?.addEventListener('click', () => {
    if (advisorState.page <= 1) return;
    advisorState.page -= 1;
    renderUsersTable();
  });

  document.getElementById('advisorUsersNext')?.addEventListener('click', () => {
    const totalPages = Math.max(1, Math.ceil(getFilteredUsersForUsersPage().length / advisorState.pageSize));
    if (advisorState.page >= totalPages) return;
    advisorState.page += 1;
    renderUsersTable();
  });
}

function bindDetailPageEvents() {
  if (!isDetailPage()) return;

  const userSelect = document.getElementById('advisorDetailUserSelect');
  if (userSelect instanceof HTMLSelectElement) {
    userSelect.addEventListener('change', (event) => {
      advisorState.selectedUserId = event.target.value || null;
      syncSelectedUserQueryParam();
      renderDetailPage();
    });
  }

  document.getElementById('advisorDetailUserSearch')?.addEventListener('input', (event) => {
    advisorState.filters.detailUserSearch = event.target.value;
    renderDetailUserSelect();
  });

  document.getElementById('advisorDetailSearch')?.addEventListener('input', (event) => {
    advisorState.filters.detailSearch = event.target.value;
    renderDetailPage();
  });

  document.getElementById('advisorDetailDateFrom')?.addEventListener('change', (event) => {
    advisorState.filters.detailDateFrom = event.target.value;
    renderDetailPage();
  });

  document.getElementById('advisorDetailDateTo')?.addEventListener('change', (event) => {
    advisorState.filters.detailDateTo = event.target.value;
    renderDetailPage();
  });

  document.getElementById('advisorRecommendationForm')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const input = document.getElementById('advisorRecommendationInput');
    if (!(input instanceof HTMLTextAreaElement)) return;

    const content = input.value.trim();
    if (!content || !advisorState.selectedUserId) {
      return;
    }

    saveRecommendation(content);
    input.value = '';
    renderRecommendations();
  });

  document.getElementById('advisorRecommendationList')?.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-recommendation-id]');
    if (!button) return;

    const recommendationId = button.getAttribute('data-recommendation-id');
    removeRecommendation(recommendationId);
    renderRecommendations();
  });
}

function bindThemeObserver() {
  const observer = new MutationObserver(() => {
    if (isOverviewPage()) {
      renderOverviewPage();
    }
    if (isDetailPage()) {
      renderDetailPage();
    }
  });

  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
}

async function loadAdvisorData() {
  const mainNode = document.querySelector('main');
  window.NetoUI.clearMessage(mainNode);

  try {
    const [users, expenses] = await Promise.all([window.NetoApi.listUsers(), window.NetoApi.listExpenses()]);
    advisorState.users = [...users].sort((a, b) => a.fullName.localeCompare(b.fullName, 'es'));
    advisorState.expenses = expenses;
  } catch (error) {
    window.NetoUI.showMessage(mainNode, error.message || 'No fue posible cargar los datos del asesor.', 'error');
  }
}

function renderCurrentPage() {
  if (isOverviewPage()) {
    renderOverviewPage();
    return;
  }

  if (isUsersPage()) {
    renderUsersTable();
    return;
  }

  if (isDetailPage()) {
    renderDetailPage();
  }
}

async function initializeAdvisorScreen() {
  window.NetoAuth.requireAuth();

  const currentUser = window.NetoAuth.getCurrentUser();
  if (!currentUser || (currentUser.role !== 'ADVISOR' && currentUser.role !== 'ADMIN')) {
    window.location.href = 'dashboard.html';
    return;
  }

  advisorState.currentUser = currentUser;
  advisorState.recommendations = readRecommendationsStore();

  const queryParams = new URLSearchParams(window.location.search);
  advisorState.selectedUserId = queryParams.get('userId');

  bindUsersPageEvents();
  bindDetailPageEvents();
  bindThemeObserver();

  await loadAdvisorData();

  if (advisorState.selectedUserId && !advisorState.users.some((user) => user.id === advisorState.selectedUserId)) {
    advisorState.selectedUserId = null;
    syncSelectedUserQueryParam();
  }

  renderCurrentPage();
}

document.addEventListener('DOMContentLoaded', initializeAdvisorScreen);

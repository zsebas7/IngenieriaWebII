const advisorState = {
  users: [],
  expenses: [],
  filteredUsers: [],
  selectedUserId: null,
  page: 1,
  pageSize: 8,
  filters: {
    month: '',
    category: 'ALL',
    search: '',
    role: 'ALL',
    status: 'ALL',
    detailSearch: '',
  },
  charts: {
    overviewCategory: null,
    detailCategory: null,
    detailTrend: null,
  },
};

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
    accent: isDark ? '#22c55e' : '#10b981',
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

function renderOverviewCategoryChart(byCategory) {
  const empty = document.getElementById('advisorOverviewChartEmpty');
  const wrap = document.getElementById('advisorOverviewChartWrap');

  destroyChart('overviewCategory');

  const labels = Object.keys(byCategory);
  if (!labels.length) {
    empty?.classList.remove('d-none');
    wrap?.classList.add('d-none');
    return;
  }

  empty?.classList.add('d-none');
  wrap?.classList.remove('d-none');

  const palette = getChartPalette();
  advisorState.charts.overviewCategory = new Chart(document.getElementById('advisorCategoryChart'), {
    type: 'doughnut',
    data: {
      labels,
      datasets: [
        {
          data: labels.map((label) => byCategory[label]),
          backgroundColor: palette.donut,
          borderWidth: 0,
        },
      ],
    },
    options: {
      plugins: {
        legend: { labels: { color: palette.axis } },
      },
    },
  });
}

function renderDetailCharts(expenses) {
  const categoryEmpty = document.getElementById('advisorDetailCategoryEmpty');
  const categoryWrap = document.getElementById('advisorDetailCategoryWrap');
  const trendEmpty = document.getElementById('advisorDetailTrendEmpty');
  const trendWrap = document.getElementById('advisorDetailTrendWrap');

  destroyChart('detailCategory');
  destroyChart('detailTrend');

  if (!expenses.length) {
    categoryEmpty?.classList.remove('d-none');
    categoryWrap?.classList.add('d-none');
    trendEmpty?.classList.remove('d-none');
    trendWrap?.classList.add('d-none');
    return;
  }

  categoryEmpty?.classList.add('d-none');
  categoryWrap?.classList.remove('d-none');
  trendEmpty?.classList.add('d-none');
  trendWrap?.classList.remove('d-none');

  const palette = getChartPalette();
  const byCategory = groupByCategory(expenses);
  const byDay = groupByDay(expenses);

  advisorState.charts.detailCategory = new Chart(document.getElementById('advisorDetailCategoryChart'), {
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

  advisorState.charts.detailTrend = new Chart(document.getElementById('advisorDetailTrendChart'), {
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

function getFilteredUsers() {
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

function getExpensesForUsers(users) {
  const ids = new Set(users.map((user) => user.id));
  return advisorState.expenses.filter((expense) => ids.has(getExpenseUserId(expense)));
}

function findTopCategory(expenses) {
  const byCategory = groupByCategory(expenses);
  const entries = Object.entries(byCategory);
  if (!entries.length) return '-';
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0];
}

function syncSelectedUser() {
  const ids = new Set(advisorState.filteredUsers.map((user) => user.id));
  if (advisorState.selectedUserId && ids.has(advisorState.selectedUserId)) {
    return;
  }
  advisorState.selectedUserId = advisorState.filteredUsers[0]?.id || null;
}

function syncUserQueryParam() {
  const url = new URL(window.location.href);
  if (advisorState.selectedUserId) {
    url.searchParams.set('userId', advisorState.selectedUserId);
  } else {
    url.searchParams.delete('userId');
  }
  window.history.replaceState({}, '', url);
}

function renderOverview() {
  const expensesForVisibleUsers = getExpensesForUsers(advisorState.filteredUsers);
  const userMetrics = getUserMetrics(expensesForVisibleUsers);
  const totalArs = expensesForVisibleUsers.reduce((acc, item) => acc + Number(item.amountArs || 0), 0);
  const usersWithExpenses = userMetrics.size;
  const avgPerUser = usersWithExpenses ? totalArs / usersWithExpenses : 0;
  const topCategory = findTopCategory(expensesForVisibleUsers);

  document.getElementById('advisorKpiTotal').textContent = formatArs(totalArs);
  document.getElementById('advisorKpiUsers').textContent = String(usersWithExpenses);
  document.getElementById('advisorKpiAvg').textContent = formatArs(avgPerUser);
  document.getElementById('advisorKpiTopCategory').textContent = topCategory;
  document.getElementById('advisorSummaryMeta').textContent = `${advisorState.filteredUsers.length} usuarios filtrados · ${expensesForVisibleUsers.length} gastos en el período.`;

  renderOverviewCategoryChart(groupByCategory(expensesForVisibleUsers));

  const topUsers = [...advisorState.filteredUsers]
    .map((user) => {
      const metrics = userMetrics.get(user.id) || { count: 0, total: 0 };
      return { user, ...metrics };
    })
    .filter((item) => item.count > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const target = document.getElementById('advisorTopUsersBody');
  if (!topUsers.length) {
    target.innerHTML = '<tr><td colspan="3" class="text-center text-secondary py-4">No hay usuarios con gastos para este filtro.</td></tr>';
    return;
  }

  target.innerHTML = topUsers
    .map(
      (item) => `
      <tr>
        <td>${escapeHtml(item.user.fullName)}</td>
        <td>${item.count}</td>
        <td>${formatArs(item.total)}</td>
      </tr>`,
    )
    .join('');
}

function renderUsersTable() {
  const tbody = document.getElementById('advisorUsersBody');
  const usersResultCount = document.getElementById('advisorUsersResultCount');
  const pageInfo = document.getElementById('advisorUsersPageInfo');
  const prevBtn = document.getElementById('advisorUsersPrev');
  const nextBtn = document.getElementById('advisorUsersNext');
  const userMetrics = getUserMetrics(advisorState.expenses);

  const totalUsers = advisorState.filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalUsers / advisorState.pageSize));
  if (advisorState.page > totalPages) {
    advisorState.page = totalPages;
  }

  const start = (advisorState.page - 1) * advisorState.pageSize;
  const rows = advisorState.filteredUsers.slice(start, start + advisorState.pageSize);

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
      const isSelected = advisorState.selectedUserId === user.id;

      return `
      <tr>
        <td>${escapeHtml(user.fullName)}</td>
        <td>${escapeHtml(user.email)}</td>
        <td><span class="status-chip advisor-role-chip">${escapeHtml(user.role)}</span></td>
        <td><span class="status-chip ${user.isActive ? 'good' : 'warn'}">${user.isActive ? 'Activo' : 'Inactivo'}</span></td>
        <td>${metrics.count}</td>
        <td>${formatArs(metrics.total)}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-neto advisor-view-user ${isSelected ? 'active' : ''}" data-user-id="${user.id}">Ver detalle</button>
        </td>
      </tr>`;
    })
    .join('');
}

function getSelectedUser() {
  return advisorState.users.find((item) => item.id === advisorState.selectedUserId) || null;
}

function getSelectedUserExpenses() {
  if (!advisorState.selectedUserId) return [];

  const search = advisorState.filters.detailSearch.trim().toLowerCase();

  return advisorState.expenses
    .filter((expense) => getExpenseUserId(expense) === advisorState.selectedUserId)
    .filter((expense) => {
      if (!search) return true;
      const text = `${expense.merchant || ''} ${expense.category || ''} ${expense.description || ''}`.toLowerCase();
      return text.includes(search);
    })
    .sort((a, b) => new Date(b.expenseDate) - new Date(a.expenseDate));
}

function renderDetail() {
  const empty = document.getElementById('advisorDetailEmpty');
  const content = document.getElementById('advisorDetailContent');
  const user = getSelectedUser();

  if (!user) {
    empty.classList.remove('d-none');
    content.classList.add('d-none');
    destroyChart('detailCategory');
    destroyChart('detailTrend');
    return;
  }

  const expenses = getSelectedUserExpenses();
  const total = expenses.reduce((acc, item) => acc + Number(item.amountArs || 0), 0);
  const avg = expenses.length ? total / expenses.length : 0;

  empty.classList.add('d-none');
  content.classList.remove('d-none');

  document.getElementById('advisorDetailName').textContent = user.fullName;
  document.getElementById('advisorDetailEmail').textContent = user.email;

  const roleNode = document.getElementById('advisorDetailRole');
  roleNode.textContent = user.role;
  roleNode.className = 'status-chip advisor-role-chip';

  const statusNode = document.getElementById('advisorDetailStatus');
  statusNode.textContent = user.isActive ? 'Activo' : 'Inactivo';
  statusNode.className = `status-chip ${user.isActive ? 'good' : 'warn'}`;

  document.getElementById('advisorDetailKpiTotal').textContent = formatArs(total);
  document.getElementById('advisorDetailKpiCount').textContent = String(expenses.length);
  document.getElementById('advisorDetailKpiAvg').textContent = formatArs(avg);
  document.getElementById('advisorDetailKpiCategory').textContent = findTopCategory(expenses);
  document.getElementById('advisorDetailTableMeta').textContent = `${expenses.length} registros`;

  renderDetailCharts(expenses);
  renderDetailExpensesTable(expenses);
}

function renderDetailExpensesTable(expenses) {
  const tbody = document.getElementById('advisorDetailExpensesBody');
  if (!expenses.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-secondary py-4">No hay gastos para este usuario con el filtro actual.</td></tr>';
    return;
  }

  tbody.innerHTML = expenses
    .slice(0, 12)
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

function updateCategoryOptions() {
  const select = document.getElementById('advisorCategoryFilter');
  const categories = [...new Set(advisorState.expenses.map((item) => item.category).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'es'),
  );

  if (advisorState.filters.category !== 'ALL' && !categories.includes(advisorState.filters.category)) {
    categories.unshift(advisorState.filters.category);
  }

  const options = ['<option value="ALL">Todas las categorías</option>']
    .concat(categories.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`))
    .join('');

  select.innerHTML = options;
  if (advisorState.filters.category === 'ALL' || categories.includes(advisorState.filters.category)) {
    select.value = advisorState.filters.category;
  } else {
    advisorState.filters.category = 'ALL';
    select.value = 'ALL';
  }
}

function applyFiltersAndRender() {
  advisorState.filteredUsers = getFilteredUsers();
  syncSelectedUser();
  syncUserQueryParam();
  renderOverview();
  renderUsersTable();
  renderDetail();
}

function setLoading(loading) {
  const btn = document.getElementById('advisorReloadBtn');
  if (!btn) return;
  btn.disabled = loading;
  btn.textContent = loading ? 'Actualizando...' : 'Actualizar';
}

async function loadAdvisorData() {
  const mainNode = document.querySelector('main');
  window.NetoUI.clearMessage(mainNode);
  setLoading(true);

  try {
    const [users, expenses] = await Promise.all([
      window.NetoApi.listUsers(),
      window.NetoApi.listExpenses({
        month: advisorState.filters.month || undefined,
        category: advisorState.filters.category !== 'ALL' ? advisorState.filters.category : undefined,
      }),
    ]);

    advisorState.users = [...users].sort((a, b) => a.fullName.localeCompare(b.fullName, 'es'));
    advisorState.expenses = expenses;
    updateCategoryOptions();
    applyFiltersAndRender();
  } catch (error) {
    window.NetoUI.showMessage(mainNode, error.message || 'No fue posible cargar los datos del asesor.', 'error');
  } finally {
    setLoading(false);
  }
}

function updateNavChip() {
  const hash = window.location.hash || '#advisorOverview';
  document.querySelectorAll('.advisor-nav-chip').forEach((chip) => {
    chip.classList.toggle('active', chip.getAttribute('href') === hash);
  });
}

function bindEvents() {
  document.getElementById('advisorReloadBtn')?.addEventListener('click', loadAdvisorData);

  document.getElementById('advisorMonthInput')?.addEventListener('change', (event) => {
    advisorState.filters.month = event.target.value;
    loadAdvisorData();
  });

  document.getElementById('advisorCategoryFilter')?.addEventListener('change', (event) => {
    advisorState.filters.category = event.target.value;
    loadAdvisorData();
  });

  document.getElementById('advisorSearchInput')?.addEventListener('input', (event) => {
    advisorState.filters.search = event.target.value;
    advisorState.page = 1;
    applyFiltersAndRender();
  });

  document.getElementById('advisorRoleFilter')?.addEventListener('change', (event) => {
    advisorState.filters.role = event.target.value;
    advisorState.page = 1;
    applyFiltersAndRender();
  });

  document.getElementById('advisorStatusFilter')?.addEventListener('change', (event) => {
    advisorState.filters.status = event.target.value;
    advisorState.page = 1;
    applyFiltersAndRender();
  });

  document.getElementById('advisorDetailSearch')?.addEventListener('input', (event) => {
    advisorState.filters.detailSearch = event.target.value;
    renderDetail();
  });

  document.getElementById('advisorUsersPrev')?.addEventListener('click', () => {
    if (advisorState.page <= 1) return;
    advisorState.page -= 1;
    renderUsersTable();
  });

  document.getElementById('advisorUsersNext')?.addEventListener('click', () => {
    const totalPages = Math.max(1, Math.ceil(advisorState.filteredUsers.length / advisorState.pageSize));
    if (advisorState.page >= totalPages) return;
    advisorState.page += 1;
    renderUsersTable();
  });

  document.getElementById('advisorUsersBody')?.addEventListener('click', (event) => {
    const btn = event.target.closest('.advisor-view-user');
    if (!btn) return;

    const nextUserId = btn.getAttribute('data-user-id');
    if (!nextUserId) return;

    advisorState.selectedUserId = nextUserId;
    syncUserQueryParam();
    renderUsersTable();
    renderDetail();

    window.location.hash = '#advisorDetail';
    updateNavChip();
  });

  window.addEventListener('hashchange', updateNavChip);

  document.querySelectorAll('.advisor-nav-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      window.setTimeout(updateNavChip, 10);
    });
  });

  const observer = new MutationObserver(() => {
    renderOverview();
    renderDetail();
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
}

function initializeAdvisorScreen() {
  window.NetoAuth.requireAuth();
  const currentUser = window.NetoAuth.getCurrentUser();
  if (!currentUser || (currentUser.role !== 'ADVISOR' && currentUser.role !== 'ADMIN')) {
    window.location.href = 'dashboard.html';
    return;
  }

  const monthInput = document.getElementById('advisorMonthInput');
  advisorState.filters.month = new Date().toISOString().slice(0, 7);
  monthInput.value = advisorState.filters.month;

  const queryParams = new URLSearchParams(window.location.search);
  advisorState.selectedUserId = queryParams.get('userId');

  document.getElementById('advisorWelcomeName').textContent = currentUser.fullName || 'Asesor';

  bindEvents();
  updateNavChip();
  loadAdvisorData();
}

document.addEventListener('DOMContentLoaded', initializeAdvisorScreen);

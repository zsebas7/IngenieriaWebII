async function loadDashboard() {
  window.NetoAuth.requireAuth();
  const user = window.NetoAuth.getCurrentUser();

  const month = document.getElementById('monthInput').value;
  const dashboard = await window.NetoApi.myDashboard(month);
  const expenses = await window.NetoApi.listExpenses();
  const recommendations = await window.NetoApi.listRecommendations();

  document.getElementById('welcomeName').textContent = user.fullName;
  document.getElementById('kpiTotal').textContent = `ARS ${dashboard.totalMonthArs.toFixed(2)}`;
  document.getElementById('kpiAverage').textContent = `ARS ${dashboard.averageExpenseArs.toFixed(2)}`;
  document.getElementById('kpiCategory').textContent = dashboard.topCategory;
  document.getElementById('kpiVariation').textContent = `${dashboard.variationVsLastMonth}%`;

  renderCategoryChart(dashboard.byCategory);
  renderExpenses(expenses.slice(0, 8));
  renderRecommendations(recommendations);
  renderBudgetProgress(dashboard.budgetProgress);
}

function renderCategoryChart(byCategory) {
  const ctx = document.getElementById('categoryChart');
  if (!ctx) return;

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const palette = isDark
    ? ['#60a5fa', '#3b82f6', '#22c55e', '#fbbf24', '#f87171', '#c084fc', '#38bdf8']
    : ['#1e3a8a', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#0ea5e9'];

  if (window.netoCategoryChart) {
    window.netoCategoryChart.destroy();
  }

  window.netoCategoryChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: Object.keys(byCategory),
      datasets: [
        {
          data: Object.values(byCategory),
          borderWidth: 0,
          backgroundColor: palette,
        },
      ],
    },
    options: {
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 10,
          },
        },
      },
      cutout: '65%',
    },
  });
}

function renderExpenses(expenses) {
  const tbody = document.getElementById('expensesBody');
  if (!tbody) return;

  if (!expenses.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-secondary py-4">Aún no hay gastos cargados.</td></tr>';
    return;
  }

  tbody.innerHTML = expenses
    .map(
      (expense) => `
      <tr>
        <td>${expense.expenseDate}</td>
        <td>${expense.merchant}</td>
        <td>${expense.category}</td>
        <td>${expense.currency} ${Number(expense.originalAmount).toFixed(2)}</td>
        <td>ARS ${Number(expense.amountArs).toFixed(2)}</td>
      </tr>`,
    )
    .join('');
}

function renderRecommendations(items) {
  const container = document.getElementById('recommendations');
  if (!container) return;

  if (!items.length) {
    container.innerHTML = '<p class="text-secondary">Todavía no hay recomendaciones.</p>';
    return;
  }

  container.innerHTML = items
    .slice(0, 4)
    .map(
      (item) => `
      <div class="recommendation-item">
        <small class="text-secondary">${new Date(item.createdAt).toLocaleString()}</small>
        <p class="mb-0">${item.content}</p>
      </div>`,
    )
    .join('');
}

function renderBudgetProgress(items) {
  const list = document.getElementById('budgetProgress');
  if (!list) return;

  list.innerHTML = items
    .map(
      (item) => `
      <div class="mb-2">
        <div class="d-flex justify-content-between">
          <span>${item.category}</span>
          <span>${item.progressPercent.toFixed(1)}%</span>
        </div>
        <div class="progress progress-modern">
          <div class="progress-bar" style="width:${Math.min(item.progressPercent, 100)}%"></div>
        </div>
      </div>`,
    )
    .join('');
}

document.addEventListener('DOMContentLoaded', () => {
  const monthInput = document.getElementById('monthInput');
  monthInput.value = new Date().toISOString().slice(0, 7);

  document.getElementById('reloadDashboard')?.addEventListener('click', loadDashboard);

  document.getElementById('generateRecommendation')?.addEventListener('click', async () => {
    await window.NetoApi.generateRecommendation();
    loadDashboard();
  });

  loadDashboard();
});

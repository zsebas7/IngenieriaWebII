function formatArs(value) {
  return `ARS ${Number(value || 0).toFixed(2)}`;
}

function groupExpensesByDay(expenses) {
  const totals = {};
  expenses.forEach((expense) => {
    const key = expense.expenseDate;
    totals[key] = (totals[key] || 0) + Number(expense.amountArs || 0);
  });

  const labels = Object.keys(totals).sort();
  return {
    labels,
    values: labels.map((label) => totals[label]),
  };
}

function renderCategoryBreakdown(byCategory) {
  const target = document.getElementById('categoryBreakdown');
  if (!target) return;

  const entries = Object.entries(byCategory);
  if (!entries.length) {
    target.innerHTML = '<p class="text-secondary mb-0">No hay datos para este mes.</p>';
    return;
  }

  target.innerHTML = entries
    .map(
      ([category, total]) => `
      <div class="breakdown-item">
        <span>${category}</span>
        <strong>${formatArs(total)}</strong>
      </div>`,
    )
    .join('');
}

function renderCharts(byCategory, expenses) {
  const categoryCtx = document.getElementById('categoryChart');
  const dailyCtx = document.getElementById('dailyChart');

  if (window.netoStatsCategoryChart) {
    window.netoStatsCategoryChart.destroy();
  }
  if (window.netoDailyChart) {
    window.netoDailyChart.destroy();
  }

  window.netoStatsCategoryChart = new Chart(categoryCtx, {
    type: 'bar',
    data: {
      labels: Object.keys(byCategory),
      datasets: [
        {
          label: 'Monto ARS',
          data: Object.values(byCategory),
          borderRadius: 8,
          backgroundColor: '#0ea5a3',
        },
      ],
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } },
    },
  });

  const daily = groupExpensesByDay(expenses);
  window.netoDailyChart = new Chart(dailyCtx, {
    type: 'line',
    data: {
      labels: daily.labels,
      datasets: [
        {
          label: 'Gasto diario ARS',
          data: daily.values,
          borderColor: '#f97316',
          backgroundColor: 'rgba(249, 115, 22, 0.2)',
          fill: true,
          tension: 0.35,
        },
      ],
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } },
    },
  });
}

async function loadStats() {
  const month = document.getElementById('monthInput').value;
  const dashboard = await window.NetoApi.myDashboard(month);
  const expenses = await window.NetoApi.listExpenses();

  document.getElementById('kpiTotal').textContent = formatArs(dashboard.totalMonthArs);
  document.getElementById('kpiAverage').textContent = formatArs(dashboard.averageExpenseArs);
  document.getElementById('kpiTransactions').textContent = String(expenses.length);
  document.getElementById('kpiCategory').textContent = dashboard.topCategory || '-';

  renderCharts(dashboard.byCategory || {}, expenses);
  renderCategoryBreakdown(dashboard.byCategory || {});
}

document.addEventListener('DOMContentLoaded', () => {
  window.NetoAuth.requireAuth();

  const monthInput = document.getElementById('monthInput');
  monthInput.value = new Date().toISOString().slice(0, 7);

  document.getElementById('reloadStats')?.addEventListener('click', loadStats);
  loadStats();
});

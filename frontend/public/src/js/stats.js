function formatArs(value) {
  return `ARS ${Number(value || 0).toFixed(2)}`;
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

function groupExpensesByDay(expenses) {
  const totals = {};
  expenses.forEach((expense) => {
    const key = /^\d{4}-\d{2}-\d{2}$/.test(expense.expenseDate || '')
      ? expense.expenseDate
      : parseDateToIso(expense.expenseDate);
    if (!key) return;
    totals[key] = (totals[key] || 0) + Number(expense.amountArs || 0);
  });

  const labels = Object.keys(totals).sort((a, b) => new Date(a) - new Date(b));
  return {
    labels: labels.map((label) => formatDateDisplay(label)),
    values: labels.map((label) => totals[label]),
  };
}

function parseDateToIso(value) {
  const match = String(value || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const [, day, month, year] = match;
  return `${year}-${month}-${day}`;
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
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const categoryColor = isDark ? '#60a5fa' : '#1e3a8a';
  const lineColor = isDark ? '#f87171' : '#ef4444';
  const lineFill = isDark ? 'rgba(248, 113, 113, 0.2)' : 'rgba(239, 68, 68, 0.16)';
  const tickColor = isDark ? '#9ca3af' : '#4b5563';
  const gridColor = isDark ? 'rgba(148, 163, 184, 0.16)' : 'rgba(148, 163, 184, 0.22)';

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
          backgroundColor: categoryColor,
        },
      ],
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: tickColor }, grid: { color: gridColor } },
        y: { beginAtZero: true, ticks: { color: tickColor }, grid: { color: gridColor } },
      },
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
          borderColor: lineColor,
          backgroundColor: lineFill,
          fill: true,
          tension: 0.35,
        },
      ],
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: tickColor }, grid: { color: gridColor } },
        y: { beginAtZero: true, ticks: { color: tickColor }, grid: { color: gridColor } },
      },
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

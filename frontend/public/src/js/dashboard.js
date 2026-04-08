const MONTH_NAMES_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function formatMonthLabel(monthValue) {
  const match = String(monthValue || '').match(/^(\d{4})-(\d{2})$/);
  if (!match) return '-';
  const [, year, month] = match;
  const monthIndex = Number(month) - 1;
  if (monthIndex < 0 || monthIndex > 11) return '-';
  return `${MONTH_NAMES_ES[monthIndex]} ${year}`;
}

function syncMonthChip() {
  const monthInput = document.getElementById('monthInput');
  const monthChip = document.getElementById('monthChip');
  if (!monthInput || !monthChip) return;
  const label = formatMonthLabel(monthInput.value);
  monthChip.textContent = label;
  monthChip.title = `Período seleccionado: ${label}`;
}

function ensureYearOptions(yearSelect) {
  if (!(yearSelect instanceof HTMLSelectElement)) return;
  if (yearSelect.options.length) return;

  const currentYear = new Date().getFullYear();
  for (let year = currentYear - 10; year <= currentYear + 5; year += 1) {
    const option = document.createElement('option');
    option.value = String(year);
    option.textContent = String(year);
    yearSelect.appendChild(option);
  }
}

function syncPopoverFromMonthInput() {
  const monthInput = document.getElementById('monthInput');
  const monthSelect = document.getElementById('monthSelect');
  const yearSelect = document.getElementById('yearSelect');
  if (!(monthInput instanceof HTMLInputElement) || !(monthSelect instanceof HTMLSelectElement) || !(yearSelect instanceof HTMLSelectElement)) return;

  ensureYearOptions(yearSelect);
  const match = String(monthInput.value || '').match(/^(\d{4})-(\d{2})$/);
  if (!match) return;
  const [, year, month] = match;
  yearSelect.value = year;
  monthSelect.value = month;
}

function toggleMonthPopover(shouldOpen) {
  const popover = document.getElementById('monthPopover');
  if (!(popover instanceof HTMLElement)) return;

  const open = shouldOpen ?? popover.hidden;
  if (open) {
    syncPopoverFromMonthInput();
    popover.hidden = false;
    return;
  }

  popover.hidden = true;
}

async function applyMonthFromPopover() {
  const monthInput = document.getElementById('monthInput');
  const monthSelect = document.getElementById('monthSelect');
  const yearSelect = document.getElementById('yearSelect');
  if (!(monthInput instanceof HTMLInputElement) || !(monthSelect instanceof HTMLSelectElement) || !(yearSelect instanceof HTMLSelectElement)) return;

  const nextValue = `${yearSelect.value}-${monthSelect.value}`;
  if (monthInput.value === nextValue) {
    toggleMonthPopover(false);
    return;
  }

  monthInput.value = nextValue;
  syncMonthChip();
  toggleMonthPopover(false);
  await loadDashboard();
}

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

function formatDateDisplay(dateValue) {
  if (!dateValue) return '-';
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateValue)) return dateValue;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    const [year, month, day] = dateValue.split('-');
    return `${day}/${month}/${year}`;
  }
  return new Date(dateValue).toLocaleDateString('es-AR');
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
        <td>${formatDateDisplay(expense.expenseDate)}</td>
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
        <small class="text-secondary">${new Date(item.createdAt).toLocaleString('es-AR')}</small>
        <p class="mb-0">${item.content}</p>
      </div>`,
    )
    .join('');
}

function renderBudgetProgress(items) {
  const list = document.getElementById('budgetProgress');
  if (!list) return;

  if (!Array.isArray(items) || items.length === 0) {
    list.innerHTML = '<p class="text-secondary mb-0">No hay presupuestos cargados para este mes.</p>';
    return;
  }

  list.innerHTML = items
    .map((item) => {
      const limitAmount = Number(item.limitAmount || 0);
      const usedAmount = Number(item.used || 0);
      const remainingAmount = Math.max(limitAmount - usedAmount, 0);
      const overAmount = Math.max(usedAmount - limitAmount, 0);
      const ratio = limitAmount > 0 ? usedAmount / limitAmount : 0;
      const progressPercent = Math.max(0, Math.min(ratio * 100, 100));

      let statusClass = 'budget-progress-value--good';
      let progressBarClass = 'progress-bar--good';
      let statusLabel = `Margen hasta el limite: ARS ${remainingAmount.toFixed(2)}`;

      if (ratio > 1) {
        statusClass = 'budget-progress-value--danger';
        progressBarClass = 'progress-bar--danger';
        statusLabel = `Exceso sobre el limite: ARS ${overAmount.toFixed(2)}`;
      } else if (ratio >= 0.85) {
        statusClass = 'budget-progress-value--warn';
        progressBarClass = 'progress-bar--warn';
        statusLabel = `Margen restante critico: ARS ${remainingAmount.toFixed(2)}`;
      }

        return `
        <div class="budget-progress-item">
          <div class="budget-progress-row">
          <span>${item.category}</span>
          <span class="budget-progress-value ${statusClass}">${statusLabel}</span>
        </div>
          <div class="progress progress-modern">
            <div class="progress-bar ${progressBarClass}" style="width:${progressPercent}%"></div>
        </div>
      </div>`;
    })
    .join('');
}

document.addEventListener('DOMContentLoaded', () => {
  const monthInput = document.getElementById('monthInput');
  monthInput.value = new Date().toISOString().slice(0, 7);
  syncMonthChip();

  const monthChip = document.getElementById('monthChip');
  monthChip?.addEventListener('click', () => toggleMonthPopover());

  document.getElementById('cancelMonthBtn')?.addEventListener('click', () => {
    toggleMonthPopover(false);
  });

  document.getElementById('applyMonthBtn')?.addEventListener('click', async () => {
    await applyMonthFromPopover();
  });

  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const wrap = document.querySelector('.period-picker-wrap');
    if (!(wrap instanceof HTMLElement)) return;
    if (wrap.contains(target)) return;
    toggleMonthPopover(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    toggleMonthPopover(false);
  });

  monthInput.addEventListener('change', async () => {
    syncMonthChip();
    await loadDashboard();
  });

  document.getElementById('generateRecommendation')?.addEventListener('click', async () => {
    await window.NetoApi.generateRecommendation();
    loadDashboard();
  });

  loadDashboard();
});

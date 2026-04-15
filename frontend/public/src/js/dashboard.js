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
  const [dashboard, expenses, recommendations, goals] = await Promise.all([
    window.NetoApi.myDashboard(month),
    window.NetoApi.listExpenses(),
    window.NetoApi.listRecommendations(),
    window.NetoApi.listGoals(),
  ]);

  document.getElementById('welcomeName').textContent = user.fullName;
  document.getElementById('kpiTotal').textContent = `ARS ${dashboard.totalMonthArs.toFixed(2)}`;
  document.getElementById('kpiAverage').textContent = `ARS ${dashboard.averageExpenseArs.toFixed(2)}`;
  document.getElementById('kpiCategory').textContent = dashboard.topCategory;

  renderCategoryChart(dashboard.byCategory);
  renderExpenses(expenses.slice(0, 8));
  renderRecommendations(recommendations);
  renderBudgetProgress(dashboard.budgetProgress);
  renderGoalProgress(goals);
}

function parseApiDate(dateValue) {
  const value = String(dateValue || '').trim();
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const [, year, month, day] = match;
  const parsed = new Date(Number(year), Number(month) - 1, Number(day));
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function daysUntilDeadline(dateValue) {
  const deadline = parseApiDate(dateValue);
  if (!deadline) return null;

  const today = new Date();
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const target = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate());
  return Math.round((target.getTime() - startToday.getTime()) / 86400000);
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
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 1.12,
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

function renderGoalProgress(items) {
  const list = document.getElementById('goalProgress');
  if (!list) return;

  if (!Array.isArray(items) || items.length === 0) {
    list.innerHTML = '<p class="text-secondary mb-0">No hay metas cargadas.</p>';
    return;
  }

  const activeGoals = items.filter((goal) => {
    const saved = Number(goal.savedAmount || 0);
    const target = Number(goal.targetAmount || 0);
    const isCompleted = target > 0 && saved >= target;
    const daysLeft = daysUntilDeadline(goal.deadline);
    const isExpired = daysLeft !== null && daysLeft < 0;
    return !isCompleted && !isExpired;
  });

  if (activeGoals.length === 0) {
    list.innerHTML = '<p class="text-secondary mb-0">No hay metas activas en este momento.</p>';
    return;
  }

  list.innerHTML = activeGoals
    .slice(0, 2)
    .map((goal) => {
      const target = Number(goal.targetAmount || 0);
      const saved = Number(goal.savedAmount || 0);
      const remaining = Math.max(target - saved, 0);
      const ratio = target > 0 ? saved / target : 0;
      const progressPercent = Math.max(0, Math.min(ratio * 100, 100));
      const daysLeft = daysUntilDeadline(goal.deadline);
      const urgency = daysLeft !== null && daysLeft <= 3 ? 'goal-urgency goal-urgency--danger' : 'goal-urgency';
      const deadlineText =
        daysLeft === null
          ? 'Fecha no disponible'
          : daysLeft === 0
            ? 'Vence hoy'
            : `Faltan ${daysLeft} dia${daysLeft === 1 ? '' : 's'}`;
      const goalLink = `goals.html?goal=${encodeURIComponent(goal.id || '')}`;

      return `
        <a class="budget-progress-item dashboard-drilldown" href="${goalLink}" title="Ver detalle de meta">
          <div class="budget-progress-row">
            <span>${goal.title || 'Meta'}</span>
            <span class="budget-progress-value budget-progress-value--good">${progressPercent.toFixed(1)}%</span>
          </div>
          <div class="planning-item-meta">Ahorrado: ${goal.currency || 'ARS'} ${saved.toFixed(2)} | Falta: ${goal.currency || 'ARS'} ${remaining.toFixed(2)}</div>
          <div class="planning-item-meta ${urgency}">${deadlineText}</div>
          <div class="progress progress-modern mt-2">
            <div class="progress-bar progress-bar--good" style="width:${progressPercent}%"></div>
          </div>
        </a>
      `;
    })
    .join('');
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

  const advisorRecommendations = Array.isArray(items)
    ? items.filter((item) => String(item?.source || '').startsWith('advisor:'))
    : [];

  if (!advisorRecommendations.length) {
    container.innerHTML = '<p class="text-secondary">Todavía no hay recomendaciones de tu asesor.</p>';
    return;
  }

  container.innerHTML = advisorRecommendations
    .slice(0, 3)
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
    .slice(0, 2)
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

      const planningLink = `planning.html?category=${encodeURIComponent(item.category || '')}`;

        return `
        <a class="budget-progress-item dashboard-drilldown" href="${planningLink}" title="Ver detalle de presupuesto">
          <div class="budget-progress-row">
          <span>${item.category}</span>
          <span class="budget-progress-value ${statusClass}">${statusLabel}</span>
        </div>
          <div class="progress progress-modern">
            <div class="progress-bar ${progressBarClass}" style="width:${progressPercent}%"></div>
        </div>
      </a>`;
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

  loadDashboard();
});

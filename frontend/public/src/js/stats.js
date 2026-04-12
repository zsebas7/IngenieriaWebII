function formatArs(value) {
  return `ARS ${Number(value || 0).toFixed(2)}`;
}

function formatArsCompact(value) {
  const amount = Number(value || 0);
  const absAmount = Math.abs(amount);

  if (absAmount >= 1000 && absAmount < 1000000) {
    const inThousands = amount / 1000;
    const thousandsFormatted = inThousands.toLocaleString('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    });
    return `ARS ${thousandsFormatted} mil`;
  }

  const defaultFormatted = amount.toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return `ARS ${defaultFormatted}`;
}

let currentStatsExpenses = [];
let selectedCategory = null;
let editingExpenseId = null;
let deletingExpenseId = null;
const MONTH_NAMES_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function showStatsToast(message, type = 'success') {
  if (window.NetoToast?.show) {
    window.NetoToast.show(message, type, { stackId: 'statsToastStack', leaveDelay: 2300, removeDelay: 220 });
    return;
  }
}

function eyeIcon() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>';
}

function pencilIcon() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';
}

function trashIcon() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>';
}

function escapeHtmlAttr(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
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

function parseDateToApi(value) {
  const trimmed = String(value || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  return parseDateToIso(trimmed);
}

function maskDateInputValue(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function applyDateMasks(root = document) {
  const dateInputs = root.querySelectorAll('input[data-date-mask="ddmmyyyy"]');
  dateInputs.forEach((input) => {
    input.addEventListener('input', () => {
      const masked = maskDateInputValue(input.value);
      if (input.value !== masked) input.value = masked;
    });
  });
}

function getSelectedMonth() {
  const value = document.getElementById('monthInput')?.value || '';
  return /^\d{4}-\d{2}$/.test(value) ? value : new Date().toISOString().slice(0, 7);
}

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
  await loadStats();
}

function toIsoDate(expenseDate) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(expenseDate || '')) return expenseDate;
  return parseDateToIso(expenseDate);
}

function filterExpensesBySelectedMonth(expenses) {
  const selectedMonth = getSelectedMonth();
  return (expenses || []).filter((expense) => {
    const iso = toIsoDate(expense.expenseDate);
    return iso ? iso.startsWith(selectedMonth) : false;
  });
}

function buildCategoryTotals(expenses) {
  const totals = {};
  expenses.forEach((expense) => {
    const key = expense.category || 'Otros';
    totals[key] = (totals[key] || 0) + Number(expense.amountArs || 0);
  });
  return totals;
}

function computeDetailedStats(expenses) {
  if (!expenses.length) {
    return {
      maxExpense: '-',
      peakDay: '-',
      peakDayFull: '-',
      categories: '0',
      activeDays: '0',
    };
  }

  const maxExpense = expenses.reduce((acc, item) => (Number(item.amountArs || 0) > Number(acc.amountArs || 0) ? item : acc), expenses[0]);
  const byDay = groupExpensesByDay(expenses);
  const dayPairs = byDay.labels.map((label, index) => ({ label, value: byDay.values[index] }));
  const peak = dayPairs.reduce((acc, item) => (item.value > acc.value ? item : acc), dayPairs[0]);
  const categoryCount = new Set(expenses.map((item) => item.category || 'Otros')).size;

  return {
    maxExpense: formatArs(maxExpense.amountArs),
    peakDay: `${peak.label} · ${formatArsCompact(peak.value)}`,
    peakDayFull: `${peak.label} (${formatArs(peak.value)})`,
    categories: String(categoryCount),
    activeDays: String(dayPairs.length),
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
        <span class="breakdown-actions">
          <strong>${formatArs(total)}</strong>
          <button class="btn btn-sm btn-outline-primary icon-action-btn open-category-detail-btn" type="button" data-category="${escapeHtmlAttr(category)}" title="Ver gastos de la categoría" aria-label="Ver gastos de la categoría">${eyeIcon()}</button>
        </span>
      </div>`,
    )
    .join('');
}

function ensureSelectHasOption(selectElement, value) {
  if (!(selectElement instanceof HTMLSelectElement)) return;
  if (!value) return;
  const exists = Array.from(selectElement.options).some((option) => option.value === value);
  if (exists) return;
  const opt = document.createElement('option');
  opt.value = value;
  opt.textContent = value;
  selectElement.appendChild(opt);
}

function renderCategoryExpensesTable() {
  const tbody = document.getElementById('categoryExpensesBody');
  if (!tbody) return;

  const filtered = currentStatsExpenses.filter((expense) => expense.category === selectedCategory);
  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-secondary py-4">No hay gastos en esta categoría para el mes seleccionado.</td></tr>';
    return;
  }

  tbody.innerHTML = filtered
    .map(
      (expense) => `
      <tr>
        <td>${formatDateDisplay(expense.expenseDate)}</td>
        <td>${expense.merchant}</td>
        <td>${expense.currency} ${Number(expense.originalAmount).toFixed(2)}</td>
        <td>${formatArs(expense.amountArs)}</td>
        <td>${expense.source || 'manual'}</td>
        <td>
          <div class="d-flex gap-2">
            <button class="btn btn-sm btn-outline-primary icon-action-btn edit-category-expense-btn" type="button" data-id="${expense.id}" data-merchant="${escapeHtmlAttr(expense.merchant)}" data-date="${escapeHtmlAttr(expense.expenseDate)}" data-currency="${escapeHtmlAttr(expense.currency)}" data-original="${escapeHtmlAttr(Number(expense.originalAmount).toFixed(2))}" data-category="${escapeHtmlAttr(expense.category)}" data-description="${escapeHtmlAttr(expense.description || '')}" title="Editar" aria-label="Editar">${pencilIcon()}</button>
            <button class="btn btn-sm btn-outline-danger icon-action-btn delete-category-expense-btn" type="button" data-id="${expense.id}" data-merchant="${escapeHtmlAttr(expense.merchant)}" data-date="${escapeHtmlAttr(expense.expenseDate)}" data-currency="${escapeHtmlAttr(expense.currency)}" data-original="${escapeHtmlAttr(Number(expense.originalAmount).toFixed(2))}" title="Borrar" aria-label="Borrar">${trashIcon()}</button>
          </div>
        </td>
      </tr>`,
    )
    .join('');
}

function openCategoryDetailModal(category) {
  selectedCategory = category;
  const title = document.getElementById('categoryDetailTitle');
  if (title) title.textContent = category || '-';
  renderCategoryExpensesTable();

  const modalElement = document.getElementById('categoryDetailModal');
  if (!modalElement || typeof bootstrap === 'undefined') return;
  bootstrap.Modal.getOrCreateInstance(modalElement).show();
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
  const expenses = filterExpensesBySelectedMonth(await window.NetoApi.listExpenses());
  currentStatsExpenses = expenses;
  const byCategoryTotals = buildCategoryTotals(expenses);
  const detailed = computeDetailedStats(expenses);

  document.getElementById('kpiTotal').textContent = formatArs(dashboard.totalMonthArs);
  document.getElementById('kpiAverage').textContent = formatArs(dashboard.averageExpenseArs);
  document.getElementById('kpiTransactions').textContent = String(expenses.length);
  document.getElementById('kpiCategory').textContent = dashboard.topCategory || Object.keys(byCategoryTotals)[0] || '-';
  document.getElementById('kpiMaxExpense').textContent = detailed.maxExpense;
  const peakDayKpi = document.getElementById('kpiPeakDay');
  peakDayKpi.textContent = detailed.peakDay;
  peakDayKpi.title = detailed.peakDayFull;
  document.getElementById('kpiCategories').textContent = detailed.categories;
  document.getElementById('kpiActiveDays').textContent = detailed.activeDays;

  renderCharts(byCategoryTotals, expenses);
  renderCategoryBreakdown(byCategoryTotals);

  if (selectedCategory) {
    renderCategoryExpensesTable();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.NetoAuth.requireAuth();
  applyDateMasks();

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
    await loadStats();
  });

  const editForm = document.getElementById('editCategoryExpenseForm');
  const deleteModal = document.getElementById('deleteCategoryExpenseModal');
  const confirmDeleteBtn = document.getElementById('confirmDeleteCategoryExpenseBtn');

  document.getElementById('categoryBreakdown')?.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const btn = target.closest('.open-category-detail-btn');
    if (!(btn instanceof HTMLButtonElement)) return;
    openCategoryDetailModal(btn.dataset.category || 'Sin categoría');
  });

  document.getElementById('categoryExpensesBody')?.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const editBtn = target.closest('.edit-category-expense-btn');
    if (editBtn instanceof HTMLButtonElement) {
      editingExpenseId = editBtn.dataset.id || null;
      if (!editingExpenseId || !(editForm instanceof HTMLFormElement)) return;
      editForm.merchant.value = editBtn.dataset.merchant || '';
      editForm.expenseDate.value = formatDateDisplay(editBtn.dataset.date || '');
      editForm.originalAmount.value = editBtn.dataset.original || '0.00';
      editForm.currency.value = editBtn.dataset.currency || 'ARS';
      ensureSelectHasOption(editForm.category, editBtn.dataset.category || '');
      editForm.category.value = editBtn.dataset.category || '';
      editForm.description.value = editBtn.dataset.description || '';

      const modalElement = document.getElementById('editCategoryExpenseModal');
      if (modalElement && typeof bootstrap !== 'undefined') {
        bootstrap.Modal.getOrCreateInstance(modalElement).show();
      }
      return;
    }

    const deleteBtn = target.closest('.delete-category-expense-btn');
    if (!(deleteBtn instanceof HTMLButtonElement)) return;
    deletingExpenseId = deleteBtn.dataset.id || null;
    const summary = document.getElementById('deleteCategoryExpenseSummary');
    if (summary) {
      summary.textContent = `Comercio: ${deleteBtn.dataset.merchant || '-'} | Fecha: ${formatDateDisplay(deleteBtn.dataset.date || '-')} | Monto: ${deleteBtn.dataset.currency || 'ARS'} ${deleteBtn.dataset.original || '0.00'}`;
    }
    if (deleteModal && typeof bootstrap !== 'undefined') {
      bootstrap.Modal.getOrCreateInstance(deleteModal).show();
    }
  });

  editForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!editingExpenseId) return;

    const apiDate = parseDateToApi(editForm.expenseDate.value);
    if (!apiDate) {
      showStatsToast('Fecha inválida. Usa formato dd/mm/aaaa.', 'error');
      return;
    }

    try {
      await window.NetoApi.updateExpense(editingExpenseId, {
        merchant: editForm.merchant.value,
        expenseDate: apiDate,
        originalAmount: Number(editForm.originalAmount.value),
        currency: editForm.currency.value,
        category: editForm.category.value,
        description: editForm.description.value,
      });
      showStatsToast('Gasto actualizado correctamente.', 'success');
      await loadStats();

      const modalElement = document.getElementById('editCategoryExpenseModal');
      if (modalElement && typeof bootstrap !== 'undefined') {
        bootstrap.Modal.getOrCreateInstance(modalElement).hide();
      }

      if (selectedCategory) {
        openCategoryDetailModal(selectedCategory);
      }
    } catch (error) {
      showStatsToast(error.message || 'No se pudo actualizar el gasto.', 'error');
    }
  });

  confirmDeleteBtn?.addEventListener('click', async () => {
    if (!deletingExpenseId) return;
    const original = confirmDeleteBtn.innerHTML;
    confirmDeleteBtn.disabled = true;
    confirmDeleteBtn.textContent = 'Borrando...';

    try {
      await window.NetoApi.deleteExpense(deletingExpenseId);
      deletingExpenseId = null;
      showStatsToast('Gasto borrado correctamente.', 'success');
      await loadStats();

      if (deleteModal && typeof bootstrap !== 'undefined') {
        bootstrap.Modal.getOrCreateInstance(deleteModal).hide();
      }

      if (selectedCategory) {
        openCategoryDetailModal(selectedCategory);
      }
    } catch (error) {
      showStatsToast(error.message || 'No se pudo borrar el gasto.', 'error');
    } finally {
      confirmDeleteBtn.disabled = false;
      confirmDeleteBtn.innerHTML = original;
    }
  });

  loadStats();
});

const formatArs = window.NetoFormat.ars;

function formatArsCompact(value) {
  return window.NetoFormat.arsCompact(value);
}

let currentStatsExpenses = [];
let currentAllExpenses = [];
let selectedCategory = null;
let editingExpenseId = null;
let deletingExpenseId = null;
let monthPicker = null;

function showStatsToast(message, type = 'success') {
  if (window.NetoToast?.show) {
    window.NetoToast.show(message, type, { stackId: 'statsToastStack', leaveDelay: 2300, removeDelay: 220 });
    return;
  }
}

const eyeIcon = window.NetoIcons.eye;

const pencilIcon = window.NetoIcons.pencil;

const trashIcon = window.NetoIcons.trash;

const escapeHtmlAttr = window.NetoDom.escapeHtmlAttr;

function formatDateDisplay(dateValue) {
  return window.NetoExpensesHelpers.formatDateDisplay(dateValue);
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

function groupExpensesByMonth(expenses) {
  const totals = {};
  expenses.forEach((expense) => {
    const key = String(toIsoDate(expense.expenseDate) || '').slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(key)) return;
    totals[key] = (totals[key] || 0) + Number(expense.amountArs || 0);
  });

  const labels = Object.keys(totals).sort((a, b) => new Date(`${a}-01`) - new Date(`${b}-01`));
  return {
    labels: labels.map((label) => formatMonthLabel(label)),
    values: labels.map((label) => totals[label]),
  };
}

function parseDateToIso(value) {
  return window.NetoExpensesHelpers.parseDateToApi(value);
}

function parseDateToApi(value) {
  return window.NetoExpensesHelpers.parseDateToApi(value);
}

function getSelectedMonth() {
  const value = document.getElementById('monthInput')?.value || '';
  return /^\d{4}-\d{2}$/.test(value) ? value : new Date().toISOString().slice(0, 7);
}

function formatMonthLabel(monthValue) {
  return window.NetoMonthPicker?.formatMonthLabel(monthValue) || '-';
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

function buildMerchantRanking(expenses) {
  const merchants = {};
  expenses.forEach((expense) => {
    const key = String(expense.merchant || 'Sin comercio').trim() || 'Sin comercio';
    if (!merchants[key]) {
      merchants[key] = { count: 0, total: 0 };
    }
    merchants[key].count += 1;
    merchants[key].total += Number(expense.amountArs || 0);
  });

  return Object.entries(merchants)
    .map(([merchant, info]) => ({ merchant, count: info.count, total: info.total }))
    .sort((a, b) => b.count - a.count || b.total - a.total)
    .slice(0, 6);
}

function buildUnusualExpenses(expenses) {
  if (!Array.isArray(expenses) || !expenses.length) return [];

  const values = expenses.map((expense) => Number(expense.amountArs || 0)).filter((value) => value > 0);
  if (!values.length) return [];

  const average = values.reduce((acc, value) => acc + value, 0) / values.length;
  const threshold = average * 2;

  return expenses
    .filter((expense) => Number(expense.amountArs || 0) > threshold)
    .sort((a, b) => Number(b.amountArs || 0) - Number(a.amountArs || 0))
    .slice(0, 6);
}

function renderMerchantRanking(items) {
  const target = document.getElementById('merchantRanking');
  if (!target) return;

  if (!Array.isArray(items) || !items.length) {
    target.innerHTML = '<p class="text-secondary mb-0">No hay datos suficientes para ranking de comercios.</p>';
    return;
  }

  target.innerHTML = items
    .map(
      (item, index) => `
      <div class="breakdown-item">
        <span>${index + 1}. ${item.merchant}</span>
        <span class="breakdown-actions">
          <small class="text-secondary">${item.count} compra${item.count === 1 ? '' : 's'}</small>
          <strong>${formatArs(item.total)}</strong>
        </span>
      </div>`,
    )
    .join('');
}

function renderUnusualExpenses(items) {
  const target = document.getElementById('unusualExpenses');
  if (!target) return;

  if (!Array.isArray(items) || !items.length) {
    target.innerHTML = '<p class="text-secondary mb-0">No se detectaron gastos inusuales en el período.</p>';
    return;
  }

  target.innerHTML = items
    .map(
      (expense) => `
      <div class="breakdown-item">
        <span>${formatDateDisplay(expense.expenseDate)} · ${expense.merchant}</span>
        <span class="breakdown-actions">
          <small class="text-secondary">${expense.category || 'Otros'}</small>
          <strong>${formatArs(expense.amountArs)}</strong>
        </span>
      </div>`,
    )
    .join('');
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
  const monthlyCtx = document.getElementById('monthlyChart');
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
  if (window.netoMonthlyChart) {
    window.netoMonthlyChart.destroy();
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

  const monthly = groupExpensesByMonth(currentAllExpenses);
  if (monthlyCtx) {
    window.netoMonthlyChart = new Chart(monthlyCtx, {
      type: 'bar',
      data: {
        labels: monthly.labels,
        datasets: [
          {
            label: 'Gasto mensual ARS',
            data: monthly.values,
            borderRadius: 8,
            backgroundColor: isDark ? '#22c55e' : '#10b981',
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
}

async function loadStats() {
  const month = document.getElementById('monthInput').value;
  const dashboard = await window.NetoApi.myDashboard(month);
  const allExpenses = await window.NetoApi.listExpenses();
  const expenses = filterExpensesBySelectedMonth(allExpenses);
  currentAllExpenses = allExpenses;
  currentStatsExpenses = expenses;
  const byCategoryTotals = buildCategoryTotals(expenses);
  const merchantRanking = buildMerchantRanking(expenses);
  const unusualExpenses = buildUnusualExpenses(expenses);
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
  renderMerchantRanking(merchantRanking);
  renderUnusualExpenses(unusualExpenses);

  if (selectedCategory) {
    renderCategoryExpensesTable();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.NetoAuth.requireAuth();
  window.NetoExpensesHelpers.applyDateMasks();

  const monthInput = document.getElementById('monthInput');
  monthInput.value = new Date().toISOString().slice(0, 7);
  monthPicker = window.NetoMonthPicker?.bind({ onApply: loadStats }) || null;

  monthInput.addEventListener('change', async () => {
    monthPicker?.sync?.();
    await loadStats();
  });

  const editForm = document.getElementById('editCategoryExpenseForm');
  const deleteModal = document.getElementById('deleteCategoryExpenseModal');
  const confirmDeleteBtn = document.getElementById('confirmDeleteCategoryExpenseBtn');

  document.getElementById('categoryBreakdown')?.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const btn = target.closest('.open-category-detail-btn');
    if (!(btn instanceof HTMLButtonElement)) return;
    openCategoryDetailModal(btn.dataset.category || 'Sin categoría');
  });

  document.getElementById('categoryExpensesBody')?.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

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

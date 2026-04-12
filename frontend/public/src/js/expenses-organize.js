let currentExpenses = [];
let editingExpenseId = null;
let deletingExpenseId = null;

const MONTH_OPTIONS = [
  { value: '01', label: 'Enero' },
  { value: '02', label: 'Febrero' },
  { value: '03', label: 'Marzo' },
  { value: '04', label: 'Abril' },
  { value: '05', label: 'Mayo' },
  { value: '06', label: 'Junio' },
  { value: '07', label: 'Julio' },
  { value: '08', label: 'Agosto' },
  { value: '09', label: 'Septiembre' },
  { value: '10', label: 'Octubre' },
  { value: '11', label: 'Noviembre' },
  { value: '12', label: 'Diciembre' },
];

function fillMonthYearFilters() {
  const monthSelect = document.getElementById('filterMonth');
  const yearSelect = document.getElementById('filterYear');
  if (!(monthSelect instanceof HTMLSelectElement) || !(yearSelect instanceof HTMLSelectElement)) return;

  if (monthSelect.options.length <= 1) {
    MONTH_OPTIONS.forEach((month) => {
      const option = document.createElement('option');
      option.value = month.value;
      option.textContent = month.label;
      monthSelect.appendChild(option);
    });
  }

  if (yearSelect.options.length <= 1) {
    const currentYear = new Date().getFullYear();
    for (let year = currentYear + 1; year >= currentYear - 6; year -= 1) {
      const option = document.createElement('option');
      option.value = String(year);
      option.textContent = String(year);
      if (year === currentYear) {
        option.selected = true;
      }
      yearSelect.appendChild(option);
    }
  }
}

function renderExpenses(expenses) {
  const tbody = document.getElementById('expensesBody');
  if (!tbody) return;

  if (!expenses.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-secondary py-4">No se encontraron gastos con los filtros actuales.</td></tr>';
    return;
  }

  tbody.innerHTML = expenses
    .map(
      (expense) => `
      <tr>
        <td>${window.NetoExpensesHelpers.formatDateDisplay(expense.expenseDate)}</td>
        <td>${expense.merchant}</td>
        <td>${expense.category}</td>
        <td>${expense.currency} ${Number(expense.originalAmount).toFixed(2)}</td>
        <td>ARS ${Number(expense.amountArs).toFixed(2)}</td>
        <td>
          <div class="d-flex gap-2">
            <button class="btn btn-sm btn-outline-primary icon-action-btn edit-expense-btn" type="button" data-id="${expense.id}" data-merchant="${window.NetoExpensesHelpers.escapeHtmlAttr(expense.merchant)}" data-date="${window.NetoExpensesHelpers.escapeHtmlAttr(expense.expenseDate)}" data-currency="${window.NetoExpensesHelpers.escapeHtmlAttr(expense.currency)}" data-amount="${window.NetoExpensesHelpers.escapeHtmlAttr(Number(expense.originalAmount).toFixed(2))}" data-category="${window.NetoExpensesHelpers.escapeHtmlAttr(expense.category)}" data-description="${window.NetoExpensesHelpers.escapeHtmlAttr(expense.description || '')}" title="Editar" aria-label="Editar">${window.NetoExpensesHelpers.pencilIcon()}</button>
            <button class="btn btn-sm btn-outline-danger icon-action-btn delete-expense-btn" type="button" data-id="${expense.id}" data-merchant="${window.NetoExpensesHelpers.escapeHtmlAttr(expense.merchant)}" data-date="${window.NetoExpensesHelpers.escapeHtmlAttr(expense.expenseDate)}" data-currency="${window.NetoExpensesHelpers.escapeHtmlAttr(expense.currency)}" data-amount="${window.NetoExpensesHelpers.escapeHtmlAttr(Number(expense.originalAmount).toFixed(2))}" title="Borrar" aria-label="Borrar">${window.NetoExpensesHelpers.trashIcon()}</button>
          </div>
        </td>
      </tr>`,
    )
    .join('');
}

function applyAmountFilters(expenses) {
  const minInput = document.getElementById('filterAmountMin');
  const maxInput = document.getElementById('filterAmountMax');
  const min = Number(minInput?.value || 0);
  const max = Number(maxInput?.value || 0);
  const hasMin = String(minInput?.value || '').trim() !== '';
  const hasMax = String(maxInput?.value || '').trim() !== '';

  if (!hasMin && !hasMax) return expenses;

  return expenses.filter((expense) => {
    const amount = Number(expense.amountArs || 0);
    if (hasMin && hasMax) return amount >= min && amount <= max;
    if (hasMin) return amount >= min;
    return amount <= max;
  });
}

function fillFiltersFromForm() {
  const category = document.getElementById('filterCategory')?.value || '';
  const monthPart = document.getElementById('filterMonth')?.value || '';
  const yearPart = document.getElementById('filterYear')?.value || '';
  const effectiveYear = yearPart || String(new Date().getFullYear());
  const month = monthPart ? `${effectiveYear}-${monthPart}` : '';
  return { category, month };
}

async function refreshExpenses() {
  const filters = fillFiltersFromForm();
  const base = await window.NetoApi.listExpenses(filters);
  currentExpenses = applyAmountFilters(base);
  renderExpenses(currentExpenses);
}

function fillEditModal(button) {
  const form = document.getElementById('editExpenseForm');
  if (!(form instanceof HTMLFormElement)) return;

  editingExpenseId = button.dataset.id || null;
  form.merchant.value = button.dataset.merchant || '';
  form.expenseDate.value = window.NetoExpensesHelpers.formatDateDisplay(button.dataset.date || '');
  const hiddenPicker = document.getElementById('editExpenseDatePicker');
  if (hiddenPicker instanceof HTMLInputElement) {
    hiddenPicker.value = window.NetoExpensesHelpers.formatDateForInput(button.dataset.date || '');
  }
  form.originalAmount.value = button.dataset.amount || '0.00';
  form.currency.value = button.dataset.currency || 'ARS';
  window.NetoExpensesHelpers.ensureSelectHasOption(form.category, button.dataset.category || '');
  form.category.value = button.dataset.category || '';
  form.description.value = button.dataset.description || '';

  const summary = document.getElementById('editExpenseSummary');
  if (summary) {
    summary.textContent = `Comercio: ${button.dataset.merchant || '-'} | Fecha: ${window.NetoExpensesHelpers.formatDateDisplay(button.dataset.date || '-')} | Monto: ${button.dataset.currency || 'ARS'} ${button.dataset.amount || '0.00'}`;
  }
}

function fillDeleteModal(button) {
  deletingExpenseId = button.dataset.id || null;
  const summary = document.getElementById('deleteExpenseSummary');
  if (summary) {
    summary.textContent = `Comercio: ${button.dataset.merchant || '-'} | Fecha: ${window.NetoExpensesHelpers.formatDateDisplay(button.dataset.date || '-')} | Monto: ${button.dataset.currency || 'ARS'} ${button.dataset.amount || '0.00'}`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.NetoAuth.requireAuth();

  const helpers = window.NetoExpensesHelpers;
  if (!helpers) return;

  helpers.applyDateMasks();
  helpers.setupDatePickerTriggers();
  fillMonthYearFilters();

  const filterForm = document.getElementById('expenseFiltersForm');
  const editExpenseForm = document.getElementById('editExpenseForm');
  const editExpenseModal = document.getElementById('editExpenseModal');
  const deleteExpenseModal = document.getElementById('deleteExpenseModal');
  const confirmDeleteExpenseBtn = document.getElementById('confirmDeleteExpenseBtn');

  filterForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    await refreshExpenses();
  });

  document.getElementById('clearExpenseFiltersBtn')?.addEventListener('click', async () => {
    filterForm?.reset();
    await refreshExpenses();
  });

  document.getElementById('expensesBody')?.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const editBtn = target.closest('.edit-expense-btn');
    if (editBtn instanceof HTMLButtonElement) {
      fillEditModal(editBtn);
      const modalElement = document.getElementById('editExpenseModal');
      if (modalElement && typeof bootstrap !== 'undefined') {
        bootstrap.Modal.getOrCreateInstance(modalElement).show();
      }
      return;
    }

    const deleteBtn = target.closest('.delete-expense-btn');
    if (!(deleteBtn instanceof HTMLButtonElement)) return;
    fillDeleteModal(deleteBtn);
    const modalElement = document.getElementById('deleteExpenseModal');
    if (modalElement && typeof bootstrap !== 'undefined') {
      bootstrap.Modal.getOrCreateInstance(modalElement).show();
    }
  });

  editExpenseForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!editingExpenseId) return;

    const form = event.currentTarget;
    const apiDate = helpers.parseDateToApi(form.expenseDate.value);
    if (!apiDate) {
      helpers.showToast('Fecha invalida. Usa formato dd/mm/aaaa.', 'error');
      return;
    }

    try {
      await window.NetoApi.updateExpense(editingExpenseId, {
        merchant: form.merchant.value,
        expenseDate: apiDate,
        originalAmount: Number(form.originalAmount.value),
        currency: form.currency.value,
        category: form.category.value,
        description: form.description.value,
      });
      helpers.showToast('Gasto actualizado correctamente.', 'success');
      await refreshExpenses();

      const modalElement = document.getElementById('editExpenseModal');
      if (modalElement && typeof bootstrap !== 'undefined') {
        bootstrap.Modal.getOrCreateInstance(modalElement).hide();
      }
    } catch (error) {
      helpers.showToast(error.message || 'No se pudo actualizar el gasto.', 'error');
    }
  });

  if (editExpenseModal) {
    editExpenseModal.addEventListener('hidden.bs.modal', () => {
      editingExpenseId = null;
      if (editExpenseForm instanceof HTMLFormElement) {
        editExpenseForm.reset();
      }
    });
  }

  confirmDeleteExpenseBtn?.addEventListener('click', async () => {
    if (!deletingExpenseId) return;
    const originalContent = confirmDeleteExpenseBtn.innerHTML;
    confirmDeleteExpenseBtn.disabled = true;
    confirmDeleteExpenseBtn.innerHTML = `${helpers.checkIcon()} Borrando...`;

    try {
      await window.NetoApi.deleteExpense(deletingExpenseId);
      deletingExpenseId = null;
      await refreshExpenses();
      helpers.showToast('Gasto borrado correctamente.', 'success');
      if (deleteExpenseModal && typeof bootstrap !== 'undefined') {
        bootstrap.Modal.getOrCreateInstance(deleteExpenseModal).hide();
      }
    } catch (error) {
      helpers.showToast(error.message || 'No se pudo borrar el gasto.', 'error');
    } finally {
      confirmDeleteExpenseBtn.disabled = false;
      confirmDeleteExpenseBtn.innerHTML = originalContent;
    }
  });

  if (deleteExpenseModal) {
    deleteExpenseModal.addEventListener('hidden.bs.modal', () => {
      deletingExpenseId = null;
    });
  }

  refreshExpenses();
});

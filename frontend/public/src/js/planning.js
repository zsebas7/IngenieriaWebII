let editingBudgetId = null;
let deletingBudgetId = null;
let hasAppliedBudgetFocus = false;

const formatMoney = window.NetoFormat.money;

const pencilIcon = window.NetoIcons.pencil;

const trashIcon = window.NetoIcons.trash;

const escapeHtmlAttr = window.NetoDom.escapeHtmlAttr;

function ensureSelectHasOption(selectElement, value) {
  if (!(selectElement instanceof HTMLSelectElement)) return;
  if (!value) return;
  const exists = Array.from(selectElement.options).some((option) => option.value === value);
  if (exists) return;
  const dynamicOption = document.createElement('option');
  dynamicOption.value = value;
  dynamicOption.textContent = value;
  selectElement.appendChild(dynamicOption);
}

function fillMonthYearOptions(monthSelect, yearSelect) {
  if (!(monthSelect instanceof HTMLSelectElement) || !(yearSelect instanceof HTMLSelectElement)) return;
  if (monthSelect.options.length > 1 || yearSelect.options.length > 1) return;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  monthNames.forEach((label, index) => {
    const monthNumber = String(index + 1).padStart(2, '0');
    const option = document.createElement('option');
    option.value = monthNumber;
    option.textContent = label;
    if (index + 1 === currentMonth) {
      option.selected = true;
      option.defaultSelected = true;
    }
    monthSelect.appendChild(option);
  });

  for (let year = currentYear - 1; year <= currentYear + 1; year += 1) {
    const option = document.createElement('option');
    option.value = String(year);
    option.textContent = String(year);
    if (year === currentYear) {
      option.selected = true;
      option.defaultSelected = true;
    }
    yearSelect.appendChild(option);
  }
}

function fillBudgetMonthOptions() {
  fillMonthYearOptions(document.getElementById('budgetMonthSelect'), document.getElementById('budgetYearSelect'));
  fillMonthYearOptions(document.getElementById('editBudgetMonthSelect'), document.getElementById('editBudgetYearSelect'));
}

function formatMonthDisplay(value) {
  const match = String(value || '').match(/^(\d{4})-(\d{2})$/);
  if (!match) return value || '-';
  return `${match[2]}/${match[1]}`;
}

function getExpenseMonthKey(expenseDate) {
  const value = String(expenseDate || '').trim();
  const apiMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (apiMatch) {
    const [, year, month] = apiMatch;
    return `${year}-${month}`;
  }

  const localMatch = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (localMatch) {
    const [, , month, year] = localMatch;
    return `${year}-${month}`;
  }

  return '';
}

function normalizeCategory(value) {
  return String(value || '').trim().toLowerCase();
}

function escapeCssSelectorValue(value) {
  return String(value || '').replaceAll('"', '\\"');
}

function mergeBudgetSpentFromExpenses(budgets, expenses) {
  if (!Array.isArray(budgets)) return [];
  if (!Array.isArray(expenses) || expenses.length === 0) {
    return budgets.map((budget) => ({ ...budget, spentAmount: Number(budget.spentAmount || 0) }));
  }

  return budgets.map((budget) => {
    const budgetMonth = String(budget.month || '').trim();
    const budgetCategory = normalizeCategory(budget.category);

    const spentAmount = expenses.reduce((acc, expense) => {
      const expenseMonth = getExpenseMonthKey(expense.expenseDate);
      const expenseCategory = normalizeCategory(expense.category);
      if (expenseMonth !== budgetMonth || expenseCategory !== budgetCategory) return acc;
      return acc + Number(expense.amountArs || 0);
    }, 0);

    return {
      ...budget,
      spentAmount,
    };
  });
}

function openEditBudgetModal(button) {
  const form = document.getElementById('editBudgetForm');
  if (!(form instanceof HTMLFormElement)) return;

  editingBudgetId = button.dataset.id || null;
  ensureSelectHasOption(form.budgetCategory, button.dataset.category || '');
  form.budgetCategory.value = button.dataset.category || '';
  form.budgetAmount.value = Number(button.dataset.limit || 0).toFixed(2);
  form.budgetCurrency.value = button.dataset.currency || 'ARS';

  const monthMatch = String(button.dataset.month || '').match(/^(\d{4})-(\d{2})$/);
  if (monthMatch) {
    form.budgetYearSelect.value = monthMatch[1];
    form.budgetMonthSelect.value = monthMatch[2];
  }

  const summary = document.getElementById('editBudgetSummary');
  if (summary) {
    summary.textContent = `Categoria: ${button.dataset.category || '-'} | Mes: ${formatMonthDisplay(button.dataset.month || '-')} | Limite: ${button.dataset.currency || 'ARS'} ${Number(button.dataset.limit || 0).toFixed(2)}`;
  }

  const modalElement = document.getElementById('editBudgetModal');
  if (!modalElement || typeof bootstrap === 'undefined') return;
  bootstrap.Modal.getOrCreateInstance(modalElement).show();
}

function openDeleteBudgetModal(button) {
  deletingBudgetId = button.dataset.id || null;

  const summary = document.getElementById('deleteBudgetSummary');
  if (summary) {
    summary.textContent = `Categoria: ${button.dataset.category || '-'} | Mes: ${formatMonthDisplay(button.dataset.month || '-')}`;
  }

  const modalElement = document.getElementById('deleteBudgetModal');
  if (!modalElement || typeof bootstrap === 'undefined') return;
  bootstrap.Modal.getOrCreateInstance(modalElement).show();
}

function renderBudgetList(budgets) {
  const container = document.getElementById('budgetList');
  if (!container) return;

  if (!Array.isArray(budgets) || budgets.length === 0) {
    container.innerHTML = '<div class="empty-state">Todavia no cargaste presupuestos.</div>';
    return;
  }

  container.innerHTML = budgets
    .map((budget) => {
      const spent = Number(budget.spentAmount || 0);
      const limit = Number(budget.limitAmount || 0);
      const ratio = limit > 0 ? spent / limit : 0;
      const rawPercent = Math.max(ratio * 100, 0);
      const progressPercent = Math.min(rawPercent, 100);
      const isOverLimit = ratio > 1;
      const isNearLimit = !isOverLimit && ratio >= 0.85;
      const statusClass = isOverLimit ? 'danger' : isNearLimit ? 'warn' : 'good';
      const statusText = isOverLimit ? 'Limite excedido' : isNearLimit ? 'Limite proximo' : 'Dentro del limite';
      const progressBarClass = isOverLimit ? 'progress-bar--danger' : isNearLimit ? 'progress-bar--warn' : 'progress-bar--good';

      return `
        <article class="planning-item" data-budget-category="${escapeHtmlAttr(normalizeCategory(budget.category))}">
          <div class="planning-item-top">
            <div class="planning-item-title">${budget.category || 'Categoria'}</div>
            <div class="planning-item-actions">
              <span class="status-chip ${statusClass}">${statusText}</span>
              <button class="btn btn-sm btn-outline-primary icon-action-btn edit-budget-btn" type="button" data-id="${escapeHtmlAttr(budget.id)}" data-category="${escapeHtmlAttr(budget.category)}" data-limit="${escapeHtmlAttr(budget.limitAmount)}" data-currency="${escapeHtmlAttr(budget.currency || 'ARS')}" data-month="${escapeHtmlAttr(budget.month)}" title="Editar presupuesto" aria-label="Editar presupuesto">${pencilIcon()}</button>
              <button class="btn btn-sm btn-outline-danger icon-action-btn delete-budget-btn" type="button" data-id="${escapeHtmlAttr(budget.id)}" data-category="${escapeHtmlAttr(budget.category)}" data-month="${escapeHtmlAttr(budget.month)}" title="Borrar presupuesto" aria-label="Borrar presupuesto">${trashIcon()}</button>
            </div>
          </div>
          <div class="planning-item-meta">Mes: ${formatMonthDisplay(budget.month)} | Limite: ${formatMoney(budget.currency || 'ARS', limit)}</div>
          <div class="planning-item-meta">Gastado: ${formatMoney('ARS', spent)}</div>
          <div class="planning-progress">
            <div class="planning-progress-row">
              <span class="planning-item-meta">Uso del limite</span>
              <span class="planning-item-meta">${rawPercent.toFixed(1)}%</span>
            </div>
            <div class="progress progress-modern">
              <div class="progress-bar ${progressBarClass}" style="width:${progressPercent}%"></div>
            </div>
          </div>
        </article>
      `;
    })
    .join('');
}

async function refreshPlanningData() {
  const [budgetsResult, expensesResult] = await Promise.allSettled([
    window.NetoApi.listBudgets(),
    window.NetoApi.listExpenses(),
  ]);

  if (budgetsResult.status === 'fulfilled') {
    const budgets = budgetsResult.value || [];
    const expenses = expensesResult.status === 'fulfilled' ? expensesResult.value || [] : [];
    const enrichedBudgets = mergeBudgetSpentFromExpenses(budgets, expenses);
    renderBudgetList(enrichedBudgets);
    if (!hasAppliedBudgetFocus) {
      applyBudgetFocusFromQuery();
    }
  } else {
    renderBudgetList([]);
  }
}

function applyBudgetFocusFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const category = normalizeCategory(params.get('category'));
  if (!category) {
    hasAppliedBudgetFocus = true;
    return;
  }

  const selector = `.planning-item[data-budget-category="${escapeCssSelectorValue(category)}"]`;
  const targetCard = document.querySelector(selector);
  if (!(targetCard instanceof HTMLElement)) {
    hasAppliedBudgetFocus = true;
    return;
  }

  targetCard.classList.add('dashboard-focus-target');
  targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
  window.setTimeout(() => {
    targetCard.classList.remove('dashboard-focus-target');
  }, 2200);

  hasAppliedBudgetFocus = true;
}

document.addEventListener('DOMContentLoaded', () => {
  window.NetoAuth.requireAuth();
  fillBudgetMonthOptions();

  const budgetForm = document.getElementById('budgetForm');
  const budgetList = document.getElementById('budgetList');
  const editBudgetForm = document.getElementById('editBudgetForm');
  const editBudgetModal = document.getElementById('editBudgetModal');
  const deleteBudgetModal = document.getElementById('deleteBudgetModal');
  const confirmDeleteBudgetBtn = document.getElementById('confirmDeleteBudgetBtn');

  budgetList?.addEventListener('click', async (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const editBtn = target.closest('.edit-budget-btn');
    if (editBtn instanceof HTMLButtonElement) {
      openEditBudgetModal(editBtn);
      return;
    }

    const deleteBtn = target.closest('.delete-budget-btn');
    if (!(deleteBtn instanceof HTMLButtonElement)) return;
    openDeleteBudgetModal(deleteBtn);
  });

  if (editBudgetModal) {
    editBudgetModal.addEventListener('hidden.bs.modal', () => {
      editingBudgetId = null;
      if (editBudgetForm instanceof HTMLFormElement) {
        editBudgetForm.reset();
        window.NetoUI?.clearMessage(editBudgetForm);
      }
    });
  }

  confirmDeleteBudgetBtn?.addEventListener('click', async () => {
    if (!deletingBudgetId) return;

    const originalContent = confirmDeleteBudgetBtn.innerHTML;
    confirmDeleteBudgetBtn.disabled = true;
    confirmDeleteBudgetBtn.innerHTML = 'Borrando...';

    try {
      await window.NetoApi.deleteBudget(deletingBudgetId);
      deletingBudgetId = null;
      await refreshPlanningData();

      if (deleteBudgetModal && typeof bootstrap !== 'undefined') {
        bootstrap.Modal.getOrCreateInstance(deleteBudgetModal).hide();
      }

      window.NetoUI?.showMessage(budgetForm, 'Presupuesto borrado.', 'success');
    } catch (error) {
      window.NetoUI?.showMessage(budgetForm, error.message || 'No se pudo borrar el presupuesto.', 'error');
    } finally {
      confirmDeleteBudgetBtn.disabled = false;
      confirmDeleteBudgetBtn.innerHTML = originalContent;
    }
  });

  if (deleteBudgetModal) {
    deleteBudgetModal.addEventListener('hidden.bs.modal', () => {
      deletingBudgetId = null;
    });
  }

  budgetForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    window.NetoUI?.clearMessage(form);

    try {
      const selectedMonth = form.budgetMonthSelect.value;
      const selectedYear = form.budgetYearSelect.value;
      const monthValue = selectedMonth && selectedYear ? `${selectedYear}-${selectedMonth}` : '';
      if (!monthValue) {
        window.NetoUI?.showMessage(form, 'Selecciona mes y año para continuar.', 'error');
        return;
      }

      const payload = {
        category: form.budgetCategory.value,
        limitAmount: Number(form.budgetAmount.value),
        currency: form.budgetCurrency.value,
        month: monthValue,
      };

      await window.NetoApi.createBudget(payload);
      form.reset();
      window.NetoUI?.showMessage(form, 'Presupuesto guardado.', 'success');

      await refreshPlanningData();
    } catch (error) {
      window.NetoUI?.showMessage(form, error.message || 'No se pudo guardar el presupuesto.', 'error');
    }
  });

  editBudgetForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    window.NetoUI?.clearMessage(form);

    if (!editingBudgetId) {
      window.NetoUI?.showMessage(form, 'No hay presupuesto seleccionado para editar.', 'error');
      return;
    }

    try {
      const selectedMonth = form.budgetMonthSelect.value;
      const selectedYear = form.budgetYearSelect.value;
      const monthValue = selectedMonth && selectedYear ? `${selectedYear}-${selectedMonth}` : '';
      if (!monthValue) {
        window.NetoUI?.showMessage(form, 'Selecciona mes y año para continuar.', 'error');
        return;
      }

      await window.NetoApi.updateBudget(editingBudgetId, {
        category: form.budgetCategory.value,
        limitAmount: Number(form.budgetAmount.value),
        currency: form.budgetCurrency.value,
        month: monthValue,
      });

      await refreshPlanningData();
      window.NetoUI?.showMessage(budgetForm, 'Presupuesto actualizado.', 'success');

      if (editBudgetModal && typeof bootstrap !== 'undefined') {
        bootstrap.Modal.getOrCreateInstance(editBudgetModal).hide();
      }
    } catch (error) {
      window.NetoUI?.showMessage(form, error.message || 'No se pudo actualizar el presupuesto.', 'error');
    }
  });

  refreshPlanningData();
});

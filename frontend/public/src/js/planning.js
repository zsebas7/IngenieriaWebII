function formatMoney(currency, value) {
  return `${currency} ${Number(value || 0).toFixed(2)}`;
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

function parseDateToApi(input) {
  const value = String(input || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const [, day, month, year] = match;
  return `${year}-${month}-${day}`;
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
      if (input.value !== masked) {
        input.value = masked;
      }
    });
  });
}

function fillBudgetMonthOptions() {
  const monthSelect = document.getElementById('budgetMonthSelect');
  const yearSelect = document.getElementById('budgetYearSelect');
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

function setupDatePickerTriggers(root = document) {
  const triggerButtons = root.querySelectorAll('.date-picker-trigger[data-target]');
  triggerButtons.forEach((button) => {
    if (button.dataset.bound === 'true') return;
    button.dataset.bound = 'true';

    const targetId = button.dataset.target;
    const syncId = button.dataset.sync;

    if (targetId && syncId) {
      const pickerInput = document.getElementById(targetId);
      if (pickerInput instanceof HTMLInputElement) {
        pickerInput.addEventListener('change', () => {
          const visibleInput = document.getElementById(syncId);
          if (!(visibleInput instanceof HTMLInputElement)) return;

          const selected = pickerInput.value;
          if (!selected) return;
          const [year, month, day] = selected.split('-');
          visibleInput.value = `${day}/${month}/${year}`;
        });
      }
    }

    button.addEventListener('click', () => {
      if (!targetId) return;

      const input = document.getElementById(targetId);
      if (!(input instanceof HTMLInputElement)) return;

      if (syncId) {
        const visibleInput = document.getElementById(syncId);
        if (visibleInput instanceof HTMLInputElement) {
          const currentApiDate = parseDateToApi(visibleInput.value);
          if (currentApiDate) {
            input.value = currentApiDate;
          }
        }
      }

      input.focus();
      if (typeof input.showPicker === 'function') {
        input.showPicker();
      }
    });
  });
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
        <article class="planning-item">
          <div class="planning-item-top">
            <div class="planning-item-title">${budget.category || 'Categoria'}</div>
            <span class="status-chip ${statusClass}">${statusText}</span>
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

function renderGoalList(goals) {
  const container = document.getElementById('goalList');
  if (!container) return;

  if (!Array.isArray(goals) || goals.length === 0) {
    container.innerHTML = '<div class="empty-state">Todavia no cargaste metas de ahorro.</div>';
    return;
  }

  container.innerHTML = goals
    .map(
      (goal) => `
        <article class="planning-item">
          <div class="planning-item-top">
            <div class="planning-item-title">${goal.title || 'Meta'}</div>
            <span class="status-chip good">Activa</span>
          </div>
          <div class="planning-item-meta">Objetivo: ${formatMoney(goal.currency || 'ARS', goal.targetAmount)}</div>
          <div class="planning-item-meta">Fecha objetivo: ${formatDateDisplay(goal.deadline)}</div>
        </article>
      `,
    )
    .join('');
}

async function refreshPlanningData() {
  const [budgetsResult, goalsResult, expensesResult] = await Promise.allSettled([
    window.NetoApi.listBudgets(),
    window.NetoApi.listGoals(),
    window.NetoApi.listExpenses(),
  ]);

  if (budgetsResult.status === 'fulfilled') {
    const budgets = budgetsResult.value || [];
    const expenses = expensesResult.status === 'fulfilled' ? expensesResult.value || [] : [];
    const enrichedBudgets = mergeBudgetSpentFromExpenses(budgets, expenses);
    renderBudgetList(enrichedBudgets);
  } else {
    renderBudgetList([]);
  }

  if (goalsResult.status === 'fulfilled') {
    renderGoalList(goalsResult.value || []);
  } else {
    renderGoalList([]);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.NetoAuth.requireAuth();
  applyDateMasks();
  fillBudgetMonthOptions();
  setupDatePickerTriggers();

  document.getElementById('budgetForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    window.NetoUI?.clearMessage(form);

    try {
        const selectedMonth = form.budgetMonthSelect.value;
        const selectedYear = form.budgetYearSelect.value;
        const monthValue = selectedMonth && selectedYear ? `${selectedYear}-${selectedMonth}` : '';

      await window.NetoApi.createBudget({
        category: form.budgetCategory.value,
        limitAmount: Number(form.budgetAmount.value),
        currency: form.budgetCurrency.value,
          month: monthValue,
      });
      form.reset();
      window.NetoUI?.showMessage(form, 'Presupuesto guardado.', 'success');
      refreshPlanningData();
    } catch (error) {
      window.NetoUI?.showMessage(form, error.message || 'No se pudo guardar el presupuesto.', 'error');
    }
  });

  document.getElementById('goalForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    window.NetoUI?.clearMessage(form);

    try {
      const apiDeadline = parseDateToApi(form.goalDeadline.value);
      if (!apiDeadline) {
        window.NetoUI?.showMessage(form, 'Fecha inválida. Selecciona una fecha válida.', 'error');
        return;
      }

      await window.NetoApi.createGoal({
        title: form.goalTitle.value,
        targetAmount: Number(form.goalAmount.value),
        currency: form.goalCurrency.value,
        deadline: apiDeadline,
      });
      form.reset();
      window.NetoUI?.showMessage(form, 'Meta guardada.', 'success');
      refreshPlanningData();
    } catch (error) {
      window.NetoUI?.showMessage(form, error.message || 'No se pudo guardar la meta.', 'error');
    }
  });

  refreshPlanningData();
});

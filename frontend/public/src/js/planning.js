function formatMoney(currency, value) {
  return `${currency} ${Number(value || 0).toFixed(2)}`;
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
      const statusClass = ratio <= 0.8 ? 'good' : 'warn';
      const statusText = ratio <= 0.8 ? 'En rango' : 'Al limite';

      return `
        <article class="planning-item">
          <div class="planning-item-top">
            <div class="planning-item-title">${budget.category || 'Categoria'}</div>
            <span class="status-chip ${statusClass}">${statusText}</span>
          </div>
          <div class="planning-item-meta">Mes: ${budget.month || '-'} | Limite: ${formatMoney(budget.currency || 'ARS', limit)}</div>
          <div class="planning-item-meta">Gastado: ${formatMoney('ARS', spent)}</div>
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
          <div class="planning-item-meta">Fecha objetivo: ${goal.deadline || '-'}</div>
        </article>
      `,
    )
    .join('');
}

async function refreshPlanningData() {
  const [budgetsResult, goalsResult] = await Promise.allSettled([window.NetoApi.listBudgets(), window.NetoApi.listGoals()]);

  if (budgetsResult.status === 'fulfilled') {
    renderBudgetList(budgetsResult.value || []);
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

  document.getElementById('budgetForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    window.NetoUI?.clearMessage(form);

    try {
      await window.NetoApi.createBudget({
        category: form.budgetCategory.value,
        limitAmount: Number(form.budgetAmount.value),
        currency: form.budgetCurrency.value,
        month: form.budgetMonth.value,
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
      await window.NetoApi.createGoal({
        title: form.goalTitle.value,
        targetAmount: Number(form.goalAmount.value),
        currency: form.goalCurrency.value,
        deadline: form.goalDeadline.value,
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

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
  renderExpenses(expenses);
  renderRecommendations(recommendations);
  renderBudgetProgress(dashboard.budgetProgress);
}

function renderCategoryChart(byCategory) {
  const ctx = document.getElementById('categoryChart');
  if (!ctx) return;

  new Chart(ctx, {
    type: 'pie',
    data: {
      labels: Object.keys(byCategory),
      datasets: [
        {
          data: Object.values(byCategory),
          backgroundColor: ['#2d6a4f', '#40916c', '#52b788', '#74c69d', '#95d5b2', '#b7e4c7'],
        },
      ],
    },
  });
}

function renderExpenses(expenses) {
  const tbody = document.getElementById('expensesBody');
  if (!tbody) return;
  tbody.innerHTML = expenses
    .map(
      (expense) => `
      <tr>
        <td>${expense.expenseDate}</td>
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
    container.innerHTML = '<p class="text-muted">Todavía no hay recomendaciones.</p>';
    return;
  }

  container.innerHTML = items
    .map(
      (item) => `
      <div class="alert alert-success">
        <small>${new Date(item.createdAt).toLocaleString()}</small>
        <p class="mb-0">${item.content}</p>
      </div>`,
    )
    .join('');
}

function renderBudgetProgress(items) {
  const list = document.getElementById('budgetProgress');
  if (!list) return;

  list.innerHTML = items
    .map(
      (item) => `
      <div class="mb-2">
        <div class="d-flex justify-content-between">
          <span>${item.category}</span>
          <span>${item.progressPercent.toFixed(1)}%</span>
        </div>
        <div class="progress">
          <div class="progress-bar bg-success" style="width:${Math.min(item.progressPercent, 100)}%"></div>
        </div>
      </div>`,
    )
    .join('');
}

document.addEventListener('DOMContentLoaded', () => {
  const monthInput = document.getElementById('monthInput');
  monthInput.value = new Date().toISOString().slice(0, 7);

  document.getElementById('reloadDashboard')?.addEventListener('click', loadDashboard);

  document.getElementById('expenseForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    await window.NetoApi.createExpense({
      merchant: form.merchant.value,
      expenseDate: form.expenseDate.value,
      originalAmount: Number(form.originalAmount.value),
      currency: form.currency.value,
      category: form.category.value,
      description: form.description.value,
    });
    form.reset();
    loadDashboard();
  });

  document.getElementById('ticketForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const file = document.getElementById('ticketFile').files[0];
    if (!file) return;

    try {
      await window.NetoApi.uploadTicket(file);
      alert('Ticket procesado y gasto agregado automáticamente');
      loadDashboard();
    } catch (error) {
      alert(error.message || 'No se pudo procesar el ticket');
    }
  });

  document.getElementById('budgetForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    await window.NetoApi.createBudget({
      category: form.budgetCategory.value,
      limitAmount: Number(form.budgetAmount.value),
      currency: form.budgetCurrency.value,
      month: form.budgetMonth.value,
    });
    form.reset();
    loadDashboard();
  });

  document.getElementById('goalForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    await window.NetoApi.createGoal({
      title: form.goalTitle.value,
      targetAmount: Number(form.goalAmount.value),
      currency: form.goalCurrency.value,
      deadline: form.goalDeadline.value,
    });
    form.reset();
    loadDashboard();
  });

  document.getElementById('generateRecommendation')?.addEventListener('click', async () => {
    await window.NetoApi.generateRecommendation();
    loadDashboard();
  });

  loadDashboard();
});

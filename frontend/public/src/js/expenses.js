function renderExpenses(expenses) {
  const tbody = document.getElementById('expensesBody');
  if (!tbody) return;

  if (!expenses.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-secondary py-4">Aún no hay gastos cargados.</td></tr>';
    return;
  }

  tbody.innerHTML = expenses
    .map(
      (expense) => `
      <tr>
        <td>${expense.expenseDate}</td>
        <td>${expense.merchant}</td>
        <td>${expense.category}</td>
        <td>${expense.currency} ${Number(expense.originalAmount).toFixed(2)}</td>
        <td>ARS ${Number(expense.amountArs).toFixed(2)}</td>
        <td>${expense.source || 'manual'}</td>
      </tr>`,
    )
    .join('');
}

async function refreshExpenses() {
  const expenses = await window.NetoApi.listExpenses();
  renderExpenses(expenses);
}

document.addEventListener('DOMContentLoaded', () => {
  window.NetoAuth.requireAuth();

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
    refreshExpenses();
  });

  document.getElementById('ticketForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const file = document.getElementById('ticketFile').files[0];
    if (!file) return;

    try {
      await window.NetoApi.uploadTicket(file);
      alert('Ticket procesado y gasto agregado automáticamente.');
      event.currentTarget.reset();
      refreshExpenses();
    } catch (error) {
      alert(error.message || 'No se pudo procesar el ticket.');
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
    alert('Presupuesto guardado.');
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
    alert('Meta guardada.');
  });

  refreshExpenses();
});

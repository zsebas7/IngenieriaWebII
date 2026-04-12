document.addEventListener('DOMContentLoaded', () => {
  window.NetoAuth.requireAuth();

  const helpers = window.NetoExpensesHelpers;
  if (!helpers) return;

  helpers.applyDateMasks();
  helpers.setupDatePickerTriggers();

  const form = document.getElementById('manualExpenseForm');
  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const target = event.currentTarget;
    window.NetoUI?.clearMessage(target);

    try {
      const payload = {
        merchant: target.merchant.value,
        expenseDate: helpers.parseDateToApi(target.expenseDate.value),
        originalAmount: Number(target.originalAmount.value),
        currency: target.currency.value,
        category: target.category.value,
        description: target.description.value,
      };

      if (!payload.expenseDate) {
        helpers.showToast('Fecha invalida. Usa formato dd/mm/aaaa.', 'error');
        return;
      }

      await window.NetoApi.createExpense(payload);
      target.reset();
      helpers.showToast('Gasto manual guardado correctamente.', 'success');
    } catch (error) {
      helpers.showToast(error.message || 'No se pudo guardar el gasto.', 'error');
    }
  });
});

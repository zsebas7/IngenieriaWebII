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
  const ticketInput = document.getElementById('ticketFile');
  const ticketDropzone = document.getElementById('ticketDropzone');
  const ticketFileName = document.getElementById('ticketFileName');
  let droppedTicketFile = null;

  const renderSelectedTicketName = (file) => {
    if (!ticketFileName) return;
    ticketFileName.textContent = file ? `Archivo: ${file.name}` : 'Ningún archivo seleccionado';
  };

  if (ticketInput) {
    ticketInput.addEventListener('change', () => {
      droppedTicketFile = null;
      const selected = ticketInput.files?.[0] || null;
      renderSelectedTicketName(selected);
    });
  }

  if (ticketDropzone && ticketInput) {
    ['dragenter', 'dragover'].forEach((eventName) => {
      ticketDropzone.addEventListener(eventName, (event) => {
        event.preventDefault();
        event.stopPropagation();
        ticketDropzone.classList.add('is-dragover');
      });
    });

    ['dragleave', 'drop'].forEach((eventName) => {
      ticketDropzone.addEventListener(eventName, (event) => {
        event.preventDefault();
        event.stopPropagation();
        ticketDropzone.classList.remove('is-dragover');
      });
    });

    ticketDropzone.addEventListener('drop', (event) => {
      const file = event.dataTransfer?.files?.[0] || null;
      if (!file) return;

      droppedTicketFile = file;
      renderSelectedTicketName(file);

      try {
        const transfer = new DataTransfer();
        transfer.items.add(file);
        ticketInput.files = transfer.files;
      } catch {
        // Some environments do not allow programmatic assignment to input.files.
      }
    });
  }

  document.getElementById('expenseForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    window.NetoUI?.clearMessage(form);

    try {
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
      window.NetoUI?.showMessage(form, 'Gasto guardado correctamente.', 'success');
    } catch (error) {
      window.NetoUI?.showMessage(form, error.message || 'No se pudo guardar el gasto.', 'error');
    }
  });

  document.getElementById('ticketForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    window.NetoUI?.clearMessage(form);
    const file = droppedTicketFile || ticketInput?.files?.[0] || null;
    if (!file) return;

    try {
      await window.NetoApi.uploadTicket(file);
      window.NetoUI?.showMessage(form, 'Ticket procesado y gasto agregado automáticamente.', 'success');
      form.reset();
      droppedTicketFile = null;
      renderSelectedTicketName(null);
      refreshExpenses();
    } catch (error) {
      window.NetoUI?.showMessage(form, error.message || 'No se pudo procesar el ticket.', 'error');
    }
  });

  refreshExpenses();
});

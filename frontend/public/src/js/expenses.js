let currentExpenses = [];
let editingExpenseId = null;
let deletingExpenseId = null;

function formatDateDisplay(dateValue) {
  if (!dateValue) return '-';
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateValue)) return dateValue;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    const [year, month, day] = dateValue.split('-');
    return `${day}/${month}/${year}`;
  }

  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return String(dateValue);
  const day = String(parsed.getDate()).padStart(2, '0');
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const year = parsed.getFullYear();
  return `${day}/${month}/${year}`;
}

function parseDateToApi(input) {
  const value = String(input || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const [, day, month, year] = match;
  return `${year}-${month}-${day}`;
}

function formatDateForInput(dateValue) {
  const value = String(dateValue || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return '';
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

function showExpensesToast(message, type = 'success') {
  let stack = document.getElementById('expensesToastStack');
  if (!stack) {
    stack = document.createElement('div');
    stack.id = 'expensesToastStack';
    stack.className = 'neto-toast-stack';
    document.body.appendChild(stack);
  }

  const toast = document.createElement('div');
  toast.className = `neto-toast ${type}`;
  toast.textContent = message;
  stack.appendChild(toast);

  window.setTimeout(() => {
    toast.classList.add('is-leaving');
    window.setTimeout(() => toast.remove(), 230);
  }, 2300);
}

function pencilIcon() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';
}

function trashIcon() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>';
}

function checkIcon() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5L20 7"/></svg>';
}

function escapeHtmlAttr(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function renderExpenses(expenses) {
  const tbody = document.getElementById('expensesBody');
  if (!tbody) return;

  if (!expenses.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center text-secondary py-4">Aún no hay gastos cargados.</td></tr>';
    return;
  }

  tbody.innerHTML = expenses
    .map(
      (expense) => `
      <tr>
        <td>${formatDateDisplay(expense.expenseDate)}</td>
        <td>${expense.merchant}</td>
        <td>${expense.category}</td>
        <td>${expense.currency} ${Number(expense.originalAmount).toFixed(2)}</td>
        <td>ARS ${Number(expense.amountArs).toFixed(2)}</td>
        <td>${expense.source || 'manual'}</td>
        <td>
          <div class="d-flex gap-2">
            <button class="btn btn-sm btn-outline-primary icon-action-btn edit-expense-btn" type="button" data-id="${expense.id}" data-merchant="${escapeHtmlAttr(expense.merchant)}" data-date="${escapeHtmlAttr(expense.expenseDate)}" data-currency="${escapeHtmlAttr(expense.currency)}" data-amount="${escapeHtmlAttr(Number(expense.originalAmount).toFixed(2))}" data-category="${escapeHtmlAttr(expense.category)}" data-description="${escapeHtmlAttr(expense.description || '')}" title="Editar" aria-label="Editar">${pencilIcon()}</button>
            <button class="btn btn-sm btn-outline-danger icon-action-btn delete-expense-btn" type="button" data-id="${expense.id}" data-merchant="${escapeHtmlAttr(expense.merchant)}" data-date="${escapeHtmlAttr(expense.expenseDate)}" data-currency="${escapeHtmlAttr(expense.currency)}" data-amount="${escapeHtmlAttr(Number(expense.originalAmount).toFixed(2))}" title="Borrar" aria-label="Borrar">${trashIcon()}</button>
          </div>
        </td>
      </tr>`,
    )
    .join('');
}

async function refreshExpenses() {
  const expenses = await window.NetoApi.listExpenses();
  currentExpenses = expenses;
  renderExpenses(expenses);
}

async function handleEditExpenseClick(button) {
  const expenseId = button.dataset.id;
  if (!expenseId) {
    return;
  }

  const form = document.getElementById('editExpenseForm');
  if (!(form instanceof HTMLFormElement)) {
    return;
  }

  editingExpenseId = expenseId;
  form.merchant.value = button.dataset.merchant || '';
  form.expenseDate.value = formatDateDisplay(button.dataset.date || '');
  const hiddenPicker = document.getElementById('editExpenseDatePicker');
  if (hiddenPicker instanceof HTMLInputElement) {
    hiddenPicker.value = formatDateForInput(button.dataset.date || '');
  }
  form.originalAmount.value = button.dataset.amount || '0.00';
  form.currency.value = button.dataset.currency || 'ARS';
  ensureSelectHasOption(form.category, button.dataset.category || '');
  form.category.value = button.dataset.category || '';
  form.description.value = button.dataset.description || '';

  const summary = document.getElementById('editExpenseSummary');
  if (summary) {
    summary.textContent = `Comercio: ${button.dataset.merchant || '-'} | Fecha: ${formatDateDisplay(button.dataset.date || '-')} | Monto: ${button.dataset.currency || 'ARS'} ${button.dataset.amount || '0.00'}`;
  }

  const modalElement = document.getElementById('editExpenseModal');
  if (!modalElement || typeof bootstrap === 'undefined') {
    return;
  }

  const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
  modal.show();
}

async function handleDeleteExpenseClick(button) {
  const expenseId = button.dataset.id;
  if (!expenseId) {
    return;
  }

  deletingExpenseId = expenseId;

  const summary = document.getElementById('deleteExpenseSummary');
  if (summary) {
    summary.textContent = `Comercio: ${button.dataset.merchant || '-'} | Fecha: ${formatDateDisplay(button.dataset.date || '-')} | Monto: ${button.dataset.currency || 'ARS'} ${button.dataset.amount || '0.00'}`;
  }

  const modalElement = document.getElementById('deleteExpenseModal');
  if (!modalElement || typeof bootstrap === 'undefined') {
    return;
  }

  const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
  modal.show();
}

document.addEventListener('DOMContentLoaded', () => {
  window.NetoAuth.requireAuth();
  applyDateMasks();
  setupDatePickerTriggers();
  const expenseForm = document.getElementById('expenseForm');
  const editExpenseForm = document.getElementById('editExpenseForm');
  const editExpenseModal = document.getElementById('editExpenseModal');
  const deleteExpenseModal = document.getElementById('deleteExpenseModal');
  const confirmDeleteExpenseBtn = document.getElementById('confirmDeleteExpenseBtn');
  const ticketInput = document.getElementById('ticketFile');
  const ticketDropzone = document.getElementById('ticketDropzone');
  const ticketFileName = document.getElementById('ticketFileName');
  const ticketSubmitBtn = document.querySelector('#ticketForm .ticket-submit-btn');
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

  if (editExpenseModal) {
    editExpenseModal.addEventListener('hidden.bs.modal', () => {
      editingExpenseId = null;
      if (editExpenseForm instanceof HTMLFormElement) {
        editExpenseForm.reset();
        window.NetoUI?.clearMessage(editExpenseForm);
      }
    });
  }

  confirmDeleteExpenseBtn?.addEventListener('click', async () => {
    if (!deletingExpenseId) {
      return;
    }

    const form = document.getElementById('expenseForm');
    const originalContent = confirmDeleteExpenseBtn.innerHTML;
    confirmDeleteExpenseBtn.disabled = true;
    confirmDeleteExpenseBtn.innerHTML = `${checkIcon()} Borrando...`;

    try {
      await window.NetoApi.deleteExpense(deletingExpenseId);
      await refreshExpenses();
      deletingExpenseId = null;

      if (deleteExpenseModal && typeof bootstrap !== 'undefined') {
        bootstrap.Modal.getOrCreateInstance(deleteExpenseModal).hide();
      }

      window.NetoUI?.clearMessage(form);
      showExpensesToast('Gasto borrado correctamente.', 'success');
    } catch (error) {
      showExpensesToast(error.message || 'No se pudo borrar el gasto.', 'error');
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

  expenseForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    window.NetoUI?.clearMessage(form);

    try {
      const payload = {
        merchant: form.merchant.value,
        expenseDate: parseDateToApi(form.expenseDate.value),
        originalAmount: Number(form.originalAmount.value),
        currency: form.currency.value,
        category: form.category.value,
        description: form.description.value,
      };

      if (!payload.expenseDate) {
        showExpensesToast('Fecha inválida. Selecciona una fecha válida.', 'error');
        return;
      }

      await window.NetoApi.createExpense(payload);

      form.reset();
      await refreshExpenses();
      window.NetoUI?.clearMessage(form);
      showExpensesToast('Gasto guardado correctamente.', 'success');
    } catch (error) {
      showExpensesToast(error.message || 'No se pudo guardar el gasto.', 'error');
    }
  });

  editExpenseForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    window.NetoUI?.clearMessage(form);

    if (!editingExpenseId) {
      window.NetoUI?.showMessage(form, 'No hay gasto seleccionado para editar.', 'error');
      return;
    }

    try {
      const apiDate = parseDateToApi(form.expenseDate.value);
      if (!apiDate) {
        showExpensesToast('Fecha inválida. Selecciona una fecha válida.', 'error');
        return;
      }

      await window.NetoApi.updateExpense(editingExpenseId, {
        merchant: form.merchant.value,
        expenseDate: apiDate,
        originalAmount: Number(form.originalAmount.value),
        currency: form.currency.value,
        category: form.category.value,
        description: form.description.value,
      });

      await refreshExpenses();
      window.NetoUI?.clearMessage(expenseForm);
      showExpensesToast('Gasto actualizado correctamente.', 'success');

      const modalElement = document.getElementById('editExpenseModal');
      if (modalElement && typeof bootstrap !== 'undefined') {
        const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
        modal.hide();
      }

      editingExpenseId = null;
      form.reset();
    } catch (error) {
      showExpensesToast(error.message || 'No se pudo actualizar el gasto.', 'error');
    }
  });

  document.getElementById('ticketForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    window.NetoUI?.clearMessage(form);
    const file = droppedTicketFile || ticketInput?.files?.[0] || null;
    if (!file) return;

    const originalTicketLabel = ticketSubmitBtn?.textContent || 'Procesar ticket';
    if (ticketSubmitBtn) {
      ticketSubmitBtn.classList.add('is-loading');
      ticketSubmitBtn.textContent = '';
      ticketSubmitBtn.setAttribute('aria-busy', 'true');
    }

    try {
      await window.NetoApi.uploadTicket(file);
      showExpensesToast('Ticket procesado y gasto agregado automáticamente.', 'success');
      form.reset();
      droppedTicketFile = null;
      renderSelectedTicketName(null);
      await refreshExpenses();
    } catch (error) {
      showExpensesToast(error.message || 'No se pudo procesar el ticket.', 'error');
    } finally {
      if (ticketSubmitBtn) {
        ticketSubmitBtn.classList.remove('is-loading');
        ticketSubmitBtn.textContent = originalTicketLabel;
        ticketSubmitBtn.removeAttribute('aria-busy');
      }
    }
  });

  document.getElementById('expensesBody')?.addEventListener('click', async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const editBtn = target.closest('.edit-expense-btn');
    if (editBtn instanceof HTMLButtonElement) {
      await handleEditExpenseClick(editBtn);
      return;
    }

    const deleteBtn = target.closest('.delete-expense-btn');
    if (!(deleteBtn instanceof HTMLButtonElement)) {
      return;
    }

    await handleDeleteExpenseClick(deleteBtn);
  });

  refreshExpenses();
});

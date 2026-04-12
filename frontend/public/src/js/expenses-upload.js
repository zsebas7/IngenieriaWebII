let pendingExpense = null;
let droppedTicketFile = null;

function setPendingModalVisible(visible) {
  const modalElement = document.getElementById('ticketConfirmModal');
  if (!modalElement || typeof bootstrap === 'undefined') return;
  const modalInstance = bootstrap.Modal.getOrCreateInstance(modalElement);
  if (visible) {
    modalInstance.show();
    return;
  }
  modalInstance.hide();
}

function renderPendingExpenseSummary(expense) {
  const summary = document.getElementById('ticketPendingSummary');
  if (!summary) return;
  if (!expense) {
    summary.textContent = 'Todavia no hay ticket pendiente de confirmacion.';
    return;
  }

  summary.textContent = `Comercio: ${expense.merchant || '-'} | Fecha: ${window.NetoExpensesHelpers.formatDateDisplay(expense.expenseDate)} | Monto: ${expense.currency || 'ARS'} ${Number(expense.originalAmount || 0).toFixed(2)}`;
}

function fillPendingForm(expense) {
  const form = document.getElementById('ticketConfirmForm');
  if (!(form instanceof HTMLFormElement) || !expense) return;

  form.merchant.value = expense.merchant || '';
  form.expenseDate.value = window.NetoExpensesHelpers.formatDateDisplay(expense.expenseDate || '');
  const picker = document.getElementById('confirmExpenseDatePicker');
  if (picker instanceof HTMLInputElement) {
    picker.value = window.NetoExpensesHelpers.formatDateForInput(expense.expenseDate || '');
  }
  form.originalAmount.value = Number(expense.originalAmount || 0).toFixed(2);
  form.currency.value = expense.currency || 'ARS';
  window.NetoExpensesHelpers.ensureSelectHasOption(form.category, expense.category || '');
  form.category.value = expense.category || '';
  form.description.value = expense.description || '';
}

function getCurrentTicketFile() {
  const input = document.getElementById('ticketFile');
  return droppedTicketFile || input?.files?.[0] || null;
}

function renderSelectedTicketName(file) {
  const label = document.getElementById('ticketFileName');
  if (!label) return;
  label.textContent = file ? `Archivo: ${file.name}` : 'Ningun archivo seleccionado';
}

async function removePendingExpenseSilently() {
  if (!pendingExpense?.id) {
    pendingExpense = null;
    setPendingModalVisible(false);
    renderPendingExpenseSummary(null);
    return;
  }

  try {
    await window.NetoApi.deleteExpense(pendingExpense.id);
  } catch {
    // Silent cleanup best-effort.
  }

  pendingExpense = null;
  setPendingModalVisible(false);
  renderPendingExpenseSummary(null);
}

function renderLatestTicket(expense) {
  const target = document.getElementById('latestTicketCard');
  if (!target) return;
  if (!expense) {
    target.innerHTML = '<div class="empty-state">Aun no procesaste tickets en esta sesion.</div>';
    return;
  }

  target.innerHTML = `
    <article class="planning-item">
      <div class="planning-item-top">
        <div class="planning-item-title">${expense.merchant || 'Sin comercio'}</div>
        <span class="status-chip good">Confirmado</span>
      </div>
      <div class="planning-item-meta">Fecha: ${window.NetoExpensesHelpers.formatDateDisplay(expense.expenseDate)}</div>
      <div class="planning-item-meta">Monto: ${expense.currency || 'ARS'} ${Number(expense.originalAmount || 0).toFixed(2)}</div>
      <div class="planning-item-meta">Categoria: ${expense.category || 'Otros'}</div>
    </article>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  window.NetoAuth.requireAuth();

  const helpers = window.NetoExpensesHelpers;
  if (!helpers) return;

  helpers.applyDateMasks();
  helpers.setupDatePickerTriggers();
  setPendingModalVisible(false);
  renderPendingExpenseSummary(null);
  renderLatestTicket(null);

  const ticketInput = document.getElementById('ticketFile');
  const dropzone = document.getElementById('ticketDropzone');
  const uploadForm = document.getElementById('ticketUploadForm');
  const confirmForm = document.getElementById('ticketConfirmForm');
  const cancelBtn = document.getElementById('cancelTicketConfirmBtn');
  const uploadBtn = uploadForm?.querySelector('.ticket-submit-btn');

  ticketInput?.addEventListener('change', () => {
    droppedTicketFile = null;
    renderSelectedTicketName(ticketInput.files?.[0] || null);
  });

  if (dropzone && ticketInput) {
    ['dragenter', 'dragover'].forEach((eventName) => {
      dropzone.addEventListener(eventName, (event) => {
        event.preventDefault();
        event.stopPropagation();
        dropzone.classList.add('is-dragover');
      });
    });

    ['dragleave', 'drop'].forEach((eventName) => {
      dropzone.addEventListener(eventName, (event) => {
        event.preventDefault();
        event.stopPropagation();
        dropzone.classList.remove('is-dragover');
      });
    });

    dropzone.addEventListener('drop', (event) => {
      const file = event.dataTransfer?.files?.[0] || null;
      if (!file) return;
      droppedTicketFile = file;
      renderSelectedTicketName(file);
      try {
        const transfer = new DataTransfer();
        transfer.items.add(file);
        ticketInput.files = transfer.files;
      } catch {
        // Ignore assignment limitations.
      }
    });
  }

  uploadForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const file = getCurrentTicketFile();
    if (!file) {
      helpers.showToast('Selecciona un ticket para continuar.', 'error');
      return;
    }

    await removePendingExpenseSilently();

    const originalLabel = uploadBtn?.textContent || 'Procesar ticket';
    if (uploadBtn) {
      uploadBtn.classList.add('is-loading');
      uploadBtn.setAttribute('aria-busy', 'true');
    }

    try {
      const created = await window.NetoApi.uploadTicket(file);

      pendingExpense = {
        id: created.id || null,
        merchant: created.merchant,
        expenseDate: created.expenseDate,
        originalAmount: created.originalAmount,
        currency: created.currency,
        category: created.category,
        description: created.description,
      };

      fillPendingForm(pendingExpense);
      renderPendingExpenseSummary(pendingExpense);
      setPendingModalVisible(true);
      helpers.showToast('Ticket procesado. Revisa y confirma los datos.', 'success');
    } catch (error) {
      helpers.showToast(error.message || 'No se pudo procesar el ticket.', 'error');
    } finally {
      if (uploadBtn) {
        uploadBtn.classList.remove('is-loading');
        uploadBtn.textContent = originalLabel;
        uploadBtn.removeAttribute('aria-busy');
      }
    }
  });

  confirmForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!pendingExpense) return;

    const form = event.currentTarget;
    const apiDate = helpers.parseDateToApi(form.expenseDate.value);
    if (!apiDate) {
      helpers.showToast('Fecha invalida. Usa formato dd/mm/aaaa.', 'error');
      return;
    }

    try {
      const payload = {
        merchant: form.merchant.value,
        expenseDate: apiDate,
        originalAmount: Number(form.originalAmount.value),
        currency: form.currency.value,
        category: form.category.value,
        description: form.description.value,
      };

      let confirmedExpense = null;
      if (pendingExpense.id) {
        confirmedExpense = await window.NetoApi.updateExpense(pendingExpense.id, payload);
      } else {
        confirmedExpense = await window.NetoApi.createExpense(payload);
      }

      helpers.showToast('Gasto por ticket confirmado correctamente.', 'success');
      renderLatestTicket(confirmedExpense || payload);
      pendingExpense = null;
      setPendingModalVisible(false);
      renderPendingExpenseSummary(null);
      uploadForm?.reset();
      droppedTicketFile = null;
      renderSelectedTicketName(null);
    } catch (error) {
      helpers.showToast(error.message || 'No se pudo confirmar el ticket.', 'error');
    }
  });

  cancelBtn?.addEventListener('click', async () => {
    await removePendingExpenseSilently();
    helpers.showToast('Carga de ticket cancelada.', 'success');
  });
});

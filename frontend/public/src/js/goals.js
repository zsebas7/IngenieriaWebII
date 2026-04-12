let editingGoalId = null;
let deletingGoalId = null;
let savingsGoalId = null;
let hasAppliedGoalFocus = false;

function formatMoney(currency, value) {
  return `${currency} ${Number(value || 0).toFixed(2)}`;
}

function pencilIcon() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';
}

function trashIcon() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>';
}

function escapeHtmlAttr(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function showGoalsToast(message, type = 'success') {
  if (window.NetoToast?.show) {
    window.NetoToast.show(message, type, { stackId: 'goalsToastStack', leaveDelay: 2300, removeDelay: 230 });
  }
}

function parseApiDate(dateValue) {
  const value = String(dateValue || '').trim();
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const [, year, month, day] = match;
  const parsed = new Date(Number(year), Number(month) - 1, Number(day));
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function startOfDayLocal(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function daysUntilDeadline(dateValue) {
  const deadline = parseApiDate(dateValue);
  if (!deadline) return null;

  const today = startOfDayLocal(new Date());
  const target = startOfDayLocal(deadline);
  const diffMs = target.getTime() - today.getTime();
  return Math.round(diffMs / 86400000);
}

function buildDeadlineAlert(daysLeft, isCompleted) {
  if (isCompleted || daysLeft === null) return '';

  if (daysLeft < 0) {
    const elapsed = Math.abs(daysLeft);
    return `<div class="goal-deadline-alert goal-deadline-alert--danger">Meta vencida hace ${elapsed} dia${elapsed === 1 ? '' : 's'}.</div>`;
  }

  if (daysLeft === 0) {
    return '<div class="goal-deadline-alert goal-deadline-alert--danger">Vence hoy y la meta aun no fue completada.</div>';
  }

  if (daysLeft <= 3) {
    return `<div class="goal-deadline-alert goal-deadline-alert--danger">Faltan ${daysLeft} dia${daysLeft === 1 ? '' : 's'} para la fecha objetivo.</div>`;
  }

  return '';
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

function openEditGoalModal(button) {
  const form = document.getElementById('editGoalForm');
  if (!(form instanceof HTMLFormElement)) return;

  editingGoalId = button.dataset.id || null;
  form.goalTitle.value = button.dataset.title || '';
  form.goalAmount.value = Number(button.dataset.targetAmount || 0).toFixed(2);
  form.goalCurrency.value = button.dataset.currency || 'ARS';
  form.goalDeadline.value = formatDateDisplay(button.dataset.deadline || '');

  const summary = document.getElementById('editGoalSummary');
  if (summary) {
    summary.textContent = `Meta: ${button.dataset.title || '-'} | Objetivo: ${formatMoney(button.dataset.currency || 'ARS', Number(button.dataset.targetAmount || 0))}`;
  }

  const modalElement = document.getElementById('editGoalModal');
  if (!modalElement || typeof bootstrap === 'undefined') return;
  bootstrap.Modal.getOrCreateInstance(modalElement).show();
}

function openDeleteGoalModal(button) {
  deletingGoalId = button.dataset.id || null;

  const summary = document.getElementById('deleteGoalSummary');
  if (summary) {
    summary.textContent = `Meta: ${button.dataset.title || '-'} | Fecha objetivo: ${formatDateDisplay(button.dataset.deadline || '-')}`;
  }

  const modalElement = document.getElementById('deleteGoalModal');
  if (!modalElement || typeof bootstrap === 'undefined') return;
  bootstrap.Modal.getOrCreateInstance(modalElement).show();
}

function openAddSavingsModal(button) {
  const form = document.getElementById('addSavingsForm');
  if (!(form instanceof HTMLFormElement)) return;

  savingsGoalId = button.dataset.id || null;
  form.savingsAmount.value = '';

  const summary = document.getElementById('addSavingsSummary');
  if (summary) {
    summary.textContent = `Meta: ${button.dataset.title || '-'} | Ahorrado actual: ${formatMoney(button.dataset.currency || 'ARS', Number(button.dataset.savedAmount || 0))}`;
  }

  const modalElement = document.getElementById('addSavingsModal');
  if (!modalElement || typeof bootstrap === 'undefined') return;
  bootstrap.Modal.getOrCreateInstance(modalElement).show();
}

function renderGoalCards(goals) {
  if (!Array.isArray(goals) || goals.length === 0) {
    return '<div class="empty-state">No hay metas para mostrar.</div>';
  }

  return goals
    .map((goal) => {
      const saved = Number(goal.savedAmount || 0);
      const target = Number(goal.targetAmount || 0);
      const ratio = target > 0 ? saved / target : 0;
      const rawPercent = Math.max(ratio * 100, 0);
      const progressPercent = Math.min(rawPercent, 100);
      const remaining = Math.max(target - saved, 0);
      const isCompleted = saved >= target && target > 0;
      const daysLeft = daysUntilDeadline(goal.deadline);
      const isExpired = daysLeft !== null && daysLeft < 0 && !isCompleted;
      const statusClass = isExpired ? 'danger' : isCompleted ? 'warn' : 'good';
      const statusText = isExpired ? 'Expirada' : isCompleted ? 'Completada' : 'Activa';
      const deadlineAlert = buildDeadlineAlert(daysLeft, isCompleted);

      return `
        <article class="planning-item" data-goal-id="${escapeHtmlAttr(goal.id)}">
          <div class="planning-item-top">
            <div class="planning-item-title">${goal.title || 'Meta'}</div>
            <div class="planning-item-actions">
              <span class="status-chip ${statusClass}">${statusText}</span>
              <button class="btn btn-sm btn-neto add-savings-btn" type="button" data-id="${escapeHtmlAttr(goal.id)}" data-title="${escapeHtmlAttr(goal.title)}" data-currency="${escapeHtmlAttr(goal.currency || 'ARS')}" data-saved-amount="${escapeHtmlAttr(goal.savedAmount)}" title="Cargar ahorro" aria-label="Cargar ahorro">Cargar ahorro</button>
              <button class="btn btn-sm btn-outline-primary icon-action-btn edit-goal-btn" type="button" data-id="${escapeHtmlAttr(goal.id)}" data-title="${escapeHtmlAttr(goal.title)}" data-target-amount="${escapeHtmlAttr(goal.targetAmount)}" data-currency="${escapeHtmlAttr(goal.currency || 'ARS')}" data-deadline="${escapeHtmlAttr(goal.deadline)}" title="Editar meta" aria-label="Editar meta">${pencilIcon()}</button>
              <button class="btn btn-sm btn-outline-danger icon-action-btn delete-goal-btn" type="button" data-id="${escapeHtmlAttr(goal.id)}" data-title="${escapeHtmlAttr(goal.title)}" data-deadline="${escapeHtmlAttr(goal.deadline)}" title="Borrar meta" aria-label="Borrar meta">${trashIcon()}</button>
            </div>
          </div>
          <div class="planning-item-meta">Objetivo: ${formatMoney(goal.currency || 'ARS', goal.targetAmount)}</div>
          <div class="planning-item-meta">Ahorrado: ${formatMoney(goal.currency || 'ARS', saved)} | Falta: ${formatMoney(goal.currency || 'ARS', remaining)}</div>
          <div class="planning-item-meta">Fecha objetivo: ${formatDateDisplay(goal.deadline)}</div>
          ${deadlineAlert}
          <div class="planning-progress">
            <div class="planning-progress-row">
              <span class="planning-item-meta">Progreso de la meta</span>
              <span class="planning-item-meta">${rawPercent.toFixed(1)}%</span>
            </div>
            <div class="progress progress-modern">
              <div class="progress-bar ${isExpired ? 'progress-bar--danger' : isCompleted ? 'progress-bar--warn' : 'progress-bar--good'}" style="width:${progressPercent}%"></div>
            </div>
          </div>
        </article>
      `;
    })
    .join('');
}

function renderGoalList(goals) {
  const activeContainer = document.getElementById('goalList');
  const expiredContainer = document.getElementById('expiredGoalList');
  if (!activeContainer || !expiredContainer) return;

  const list = Array.isArray(goals) ? goals : [];
  const activeGoals = [];
  const expiredGoals = [];

  list.forEach((goal) => {
    const saved = Number(goal.savedAmount || 0);
    const target = Number(goal.targetAmount || 0);
    const isCompleted = saved >= target && target > 0;
    const daysLeft = daysUntilDeadline(goal.deadline);
    const isExpired = daysLeft !== null && daysLeft < 0 && !isCompleted;

    if (isExpired) {
      expiredGoals.push(goal);
      return;
    }

    activeGoals.push(goal);
  });

  activeContainer.innerHTML = activeGoals.length
    ? renderGoalCards(activeGoals)
    : '<div class="empty-state">No hay metas activas en este momento.</div>';

  expiredContainer.innerHTML = expiredGoals.length
    ? renderGoalCards(expiredGoals)
    : '<div class="empty-state">No hay metas expiradas.</div>';

  if (!hasAppliedGoalFocus) {
    applyGoalFocusFromQuery();
  }
}

function applyGoalFocusFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const goalId = (params.get('goal') || '').trim();
  if (!goalId) {
    hasAppliedGoalFocus = true;
    return;
  }

  const selector = `.planning-item[data-goal-id="${goalId.replaceAll('"', '\\"')}"]`;
  const targetCard = document.querySelector(selector);
  if (!(targetCard instanceof HTMLElement)) {
    hasAppliedGoalFocus = true;
    return;
  }

  targetCard.classList.add('dashboard-focus-target');
  targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });

  window.setTimeout(() => {
    targetCard.classList.remove('dashboard-focus-target');
  }, 2200);

  hasAppliedGoalFocus = true;
}

async function refreshGoalsData() {
  try {
    const goals = await window.NetoApi.listGoals();
    renderGoalList(goals || []);
  } catch {
    renderGoalList([]);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.NetoAuth.requireAuth();
  applyDateMasks();
  setupDatePickerTriggers();

  const goalForm = document.getElementById('goalForm');
  const goalList = document.getElementById('goalList');
  const expiredGoalList = document.getElementById('expiredGoalList');
  const editGoalForm = document.getElementById('editGoalForm');
  const editGoalModal = document.getElementById('editGoalModal');
  const deleteGoalModal = document.getElementById('deleteGoalModal');
  const addSavingsModal = document.getElementById('addSavingsModal');
  const addSavingsForm = document.getElementById('addSavingsForm');
  const confirmDeleteGoalBtn = document.getElementById('confirmDeleteGoalBtn');

  goalList?.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const editBtn = target.closest('.edit-goal-btn');
    if (editBtn instanceof HTMLButtonElement) {
      openEditGoalModal(editBtn);
      return;
    }

    const addSavingsBtn = target.closest('.add-savings-btn');
    if (addSavingsBtn instanceof HTMLButtonElement) {
      openAddSavingsModal(addSavingsBtn);
      return;
    }

    const deleteBtn = target.closest('.delete-goal-btn');
    if (!(deleteBtn instanceof HTMLButtonElement)) return;
    openDeleteGoalModal(deleteBtn);
  });

  expiredGoalList?.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const editBtn = target.closest('.edit-goal-btn');
    if (editBtn instanceof HTMLButtonElement) {
      openEditGoalModal(editBtn);
      return;
    }

    const addSavingsBtn = target.closest('.add-savings-btn');
    if (addSavingsBtn instanceof HTMLButtonElement) {
      openAddSavingsModal(addSavingsBtn);
      return;
    }

    const deleteBtn = target.closest('.delete-goal-btn');
    if (!(deleteBtn instanceof HTMLButtonElement)) return;
    openDeleteGoalModal(deleteBtn);
  });

  goalForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    window.NetoUI?.clearMessage(form);

    try {
      const apiDeadline = parseDateToApi(form.goalDeadline.value);
      if (!apiDeadline) {
        window.NetoUI?.showMessage(form, 'Fecha invalida. Selecciona una fecha valida.', 'error');
        return;
      }

      await window.NetoApi.createGoal({
        title: form.goalTitle.value,
        targetAmount: Number(form.goalAmount.value),
        currency: form.goalCurrency.value,
        deadline: apiDeadline,
      });
      form.reset();
      window.NetoUI?.clearMessage(form);
      showGoalsToast('Meta guardada.', 'success');
      await refreshGoalsData();
    } catch (error) {
      showGoalsToast(error.message || 'No se pudo guardar la meta.', 'error');
    }
  });

  editGoalForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    window.NetoUI?.clearMessage(form);

    if (!editingGoalId) {
      showGoalsToast('No hay meta seleccionada para editar.', 'error');
      return;
    }

    try {
      const apiDeadline = parseDateToApi(form.goalDeadline.value);
      if (!apiDeadline) {
        showGoalsToast('Fecha invalida. Selecciona una fecha valida.', 'error');
        return;
      }

      await window.NetoApi.updateGoal(editingGoalId, {
        title: form.goalTitle.value,
        targetAmount: Number(form.goalAmount.value),
        currency: form.goalCurrency.value,
        deadline: apiDeadline,
      });

      await refreshGoalsData();
      showGoalsToast('Meta actualizada.', 'success');

      if (editGoalModal && typeof bootstrap !== 'undefined') {
        bootstrap.Modal.getOrCreateInstance(editGoalModal).hide();
      }
    } catch (error) {
      showGoalsToast(error.message || 'No se pudo actualizar la meta.', 'error');
    }
  });

  if (editGoalModal) {
    editGoalModal.addEventListener('hidden.bs.modal', () => {
      editingGoalId = null;
      if (editGoalForm instanceof HTMLFormElement) {
        editGoalForm.reset();
        window.NetoUI?.clearMessage(editGoalForm);
      }
    });
  }

  confirmDeleteGoalBtn?.addEventListener('click', async () => {
    if (!deletingGoalId) return;

    const originalContent = confirmDeleteGoalBtn.innerHTML;
    confirmDeleteGoalBtn.disabled = true;
    confirmDeleteGoalBtn.innerHTML = 'Borrando...';

    try {
      await window.NetoApi.deleteGoal(deletingGoalId);
      deletingGoalId = null;
      await refreshGoalsData();

      if (deleteGoalModal && typeof bootstrap !== 'undefined') {
        bootstrap.Modal.getOrCreateInstance(deleteGoalModal).hide();
      }

      showGoalsToast('Meta borrada.', 'success');
    } catch (error) {
      showGoalsToast(error.message || 'No se pudo borrar la meta.', 'error');
    } finally {
      confirmDeleteGoalBtn.disabled = false;
      confirmDeleteGoalBtn.innerHTML = originalContent;
    }
  });

  if (deleteGoalModal) {
    deleteGoalModal.addEventListener('hidden.bs.modal', () => {
      deletingGoalId = null;
    });
  }

  addSavingsForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    window.NetoUI?.clearMessage(form);

    if (!savingsGoalId) {
      showGoalsToast('No hay meta seleccionada para cargar ahorro.', 'error');
      return;
    }

    try {
      await window.NetoApi.addGoalSavings(savingsGoalId, {
        amount: Number(form.savingsAmount.value),
      });

      await refreshGoalsData();
      showGoalsToast('Ahorro cargado correctamente.', 'success');

      if (addSavingsModal && typeof bootstrap !== 'undefined') {
        bootstrap.Modal.getOrCreateInstance(addSavingsModal).hide();
      }
    } catch (error) {
      showGoalsToast(error.message || 'No se pudo cargar el ahorro.', 'error');
    }
  });

  if (addSavingsModal) {
    addSavingsModal.addEventListener('hidden.bs.modal', () => {
      savingsGoalId = null;
      if (addSavingsForm instanceof HTMLFormElement) {
        addSavingsForm.reset();
        window.NetoUI?.clearMessage(addSavingsForm);
      }
    });
  }

  refreshGoalsData();
});

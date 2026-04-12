window.NetoExpensesHelpers = {
  formatDateDisplay(dateValue) {
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
  },

  parseDateToApi(input) {
    const value = String(input || '').trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) return null;
    const [, day, month, year] = match;
    return `${year}-${month}-${day}`;
  },

  formatDateForInput(dateValue) {
    const value = String(dateValue || '').trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) return '';
    const [, day, month, year] = match;
    return `${year}-${month}-${day}`;
  },

  maskDateInputValue(value) {
    const digits = String(value || '').replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  },

  applyDateMasks(root = document) {
    const dateInputs = root.querySelectorAll('input[data-date-mask="ddmmyyyy"]');
    dateInputs.forEach((input) => {
      input.addEventListener('input', () => {
        const masked = this.maskDateInputValue(input.value);
        if (input.value !== masked) {
          input.value = masked;
        }
      });
    });
  },

  setupDatePickerTriggers(root = document) {
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
            const currentApiDate = this.parseDateToApi(visibleInput.value);
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
  },

  ensureSelectHasOption(selectElement, value) {
    if (!(selectElement instanceof HTMLSelectElement)) return;
    if (!value) return;
    const exists = Array.from(selectElement.options).some((option) => option.value === value);
    if (exists) return;
    const dynamicOption = document.createElement('option');
    dynamicOption.value = value;
    dynamicOption.textContent = value;
    selectElement.appendChild(dynamicOption);
  },

  showToast(message, type = 'success') {
    if (window.NetoToast?.show) {
      window.NetoToast.show(message, type, { stackId: 'expensesToastStack', leaveDelay: 2300, removeDelay: 230 });
      return;
    }

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
  },

  pencilIcon() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';
  },

  trashIcon() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>';
  },

  checkIcon() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5L20 7"/></svg>';
  },

  escapeHtmlAttr(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('"', '&quot;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;');
  },
};

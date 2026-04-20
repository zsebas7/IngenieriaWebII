(() => {
  const MONTH_NAMES_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  function formatMonthLabel(monthValue) {
    const match = String(monthValue || '').match(/^(\d{4})-(\d{2})$/);
    if (!match) return '-';
    const [, year, month] = match;
    const monthIndex = Number(month) - 1;
    if (monthIndex < 0 || monthIndex > 11) return '-';
    return `${MONTH_NAMES_ES[monthIndex]} ${year}`;
  }

  function ensureYearOptions(yearSelect) {
    if (!(yearSelect instanceof HTMLSelectElement)) return;
    if (yearSelect.options.length) return;

    const currentYear = new Date().getFullYear();
    for (let year = currentYear - 10; year <= currentYear + 5; year += 1) {
      const option = document.createElement('option');
      option.value = String(year);
      option.textContent = String(year);
      yearSelect.appendChild(option);
    }
  }

  function bindMonthPicker(options) {
    const monthInput = document.getElementById(options.monthInputId || 'monthInput');
    const monthChip = document.getElementById(options.monthChipId || 'monthChip');
    const monthPopover = document.getElementById(options.monthPopoverId || 'monthPopover');
    const monthSelect = document.getElementById(options.monthSelectId || 'monthSelect');
    const yearSelect = document.getElementById(options.yearSelectId || 'yearSelect');
    const cancelBtn = document.getElementById(options.cancelBtnId || 'cancelMonthBtn');
    const applyBtn = document.getElementById(options.applyBtnId || 'applyMonthBtn');
    const onApply = typeof options.onApply === 'function' ? options.onApply : null;

    if (!(monthInput instanceof HTMLInputElement) || !(monthChip instanceof HTMLElement)) {
      return {
        sync: () => {},
      };
    }

    function syncMonthChip() {
      const label = formatMonthLabel(monthInput.value);
      monthChip.textContent = label;
      monthChip.title = `Período seleccionado: ${label}`;
    }

    function syncPopoverFromMonthInput() {
      if (!(monthSelect instanceof HTMLSelectElement) || !(yearSelect instanceof HTMLSelectElement)) return;
      ensureYearOptions(yearSelect);

      const match = String(monthInput.value || '').match(/^(\d{4})-(\d{2})$/);
      if (!match) return;
      const [, year, month] = match;
      yearSelect.value = year;
      monthSelect.value = month;
    }

    function toggleMonthPopover(shouldOpen) {
      if (!(monthPopover instanceof HTMLElement)) return;

      const open = shouldOpen ?? monthPopover.hidden;
      if (open) {
        syncPopoverFromMonthInput();
        monthPopover.hidden = false;
        return;
      }

      monthPopover.hidden = true;
    }

    async function applyMonthFromPopover() {
      if (!(monthSelect instanceof HTMLSelectElement) || !(yearSelect instanceof HTMLSelectElement)) return;
      const nextValue = `${yearSelect.value}-${monthSelect.value}`;
      if (monthInput.value === nextValue) {
        toggleMonthPopover(false);
        return;
      }

      monthInput.value = nextValue;
      syncMonthChip();
      toggleMonthPopover(false);

      if (onApply) {
        await onApply(nextValue);
      }
    }

    monthChip.addEventListener('click', () => toggleMonthPopover());
    cancelBtn?.addEventListener('click', () => toggleMonthPopover(false));
    applyBtn?.addEventListener('click', async () => {
      await applyMonthFromPopover();
    });

    document.addEventListener('click', (event) => {
      if (!(monthPopover instanceof HTMLElement) || monthPopover.hidden) return;
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (monthPopover.contains(target) || target === monthChip) return;
      toggleMonthPopover(false);
    });

    syncMonthChip();

    return {
      sync: syncMonthChip,
      toggle: toggleMonthPopover,
      apply: applyMonthFromPopover,
    };
  }

  window.NetoMonthPicker = {
    bind: bindMonthPicker,
    formatMonthLabel,
  };
})();

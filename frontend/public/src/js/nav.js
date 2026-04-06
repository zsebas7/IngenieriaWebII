document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  if (!body.classList.contains('with-sidebar')) return;

  const toggle = document.getElementById('navToggle');
  const storageKey = 'neto_sidebar_expanded';

  const applyState = (expanded) => {
    body.classList.toggle('sidebar-expanded', expanded);
    if (toggle) {
      toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
      toggle.setAttribute('title', expanded ? 'Ocultar etiquetas' : 'Mostrar etiquetas');
    }
  };

  const stored = localStorage.getItem(storageKey);
  const expanded = stored === '1';
  applyState(expanded);

  if (toggle) {
    toggle.addEventListener('click', () => {
      const next = !body.classList.contains('sidebar-expanded');
      applyState(next);
      localStorage.setItem(storageKey, next ? '1' : '0');
    });
  }
});

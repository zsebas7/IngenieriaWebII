function getCurrentPageName() {
  const raw = window.location.pathname.split('/').pop() || '';
  const normalized = raw.trim().toLowerCase();
  return normalized || 'dashboard.html';
}

function linkMarkup(item, currentPage) {
  const isActive = currentPage === item.href;
  const activeClass = isActive ? ' active' : '';
  const ariaCurrent = isActive ? ' aria-current="page"' : '';
  return `<a class="chip${activeClass}" href="${item.href}" aria-label="${item.label}"${ariaCurrent}>
    <span class="chip-icon" aria-hidden="true">${item.icon}</span>
    <span class="chip-label">${item.label}</span>
  </a>`;
}

function renderSidebar() {
  const body = document.body;
  if (!body.classList.contains('with-sidebar')) return;

  const nav = document.querySelector('nav.subnav[data-component="sidebar"], nav.subnav');
  if (!(nav instanceof HTMLElement)) return;

  const currentPage = getCurrentPageName();
  const mainLinks = [
    {
      href: 'dashboard.html',
      label: 'Resumen',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 13h8V3H3zM13 21h8V11h-8zM13 3h8v4h-8zM3 21h8v-6H3z"/></svg>',
    },
    {
      href: 'expenses.html',
      label: 'Cargar Gastos',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M4 12h16M4 17h10"/></svg>',
    },
    {
      href: 'expenses-upload.html',
      label: 'Subir Ticket',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M4 20h16"/></svg>',
    },
    {
      href: 'expenses-organize.html',
      label: 'Organizar Gastos',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16"/><path d="M4 12h10"/><path d="M4 18h7"/></svg>',
    },
    {
      href: 'planning.html',
      label: 'Presupuestos',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 4v4M16 4v4M4 10h16M6 20h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z"/></svg>',
    },
    {
      href: 'goals.html',
      label: 'Metas de ahorro',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 3"/></svg>',
    },
    {
      href: 'stats.html',
      label: 'Estadísticas',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19h16M7 16V8M12 16V5M17 16v-3"/></svg>',
    },
  ];

  const toolLinks = [
    {
      href: 'profile.html',
      label: 'Perfil',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21a8 8 0 1 0-16 0M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/></svg>',
    },
  ];

  nav.setAttribute('data-component', 'sidebar');
  nav.innerHTML = `
    <div class="container">
      <div class="subnav-group">
        <p class="subnav-group-title">Principal</p>
        ${mainLinks.map((item) => linkMarkup(item, currentPage)).join('')}
      </div>

      <div class="subnav-group tools">
        <p class="subnav-group-title">Herramientas</p>
        ${toolLinks.map((item) => linkMarkup(item, currentPage)).join('')}
      </div>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  // Legacy cleanup from old collapsible behavior.
  document.body.classList.remove('sidebar-expanded');
  localStorage.removeItem('neto_sidebar_expanded');
  renderSidebar();
});

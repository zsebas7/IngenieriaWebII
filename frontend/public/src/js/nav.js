function getCurrentPageName() {
  const raw = window.location.pathname.split('/').pop() || '';
  const normalized = raw.trim().toLowerCase();
  return normalized || 'dashboard.html';
}

function getCurrentRole() {
  const roleRaw = (sessionStorage.getItem('neto_user') || localStorage.getItem('neto_user') || '').trim();
  if (!roleRaw) return '';

  try {
    return String(JSON.parse(roleRaw)?.role || '').toUpperCase();
  } catch {
    return '';
  }
}

function linkMarkup(item, currentPage) {
  const isActive = currentPage === item.href;
  const activeClass = isActive ? ' active' : '';
  const ariaCurrent = isActive ? ' aria-current="page"' : '';
  const unreadCount = Number(item.unreadCount || 0);
  const showDot = unreadCount > 0;
  const dotMarkup = showDot ? '<span class="chip-notification-dot" aria-hidden="true"></span>' : '';
  const srText = showDot ? `<span class="visually-hidden">${unreadCount} notificación(es) sin leer</span>` : '';
  return `<a class="chip${activeClass}" href="${item.href}" aria-label="${item.label}"${ariaCurrent}>
    <span class="chip-icon" aria-hidden="true">${item.icon}</span>
    <span class="chip-label">${item.label}</span>
    ${dotMarkup}
    ${srText}
  </a>`;
}

function renderSidebar(options = {}) {
  const chatUnreadCount = Number(options.chatUnreadCount || 0);
  const body = document.body;
  if (!body.classList.contains('with-sidebar')) return;

  const nav = document.querySelector('nav.subnav[data-component="sidebar"], nav.subnav');
  if (!(nav instanceof HTMLElement)) return;

  const currentPage = getCurrentPageName();
  const currentRole = getCurrentRole();

  const isAdvisorArea =
    body.hasAttribute('data-advisor-page') || currentPage.startsWith('advisor') || currentRole === 'ADVISOR';

  const userPrimaryLinks = [
    {
      href: 'dashboard.html',
      label: 'Resumen',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 13h8V3H3zM13 21h8V11h-8zM13 3h8v4h-8zM3 21h8v-6H3z"/></svg>',
    },
    {
      href: 'stats.html',
      label: 'Estadísticas',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19h16M7 16V8M12 16V5M17 16v-3"/></svg>',
    },
  ];

  const userGestionLinks = [
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
  ];

  const userChatLinks = [
    {
      href: 'chat-ai.html',
      label: 'Chat con IA',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="14" rx="4"/><path d="M8 10h.01M12 10h.01M16 10h.01"/><path d="M8 20h8"/></svg>',
    },
    {
      href: 'chat-advisor-user.html',
      label: 'Chat con asesor',
      unreadCount: currentPage === 'chat-advisor-user.html' ? 0 : chatUnreadCount,
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 10h.01M12 10h.01M16 10h.01"/><path d="M21 15a4 4 0 0 1-4 4H7l-4 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/></svg>',
    },
  ];

  const advisorPrimaryLinks = [
    {
      href: 'advisor.html',
      label: 'Resumen',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 13h8V3H3zM13 21h8V11h-8zM13 3h8v4h-8zM3 21h8v-6H3z"/></svg>',
    },
    {
      href: 'advisor-users.html',
      label: 'Usuarios',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M8.5 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    },
    {
      href: 'advisor-detail.html',
      label: 'Detalle',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 3h5v5"/><path d="M21 3l-7 7"/></svg>',
    },
  ];

  const advisorChatLinks = [
    {
      href: 'advisor-chats.html',
      label: 'Chats abiertos',
      unreadCount: currentPage === 'advisor-chats.html' ? 0 : chatUnreadCount,
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 10h.01M11 10h.01M15 10h.01"/><path d="M21 15a4 4 0 0 1-4 4H7l-4 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/></svg>',
    },
  ];

  const sharedToolLinks = [
    {
      href: 'profile.html',
      label: 'Perfil',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21a8 8 0 1 0-16 0M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/></svg>',
    },
  ];

  const sectionGroups = isAdvisorArea
    ? [
        { title: 'PRINCIPAL', links: advisorPrimaryLinks },
        { title: 'CHAT', links: advisorChatLinks },
      ]
    : [
        { title: 'PRINCIPAL', links: userPrimaryLinks },
        { title: 'GESTIÓN', links: userGestionLinks },
        { title: 'CHATS', links: userChatLinks },
      ];
  const toolLinks = sharedToolLinks;

  nav.setAttribute('data-component', 'sidebar');
  nav.innerHTML = `
    <div class="container">
      <a class="subnav-brand" href="${isAdvisorArea ? 'advisor.html' : 'dashboard.html'}" aria-label="Neto">
        <span class="logo-mark" aria-hidden="true"></span>
        <span class="subnav-brand-text">Neto</span>
      </a>

      ${sectionGroups
        .map(
          (group) => `<div class="subnav-group">
            <p class="subnav-group-title">${group.title}</p>
            ${group.links.map((item) => linkMarkup(item, currentPage)).join('')}
          </div>`,
        )
        .join('')}

      <div class="subnav-group tools">
        <p class="subnav-group-title">HERRAMIENTAS</p>
        ${toolLinks.map((item) => linkMarkup(item, currentPage)).join('')}
      </div>
    </div>
  `;
}

let chatUnreadIntervalId = null;

async function refreshChatUnreadDot() {
  const role = getCurrentRole();

  if (!['USER', 'ADVISOR'].includes(role) || typeof window.NetoApi?.listAdvisorConversations !== 'function') {
    renderSidebar({ chatUnreadCount: 0 });
    return;
  }

  try {
    const conversations = await window.NetoApi.listAdvisorConversations();
    const unreadCount = Array.isArray(conversations)
      ? conversations.reduce((acc, item) => acc + Number(item?.unreadCount || 0), 0)
      : 0;
    renderSidebar({ chatUnreadCount: unreadCount });
  } catch {
    renderSidebar({ chatUnreadCount: 0 });
  }
}

function startChatUnreadWatcher() {
  if (chatUnreadIntervalId) return;

  refreshChatUnreadDot();
  chatUnreadIntervalId = window.setInterval(() => {
    refreshChatUnreadDot();
  }, 15000);

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      refreshChatUnreadDot();
    }
  });

  window.addEventListener('neto:chat-unread-refresh', () => {
    refreshChatUnreadDot();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  // Legacy cleanup from old collapsible behavior.
  document.body.classList.remove('sidebar-expanded');
  localStorage.removeItem('neto_sidebar_expanded');
  renderSidebar();
  startChatUnreadWatcher();
});

document.addEventListener('DOMContentLoaded', () => {
  window.NetoAuth.requireAuth();
  const user = window.NetoAuth.getCurrentUser();
  const role = String(user?.role || '').toUpperCase();
  if (!user || role !== 'ADVISOR') {
    window.location.href = 'advisor.html';
    return;
  }

  const usersList = document.getElementById('advisorUsersList');
  const conversationsList = document.getElementById('advisorConversationsList');
  const messagesContainer = document.getElementById('advisorChatMessages');
  const titleNode = document.getElementById('advisorChatTitle');
  const statusNode = document.getElementById('advisorChatStatus');
  const form = document.getElementById('advisorChatForm');
  const input = document.getElementById('advisorChatInput');
  const sendBtn = document.getElementById('advisorChatSendBtn');

  let targetUsers = [];
  let conversations = [];
  let activeConversationId = null;
  let socket = null;
  let socketConnected = false;
  let counterpartOnline = false;

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;');
  }

  function notify(message, type = 'error') {
    if (window.NetoToast?.show) {
      window.NetoToast.show(message, type, { stackId: 'advisorChatToastStack', leaveDelay: 2300, removeDelay: 230 });
      return;
    }
    window.NetoUI?.showMessage(document.querySelector('main.container'), message, type);
  }

  function updateLiveStatus() {
    if (!(statusNode instanceof HTMLElement)) return;
    statusNode.className = 'status-chip';

    if (socketConnected && counterpartOnline && activeConversationId) {
      statusNode.classList.add('good');
      statusNode.textContent = 'Conectado en vivo';
      return;
    }

    if (!socketConnected) {
      statusNode.classList.add('warn');
      statusNode.textContent = 'Conectando...';
      return;
    }

    statusNode.classList.add('danger');
    statusNode.textContent = 'Sin conexión';
  }

  function requestPresenceForActiveConversation() {
    if (!socket || !activeConversationId) {
      counterpartOnline = false;
      updateLiveStatus();
      return;
    }

    socket.emit('chat:presence:check', { conversationId: activeConversationId });
  }

  function renderUsers() {
    if (!usersList) return;
    if (!targetUsers.length) {
      usersList.innerHTML = '<div class="empty-state">No hay usuarios disponibles para abrir chats.</div>';
      return;
    }

    usersList.innerHTML = targetUsers
      .map(
        (item) => `
          <button class="chip advisor-open-chat-btn" type="button" data-user-id="${escapeHtml(item.id)}" data-user-name="${escapeHtml(item.fullName)}">
            <span class="chip-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 10h.01M12 10h.01M16 10h.01"/><path d="M21 15a4 4 0 0 1-4 4H7l-4 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/></svg>
            </span>
            <span class="chip-label">Abrir con ${escapeHtml(item.fullName)}</span>
          </button>
        `,
      )
      .join('');
  }

  function renderConversations() {
    if (!conversationsList) return;

    if (!conversations.length) {
      conversationsList.innerHTML = '<div class="empty-state">Aún no abriste conversaciones.</div>';
      return;
    }

    conversationsList.innerHTML = conversations
      .map((conversation) => {
        const active = conversation.id === activeConversationId;
        const userName = conversation.user?.fullName || 'Usuario';
        const unreadCount = Number(conversation?.unreadCount || 0);
        const showUnreadDot = unreadCount > 0 && !active;
        return `
          <button class="chip advisor-conversation-btn${active ? ' active' : ''}" type="button" data-conversation-id="${escapeHtml(conversation.id)}">
            <span class="chip-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="14" rx="4"/><path d="M8 10h.01M12 10h.01M16 10h.01"/><path d="M8 20h8"/></svg>
            </span>
            <span class="chip-label">${escapeHtml(conversation.title || `Chat con ${userName}`)}</span>
            ${showUnreadDot ? '<span class="chat-unread-dot" aria-hidden="true"></span>' : ''}
          </button>
        `;
      })
      .join('');
  }

  function renderMessages(messages) {
    if (!messagesContainer) return;

    if (!Array.isArray(messages) || !messages.length) {
      messagesContainer.innerHTML = '<div class="empty-state">No hay mensajes aún en esta conversación.</div>';
      return;
    }

    messagesContainer.innerHTML = messages
      .map((message) => {
        const senderRole = String(message?.sender?.role || '').toUpperCase();
        const isAdvisorMessage = senderRole === 'ADVISOR';
        const name = message?.sender?.fullName || (isAdvisorMessage ? 'Asesor' : 'Usuario');
        return `
          <article class="planning-item ai-chat-bubble ${isAdvisorMessage ? 'assistant' : 'user'}">
            <div class="planning-item-top">
              <div class="planning-item-title">${escapeHtml(name)}</div>
            </div>
            <p class="planning-item-meta mb-0 ai-chat-content">${escapeHtml(message.content || '').replaceAll('\n', '<br>')}</p>
          </article>
        `;
      })
      .join('');

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function ensureSocketConnected() {
    const token = window.NetoAuth?.getAccessToken?.() || sessionStorage.getItem('neto_access_token') || localStorage.getItem('neto_access_token');
    if (!token || socket || typeof window.io !== 'function') {
      return;
    }

    socketConnected = false;
    updateLiveStatus();
    socket = window.io(`${window.NETO_CONFIG.API_URL}/chat`, {
      transports: ['websocket'],
      auth: { token },
    });

    socket.on('connect', () => {
      socketConnected = true;
      if (activeConversationId) {
        socket.emit('chat:join', { conversationId: activeConversationId });
        requestPresenceForActiveConversation();
      }
      updateLiveStatus();
    });

    socket.on('disconnect', () => {
      socketConnected = false;
      counterpartOnline = false;
      updateLiveStatus();
    });

    socket.on('chat:presence:result', (payload) => {
      if (!payload || payload.conversationId !== activeConversationId) return;
      counterpartOnline = Boolean(payload.counterpartOnline);
      updateLiveStatus();
    });

    socket.on('chat:presence:update', (payload) => {
      if (!payload || payload.conversationId !== activeConversationId) return;
      requestPresenceForActiveConversation();
    });

    socket.on('chat:message:new', (message) => {
      if (!message) return;

      if (message.conversationId === activeConversationId) {
        if (!messagesContainer) return;
        loadMessages(activeConversationId, { refreshConversations: true });
        return;
      }

      loadConversations();
    });
  }

  async function loadUsers() {
    const users = await window.NetoApi.listUsers();
    targetUsers = users.filter((item) => String(item.role || '').toUpperCase() === 'USER');
    renderUsers();
  }

  async function loadConversations() {
    conversations = await window.NetoApi.listAdvisorConversations();
    window.dispatchEvent(new Event('neto:chat-unread-refresh'));

    if (activeConversationId && !conversations.some((item) => item.id === activeConversationId)) {
      activeConversationId = null;
    }

    if (!activeConversationId && conversations.length) {
      activeConversationId = conversations[0].id;
    }

    renderConversations();
    if (activeConversationId) {
      await loadMessages(activeConversationId, { refreshConversations: true });
      const activeConversation = conversations.find((item) => item.id === activeConversationId);
      if (titleNode) {
        titleNode.textContent = activeConversation?.title || 'Conversación activa';
      }
      socket?.emit('chat:join', { conversationId: activeConversationId });
      requestPresenceForActiveConversation();
    } else {
      renderMessages([]);
      counterpartOnline = false;
      updateLiveStatus();
      if (titleNode) {
        titleNode.textContent = 'Seleccione o abra una conversación';
      }
    }
  }

  async function loadMessages(conversationId, options = {}) {
    const refreshConversations = Boolean(options.refreshConversations);
    const messages = await window.NetoApi.listAdvisorConversationMessages(conversationId);
    renderMessages(messages);

    if (refreshConversations) {
      conversations = await window.NetoApi.listAdvisorConversations();
      renderConversations();
      window.dispatchEvent(new Event('neto:chat-unread-refresh'));
    }
  }

  usersList?.addEventListener('click', async (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const btn = target.closest('.advisor-open-chat-btn');
    if (!(btn instanceof HTMLButtonElement)) return;

    const userId = btn.dataset.userId;
    const userName = btn.dataset.userName || 'Usuario';
    if (!userId) return;

    try {
      await window.NetoApi.openAdvisorConversation({ userId, title: `Chat con ${userName}` });
      await loadConversations();
      notify('Conversación abierta.', 'success');
    } catch (error) {
      notify(error.message || 'No se pudo abrir la conversación.', 'error');
    }
  });

  conversationsList?.addEventListener('click', async (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const btn = target.closest('.advisor-conversation-btn');
    if (!(btn instanceof HTMLButtonElement)) return;

    activeConversationId = btn.dataset.conversationId || null;
    renderConversations();
    if (!activeConversationId) return;

    const activeConversation = conversations.find((item) => item.id === activeConversationId);
    if (titleNode) {
      titleNode.textContent = activeConversation?.title || 'Conversación activa';
    }

    await loadMessages(activeConversationId, { refreshConversations: true });
    socket?.emit('chat:join', { conversationId: activeConversationId });
    requestPresenceForActiveConversation();
  });

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const content = String(input?.value || '').trim();
    if (!content || !activeConversationId || !socket) return;

    if (sendBtn instanceof HTMLButtonElement) {
      sendBtn.disabled = true;
      sendBtn.textContent = 'Enviando...';
    }

    socket.emit('chat:message:send', { conversationId: activeConversationId, content }, async (result) => {
      if (!result) {
        notify('No se pudo enviar el mensaje.', 'error');
      } else {
        if (input instanceof HTMLTextAreaElement) {
          input.value = '';
        }
        await loadMessages(activeConversationId, { refreshConversations: true });
      }

      if (sendBtn instanceof HTMLButtonElement) {
        sendBtn.disabled = false;
        sendBtn.textContent = 'Enviar';
      }
    });
  });

  (async () => {
    try {
      ensureSocketConnected();
      await loadUsers();
      await loadConversations();
    } catch (error) {
      notify(error.message || 'No se pudo cargar el chat de asesor.', 'error');
    }
  })();
});

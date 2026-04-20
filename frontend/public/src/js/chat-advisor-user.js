document.addEventListener('DOMContentLoaded', () => {
  const user = window.NetoAuth.requireRole(['USER'], window.NetoRoutes?.user?.dashboard || '/html/user/dashboard.html');
  if (!user) return;

  const conversationsList = document.getElementById('userAdvisorConversationsList');
  const messagesContainer = document.getElementById('userAdvisorChatMessages');
  const titleNode = document.getElementById('userAdvisorChatTitle');
  const statusNode = document.getElementById('userAdvisorChatStatus');
  const form = document.getElementById('userAdvisorChatForm');
  const input = document.getElementById('userAdvisorChatInput');
  const sendBtn = document.getElementById('userAdvisorChatSendBtn');

  let conversations = [];
  let activeConversationId = null;
  let socket = null;
  let socketConnected = false;
  let counterpartOnline = false;

  const escapeHtml = window.NetoDom.escapeHtml;

  function notify(message, type = 'error') {
    if (window.NetoToast?.show) {
      window.NetoToast.show(message, type, { stackId: 'userAdvisorChatToastStack', leaveDelay: 2300, removeDelay: 230 });
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

  function renderConversations() {
    if (!conversationsList) return;

    if (!conversations.length) {
      conversationsList.innerHTML =
        '<div class="empty-state">Aún no hay chats abiertos por asesores para su cuenta.</div>';
      return;
    }

    conversationsList.innerHTML = conversations
      .map((conversation) => {
        const active = conversation.id === activeConversationId;
        const advisorName = conversation.advisor?.fullName || 'Asesor';
        const unreadCount = Number(conversation?.unreadCount || 0);
        const showUnreadDot = unreadCount > 0 && !active;
        return `
          <button class="chip user-advisor-conversation-btn${active ? ' active' : ''}" type="button" data-conversation-id="${escapeHtml(conversation.id)}">
            <span class="chip-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 10h.01M12 10h.01M16 10h.01"/><path d="M21 15a4 4 0 0 1-4 4H7l-4 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/></svg>
            </span>
            <span class="chip-label">${escapeHtml(`Chat con ${advisorName}`)}</span>
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
        const isUserMessage = senderRole === 'USER';
        const name = message?.sender?.fullName || (isUserMessage ? 'Tú' : 'Asesor');
        return `
          <article class="planning-item ai-chat-bubble ${isUserMessage ? 'user' : 'assistant'}">
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
    if (!token || socket || typeof window.io !== 'function') return;

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
        loadMessages(activeConversationId, { refreshConversations: true });
        return;
      }

      loadConversations();
    });
  }

  async function loadConversations() {
    conversations = await window.NetoApi.listAdvisorConversations();

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
        const advisorName = activeConversation?.advisor?.fullName || 'Asesor';
        titleNode.textContent = `Chat con ${advisorName}`;
      }
      socket?.emit('chat:join', { conversationId: activeConversationId });
      requestPresenceForActiveConversation();
    } else {
      renderMessages([]);
      counterpartOnline = false;
      updateLiveStatus();
      if (titleNode) {
        titleNode.textContent = 'Seleccione una conversación para comenzar';
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
    }
  }

  conversationsList?.addEventListener('click', async (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const btn = target.closest('.user-advisor-conversation-btn');
    if (!(btn instanceof HTMLButtonElement)) return;

    activeConversationId = btn.dataset.conversationId || null;
    renderConversations();
    if (!activeConversationId) return;

    const activeConversation = conversations.find((item) => item.id === activeConversationId);
    if (titleNode) {
      const advisorName = activeConversation?.advisor?.fullName || 'Asesor';
      titleNode.textContent = `Chat con ${advisorName}`;
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
      await loadConversations();
    } catch (error) {
      notify(error.message || 'No se pudo cargar el chat con asesor.', 'error');
    }
  })();
});

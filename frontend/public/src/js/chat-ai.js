document.addEventListener('DOMContentLoaded', () => {
  const user = window.NetoAuth.requireRole(['USER'], window.NetoRoutes?.user?.dashboard || '/html/user/dashboard.html');
  if (!user) return;

  const sessionsContainer = document.getElementById('aiChatSessions');
  const messagesContainer = document.getElementById('aiChatMessages');
  const form = document.getElementById('aiChatForm');
  const input = document.getElementById('aiChatInput');
  const newSessionBtn = document.getElementById('newAiChatSessionBtn');
  const sendBtn = document.getElementById('aiChatSendBtn');
  const typingIndicator = document.getElementById('aiChatTyping');
  const sessionTitle = document.getElementById('aiChatSessionTitle');
  const counter = document.getElementById('aiChatCounter');
  const providerBadge = document.getElementById('aiChatProviderBadge');
  const deleteModalElement = document.getElementById('deleteAiChatModal');
  const deleteSummary = document.getElementById('deleteAiChatSummary');
  const confirmDeleteBtn = document.getElementById('confirmDeleteAiChatBtn');

  let sessions = [];
  let activeSessionId = null;
  let isSending = false;
  let pendingDeleteSessionId = null;
  let deleteModalInstance = null;

  function renderProviderBadge(provider) {
    if (!(providerBadge instanceof HTMLElement)) return;

    const normalized = String(provider || '').toLowerCase();
    providerBadge.className = 'status-chip';

    if (normalized === 'groq') {
      providerBadge.classList.add('good');
      providerBadge.textContent = 'Proveedor: Groq';
      return;
    }

    if (normalized === 'openai') {
      providerBadge.classList.add('warn');
      providerBadge.textContent = 'Proveedor: OpenAI';
      return;
    }

    if (normalized === 'rule-based') {
      providerBadge.classList.add('danger');
      providerBadge.textContent = 'Proveedor: Fallback local';
      return;
    }

    if (normalized === 'small-talk') {
      providerBadge.classList.add('warn');
      providerBadge.textContent = 'Proveedor: Respuesta social';
      return;
    }

    providerBadge.textContent = 'Proveedor: --';
  }

  const escapeHtml = window.NetoDom.escapeHtml;

  function notify(message, type = 'error') {
    if (window.NetoToast?.show) {
      window.NetoToast.show(message, type, { stackId: 'chatAiToastStack', leaveDelay: 2300, removeDelay: 230 });
      return;
    }
    if (window.NetoExpensesHelpers?.showToast) {
      window.NetoExpensesHelpers.showToast(message, type);
      return;
    }
    window.NetoUI?.showMessage(document.querySelector('main.container'), message, type);
  }

  function openDeleteModal(sessionId) {
    pendingDeleteSessionId = sessionId;
    const session = sessions.find((item) => item.id === sessionId);
    if (deleteSummary) {
      deleteSummary.textContent = session?.title
        ? `Se eliminará la conversación "${session.title}" y todos sus mensajes.`
        : 'Se borrarán todos los mensajes de la sesión.';
    }

    if (!deleteModalInstance && deleteModalElement && window.bootstrap?.Modal) {
      deleteModalInstance = new window.bootstrap.Modal(deleteModalElement);
    }
    deleteModalInstance?.show();
  }

  async function handleDeleteSession() {
    if (!pendingDeleteSessionId) return;
    const sessionIdToDelete = pendingDeleteSessionId;

    if (confirmDeleteBtn instanceof HTMLButtonElement) {
      confirmDeleteBtn.disabled = true;
      confirmDeleteBtn.textContent = 'Eliminando...';
    }

    try {
      await window.NetoApi.deleteAiChatSession(sessionIdToDelete);
      if (activeSessionId === sessionIdToDelete) {
        activeSessionId = null;
      }
      pendingDeleteSessionId = null;
      deleteModalInstance?.hide();
      await loadSessions();
      notify('Conversación eliminada.', 'success');
    } catch (error) {
      notify(error.message || 'No se pudo eliminar la conversación.', 'error');
    } finally {
      if (confirmDeleteBtn instanceof HTMLButtonElement) {
        confirmDeleteBtn.disabled = false;
        confirmDeleteBtn.textContent = 'Eliminar';
      }
    }
  }

  function formatTime(value) {
    if (!value) return '';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '';
    return parsed.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  }

  function renderSessionMeta() {
    if (!sessionTitle) return;
    const current = sessions.find((item) => item.id === activeSessionId);
    if (!current) {
      sessionTitle.textContent = 'Selecciona o crea una sesión para comenzar';
      return;
    }
    sessionTitle.textContent = current.title || 'Conversación';
  }

  function setTypingState(isActive) {
    if (!typingIndicator) return;
    typingIndicator.classList.toggle('is-visible', Boolean(isActive));
    typingIndicator.setAttribute('aria-hidden', isActive ? 'false' : 'true');
  }

  function setSendingState(isActive) {
    isSending = isActive;
    if (sendBtn instanceof HTMLButtonElement) {
      sendBtn.disabled = isActive;
      sendBtn.textContent = isActive ? 'Enviando...' : 'Enviar';
    }
    if (input instanceof HTMLTextAreaElement) {
      input.disabled = isActive;
    }
    setTypingState(isActive);
  }

  function setCounter() {
    if (!(input instanceof HTMLTextAreaElement) || !counter) return;
    counter.textContent = `${input.value.length}/2000`;
  }

  function renderSessions() {
    if (!sessionsContainer) return;

    if (!sessions.length) {
      sessionsContainer.innerHTML = '<div class="empty-state">Todavía no tienes conversaciones.</div>';
      renderSessionMeta();
      return;
    }

    sessionsContainer.innerHTML = sessions
      .map((session) => {
        const isActive = session.id === activeSessionId;
        return `
          <div class="ai-chat-session-row${isActive ? ' active' : ''}">
            <button class="chip${isActive ? ' active' : ''} ai-chat-session-btn" type="button" data-session-id="${escapeHtml(session.id)}">
              <span class="chip-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="14" rx="4"/><path d="M8 10h.01M12 10h.01M16 10h.01"/><path d="M8 20h8"/></svg>
              </span>
              <span class="chip-label">${escapeHtml(session.title || 'Conversación')}</span>
            </button>
            <button
              class="ai-chat-delete-btn"
              type="button"
              data-delete-session-id="${escapeHtml(session.id)}"
              aria-label="Eliminar conversación"
              title="Eliminar conversación"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h18"/>
                <path d="M8 6V4h8v2"/>
                <path d="M19 6l-1 14H6L5 6"/>
                <path d="M10 11v6M14 11v6"/>
              </svg>
            </button>
          </div>
        `;
      })
      .join('');

    renderSessionMeta();
  }

  function renderMessages(messages) {
    if (!messagesContainer) return;

    if (!Array.isArray(messages) || !messages.length) {
      messagesContainer.innerHTML = '<div class="empty-state">Escribe tu primer mensaje para comenzar. El asistente responderá con base en tus gastos y presupuestos.</div>';
      renderProviderBadge('');
      return;
    }

    messagesContainer.innerHTML = messages
      .map((message) => {
        const isAssistant = message.role === 'assistant';
        const roleLabel = isAssistant ? 'Asistente IA' : 'Tú';
        const timeLabel = formatTime(message.createdAt);
        return `
          <article class="planning-item ai-chat-bubble ${isAssistant ? 'assistant' : 'user'}">
            <div class="planning-item-top">
              <div class="planning-item-title">${roleLabel}</div>
              <small class="planning-item-meta">${escapeHtml(timeLabel)}</small>
            </div>
            <p class="planning-item-meta mb-0 ai-chat-content">${escapeHtml(message.content || '').replaceAll('\n', '<br>')}</p>
          </article>
        `;
      })
      .join('');

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  async function loadSessions() {
    try {
      sessions = await window.NetoApi.listAiChatSessions();
      if (!activeSessionId && sessions.length) {
        activeSessionId = sessions[0].id;
      }

      if (activeSessionId && !sessions.some((item) => item.id === activeSessionId)) {
        activeSessionId = sessions[0]?.id || null;
      }

      renderSessions();
      if (activeSessionId) {
        const messages = await window.NetoApi.listAiChatMessages(activeSessionId);
        renderMessages(messages);
        renderProviderBadge('');
      } else {
        renderMessages([]);
      }
    } catch (error) {
      renderMessages([]);
      notify(error.message || 'No se pudo cargar el chat con IA.', 'error');
    }
  }

  async function createSessionAndSelect() {
    try {
      const created = await window.NetoApi.createAiChatSession({});
      activeSessionId = created.id;
      await loadSessions();
      input?.focus();
    } catch (error) {
      notify(error.message || 'No se pudo crear la conversación.', 'error');
    }
  }

  sessionsContainer?.addEventListener('click', async (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const deleteBtn = target.closest('.ai-chat-delete-btn');
    if (deleteBtn instanceof HTMLButtonElement) {
      const sessionIdToDelete = deleteBtn.dataset.deleteSessionId || '';
      if (!sessionIdToDelete) return;

      openDeleteModal(sessionIdToDelete);
      return;
    }

    const btn = target.closest('.ai-chat-session-btn');
    if (!(btn instanceof HTMLButtonElement)) return;

    activeSessionId = btn.dataset.sessionId || null;
    renderSessions();
    if (!activeSessionId) return;
    try {
      const messages = await window.NetoApi.listAiChatMessages(activeSessionId);
      renderMessages(messages);
    } catch (error) {
      notify(error.message || 'No se pudo cargar la conversación.', 'error');
    }
  });

  newSessionBtn?.addEventListener('click', async () => {
    await createSessionAndSelect();
  });

  confirmDeleteBtn?.addEventListener('click', async () => {
    await handleDeleteSession();
  });

  deleteModalElement?.addEventListener('hidden.bs.modal', () => {
    pendingDeleteSessionId = null;
    if (confirmDeleteBtn instanceof HTMLButtonElement) {
      confirmDeleteBtn.disabled = false;
      confirmDeleteBtn.textContent = 'Eliminar';
    }
  });

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const message = String(input?.value || '').trim();
    if (!message) return;

    if (!activeSessionId) {
      await createSessionAndSelect();
    }
    if (!activeSessionId) return;

    setSendingState(true);

    try {
      const response = await window.NetoApi.sendAiChatMessage(activeSessionId, { message });
      renderProviderBadge(response?.provider || '');
      if (input instanceof HTMLTextAreaElement) {
        input.value = '';
        setCounter();
      }

      const messages = await window.NetoApi.listAiChatMessages(activeSessionId);
      renderMessages(messages);
      sessions = await window.NetoApi.listAiChatSessions();
      renderSessions();
    } catch (error) {
      notify(error.message || 'No se pudo enviar el mensaje.', 'error');
    } finally {
      setSendingState(false);
    }
  });

  input?.addEventListener('input', () => {
    setCounter();
  });

  input?.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' || event.shiftKey) return;
    event.preventDefault();
    if (!isSending) {
      form?.requestSubmit();
    }
  });

  setCounter();
  loadSessions();
});

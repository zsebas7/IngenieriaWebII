document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  const localPreviewBlock = document.getElementById('localPreviewBlock');
  const localPreviewAccess = document.getElementById('localPreviewAccess');

  function enableLocalPreviewFallback() {
    const payload = {
      accessToken: 'local-preview-token',
      refreshToken: 'local-preview-refresh',
      user: {
        id: 'local-preview-user',
        fullName: 'Vista Local',
        email: 'local@neto.app',
        role: 'USER',
        isActive: true,
        language: 'es',
        preferredCurrency: 'ARS',
      },
    };

    localStorage.setItem('neto_local_preview', '1');

    if (typeof window.NetoAuth?.saveAuth === 'function') {
      window.NetoAuth.saveAuth(payload);
      return;
    }

    sessionStorage.setItem('neto_access_token', payload.accessToken);
    sessionStorage.setItem('neto_refresh_token', payload.refreshToken);
    sessionStorage.setItem('neto_user', JSON.stringify(payload.user));
  }

  if (localPreviewBlock && localPreviewAccess) {
    localPreviewBlock.classList.remove('d-none');
    localPreviewAccess.addEventListener('click', () => {
      if (typeof window.NetoAuth?.enableLocalPreview === 'function') {
        window.NetoAuth.enableLocalPreview('USER', true);
      } else {
        enableLocalPreviewFallback();
      }
      window.location.href = window.NetoRoutes?.user?.dashboard || '/html/user/dashboard.html';
    });
  }

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    window.NetoUI?.clearMessage(form);
    try {
      const payload = await window.NetoApi.login({
        email: form.email.value,
        password: form.password.value,
      });
      if (typeof window.NetoAuth?.saveAuth === 'function') {
        window.NetoAuth.saveAuth(payload);
      } else {
        sessionStorage.setItem('neto_access_token', payload.accessToken);
        sessionStorage.setItem('neto_refresh_token', payload.refreshToken);
        sessionStorage.setItem('neto_user', JSON.stringify(payload.user));
      }
      if (payload.user.role === 'ADMIN') {
        window.location.href = window.NetoRoutes?.admin?.dashboard || '/html/admin/admin.html';
      } else if (payload.user.role === 'ADVISOR') {
        window.location.href = window.NetoRoutes?.advisor?.dashboard || '/html/advisor/advisor.html';
      } else {
        window.location.href = window.NetoRoutes?.user?.dashboard || '/html/user/dashboard.html';
      }
    } catch (error) {
      window.NetoUI?.showMessage(form, error.message || 'No se pudo iniciar sesión', 'error');
    }
  });
});

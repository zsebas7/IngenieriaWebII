document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const authTitle = document.getElementById('authTitle');
  const authIntro = document.getElementById('authIntro');
  const authModeLogin = document.getElementById('authModeLogin');
  const authModeRegister = document.getElementById('authModeRegister');
  const authSwitchLink = document.getElementById('authSwitchLink');
  const forgotPasswordLink = document.getElementById('forgotPasswordLink');
  const localPreviewBlock = document.getElementById('localPreviewBlock');
  const localPreviewAccess = document.getElementById('localPreviewAccess');

  let currentMode = 'login';

  function redirectByRole(role) {
    if (role === 'ADMIN') {
      window.location.href = window.NetoRoutes?.admin?.dashboard || '/html/admin/admin.html';
      return;
    }
    if (role === 'ADVISOR') {
      window.location.href = window.NetoRoutes?.advisor?.dashboard || '/html/advisor/advisor.html';
      return;
    }
    window.location.href = window.NetoRoutes?.user?.dashboard || '/html/user/dashboard.html';
  }

  function saveAuthFallback(payload) {
    if (typeof window.NetoAuth?.saveAuth === 'function') {
      window.NetoAuth.saveAuth(payload);
      return;
    }

    sessionStorage.setItem('neto_access_token', payload.accessToken);
    sessionStorage.setItem('neto_refresh_token', payload.refreshToken);
    sessionStorage.setItem('neto_user', JSON.stringify(payload.user));
  }

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
    localPreviewAccess.addEventListener('click', () => {
      if (typeof window.NetoAuth?.enableLocalPreview === 'function') {
        window.NetoAuth.enableLocalPreview('USER', true);
      } else {
        enableLocalPreviewFallback();
      }
      window.location.href = window.NetoRoutes?.user?.dashboard || '/html/user/dashboard.html';
    });
  }

  function setMode(mode) {
    currentMode = mode === 'register' ? 'register' : 'login';
    const isRegister = currentMode === 'register';

    authTitle.textContent = isRegister ? 'Crear cuenta' : 'Iniciar sesión';
    authIntro.textContent = isRegister
      ? 'Registra tu cuenta para comenzar a gestionar tus finanzas.'
      : 'Accede a tu panel financiero para continuar.';

    loginForm?.classList.toggle('d-none', isRegister);
    registerForm?.classList.toggle('d-none', !isRegister);
    localPreviewBlock?.classList.toggle('d-none', isRegister);
    forgotPasswordLink?.classList.toggle('d-none', isRegister);

    if (authModeLogin && authModeRegister) {
      authModeLogin.classList.toggle('btn-neto', !isRegister);
      authModeLogin.classList.toggle('btn-outline-secondary', isRegister);
      authModeRegister.classList.toggle('btn-neto', isRegister);
      authModeRegister.classList.toggle('btn-outline-secondary', !isRegister);
    }

    if (authSwitchLink) {
      authSwitchLink.textContent = isRegister ? 'Ya tengo cuenta' : 'Crear cuenta';
      authSwitchLink.href = isRegister ? '../public/login.html?mode=login' : '../public/login.html?mode=register';
    }

    window.NetoUI?.clearMessage(loginForm);
    window.NetoUI?.clearMessage(registerForm);
  }

  authModeLogin?.addEventListener('click', () => setMode('login'));
  authModeRegister?.addEventListener('click', () => setMode('register'));
  authSwitchLink?.addEventListener('click', (event) => {
    event.preventDefault();
    setMode(currentMode === 'register' ? 'login' : 'register');
  });

  const modeFromUrl = new URLSearchParams(window.location.search).get('mode');
  setMode(modeFromUrl === 'register' ? 'register' : 'login');

  loginForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    window.NetoUI?.clearMessage(loginForm);
    try {
      const payload = await window.NetoApi.login({
        email: loginForm.email.value,
        password: loginForm.password.value,
      });
      saveAuthFallback(payload);
      redirectByRole(payload.user.role);
    } catch (error) {
      window.NetoUI?.showMessage(loginForm, error.message || 'No se pudo iniciar sesion', 'error');
    }
  });

  registerForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    window.NetoUI?.clearMessage(registerForm);

    try {
      const payload = await window.NetoApi.register({
        fullName: registerForm.fullName.value,
        email: registerForm.email.value,
        password: registerForm.password.value,
        role: registerForm.role.value,
      });
      saveAuthFallback(payload);
      redirectByRole(payload.user.role);
    } catch (error) {
      window.NetoUI?.showMessage(registerForm, error.message || 'No se pudo crear la cuenta', 'error');
    }
  });
});

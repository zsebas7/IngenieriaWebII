document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const payload = await window.NetoApi.login({
        email: form.email.value,
        password: form.password.value,
      });
      window.NetoAuth.saveAuth(payload);
      if (payload.user.role === 'ADMIN') {
        window.location.href = 'admin.html';
      } else if (payload.user.role === 'ADVISOR') {
        window.location.href = 'advisor.html';
      } else {
        window.location.href = 'dashboard.html';
      }
    } catch (error) {
      alert(error.message || 'No se pudo iniciar sesión');
    }
  });
});

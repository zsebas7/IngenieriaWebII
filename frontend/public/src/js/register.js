document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('registerForm');
  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    window.NetoUI?.clearMessage(form);

    try {
      const payload = await window.NetoApi.register({
        fullName: form.fullName.value,
        email: form.email.value,
        password: form.password.value,
        role: form.role.value,
      });
      window.NetoAuth.saveAuth(payload);
      window.location.href = window.NetoRoutes?.user?.dashboard || '/html/user/dashboard.html';
    } catch (error) {
      window.NetoUI?.showMessage(form, error.message || 'No se pudo crear la cuenta', 'error');
    }
  });
});

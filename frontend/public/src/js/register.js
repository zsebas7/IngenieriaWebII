document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('registerForm');
  form?.addEventListener('submit', async (event) => {
    event.preventDefault();

    try {
      const payload = await window.NetoApi.register({
        fullName: form.fullName.value,
        email: form.email.value,
        password: form.password.value,
        role: form.role.value,
      });
      window.NetoAuth.saveAuth(payload);
      window.location.href = 'dashboard.html';
    } catch (error) {
      alert(error.message || 'No se pudo crear la cuenta');
    }
  });
});

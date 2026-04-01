document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('forgotPasswordForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    window.NetoUI?.clearMessage(form);

    try {
      const email = form.email.value;
      const result = await window.NetoApi.forgotPassword({ email });
      window.NetoUI?.showMessage(form, result.message || 'Solicitud enviada.', 'success');
    } catch (error) {
      window.NetoUI?.showMessage(form, error.message || 'No se pudo procesar la solicitud.', 'error');
    }
  });
});

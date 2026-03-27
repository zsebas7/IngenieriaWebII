document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('forgotPasswordForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = event.currentTarget.email.value;
    const result = await window.NetoApi.forgotPassword({ email });
    alert(result.message);
  });
});

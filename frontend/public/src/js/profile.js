function updateTopSummary(user) {
  document.getElementById('profileName').textContent = user.fullName;
  document.getElementById('profileEmail').textContent = user.email;
  document.getElementById('profileRole').textContent = user.role;
  document.getElementById('profileStatus').textContent = user.isActive ? 'Activo' : 'Inactivo';
}

function showProfileToast(message, type = 'success') {
  if (window.NetoToast?.show) {
    window.NetoToast.show(message, type, { stackId: 'profileToastStack', leaveDelay: 2300, removeDelay: 220 });
    return;
  }
}

function fillForm(user) {
  const form = document.getElementById('profileForm');
  form.fullName.value = user.fullName || '';
  form.language.value = user.language || 'es';
  form.preferredCurrency.value = user.preferredCurrency || 'ARS';
  const savedTheme = localStorage.getItem('neto_theme') || 'light';
  if (form.themePreference) {
    form.themePreference.value = savedTheme;
  }
}

async function loadProfile() {
  const user = await window.NetoApi.myProfile();
  updateTopSummary(user);
  fillForm(user);
}

document.addEventListener('DOMContentLoaded', () => {
  window.NetoAuth.requireAuth();

  const form = document.getElementById('profileForm');
  const passwordForm = document.getElementById('passwordForm');
  const passwordModal = document.getElementById('changePasswordModal');
  const logoutBtn = document.getElementById('logoutFromProfile');

  logoutBtn?.addEventListener('click', () => {
    window.NetoAuth.logout();
  });

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    window.NetoUI?.clearMessage(form);

    const nextTheme = form.themePreference?.value || 'light';
    localStorage.setItem('neto_theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);

    try {
      const payload = await window.NetoApi.updateMyProfile({
        fullName: form.fullName.value,
        language: form.language.value,
        preferredCurrency: form.preferredCurrency.value,
      });

      localStorage.setItem('neto_user', JSON.stringify(payload));
      updateTopSummary(payload);
      window.NetoUI?.clearMessage(form);
      showProfileToast('Perfil actualizado correctamente.', 'success');
    } catch (error) {
      showProfileToast(error.message || 'No se pudo actualizar el perfil.', 'error');
    }
  });

  passwordForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const currentPassword = passwordForm.currentPassword.value;
    const newPassword = passwordForm.newPassword.value;
    const confirmPassword = passwordForm.confirmPassword.value;

    if (newPassword.length < 8) {
      showProfileToast('La nueva contraseña debe tener al menos 8 caracteres.', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showProfileToast('La confirmación de contraseña no coincide.', 'error');
      return;
    }

    try {
      await window.NetoApi.changeMyPassword({
        currentPassword,
        newPassword,
      });
      passwordForm.reset();
      if (passwordModal && typeof bootstrap !== 'undefined') {
        bootstrap.Modal.getOrCreateInstance(passwordModal).hide();
      }
      showProfileToast('Contraseña actualizada correctamente.', 'success');
    } catch (error) {
      showProfileToast(error.message || 'No se pudo actualizar la contraseña.', 'error');
    }
  });

  if (passwordModal) {
    passwordModal.addEventListener('hidden.bs.modal', () => {
      if (passwordForm instanceof HTMLFormElement) {
        passwordForm.reset();
      }
    });
  }

  loadProfile();
});

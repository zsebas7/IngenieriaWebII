function updateTopSummary(user) {
  document.getElementById('profileName').textContent = user.fullName;
  document.getElementById('profileEmail').textContent = user.email;
  document.getElementById('profileRole').textContent = user.role;
  document.getElementById('profileStatus').textContent = user.isActive ? 'Activo' : 'Inactivo';
}

function fillForm(user) {
  const form = document.getElementById('profileForm');
  form.fullName.value = user.fullName || '';
  form.language.value = user.language || 'es';
  form.preferredCurrency.value = user.preferredCurrency || 'ARS';
}

async function loadProfile() {
  const user = await window.NetoApi.myProfile();
  updateTopSummary(user);
  fillForm(user);
}

document.addEventListener('DOMContentLoaded', () => {
  window.NetoAuth.requireAuth();

  const form = document.getElementById('profileForm');
  form?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const payload = await window.NetoApi.updateMyProfile({
      fullName: form.fullName.value,
      language: form.language.value,
      preferredCurrency: form.preferredCurrency.value,
    });

    localStorage.setItem('neto_user', JSON.stringify(payload));
    updateTopSummary(payload);
    alert('Perfil actualizado correctamente.');
  });

  loadProfile();
});

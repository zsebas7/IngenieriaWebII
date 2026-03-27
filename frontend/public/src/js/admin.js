document.addEventListener('DOMContentLoaded', async () => {
  window.NetoAuth.requireAuth();
  const user = window.NetoAuth.getCurrentUser();
  if (user.role !== 'ADMIN') {
    window.location.href = 'dashboard.html';
    return;
  }

  await renderUsers();
});

async function renderUsers() {
  const users = await window.NetoApi.listUsers();
  const tbody = document.getElementById('adminUsersBody');

  tbody.innerHTML = users
    .map(
      (item) => `
      <tr>
        <td>${item.fullName}</td>
        <td>${item.email}</td>
        <td>
          <select class="form-select" onchange="updateRole('${item.id}', this.value)">
            <option ${item.role === 'USER' ? 'selected' : ''} value="USER">USER</option>
            <option ${item.role === 'ADVISOR' ? 'selected' : ''} value="ADVISOR">ADVISOR</option>
            <option ${item.role === 'ADMIN' ? 'selected' : ''} value="ADMIN">ADMIN</option>
          </select>
        </td>
        <td>
          <button class="btn btn-sm ${item.isActive ? 'btn-danger' : 'btn-success'}" onclick="toggleActive('${item.id}', ${
            !item.isActive
          })">
            ${item.isActive ? 'Desactivar' : 'Activar'}
          </button>
        </td>
      </tr>`,
    )
    .join('');
}

window.updateRole = async function updateRole(id, role) {
  await window.NetoApi.updateUserRole(id, role);
  await renderUsers();
};

window.toggleActive = async function toggleActive(id, isActive) {
  await window.NetoApi.updateUserActive(id, isActive);
  await renderUsers();
};

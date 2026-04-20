document.addEventListener('DOMContentLoaded', async () => {
  const user = window.NetoAuth.requireRole(['ADMIN'], window.NetoRoutes?.user?.dashboard || '/html/user/dashboard.html');
  if (!user) return;

  await renderUsers();
});

function getSpendingProfileLabel(profile) {
  if (profile === 'SAVER') return { label: 'Ahorrador', chipClass: 'good' };
  if (profile === 'SPENDER') return { label: 'Gastador', chipClass: 'danger' };
  return { label: 'Equilibrado', chipClass: 'warn' };
}

const escapeHtml = window.NetoDom.escapeHtml;

async function renderUsers() {
  const users = await window.NetoApi.listUsers();
  const tbody = document.getElementById('adminUsersBody');

  tbody.innerHTML = users
    .map((item) => {
      const profileMeta = getSpendingProfileLabel(item.spendingProfile);
      return `
      <tr>
        <td>${escapeHtml(item.fullName)}</td>
        <td>${escapeHtml(item.email)}</td>
        <td>
          <span class="status-chip ${profileMeta.chipClass}">
            ${profileMeta.label}
          </span>
        </td>
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
      </tr>`;
    })
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

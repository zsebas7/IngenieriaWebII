document.addEventListener('DOMContentLoaded', async () => {
  window.NetoAuth.requireAuth();
  const user = window.NetoAuth.getCurrentUser();
  if (user.role !== 'ADVISOR' && user.role !== 'ADMIN') {
    window.location.href = 'dashboard.html';
    return;
  }

  const users = await window.NetoApi.listUsers();
  const tbody = document.getElementById('advisorUsersBody');

  tbody.innerHTML = users
    .map(
      (item) => `
      <tr>
        <td>${item.fullName}</td>
        <td>${item.email}</td>
        <td>${item.role}</td>
        <td>${item.isActive ? 'Activo' : 'Inactivo'}</td>
      </tr>`,
    )
    .join('');
});

(function () {
  const stored = localStorage.getItem('neto_theme') || 'light';
  document.documentElement.setAttribute('data-theme', stored);

  function refreshThemeToggles() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const willSwitchTo = current === 'dark' ? 'light' : 'dark';
    const icon = willSwitchTo === 'dark' ? '🌙' : '☀️';
    const label = willSwitchTo === 'dark' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro';

    document.querySelectorAll('button[onclick*="toggleTheme"]').forEach((button) => {
      button.classList.add('theme-toggle');
      button.setAttribute('aria-label', label);
      button.setAttribute('title', label);
      button.innerHTML = `<span class="theme-icon" aria-hidden="true">${icon}</span>`;
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', refreshThemeToggles);
  } else {
    refreshThemeToggles();
  }

  window.toggleTheme = function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('neto_theme', next);
    refreshThemeToggles();
  };
})();

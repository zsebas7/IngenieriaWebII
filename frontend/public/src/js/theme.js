(function () {
  const stored = localStorage.getItem('neto_theme') || 'light';
  document.documentElement.setAttribute('data-theme', stored);

  window.toggleTheme = function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('neto_theme', next);
  };
})();

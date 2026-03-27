document.addEventListener('DOMContentLoaded', () => {
  if (window.NetoI18n) {
    window.NetoI18n.apply(window.NetoI18n.getLanguage());
  }

  const languageSelect = document.getElementById('languageSelect');
  if (languageSelect) {
    languageSelect.value = window.NetoI18n.getLanguage();
    languageSelect.addEventListener('change', (event) => {
      window.NetoI18n.setLanguage(event.target.value);
    });
  }

  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const endpoint = window.NETO_CONFIG.FORMSPREE_ENDPOINT;
      if (!endpoint) {
        alert('Configura FORMSPREE endpoint en localStorage o config.js');
        return;
      }

      const formData = new FormData(contactForm);
      await fetch(endpoint, { method: 'POST', body: formData, headers: { Accept: 'application/json' } });
      alert('Mensaje enviado correctamente');
      contactForm.reset();
    });
  }
});

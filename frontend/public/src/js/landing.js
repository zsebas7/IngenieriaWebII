document.addEventListener('DOMContentLoaded', () => {
  const navToggler = document.querySelector('[data-bs-toggle="collapse"][data-bs-target="#navMain"]');
  const navMain = document.getElementById('navMain');
  if (navToggler && navMain) {
    navToggler.addEventListener('click', () => {
      navMain.classList.toggle('show');
    });

    navMain.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        if (window.innerWidth < 992) {
          navMain.classList.remove('show');
        }
      });
    });
  }

  document.querySelectorAll('.accordion-button[data-bs-target]').forEach((button) => {
    button.addEventListener('click', () => {
      const targetSelector = button.getAttribute('data-bs-target');
      if (!targetSelector) return;

      const target = document.querySelector(targetSelector);
      if (!target) return;

      const willOpen = !target.classList.contains('show');
      const accordion = button.closest('.accordion');

      if (accordion) {
        accordion.querySelectorAll('.accordion-collapse.show').forEach((item) => {
          item.classList.remove('show');
        });
        accordion.querySelectorAll('.accordion-button').forEach((item) => {
          item.classList.add('collapsed');
        });
      }

      if (willOpen) {
        target.classList.add('show');
        button.classList.remove('collapsed');
      }
    });
  });

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

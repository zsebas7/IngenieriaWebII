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

  const counters = Array.from(document.querySelectorAll('.count-up[data-target]'));
  const animateCounter = (counter) => {
    const target = Number(counter.dataset.target || 0);
    const decimals = Number(counter.dataset.decimals || 0);
    const duration = Number(counter.dataset.duration || 1400);
    const start = performance.now();

    const format = (value) => {
      if (decimals > 0) {
        return value.toFixed(decimals);
      }
      return Math.floor(value).toString();
    };

    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = target * eased;
      counter.textContent = format(value);
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  };

  if (counters.length) {
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          animateCounter(entry.target);
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.4 },
    );

    counters.forEach((counter) => observer.observe(counter));
  }

  const barsContainer = document.querySelector('.preview-bars');
  if (barsContainer) {
    const barObserver = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const bars = Array.from(entry.target.querySelectorAll('.preview-bar-fill[data-width]'));
          bars.forEach((bar, index) => {
            setTimeout(() => {
              bar.style.width = bar.dataset.width;
            }, 120 * index);
          });
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.45 },
    );

    barObserver.observe(barsContainer);
  }

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
      window.NetoUI?.clearMessage(contactForm);
      const endpoint = window.NETO_CONFIG.FORMSPREE_ENDPOINT;
      if (!endpoint) {
        window.NetoUI?.showMessage(contactForm, 'Configura FORMSPREE endpoint en localStorage o config.js', 'error');
        return;
      }

      const formData = new FormData(contactForm);
      await fetch(endpoint, { method: 'POST', body: formData, headers: { Accept: 'application/json' } });
      window.NetoUI?.showMessage(contactForm, 'Mensaje enviado correctamente', 'success');
      contactForm.reset();
    });
  }
});

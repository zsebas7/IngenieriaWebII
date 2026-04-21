const translations = {
  es: {
    landingTitle: 'Tu dinero, bajo control',
    landingSubtitle: 'Mira en que gastas y organiza tu mes en minutos.',
    ctaStart: 'Crear cuenta',
    ctaDemo: 'Probar sin iniciar sesión',
    navFeatures: 'Características',
    navHow: 'Cómo funciona',
    navPricing: 'Precios',
    navFaq: 'FAQ',
    navContact: 'Contacto',
  },
  en: {
    landingTitle: 'Your money, in control',
    landingSubtitle: 'See where you spend and organize your month in minutes.',
    ctaStart: 'Create account',
    ctaDemo: 'Try without sign in',
    navFeatures: 'Features',
    navHow: 'How it works',
    navPricing: 'Pricing',
    navFaq: 'FAQ',
    navContact: 'Contact',
  },
};

window.NetoI18n = {
  getLanguage() {
    return localStorage.getItem('neto_lang') || 'es';
  },
  setLanguage(lang) {
    localStorage.setItem('neto_lang', lang);
    this.apply(lang);
  },
  apply(lang) {
    const dict = translations[lang] || translations.es;
    document.querySelectorAll('[data-i18n]').forEach((node) => {
      const key = node.getAttribute('data-i18n');
      if (dict[key]) {
        node.textContent = dict[key];
      }
    });
  },
};

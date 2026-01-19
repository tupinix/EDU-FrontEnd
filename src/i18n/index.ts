import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import ptTranslations from './locales/pt.json';
import enTranslations from './locales/en.json';

// Get saved language from localStorage or default to Portuguese
const savedLanguage = localStorage.getItem('language') || 'pt';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      pt: {
        translation: ptTranslations,
      },
      en: {
        translation: enTranslations,
      },
    },
    lng: savedLanguage,
    fallbackLng: 'pt',
    interpolation: {
      escapeValue: false,
    },
  });

// Save language preference when it changes
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('language', lng);
});

export default i18n;

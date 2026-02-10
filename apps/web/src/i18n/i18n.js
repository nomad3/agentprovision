import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enCommon from './locales/en/common.json';
import enLanding from './locales/en/landing.json';
import enDatasets from './locales/en/datasets.json';
import esCommon from './locales/es/common.json';
import esLanding from './locales/es/landing.json';
import esDatasets from './locales/es/datasets.json';

const resources = {
  en: {
    common: enCommon,
    landing: enLanding,
    datasets: enDatasets,
  },
  es: {
    common: esCommon,
    landing: esLanding,
    datasets: esDatasets,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: ['en', 'es'],
    ns: ['common', 'landing', 'datasets'],
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'servicetsunami.lang',
    },
  });

export default i18n;

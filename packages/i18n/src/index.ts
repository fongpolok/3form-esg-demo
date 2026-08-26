import i18next, { type i18n as I18nInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import enCommon from '../locales/en/common.json';
import zhHkCommon from '../locales/zh-HK/common.json';

// Namespaces grow per-domain as each module's frontend work lands
// (workOrders, esgMetrics, reports, emissionFactors — plan §9); "common" is
// the only one that exists at this scaffolding stage.
export const resources = {
  en: { common: enCommon },
  'zh-HK': { common: zhHkCommon },
} as const;

export type SupportedLocale = keyof typeof resources;

// Both apps/ops-portal and apps/client-portal call this once at startup so
// they share one i18next configuration instead of duplicating setup.
export function createI18n(initialLocale: SupportedLocale = 'en'): I18nInstance {
  const instance = i18next.createInstance();
  instance.use(initReactI18next).init({
    resources,
    lng: initialLocale,
    fallbackLng: 'en',
    defaultNS: 'common',
    interpolation: { escapeValue: false },
  });
  return instance;
}

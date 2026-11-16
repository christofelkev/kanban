import { translations, type Locale, type TranslationKey } from './translations';

class I18nManager {
  currentLocale = $state<Locale>('en');

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('kanbanku_locale');
      if (saved === 'en' || saved === 'id') {
        this.currentLocale = saved;
      }
    }
  }

  get locale(): Locale {
    return this.currentLocale;
  }

  setLocale(loc: Locale) {
    this.currentLocale = loc;
    if (typeof window !== 'undefined') {
      localStorage.setItem('kanbanku_locale', loc);
      document.documentElement.lang = loc;
    }
  }

  t(key: TranslationKey): string {
    const dict = translations[this.currentLocale] || translations.en;
    return dict[key] || translations.en[key] || key;
  }
}

export const i18n = new I18nManager();
export const t = (key: TranslationKey) => i18n.t(key);
export type { Locale, TranslationKey };

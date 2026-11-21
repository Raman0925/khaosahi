import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'react-native-localize';

import { type Language, usePreferences } from '@/shared/preferences/store';

import en from './en.json';
import hi from './hi.json';

export const resources = {
  en: { translation: en },
  hi: { translation: hi },
} as const;

/** Device language if it is Hindi, otherwise English. */
export function deviceLanguage(): Language {
  const [first] = getLocales();
  return first?.languageCode === 'hi' ? 'hi' : 'en';
}

export function resolveLanguage(chosen: Language | null): Language {
  return chosen ?? deviceLanguage();
}

let initialised = false;

/**
 * Initialises i18next synchronously (resources are bundled) and keeps it in sync with the
 * language preference, so switching language never needs a restart.
 */
export function initI18n(): typeof i18next {
  if (initialised) {
    return i18next;
  }
  initialised = true;
  i18next.use(initReactI18next).init({
    resources,
    lng: resolveLanguage(usePreferences.getState().language),
    fallbackLng: 'en',
    initAsync: false,
    interpolation: { escapeValue: false },
    returnNull: false,
  });
  usePreferences.subscribe((state, previous) => {
    if (state.language !== previous.language) {
      i18next.changeLanguage(resolveLanguage(state.language)).catch(() => undefined);
    }
  });
  return i18next;
}

export { i18next };

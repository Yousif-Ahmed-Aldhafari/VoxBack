import { I18nManager } from 'react-native';
import { getLocales } from 'expo-localization';

import { ar } from './ar';
import { en } from './en';
import type { Language } from '@/types';

export const dictionaries = { en, ar } as const;

export type TranslationKey = keyof typeof en;

export function getDeviceLanguage(): Language {
  const code = getLocales()[0]?.languageCode?.toLowerCase();
  return code === 'ar' ? 'ar' : 'en';
}

export function isRTL(language: Language) {
  return language === 'ar';
}

export function applyRTL(language: Language) {
  const shouldRTL = isRTL(language);
  I18nManager.allowRTL(shouldRTL);
  I18nManager.forceRTL(shouldRTL);
}

export function translate(language: Language, key: TranslationKey, values?: Record<string, string | number>): string {
  const template: string = dictionaries[language][key] ?? dictionaries.en[key] ?? key;
  if (!values) {
    return template;
  }
  return Object.entries(values).reduce<string>(
    (text, [name, value]) => text.replace(new RegExp(`{{${name}}}`, 'g'), String(value)),
    template,
  );
}

export { ar, en };

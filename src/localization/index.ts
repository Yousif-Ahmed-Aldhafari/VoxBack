import { I18nManager } from 'react-native';
import { getLocales } from 'expo-localization';

import type { Language } from '@/types';
export { ar } from './ar';
export { en } from './en';
export { dictionaries, translate, type TranslationKey } from './core';

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

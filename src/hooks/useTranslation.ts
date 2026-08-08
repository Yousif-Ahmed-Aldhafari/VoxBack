import { useMemo } from 'react';

import { translate, type TranslationKey, isRTL } from '@/localization';
import { useSettingsStore } from '@/stores/settingsStore';

export function useTranslation() {
  const language = useSettingsStore((state) => state.language);
  return useMemo(
    () => ({
      language,
      isRTL: isRTL(language),
      t: (key: TranslationKey, values?: Record<string, string | number>) => translate(language, key, values),
    }),
    [language],
  );
}

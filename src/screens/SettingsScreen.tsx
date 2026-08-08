import { BookOpen, Info, Shield } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Card } from '@/components/Card';
import { OptionGroup } from '@/components/OptionGroup';
import { PartyButton } from '@/components/PartyButton';
import { ScreenShell } from '@/components/ScreenShell';
import { useTranslation } from '@/hooks/useTranslation';
import { useSettingsStore } from '@/stores/settingsStore';
import { theme } from '@/theme';
import type { Language, RecordingQuality } from '@/types';

export function SettingsScreen() {
  const router = useRouter();
  const { t, isRTL } = useTranslation();
  const settings = useSettingsStore();

  return (
    <ScreenShell title={t('settings')} showBack>
      <OptionGroup<Language>
        label={t('language')}
        value={settings.language}
        onChange={settings.setLanguage}
        options={[
          { value: 'en', label: t('english') },
          { value: 'ar', label: t('arabic') },
        ]}
      />
      <OptionGroup
        label={t('soundEffects')}
        value={settings.soundEffects ? 'on' : 'off'}
        onChange={(value) => settings.setSoundEffects(value === 'on')}
        options={[
          { value: 'on', label: t('on') },
          { value: 'off', label: t('off') },
        ]}
      />
      <OptionGroup
        label={t('music')}
        value={settings.music ? 'on' : 'off'}
        onChange={(value) => settings.setMusic(value === 'on')}
        options={[
          { value: 'on', label: t('on') },
          { value: 'off', label: t('off') },
        ]}
      />
      <OptionGroup
        label={t('hapticFeedback')}
        value={settings.haptics ? 'on' : 'off'}
        onChange={(value) => settings.setHaptics(value === 'on')}
        options={[
          { value: 'on', label: t('on') },
          { value: 'off', label: t('off') },
        ]}
      />
      <OptionGroup<RecordingQuality>
        label={t('recordingQuality')}
        value={settings.recordingQuality}
        onChange={settings.setRecordingQuality}
        options={[
          { value: 'standard', label: t('standard') },
          { value: 'high', label: t('high') },
        ]}
      />
      <PartyButton title={t('howToPlay')} icon={BookOpen} variant="secondary" onPress={() => router.push('/how-to-play')} />
      <Card tint="dark">
        <View style={[styles.heading, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Shield color={theme.colors.mint} size={24} />
          <Text style={styles.cardTitle}>{t('privacy')}</Text>
        </View>
        <Text style={[styles.body, { textAlign: isRTL ? 'right' : 'left' }]}>{t('privacyBody')}</Text>
      </Card>
      <Card tint="dark">
        <View style={[styles.heading, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Info color={theme.colors.sky} size={24} />
          <Text style={styles.cardTitle}>{t('about')}</Text>
        </View>
        <Text style={[styles.body, { textAlign: isRTL ? 'right' : 'left' }]}>{t('aboutBody')}</Text>
      </Card>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  heading: {
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  cardTitle: {
    color: theme.colors.white,
    fontSize: theme.typography.h3,
    fontWeight: '900',
  },
  body: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: theme.typography.body,
    fontWeight: '700',
    lineHeight: 23,
  },
});

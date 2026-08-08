import { Headphones, Mic, RefreshCw, Trophy } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Card } from '@/components/Card';
import { PartyButton } from '@/components/PartyButton';
import { ScreenShell } from '@/components/ScreenShell';
import { useTranslation } from '@/hooks/useTranslation';
import { useSettingsStore } from '@/stores/settingsStore';
import { theme } from '@/theme';

export function TutorialScreen() {
  const router = useRouter();
  const { t, isRTL } = useTranslation();
  const completeTutorial = useSettingsStore((state) => state.completeTutorial);
  const [index, setIndex] = useState(0);
  const steps = useMemo(
    () => [
      { title: t('tutorialRecordTitle'), body: t('tutorialRecordBody'), icon: Mic },
      { title: t('tutorialReverseTitle'), body: t('tutorialReverseBody'), icon: RefreshCw },
      { title: t('tutorialListenTitle'), body: t('tutorialListenBody'), icon: Headphones },
      { title: t('tutorialRepeatTitle'), body: t('tutorialRepeatBody'), icon: Mic },
      { title: t('tutorialCompareTitle'), body: t('tutorialCompareBody'), icon: Trophy },
    ],
    [t],
  );
  const step = steps[index];
  const Icon = step.icon;

  function next() {
    if (index < steps.length - 1) {
      setIndex(index + 1);
      return;
    }
    completeTutorial();
    router.replace('/home');
  }

  return (
    <ScreenShell title={t('firstTimeTitle')} scroll={false}>
      <Card tint="warm" style={styles.card}>
        <View style={styles.iconWrap}>
          <Icon color={theme.colors.ink} size={72} strokeWidth={2.4} />
        </View>
        <Text style={[styles.stepTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{step.title}</Text>
        <Text style={[styles.body, { textAlign: isRTL ? 'right' : 'left' }]}>{step.body}</Text>
        <View style={[styles.dots, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          {steps.map((_, dotIndex) => (
            <View key={dotIndex} style={[styles.dot, dotIndex === index ? styles.activeDot : null]} />
          ))}
        </View>
      </Card>
      <PartyButton title={index === steps.length - 1 ? t('letsPlay') : t('continue')} onPress={next} />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'stretch',
    flex: 1,
    justifyContent: 'center',
    gap: theme.spacing.lg,
  },
  iconWrap: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: theme.colors.lemon,
    borderRadius: 8,
    height: 132,
    justifyContent: 'center',
    width: 132,
  },
  stepTitle: {
    color: theme.colors.ink,
    fontSize: theme.typography.h1,
    fontWeight: '900',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  body: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.h3,
    fontWeight: '800',
    lineHeight: 28,
  },
  dots: {
    alignSelf: 'center',
    gap: theme.spacing.sm,
  },
  dot: {
    backgroundColor: 'rgba(16,16,24,0.18)',
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  activeDot: {
    backgroundColor: theme.colors.coral,
    width: 26,
  },
});

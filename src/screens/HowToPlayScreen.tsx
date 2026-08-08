import { Headphones, Mic, RefreshCw, Trophy } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { ScreenShell } from '@/components/ScreenShell';
import { useTranslation } from '@/hooks/useTranslation';
import { theme } from '@/theme';

export function HowToPlayScreen() {
  const { t, isRTL } = useTranslation();
  const steps = [
    { title: t('tutorialRecordTitle'), body: t('tutorialRecordBody'), icon: Mic, color: theme.colors.coral },
    { title: t('tutorialReverseTitle'), body: t('tutorialReverseBody'), icon: RefreshCw, color: theme.colors.lemon },
    { title: t('tutorialListenTitle'), body: t('tutorialListenBody'), icon: Headphones, color: theme.colors.sky },
    { title: t('tutorialRepeatTitle'), body: t('tutorialRepeatBody'), icon: Mic, color: theme.colors.mint },
    { title: t('tutorialCompareTitle'), body: t('tutorialCompareBody'), icon: Trophy, color: theme.colors.grape },
  ];
  return (
    <ScreenShell title={t('howToPlay')} subtitle={t('tagline')} showBack>
      {steps.map((step) => {
        const Icon = step.icon;
        return (
          <Card key={step.title} style={styles.card}>
            <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={[styles.icon, { backgroundColor: step.color }]}>
                <Icon color={step.color === theme.colors.lemon ? theme.colors.ink : theme.colors.white} size={28} />
              </View>
              <View style={styles.text}>
                <Text style={[styles.title, { textAlign: isRTL ? 'right' : 'left' }]}>{step.title}</Text>
                <Text style={[styles.body, { textAlign: isRTL ? 'right' : 'left' }]}>{step.body}</Text>
              </View>
            </View>
          </Card>
        );
      })}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: theme.spacing.md,
  },
  row: {
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  icon: {
    alignItems: 'center',
    borderRadius: 8,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  text: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.typography.h3,
    fontWeight: '900',
  },
  body: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.body,
    fontWeight: '700',
    lineHeight: 22,
  },
});

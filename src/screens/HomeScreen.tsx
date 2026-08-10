import { BookOpen, Play, Settings, Trophy } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { BrandWaveMark } from '@/components/BrandWaveMark';
import { Card } from '@/components/Card';
import { PartyButton } from '@/components/PartyButton';
import { ScreenShell } from '@/components/ScreenShell';
import { StatCard } from '@/components/StatCard';
import { useTranslation } from '@/hooks/useTranslation';
import { useSettingsStore } from '@/stores/settingsStore';
import { theme } from '@/theme';

export function HomeScreen() {
  const router = useRouter();
  const { t, isRTL } = useTranslation();
  const stats = useSettingsStore((state) => state.stats);

  return (
    <ScreenShell scroll={false}>
      <View style={styles.hero}>
        <BrandWaveMark size={104} style={[styles.logo, { alignSelf: isRTL ? 'flex-end' : 'flex-start' }]} />
        <Text style={[styles.title, { textAlign: isRTL ? 'right' : 'left' }]}>{t('appName')}</Text>
        <Text style={[styles.tagline, { textAlign: isRTL ? 'right' : 'left' }]}>{t('homeQuestion')}</Text>
      </View>

      <View style={styles.actions}>
        <PartyButton title={t('startGame')} icon={Play} onPress={() => router.push('/player-setup')} />
        <PartyButton title={t('howToPlay')} icon={BookOpen} variant="secondary" onPress={() => router.push('/how-to-play')} />
        <PartyButton title={t('settings')} icon={Settings} variant="ghost" onPress={() => router.push('/settings')} />
      </View>

      <Card tint="dark" style={styles.statsCard}>
        <View style={[styles.statsHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Trophy color={theme.colors.lemon} size={22} />
          <Text style={styles.statsTitle}>{t('highestScore')}</Text>
        </View>
        <View style={[styles.stats, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <StatCard label={t('gamesPlayed')} value={stats.gamesPlayed} />
          <StatCard label={t('bestScore')} value={stats.highestScore} />
          <StatCard label={t('highestSimilarity')} value={`${stats.bestSimilarity}%`} />
        </View>
      </Card>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  hero: {
    flex: 1,
    justifyContent: 'center',
  },
  logo: {
    marginBottom: theme.spacing.lg,
  },
  title: {
    color: theme.colors.white,
    fontSize: 54,
    fontWeight: '900',
    letterSpacing: 0,
  },
  tagline: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: theme.typography.h3,
    fontWeight: '800',
    marginTop: theme.spacing.sm,
  },
  actions: {
    gap: theme.spacing.md,
  },
  statsCard: {
    gap: theme.spacing.md,
  },
  statsHeader: {
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  statsTitle: {
    color: theme.colors.white,
    fontSize: theme.typography.body,
    fontWeight: '900',
  },
  stats: {
    gap: theme.spacing.sm,
  },
});

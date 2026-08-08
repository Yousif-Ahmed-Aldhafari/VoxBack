import { EyeOff } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Card } from '@/components/Card';
import { PartyButton } from '@/components/PartyButton';
import { ScreenShell } from '@/components/ScreenShell';
import { getCurrentRound, getRoundPlayers } from '@/services/GameService';
import { useGameStore } from '@/stores/gameStore';
import { useTranslation } from '@/hooks/useTranslation';
import { theme } from '@/theme';

export function PassPhoneScreen() {
  const router = useRouter();
  const { t, isRTL } = useTranslation();
  const game = useGameStore((state) => state.game);
  const round = getCurrentRound(game);

  if (!game || !round) {
    return <ScreenShell title={t('noGame')}>{null}</ScreenShell>;
  }

  const { creator, guesser } = getRoundPlayers(game, round);

  return (
    <ScreenShell scroll={false}>
      <Card tint="dark" style={styles.card}>
        <View style={styles.icon}>
          <EyeOff color={theme.colors.ink} size={54} />
        </View>
        <Text style={styles.title}>{t('passPhone')}</Text>
        <Text style={[styles.body, { textAlign: isRTL ? 'right' : 'left' }]}>{t('creatorDone', { name: creator.name })}</Text>
        <Text style={[styles.bodyStrong, { textAlign: isRTL ? 'right' : 'left' }]}>{t('passToPlayer', { name: guesser.name })}</Text>
      </Card>
      <PartyButton title={t('imReady')} onPress={() => router.replace('/listen')} />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    gap: theme.spacing.xl,
  },
  icon: {
    alignItems: 'center',
    backgroundColor: theme.colors.lemon,
    borderRadius: 8,
    height: 116,
    justifyContent: 'center',
    width: 116,
  },
  title: {
    color: theme.colors.white,
    fontSize: 46,
    fontWeight: '900',
    letterSpacing: 0,
    textAlign: 'center',
  },
  body: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: theme.typography.h3,
    fontWeight: '800',
    lineHeight: 28,
  },
  bodyStrong: {
    color: theme.colors.lemon,
    fontSize: theme.typography.h2,
    fontWeight: '900',
    lineHeight: 34,
  },
});

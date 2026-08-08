import { Mic } from 'lucide-react-native';
import { StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';

import { AudioClipControls } from '@/components/AudioClipControls';
import { Card } from '@/components/Card';
import { PartyButton } from '@/components/PartyButton';
import { ScreenShell } from '@/components/ScreenShell';
import { WaveformBars } from '@/components/WaveformBars';
import { getCurrentRound, getRoundPlayers } from '@/services/GameService';
import { useGameStore } from '@/stores/gameStore';
import { useTranslation } from '@/hooks/useTranslation';
import { theme } from '@/theme';

export function ListeningScreen() {
  const router = useRouter();
  const { t, isRTL } = useTranslation();
  const game = useGameStore((state) => state.game);
  const round = getCurrentRound(game);

  if (!game || !round) {
    return <ScreenShell title={t('noGame')}>{null}</ScreenShell>;
  }

  const { guesser } = getRoundPlayers(game, round);

  return (
    <ScreenShell title={t('listenCarefully')} subtitle={t('guesserTurn', { name: guesser.name })}>
      <Card tint="dark" style={styles.card}>
        <Text style={[styles.note, { textAlign: isRTL ? 'right' : 'left' }]}>{t('listenOnlyReversed')}</Text>
        <WaveformBars active color={theme.colors.sky} />
        <AudioClipControls uri={round.reversedTargetUri} label={t('target')} />
        <Text style={[styles.prompt, { textAlign: isRTL ? 'right' : 'left' }]}>{t('sayWhatYouHeard')}</Text>
      </Card>
      <PartyButton title={t('recordMyAttempt')} icon={Mic} onPress={() => router.push('/record-attempt')} />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: theme.spacing.lg,
  },
  note: {
    color: theme.colors.lemon,
    fontSize: theme.typography.body,
    fontWeight: '900',
  },
  prompt: {
    color: theme.colors.white,
    fontSize: theme.typography.h3,
    fontWeight: '900',
    lineHeight: 28,
  },
});

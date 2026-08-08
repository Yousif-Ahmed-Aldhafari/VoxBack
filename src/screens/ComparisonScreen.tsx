import { ListChecks, RefreshCw } from 'lucide-react-native';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AudioClipControls } from '@/components/AudioClipControls';
import { Card } from '@/components/Card';
import { PartyButton } from '@/components/PartyButton';
import { ScoreTicker } from '@/components/ScoreTicker';
import { ScreenShell } from '@/components/ScreenShell';
import { getReactionKey } from '@/constants/reactions';
import { playAudioSequence } from '@/services/AudioPlaybackService';
import { getCurrentRound, getRoundPlayers } from '@/services/GameService';
import { useGameStore } from '@/stores/gameStore';
import { useTranslation } from '@/hooks/useTranslation';
import { theme } from '@/theme';

export function ComparisonScreen() {
  const router = useRouter();
  const { t, isRTL } = useTranslation();
  const game = useGameStore((state) => state.game);
  const retryAttempt = useGameStore((state) => state.retryAttempt);
  const round = getCurrentRound(game);

  if (!game || !round) {
    return <ScreenShell title={t('noGame')}>{null}</ScreenShell>;
  }

  const activeRound = round;
  const score = round.similarityScore ?? 0;
  const reaction = t(getReactionKey(score));
  const { creator, guesser } = getRoundPlayers(game, activeRound);

  async function playBoth() {
    try {
      if (activeRound.reversedTargetUri && activeRound.reversedAttemptUri) {
        await playAudioSequence([activeRound.reversedTargetUri, activeRound.reversedAttemptUri]);
      }
    } catch {
      Alert.alert(t('playbackFailed'));
    }
  }

  return (
    <ScreenShell title={t('howClose')} subtitle={t('roundResults', { round: activeRound.number })}>
      <ScoreTicker score={score} />
      <Text style={styles.reaction}>{reaction}</Text>
      <Card tint="dark" style={styles.card}>
        <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Text style={styles.player}>{creator.avatar} {creator.name}</Text>
          <Text style={styles.badge}>{t('target')}</Text>
        </View>
        <AudioClipControls uri={activeRound.reversedTargetUri} label={t('playTarget')} />
      </Card>
      <Card tint="dark" style={styles.card}>
        <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Text style={styles.player}>{guesser.avatar} {guesser.name}</Text>
          <Text style={styles.badge}>{t('match', { score })}</Text>
        </View>
        <AudioClipControls uri={activeRound.reversedAttemptUri} label={t('playAttempt')} />
      </Card>
      <PartyButton title={t('playBoth')} variant="secondary" onPress={playBoth} />
      <View style={[styles.actions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <PartyButton
          compact
          title={t('tryAgain')}
          icon={RefreshCw}
          variant="ghost"
          onPress={() => {
            retryAttempt();
            router.replace('/record-attempt');
          }}
        />
        <PartyButton compact title={t('scoreboard')} icon={ListChecks} variant="mint" onPress={() => router.push('/scoreboard')} />
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  reaction: {
    color: theme.colors.lemon,
    fontSize: theme.typography.h3,
    fontWeight: '900',
    lineHeight: 28,
    textAlign: 'center',
  },
  card: {
    gap: theme.spacing.md,
  },
  row: {
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  player: {
    color: theme.colors.white,
    flex: 1,
    fontSize: theme.typography.h3,
    fontWeight: '900',
  },
  badge: {
    color: theme.colors.ink,
    backgroundColor: theme.colors.lemon,
    borderRadius: 8,
    overflow: 'hidden',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 5,
    fontSize: theme.typography.small,
    fontWeight: '900',
  },
  actions: {
    gap: theme.spacing.sm,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
});

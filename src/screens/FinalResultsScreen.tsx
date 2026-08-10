import { Home, RotateCcw, Users } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import ViewShot, { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

import { Card } from '@/components/Card';
import { ConfettiBurst } from '@/components/ConfettiBurst';
import { PartyButton } from '@/components/PartyButton';
import { ResultShareCard } from '@/components/ResultShareCard';
import { ScreenShell } from '@/components/ScreenShell';
import { getAverageSimilarity, getBestRound, getWinner } from '@/services/GameService';
import { useGameStore } from '@/stores/gameStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useFeedback } from '@/services/FeedbackService';
import { useTranslation } from '@/hooks/useTranslation';
import { theme } from '@/theme';

export function FinalResultsScreen() {
  const router = useRouter();
  const shareRef = useRef<ViewShot>(null);
  const { t, isRTL, language } = useTranslation();
  const game = useGameStore((state) => state.game);
  const restartSamePlayers = useGameStore((state) => state.restartSamePlayers);
  const newPlayers = useGameStore((state) => state.newPlayers);
  const clearGame = useGameStore((state) => state.clearGame);
  const recordCompletedGame = useSettingsStore((state) => state.recordCompletedGame);
  const feedback = useFeedback();

  useEffect(() => {
    if (game) {
      recordCompletedGame(game);
      void feedback('winner');
    }
  }, [feedback, game, recordCompletedGame]);

  if (!game) {
    return <ScreenShell title={t('noGame')}>{null}</ScreenShell>;
  }

  const winner = getWinner(game);
  const average = getAverageSimilarity(game);
  const bestRound = getBestRound(game);
  const perfectRounds = game.rounds.filter((round) => (round.similarityScore ?? 0) >= 100).length;

  async function share() {
    try {
      const uri = await captureRef(shareRef, { format: 'png', quality: 1 });
      await Sharing.shareAsync(uri, { dialogTitle: t('shareResult') });
    } catch {
      Alert.alert(t('shareFailed'));
    }
  }

  return (
    <ScreenShell title={t('finalResults')} scroll>
      <ConfettiBurst active />
      <Card tint="warm" style={styles.winnerCard}>
        <Text style={styles.trophy}>🏆</Text>
        <Text style={[styles.winner, { textAlign: isRTL ? 'right' : 'left' }]}>{winner ? t('winner', { name: winner.name }) : t('draw')}</Text>
        {game.players.map((player) => (
          <View key={player.id} style={[styles.playerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={styles.player}>{player.avatar} {player.name}</Text>
            <Text style={styles.points}>{t('points', { score: player.score })}</Text>
          </View>
        ))}
      </Card>
      <Card tint="dark" style={styles.stats}>
        <Metric label={t('averageSimilarity')} value={`${average}%`} />
        <Metric label={t('bestRound')} value={bestRound ? `${bestRound.number} (${bestRound.similarityScore}%)` : '-'} />
        <Metric label={t('highestScore')} value={Math.max(...game.players.map((player) => player.score))} />
        <Metric label={t('perfectRoundCount')} value={perfectRounds} />
      </Card>
      <PartyButton title={t('shareResult')} variant="secondary" onPress={share} />
      <PartyButton
        title={t('playAgain')}
        icon={RotateCcw}
        onPress={() => {
          restartSamePlayers(language);
          router.replace('/round-intro');
        }}
      />
      <PartyButton
        title={t('newPlayers')}
        icon={Users}
        variant="mint"
        onPress={() => {
          newPlayers();
          router.replace('/player-setup');
        }}
      />
      <PartyButton
        title={t('home')}
        icon={Home}
        variant="ghost"
        onPress={() => {
          clearGame();
          router.replace('/home');
        }}
      />
      <View style={styles.hiddenShare} pointerEvents="none">
        <ViewShot ref={shareRef} options={{ format: 'png', quality: 1 }}>
          <ResultShareCard game={game} />
        </ViewShot>
      </View>
    </ScreenShell>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  winnerCard: {
    gap: theme.spacing.lg,
  },
  trophy: {
    fontSize: 66,
    textAlign: 'center',
  },
  winner: {
    color: theme.colors.ink,
    fontSize: theme.typography.h1,
    fontWeight: '900',
    letterSpacing: 0,
  },
  playerRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  player: {
    color: theme.colors.text,
    flex: 1,
    fontSize: theme.typography.h3,
    fontWeight: '900',
  },
  points: {
    color: theme.colors.coral,
    fontSize: theme.typography.h3,
    fontWeight: '900',
  },
  stats: {
    gap: theme.spacing.md,
  },
  metric: {
    borderBottomColor: 'rgba(255,255,255,0.1)',
    borderBottomWidth: 1,
    paddingBottom: theme.spacing.sm,
  },
  metricLabel: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: theme.typography.small,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  metricValue: {
    color: theme.colors.white,
    fontSize: theme.typography.h2,
    fontWeight: '900',
  },
  hiddenShare: {
    opacity: 0,
    position: 'absolute',
    right: -1000,
    top: -1000,
  },
});

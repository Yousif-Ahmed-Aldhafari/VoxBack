import { ArrowRight, Home } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Card } from '@/components/Card';
import { PartyButton } from '@/components/PartyButton';
import { ScreenShell } from '@/components/ScreenShell';
import { getCurrentRound } from '@/services/GameService';
import { useGameStore } from '@/stores/gameStore';
import { useTranslation } from '@/hooks/useTranslation';
import { theme } from '@/theme';

export function ScoreboardScreen() {
  const router = useRouter();
  const { t, isRTL } = useTranslation();
  const game = useGameStore((state) => state.game);
  const nextRound = useGameStore((state) => state.nextRound);
  const round = getCurrentRound(game);

  if (!game) {
    return <ScreenShell title={t('noGame')}>{null}</ScreenShell>;
  }

  const finalRoundScored = game.currentRound >= game.totalRounds && round?.similarityScore !== undefined;

  function advance() {
    nextRound();
    router.replace(finalRoundScored ? '/final-results' : '/round-intro');
  }

  return (
    <ScreenShell title={t('scoreboard')} subtitle={round ? t('roundResults', { round: round.number }) : undefined}>
      <Card tint="warm" style={styles.table}>
        <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Text style={styles.headerText}>{t('player')}</Text>
          <Text style={styles.headerText}>{t('score')}</Text>
        </View>
        {game.players.map((player) => (
          <View key={player.id} style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={styles.name}>{player.avatar} {player.name}</Text>
            <Text style={styles.score}>{player.score}</Text>
          </View>
        ))}
      </Card>
      <PartyButton title={finalRoundScored ? t('finalResults') : t('nextRound')} icon={ArrowRight} onPress={advance} />
      <PartyButton title={t('home')} icon={Home} variant="ghost" onPress={() => router.replace('/home')} />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  table: {
    gap: theme.spacing.md,
  },
  header: {
    justifyContent: 'space-between',
    borderBottomColor: theme.colors.border,
    borderBottomWidth: 1,
    paddingBottom: theme.spacing.sm,
  },
  headerText: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.small,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  row: {
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  name: {
    color: theme.colors.ink,
    flex: 1,
    fontSize: theme.typography.h3,
    fontWeight: '900',
  },
  score: {
    color: theme.colors.coral,
    fontSize: 36,
    fontWeight: '900',
  },
});

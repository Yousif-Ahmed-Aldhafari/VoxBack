import { ArrowRight, Home } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Card } from '@/components/Card';
import { PartyButton } from '@/components/PartyButton';
import { ScreenShell } from '@/components/ScreenShell';
import { getCurrentRound } from '@/services/GameService';
import { useGameStore } from '@/stores/gameStore';
import { useTranslation } from '@/hooks/useTranslation';
import { theme } from '@/theme';

export function ScoreboardScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ from?: string }>();
  const { t, isRTL } = useTranslation();
  const game = useGameStore((state) => state.game);
  const nextRound = useGameStore((state) => state.nextRound);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const isAdvancingRef = useRef(false);
  const round = getCurrentRound(game);

  if (!game) {
    return <ScreenShell title={t('noGame')}>{null}</ScreenShell>;
  }

  const fromComparison = params.from === 'comparison';
  const finalRoundScored = game.currentRound >= game.totalRounds && round?.similarityScore !== undefined;

  function advance() {
    if (isAdvancingRef.current) {
      return;
    }
    isAdvancingRef.current = true;
    setIsAdvancing(true);
    nextRound();
    router.replace(finalRoundScored ? '/final-results' : '/round-intro');
  }

  return (
    <ScreenShell title={t('scoreboard')} subtitle={round ? t('roundResults', { round: round.number }) : undefined} showBack={fromComparison}>
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
      {fromComparison ? null : (
        <PartyButton
          disabled={isAdvancing}
          title={finalRoundScored ? t('seeFinalResults') : t('nextRound')}
          icon={ArrowRight}
          onPress={advance}
        />
      )}
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

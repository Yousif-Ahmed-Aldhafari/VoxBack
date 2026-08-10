import { ArrowRight, ListChecks } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AudioClipControls } from '@/components/AudioClipControls';
import { Card } from '@/components/Card';
import { PartyButton } from '@/components/PartyButton';
import { ScoreTicker } from '@/components/ScoreTicker';
import { ScreenShell } from '@/components/ScreenShell';
import { getReactionKey } from '@/constants/reactions';
import { getCurrentRound, getRoundPlayers } from '@/services/GameService';
import { useGameStore } from '@/stores/gameStore';
import { useTranslation } from '@/hooks/useTranslation';
import { theme } from '@/theme';

export function ComparisonScreen() {
  const router = useRouter();
  const { t, isRTL } = useTranslation();
  const { height, width } = useWindowDimensions();
  const game = useGameStore((state) => state.game);
  const nextRound = useGameStore((state) => state.nextRound);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const isAdvancingRef = useRef(false);
  const round = getCurrentRound(game);

  if (!game || !round) {
    return <ScreenShell title={t('noGame')}>{null}</ScreenShell>;
  }

  const isCompact = height < 760 || width < 380;
  const isFinalRound = game.currentRound >= game.totalRounds;
  const activeRound = round;
  const hasFinalizedScore = activeRound.similarityScore !== undefined;
  const score = round.similarityScore ?? 0;
  const reaction = t(getReactionKey(score));
  const { creator, guesser } = getRoundPlayers(game, activeRound);

  function advance() {
    if (isAdvancingRef.current) {
      return;
    }
    if (!hasFinalizedScore) {
      return;
    }
    isAdvancingRef.current = true;
    setIsAdvancing(true);
    nextRound();
    router.replace(isFinalRound ? '/final-results' : '/round-intro');
  }

  return (
    <ScreenShell scroll={false} contentStyle={[styles.screen, isCompact ? styles.compactScreen : null]}>
      <View style={styles.header}>
        <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.title, isCompact ? styles.compactTitle : null, { textAlign: isRTL ? 'right' : 'left' }]}>
          {t('howClose')}
        </Text>
        <Text style={[styles.subtitle, { textAlign: isRTL ? 'right' : 'left' }]}>{t('roundResults', { round: activeRound.number })}</Text>
      </View>

      <ScoreTicker score={score} compact={isCompact} />
      <Text numberOfLines={2} adjustsFontSizeToFit style={[styles.reaction, isCompact ? styles.compactReaction : null]}>
        {reaction}
      </Text>

      <View style={styles.audioStack}>
        <ResultAudioCard
          badge={t('target')}
          compact={isCompact}
          isRTL={isRTL}
          label={t('playTarget')}
          player={`${creator.avatar} ${creator.name}`}
          uri={activeRound.reversedTargetUri}
        />
        <ResultAudioCard
          badge={t('match', { score })}
          compact={isCompact}
          isRTL={isRTL}
          label={t('playAttempt')}
          player={`${guesser.avatar} ${guesser.name}`}
          uri={activeRound.reversedAttemptUri}
        />
      </View>

      <View style={[styles.bottomActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <PartyButton
          compact
          disabled={isAdvancing || !hasFinalizedScore}
          icon={ListChecks}
          onPress={() => router.push('/scoreboard?from=comparison')}
          style={styles.actionButton}
          title={t('scoreboard')}
          variant="secondary"
        />
        <PartyButton
          compact
          disabled={isAdvancing}
          icon={ArrowRight}
          onPress={advance}
          style={styles.actionButton}
          title={isFinalRound ? t('seeFinalResults') : t('nextRound')}
        />
      </View>
    </ScreenShell>
  );
}

function ResultAudioCard({
  badge,
  compact,
  isRTL,
  label,
  player,
  uri,
}: {
  badge: string;
  compact: boolean;
  isRTL: boolean;
  label: string;
  player: string;
  uri?: string;
}) {
  return (
    <Card tint="dark" style={[styles.card, compact ? styles.compactCard : null]}>
      <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.player, compact ? styles.compactPlayer : null]}>
          {player}
        </Text>
        <Text numberOfLines={1} adjustsFontSizeToFit style={styles.badge}>
          {badge}
        </Text>
      </View>
      <AudioClipControls compact={compact} uri={uri} label={label} />
    </Card>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: theme.spacing.sm,
    padding: theme.spacing.lg,
  },
  compactScreen: {
    gap: 6,
    padding: theme.spacing.md,
  },
  header: {
    gap: 2,
  },
  title: {
    color: theme.colors.white,
    fontSize: theme.typography.h1,
    fontWeight: '900',
    letterSpacing: 0,
  },
  compactTitle: {
    fontSize: theme.typography.h2,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: theme.typography.small,
    fontWeight: '800',
  },
  reaction: {
    color: theme.colors.lemon,
    fontSize: theme.typography.h3,
    fontWeight: '900',
    lineHeight: 24,
    textAlign: 'center',
  },
  compactReaction: {
    fontSize: theme.typography.body,
    lineHeight: 19,
  },
  audioStack: {
    gap: theme.spacing.sm,
    flexShrink: 1,
  },
  card: {
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  compactCard: {
    gap: 6,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 7,
  },
  row: {
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  player: {
    color: theme.colors.white,
    flex: 1,
    fontSize: theme.typography.body,
    fontWeight: '900',
  },
  compactPlayer: {
    fontSize: theme.typography.small,
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
  bottomActions: {
    gap: theme.spacing.sm,
    justifyContent: 'center',
    marginTop: 'auto',
    paddingTop: theme.spacing.xs,
  },
  actionButton: {
    flex: 1,
    paddingHorizontal: theme.spacing.sm,
  },
});

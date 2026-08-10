import { ArrowRight } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Card } from '@/components/Card';
import { PartyButton } from '@/components/PartyButton';
import { ScreenShell } from '@/components/ScreenShell';
import { getCurrentRound, getRoundPlayers } from '@/services/GameService';
import { useGameStore } from '@/stores/gameStore';
import { useTranslation } from '@/hooks/useTranslation';
import { theme } from '@/theme';

export function RoundIntroScreen() {
  const router = useRouter();
  const { t, isRTL } = useTranslation();
  const game = useGameStore((state) => state.game);
  const round = getCurrentRound(game);

  if (!game || !round) {
    return (
      <ScreenShell title={t('noGame')}>
        <PartyButton title={t('home')} onPress={() => router.replace('/home')} />
      </ScreenShell>
    );
  }

  const { creator, guesser } = getRoundPlayers(game, round);

  return (
    <ScreenShell
      title={t('roundTitle', { round: round.number })}
      subtitle={t('creatorTurn', { name: creator.name })}
      showBack
      backFallbackHref="/game-settings"
    >
      <Card tint="warm" style={styles.card}>
        <Text style={[styles.avatar, { textAlign: isRTL ? 'right' : 'left' }]}>{creator.avatar}</Text>
        <View style={styles.promptBlock}>
          <Text style={[styles.prompt, { textAlign: isRTL ? 'right' : 'left' }]}>{t('creatorPromptPrefix')}</Text>
          <Text style={[styles.guesserName, { textAlign: isRTL ? 'right' : 'left' }]}>{guesser.name}</Text>
        </View>
        {round.challengePhrase ? (
          <View style={styles.phraseBox}>
            <Text style={[styles.phraseLabel, { textAlign: isRTL ? 'right' : 'left' }]}>{t('challengePhrase')}</Text>
            <Text style={[styles.phrase, { textAlign: isRTL ? 'right' : 'left' }]}>{round.challengePhrase}</Text>
          </View>
        ) : null}
      </Card>
      <PartyButton title={t('ready')} icon={ArrowRight} onPress={() => router.push('/record-creator')} />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: theme.spacing.lg,
  },
  avatar: {
    fontSize: 64,
  },
  promptBlock: {
    gap: theme.spacing.xs,
  },
  prompt: {
    color: theme.colors.ink,
    fontSize: theme.typography.h3,
    fontWeight: '800',
    lineHeight: 26,
  },
  guesserName: {
    color: theme.colors.coral,
    fontSize: theme.typography.h2,
    fontWeight: '900',
    lineHeight: 32,
  },
  phraseBox: {
    backgroundColor: theme.colors.white,
    borderColor: theme.colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: theme.spacing.sm,
    padding: theme.spacing.lg,
  },
  phraseLabel: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.small,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  phrase: {
    color: theme.colors.text,
    fontSize: theme.typography.h3,
    fontWeight: '900',
    lineHeight: 28,
  },
});

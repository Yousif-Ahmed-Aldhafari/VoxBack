import { ArrowRight, EyeOff } from 'lucide-react-native';
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
        <Text style={[styles.prompt, { textAlign: isRTL ? 'right' : 'left' }]}>{t('creatorPrompt', { name: guesser.name })}</Text>
        {round.challengePhrase ? (
          <View style={styles.phraseBox}>
            <Text style={[styles.phraseLabel, { textAlign: isRTL ? 'right' : 'left' }]}>{t('challengePhrase')}</Text>
            <Text style={[styles.phrase, { textAlign: isRTL ? 'right' : 'left' }]}>{round.challengePhrase}</Text>
          </View>
        ) : null}
      </Card>
      <Card tint="dark">
        <View style={[styles.privacyRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <EyeOff color={theme.colors.lemon} size={24} />
          <Text style={[styles.privacy, { textAlign: isRTL ? 'right' : 'left' }]}>{t('privacyNote')}</Text>
        </View>
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
  prompt: {
    color: theme.colors.ink,
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
  privacyRow: {
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  privacy: {
    color: theme.colors.white,
    flex: 1,
    fontSize: theme.typography.body,
    fontWeight: '800',
    lineHeight: 23,
  },
});

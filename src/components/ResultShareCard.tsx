import { forwardRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { theme } from '@/theme';
import type { Game } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';

type ResultShareCardProps = {
  game: Game;
};

export const ResultShareCard = forwardRef<View, ResultShareCardProps>(({ game }, ref) => {
  const { t, isRTL } = useTranslation();
  return (
    <View ref={ref} collapsable={false} style={styles.card}>
      <Text style={styles.brand}>{t('appName')}</Text>
      <Text style={styles.tag}>{t('shareText')}</Text>
      <View style={styles.divider} />
      {game.players.map((player) => (
        <View key={player.id} style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Text style={styles.name}>
            {player.avatar} {player.name}
          </Text>
          <Text style={styles.score}>{player.score}</Text>
        </View>
      ))}
    </View>
  );
});

ResultShareCard.displayName = 'ResultShareCard';

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.lemon,
    borderRadius: 8,
    gap: theme.spacing.md,
    padding: theme.spacing.xl,
    width: 320,
  },
  brand: {
    color: theme.colors.ink,
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 0,
    textAlign: 'center',
  },
  tag: {
    color: theme.colors.ink,
    fontSize: theme.typography.body,
    fontWeight: '800',
    textAlign: 'center',
  },
  divider: {
    backgroundColor: theme.colors.ink,
    height: 3,
    opacity: 0.2,
  },
  row: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    color: theme.colors.ink,
    flex: 1,
    fontSize: theme.typography.h3,
    fontWeight: '900',
  },
  score: {
    color: theme.colors.coral,
    fontSize: theme.typography.h2,
    fontWeight: '900',
  },
});

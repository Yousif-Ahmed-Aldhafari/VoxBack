import { RefreshCw } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { Card } from './Card';
import { WaveformBars } from './WaveformBars';
import { useTranslation } from '@/hooks/useTranslation';
import { theme } from '@/theme';
import { useFeedback } from '@/services/FeedbackService';

type ProcessingCardProps = {
  title: string;
  progress?: number;
};

export function ProcessingCard({ title, progress = 0.72 }: ProcessingCardProps) {
  const { isRTL } = useTranslation();
  const feedback = useFeedback();
  const [spin] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const loop = Animated.loop(Animated.timing(spin, { toValue: 1, duration: 900, useNativeDriver: true }));
    void feedback('reverse');
    loop.start();
    return () => loop.stop();
  }, [feedback, spin]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Card tint="dark" style={styles.card}>
      <Animated.View style={[styles.icon, { transform: [{ rotate }] }]}>
        <RefreshCw color={theme.colors.ink} size={46} strokeWidth={2.7} />
      </Animated.View>
      <Text style={[styles.title, { textAlign: isRTL ? 'right' : 'left' }]}>{title}</Text>
      <WaveformBars active color={theme.colors.lemon} />
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    gap: theme.spacing.lg,
    justifyContent: 'center',
    minHeight: 420,
  },
  icon: {
    alignItems: 'center',
    backgroundColor: theme.colors.lemon,
    borderRadius: 8,
    height: 96,
    justifyContent: 'center',
    width: 96,
  },
  title: {
    color: theme.colors.white,
    fontSize: theme.typography.h2,
    fontWeight: '900',
    letterSpacing: 0,
  },
  progressTrack: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 5,
    height: 10,
    overflow: 'hidden',
    width: '100%',
  },
  progressFill: {
    backgroundColor: theme.colors.mint,
    height: 10,
  },
});

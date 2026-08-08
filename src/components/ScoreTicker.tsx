import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { theme } from '@/theme';

type ScoreTickerProps = {
  score: number;
};

export function ScoreTicker({ score }: ScoreTickerProps) {
  const [display, setDisplay] = useState(0);
  const scale = useRef(new Animated.Value(0.88)).current;

  useEffect(() => {
    let frame = 0;
    const frames = 32;
    const timer = setInterval(() => {
      frame += 1;
      setDisplay(Math.round((score * frame) / frames));
      if (frame >= frames) {
        clearInterval(timer);
      }
    }, 26);
    Animated.spring(scale, { toValue: 1, friction: 5, tension: 110, useNativeDriver: true }).start();
    return () => clearInterval(timer);
  }, [scale, score]);

  return (
    <Animated.View style={[styles.wrap, { transform: [{ scale }] }]}>
      <View style={styles.ring}>
        <Text style={styles.score}>{display}%</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  ring: {
    alignItems: 'center',
    backgroundColor: theme.colors.lemon,
    borderColor: theme.colors.white,
    borderRadius: 8,
    borderWidth: 5,
    height: 168,
    justifyContent: 'center',
    shadowColor: theme.colors.lemon,
    shadowOpacity: 0.28,
    shadowRadius: 22,
    width: 168,
  },
  score: {
    color: theme.colors.ink,
    fontSize: 54,
    fontWeight: '900',
    letterSpacing: 0,
  },
});

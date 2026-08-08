import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { theme } from '@/theme';

type WaveformBarsProps = {
  levels?: number[];
  active?: boolean;
  color?: string;
};

const idle = [0.12, 0.24, 0.52, 0.34, 0.72, 0.44, 0.3, 0.6, 0.26, 0.16, 0.46, 0.22, 0.7, 0.36, 0.2, 0.5];

export function WaveformBars({ levels, active = false, color = theme.colors.mint }: WaveformBarsProps) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) {
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 420, useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 0, duration: 420, useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [active, pulse]);

  const data = levels?.length ? levels.slice(-16) : idle;
  return (
    <View style={styles.wave}>
      {data.map((raw, index) => {
        const value = Math.max(0.08, Math.min(1, raw));
        const height = active
          ? pulse.interpolate({
              inputRange: [0, 1],
              outputRange: [18 + value * 56, 18 + Math.min(1, value + idle[index % idle.length]) * 58],
            })
          : 18 + value * 52;
        return <Animated.View key={`${index}-${raw}`} style={[styles.bar, { backgroundColor: color, height }]} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wave: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
    height: 92,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  bar: {
    borderRadius: 4,
    width: 7,
  },
});

import { useEffect, useState } from 'react';
import { Animated, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { theme } from '@/theme';

type BrandWaveMarkProps = {
  active?: boolean;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

const baseSize = 96;
const bars = [
  { color: theme.colors.coral, from: 24, to: 18 },
  { color: theme.colors.mint, from: 34, to: 46 },
  { color: '#ff5361', from: 30, to: 24 },
  { color: theme.colors.mint, from: 50, to: 34 },
  { color: '#ff5361', from: 26, to: 40 },
];

export function BrandWaveMark({ active = true, size = baseSize, style }: BrandWaveMarkProps) {
  const [pulse] = useState(() => new Animated.Value(0));
  const scale = size / baseSize;

  useEffect(() => {
    if (!active) {
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 620, useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 0, duration: 620, useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [active, pulse]);

  return (
    <View style={[styles.wrap, { height: size + 26 * scale, width: size + 8 * scale }, style]}>
      <View style={[styles.logo, { borderRadius: 8 * scale, height: size, width: size }]}>
        <Text style={[styles.logoText, { fontSize: 64 * scale }]}>V</Text>
      </View>
      <View style={[styles.wave, { gap: 10 * scale, height: 58 * scale }]}>
        {bars.map((bar, index) => {
          const height = active
            ? pulse.interpolate({
                inputRange: [0, 1],
                outputRange: [bar.from * scale, bar.to * scale],
              })
            : bar.from * scale;
          return <Animated.View key={index} style={[styles.bar, { backgroundColor: bar.color, height, width: 9 * scale }]} />;
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  logo: {
    alignItems: 'center',
    backgroundColor: theme.colors.lemon,
    justifyContent: 'center',
    shadowColor: theme.colors.lemon,
    shadowOpacity: 0.34,
    shadowRadius: 18,
    zIndex: 1,
  },
  logoText: {
    color: theme.colors.ink,
    fontWeight: '900',
  },
  wave: {
    alignItems: 'flex-end',
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    zIndex: 2,
  },
  bar: {
    borderRadius: 2,
  },
});

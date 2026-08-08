import { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { theme } from '@/theme';

const colors = [theme.colors.coral, theme.colors.mint, theme.colors.lemon, theme.colors.sky, theme.colors.grape];

type ConfettiBurstProps = {
  active?: boolean;
};

export function ConfettiBurst({ active = true }: ConfettiBurstProps) {
  const fall = useRef(new Animated.Value(0)).current;
  const pieces = useMemo(
    () =>
      Array.from({ length: 32 }, (_, index) => ({
        left: `${(index * 37) % 100}%` as `${number}%`,
        delay: (index % 8) * 50,
        color: colors[index % colors.length],
        rotate: `${(index * 23) % 120}deg`,
      })),
    [],
  );

  useEffect(() => {
    if (!active) {
      return;
    }
    fall.setValue(0);
    Animated.timing(fall, { toValue: 1, duration: 1800, useNativeDriver: true }).start();
  }, [active, fall]);

  if (!active) {
    return null;
  }

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((piece, index) => {
        const translateY = fall.interpolate({ inputRange: [0, 1], outputRange: [-60 - piece.delay, 780] });
        const translateX = fall.interpolate({ inputRange: [0, 1], outputRange: [0, (index % 2 === 0 ? 1 : -1) * (20 + index)] });
        return (
          <Animated.View
            key={index}
            style={[
              styles.piece,
              {
                backgroundColor: piece.color,
                left: piece.left,
                transform: [{ translateY }, { translateX }, { rotate: piece.rotate }],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  piece: {
    borderRadius: 2,
    height: 18,
    position: 'absolute',
    top: 0,
    width: 9,
  },
});

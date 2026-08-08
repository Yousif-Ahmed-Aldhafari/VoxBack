import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { theme } from '@/theme';

const bars = [12, 28, 44, 26, 58, 38, 24, 50, 32, 16, 46, 30];

export function SplashScreen() {
  const router = useRouter();
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 760, useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 0, duration: 760, useNativeDriver: false }),
      ]),
    );
    loop.start();
    const timer = setTimeout(() => router.replace('/home'), 1400);
    return () => {
      loop.stop();
      clearTimeout(timer);
    };
  }, [pulse, router]);

  return (
    <LinearGradient colors={[theme.colors.ink, '#252235']} style={styles.container}>
      <View style={styles.logoMark}>
        <Text style={styles.logoText}>V</Text>
      </View>
      <Text style={styles.title}>VoxBack</Text>
      <View style={styles.wave}>
        {bars.map((height, index) => {
          const animatedHeight = pulse.interpolate({
            inputRange: [0, 1],
            outputRange: [height, bars[(index + 5) % bars.length]],
          });
          return <Animated.View key={index} style={[styles.bar, { height: animatedHeight }]} />;
        })}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  logoMark: {
    alignItems: 'center',
    backgroundColor: theme.colors.lemon,
    borderRadius: 8,
    height: 78,
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
    shadowColor: theme.colors.lemon,
    shadowOpacity: 0.4,
    shadowRadius: 18,
    width: 78,
  },
  logoText: {
    color: theme.colors.ink,
    fontSize: 52,
    fontWeight: '900',
  },
  title: {
    color: theme.colors.white,
    fontSize: theme.typography.title,
    fontWeight: '900',
    letterSpacing: 0,
  },
  wave: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    height: 78,
    marginTop: theme.spacing.xl,
  },
  bar: {
    backgroundColor: theme.colors.mint,
    borderRadius: 4,
    width: 8,
  },
});

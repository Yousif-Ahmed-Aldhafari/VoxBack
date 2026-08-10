import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { BrandWaveMark } from '@/components/BrandWaveMark';
import { theme } from '@/theme';
import { useSettingsStore } from '@/stores/settingsStore';

export function SplashScreen() {
  const router = useRouter();
  const tutorialSeen = useSettingsStore((state) => state.tutorialSeen);

  useEffect(() => {
    const timer = setTimeout(() => router.replace(tutorialSeen ? '/home' : '/tutorial'), 1400);
    return () => clearTimeout(timer);
  }, [router, tutorialSeen]);

  return (
    <LinearGradient colors={[theme.colors.ink, '#252235']} style={styles.container}>
      <BrandWaveMark size={116} style={styles.logoMark} />
      <Text style={styles.title}>VoxBack</Text>
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
    marginBottom: theme.spacing.lg,
  },
  title: {
    color: theme.colors.white,
    fontSize: theme.typography.title,
    fontWeight: '900',
    letterSpacing: 0,
  },
});

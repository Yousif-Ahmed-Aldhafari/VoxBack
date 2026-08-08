import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

import { PartyButton } from './PartyButton';
import { theme } from '@/theme';
import { useTranslation } from '@/hooks/useTranslation';

type ScreenShellProps = {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  scroll?: boolean;
  showBack?: boolean;
};

export function ScreenShell({ title, subtitle, children, scroll = true, showBack = false }: ScreenShellProps) {
  const router = useRouter();
  const { isRTL, t } = useTranslation();
  const content = (
    <>
      {showBack ? (
        <View style={[styles.backRow, { alignSelf: isRTL ? 'flex-end' : 'flex-start' }]}>
          <PartyButton
            title={t('back')}
            icon={isRTL ? ChevronRight : ChevronLeft}
            variant="ghost"
            compact
            onPress={() => router.back()}
          />
        </View>
      ) : null}
      {title ? (
        <View style={styles.header}>
          <Text style={[styles.title, { textAlign: isRTL ? 'right' : 'left' }]}>{title}</Text>
          {subtitle ? <Text style={[styles.subtitle, { textAlign: isRTL ? 'right' : 'left' }]}>{subtitle}</Text> : null}
        </View>
      ) : null}
      {children}
    </>
  );

  return (
    <LinearGradient colors={[theme.colors.ink, '#201f2e', '#141422']} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        {scroll ? (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {content}
          </ScrollView>
        ) : (
          <View style={styles.staticContent}>{content}</View>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  scrollContent: {
    gap: theme.spacing.lg,
    padding: theme.spacing.xl,
    paddingBottom: theme.spacing.xxl,
  },
  staticContent: {
    flex: 1,
    gap: theme.spacing.lg,
    padding: theme.spacing.xl,
  },
  backRow: {
    marginBottom: theme.spacing.xs,
  },
  header: {
    gap: theme.spacing.sm,
  },
  title: {
    color: theme.colors.white,
    fontSize: theme.typography.h1,
    fontWeight: '900',
    letterSpacing: 0,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.76)',
    fontSize: theme.typography.body,
    fontWeight: '600',
    lineHeight: 22,
  },
});

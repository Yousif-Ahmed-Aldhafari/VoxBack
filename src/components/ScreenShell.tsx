import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
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
  scrollEnabled?: boolean;
  bounces?: boolean;
  showBack?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  headerStyle?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  subtitleStyle?: StyleProp<TextStyle>;
};

export function ScreenShell({
  title,
  subtitle,
  children,
  scroll = true,
  scrollEnabled = true,
  bounces = false,
  showBack = false,
  contentStyle,
  headerStyle,
  titleStyle,
  subtitleStyle,
}: ScreenShellProps) {
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
        <View style={[styles.header, headerStyle]}>
          <Text style={[styles.title, titleStyle, { textAlign: isRTL ? 'right' : 'left' }]}>{title}</Text>
          {subtitle ? <Text style={[styles.subtitle, subtitleStyle, { textAlign: isRTL ? 'right' : 'left' }]}>{subtitle}</Text> : null}
        </View>
      ) : null}
      {children}
    </>
  );

  return (
    <LinearGradient colors={[theme.colors.ink, '#201f2e', '#141422']} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboard}>
          {scroll ? (
            <ScrollView
              alwaysBounceVertical={bounces}
              bounces={bounces}
              contentContainerStyle={[styles.scrollContent, contentStyle]}
              keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
              keyboardShouldPersistTaps="handled"
              scrollEnabled={scrollEnabled}
              showsVerticalScrollIndicator={false}
              style={styles.scroll}
            >
              {content}
            </ScrollView>
          ) : (
            <View style={[styles.staticContent, contentStyle]}>{content}</View>
          )}
        </KeyboardAvoidingView>
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
  keyboard: {
    flex: 1,
  },
  scroll: {
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

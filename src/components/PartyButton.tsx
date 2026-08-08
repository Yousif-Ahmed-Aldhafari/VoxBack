import type { ComponentType } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { LucideProps } from 'lucide-react-native';

import { theme } from '@/theme';
import { useTranslation } from '@/hooks/useTranslation';
import { useFeedback } from '@/services/FeedbackService';

type ButtonVariant = 'primary' | 'secondary' | 'mint' | 'danger' | 'ghost';

type PartyButtonProps = {
  title: string;
  onPress?: () => void;
  icon?: ComponentType<LucideProps>;
  variant?: ButtonVariant;
  disabled?: boolean;
  compact?: boolean;
};

const variantStyles: Record<ButtonVariant, { backgroundColor: string; color: string; borderColor: string }> = {
  primary: { backgroundColor: theme.colors.coral, color: theme.colors.white, borderColor: theme.colors.coral },
  secondary: { backgroundColor: theme.colors.lemon, color: theme.colors.ink, borderColor: theme.colors.lemon },
  mint: { backgroundColor: theme.colors.mint, color: theme.colors.ink, borderColor: theme.colors.mint },
  danger: { backgroundColor: theme.colors.danger, color: theme.colors.white, borderColor: theme.colors.danger },
  ghost: { backgroundColor: 'rgba(255,255,255,0.08)', color: theme.colors.white, borderColor: 'rgba(255,255,255,0.18)' },
};

export function PartyButton({ title, onPress, icon: Icon, variant = 'primary', disabled = false, compact = false }: PartyButtonProps) {
  const { isRTL } = useTranslation();
  const feedback = useFeedback();
  const colors = variantStyles[variant];
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={() => {
        void feedback('tap');
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.button,
        compact ? styles.compact : null,
        {
          backgroundColor: colors.backgroundColor,
          borderColor: colors.borderColor,
          flexDirection: isRTL ? 'row-reverse' : 'row',
          opacity: disabled ? 0.48 : pressed ? 0.82 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      {Icon ? (
        <View style={styles.icon}>
          <Icon color={colors.color} size={compact ? 17 : 21} strokeWidth={2.8} />
        </View>
      ) : null}
      <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.text, compact ? styles.compactText : null, { color: colors.color }]}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    gap: theme.spacing.sm,
    justifyContent: 'center',
    minHeight: 58,
    paddingHorizontal: theme.spacing.xl,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
  },
  compact: {
    minHeight: 40,
    paddingHorizontal: theme.spacing.md,
  },
  icon: {
    alignItems: 'center',
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  text: {
    fontSize: theme.typography.body,
    fontWeight: '900',
    letterSpacing: 0,
  },
  compactText: {
    fontSize: theme.typography.small,
  },
});

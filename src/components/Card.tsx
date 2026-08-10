import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { theme } from '@/theme';

type CardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  tint?: 'white' | 'warm' | 'dark';
};

export function Card({ children, style, tint = 'white' }: CardProps) {
  return <View style={[styles.card, tint === 'warm' ? styles.warm : tint === 'dark' ? styles.dark : null, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
  },
  warm: {
    backgroundColor: theme.colors.cardTint,
  },
  dark: {
    backgroundColor: theme.colors.inkSoft,
    borderColor: 'rgba(255,255,255,0.1)',
  },
});

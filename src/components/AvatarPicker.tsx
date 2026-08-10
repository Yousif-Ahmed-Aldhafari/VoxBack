import { Pressable, StyleSheet, Text, View } from 'react-native';

import { avatarChoices } from '@/constants/game';
import { theme } from '@/theme';
import { useTranslation } from '@/hooks/useTranslation';

type AvatarPickerProps = {
  label: string;
  value?: string;
  onChange: (avatar: string) => void;
  compact?: boolean;
  dense?: boolean;
};

export function AvatarPicker({ label, value, onChange, compact = false, dense = false }: AvatarPickerProps) {
  const { isRTL } = useTranslation();
  return (
    <View style={[styles.wrap, compact ? styles.compactWrap : null, dense ? styles.denseWrap : null]}>
      <Text style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>{label}</Text>
      <View style={[styles.grid, compact ? styles.compactGrid : null, dense ? styles.denseGrid : null, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        {avatarChoices.map((avatar) => {
          const selected = value === avatar;
          return (
            <Pressable
              accessibilityRole="button"
              key={avatar}
              onPress={() => onChange(avatar)}
              style={({ pressed }) => [
                styles.avatar,
                compact ? styles.compactAvatar : null,
                dense ? styles.denseAvatar : null,
                selected ? styles.selected : null,
                { opacity: pressed ? 0.75 : 1 },
              ]}
            >
              <Text style={[styles.emoji, compact ? styles.compactEmoji : null, dense ? styles.denseEmoji : null]}>{avatar}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: theme.spacing.sm,
  },
  compactWrap: {
    gap: theme.spacing.xs,
  },
  denseWrap: {
    gap: 2,
  },
  label: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.small,
    fontWeight: '900',
  },
  grid: {
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  compactGrid: {
    gap: theme.spacing.xs,
  },
  denseGrid: {
    gap: 2,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: 'rgba(16,16,24,0.06)',
    borderColor: theme.colors.border,
    borderRadius: theme.radius.card,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  compactAvatar: {
    height: 32,
    width: 32,
  },
  denseAvatar: {
    height: 30,
    width: 30,
  },
  selected: {
    backgroundColor: theme.colors.lemon,
    borderColor: theme.colors.ink,
  },
  emoji: {
    fontSize: 24,
  },
  compactEmoji: {
    fontSize: 19,
  },
  denseEmoji: {
    fontSize: 18,
  },
});

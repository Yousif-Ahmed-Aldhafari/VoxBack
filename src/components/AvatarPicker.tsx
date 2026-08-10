import { Pressable, StyleSheet, Text, View } from 'react-native';

import { avatarChoices } from '@/constants/game';
import { theme } from '@/theme';
import { useTranslation } from '@/hooks/useTranslation';

type AvatarPickerProps = {
  label: string;
  value?: string;
  onChange: (avatar: string) => void;
};

export function AvatarPicker({ label, value, onChange }: AvatarPickerProps) {
  const { isRTL } = useTranslation();
  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>{label}</Text>
      <View style={[styles.grid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        {avatarChoices.map((avatar) => {
          const selected = value === avatar;
          return (
            <Pressable
              accessibilityRole="button"
              key={avatar}
              onPress={() => onChange(avatar)}
              style={({ pressed }) => [styles.avatar, selected ? styles.selected : null, { opacity: pressed ? 0.75 : 1 }]}
            >
              <Text style={styles.emoji}>{avatar}</Text>
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
  label: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.small,
    fontWeight: '900',
  },
  grid: {
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
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
  selected: {
    backgroundColor: theme.colors.lemon,
    borderColor: theme.colors.ink,
  },
  emoji: {
    fontSize: 24,
  },
});

import { StyleSheet, Text, TextInput, View } from 'react-native';

import { AvatarPicker } from './AvatarPicker';
import { Card } from './Card';
import { theme } from '@/theme';
import { useTranslation } from '@/hooks/useTranslation';

type PlayerNameCardProps = {
  title: string;
  name: string;
  avatar?: string;
  onNameChange: (name: string) => void;
  onAvatarChange: (avatar: string) => void;
  compact?: boolean;
  dense?: boolean;
};

export function PlayerNameCard({ title, name, avatar, onNameChange, onAvatarChange, compact = false, dense = false }: PlayerNameCardProps) {
  const { isRTL, t } = useTranslation();
  return (
    <Card tint="warm" style={[styles.card, compact ? styles.compactCard : null, dense ? styles.denseCard : null]}>
      <View style={[styles.heading, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <Text style={[styles.avatar, compact ? styles.compactAvatar : null, dense ? styles.denseAvatar : null]}>{avatar}</Text>
        <Text style={[styles.title, { textAlign: isRTL ? 'right' : 'left' }]}>{title}</Text>
      </View>
      <Text style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>{t('playerName')}</Text>
      <TextInput
        blurOnSubmit
        value={name}
        onChangeText={onNameChange}
        placeholder={title}
        placeholderTextColor={theme.colors.textMuted}
        returnKeyType="done"
        style={[styles.input, compact ? styles.compactInput : null, dense ? styles.denseInput : null, { textAlign: isRTL ? 'right' : 'left' }]}
      />
      <AvatarPicker compact={compact} dense={dense} label={t('avatar')} value={avatar} onChange={onAvatarChange} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: theme.spacing.md,
  },
  compactCard: {
    gap: theme.spacing.xs,
    padding: theme.spacing.sm,
  },
  denseCard: {
    gap: 3,
    padding: 6,
  },
  heading: {
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  avatar: {
    fontSize: 28,
  },
  compactAvatar: {
    fontSize: 23,
  },
  denseAvatar: {
    fontSize: 22,
  },
  title: {
    color: theme.colors.ink,
    flex: 1,
    fontSize: theme.typography.h3,
    fontWeight: '900',
  },
  label: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.small,
    fontWeight: '900',
  },
  input: {
    backgroundColor: theme.colors.white,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.card,
    borderWidth: 1,
    color: theme.colors.text,
    fontSize: theme.typography.body,
    fontWeight: '800',
    minHeight: 48,
    paddingHorizontal: theme.spacing.md,
  },
  compactInput: {
    minHeight: 40,
    paddingHorizontal: theme.spacing.sm,
  },
  denseInput: {
    minHeight: 38,
  },
});

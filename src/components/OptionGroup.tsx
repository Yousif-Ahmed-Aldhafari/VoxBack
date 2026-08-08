import { Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '@/theme';
import { useTranslation } from '@/hooks/useTranslation';

type Option<T extends string | number> = {
  label: string;
  value: T;
  description?: string;
};

type OptionGroupProps<T extends string | number> = {
  label: string;
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
};

export function OptionGroup<T extends string | number>({ label, options, value, onChange }: OptionGroupProps<T>) {
  const { isRTL } = useTranslation();
  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>{label}</Text>
      <View style={[styles.options, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              accessibilityRole="button"
              key={String(option.value)}
              onPress={() => onChange(option.value)}
              style={({ pressed }) => [
                styles.option,
                selected ? styles.selected : null,
                { opacity: pressed ? 0.82 : 1 },
              ]}
            >
              <Text style={[styles.optionText, selected ? styles.selectedText : null]}>{option.label}</Text>
              {option.description ? <Text style={styles.description}>{option.description}</Text> : null}
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
    color: theme.colors.white,
    fontSize: theme.typography.body,
    fontWeight: '900',
  },
  options: {
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  option: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(255,255,255,0.16)',
    borderRadius: theme.radius.card,
    borderWidth: 1,
    flexGrow: 1,
    minHeight: 48,
    minWidth: 86,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  selected: {
    backgroundColor: theme.colors.lemon,
    borderColor: theme.colors.lemon,
  },
  optionText: {
    color: theme.colors.white,
    fontSize: theme.typography.body,
    fontWeight: '900',
    textAlign: 'center',
  },
  selectedText: {
    color: theme.colors.ink,
  },
  description: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.small,
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'center',
  },
});

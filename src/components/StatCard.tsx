import { StyleSheet, Text } from 'react-native';

import { Card } from './Card';
import { theme } from '@/theme';
import { useTranslation } from '@/hooks/useTranslation';

type StatCardProps = {
  label: string;
  value: string | number;
};

export function StatCard({ label, value }: StatCardProps) {
  const { isRTL } = useTranslation();
  return (
    <Card style={styles.card}>
      <Text style={[styles.value, { textAlign: isRTL ? 'right' : 'left' }]}>{value}</Text>
      <Text style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 96,
  },
  value: {
    color: theme.colors.ink,
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 0,
  },
  label: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.small,
    fontWeight: '800',
    marginTop: 4,
  },
});

import { View, Text, StyleSheet } from 'react-native';
import { AppColors, Radius } from '@/constants/theme';
import { Alert } from '@/types';

export default function AlertItem({ alert }: { alert: Alert }) {
  const borderColor =
    alert.level === 'error' ? AppColors.warning : alert.level === 'warning' ? AppColors.orange : AppColors.primary;

  return (
    <View style={[styles.container, { borderLeftColor: borderColor }]}>
      <Text style={styles.title}>{alert.title}</Text>
      <Text style={styles.subtitle}>{alert.subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.alert.warning,
    borderLeftWidth: 4,
    padding: 12,
    borderRadius: Radius.md,
    marginBottom: 8,
  },
  title: {
    fontWeight: '500',
    color: AppColors.text.primary,
  },
  subtitle: {
    fontSize: 14,
    color: AppColors.text.secondary,
    marginTop: 2,
  },
});

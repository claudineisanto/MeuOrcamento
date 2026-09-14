import { Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Card from './Card';
import { AppColors } from '@/constants/theme';
import { formatCurrency } from '@/services/storage';

interface BalanceCardProps {
  available: number;
  variation: number;
}

export default function BalanceCard({ available, variation }: BalanceCardProps) {
  const isPositive = variation >= 0;

  let bgColor = AppColors.primary;
  if (available < 200) {
    bgColor = AppColors.warning;
  } else if (available < 500) {
    bgColor = AppColors.orange;
  }

  const dynamicStyle: StyleProp<ViewStyle> = {
    backgroundColor: bgColor,
  };

  return (
    <Card variant="balance" style={dynamicStyle}>
      <Text style={styles.label}>SALDO DISPONÍVEL</Text>
      <Text style={styles.amount}>{formatCurrency(available)}</Text>
      <Text style={styles.variation}>
        {isPositive ? '▲' : '▼'} {Math.abs(variation)}% que mês passado
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  label: {
    color: 'white',
    opacity: 0.9,
    fontSize: 14,
  },
  amount: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  variation: {
    color: 'white',
    opacity: 0.9,
    fontSize: 14,
  },
});

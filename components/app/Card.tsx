import { View, StyleSheet, ViewProps } from 'react-native';
import { AppColors, Radius, Shadow } from '@/constants/theme';
import { ReactNode } from 'react';

interface CardProps extends ViewProps {
  children: ReactNode;
  variant?: 'default' | 'balance' | 'credit' | 'mortgage' | 'stats' | 'debt';
}

export default function Card({ children, variant = 'default', style, ...props }: CardProps) {
  const containerStyle = [
    styles.card,
    variant === 'balance' && styles.balanceCard,
    variant === 'credit' && styles.creditCard,
    variant === 'mortgage' && styles.mortgageCard,
    variant === 'stats' && styles.statsCard,
    variant === 'debt' && styles.debtCard,
    style,
  ];

  return (
    <View style={containerStyle} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: AppColors.card,
    borderRadius: Radius.xl,
    padding: 20,
    marginBottom: 20,
    ...Shadow.card,
  },
  balanceCard: {
    backgroundColor: AppColors.primary,
  },
  creditCard: {
    backgroundColor: AppColors.credit,
  },
  mortgageCard: {
    backgroundColor: AppColors.orange,
  },
  statsCard: {
    backgroundColor: AppColors.alert.stats,
  },
  debtCard: {
    backgroundColor: AppColors.alert.debt,
    borderLeftWidth: 4,
    borderLeftColor: AppColors.warning,
    borderRadius: Radius.md,
  },
});

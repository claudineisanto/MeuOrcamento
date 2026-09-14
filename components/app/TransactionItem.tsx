import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { AppColors, Radius } from '@/constants/theme';
import { Transaction } from '@/types';
import { formatCurrency } from '@/services/storage';

interface TransactionItemProps {
  transaction: Transaction;
  categoryName?: string;
  categoryIcon?: string;
  subcategoryName?: string;
  style?: ViewStyle;
}

export default function TransactionItem({
  transaction,
  categoryName,
  categoryIcon,
  subcategoryName,
  style,
}: TransactionItemProps) {
  const isPositive = transaction.type === 'income';

  return (
    <View style={[styles.container, style]}>
      {categoryIcon ? (
        <View style={styles.iconBox}>
          <Text style={styles.iconText}>{categoryIcon}</Text>
        </View>
      ) : null}
      <View style={{ flex: 1, marginLeft: categoryIcon ? 12 : 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
          {categoryName ? (
            <Text style={styles.categoryTag}>{categoryName}</Text>
          ) : null}
          <Text style={styles.date}>
            {transaction.date}
            {subcategoryName ? ` · ${subcategoryName}` : ''}
          </Text>
        </View>
        <Text style={styles.description} numberOfLines={2}>
          {transaction.description}
        </Text>
      </View>
      <Text style={[styles.amount, isPositive && styles.positive]}>
        {isPositive ? '+' : ''}
        {formatCurrency(transaction.amount)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: Radius.md,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 20,
  },
  categoryTag: {
    fontSize: 11,
    fontWeight: '600',
    color: AppColors.primary,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 8,
  },
  date: {
    color: AppColors.text.tertiary,
    fontSize: 12,
  },
  description: {
    fontWeight: '500',
    color: AppColors.text.primary,
    marginTop: 3,
  },
  amount: {
    fontWeight: 'bold',
    color: AppColors.warning,
  },
  positive: {
    color: AppColors.primary,
  },
});

import { View, Text, StyleSheet } from 'react-native';
import Card from './Card';
import { AppColors } from '@/constants/theme';
import { formatCurrency } from '@/services/storage';

interface DebtSummaryProps {
  creditCards: number;
  creditCardsCount?: number;
  mortgage: number;
  services: number;
  totalExpenses: number;
  hideCreditCards?: boolean;
}

export default function DebtSummary({
  creditCards,
  creditCardsCount = 3,
  mortgage,
  services,
  totalExpenses,
  hideCreditCards = false,
}: DebtSummaryProps) {
  const shownCreditCards = hideCreditCards ? 0 : creditCards;
  const lineTotal = shownCreditCards + mortgage + services;
  const missing = Math.max(0, totalExpenses - lineTotal);
  const total = Math.max(lineTotal, totalExpenses);

  return (
    <Card variant="debt">
      <Text style={styles.title}>💳 COMPROMISSOS DO MÊS</Text>

      {!hideCreditCards && (
        <View style={styles.row}>
          <Text style={styles.label}>Cartões de Crédito ({creditCardsCount})</Text>
          <Text style={styles.value}>{formatCurrency(creditCards)}</Text>
        </View>
      )}

      <View style={styles.row}>
        <Text style={styles.label}>Prestação Casa</Text>
        <Text style={styles.value}>{formatCurrency(mortgage)}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Internet + Serviços</Text>
        <Text style={styles.value}>{formatCurrency(services)}</Text>
      </View>

      {missing > 0 && (
        <View style={styles.row}>
          <Text style={styles.label}>Outras despesas</Text>
          <Text style={styles.value}>{formatCurrency(missing)}</Text>
        </View>
      )}

      <View style={styles.divider} />

      <View style={styles.row}>
        <Text style={styles.totalLabel}>Total Compromissos</Text>
        <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  title: {
    fontWeight: 'bold',
    marginBottom: 10,
    color: AppColors.text.primary,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  label: {
    color: AppColors.text.secondary,
  },
  value: {
    fontWeight: 'bold',
    color: AppColors.warning,
  },
  divider: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#FFCDD2',
  },
  totalLabel: {
    fontWeight: 'bold',
    color: AppColors.text.primary,
  },
  totalValue: {
    fontWeight: 'bold',
    color: AppColors.warning,
    fontSize: 18,
  },
});

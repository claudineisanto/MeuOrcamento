import { View, Text, StyleSheet } from 'react-native';
import { AppColors, Radius } from '@/constants/theme';
import { formatCurrency } from '@/services/storage';
import { Mortgage } from '@/types';

export default function MortgageCard({ mortgage }: { mortgage: Mortgage }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>🏠 Prestação Casa</Text>
        <Text style={styles.installments}>
          Parcela {mortgage.currentInstallment}/{mortgage.totalInstallments}
        </Text>
      </View>
      <Text style={styles.value}>{formatCurrency(mortgage.value)}</Text>
      <View style={styles.info}>
        <Text style={styles.infoText}>Vencimento: {mortgage.dueDate}</Text>
        <Text style={styles.infoText}>Saldo devedor: {formatCurrency(mortgage.outstandingBalance)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.orange,
    borderRadius: Radius.lg,
    padding: 16,
    marginVertical: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  installments: {
    color: 'white',
    fontSize: 14,
  },
  value: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  info: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  infoText: {
    color: 'white',
    fontSize: 14,
    opacity: 0.95,
  },
});

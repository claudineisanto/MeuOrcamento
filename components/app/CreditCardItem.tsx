import { View, Text, StyleSheet } from 'react-native';
import { AppColors, Radius } from '@/constants/theme';
import ProgressBar from './ProgressBar';
import { formatCurrency } from '@/services/storage';
import { CreditCard } from '@/types';

export default function CreditCardItem({ card }: { card: CreditCard }) {
  const progress = card.limit > 0 ? (card.invoiceAmount / card.limit) * 100 : 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.name}>💳 {card.name} - Próxima fatura</Text>
        <View style={styles.flagBadge}>
          <Text style={styles.flagText}>{card.flag}</Text>
        </View>
      </View>
      <Text style={styles.invoice}>{formatCurrency(card.invoiceAmount)}</Text>
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Utilizado: {formatCurrency(card.invoiceAmount)}</Text>
          <Text style={styles.progressLabel}>Limite: {formatCurrency(card.limit)}</Text>
        </View>
        <ProgressBar progress={progress} variant="credit" height={8} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.credit,
    borderRadius: Radius.lg,
    padding: 16,
    marginVertical: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  name: {
    fontWeight: 'bold',
    fontSize: 14,
    color: 'white',
  },
  flagBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  flagText: {
    color: 'white',
    fontSize: 12,
  },
  invoice: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  progressSection: {
    marginTop: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  progressLabel: {
    color: 'white',
    fontSize: 12,
    opacity: 0.9,
  },
});

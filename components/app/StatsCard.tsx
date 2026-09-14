import { View, Text, StyleSheet } from 'react-native';
import Card from './Card';
import { AppColors, Radius } from '@/constants/theme';
import { formatCurrency } from '@/services/storage';

interface Stats {
  averageFixed: number;
  averageVariable: number;
  percentageIncome: number;
  yearlyProjection: number;
}

interface MonthlyComparison {
  month: string;
  value: number;
}

export default function StatsCard({
  stats,
  comparison,
  variation,
}: {
  stats: Stats;
  comparison: MonthlyComparison[];
  variation?: number;
}) {
  return (
    <Card variant="stats">
      <Text style={styles.title}>📊 ANÁLISE DE GASTOS</Text>

      <View style={styles.statsGrid}>
        <View style={styles.statsItem}>
          <Text style={styles.statsLabel}>Média Fixos</Text>
          <Text style={styles.statsNumber}>{formatCurrency(stats.averageFixed)}</Text>
        </View>
        <View style={styles.statsItem}>
          <Text style={styles.statsLabel}>Média Variáveis</Text>
          <Text style={styles.statsNumber}>{formatCurrency(stats.averageVariable)}</Text>
        </View>
        <View style={styles.statsItem}>
          <Text style={styles.statsLabel}>% da Renda</Text>
          <Text style={styles.statsNumber}>{stats.percentageIncome}%</Text>
        </View>
        <View style={styles.statsItem}>
          <Text style={styles.statsLabel}>Projeção Ano</Text>
          <Text style={styles.statsNumber}>{formatCurrency(stats.yearlyProjection)}</Text>
        </View>
      </View>

      <View style={styles.divider}>
        <Text style={styles.comparisonTitle}>Comparativo Mensal</Text>
        <View style={styles.comparisonGrid}>
          {comparison.map((item) => (
            <View key={item.month} style={styles.comparisonItem}>
              <Text style={styles.monthLabel}>{item.month}</Text>
              <Text style={styles.monthValue}>{formatCurrency(item.value)}</Text>
            </View>
          ))}
        </View>
        {variation !== undefined && (
          <Text style={styles.variationText}>
            {variation >= 0 ? '▲' : '▼'} {Math.abs(variation)}% em relação a janeiro
          </Text>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  title: {
    fontWeight: 'bold',
    marginBottom: 15,
    color: AppColors.text.primary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  statsItem: {
    width: '48%',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  statsLabel: {
    fontSize: 12,
    color: AppColors.text.secondary,
  },
  statsNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: AppColors.text.primary,
    marginTop: 5,
  },
  divider: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: AppColors.divider,
  },
  comparisonTitle: {
    fontWeight: '500',
    marginBottom: 10,
    color: AppColors.text.primary,
  },
  comparisonGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  comparisonItem: {
    flex: 1,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  monthLabel: {
    fontSize: 12,
    color: AppColors.text.secondary,
  },
  monthValue: {
    fontWeight: 'bold',
    color: AppColors.text.primary,
    marginTop: 5,
  },
  variationText: {
    color: AppColors.warning,
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
  },
});

import { useCallback, useMemo, useState } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect, Link } from 'expo-router';

import ScreenWrapper from '@/components/app/ScreenWrapper';
import DetailHeader from '@/components/app/DetailHeader';
import Card from '@/components/app/Card';
import ProgressBar from '@/components/app/ProgressBar';
import { SubcategoryList } from '@/components/app/CategoryItem';
import FilterChips, { FilterOption } from '@/components/app/FilterChips';
import TransactionItem from '@/components/app/TransactionItem';
import StatsCard from '@/components/app/StatsCard';
import FAB from '@/components/app/FAB';

import { AppColors } from '@/constants/theme';
import { AppData, Subcategory } from '@/types';
import { getAppData, formatCurrency } from '@/services/storage';

const filters: FilterOption[] = [
  { id: 'mes', label: 'Mês', icon: '📅' },
  { id: 'fixas', label: 'Fixas', icon: '🏠' },
  { id: 'variaveis', label: 'Variáveis', icon: '📊' },
  { id: 'buscar', label: 'Buscar', icon: '🔍' },
];

export default function DetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ categoryId?: string }>();
  const categoryId = params.categoryId || 'moradia';

  const [data, setData] = useState<AppData | null>(null);
  const [activeFilter, setActiveFilter] = useState('mes');

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        const appData = await getAppData();
        setData(appData);
      };
      load();
    }, [])
  );

  const category = useMemo(() => {
    if (!data) return null;
    const expenseCats = data.categories.filter((c) => c.categoryType === 'expense');
    return (
      expenseCats.find((c) => c.id === categoryId) ||
      expenseCats[0] ||
      null
    );
  }, [data, categoryId]);

  const categoryTransactions = useMemo(() => {
    if (!data || !category) return [];
    let list = data.transactions.filter((t) => t.categoryId === category.id);

    if (activeFilter === 'fixas') {
      list = list.filter((t) => t.expenseType === 'fixed');
    } else if (activeFilter === 'variaveis') {
      list = list.filter((t) => t.expenseType === 'variable');
    }
    return list;
  }, [data, category, activeFilter]);

  const getSubcategorySpent = useCallback(
    (subId: string) => {
      if (!data) return 0;
      return data.transactions
        .filter((t) => t.subcategoryId === subId)
        .reduce((sum, t) => sum + t.amount, 0);
    },
    [data]
  );

  const subcategoryMap = useMemo(() => {
    const map = new Map<string, Subcategory>();
    category?.subcategories.forEach((s) => map.set(s.id, s));
    return map;
  }, [category]);

  const transactionsBySubcategory = useMemo(() => {
    const groups = new Map<string, typeof categoryTransactions>();
    categoryTransactions.forEach((t) => {
      const subId = t.subcategoryId || 'outros';
      if (!groups.has(subId)) groups.set(subId, []);
      groups.get(subId)!.push(t);
    });
    return groups;
  }, [categoryTransactions]);

  const stats = useMemo(() => {
    const fixed = categoryTransactions
      .filter((t) => t.expenseType === 'fixed')
      .reduce((s, t) => s + t.amount, 0);
    const variable = categoryTransactions
      .filter((t) => t.expenseType === 'variable')
      .reduce((s, t) => s + t.amount, 0);

    const total = category?.spent || 0;
    const income = data?.summary.income || 1;
    const percentIncome = income > 0 ? Math.round((total / income) * 100) : 0;

    const fixedCount =
      categoryTransactions.filter((t) => t.expenseType === 'fixed').length || 1;
    const varCount =
      categoryTransactions.filter((t) => t.expenseType === 'variable').length || 1;

    return {
      averageFixed: Math.round(fixed / fixedCount),
      averageVariable: Math.round(variable / varCount),
      percentageIncome: percentIncome,
      yearlyProjection: total * 12,
    };
  }, [categoryTransactions, category, data]);

  const comparison = useMemo(() => {
    const total = category?.spent || 0;
    return [
      { month: 'Fev/24', value: total },
      { month: 'Jan/24', value: Math.round(total * 0.9) },
      { month: 'Dez/23', value: Math.round(total * 0.95) },
    ];
  }, [category]);

  if (!data || !category) {
    return (
      <ScreenWrapper>
        <Text style={{ textAlign: 'center', marginTop: 50 }}>Carregando...</Text>
      </ScreenWrapper>
    );
  }

  const budgetProgressPct =
    category.budget > 0
      ? (category.spent / category.budget) * 100
      : category.spent > 0
      ? 100
      : 0;
  const budgetProgress = Math.min(100, budgetProgressPct);
  const isHighBudget =
    category.budget > 0 ? budgetProgress >= 85 : category.spent > 0;
  const hasBudget = category.budget > 0;

  const subcategoryColor = (subId: string) => {
    const palette: Record<string, string> = {
      'prestacao-casa': AppColors.orange,
      internet: AppColors.blue,
      condominio: AppColors.credit,
      luz: AppColors.primary,
      agua: AppColors.primary,
      nubank: AppColors.credit,
      itau: AppColors.blue,
      americanas: AppColors.orange,
      combustivel: AppColors.orange,
      mercado: AppColors.primary,
      restaurante: AppColors.warning,
    };
    return palette[subId] || AppColors.primary;
  };

  return (
    <ScreenWrapper title="DETALHAMENTO">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        <DetailHeader
          title={`${category.name} + Serviços`}
          onBack={() => router.back()}
        />

        <Card>
          <View style={styles.budgetHeader}>
            <Text style={styles.budgetLabel}>
              ORÇAMENTO {category.name.toUpperCase()}
            </Text>
            <View style={[styles.badge, { backgroundColor: AppColors.primary }]}>
              <Text style={styles.badgeText}>
                {hasBudget
                  ? `${budgetProgressPct.toFixed(0)}% utilizado`
                  : category.spent > 0
                  ? `${formatCurrency(category.spent)} gastos`
                  : 'Sem gastos'}
              </Text>
            </View>
          </View>

          <Text style={styles.budgetAmount}>
            {formatCurrency(category.spent)} / {hasBudget ? formatCurrency(category.budget) : 'Sem orçamento'}
          </Text>

          <ProgressBar
            progress={budgetProgress}
            variant={isHighBudget ? 'warning' : 'default'}
          />

          {category.subcategories.length > 0 && (
            <View style={{ marginTop: 15 }}>
              <SubcategoryList
                categoryId={category.id}
                subcategories={category.subcategories}
                parentBudget={category.budget}
                getSubcategorySpent={getSubcategorySpent}
              />
            </View>
          )}
        </Card>

        <FilterChips
          filters={filters}
          activeFilter={activeFilter}
          onSelect={setActiveFilter}
        />

        <Text style={styles.sectionTitle}>LANÇAMENTOS</Text>

        {categoryTransactions.length === 0 ? (
          <Card variant="stats">
            <Text style={styles.emptyText}>
              📝 Nenhum lançamento nesta categoria{'\n'}Toque em Novo Lançamento para começar.
            </Text>
          </Card>
        ) : (
          Array.from(transactionsBySubcategory.entries()).map(
            ([subId, transactions]) => {
              const sub = subcategoryMap.get(subId);
              return (
                <View key={subId} style={{ marginBottom: 15 }}>
                  <Text
                    style={[
                      styles.groupTitle,
                      { color: subcategoryColor(subId) },
                    ]}
                  >
                    {sub?.icon || '📁'}{' '}
                    {(sub?.name || subId || 'Outros').toUpperCase()}
                  </Text>
                  {transactions.map((t) => (
                    <TransactionItem key={t.id} transaction={t} />
                  ))}
                </View>
              );
            }
          )
        )}

        <StatsCard stats={stats} comparison={comparison} variation={10.2} />

        <Link href="/modal" asChild>
          <FAB>+ Novo Lançamento</FAB>
        </Link>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    alignItems: 'center',
  },
  budgetLabel: {
    color: AppColors.text.secondary,
    fontSize: 13,
    fontWeight: '500',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '500',
  },
  budgetAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: AppColors.text.primary,
  },
  sectionTitle: {
    fontWeight: '500',
    marginBottom: 15,
    color: AppColors.text.primary,
  },
  groupTitle: {
    marginBottom: 8,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: AppColors.text.secondary,
    lineHeight: 22,
  },
});

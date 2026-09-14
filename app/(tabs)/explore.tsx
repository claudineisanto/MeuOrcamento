import { useCallback, useMemo, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  RefreshControl,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from 'expo-router';

import ScreenWrapper from '@/components/app/ScreenWrapper';
import Header from '@/components/app/Header';
import Card from '@/components/app/Card';
import ProgressBar from '@/components/app/ProgressBar';
import FilterChips, { FilterOption } from '@/components/app/FilterChips';
import TransactionItem from '@/components/app/TransactionItem';

import { AppColors, Radius } from '@/constants/theme';
import { AppData, Transaction, Category } from '@/types';
import { getAppData, formatCurrency } from '@/services/storage';

type FilterId = 'all' | 'fixed' | 'variable' | Category['id'];

const CAT_COLORS: Record<string, string> = {
  moradia: '#4CAF50',
  cartoes: '#9C27B0',
  transporte: '#FF9800',
  alimentacao: '#2196F3',
  salud: '#E91E63',
  lazer: '#00BCD4',
};

const BASE_FILTERS: FilterOption[] = [
  { id: 'all', label: 'Todos', icon: '📅' },
  { id: 'fixed', label: 'Fixas', icon: '🏠' },
  { id: 'variable', label: 'Variáveis', icon: '📊' },
];

export default function ReportScreen() {
  const [data, setData] = useState<AppData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterId>('all');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    const appData = await getAppData();
    setData(appData);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const expenses = useMemo(() => {
    if (!data) return [] as Transaction[];
    return data.transactions.filter((t) => t && t.type === 'expense');
  }, [data]);

  const totalExpenses = useMemo(
    () => expenses.reduce((s, t) => s + (Number(t.amount) || 0), 0),
    [expenses]
  );
  const income = data ? Number(data.summary?.income) || 0 : 0;
  const goal = data ? Number(data.meta?.monthlyGoal) || 0 : 0;

  const sortedExpenses = useMemo(
    () => [...expenses].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)),
    [expenses]
  );

  const filtered = useMemo(() => {
    let list: Transaction[] = sortedExpenses;
    if (filter === 'fixed') list = list.filter((t) => t.expenseType === 'fixed');
    else if (filter === 'variable') list = list.filter((t) => t.expenseType === 'variable');
    else if (filter !== 'all') list = list.filter((t) => t.categoryId === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((t) => t.description.toLowerCase().includes(q));
    }
    return list;
  }, [sortedExpenses, filter, search]);

  const expenseCats = useMemo(
    () => (data ? data.categories.filter((c) => c.categoryType === 'expense') : []),
    [data]
  );

  const categoryTotals = useMemo(() => {
    if (!data) return [] as { id: string; name: string; icon: string; total: number }[];
    const map = new Map<string, number>();
    for (const t of expenses) {
      const prev = map.get(t.categoryId) || 0;
      map.set(t.categoryId, prev + (Number(t.amount) || 0));
    }
    const rows = expenseCats
      .map((c) => ({
        id: c.id,
        name: c.name,
        icon: c.icon,
        total: map.get(c.id) || 0,
      }))
      .filter((r) => r.total > 0)
      .sort((a, b) => b.total - a.total);
    return rows;
  }, [expenses, data, expenseCats]);

  const maxCategoryTotal = categoryTotals.reduce((m, r) => Math.max(m, r.total), 0) || 1;

  const filterOptions = useMemo<FilterOption[]>(() => {
    if (!data) return BASE_FILTERS;
    const cats: FilterOption[] = expenseCats.map((c) => ({
      id: c.id,
      label: `${c.icon} ${c.name}`,
    }));
    return [...BASE_FILTERS, ...cats];
  }, [data, expenseCats]);

  const fixedTotal = useMemo(
    () =>
      expenses.filter((t) => t.expenseType === 'fixed').reduce(
        (s, t) => s + (Number(t.amount) || 0),
        0
      ),
    [expenses]
  );
  const variableTotal = useMemo(
    () =>
      expenses.filter((t) => t.expenseType === 'variable').reduce(
        (s, t) => s + (Number(t.amount) || 0),
        0
      ),
    [expenses]
  );

  const goalProgressPct = goal > 0 ? Math.min(999, Math.round((totalExpenses / goal) * 100)) : 0;
  const remainingGoal = goal > 0 ? Math.max(0, goal - totalExpenses) : 0;
  const overGoal = goal > 0 ? Math.max(0, totalExpenses - goal) : 0;

  const getCategory = useCallback(
    (id: string) => data?.categories.find((c) => c.id === id),
    [data]
  );
  const getSubcategory = useCallback(
    (catId: string, subId?: string) => {
      const cat = getCategory(catId);
      return cat?.subcategories.find((s) => s.id === subId);
    },
    [getCategory]
  );

  if (!data) {
    return (
      <ScreenWrapper>
        <Text style={{ textAlign: 'center', marginTop: 50 }}>Carregando...</Text>
      </ScreenWrapper>
    );
  }

  const displayName =
    data.profile.userName?.trim() ||
    data.profile.familyName?.trim() ||
    '';

  return (
    <ScreenWrapper title="RELATÓRIO DE GASTOS">
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        <Header
          metaPercentage={data.meta.percentage}
          monthlyGoal={data.meta.monthlyGoal}
          avatar={data.profile.avatar}
          userName={displayName}
        />

        <View style={styles.greeting}>
          <Text style={styles.greetingTitle}>📊 Relatório de Gastos</Text>
          <Text style={styles.greetingSubtitle}>
            {data.profile.month} {data.profile.year} · Visão completa dos lançamentos
          </Text>
        </View>

        <Card variant={overGoal > 0 ? 'debt' : 'stats'}>
          <Text style={styles.summaryTitle}>Resumo do Mês</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total de Gastos</Text>
            <Text style={[styles.summaryValueBig, { color: AppColors.warning }]}>
              {formatCurrency(totalExpenses)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Qtd. lançamentos</Text>
            <Text style={styles.summaryValue}>{expenses.length} despesa(s)</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Fixas</Text>
            <Text style={styles.summaryValue}>{formatCurrency(fixedTotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Variáveis</Text>
            <Text style={styles.summaryValue}>{formatCurrency(variableTotal)}</Text>
          </View>
          {goal > 0 && (
            <>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Meta de gastos</Text>
                <Text style={styles.summaryValue}>{formatCurrency(goal)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  {remainingGoal > 0 ? 'Restam na meta' : 'Estouro da meta'}
                </Text>
                <Text
                  style={[
                    styles.summaryValue,
                    { color: remainingGoal > 0 ? AppColors.primary : AppColors.warning },
                  ]}
                >
                  {remainingGoal > 0
                    ? formatCurrency(remainingGoal)
                    : `-${formatCurrency(overGoal)}`}
                </Text>
              </View>
              <ProgressBar
                progress={goalProgressPct}
                variant={goalProgressPct >= 85 ? 'warning' : 'default'}
              />
            </>
          )}
          {income > 0 && (
            <View style={[styles.summaryRow, { marginTop: 10 }]}>
              <Text style={styles.summaryLabel}>Sobra (receita - gastos)</Text>
              <Text
                style={[styles.summaryValue, { color: AppColors.primary, fontWeight: '700' }]}
              >
                {formatCurrency(Math.max(0, income - totalExpenses))}
              </Text>
            </View>
          )}
        </Card>

        <Card>
          <Text style={styles.chartTitle}>📈 Gastos por Categoria</Text>
          {categoryTotals.length === 0 ? (
            <Text style={styles.emptyHint}>
              Nenhum gasto cadastrado. Toque no botão + do Dashboard para adicionar.
            </Text>
          ) : (
            categoryTotals.map((row) => {
              const pct =
                totalExpenses > 0 ? Math.round((row.total / totalExpenses) * 100) : 0;
              const visualPct = Math.round((row.total / maxCategoryTotal) * 100);
              const color = CAT_COLORS[row.id] || AppColors.primary;
              return (
                <View key={row.id} style={styles.chartRow}>
                  <View style={styles.chartRowHeader}>
                    <Text style={styles.chartRowLabel}>
                      {row.icon} {row.name}
                    </Text>
                    <View style={styles.chartRowRight}>
                      <Text style={styles.chartRowValue}>{formatCurrency(row.total)}</Text>
                      <Text style={styles.chartRowPct}> · {pct}%</Text>
                    </View>
                  </View>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        { width: `${Math.max(visualPct, 2)}%`, backgroundColor: color },
                      ]}
                    />
                  </View>
                </View>
              );
            })
          )}
        </Card>

        <View style={{ marginVertical: 15 }}>
          <TextInput
            style={styles.searchInput}
            placeholder="🔍 Buscar por descrição..."
            placeholderTextColor={AppColors.text.tertiary}
            value={search}
            onChangeText={setSearch}
          />
          <FilterChips
            filters={filterOptions}
            activeFilter={filter}
            onSelect={(id) => setFilter(id as FilterId)}
          />
        </View>

        <Card>
          <Text style={styles.listTitle}>
            📝 {filtered.length > 0 ? `Lançamentos (${filtered.length})` : 'Nenhum lançamento encontrado'}
          </Text>
          {filtered.length === 0 ? (
            <Text style={styles.emptyHint}>
              Tente mudar o filtro ou adicionar um novo lançamento.
            </Text>
          ) : (
            filtered.map((t, idx) => {
              const cat = getCategory(t.categoryId);
              const sub = getSubcategory(t.categoryId, t.subcategoryId);
              return (
                <TransactionItem
                  key={t.id}
                  transaction={t}
                  categoryName={cat?.name || t.categoryId}
                  categoryIcon={cat?.icon || '💸'}
                  subcategoryName={sub?.name}
                  style={idx < filtered.length - 1 ? styles.itemMargin : undefined}
                />
              );
            })
          )}
        </Card>

        {filtered.length > 0 && (
          <TouchableOpacity activeOpacity={0.9}>
            <Card variant="stats">
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total listado</Text>
                <Text style={styles.totalValue}>
                  {formatCurrency(
                    filtered.reduce((s, t) => s + (Number(t.amount) || 0), 0)
                  )}
                </Text>
              </View>
            </Card>
          </TouchableOpacity>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  greeting: {
    marginBottom: 20,
  },
  greetingTitle: {
    fontSize: 20,
    color: AppColors.text.primary,
    fontWeight: '600',
  },
  greetingSubtitle: {
    color: AppColors.text.secondary,
    fontSize: 14,
    marginTop: 2,
  },
  summaryTitle: {
    fontWeight: '700',
    marginBottom: 10,
    color: AppColors.text.primary,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 5,
  },
  summaryLabel: {
    color: AppColors.text.secondary,
    fontSize: 14,
  },
  summaryValue: {
    fontWeight: '600',
    color: AppColors.text.primary,
    fontSize: 14,
  },
  summaryValueBig: {
    fontWeight: '800',
    fontSize: 20,
  },
  chartTitle: {
    fontWeight: '700',
    marginBottom: 12,
    color: AppColors.text.primary,
  },
  chartRow: {
    marginVertical: 8,
  },
  chartRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  chartRowLabel: {
    fontWeight: '600',
    color: AppColors.text.primary,
    fontSize: 14,
  },
  chartRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chartRowValue: {
    fontWeight: '700',
    color: AppColors.text.primary,
    fontSize: 14,
  },
  chartRowPct: {
    fontSize: 12,
    color: AppColors.text.secondary,
  },
  barTrack: {
    width: '100%',
    height: 10,
    borderRadius: 6,
    backgroundColor: AppColors.background,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 6,
  },
  searchInput: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: Radius.md,
    color: AppColors.text.primary,
    borderWidth: 1,
    borderColor: AppColors.divider,
  },
  listTitle: {
    fontWeight: '700',
    marginBottom: 10,
    color: AppColors.text.primary,
  },
  itemMargin: {
    marginBottom: 10,
  },
  emptyHint: {
    color: AppColors.text.tertiary,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    paddingVertical: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontWeight: '700',
    color: AppColors.text.primary,
  },
  totalValue: {
    fontWeight: '800',
    color: AppColors.warning,
    fontSize: 18,
  },
});

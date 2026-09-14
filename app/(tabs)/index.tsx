import { useState, useCallback } from 'react';
import { ScrollView, View, Text, StyleSheet, RefreshControl } from 'react-native';
import { Link, useRouter, useFocusEffect } from 'expo-router';

import ScreenWrapper from '@/components/app/ScreenWrapper';
import Header from '@/components/app/Header';
import BalanceCard from '@/components/app/BalanceCard';
import DebtSummary from '@/components/app/DebtSummary';
import Card from '@/components/app/Card';
import ProgressBar from '@/components/app/ProgressBar';
import CategoryItem, { SubcategoryList } from '@/components/app/CategoryItem';
import MortgageCard from '@/components/app/MortgageCard';
import AlertItem from '@/components/app/AlertItem';
import FAB from '@/components/app/FAB';

import { AppColors } from '@/constants/theme';
import { AppData } from '@/types';
import { getAppData, formatCurrency } from '@/services/storage';

export default function DashboardScreen() {
  const router = useRouter();
  const [data, setData] = useState<AppData | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const appData = await getAppData();
    setData(appData);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  if (!data) {
    return (
      <ScreenWrapper>
        <Text style={{ textAlign: 'center', marginTop: 50 }}>Carregando...</Text>
      </ScreenWrapper>
    );
  }

  const summaryProgress =
    data.summary.income > 0 ? (data.summary.expenses / data.summary.income) * 100 : 0;

  const expenseCategories = (Array.isArray(data.categories) ? data.categories : []).filter(
    (c) => c && typeof c.id === 'string' && c.categoryType === 'expense'
  );

  const getSubcategorySpent = (subcategoryId: string) => {
    return data.transactions
      .filter((t) => t.subcategoryId === subcategoryId)
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const handleCategoryPress = (categoryId: string) => {
    router.push({ pathname: '/detail' as any, params: { categoryId } });
  };

  const displayName =
    data.profile.userName?.trim() ||
    data.profile.familyName?.trim() ||
    '';
  const hasMortgage = data.mortgage.value > 0 || data.mortgage.totalInstallments > 0;
  const maxCategorySpent = expenseCategories.reduce(
    (m, c) => Math.max(m, Number(c.spent) || 0),
    0
  );

  return (
    <ScreenWrapper title="DASHBOARD">
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
          <Text style={styles.greetingTitle}>
            {displayName ? `Olá, ${displayName}!` : 'Olá!'}
          </Text>
          <Text style={styles.greetingSubtitle}>
            {data.profile.month} {data.profile.year}
          </Text>
        </View>

        <BalanceCard available={data.balance.available} variation={data.balance.variation} />

        <DebtSummary
          creditCards={data.commitments.creditCards}
          creditCardsCount={data.creditCards.length}
          mortgage={data.commitments.mortgage}
          services={data.commitments.services}
          totalExpenses={data.summary.expenses}
          hideCreditCards
        />

        <Card>
          <Text style={styles.sectionTitle}>📊 Resumo do Mês</Text>
          <ProgressBar progress={summaryProgress} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryValue}>Receitas {formatCurrency(data.summary.income)}</Text>
            <Text style={styles.summaryValue}>Despesas {formatCurrency(data.summary.expenses)}</Text>
          </View>
        </Card>

        <Text style={[styles.sectionTitle, { marginTop: 15, marginBottom: 15 }]}>CATEGORIAS</Text>

        <Card>
          {expenseCategories.map((category, index) => {
            const variant =
              category.id === 'cartoes'
                ? 'credit'
                : category.budget > 0 && category.spent / category.budget >= 0.85
                ? 'warning'
                : 'default';

            return (
              <View
                key={category.id}
                style={{ marginBottom: index < expenseCategories.length - 1 ? 5 : 0 }}
              >
                <CategoryItem
                  category={category}
                  variant={variant as any}
                  onPress={() => handleCategoryPress(category.id)}
                  referenceMax={maxCategorySpent}
                />
                {category.subcategories.length > 0 && (
                  <SubcategoryList
                    categoryId={category.id}
                    subcategories={category.subcategories}
                    parentBudget={category.budget}
                    getSubcategorySpent={getSubcategorySpent}
                  />
                )}
              </View>
            );
          })}
        </Card>

        {hasMortgage && <MortgageCard mortgage={data.mortgage} />}

        <Text style={[styles.sectionTitle, { marginTop: 15, marginBottom: 15 }]}>⚠️ ALERTAS</Text>

        {data.alerts.length === 0 ? (
          <Card variant="stats">
            <Text style={styles.emptyText}>✅ Sem alertas no momento</Text>
          </Card>
        ) : (
          data.alerts.map((alert) => <AlertItem key={alert.id} alert={alert} />)
        )}

        <Link href="/modal" asChild>
          <FAB>+ Adicionar Lançamento</FAB>
        </Link>
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
    fontWeight: '500',
  },
  greetingSubtitle: {
    color: AppColors.text.secondary,
    fontSize: 14,
    marginTop: 2,
  },
  sectionTitle: {
    fontWeight: '500',
    color: AppColors.text.primary,
    marginBottom: 15,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    fontWeight: '500' as any,
  },
  summaryValue: {
    fontWeight: '500',
    color: AppColors.text.primary,
  },
  emptyText: {
    textAlign: 'center',
    color: AppColors.text.secondary,
  },
});

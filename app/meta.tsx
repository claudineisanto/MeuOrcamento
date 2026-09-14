import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';

import ScreenWrapper from '@/components/app/ScreenWrapper';
import DetailHeader from '@/components/app/DetailHeader';
import Card from '@/components/app/Card';
import ProgressBar from '@/components/app/ProgressBar';

import { AppColors, Radius, Shadow } from '@/constants/theme';
import { AppData } from '@/types';
import { formatCurrency, getAppData, saveAppData } from '@/services/storage';

const formatInputCurrency = (v: number) => {
  if (!v) return '';
  const fixed = v.toFixed(2).replace('.', ',');
  const [intPart, decPart] = fixed.split(',');
  const withThousands = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `R$ ${withThousands},${decPart}`;
};

export default function MetaScreen() {
  const router = useRouter();
  const [data, setData] = useState<AppData | null>(null);
  const [goalText, setGoalText] = useState('');
  const [goalValue, setGoalValue] = useState(0);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        const appData = await getAppData();
        setData(appData);
        const g = Number(appData.meta?.monthlyGoal) || 0;
        setGoalValue(g);
        setGoalText(formatInputCurrency(g));
      };
      load();
    }, [])
  );

  const handleChange = (raw: string) => {
    if (feedback) setFeedback(null);
    const digits = raw.replace(/\D/g, '');
    const cents = digits ? Number(digits) / 100 : 0;
    setGoalValue(cents);
    setGoalText(cents > 0 ? formatInputCurrency(cents) : '');
  };

  const handleSave = async () => {
    if (!data || saving) return;
    try {
      setSaving(true);
      setFeedback(null);
      const newData: AppData = JSON.parse(JSON.stringify(data));
      newData.meta.goalType = 'expenses';
      newData.meta.monthlyGoal = Math.round(goalValue * 100) / 100;
      const expenses = Number(newData.summary?.expenses) || 0;
      if (newData.meta.monthlyGoal > 0) {
        newData.meta.percentage = Math.min(
          999,
          Math.round((expenses / newData.meta.monthlyGoal) * 100)
        );
      } else {
        newData.meta.percentage = 0;
      }
      await saveAppData(newData);
      setData(newData);
      const successMessage = `Meta salva com sucesso. Receita: ${formatCurrency(
        Number(newData.summary?.income) || 0
      )} · Sobra planejada: ${formatCurrency(
        Math.max(0, (Number(newData.summary?.income) || 0) - goalValue)
      )}`;
      if (Platform.OS === 'web') {
        setFeedback({ type: 'success', message: successMessage });
        return;
      }
      Alert.alert(
        'Meta salva',
        `Meta de gastos do mês definida como ${formatCurrency(goalValue)}.\n\nReceita: ${formatCurrency(
          Number(newData.summary?.income) || 0
        )}\nSobra planejada: ${formatCurrency(
          Math.max(0, (Number(newData.summary?.income) || 0) - goalValue)
        )}`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch {
      setFeedback({ type: 'error', message: 'Nao foi possivel salvar a meta.' });
      Alert.alert('Erro', 'Não foi possível salvar a meta.');
    } finally {
      setSaving(false);
    }
  };

  const income = Number(data?.summary?.income) || 0;
  const expenses = Number(data?.summary?.expenses) || 0;
  const goal = goalValue;
  const plannedSave = goal > 0 ? Math.max(0, income - goal) : 0;
  const realSave = Math.max(0, income - expenses);
  const progressPct = goal > 0 ? Math.min(999, Math.round((expenses / goal) * 100)) : 0;
  const remainingBudget = goal > 0 ? Math.max(0, goal - expenses) : 0;
  const overBudget = goal > 0 ? Math.max(0, expenses - goal) : 0;
  const isPositiveSummary = overBudget <= 0;
  let barVariant: 'default' | 'warning' | 'credit' = 'default';
  if (progressPct >= 100) barVariant = 'warning';
  else if (progressPct >= 85) barVariant = 'warning';

  const presetGoals = [1500, 2500, 3500, 5000, 7500, 10000];

  return (
    <ScreenWrapper title="META DE GASTOS">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        <DetailHeader
          title="Meta do Mês"
          onBack={() => router.back()}
          showEdit={false}
        />

        <Card>
          <Text style={styles.sectionTitle}>🎯 Meta de Gastos do Mês</Text>
          <Text style={styles.hint}>
            Defina o VALOR MÁXIMO que você pode gastar neste mês com base na sua receita.
            {'\n'}Ex.: Receita R$ 3.500,00 → Meta de gastos R$ 2.500,00 → sobra planejada R$ 1.000,00.
          </Text>

          {feedback && (
            <View
              style={[
                styles.feedbackBox,
                feedback.type === 'success' ? styles.feedbackSuccess : styles.feedbackError,
              ]}>
              <Text
                style={[
                  styles.feedbackText,
                  feedback.type === 'success' ? styles.feedbackSuccessText : styles.feedbackErrorText,
                ]}>
                {feedback.message}
              </Text>
            </View>
          )}

          <View style={styles.receiptBox}>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>💰 Receita atual do mês</Text>
              <Text style={styles.receiptValue}>{formatCurrency(income)}</Text>
            </View>
            {income > 0 && (
              <Text style={styles.suggestionText}>
                💡 Sugestão de meta:{' '}
                <Text style={styles.suggestionValue}>
                  {formatCurrency(Math.round(income * 0.8 * 100) / 100)}
                </Text>{' '}
                (80% da receita)
              </Text>
            )}
          </View>

          <Text style={styles.label}>Valor máximo permitido de gastos</Text>
          <TextInput
            style={styles.input}
            placeholder="R$ 0,00"
            value={goalText}
            onChangeText={handleChange}
            keyboardType="numeric"
            placeholderTextColor={AppColors.text.tertiary}
          />

          <Text style={styles.label}>Sugestões rápidas</Text>
          <View style={styles.presetsRow}>
            {presetGoals.map((v) => {
              const isActive = Math.abs(goalValue - v) < 0.01;
              return (
                <TouchableOpacity
                  key={v}
                  onPress={() => {
                    setGoalValue(v);
                    setGoalText(formatInputCurrency(v));
                  }}
                  activeOpacity={0.8}
                  style={[
                    styles.presetChip,
                    isActive && { backgroundColor: AppColors.primary, borderColor: AppColors.primary },
                  ]}
                >
                  <Text style={[styles.presetChipText, isActive && { color: 'white' }]}>
                    {formatCurrency(v)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        <Card variant={overBudget > 0 ? 'debt' : 'balance'}>
          <Text
            style={[
              styles.resumoTitle,
              isPositiveSummary && styles.resumoTitleOnBalance,
            ]}>
            📊 Resultado até agora
          </Text>

          <View style={styles.resumoRow}>
            <Text style={[styles.resumoLabel, isPositiveSummary && styles.resumoLabelOnBalance]}>
              Meta de gastos
            </Text>
            <Text
              style={[
                styles.resumoValueStrong,
                isPositiveSummary && styles.resumoValueOnBalance,
              ]}>
              {formatCurrency(goal)}
            </Text>
          </View>
          <View style={styles.resumoRow}>
            <Text style={[styles.resumoLabel, isPositiveSummary && styles.resumoLabelOnBalance]}>
              Receita do mês
            </Text>
            <Text
              style={[
                styles.resumoValue,
                isPositiveSummary ? styles.resumoValueHighlightOnBalance : { color: AppColors.primary },
              ]}>
              {formatCurrency(income)}
            </Text>
          </View>
          <View style={styles.resumoRow}>
            <Text style={[styles.resumoLabel, isPositiveSummary && styles.resumoLabelOnBalance]}>
              Total gasto
            </Text>
            <Text style={[styles.resumoValue, isPositiveSummary && styles.resumoValueOnBalance]}>
              {formatCurrency(expenses)}
            </Text>
          </View>

          {goal > 0 && (
            <>
              {remainingBudget > 0 ? (
                <View style={styles.resumoRow}>
                  <Text style={[styles.resumoLabel, isPositiveSummary && styles.resumoLabelOnBalance]}>
                    ✅ Ainda posso gastar
                  </Text>
                  <Text
                    style={[
                      styles.resumoValue,
                      isPositiveSummary ? styles.resumoValueHighlightOnBalance : { color: AppColors.primary },
                    ]}>
                    {formatCurrency(remainingBudget)}
                  </Text>
                </View>
              ) : (
                <View style={styles.resumoRow}>
                  <Text style={styles.resumoLabel}>⚠️ Estourou a meta</Text>
                  <Text style={[styles.resumoValue, { color: AppColors.warning }]}>
                    -{formatCurrency(overBudget)}
                  </Text>
                </View>
              )}

              <View style={styles.resumoRow}>
                <Text style={[styles.resumoLabel, isPositiveSummary && styles.resumoLabelOnBalance]}>
                  💸 Sobra planejada
                </Text>
                <Text style={[styles.resumoValue, isPositiveSummary && styles.resumoValueOnBalance]}>
                  {formatCurrency(plannedSave)}
                </Text>
              </View>
              <View style={styles.resumoRow}>
                <Text style={[styles.resumoLabel, isPositiveSummary && styles.resumoLabelOnBalance]}>
                  🪙 Sobra real hoje
                </Text>
                <Text
                  style={[
                    styles.resumoValue,
                    isPositiveSummary
                      ? styles.resumoValueHighlightOnBalance
                      : { color: realSave >= plannedSave ? AppColors.primary : AppColors.orange },
                  ]}
                >
                  {formatCurrency(realSave)}
                </Text>
              </View>
            </>
          )}

          <View style={{ marginTop: 14 }}>
            <ProgressBar
              progress={progressPct}
              variant={barVariant}
              fillColor={barVariant === 'warning' ? undefined : AppColors.blue}
              trackColor="rgba(255,255,255,0.35)"
            />
          </View>
          <Text style={styles.progressSubtitle}>
            {goal > 0
              ? `${progressPct}% da meta de gastos utilizada`
              : 'Defina uma meta de gastos para começar'}
          </Text>
        </Card>

        <TouchableOpacity
          style={[styles.saveButton, saving && { opacity: 0.5 }]}
          onPress={handleSave}
          activeOpacity={0.8}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Salvando...' : '💾 Salvar Meta de Gastos'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontWeight: '700',
    marginBottom: 10,
    color: AppColors.text.primary,
    fontSize: 15,
  },
  hint: {
    fontSize: 13,
    color: AppColors.text.tertiary,
    lineHeight: 18,
    marginBottom: 18,
  },
  receiptBox: {
    padding: 14,
    backgroundColor: '#E8F5E9',
    borderRadius: Radius.md,
    marginBottom: 16,
  },
  feedbackBox: {
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  feedbackSuccess: {
    backgroundColor: '#E8F5E9',
    borderColor: '#A5D6A7',
  },
  feedbackError: {
    backgroundColor: '#FFEBEE',
    borderColor: '#EF9A9A',
  },
  feedbackText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  feedbackSuccessText: {
    color: '#2E7D32',
  },
  feedbackErrorText: {
    color: '#C62828',
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiptLabel: {
    fontWeight: '600',
    color: AppColors.primary,
  },
  receiptValue: {
    fontWeight: '700',
    fontSize: 15,
    color: AppColors.primary,
  },
  suggestionText: {
    marginTop: 8,
    fontSize: 12,
    color: AppColors.text.secondary,
  },
  suggestionValue: {
    fontWeight: '700',
    color: AppColors.primary,
  },
  label: {
    fontWeight: '600',
    color: AppColors.text.primary,
    marginTop: 10,
    marginBottom: 8,
  },
  input: {
    backgroundColor: AppColors.background,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: Radius.md,
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.warning,
    borderWidth: 1,
    borderColor: AppColors.divider,
  },
  presetsRow: {
    marginTop: 4,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  presetChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.xxl,
    backgroundColor: AppColors.background,
    borderWidth: 1,
    borderColor: AppColors.divider,
  },
  presetChipText: {
    color: AppColors.text.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  resumoTitle: {
    fontWeight: '700',
    marginBottom: 12,
    color: AppColors.text.primary,
    fontSize: 15,
  },
  resumoTitleOnBalance: {
    color: AppColors.text.inverse,
  },
  resumoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  resumoLabel: {
    color: AppColors.text.secondary,
    fontSize: 14,
  },
  resumoLabelOnBalance: {
    color: 'rgba(255,255,255,0.85)',
  },
  resumoValue: {
    fontWeight: '600',
    color: AppColors.text.primary,
    fontSize: 14,
  },
  resumoValueOnBalance: {
    color: AppColors.text.inverse,
  },
  resumoValueHighlightOnBalance: {
    color: '#E8F5E9',
    fontWeight: '700',
  },
  resumoValueStrong: {
    fontWeight: '700',
    color: AppColors.text.primary,
    fontSize: 16,
  },
  progressSubtitle: {
    marginTop: 8,
    fontSize: 12,
    color: AppColors.text.secondary,
    textAlign: 'center',
  },
  saveButton: {
    marginTop: 10,
    backgroundColor: AppColors.primary,
    paddingVertical: 16,
    borderRadius: Radius.xxl,
    alignItems: 'center',
    ...Shadow.fab,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
});

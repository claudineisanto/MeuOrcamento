import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';

import { AppColors, Radius } from '@/constants/theme';
import { AppData, Category, ExpenseType, TransactionType } from '@/types';
import {
  getAppData,
  saveAppData,
  generateId,
} from '@/services/storage';

export default function AddTransactionModal() {
  const router = useRouter();
  const [data, setData] = useState<AppData | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [type, setType] = useState<TransactionType>('expense');
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [expenseType, setExpenseType] = useState<ExpenseType>('variable');

  const load = useCallback(async (activeType: TransactionType = 'expense') => {
    const appData = await getAppData();
    setData(appData);
    const firstByType = appData.categories.find((c) => c.categoryType === activeType);
    if (firstByType) {
      setCategoryId(firstByType.id);
    } else if (appData.categories.length > 0) {
      setCategoryId(appData.categories[0].id);
    }
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    setDate(`${day}/${month}/${year}`);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const currentCategory = useMemo(
    () => data?.categories.find((c) => c.id === categoryId),
    [data, categoryId]
  );

  const categoryOptions = useMemo(() => {
    if (!data) return [] as Category[];
    return data.categories.filter((c) => c.categoryType === type);
  }, [data, type]);

  useEffect(() => {
    if (!data || categoryOptions.length === 0) return;
    const valid = categoryOptions.some((c) => c.id === categoryId);
    if (!valid) {
      setCategoryId(categoryOptions[0].id);
      setSubcategoryId('');
    }
  }, [type, data, categoryOptions, categoryId]);

  const subcategoryOptions = useMemo(() => {
    return currentCategory?.subcategories || [];
  }, [currentCategory]);

  const handleSave = async () => {
    if (!data || !currentCategory || saving) return;

    const numericAmount = parseFloat(amount.replace(/[^0-9,]/g, '').replace(',', '.'));
    if (isNaN(numericAmount) || numericAmount <= 0) {
      const message = 'Informe um valor valido';
      setFeedback({ type: 'error', message });
      if (Platform.OS !== 'web') {
        Alert.alert('Erro', 'Informe um valor válido');
      }
      return;
    }
    if (!description.trim()) {
      const message = 'Informe uma descricao';
      setFeedback({ type: 'error', message });
      if (Platform.OS !== 'web') {
        Alert.alert('Erro', 'Informe uma descrição');
      }
      return;
    }

    const newData: AppData = JSON.parse(JSON.stringify(data));
    const selectedSub = subcategoryId
      ? currentCategory.subcategories.find((s) => s.id === subcategoryId)
      : null;

    const newTransaction = {
      id: generateId(),
      categoryId,
      subcategoryId: subcategoryId || undefined,
      description: description.trim(),
      amount: numericAmount,
      date,
      type,
      expenseType: type === 'expense' ? expenseType : undefined,
    };

    newData.transactions.push(newTransaction);

    const categoryIndex = newData.categories.findIndex((c) => c.id === categoryId);
    if (type === 'expense') {
      newData.categories[categoryIndex].spent += numericAmount;
      newData.summary.expenses += numericAmount;
      newData.balance.available -= numericAmount;
    } else {
      newData.summary.income += numericAmount;
      newData.balance.available += numericAmount;
    }

    if (categoryId === 'cartoes' && selectedSub && newData.creditCards.length > 0) {
      const cardIdx = newData.creditCards.findIndex((c) => c.id === selectedSub.id);
      if (cardIdx >= 0 && type === 'expense') {
        newData.creditCards[cardIdx].invoiceAmount += numericAmount;
      }
    }

    try {
      setSaving(true);
      setFeedback(null);
      await saveAppData(newData);
      if (Platform.OS === 'web') {
        setFeedback({ type: 'success', message: 'Lancamento adicionado com sucesso.' });
        router.replace('/' as any);
        return;
      }

      Alert.alert('Sucesso', 'Lançamento adicionado!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch {
      setFeedback({ type: 'error', message: 'Nao foi possivel salvar o lancamento.' });
      Alert.alert('Erro', 'Não foi possível salvar o lançamento');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Novo Lançamento</Text>
          <TouchableOpacity onPress={handleSave} activeOpacity={0.7}>
            <Text style={styles.saveText}>Salvar</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
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

          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                type === 'expense' && { backgroundColor: AppColors.warning },
              ]}
              onPress={() => setType('expense')}
              activeOpacity={0.8}
            >
              <Text
                style={[styles.typeButtonText, type === 'expense' && { color: 'white' }]}
              >
                Despesa
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeButton,
                type === 'income' && { backgroundColor: AppColors.primary },
              ]}
              onPress={() => setType('income')}
              activeOpacity={0.8}
            >
              <Text
                style={[styles.typeButtonText, type === 'income' && { color: 'white' }]}
              >
                Receita
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Categoria</Text>
          <View style={styles.optionsGrid}>
            {categoryOptions.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.optionButton,
                  categoryId === cat.id && styles.optionButtonActive,
                ]}
                onPress={() => {
                  setCategoryId(cat.id);
                  setSubcategoryId('');
                }}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 18 }}>{cat.icon}</Text>
                <Text
                  style={[
                    styles.optionLabel,
                    categoryId === cat.id && styles.optionLabelActive,
                  ]}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {subcategoryOptions.length > 0 && (
            <>
              <Text style={styles.label}>Subcategoria</Text>
              <View style={styles.chipGroup}>
                <TouchableOpacity
                  style={[
                    styles.chip,
                    subcategoryId === '' && styles.chipActive,
                  ]}
                  onPress={() => setSubcategoryId('')}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.chipText,
                      subcategoryId === '' && styles.chipTextActive,
                    ]}
                  >
                    Geral
                  </Text>
                </TouchableOpacity>
                {subcategoryOptions.map((sub) => (
                  <TouchableOpacity
                    key={sub.id}
                    style={[
                      styles.chip,
                      subcategoryId === sub.id && styles.chipActive,
                    ]}
                    onPress={() => setSubcategoryId(sub.id)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        subcategoryId === sub.id && styles.chipTextActive,
                      ]}
                    >
                      {sub.icon} {sub.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {type === 'expense' && (
            <>
              <Text style={styles.label}>Tipo de Despesa</Text>
              <View style={styles.row2}>
                <TouchableOpacity
                  style={[
                    styles.expenseButton,
                    expenseType === 'fixed' && styles.expenseButtonActive,
                  ]}
                  onPress={() => setExpenseType('fixed')}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.expenseText,
                      expenseType === 'fixed' && { color: 'white' },
                    ]}
                  >
                    🏠 Fixa
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.expenseButton,
                    expenseType === 'variable' && styles.expenseButtonActive,
                  ]}
                  onPress={() => setExpenseType('variable')}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.expenseText,
                      expenseType === 'variable' && { color: 'white' },
                    ]}
                  >
                    📊 Variável
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          <Text style={styles.label}>Valor (R$)</Text>
          <TextInput
            style={styles.input}
            placeholder="0,00"
            keyboardType="numeric"
            value={amount}
            onChangeText={(text) => {
              const cleaned = text.replace(/[^0-9]/g, '');
              if (cleaned === '') {
                setAmount('');
                return;
              }
              const intValue = parseInt(cleaned, 10);
              const formatted = (intValue / 100).toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
              });
              setAmount(formatted);
            }}
            placeholderTextColor={AppColors.text.tertiary}
          />

          <Text style={styles.label}>Descrição</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex.: Fatura de luz"
            value={description}
            onChangeText={setDescription}
            placeholderTextColor={AppColors.text.tertiary}
          />

          <Text style={styles.label}>Data (DD/MM/AAAA)</Text>
          <TextInput
            style={styles.input}
            placeholder="05/02/2024"
            value={date}
            onChangeText={setDate}
            maxLength={10}
            placeholderTextColor={AppColors.text.tertiary}
          />

          <TouchableOpacity
            style={[styles.saveButton, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            activeOpacity={0.8}
            disabled={saving}>
            <Text style={styles.saveButtonText}>Adicionar Lançamento</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: AppColors.divider,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: AppColors.text.primary,
  },
  cancelText: {
    color: AppColors.text.secondary,
    fontSize: 16,
  },
  saveText: {
    color: AppColors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 25,
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
  },
  feedbackSuccessText: {
    color: '#2E7D32',
  },
  feedbackErrorText: {
    color: '#C62828',
  },
  typeButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: Radius.md,
    backgroundColor: AppColors.border,
    alignItems: 'center',
  },
  typeButtonText: {
    fontWeight: '500',
    color: AppColors.text.primary,
  },
  label: {
    fontWeight: '600',
    color: AppColors.text.primary,
    marginTop: 15,
    marginBottom: 10,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionButton: {
    width: '31%',
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderRadius: Radius.md,
    backgroundColor: 'white',
    alignItems: 'center',
    gap: 6,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionButtonActive: {
    borderColor: AppColors.primary,
    backgroundColor: `${AppColors.primary}15`,
  },
  optionLabel: {
    fontSize: 12,
    color: AppColors.text.secondary,
    textAlign: 'center',
  },
  optionLabelActive: {
    color: AppColors.primary,
    fontWeight: '500',
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.xxl,
    backgroundColor: AppColors.border,
  },
  chipActive: {
    backgroundColor: AppColors.primary,
  },
  chipText: {
    color: AppColors.text.primary,
    fontSize: 13,
  },
  chipTextActive: {
    color: 'white',
    fontWeight: '500',
  },
  row2: {
    flexDirection: 'row',
    gap: 10,
  },
  expenseButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: Radius.md,
    backgroundColor: AppColors.border,
    alignItems: 'center',
  },
  expenseButtonActive: {
    backgroundColor: AppColors.blue,
  },
  expenseText: {
    fontWeight: '500',
    color: AppColors.text.primary,
  },
  input: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: Radius.md,
    fontSize: 16,
    color: AppColors.text.primary,
    borderWidth: 1,
    borderColor: AppColors.divider,
  },
  saveButton: {
    marginTop: 30,
    marginBottom: 30,
    backgroundColor: AppColors.primary,
    paddingVertical: 16,
    borderRadius: Radius.xxl,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

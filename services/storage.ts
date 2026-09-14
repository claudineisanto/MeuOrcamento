import { Platform } from 'react-native';
import * as Crypto from 'expo-crypto';
import * as DocumentPicker from 'expo-document-picker';
import { File as ExpoFile, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { AppData } from '@/types';

const memoryFallback: Record<string, string> = {};

const isWeb = Platform.OS === 'web';
const STORAGE_KEY = isWeb ? '@meu_orcamento_data_web_v2' : '@meu_orcamento_data_v1';
const BACKUP_FILE_PREFIX = 'meu-orcamento-backup';
const BACKUP_VERSION = 1;

const webStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (typeof localStorage === 'undefined') return memoryFallback[key] ?? null;
      return localStorage.getItem(key);
    } catch {
      return memoryFallback[key] ?? null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (typeof localStorage === 'undefined') {
        memoryFallback[key] = value;
        return;
      }
      localStorage.setItem(key, value);
    } catch {
      memoryFallback[key] = value;
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      if (typeof localStorage === 'undefined') {
        delete memoryFallback[key];
        return;
      }
      localStorage.removeItem(key);
    } catch {
      delete memoryFallback[key];
    }
  },
};

let cachedAsyncStorage: any = null;
function getAsyncStorageSafe(): any | null {
  if (cachedAsyncStorage !== null) return cachedAsyncStorage;
  try {
    const mod = require('@react-native-async-storage/async-storage');
    const inst = (mod && mod.default) ? mod.default : mod;
    cachedAsyncStorage = inst && typeof inst.getItem === 'function' ? inst : null;
    return cachedAsyncStorage;
  } catch {
    cachedAsyncStorage = null;
    return null;
  }
}

const nativeStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      const AsyncStorage = getAsyncStorageSafe();
      if (!AsyncStorage) return memoryFallback[key] ?? null;
      const out = await AsyncStorage.getItem(key);
      return out;
    } catch (err) {
      console.warn('Storage nativo indisponível, usando fallback em memória:', err);
      return memoryFallback[key] ?? null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    memoryFallback[key] = value;
    try {
      const AsyncStorage = getAsyncStorageSafe();
      if (!AsyncStorage) return;
      await AsyncStorage.setItem(key, value);
    } catch (err) {
      console.warn('Storage nativo indisponível, persistindo apenas em memória:', err);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    delete memoryFallback[key];
    try {
      const AsyncStorage = getAsyncStorageSafe();
      if (!AsyncStorage) return;
      await AsyncStorage.removeItem(key);
    } catch {
      // fallback em memória já aplicado acima
    }
  },
};

const storageEngine = isWeb ? webStorage : nativeStorage;

const now = new Date();
const monthNames = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const emptyData: AppData = {
  profile: {
    familyName: '',
    month: monthNames[now.getMonth()],
    year: now.getFullYear(),
    userName: '',
    avatar: null,
  },
  security: {
    pinHash: null,
    pinEnabledAt: null,
  },
  balance: {
    available: 0,
    variation: 0,
  },
  summary: {
    income: 0,
    expenses: 0,
  },
  meta: {
    percentage: 0,
    monthlyGoal: 0,
    goalType: 'expenses' as const,
  },
  commitments: {
    creditCards: 0,
    mortgage: 0,
    services: 0,
  },
  categories: [
    {
      id: 'moradia',
      name: 'Moradia',
      icon: '🏠',
      budget: 0,
      spent: 0,
      categoryType: 'expense',
      subcategories: [
        { id: 'prestacao-casa', name: 'Prestação Casa', icon: '🏠', budget: 0, type: 'fixed' },
        { id: 'agua', name: 'Água', icon: '💧', budget: 0, type: 'variable' },
        { id: 'luz', name: 'Luz', icon: '⚡', budget: 0, type: 'variable' },
        { id: 'condominio', name: 'Condomínio', icon: '🏢', budget: 0, type: 'fixed' },
        { id: 'internet', name: 'Internet', icon: '🌐', budget: 0, type: 'fixed' },
      ],
    },
    {
      id: 'cartoes',
      name: 'Cartões de Crédito',
      icon: '💳',
      budget: 0,
      spent: 0,
      categoryType: 'expense',
      subcategories: [],
    },
    {
      id: 'transporte',
      name: 'Transporte',
      icon: '🚗',
      budget: 0,
      spent: 0,
      categoryType: 'expense',
      subcategories: [
        { id: 'combustivel', name: 'Combustível', icon: '⛽', budget: 0, type: 'variable' },
        { id: 'uber', name: 'Uber/Táxi', icon: '🚕', budget: 0, type: 'variable' },
        { id: 'seguro', name: 'Seguro', icon: '🛡️', budget: 0, type: 'fixed' },
      ],
    },
    {
      id: 'alimentacao',
      name: 'Alimentação',
      icon: '🍽️',
      budget: 0,
      spent: 0,
      categoryType: 'expense',
      subcategories: [
        { id: 'mercado', name: 'Mercado', icon: '🛒', budget: 0, type: 'variable' },
        { id: 'restaurante', name: 'Restaurantes', icon: '🍔', budget: 0, type: 'variable' },
        { id: 'lanchonete', name: 'Lanchonetes', icon: '☕', budget: 0, type: 'variable' },
      ],
    },
    {
      id: 'salud',
      name: 'Saúde',
      icon: '🏥',
      budget: 0,
      spent: 0,
      categoryType: 'expense',
      subcategories: [
        { id: 'plano', name: 'Plano de Saúde', icon: '🏥', budget: 0, type: 'fixed' },
        { id: 'farmacia', name: 'Farmácia', icon: '💊', budget: 0, type: 'variable' },
        { id: 'consulta', name: 'Consulta', icon: '🩺', budget: 0, type: 'variable' },
      ],
    },
    {
      id: 'lazer',
      name: 'Lazer',
      icon: '🎮',
      budget: 0,
      spent: 0,
      categoryType: 'expense',
      subcategories: [
        { id: 'streaming', name: 'Streaming', icon: '📺', budget: 0, type: 'fixed' },
        { id: 'outros', name: 'Outros', icon: '🎬', budget: 0, type: 'variable' },
      ],
    },
    {
      id: 'salario',
      name: 'Salário',
      icon: '💼',
      budget: 0,
      spent: 0,
      categoryType: 'income',
      subcategories: [
        { id: 'salario-fixo', name: 'Salário Fixo', icon: '💼' },
        { id: 'hora-extra', name: 'Hora Extra', icon: '⏰' },
        { id: 'vale', name: 'Vale/VR/VA', icon: '🎟️' },
      ],
    },
    {
      id: 'bonus',
      name: 'Bônus & Comissões',
      icon: '🎁',
      budget: 0,
      spent: 0,
      categoryType: 'income',
      subcategories: [
        { id: 'comissao', name: 'Comissão', icon: '💰' },
        { id: 'premiacao', name: 'Premiação', icon: '🏆' },
        { id: 'bonus-13', name: '13º Salário', icon: '🎄' },
      ],
    },
    {
      id: 'freelance',
      name: 'Freelance / PJ',
      icon: '🧑‍💻',
      budget: 0,
      spent: 0,
      categoryType: 'income',
      subcategories: [
        { id: 'projeto', name: 'Projeto', icon: '📋' },
        { id: 'consultoria', name: 'Consultoria', icon: '🎯' },
      ],
    },
    {
      id: 'investimentos',
      name: 'Investimentos',
      icon: '📈',
      budget: 0,
      spent: 0,
      categoryType: 'income',
      subcategories: [
        { id: 'dividendos', name: 'Dividendos', icon: '📊' },
        { id: 'juros', name: 'Juros/CDB', icon: '💵' },
        { id: 'rendimento', name: 'Rendimento', icon: '📈' },
      ],
    },
    {
      id: 'aluguel-recebido',
      name: 'Aluguel Recebido',
      icon: '🏘️',
      budget: 0,
      spent: 0,
      categoryType: 'income',
      subcategories: [
        { id: 'imovel', name: 'Imóvel', icon: '🏠' },
        { id: 'sala', name: 'Sala Comercial', icon: '🏢' },
      ],
    },
    {
      id: 'vendas',
      name: 'Vendas / Revenda',
      icon: '🛍️',
      budget: 0,
      spent: 0,
      categoryType: 'income',
      subcategories: [
        { id: 'produto', name: 'Produtos', icon: '📦' },
        { id: 'servico', name: 'Serviços', icon: '🔧' },
        { id: 'usado', name: 'Usados', icon: '♻️' },
      ],
    },
    {
      id: 'beneficios',
      name: 'Benefícios',
      icon: '🆘',
      budget: 0,
      spent: 0,
      categoryType: 'income',
      subcategories: [
        { id: 'auxilio', name: 'Auxílio Gov.', icon: '🏛️' },
        { id: 'bolsa', name: 'Bolsa', icon: '🎓' },
        { id: 'aposentadoria', name: 'Aposentadoria', icon: '👴' },
      ],
    },
    {
      id: 'outras-receitas',
      name: 'Outras Receitas',
      icon: '💸',
      budget: 0,
      spent: 0,
      categoryType: 'income',
      subcategories: [
        { id: 'presente', name: 'Presente', icon: '🎁' },
        { id: 'heranca', name: 'Herança', icon: '📜' },
        { id: 'reembolso', name: 'Reembolso', icon: '↩️' },
      ],
    },
  ],
  creditCards: [],
  mortgage: {
    id: 'mortgage-1',
    value: 0,
    currentInstallment: 0,
    totalInstallments: 0,
    dueDate: '',
    outstandingBalance: 0,
  },
  transactions: [],
  alerts: [],
};

const SERVICES_SUBIDS = [
  'internet', 'agua', 'luz', 'condominio',
  'streaming', 'plano', 'seguro',
];

function num(n: any): number {
  const v = Number(n);
  return isNaN(v) || !isFinite(v) ? 0 : v;
}

function migrateData(existing: any): AppData {
  const base: AppData = JSON.parse(JSON.stringify(emptyData));

  const merged: any = { ...base, ...existing };

  merged.profile = { ...base.profile, ...(existing?.profile || {}) };
  merged.security = { ...base.security, ...(existing?.security || {}) };
  merged.balance = { ...base.balance, ...(existing?.balance || {}) };
  merged.summary = { ...base.summary, ...(existing?.summary || {}) };
  merged.meta = { ...base.meta, ...(existing?.meta || {}) };
  merged.commitments = { ...base.commitments, ...(existing?.commitments || {}) };
  merged.mortgage = { ...base.mortgage, ...(existing?.mortgage || {}) };
  merged.creditCards = Array.isArray(existing?.creditCards) ? existing.creditCards : [];
  merged.transactions = Array.isArray(existing?.transactions) ? existing.transactions : [];
  merged.alerts = Array.isArray(existing?.alerts) ? existing.alerts : [];

  const existingCats: any[] = Array.isArray(existing?.categories) ? existing.categories : [];
  const existingMap = new Map<string, any>();
  for (const c of existingCats) existingMap.set(c.id, c);

  const finalCategories: any[] = [];
  for (const defCat of base.categories) {
    const user = existingMap.get(defCat.id);
    if (user) {
      const mergedCat: any = {
        id: defCat.id,
        name: user.name ?? defCat.name,
        icon: user.icon ?? defCat.icon,
        budget: num(user.budget),
        spent: num(user.spent),
        categoryType: defCat.categoryType,
        subcategories: [],
      };

      if (!mergedCat.categoryType) {
        mergedCat.categoryType = 'expense';
      }

      const existingSubs: any[] = Array.isArray(user.subcategories) ? user.subcategories : [];
      const subsMap = new Map<string, any>();
      for (const s of existingSubs) subsMap.set(s.id, s);

      for (const defSub of defCat.subcategories) {
        const us = subsMap.get(defSub.id);
        if (us) {
          mergedCat.subcategories.push({
            id: defSub.id,
            name: us.name ?? defSub.name,
            icon: us.icon ?? defSub.icon,
            budget: num(us.budget) || 0,
            type: us.type ?? defSub.type,
          });
        } else {
          mergedCat.subcategories.push({ ...defSub });
        }
      }
      for (const us of existingSubs) {
        if (!defCat.subcategories.some((d) => d.id === us.id)) {
          mergedCat.subcategories.push(us);
        }
      }

      finalCategories.push(mergedCat);
      existingMap.delete(defCat.id);
    } else {
      finalCategories.push({ ...defCat, subcategories: [...defCat.subcategories] });
    }
  }

  for (const legacy of existingMap.values()) {
    const type = (legacy as any).categoryType || 'expense';
    finalCategories.push({
      id: legacy.id,
      name: legacy.name || 'Personalizada',
      icon: legacy.icon || '💡',
      budget: num(legacy.budget),
      spent: num(legacy.spent),
      categoryType: type,
      subcategories: Array.isArray(legacy.subcategories) ? legacy.subcategories : [],
    });
  }

  merged.categories = finalCategories;
  return merged as AppData;
}

export function recalcCommitments(data: AppData): AppData {
  const safe = data || { ...emptyData };
  const txs = Array.isArray(safe.transactions) ? safe.transactions : [];
  const cards = Array.isArray(safe.creditCards) ? safe.creditCards : [];

  const expenses = txs.filter((t) => t && t.type === 'expense');
  const incomes = txs.filter((t) => t && t.type === 'income');

  const totalIncome = incomes.reduce((s, t) => s + num(t.amount), 0);
  const totalExpenses = expenses.reduce((s, t) => s + num(t.amount), 0);
  safe.summary.income = Math.max(num(safe.summary.income), Math.round(totalIncome * 100) / 100);
  safe.summary.expenses = Math.max(num(safe.summary.expenses), Math.round(totalExpenses * 100) / 100);

  if (Array.isArray(safe.categories)) {
    const catMap = new Map<string, number>();
    for (const t of expenses) {
      const prev = catMap.get(t.categoryId) || 0;
      catMap.set(t.categoryId, prev + num(t.amount));
    }
    for (let i = 0; i < safe.categories.length; i++) {
      const fromTxs = Math.round((catMap.get(safe.categories[i].id) || 0) * 100) / 100;
      const existing = num(safe.categories[i].spent);
      safe.categories[i].spent = Math.max(fromTxs, existing);
    }
  }

  const goal = num(safe.meta?.monthlyGoal);
  if (safe.meta) {
    safe.meta.goalType = 'expenses';
    safe.meta.monthlyGoal = goal;
    safe.meta.percentage =
      goal > 0 ? Math.min(999, Math.round((num(safe.summary.expenses) / goal) * 100)) : 0;
  }

  const creditFromTxs = expenses
    .filter((t) => t.categoryId === 'cartoes')
    .reduce((s, t) => s + num(t.amount), 0);
  const creditFromCards = cards.reduce(
    (s, c) => s + num(c.invoiceAmount),
    0
  );
  const creditCardsSum = Math.max(creditFromTxs, creditFromCards);

  const mortgageFromTxs = expenses
    .filter((t) => t.subcategoryId === 'prestacao-casa')
    .reduce((s, t) => s + num(t.amount), 0);
  const mortgageSum = Math.max(mortgageFromTxs, num(safe.mortgage?.value));

  const servicesSum = expenses
    .filter((t) => SERVICES_SUBIDS.includes(t.subcategoryId || ''))
    .reduce((s, t) => s + num(t.amount), 0);

  const totalAllExpenses = expenses.reduce((s, t) => s + num(t.amount), 0);

  if (!safe.summary) safe.summary = { income: 0, expenses: 0 };

  if (totalAllExpenses > 0) {
    safe.summary.expenses = Math.max(num(safe.summary.expenses), Math.round(totalAllExpenses * 100) / 100);
  } else if (!safe.summary.expenses) {
    safe.summary.expenses = 0;
  }

  const otherExpenses = Math.max(
    0,
    num(safe.summary?.expenses) - creditCardsSum - mortgageSum - servicesSum
  );

  safe.commitments = {
    creditCards: Math.round(creditCardsSum * 100) / 100,
    mortgage: Math.round(mortgageSum * 100) / 100,
    services: Math.round((servicesSum + otherExpenses) * 100) / 100,
  };

  return safe;
}

export async function getAppData(): Promise<AppData> {
  try {
    const json = await storageEngine.getItem(STORAGE_KEY);
    if (json) {
      const parsed = JSON.parse(json);
      const migrated = migrateData(parsed);
      const withCalc = recalcCommitments(migrated);
      await storageEngine.setItem(STORAGE_KEY, JSON.stringify(withCalc)).catch(() => {});
      return withCalc;
    }
    const seed = recalcCommitments(migrateData(emptyData));
    await saveAppData(seed);
    return seed;
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
    return recalcCommitments(migrateData(emptyData));
  }
}

function sanitizeBackupPayload(payload: any): AppData {
  if (payload?.data) {
    return recalcCommitments(migrateData(payload.data));
  }
  return recalcCommitments(migrateData(payload));
}

function getBackupFileName(): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${BACKUP_FILE_PREFIX}-${stamp}.json`;
}

function triggerWebDownload(fileName: string, contents: string): void {
  if (typeof document === 'undefined') {
    throw new Error('Download indisponivel neste ambiente.');
  }

  const blob = new Blob([contents], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

async function readWebBackupFile(): Promise<string | null> {
  if (typeof document === 'undefined') return null;

  return await new Promise<string | null>((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.style.display = 'none';

    input.onchange = async () => {
      const file = input.files?.[0];
      document.body.removeChild(input);

      if (!file) {
        resolve(null);
        return;
      }

      try {
        resolve(await file.text());
      } catch (error) {
        reject(error);
      }
    };

    input.onerror = () => {
      document.body.removeChild(input);
      reject(new Error('Nao foi possivel ler o arquivo selecionado.'));
    };

    document.body.appendChild(input);
    input.click();
  });
}

export async function hashPin(pin: string): Promise<string> {
  const normalized = pin.replace(/\D/g, '').trim();
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `meu-orcamento::${normalized}`
  );
}

export async function verifyAppPin(pin: string): Promise<boolean> {
  const data = await getAppData();
  const storedHash = data.security?.pinHash;
  if (!storedHash) return true;
  return storedHash === await hashPin(pin);
}

export function createBackupJson(data: AppData): string {
  return JSON.stringify(
    {
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      data,
    },
    null,
    2
  );
}

export async function exportBackupFile(data?: AppData): Promise<string> {
  const sourceData = data ? recalcCommitments(migrateData(data)) : await getAppData();
  const contents = createBackupJson(sourceData);
  const fileName = getBackupFileName();

  if (isWeb) {
    triggerWebDownload(fileName, contents);
    return fileName;
  }

  const file = new ExpoFile(Paths.cache, fileName);
  if (file.exists) {
    file.delete();
  }
  file.create();
  await file.write(contents);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/json',
      dialogTitle: 'Exportar backup do Meu Orçamento',
      UTI: 'public.json',
    });
  }

  return file.uri;
}

export async function importBackupFile(): Promise<AppData | null> {
  if (isWeb) {
    const raw = await readWebBackupFile();
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const imported = sanitizeBackupPayload(parsed);
    await saveAppData(imported);
    return imported;
  }

  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (result.canceled || !result.assets?.[0]?.uri) {
    return null;
  }

  const file = new ExpoFile(result.assets[0].uri);
  const text = await file.text();
  const parsed = JSON.parse(text);
  const imported = sanitizeBackupPayload(parsed);
  await saveAppData(imported);
  return imported;
}

export async function saveAppData(data: AppData): Promise<void> {
  try {
    const migrated = migrateData(data);
    const toSave = recalcCommitments(migrated);
    const json = JSON.stringify(toSave);
    await storageEngine.setItem(STORAGE_KEY, json);
  } catch (error) {
    console.error('Erro ao salvar dados:', error);
    throw error;
  }
}

export async function resetAppData(): Promise<AppData> {
  const seed = recalcCommitments(migrateData(emptyData));
  await saveAppData(seed);
  return seed;
}

export function formatCurrency(value: number): string {
  const num = Number(value) || 0;
  return num.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  });
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

export type TransactionType = 'income' | 'expense';

export type ExpenseType = 'fixed' | 'variable';

export interface Subcategory {
  id: string;
  name: string;
  icon: string;
  budget?: number;
  type?: ExpenseType;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  budget: number;
  spent: number;
  subcategories: Subcategory[];
  categoryType: TransactionType;
}

export interface CreditCard {
  id: string;
  name: string;
  flag: string;
  invoiceAmount: number;
  limit: number;
  dueDate: string;
}

export interface Mortgage {
  id: string;
  value: number;
  currentInstallment: number;
  totalInstallments: number;
  dueDate: string;
  outstandingBalance: number;
}

export interface Transaction {
  id: string;
  categoryId: string;
  subcategoryId?: string;
  description: string;
  amount: number;
  date: string;
  type: TransactionType;
  expenseType?: ExpenseType;
}

export interface Alert {
  id: string;
  title: string;
  subtitle: string;
  level: 'error' | 'warning' | 'info';
}

export interface AppData {
  profile: {
    familyName: string;
    month: string;
    year: number;
    userName: string;
    avatar: string | null;
  };
  security: {
    pinHash: string | null;
    pinEnabledAt: string | null;
  };
  balance: {
    available: number;
    variation: number;
  };
  summary: {
    income: number;
    expenses: number;
  };
  meta: {
    percentage: number;
    monthlyGoal: number;
    goalType: 'expenses';
  };
  categories: Category[];
  creditCards: CreditCard[];
  mortgage: Mortgage;
  transactions: Transaction[];
  alerts: Alert[];
  commitments: {
    creditCards: number;
    mortgage: number;
    services: number;
  };
}

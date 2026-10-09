export type TransactionType = 'expense' | 'income';

export type ExpenseCategory = string;

export type IncomeCategory = string;

export type PaymentMode = 'UPI (GPay/PhonePe)' | 'Cash' | 'Bank Transfer' | 'Card';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: ExpenseCategory | IncomeCategory;
  note: string;
  date: string; // ISO date YYYY-MM-DD
  time?: string;
  paymentMode: PaymentMode;
  tags?: string[];
  createdAt: number;
}

export type LoanType = 'lent' | 'borrowed'; // lent = I gave money (they owe me); borrowed = I took money (I owe them)

export interface LoanPayment {
  id: string;
  amount: number;
  date: string;
  note?: string;
}

export interface LoanItem {
  id: string;
  type: LoanType;
  personName: string;
  personContact?: string;
  originalAmount: number;
  dateTaken: string;
  dueDate: string;
  note: string;
  payments: LoanPayment[]; // Partial repayments
  isSettled: boolean;
  settledAt?: string;
  createdAt: number;
}

export interface BudgetConfig {
  monthlyTarget: number; // e.g. 7000
  categories: {
    [category: string]: number; // allocated amount
  };
  months?: Record<string, { monthlyTarget: number; categories: Record<string, number> }>;
  priorities?: PrioritySpend[];
  notes?: BudgetNote[];
}

export interface PrioritySpend {
  id: string;
  month: string;
  title: string;
  amount: number;
  category: string;
  priority: 'Must have' | 'Important' | 'Can wait';
  paidTransactionId?: string;
}

export interface BudgetNote {
  id: string;
  month: string;
  text: string;
  pinned: boolean;
}

export interface UserSettings {
  currency: string;
  currencySymbol: string;
  userName: string;
  monthlyAllowance: number;
  soundEnabled: boolean;
  theme?: 'light' | 'dark';
}

export interface AlertItem {
  id: string;
  type: 'danger' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  actionLabel?: string;
  date: string;
}


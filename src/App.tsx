import React, { useState, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { localDate, monthBudget } from './utils/dates';
import { Navbar } from './components/Navbar';
import { Overview } from './components/Overview';
import { TransactionList } from './components/Transactions/TransactionList';
import { TransactionModal } from './components/Transactions/TransactionModal';
import { UdhaarTracker } from './components/LendBorrow/UdhaarTracker';
import { AddLoanModal } from './components/LendBorrow/AddLoanModal';
import { PaymentModal } from './components/LendBorrow/PaymentModal';
import { CalculatorsHub } from './components/Calculator/CalculatorsHub';
import { BudgetPlanner } from './components/Budget/BudgetPlanner';
import { SettingsModal } from './components/Settings/SettingsModal';
import { AlertCenter } from './components/Alerts/AlertCenter';

import {
  Transaction,
  LoanItem,
  BudgetConfig,
  UserSettings,
  TransactionType,
  LoanType,
  ExpenseCategory,
  IncomeCategory,
  PrioritySpend,
} from './types/finance';
import { emptySnapshot, parseBackup, exportBackup } from './utils/storage';
import { validMoney, validDate, type Snapshot } from '../shared/finance.mjs';
import { calculateStats, generateAlerts } from './utils/calculations';
import { sound } from './utils/sound';

interface AppProps {
  initialData: Snapshot; onChange: (data: Snapshot) => void;
  saveStatus: string; saveError: string; onRetry: () => void;
  onLogout: () => Promise<void>; onDeleteProfile: (password: string) => Promise<void>; username: string;
}
export function App({ initialData, onChange, saveStatus, saveError, onRetry, onLogout, onDeleteProfile, username }: AppProps) {
  // Core persistent states
  const [transactions, setTransactions] = useState<Transaction[]>(initialData.transactions);
  const [loans, setLoans] = useState<LoanItem[]>(initialData.loans);
  const [budget, setBudget] = useState<BudgetConfig>(initialData.budget);
  const [settings, setSettings] = useState<UserSettings>(initialData.settings);
  useLayoutEffect(() => {
    document.documentElement.dataset.theme = settings.theme || 'light';
  }, [settings.theme]);

  const [selectedMonth, setSelectedMonth] = useState(() => localDate().slice(0, 7));
  const [calendarDate, setCalendarDate] = useState(() => localDate());
  useEffect(() => {
    const update = () => setCalendarDate(localDate());
    const interval = window.setInterval(update, 60000);
    document.addEventListener('visibilitychange', update);
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', update); };
  }, []);
  const selectedBudget = useMemo(() => monthBudget(budget, selectedMonth), [budget, selectedMonth]);
  const reserved = (budget.priorities || []).filter(p => p.month === selectedMonth && !p.paidTransactionId).reduce((sum, p) => sum + p.amount, 0);
  const referenceDate = useMemo(() => selectedMonth === calendarDate.slice(0, 7)
    ? new Date(calendarDate + 'T12:00:00')
    : new Date(Number(selectedMonth.slice(0, 4)), Number(selectedMonth.slice(5)) - 1,
      selectedMonth < calendarDate.slice(0, 7) ? new Date(Number(selectedMonth.slice(0, 4)), Number(selectedMonth.slice(5)), 0).getDate() : 1), [selectedMonth, calendarDate]);
  const saveMonthBudget = (next: BudgetConfig) => setBudget(previous => ({
    ...previous, months: { ...previous.months, [selectedMonth]: { monthlyTarget: next.monthlyTarget, categories: next.categories } },
  }));

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [calculatorSubTab, setCalculatorSubTab] = useState<string>('smart-note');

  // Dismissed alert IDs
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);

  // Modals state
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txModalDefaults, setTxModalDefaults] = useState<{
    type: TransactionType;
    amount?: number;
    note?: string;
    category?: ExpenseCategory | IncomeCategory;
  }>({ type: 'expense' });

  const [isAddLoanModalOpen, setIsAddLoanModalOpen] = useState(false);
  const [addLoanDefaultType, setAddLoanDefaultType] = useState<LoanType>('lent');

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedLoanForPayment, setSelectedLoanForPayment] = useState<LoanItem | null>(null);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAlertsDrawerOpen, setIsAlertsDrawerOpen] = useState(false);

  // Sync sound settings with audio manager
  useEffect(() => {
    sound.enabled = settings.soundEnabled;
  }, [settings.soundEnabled]);

  const previousSnapshot = useRef(JSON.stringify(initialData));
  useEffect(() => {
    const snapshot = { transactions, loans, budget, settings };
    const json = JSON.stringify(snapshot);
    if (json !== previousSnapshot.current) { previousSnapshot.current = json; onChange(snapshot); }
  }, [transactions, loans, budget, settings, onChange]);

  // Derived financial computations
  const stats = useMemo(() => {
    return calculateStats(transactions, loans, selectedBudget, referenceDate, reserved);
  }, [transactions, loans, selectedBudget, referenceDate, reserved]);

  const rawAlerts = useMemo(() => {
    return selectedMonth === calendarDate.slice(0, 7) && stats.monthlyTarget > 0 ? generateAlerts(stats, loans) : [];
  }, [stats, loans, selectedMonth, calendarDate]);

  const activeAlerts = useMemo(() => {
    return rawAlerts.filter((a) => !dismissedAlerts.includes(a.id));
  }, [rawAlerts, dismissedAlerts]);


  // --- Handlers ---

  const handleToggleSound = () => {
    const updated = !settings.soundEnabled;
    sound.enabled = updated;
    if (updated) sound.click();
    setSettings((prev) => ({ ...prev, soundEnabled: updated }));
  };

  const handleOpenAddTx = (
    type: TransactionType = 'expense',
    amount?: number,
    note?: string,
    category?: ExpenseCategory | IncomeCategory
  ) => {
    setTxModalDefaults({ type, amount, note, category });
    setIsTxModalOpen(true);
  };

  const handleSaveTx = (txData: Omit<Transaction, 'id' | 'createdAt'>) => {
    if (!Number.isFinite(txData.amount) || txData.amount <= 0 || !txData.category.trim()) return;
    const newTx: Transaction = {
      ...txData,
      id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: Date.now(),
    };
    setTransactions((prev) => [newTx, ...prev]);
  };

  const handleDeleteTx = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    setBudget(prev => ({ ...prev, priorities: (prev.priorities || []).map(p => p.paidTransactionId === id ? { ...p, paidTransactionId: undefined } : p) }));
  };

  const handlePayPriority = (item: PrioritySpend) => {
    if (item.paidTransactionId || item.month !== localDate().slice(0, 7)) return;
    const transactionId = crypto.randomUUID();
    setTransactions(prev => [...prev, { id: transactionId, type: 'expense', amount: item.amount, category: item.category, note: item.title, date: localDate(), paymentMode: 'UPI (GPay/PhonePe)', createdAt: Date.now() }]);
    setBudget(prev => ({ ...prev, priorities: (prev.priorities || []).map(p => p.id === item.id ? { ...p, paidTransactionId: transactionId } : p) }));
  };

  const handleOpenAddLoan = (type: LoanType = 'lent') => {
    setAddLoanDefaultType(type);
    setIsAddLoanModalOpen(true);
  };

  const handleSaveLoan = (loanData: {
    type: LoanType;
    personName: string;
    personContact?: string;
    originalAmount: number;
    dateTaken: string;
    dueDate: string;
    note: string;
  }) => {
    if (!validMoney(loanData.originalAmount) || loanData.originalAmount <= 0 || !loanData.personName.trim() || !validDate(loanData.dateTaken) || !validDate(loanData.dueDate)) return;
    const newLoan: LoanItem = {
      ...loanData,
      id: `loan-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      payments: [],
      isSettled: false,
      createdAt: Date.now(),
    };
    setLoans((prev) => [newLoan, ...prev]);
  };

  const handleOpenPaymentModal = (loan: LoanItem) => {
    setSelectedLoanForPayment(loan);
    setIsPaymentModalOpen(true);
  };

  const handleAddRepayment = (
    loanId: string,
    payment: { amount: number; date: string; note?: string }
  ) => {
    if (!validMoney(payment.amount) || payment.amount <= 0 || !validDate(payment.date)) return;
    setLoans((prev) =>
      prev.map((l) => {
        if (l.id !== loanId || l.isSettled || payment.amount > Math.round((l.originalAmount - l.payments.reduce((sum, p) => sum + p.amount, 0)) * 100) / 100) return l;
        const newPayments = [
          ...(l.payments || []),
          {
            id: `pay-${Date.now()}`,
            amount: payment.amount,
            date: payment.date,
            note: payment.note,
          },
        ];
        const totalPaid = newPayments.reduce((s, p) => s + p.amount, 0);
        const isSettled = totalPaid >= l.originalAmount;
        return {
          ...l,
          payments: newPayments,
          isSettled,
          settledAt: isSettled ? payment.date : l.settledAt,
        };
      })
    );
  };

  const handleSettleLoan = (loanId: string) => {
    setLoans((prev) =>
      prev.map((l) => {
        if (l.id !== loanId) return l;
        const paidSoFar = (l.payments || []).reduce((s, p) => s + p.amount, 0);
        const rem = l.originalAmount - paidSoFar;
        const autoPayment =
          rem > 0
            ? [
                ...(l.payments || []),
                {
                  id: `pay-${Date.now()}`,
                  amount: rem,
                  date: localDate(),
                  note: 'Full settlement',
                },
              ]
            : l.payments;

        return {
          ...l,
          payments: autoPayment,
          isSettled: true,
          settledAt: localDate(),
        };
      })
    );
  };

  const handleDeleteLoan = (loanId: string) => {
    setLoans((prev) => prev.filter((l) => l.id !== loanId));
  };

  const handleAddMultipleLentLoans = (
    records: { personName: string; amount: number; note: string; dueDate: string }[]
  ) => {
    if (records.some(r => !validMoney(r.amount) || r.amount <= 0 || !r.personName.trim() || !validDate(r.dueDate))) return;
    const todayStr = localDate();
    const newItems: LoanItem[] = records.map((r, i) => ({
      id: `loan-split-${Date.now()}-${i}`,
      type: 'lent',
      personName: r.personName,
      originalAmount: r.amount,
      dateTaken: todayStr,
      dueDate: r.dueDate,
      note: r.note,
      payments: [],
      isSettled: false,
      createdAt: Date.now() + i,
    }));
    setLoans((prev) => [...newItems, ...prev]);
  };

  const handleQuickAddExpenseFromCalc = (
    amount: number,
    note: string,
    _category: ExpenseCategory = 'Other'
  ) => {
    handleOpenAddTx('expense', amount, note);
  };

  const handleExportData = () => {
    const jsonStr = exportBackup({ transactions, loans, budget, settings });
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `paisapilot_backup_${localDate()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (jsonStr: string) => {
    try {
      const restored = parseBackup(jsonStr);
      setTransactions(restored.transactions);
      setLoans(restored.loans);
      setBudget(restored.budget);
      setSettings({ ...restored.settings, userName: settings.userName });
      return true;
    } catch { return false; }
  };

  const handleClearData = () => {
    const empty = emptySnapshot(settings.userName);
    setTransactions(empty.transactions);
    setLoans(empty.loans);
    setBudget(empty.budget);
    sound.click();
  };

  const handleDismissAlert = (alertId: string) => {
    setDismissedAlerts((prev) => [...prev, alertId]);
  };

  const handleNavigateFromComponent = (destination: string) => {
    if (destination === 'ai') {
      setActiveTab('budget');
    } else if (destination === 'udhaar') {
      setActiveTab('udhaar');
    } else if (destination === 'calculator') {
      setActiveTab('calculator');
      setCalculatorSubTab('smart-note');
    } else if (destination === 'split') {
      setActiveTab('calculator');
      setCalculatorSubTab('split');
    } else if (destination === 'whatif') {
      setActiveTab('calculator');
      setCalculatorSubTab('whatif');
    } else {
      setActiveTab(destination);
    }
  };

  return (
    <div className="app-shell">
      <a href="#main" className="skip-link">Skip to content</a>
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        soundEnabled={settings.soundEnabled}
        onToggleSound={handleToggleSound}
        theme={settings.theme || 'light'}
        onToggleTheme={() => setSettings(prev => ({ ...prev, theme: prev.theme === 'dark' ? 'light' : 'dark' }))}
        alertCount={activeAlerts.length}
        onOpenAlerts={() => setIsAlertsDrawerOpen(!isAlertsDrawerOpen)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        saveStatus={saveStatus}
        onLogout={onLogout}
      />

      {/* Main Container */}
      <div className="workspace">
      <header className="workspace-header"><div className="breadcrumb">My workspace <span>/</span> {activeTab === 'overview' ? 'Dashboard' : activeTab === 'transactions' ? 'Spending history' : activeTab === 'budget' ? 'Monthly budget' : activeTab === 'calculator' ? 'Calculators' : 'Lend & borrow'}</div><button className="profile-button" onClick={() => setIsSettingsOpen(true)} aria-label="Open profile settings"><span>{settings.userName.slice(0, 1).toUpperCase()}</span>{settings.userName}</button></header>
      <main id="main" className="workspace-main">
      <div className="page-heading"><div><span className="eyebrow">A LITTLE MORE INTENTIONAL, EVERY DAY</span><h1>{activeTab === 'overview' ? 'Your money, at a glance.' : activeTab === 'budget' ? 'Give your month a plan.' : activeTab === 'transactions' ? 'Every rupee has a story.' : activeTab === 'calculator' ? 'Work out the numbers.' : 'Keep your balances clear.'}</h1><p>{activeTab === 'overview' ? 'A simple space for your pocket money, plans, and everyday spending.' : 'Make it yours. Keep it simple.'}</p></div><div className="page-actions"><div className="month-picker"><button className="icon-button" aria-label="Previous month" onClick={() => { const d = new Date(selectedMonth + '-01T12:00:00'); d.setMonth(d.getMonth() - 1); setSelectedMonth(localDate(d).slice(0, 7)); }}><ChevronLeft size={16}/></button><label className="sr-only" htmlFor="selected-month">Selected month</label><input id="selected-month" type="month" min="1900-01" max="2100-12" value={selectedMonth} onChange={e => { if (/^\d{4}-(0[1-9]|1[0-2])$/.test(e.target.value)) setSelectedMonth(e.target.value); }}/><button className="icon-button" aria-label="Next month" onClick={() => { const d = new Date(selectedMonth + '-01T12:00:00'); d.setMonth(d.getMonth() + 1); setSelectedMonth(localDate(d).slice(0, 7)); }}><ChevronRight size={16}/></button></div><button className="secondary-button" onClick={() => handleOpenAddTx('income')}><Plus size={17}/>Add money received</button><button className="primary-button" onClick={() => handleOpenAddTx('expense')}><Plus size={17}/>Add expense</button></div></div>
      {saveError && <div className="inline-warning" role="alert"><span>{saveError} Export a backup from Settings before closing.</span><button className="secondary-button" onClick={onRetry}>Retry saving</button></div>}
        {/* Alerts Center Drawer / Banner */}
        {isAlertsDrawerOpen && (
          <div className="animate-fade-in">
            <AlertCenter
              alerts={activeAlerts}
              onDismiss={handleDismissAlert}
              onNavigateToTab={handleNavigateFromComponent}
            />
          </div>
        )}

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <Overview
            stats={stats}
            transactions={transactions}
            userName={settings.userName}
            currencySymbol={settings.currencySymbol}
            onOpenAddModal={(type) => handleOpenAddTx(type || 'expense')}
            budget={selectedBudget}
            month={selectedMonth}
            today={calendarDate}
            onPrioritiesChange={priorities => setBudget(prev => ({ ...prev, priorities }))}
            onNotesChange={notes => setBudget(prev => ({ ...prev, notes }))}
            onPayPriority={handlePayPriority}
            onNavigateToTab={handleNavigateFromComponent}
          />
        )}

        {/* Tab 2: Transactions */}
        {activeTab === 'transactions' && (
          <TransactionList
            transactions={transactions.filter(tx => tx.date.startsWith(selectedMonth))}
            onOpenAddModal={handleOpenAddTx}
            onDeleteTransaction={handleDeleteTx}
            currencySymbol={settings.currencySymbol}
          />
        )}

        {/* Tab 3: Udhaar & Debts */}
        {activeTab === 'udhaar' && (
          <UdhaarTracker
            loans={loans}
            onOpenAddModal={handleOpenAddLoan}
            onOpenRepayModal={handleOpenPaymentModal}
            onSettleLoan={handleSettleLoan}
            onDeleteLoan={handleDeleteLoan}
            currencySymbol={settings.currencySymbol}
          />
        )}

        {/* Tab 4: Calculators Hub */}
        {activeTab === 'calculator' && (
          <CalculatorsHub
            key={calculatorSubTab}
            stats={stats}
            currencySymbol={settings.currencySymbol}
            onQuickAddExpense={handleQuickAddExpenseFromCalc}
            onPushToIncome={(amt) => handleOpenAddTx('income', amt, 'Calculated Income')}
            onPushToUdhaar={(_amt) => {
              setAddLoanDefaultType('lent');
              setIsAddLoanModalOpen(true);
            }}
            onAddLentLoans={handleAddMultipleLentLoans}
            defaultSubTab={calculatorSubTab}
          />
        )}

        {/* Tab 5: Budget Planner */}
        {activeTab === 'budget' && (
          <BudgetPlanner
            key={selectedMonth}
            budget={selectedBudget}
            month={selectedMonth}
            transactions={transactions}
            receivedIncome={stats.totalIncome}
            onSaveBudget={saveMonthBudget}
            currencySymbol={settings.currencySymbol}
          />
        )}
      </main>

      <footer className="workspace-footer"><span><span className="footer-dot"/> A little progress, every day.</span><span>Personal finance - Stored on this device</span></footer>
      </div>

      {/* Modals */}
      {isTxModalOpen && <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        onSave={handleSaveTx}
        currencySymbol={settings.currencySymbol}
        initialType={txModalDefaults.type}
        initialAmount={txModalDefaults.amount}
        initialNote={txModalDefaults.note}
        initialCategory={txModalDefaults.category}
        categories={[...new Set([...Object.keys(selectedBudget.categories), ...transactions.filter(t => t.type === txModalDefaults.type).map(t => t.category)])]}
      />}

      {isAddLoanModalOpen && <AddLoanModal
        isOpen={isAddLoanModalOpen}
        defaultType={addLoanDefaultType}
        onClose={() => setIsAddLoanModalOpen(false)}
        onAddLoan={handleSaveLoan}
        currencySymbol={settings.currencySymbol}
      />}

      {isPaymentModalOpen && <PaymentModal
        isOpen={isPaymentModalOpen}
        loan={selectedLoanForPayment}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setSelectedLoanForPayment(null);
        }}
        onAddPayment={handleAddRepayment}
        currencySymbol={settings.currencySymbol}
      />}

      {isSettingsOpen && <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={setSettings}
        onExportData={handleExportData}
        onImportData={handleImportData}
        onClearData={handleClearData}
        onDeleteProfile={onDeleteProfile}
        username={username}
      />}
    </div>
  );
}

export default App;

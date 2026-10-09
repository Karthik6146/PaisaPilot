import { AlertItem, BudgetConfig, LoanItem, Transaction } from '../types/finance';
import { localDate } from './dates';

export interface FinancialStats {
  totalIncome: number;
  totalExpenses: number;
  currentBalance: number;
  monthlyTarget: number;
  remainingBudget: number;
  daysPassedInMonth: number;
  daysRemainingInMonth: number;
  dailySafeLimit: number;
  todayStartingLimit: number;
  availableToSpend: number;
  spentToday: number;
  todayStatus: 'under' | 'warning' | 'over';
  dailyBurnRate: number; // Avg spend per day this month
  projectedRunwayDays: number;
  runwayStatus: 'healthy' | 'tight' | 'danger';
  totalLentPending: number;
  totalBorrowedPending: number;
  netUdhaar: number; // lent - borrowed
}

export const getMonthDetails = (date = new Date()) => {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed
  const totalDays = new Date(year, month + 1, 0).getDate();
  const currentDay = date.getDate();
  const daysPassed = Math.max(1, currentDay);
  const daysRemaining = Math.max(1, totalDays - currentDay + 1);

  return { year, month, totalDays, currentDay, daysPassed, daysRemaining };
};

export const calculateStats = (
  transactions: Transaction[],
  loans: LoanItem[],
  budget: BudgetConfig,
  now = new Date(),
  reserved = 0
): FinancialStats => {
  const { year, month, daysPassed, daysRemaining } = getMonthDetails(now);
  const currentMonthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
  const todayStr = localDate(now);

  // Filter current month transactions
  const monthTx = transactions.filter((t) => t.date.startsWith(currentMonthStr));

  const totalIncome = monthTx
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => Math.round((acc + t.amount) * 100) / 100, 0);

  const totalExpenses = monthTx
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => Math.round((acc + t.amount) * 100) / 100, 0);

  // The entered allowance funds the plan; logged income is a separate ledger total.
  const currentBalance = Math.round((budget.monthlyTarget - totalExpenses) * 100) / 100;
  const remainingBudget = currentBalance;

  // Today's spending
  const spentToday = transactions
    .filter((t) => t.date === todayStr && t.type === 'expense')
    .reduce((acc, t) => Math.round((acc + t.amount) * 100) / 100, 0);

  // Daily safe spending limit = available money / days left
  const effectivePool = Math.max(0, Math.round((remainingBudget - reserved) * 100) / 100);
  const dailySafeLimit = Math.floor(Math.round(effectivePool * 100) / daysRemaining) / 100;
  const todayLimit = Math.max(0, budget.monthlyTarget - totalExpenses + spentToday - reserved) / daysRemaining;

  let todayStatus: 'under' | 'warning' | 'over' = 'under';
  if (spentToday > todayLimit) {
    todayStatus = 'over';
  } else if (spentToday > todayLimit * 0.8) {
    todayStatus = 'warning';
  }

  // Daily burn rate (avg spend so far)
  const dailyBurnRate = Math.round(totalExpenses / daysPassed * 100) / 100;

  // Runway: how many days will current balance survive
  const projectedRunwayDays =
    dailyBurnRate > 0 ? Math.max(0, Math.floor(effectivePool / dailyBurnRate)) : daysRemaining;

  let runwayStatus: 'healthy' | 'tight' | 'danger' = 'healthy';
  if (projectedRunwayDays < daysRemaining - 3 || currentBalance < 500) {
    runwayStatus = 'danger';
  } else if (projectedRunwayDays < daysRemaining) {
    runwayStatus = 'tight';
  }

  // Loans calculations
  let totalLentPending = 0;
  let totalBorrowedPending = 0;

  loans.forEach((loan) => {
    if (loan.isSettled) return;
    const paidSoFar = (loan.payments || []).reduce((sum, p) => sum + p.amount, 0);
    const remaining = Math.max(0, loan.originalAmount - paidSoFar);

    if (loan.type === 'lent') {
      totalLentPending += remaining;
    } else {
      totalBorrowedPending += remaining;
    }
  });

  const netUdhaar = totalLentPending - totalBorrowedPending;

  return {
    totalIncome,
    totalExpenses,
    currentBalance,
    monthlyTarget: budget.monthlyTarget,
    remainingBudget,
    daysPassedInMonth: daysPassed,
    daysRemainingInMonth: daysRemaining,
    dailySafeLimit,
    todayStartingLimit: todayLimit,
    availableToSpend: effectivePool,
    spentToday,
    todayStatus,
    dailyBurnRate,
    projectedRunwayDays,
    runwayStatus,
    totalLentPending,
    totalBorrowedPending,
    netUdhaar,
  };
};

export const generateAlerts = (
  stats: FinancialStats,
  loans: LoanItem[],
  budget: BudgetConfig,
  _transactions: Transaction[]
): AlertItem[] => {
  const alerts: AlertItem[] = [];
  const todayStr = localDate();

  // 1. Runway danger alert
  if (stats.runwayStatus === 'danger') {
    alerts.push({
      id: 'alert-runway-danger',
      type: 'danger',
      title: '🚨 High Burn Rate Alert!',
      message: `At ₹${stats.dailyBurnRate}/day, your funds might run out in ${stats.projectedRunwayDays} days! Limit spending to ₹${stats.dailySafeLimit}/day.`,
      actionLabel: 'Review budget',
      date: todayStr,
    });
  }

  // 2. Budget cap 85%+
  const budgetRatio = stats.totalExpenses / (budget.monthlyTarget || 1);
  if (budgetRatio >= 0.85 && budgetRatio < 1) {
    alerts.push({
      id: 'alert-budget-85',
      type: 'warning',
      title: '⚠️ 85% of Monthly Target Reached',
      message: `You have spent ₹${stats.totalExpenses} of ₹${budget.monthlyTarget}. Only ₹${stats.remainingBudget} left for this month.`,
      date: todayStr,
    });
  } else if (budgetRatio >= 1) {
    alerts.push({
      id: 'alert-budget-exceeded',
      type: 'danger',
      title: '🛑 Monthly Target Exceeded',
      message: `You've exceeded your monthly budget by ₹${stats.totalExpenses - budget.monthlyTarget}. Review your spending and adjust your plan.`,
      date: todayStr,
    });
  }

  // 3. Low balance
  if (stats.currentBalance < 500 && stats.currentBalance > 0) {
    alerts.push({
      id: 'alert-low-balance',
      type: 'danger',
      title: 'Low remaining budget',
      message: `Only ₹${stats.currentBalance} remains in your monthly budget. Prioritize upcoming essentials.`,
      date: todayStr,
    });
  }

  // 4. Overdue or upcoming loans
  loans.forEach((loan) => {
    if (loan.isSettled) return;
    const paidSoFar = (loan.payments || []).reduce((s, p) => s + p.amount, 0);
    const dueRemaining = loan.originalAmount - paidSoFar;
    if (dueRemaining <= 0) return;

    const dueDate = new Date(loan.dueDate);
    const today = new Date(todayStr);
    const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      alerts.push({
        id: `alert-loan-overdue-${loan.id}`,
        type: 'danger',
        title: `⏰ Overdue ${loan.type === 'lent' ? 'Collection' : 'Payment'}`,
        message:
          loan.type === 'lent'
            ? `${loan.personName} owes you ₹${dueRemaining} (Overdue by ${Math.abs(diffDays)} days). Send a reminder!`
            : `You owe ${loan.personName} ₹${dueRemaining} (Overdue by ${Math.abs(diffDays)} days). Settle soon!`,
        actionLabel: loan.type === 'lent' ? 'Send WhatsApp' : 'Pay Now',
        date: todayStr,
      });
    } else if (diffDays <= 2) {
      alerts.push({
        id: `alert-loan-due-soon-${loan.id}`,
        type: 'warning',
        title: `⏳ Due in ${diffDays === 0 ? 'Today' : `${diffDays} days`}`,
        message:
          loan.type === 'lent'
            ? `${loan.personName} is scheduled to return ₹${dueRemaining}.`
            : `Reminder: You have to pay ₹${dueRemaining} to ${loan.personName}.`,
        date: todayStr,
      });
    }
  });

  // 5. Daily limit check
  if (stats.todayStatus === 'over') {
    alerts.push({
      id: 'alert-today-limit',
      type: 'warning',
      title: '📈 Daily Limit Exceeded Today',
      message: `You spent ₹${stats.spentToday} today (Safe limit was ₹${stats.dailySafeLimit}). Save ₹${Math.max(0, stats.spentToday - stats.todayStartingLimit).toFixed(2)} tomorrow to stay on track.`,
      date: todayStr,
    });
  }

  // 6. Positive encouragement if on track
  if (alerts.length === 0 && stats.currentBalance > 1000) {
    alerts.push({
      id: 'alert-all-good',
      type: 'success',
      title: 'Your budget is on track',
      message: `You are well within your daily safe limit of ₹${stats.dailySafeLimit}. Keep it up, champion!`,
      date: todayStr,
    });
  }

  return alerts;
};


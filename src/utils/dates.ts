export function localDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function monthBudget(budget: import('../types/finance').BudgetConfig, month: string) {
  const saved = budget.months?.[month];
  return {
    ...budget,
    monthlyTarget: saved?.monthlyTarget ?? (month === localDate().slice(0, 7) ? budget.monthlyTarget : 0),
    categories: saved?.categories ?? (month === localDate().slice(0, 7) ? budget.categories : {}),
  };
}

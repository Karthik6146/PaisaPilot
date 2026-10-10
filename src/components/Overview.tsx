import { ArrowUpRight, ArrowDownLeft, ArrowRight, Plus, Wallet, CalendarDays, TrendingUp, ShieldCheck } from 'lucide-react';
import { BudgetConfig, Transaction, PrioritySpend, BudgetNote } from '../types/finance';
import { FinancialStats } from '../utils/calculations';
import { PrioritySpending } from './Budget/PrioritySpending';
import { Notes } from './Budget/Notes';

interface Props {
  stats: FinancialStats; transactions: Transaction[]; userName: string; currencySymbol: string;
  budget: BudgetConfig; month: string; today: string; onOpenAddModal: (type?: 'expense' | 'income') => void;
  onNavigateToTab: (tab: string) => void; onPrioritiesChange: (items: PrioritySpend[]) => void;
  onNotesChange: (notes: BudgetNote[]) => void; onPayPriority: (item: PrioritySpend) => void;
}
export function Overview({ stats, transactions, currencySymbol, budget, month, today, onOpenAddModal, onNavigateToTab, onPrioritiesChange, onNotesChange, onPayPriority }: Props) {
  const money = (value: number) => currencySymbol + value.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  const current = month === today.slice(0, 7);
  const monthTx = transactions.filter(tx => tx.date.startsWith(month));
  const expenses = monthTx.filter(tx => tx.type === 'expense');
  const totalDays = new Date(Number(month.slice(0, 4)), Number(month.slice(5)), 0).getDate();
  const byDay = Array.from({ length: totalDays }, (_, index) => expenses.filter(tx => Number(tx.date.slice(8)) === index + 1).reduce((sum, tx) => sum + tx.amount, 0));
  const maxDay = Math.max(...byDay, 1);
  const recent = [...monthTx].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt).slice(0, 4);
  const breakdown = [...new Set(expenses.map(t => t.category))].map(category => ({ category, spent: expenses.filter(tx => tx.category === category).reduce((sum, tx) => sum + tx.amount, 0) })).sort((a, b) => b.spent - a.spent);
  const reserved = (budget.priorities || []).filter(p => p.month === month && !p.paidTransactionId).reduce((sum, p) => sum + p.amount, 0);
  const used = stats.monthlyTarget > 0 ? stats.totalExpenses / stats.monthlyTarget * 100 : 0;
  const categories = [...new Set([...Object.keys(budget.categories), ...expenses.map(t => t.category)])];
  return <div className="dashboard">
    <div className="dashboard-top">
      <section className="balance-card">
        <div className="balance-top"><span><Wallet size={17}/> YOUR MONTHLY POCKET</span><span className="live-pill"><span/>{stats.monthlyTarget > 0 ? 'Budget active' : 'Ready to begin'}</span></div>
        <p className="balance-label">Left in your budget</p><div className="balance-value">{money(stats.remainingBudget)}</div>
        <p className="balance-copy">{stats.monthlyTarget === 0 ? 'Give your month a starting point.' : stats.remainingBudget < 0 ? 'You are over budget. Review your plan before spending more.' : 'A little clarity for every rupee.'}</p>
        <div className="balance-progress" role="progressbar" aria-label="Monthly budget spent" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100, Math.round(used))}><span style={{ width: Math.min(100, used) + '%' }}/></div>
        <div className="balance-progress-label"><span>{money(stats.totalExpenses)} spent</span><span>of {money(stats.monthlyTarget)}</span></div>
        <div className="balance-bottom"><button onClick={() => onNavigateToTab('budget')}>{stats.monthlyTarget ? 'Edit monthly budget' : 'Set your monthly budget'}<ArrowRight size={15}/></button><span>{stats.monthlyTarget > 0 ? Math.round(used) + '% used' : 'Start here'}</span></div>
      </section>
      <section className="panel daily-card"><div className="section-heading"><span className="eyebrow">{current ? 'YOUR DAILY CHECK-IN' : 'MONTHLY SNAPSHOT'}</span><span className="soft-icon"><CalendarDays size={18}/></span></div><p className="daily-label">{current ? 'Spent today' : 'Spent this month'}</p><div className="daily-value">{money(current ? stats.spentToday : stats.totalExpenses)}</div><span className={'status-pill ' + (stats.todayStatus === 'over' ? 'warning' : '')}>{!current ? 'Selected month' : stats.monthlyTarget === 0 ? 'Set your monthly budget to begin' : stats.todayStatus === 'over' ? 'Above the starting allowance today' : 'Within the starting allowance today'}</span><div className="daily-divider"/><div className="daily-bottom"><div><span>{current ? 'Available per day from now' : 'Average spend per day'}</span><strong>{money(current ? stats.dailySafeLimit : stats.dailyBurnRate)}</strong></div><button className="round-add" onClick={() => onOpenAddModal('expense')} aria-label="Add a daily expense"><Plus size={21}/></button></div><p className="form-hint">{current ? 'Remaining budget minus priorities / days left, including today.' : 'Open the current month for your daily allowance.'}</p></section>
    </div>
    <div className="summary-strip">
      <div><span className="summary-icon"><TrendingUp size={19}/></span><span><small>Total spent</small><strong>{money(stats.totalExpenses)}</strong></span></div>
      <div><span className="summary-icon"><ShieldCheck size={19}/></span><span><small>Reserved for priorities</small><strong>{money(reserved)}</strong></span></div>
      <div><span className="summary-icon"><Wallet size={19}/></span><span><small>Free to spend</small><strong>{money(Math.max(0, stats.remainingBudget - reserved))}</strong></span></div>
      <div><span className="summary-icon"><CalendarDays size={19}/></span><span><small>{current ? 'Days left this month' : 'Days in this month'}</small><strong>{current ? stats.daysRemainingInMonth : totalDays}<em> days</em></strong></span></div>
    </div>
    {reserved > Math.max(0, stats.remainingBudget) && <p className="inline-warning" role="status">Your priorities exceed the remaining budget by {money(reserved - Math.max(0, stats.remainingBudget))}. Adjust your list or increase the budget.</p>}
    <div className="dashboard-middle">
      <section className="panel chart-panel"><div className="section-heading"><div><h2>Daily spending</h2><p>Your month, one day at a time.</p></div><span className="chart-legend"><i/>Expenses</span></div>
        <div className="chart-axis"><span>{money(maxDay === 1 ? 0 : maxDay)}</span><span>{money(maxDay === 1 ? 0 : maxDay / 2)}</span><span>{money(0)}</span></div>
        <div className="spend-chart" role="img" aria-label={'Daily spending for ' + month + ': ' + byDay.map((value, i) => (i + 1) + ': ' + money(value)).join(', ')}>{byDay.map((amount, index) => <div className={'chart-column ' + (current && index + 1 === Number(today.slice(8)) ? 'today' : '')} key={index} title={'Day ' + (index + 1) + ': ' + money(amount)}><div className="chart-bar-area"><div className={amount ? 'chart-bar' : 'chart-bar zero'} style={{ height: amount ? Math.max(2, amount / maxDay * 100) + '%' : '3px' }}/></div><span>{index === 0 || (index + 1) % 5 === 0 || index === totalDays - 1 ? index + 1 : ''}</span></div>)}</div>
        <div className="chart-footer"><span>{expenses.length ? expenses.length + ' expenses recorded' : 'Log an expense to bring your chart to life.'}</span><span>{current ? 'Today - ' + Number(today.slice(8)) : month}</span></div>
      </section>
      <section className="panel categories-panel"><div className="section-heading"><div><h2>Where it went</h2><p>Spending by category.</p></div><button className="text-button" onClick={() => onNavigateToTab('budget')}>Manage<ArrowRight size={14}/></button></div>
        {breakdown.length === 0 ? <div className="empty-small"><span className="category-empty">&#9678;</span><h3>No spending yet.</h3><p>Your own categories will appear as you log expenses.</p></div> : <div className="category-breakdown">{breakdown.map(({ category, spent }, i) => <div className="category-item" key={category}><div><span><i style={{ background: ['#287b61', '#9cb791', '#d5b875', '#7f9dab', '#bd9886'][i % 5] }}/>{category}</span><strong>{money(spent)}</strong></div><div className="category-track"><span style={{ width: spent / stats.totalExpenses * 100 + '%', background: ['#287b61', '#9cb791', '#d5b875', '#7f9dab', '#bd9886'][i % 5] }}/></div><small>{Math.round(spent / stats.totalExpenses * 100)}% of expenses{budget.categories[category] > 0 ? ' - limit ' + money(budget.categories[category]) + (spent > budget.categories[category] ? ' - Over limit' : '') : ''}</small></div>)}</div>}
      </section>
    </div>
    <div className="dashboard-bottom"><PrioritySpending items={budget.priorities || []} month={month} currencySymbol={currencySymbol} categories={categories} onChange={onPrioritiesChange} onPay={onPayPriority} canPay={current}/><Notes notes={budget.notes || []} month={month} onChange={onNotesChange}/></div>
    <section className="panel recent-panel"><div className="section-heading"><div><h2>Recent activity</h2><p>Little purchases. A bigger picture.</p></div><button className="text-button" onClick={() => onNavigateToTab('transactions')}>View all<ArrowRight size={15}/></button></div>{recent.length === 0 ? <div className="recent-empty"><span>No records this month. Start with today's spending.</span><button className="secondary-button" onClick={() => onOpenAddModal('expense')}><Plus size={16}/>Log an expense</button></div> : recent.map(tx => <div className="transaction-row" key={tx.id}><span className={'transaction-icon ' + tx.type}>{tx.type === 'expense' ? <ArrowUpRight size={18}/> : <ArrowDownLeft size={18}/>}</span><div className="transaction-description"><strong>{tx.note || tx.category}</strong><small>{tx.category}</small></div><time>{new Date(tx.date + 'T12:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</time><strong className={'transaction-amount ' + tx.type}>{tx.type === 'expense' ? '-' : '+'}{money(tx.amount)}</strong></div>)}</section>
  </div>;
}

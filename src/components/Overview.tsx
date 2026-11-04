import { useState } from 'react';
import { ArrowUpRight, ArrowDownLeft, ArrowRight, Plus, Wallet, CalendarDays, TrendingUp, ShieldCheck } from 'lucide-react';
import { BudgetConfig, Transaction, PrioritySpend, BudgetNote } from '../types/finance';
import { FinancialStats } from '../utils/calculations';
import { PrioritySpending } from './Budget/PrioritySpending';
import { Notes } from './Budget/Notes';
import { CountUp } from './CountUp';
import { Doodle } from './Doodle';

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
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const dayTx = selectedDay === null ? [] : expenses.filter(tx => Number(tx.date.slice(8)) === selectedDay).sort((a, b) => b.amount - a.amount);
  const avg = expenses.length ? (current ? stats.dailyBurnRate : byDay.reduce((sum, value) => sum + value, 0) / totalDays) : 0;
  const palette = ['#287b61', '#9cb791', '#d5b875', '#7f9dab', '#bd9886'];
  const peakDay = expenses.length ? byDay.indexOf(Math.max(...byDay)) + 1 : 0;
  const recent = [...monthTx].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt).slice(0, 4);
  const breakdown = [...new Set(expenses.map(t => t.category))].map(category => ({ category, spent: expenses.filter(tx => tx.category === category).reduce((sum, tx) => sum + tx.amount, 0) })).sort((a, b) => b.spent - a.spent);
  const reserved = (budget.priorities || []).filter(p => p.month === month && !p.paidTransactionId).reduce((sum, p) => sum + p.amount, 0);
  const used = stats.monthlyTarget > 0 ? stats.totalExpenses / stats.monthlyTarget * 100 : 0;
  const categories = [...new Set([...Object.keys(budget.categories), ...expenses.map(t => t.category)])];
  const subBudgets = Object.entries(budget.categories).filter(([, limit]) => limit > 0).map(([category, limit]) => { const spent = expenses.filter(tx => (tx.subBudget || tx.category) === category).reduce((sum, tx) => sum + tx.amount, 0); return { category, limit, spent, left: Math.round((limit - spent) * 100) / 100 }; });
  return <div className="dashboard">
    <div className="dashboard-top">
      <section className="balance-card"><span className="balance-art" aria-hidden="true"/>
        <div className="balance-top"><span><Wallet size={17}/> YOUR MONTHLY POCKET</span><span className="live-pill"><span/>{stats.monthlyTarget > 0 ? 'Budget active' : 'Ready to begin'}</span></div>
        <p className="balance-label">Left in your budget</p><div className="balance-value"><CountUp value={stats.remainingBudget} format={money}/></div>
        <p className="balance-copy">{stats.monthlyTarget === 0 ? 'Give your month a starting point.' : stats.remainingBudget < 0 ? 'You are over budget. Review your plan before spending more.' : 'A little clarity for every rupee.'}</p>
        <div className="balance-progress" role="progressbar" aria-label="Monthly budget spent" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100, Math.round(used))}><span style={{ width: Math.min(100, used) + '%' }}/></div>
        <div className="balance-progress-label"><span>{money(stats.totalExpenses)} spent</span><span>of {money(stats.monthlyTarget)}</span></div>
        <div className="balance-bottom"><button onClick={() => onNavigateToTab('budget')}>{stats.monthlyTarget ? 'Edit monthly budget' : 'Set your monthly budget'}<ArrowRight size={15}/></button><span>{stats.monthlyTarget > 0 ? Math.round(used) + '% used' : 'Start here'}</span></div>
      </section>
      <section className="panel daily-card"><div className="section-heading"><span className="eyebrow">{current ? 'YOUR DAILY CHECK-IN' : 'MONTHLY SNAPSHOT'}</span><span className="soft-icon"><CalendarDays size={18}/></span></div><p className="daily-label">{current ? 'Spent today' : 'Spent this month'}</p><div className="daily-value"><CountUp value={current ? stats.spentToday : stats.totalExpenses} format={money}/></div><span className={'status-pill ' + (stats.todayStatus === 'over' ? 'warning' : '')}>{!current ? 'Selected month' : stats.monthlyTarget === 0 ? 'Set your monthly budget to begin' : stats.todayStatus === 'over' ? 'Above the starting allowance today' : 'Within the starting allowance today'}</span><div className="daily-divider"/><div className="daily-bottom"><div><span>{current ? 'Available per day from now' : 'Average spend per day'}</span><strong>{money(current ? stats.dailySafeLimit : stats.dailyBurnRate)}</strong></div><button className="round-add" onClick={() => onOpenAddModal('expense')} aria-label="Add a daily expense"><Plus size={21}/></button></div><p className="form-hint">{current ? 'Remaining budget minus priorities / days left, including today.' : 'Open the current month for your daily allowance.'}</p></section>
    </div>
    <div className="summary-strip">
      <div><span className="summary-icon"><TrendingUp size={19}/></span><span><small>Total spent</small><strong><CountUp value={stats.totalExpenses} format={money}/></strong></span></div>
      <div><span className="summary-icon"><ShieldCheck size={19}/></span><span><small>Reserved for priorities</small><strong>{money(reserved)}</strong></span></div>
      <div><span className="summary-icon"><Wallet size={19}/></span><span><small>Free to spend</small><strong><CountUp value={Math.max(0, stats.remainingBudget - reserved)} format={money}/></strong></span></div>
      <div><span className="summary-icon"><CalendarDays size={19}/></span><span><small>{current ? 'Days left this month' : 'Days in this month'}</small><strong>{current ? stats.daysRemainingInMonth : totalDays}<em> days</em></strong></span></div>
    </div>
    {reserved > Math.max(0, stats.remainingBudget) && <p className="inline-warning" role="status">Your priorities exceed the remaining budget by {money(reserved - Math.max(0, stats.remainingBudget))}. Adjust your list or increase the budget.</p>}
    {subBudgets.length > 0 && <section className="panel sub-budgets-panel"><div className="section-heading"><div><h2>Sub-budgets</h2><p>Categories with a limit, tracked inside your monthly pocket.</p></div><button className="text-button" onClick={() => onNavigateToTab('budget')}>Manage<ArrowRight size={14}/></button></div>
      <div className="sub-budgets">{subBudgets.map(({ category, limit, spent, left }) => <div className={'category-item sub-budget ' + (left < 0 ? 'over' : '')} key={category}><div><span>{category}</span><strong>{money(spent)} / {money(limit)}</strong></div><div className="category-track" role="progressbar" aria-label={category + ' limit used'} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100, Math.round(spent / limit * 100))}><span style={{ width: Math.min(100, spent / limit * 100) + '%' }}/></div><small>{left < 0 ? 'Over by ' + money(-left) : money(left) + ' left'}{current && left > 0 ? ' - ' + money(Math.floor(left * 100 / stats.daysRemainingInMonth) / 100) + ' per day from now' : ''}</small></div>)}</div>
    </section>}
    <div className="dashboard-middle">
      <section className="panel chart-panel"><div className="section-heading"><div><h2>Daily spending</h2><p>Your month, one day at a time.</p></div><span className="chart-legend"><i/>Expenses</span></div>
        <div className="chart-axis"><span>{money(maxDay === 1 ? 0 : maxDay)}</span><span>{money(maxDay === 1 ? 0 : maxDay / 2)}</span><span>{money(0)}</span></div>
        <div className="spend-chart" role="group" aria-label={'Daily spending for ' + month + '. Select a day to see its expenses.'}>{avg > 0 && <div className="chart-avg" style={{ bottom: Math.min(100, avg / maxDay * 100) + '%' }}><span>avg {money(Math.round(avg))}</span></div>}{byDay.map((amount, index) => <button type="button" className={'chart-column' + (current && index + 1 === Number(today.slice(8)) ? ' today' : '') + (selectedDay === index + 1 ? ' selected' : '')} key={index} aria-pressed={selectedDay === index + 1} aria-label={'Day ' + (index + 1) + ': ' + money(amount)} onClick={() => setSelectedDay(selectedDay === index + 1 ? null : index + 1)}><div className="chart-bar-area"><div className={'chart-bar' + (amount ? (avg > 0 && amount > avg * 1.5 ? ' high' : '') : ' zero')} style={{ height: amount ? Math.max(2, amount / maxDay * 100) + '%' : '3px' }}/></div><span>{index === 0 || (index + 1) % 5 === 0 || index === totalDays - 1 ? index + 1 : ''}</span></button>)}</div>
        {selectedDay !== null && <div className="chart-detail" aria-live="polite"><div className="chart-detail-head"><strong>{new Date(month + '-' + String(selectedDay).padStart(2, '0') + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</strong><span>{dayTx.length ? dayTx.length + (dayTx.length === 1 ? ' expense' : ' expenses') + ' - ' + money(byDay[selectedDay - 1]) : 'No spending'}</span></div>{dayTx.slice(0, 5).map(tx => <div className="chart-detail-row" key={tx.id}><span>{tx.note || tx.category}<small>{tx.category}</small></span><strong>{money(tx.amount)}</strong></div>)}{dayTx.length > 5 && <button className="text-button" onClick={() => onNavigateToTab('transactions')}>and {dayTx.length - 5} more<ArrowRight size={14}/></button>}</div>}
        <div className="chart-footer"><span>{expenses.length ? expenses.length + ' expenses recorded' + (peakDay ? ' - highest day ' + peakDay + ' at ' + money(byDay[peakDay - 1]) : '') : 'Log an expense to bring your chart to life.'}</span><span>{current ? 'Today - ' + Number(today.slice(8)) : month}</span></div>
      </section>
      <section className="panel categories-panel"><div className="section-heading"><div><h2>Where it went</h2><p>Spending by category.</p></div><button className="text-button" onClick={() => onNavigateToTab('budget')}>Manage<ArrowRight size={14}/></button></div>
        {breakdown.length === 0 ? <div className="empty-small"><Doodle kind="coins"/><h3>No spending yet.</h3><p>Your own categories will appear as you log expenses.</p></div> : <>
          <div className="spend-mix" role="img" aria-label={'Share of expenses: ' + breakdown.map(b => b.category + ' ' + Math.round(b.spent / stats.totalExpenses * 100) + '%').join(', ')}>{breakdown.slice(0, 6).map(({ category, spent }, i) => <span key={category} style={{ width: spent / stats.totalExpenses * 100 + '%', background: palette[i % 5] }}/>)}</div>
          <div className="mix-list">{breakdown.slice(0, 6).map(({ category, spent }, i) => <div className="mix-row" key={category}><i style={{ background: palette[i % 5] }}/><span>{category}{budget.categories[category] > 0 && <small className={spent > budget.categories[category] ? 'over' : ''}>{spent > budget.categories[category] ? 'Over the ' + money(budget.categories[category]) + ' limit' : money(budget.categories[category] - spent) + ' left of ' + money(budget.categories[category])}</small>}</span><em>{Math.round(spent / stats.totalExpenses * 100)}%</em><strong>{money(spent)}</strong></div>)}</div>
          {breakdown.length > 6 && <button className="text-button" onClick={() => onNavigateToTab('transactions')}>and {breakdown.length - 6} more<ArrowRight size={14}/></button>}
        </>}
      </section>
    </div>
    <div className="dashboard-bottom"><PrioritySpending items={budget.priorities || []} month={month} currencySymbol={currencySymbol} categories={categories} onChange={onPrioritiesChange} onPay={onPayPriority} canPay={current}/><Notes notes={budget.notes || []} month={month} onChange={onNotesChange}/></div>
    <section className="panel recent-panel"><div className="section-heading"><div><h2>Recent activity</h2><p>Little purchases. A bigger picture.</p></div><button className="text-button" onClick={() => onNavigateToTab('transactions')}>View all<ArrowRight size={15}/></button></div>{recent.length === 0 ? <div className="recent-empty"><span>No records this month. Start with today's spending.</span><button className="secondary-button" onClick={() => onOpenAddModal('expense')}><Plus size={16}/>Log an expense</button></div> : recent.map(tx => <div className="transaction-row" key={tx.id}><span className={'transaction-icon ' + tx.type}>{tx.type === 'expense' ? <ArrowUpRight size={18}/> : <ArrowDownLeft size={18}/>}</span><div className="transaction-description"><strong>{tx.note || tx.category}</strong><small>{tx.category}</small></div><time>{new Date(tx.date + 'T12:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</time><strong className={'transaction-amount ' + tx.type}>{tx.type === 'expense' ? '-' : '+'}{money(tx.amount)}</strong></div>)}</section>
  </div>;
}

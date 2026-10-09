import { useMemo, useState } from 'react';
import { Plus, Trash2, Check, Wallet } from 'lucide-react';
import { BudgetConfig, Transaction } from '../../types/finance';

interface Props { budget: BudgetConfig; transactions: Transaction[]; onSaveBudget: (budget: BudgetConfig) => void; currencySymbol: string; month: string; }
export function BudgetPlanner({ budget, transactions, onSaveBudget, currencySymbol, month }: Props) {
  const [target, setTarget] = useState(String(budget.monthlyTarget || ''));
  const [categories, setCategories] = useState(budget.categories);
  const [newCategory, setNewCategory] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const total = Math.round(Object.values(categories).reduce((sum, value) => sum + value, 0) * 100) / 100;
  const spent = useMemo(() => {
    const result: Record<string, number> = Object.create(null);
    for (const tx of transactions.filter(t => t.type === 'expense' && t.date.startsWith(month))) result[tx.category] = (result[tx.category] || 0) + tx.amount;
    return result;
  }, [transactions, month]);
  const addCategory = () => {
    const name = newCategory.trim();
    if (!name || ['__proto__', 'constructor', 'prototype'].includes(name)) { setError('Enter a category name.'); return; }
    if (Object.keys(categories).some(cat => cat.toLowerCase() === name.toLowerCase())) { setError('That category already exists.'); return; }
    setCategories({ ...categories, [name]: 0 }); setNewCategory(''); setError(''); setSaved(false);
  };
  return <div className="budget-layout">
    <section className="panel budget-intro"><div className="soft-icon"><Wallet size={24}/></div><h2>A plan for your month.</h2><p>Enter the pocket money you want to spend this month. Give categories a limit if it helps, or simply track as you go.</p><div className="budget-note"><strong>Your categories. Your rules.</strong><p>No preset fees or fixed ratios. Add whatever fits your life.</p></div><p className="form-hint">Saving this plan changes only the selected month. Income records do not automatically increase this budget.</p></section>
    <form className="panel" onSubmit={e => {
      e.preventDefault();
      const value = Number(target);
      if (!Number.isFinite(value) || value < 0 || total > value) { setError('Category allocations must fit within your monthly budget.'); return; }
      onSaveBudget({ ...budget, monthlyTarget: value, categories }); setError(''); setSaved(true);
    }}>
      <div className="section-heading"><div><span className="eyebrow">MONTHLY PLAN</span><h2>Set your budget</h2></div></div>
      <label className="field">Monthly pocket money ({currencySymbol})<input required type="number" min="0" max="1000000000" step="0.01" inputMode="decimal" value={target} onChange={e => { setTarget(e.target.value); setSaved(false); }} placeholder="e.g. 5000" className="amount-input"/></label>
      <div className="allocation-summary"><span>Allocated <strong>{currencySymbol}{total.toLocaleString('en-IN')}</strong></span><span className={total > Number(target) ? 'error-text' : ''}>Unallocated <strong>{currencySymbol}{(Number(target) - total).toLocaleString('en-IN')}</strong></span></div>
      <h3 className="subheading">Your categories <span className="muted">- optional limits</span></h3>
      {Object.entries(categories).map(([cat, limit]) => <div className="category-edit-row" key={cat}><div><strong>{cat}</strong><small>Spent {currencySymbol}{(spent[cat] || 0).toLocaleString('en-IN')}{limit > 0 && spent[cat] > limit ? ' - Over limit' : ''}</small></div><label className="sr-only" htmlFor={'limit-' + cat}>Limit for {cat}</label><input id={'limit-' + cat} type="number" required min="0" step="0.01" value={limit} onChange={e => { setCategories({ ...categories, [cat]: Number(e.target.value) }); setSaved(false); }}/><button type="button" className="icon-button" aria-label={'Remove category ' + cat} onClick={() => { const next = { ...categories }; delete next[cat]; setCategories(next); setSaved(false); }}><Trash2 size={16}/></button></div>)}
      {Object.keys(categories).length === 0 && <div className="empty-small">Start with the categories that matter to you.</div>}
      <div className="inline-form"><label className="sr-only" htmlFor="new-category">New category name</label><input id="new-category" maxLength={60} placeholder="Name a new category" value={newCategory} onChange={e => setNewCategory(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCategory(); } }}/><button type="button" className="secondary-button" onClick={addCategory}><Plus size={16}/>Add</button></div>
      {error && <p role="alert" className="error-text">{error}</p>}
      <button className="primary-button full-width" type="submit">{saved ? <><Check size={18}/>Budget saved</> : 'Save monthly budget'}</button>
      {saved && <span role="status" className="form-hint">Your monthly plan has been saved.</span>}
    </form>
  </div>;
}

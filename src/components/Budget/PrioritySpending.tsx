import { useState } from 'react';
import { Plus, X, Flag, Check, Trash2 } from 'lucide-react';
import { PrioritySpend } from '../../types/finance';
interface Props {
  items: PrioritySpend[]; month: string; currencySymbol: string; canPay: boolean;
  categories: string[]; onChange: (items: PrioritySpend[]) => void; onPay: (item: PrioritySpend) => void;
}
export function PrioritySpending({ items, month, currencySymbol, categories, onChange, onPay, canPay }: Props) {
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const monthItems = items.filter(item => item.month === month).sort((a, b) => Number(!!a.paidTransactionId) - Number(!!b.paidTransactionId) || ['Must have', 'Important', 'Can wait'].indexOf(a.priority) - ['Must have', 'Important', 'Can wait'].indexOf(b.priority));
  const reserved = monthItems.filter(item => !item.paidTransactionId).reduce((sum, item) => sum + item.amount, 0);
  return <section className="panel priority-panel">
    <div className="section-heading"><div><h2><Flag size={18}/>Priority spending</h2><p>Make room for what matters.</p></div><button className="icon-button" aria-label={adding ? 'Close priority form' : 'Add priority purchase'} onClick={() => setAdding(!adding)}>{adding ? <X size={18}/> : <Plus size={18}/>}</button></div>
    {adding && <form className="widget-form" onSubmit={e => {
      e.preventDefault(); const form = new FormData(e.currentTarget);
      const title = String(form.get('title')).trim(), amount = Number(form.get('amount')), category = String(form.get('category')).trim();
      if (!title || !category || !Number.isFinite(amount) || amount <= 0 || ['__proto__', 'constructor', 'prototype'].includes(category)) { setError('Add a title, positive amount, and category.'); return; }
      onChange([...items, { id: crypto.randomUUID(), month, title, amount, category, priority: form.get('priority') as PrioritySpend['priority'] }]); setAdding(false); setError('');
    }}><label className="field">Purchase<input name="title" required maxLength={100} placeholder="What are you planning?"/></label><div className="form-grid"><label className="field">Amount ({currencySymbol})<input name="amount" required type="number" min="0.01" max="1000000000" step="0.01" placeholder="0"/></label><label className="field">Priority<select name="priority"><option>Must have</option><option>Important</option><option>Can wait</option></select></label></div><label className="field">Category<input name="category" list="priority-categories" required maxLength={60} placeholder="Choose or create"/><datalist id="priority-categories">{categories.map(cat => <option key={cat} value={cat}/>)}</datalist></label>{error && <p className="error-text" role="alert">{error}</p>}<button type="submit" className="primary-button full-width">Reserve this purchase</button></form>}
    {monthItems.length === 0 && !adding ? <div className="empty-small"><span className="soft-icon"><Flag size={22}/></span><h3>What is next on your list?</h3><p>Plan a purchase and keep its money set aside.</p><button className="text-button" onClick={() => setAdding(true)}>+ Add a priority</button></div> : <div className="priority-list">{monthItems.map(item => <div className={'priority-row ' + (item.paidTransactionId ? 'is-paid' : '')} key={item.id}><button disabled={!!item.paidTransactionId || !canPay} className="priority-check" title={!canPay ? 'Payments can be recorded for the current month' : 'Mark paid and record expense'} aria-label={'Mark ' + item.title + ' paid'} onClick={() => onPay(item)}>{item.paidTransactionId && <Check size={14}/>}</button><div><strong>{item.title}</strong><small><span className={'priority-tag ' + item.priority.toLowerCase().replaceAll(' ', '-')}>{item.paidTransactionId ? 'Paid' : item.priority}</span> &#183; {item.category}</small></div><strong>{currencySymbol}{item.amount.toLocaleString('en-IN')}</strong><button className="icon-button" aria-label={'Remove priority ' + item.title} onClick={() => onChange(items.filter(p => p.id !== item.id))}><Trash2 size={14}/></button></div>)}</div>}
    <div className="widget-footer"><span>Set aside for unpaid priorities</span><strong>{currencySymbol}{reserved.toLocaleString('en-IN')}</strong></div>
  </section>;
}

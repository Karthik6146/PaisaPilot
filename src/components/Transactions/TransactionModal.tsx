import { useEffect, useRef, useState } from 'react';
import { X, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { Transaction, TransactionType, PaymentMode } from '../../types/finance';
import { localDate } from '../../utils/dates';

interface Props {
  isOpen: boolean; onClose: () => void; onSave: (data: Omit<Transaction, 'id' | 'createdAt'>) => void;
  currencySymbol: string; initialType?: TransactionType; initialAmount?: number;
  initialNote?: string; initialCategory?: string; categories?: string[];
}
export function TransactionModal({ onClose, onSave, currencySymbol, initialType = 'expense', initialAmount, initialNote = '', initialCategory = '', categories = [] }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [type, setType] = useState(initialType);
  const [amount, setAmount] = useState(initialAmount?.toString() ?? '');
  const [category, setCategory] = useState(initialCategory);
  const [note, setNote] = useState(initialNote);
  const [date, setDate] = useState(localDate());
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('UPI (GPay/PhonePe)');
  const [error, setError] = useState('');
  useEffect(() => { const previous = document.activeElement as HTMLElement; const element = dialog.current; element?.showModal(); element?.querySelector('input')?.focus(); return () => { element?.close(); previous?.focus(); }; }, []);
  return <dialog ref={dialog} className="personal-dialog" aria-labelledby="transaction-title" onCancel={onClose} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="dialog-heading"><div><span className="eyebrow">YOUR DAILY CHECK-IN</span><h2 id="transaction-title">{type === 'expense' ? 'Add an expense' : 'Add money received'}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close transaction form"><X size={21}/></button></div>
    <form onSubmit={e => {
      e.preventDefault();
      if (!Number.isFinite(Number(amount)) || Number(amount) <= 0 || !category.trim() || ['__proto__', 'constructor', 'prototype'].includes(category.trim()) || !date || date > localDate()) { setError('Enter a positive amount, a category, and a date up to today.'); return; }
      onSave({ type, amount: Number(amount), category: category.trim(), note: note.trim(), date, paymentMode }); onClose();
    }}>
      <div className="segmented"><button type="button" aria-pressed={type === 'expense'} className={type === 'expense' ? 'selected' : ''} onClick={() => { setType('expense'); setCategory(''); }}><ArrowUpRight size={16}/>Expense</button><button type="button" aria-pressed={type === 'income'} className={type === 'income' ? 'selected' : ''} onClick={() => { setType('income'); setCategory(''); }}><ArrowDownLeft size={16}/>Money received</button></div>
      <label className="field">Amount ({currencySymbol})<input type="number" inputMode="decimal" min="0.01" step="0.01" max="1000000000" required value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="amount-input"/></label>
      <div className="quick-amounts">{[50, 100, 200, 500].map(value => <button type="button" key={value} onClick={() => setAmount(String(value))}>{currencySymbol}{value}</button>)}</div>
      <label className="field">Category<input list="category-options" required maxLength={60} value={category} onChange={e => setCategory(e.target.value)} placeholder="Choose or create a category"/><datalist id="category-options">{categories.map(cat => <option key={cat} value={cat}/>)}</datalist></label>
      <label className="field">Note <span className="muted">(optional)</span><textarea rows={2} maxLength={500} value={note} onChange={e => setNote(e.target.value)} placeholder={type === 'income' ? 'Who gave you the money? What was it for?' : 'What was this for?'}/></label>
      <div className="form-grid"><label className="field">Date<input required type="date" max={localDate()} value={date} onChange={e => setDate(e.target.value)}/></label><label className="field">Payment method<select value={paymentMode} onChange={e => setPaymentMode(e.target.value as PaymentMode)}>{['UPI (GPay/PhonePe)', 'Cash', 'Bank Transfer', 'Card'].map(mode => <option key={mode}>{mode}</option>)}</select></label></div>
      {error && <p role="alert" className="error-text">{error}</p>}
      <button className="primary-button full-width" type="submit">{type === 'income' ? 'Save money received' : 'Save expense'}</button>
      <p className="form-hint">Money received automatically increases the budget for the month of this entry.</p>
    </form>
  </dialog>;
}

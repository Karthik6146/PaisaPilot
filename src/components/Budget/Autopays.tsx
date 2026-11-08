import { useState } from 'react';
import { Plus, X, Repeat, Trash2, Pause, Play } from 'lucide-react';
import { Autopay, PaymentMode } from '../../types/finance';
import { Select } from '../Select';
import { Doodle } from '../Doodle';
interface Props { items: Autopay[]; currencySymbol: string; today: string; onChange: (items: Autopay[]) => void; }
const ordinal = (day: number) => day + (day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th');
export function Autopays({ items, currencySymbol, today, onChange }: Props) {
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const month = today.slice(0, 7);
  const sorted = [...items].sort((a, b) => Number(!a.active) - Number(!b.active) || a.day - b.day);
  const monthly = items.filter(a => a.active).reduce((sum, a) => sum + a.amount, 0);
  return <section className="panel autopay-panel">
    <div className="section-heading"><div><h2><Repeat size={18}/>Autopays</h2><p>Recorded every month on their day</p></div><button className="icon-button" aria-label={adding ? 'Close autopay form' : 'Add autopay'} onClick={() => setAdding(!adding)}>{adding ? <X size={18}/> : <Plus size={18}/>}</button></div>
    {adding && <form className="widget-form" onSubmit={e => {
      e.preventDefault(); const form = new FormData(e.currentTarget);
      const title = String(form.get('title')).trim(), amount = Number(form.get('amount')), day = Number(form.get('day')), note = String(form.get('note') || '').trim();
      if (!title || !Number.isFinite(amount) || amount <= 0 || !Number.isInteger(day) || day < 1 || day > 28) { setError('Add a name, positive amount and a day from 1 to 28.'); return; }
      // Joining after this month's day: skip this month so an old payment is not recorded twice.
      onChange([...items, { id: crypto.randomUUID(), title, amount, paymentMode: form.get('paymentMode') as PaymentMode, note, day, active: true, lastPaidMonth: day < Number(today.slice(8)) ? month : undefined }]); setAdding(false); setError('');
    }}><label className="field">Name<input name="title" required maxLength={100} placeholder="e.g. Spotify, Mutual fund SIP"/></label><div className="form-grid"><label className="field">Amount ({currencySymbol})<input name="amount" required type="number" min="0.01" max="1000000000" step="0.01" placeholder="0"/></label><label className="field">Day of month<input name="day" required type="number" min="1" max="28" step="1" placeholder="1-28"/></label></div><div className="field"><span aria-hidden="true">Payment method</span><Select label="Payment method" name="paymentMode" options={['UPI (GPay/PhonePe)', 'Cash', 'Bank Transfer', 'Card']}/></div><label className="field">Details <span className="muted">- optional</span><input name="note" maxLength={500} placeholder="e.g. Premium plan, auto-debit from SBI"/></label>{error && <p className="error-text" role="alert">{error}</p>}<button type="submit" className="primary-button full-width">Add autopay</button></form>}
    {sorted.length === 0 && !adding ? <div className="empty-small"><Doodle kind="repeat"/><h3>No autopays yet.</h3><p>Add a subscription or SIP and it is logged every month on its day.</p><button className="text-button" onClick={() => setAdding(true)}>+ Add an autopay</button></div> : <div className="priority-list">{sorted.map(item => <div className={'priority-row ' + (item.active ? '' : 'is-paid')} key={item.id}><button className="icon-button" aria-label={(item.active ? 'Pause ' : 'Resume ') + item.title} title={item.active ? 'Pause' : 'Resume'} onClick={() => onChange(items.map(a => a.id === item.id ? { ...a, active: !a.active } : a))}>{item.active ? <Pause size={14}/> : <Play size={14}/>}</button><div><strong>{item.title}</strong><small>{item.active ? (item.lastPaidMonth === month ? 'Paid this month' : 'Due on the ' + ordinal(item.day)) : 'Paused'} &#183; {item.paymentMode}{item.note ? ' \u00b7 ' + item.note : ''}</small></div><strong>{currencySymbol}{item.amount.toLocaleString('en-IN')}</strong><button className="icon-button" aria-label={'Remove autopay ' + item.title} onClick={() => onChange(items.filter(a => a.id !== item.id))}><Trash2 size={14}/></button></div>)}</div>}
    <div className="widget-footer"><span>Active autopays per month</span><strong>{currencySymbol}{monthly.toLocaleString('en-IN')}</strong></div>
  </section>;
}

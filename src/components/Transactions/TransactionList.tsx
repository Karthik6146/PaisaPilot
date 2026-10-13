import { useState } from 'react';
import { Plus, Search, Download, ArrowUpRight, ArrowDownLeft, Trash2 } from 'lucide-react';
import { Transaction, TransactionType } from '../../types/finance';
import { csvCell } from '../../../shared/finance.mjs';
import { exportFile } from '../../utils/exportFile';

interface Props { transactions: Transaction[]; onOpenAddModal: (type?: TransactionType) => void; onDeleteTransaction: (id: string) => void; currencySymbol: string; }
export function TransactionList({ transactions, onOpenAddModal, onDeleteTransaction, currencySymbol }: Props) {
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [category, setCategory] = useState('all');
  const [exportError, setExportError] = useState('');
  const [exporting, setExporting] = useState(false);
  const filtered = transactions.filter(tx => (type === 'all' || tx.type === type) && (category === 'all' || tx.category === category) && [tx.note, tx.category, ...(tx.tags || [])].join(' ').toLowerCase().includes(search.toLowerCase())).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
  const exportCSV = async () => {
    setExporting(true); setExportError('');
    const csv = [['Date', 'Type', 'Category', 'Amount', 'Payment method', 'Note'], ...filtered.map(t => [t.date, t.type, t.category, t.amount, t.paymentMode, t.note])].map(row => row.map(csvCell).join(',')).join('\r\n');
    try { await exportFile('paisapilot-spending.csv', csv, 'text/csv;charset=utf-8'); }
    catch { setExportError('Export was not completed. Try again and choose where to save or share it.'); }
    finally { setExporting(false); }
  };
  return <section className="panel">
    <div className="section-heading"><div><span className="eyebrow">THE LITTLE THINGS ADD UP</span><h2>Spending history</h2></div><div className="button-group"><button disabled={exporting} className="secondary-button" onClick={exportCSV}><Download size={16}/>Export CSV</button><button className="primary-button" onClick={() => onOpenAddModal('expense')}><Plus size={16}/>Add expense</button></div></div>
    {exportError && <p role="alert" className="inline-warning">{exportError}</p>}
    <div className="history-controls"><label className="search-field"><Search size={17}/><input aria-label="Search spending" placeholder="Search notes or categories" value={search} onChange={e => setSearch(e.target.value)}/></label><select aria-label="Filter transaction type" value={type} onChange={e => setType(e.target.value)}><option value="all">All types</option><option value="expense">Expenses</option><option value="income">Income</option></select><select aria-label="Filter category" value={category} onChange={e => setCategory(e.target.value)}><option value="all">All categories</option>{[...new Set(transactions.map(t => t.category))].map(c => <option key={c}>{c}</option>)}</select></div>
    <div className="history-totals"><span>{filtered.length} records</span><span>Expenses <strong>{currencySymbol}{filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0).toLocaleString('en-IN')}</strong></span><span>Income <strong>{currencySymbol}{filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0).toLocaleString('en-IN')}</strong></span></div>
    {filtered.length === 0 ? <div className="empty-state"><span className="soft-icon"><ArrowLeftRightIcon/></span><h3>{transactions.length ? 'No matching records' : 'Your story starts here.'}</h3><p>{transactions.length ? 'Try another search or filter.' : 'Log your first expense to see where your pocket money goes.'}</p><button className="secondary-button" onClick={() => onOpenAddModal('expense')}>Add your first expense</button></div> :
      <div className="transaction-rows">{filtered.map(tx => <div className="transaction-row" key={tx.id}><span className={'transaction-icon ' + tx.type}>{tx.type === 'expense' ? <ArrowUpRight size={18}/> : <ArrowDownLeft size={18}/>}</span><div className="transaction-description"><strong>{tx.note || tx.category}</strong><small>{tx.category} &#183; {tx.paymentMode}</small></div><time>{new Date(tx.date + 'T12:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</time><strong className={'transaction-amount ' + tx.type}>{tx.type === 'expense' ? '-' : '+'}{currencySymbol}{tx.amount.toLocaleString('en-IN')}</strong><button className="icon-button" aria-label={'Delete ' + (tx.note || tx.category)} onClick={() => { if (window.confirm('Delete this record? This also releases a linked priority purchase.')) onDeleteTransaction(tx.id); }}><Trash2 size={16}/></button></div>)}</div>}
  </section>;
}
function ArrowLeftRightIcon() { return <ArrowUpRight size={25}/>; }

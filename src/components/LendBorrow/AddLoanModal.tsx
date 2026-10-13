import React, { useEffect, useRef, useState } from 'react';
import { X, Users, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { LoanType } from '../../types/finance';
import { localDate } from '../../utils/dates';
import { sound } from '../../utils/sound';

interface AddLoanModalProps {
  isOpen: boolean;
  defaultType?: LoanType;
  onClose: () => void;
  onAddLoan: (loanData: {
    type: LoanType;
    personName: string;
    personContact?: string;
    originalAmount: number;
    dateTaken: string;
    dueDate: string;
    note: string;
  }) => void;
  currencySymbol: string;
}

export const AddLoanModal: React.FC<AddLoanModalProps> = ({
  isOpen,
  defaultType = 'lent',
  onClose,
  onAddLoan,
  currencySymbol,
}) => {
  const [type, setType] = useState<LoanType>(defaultType);
  const [personName, setPersonName] = useState('');
  const [personContact, setPersonContact] = useState('');
  const [amount, setAmount] = useState('');
  const [dateTaken, setDateTaken] = useState(() => localDate());

  // Default target due date 7 days ahead
  const [dueDate, setDueDate] = useState(() => { const due = new Date(); due.setDate(due.getDate() + 7); return localDate(due); });

  const [note, setNote] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const element = dialog.current;
    if (isOpen) { element?.showModal(); element?.querySelector('input')?.focus(); }
    return () => { element?.close(); previous?.focus(); };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!personName.trim() || !Number.isFinite(numAmount) || numAmount <= 0 || numAmount > 1e9) return;

    sound.click();
    onAddLoan({
      type,
      personName: personName.trim(),
      personContact: personContact.trim(),
      originalAmount: numAmount,
      dateTaken,
      dueDate,
      note: note.trim() || (type === 'lent' ? 'Money lent to friend' : 'Money borrowed'),
    });

    onClose();
  };

  return (
    <dialog ref={dialog} className="personal-dialog loan-dialog" aria-labelledby="loan-title" onCancel={onClose}>
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          aria-label="Close loan form"
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-xl bg-slate-800/60"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-2xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 id="loan-title" className="text-lg font-bold text-slate-100">Add loan or debt</h2>
            <p className="text-xs text-slate-400">Keep track of who owes who and avoid awkward reminders</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type Toggle */}
          <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
            <button
              type="button"
              aria-pressed={type === 'lent'}
              onClick={() => {
                sound.click();
                setType('lent');
              }}
              className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                type === 'lent'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              I Lent Money (They Owe Me)
            </button>
            <button
              type="button"
              aria-pressed={type === 'borrowed'}
              onClick={() => {
                sound.click();
                setType('borrowed');
              }}
              className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                type === 'borrowed'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              I Borrowed (I Owe Them)
            </button>
          </div>

          <div>
            <label className="text-xs text-slate-400 font-medium block mb-1">
              Friend's Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              aria-label="Friend's name"
              required
              maxLength={100}
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              placeholder="e.g. Aman, Priya, Rohit"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1">
                Amount ({currencySymbol}) <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                aria-label="Loan amount"
                inputMode="decimal"
                required
                min="0.01"
                max="1000000000"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="250"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono text-sm focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1">WhatsApp / Phone (Optional)</label>
              <input
                type="text"
                aria-label="Phone (optional)"
                maxLength={40}
                value={personContact}
                onChange={(e) => setPersonContact(e.target.value)}
                placeholder="+91 98765..."
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1">Date Given / Taken</label>
              <input
                type="date"
                aria-label="Date given or taken"
                required
                value={dateTaken}
                onChange={(e) => setDateTaken(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1">Expected Return Due Date</label>
              <input
                type="date"
                aria-label="Expected return date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 font-medium block mb-1">Reason / Note</label>
            <input
              type="text"
              aria-label="Reason or note"
              maxLength={500}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Dinner split or travel"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className={`w-full py-3 rounded-2xl font-bold text-sm text-white shadow-lg transition-all ${
                type === 'lent'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/20'
                  : 'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 shadow-rose-500/20'
              }`}
            >
              Save to Udhaar Tracker
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
};


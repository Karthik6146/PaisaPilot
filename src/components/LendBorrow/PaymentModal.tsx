import React, { useEffect, useRef, useState } from 'react';
import { X, DollarSign } from 'lucide-react';
import { LoanItem } from '../../types/finance';
import { localDate } from '../../utils/dates';
import { sound } from '../../utils/sound';

interface PaymentModalProps {
  isOpen: boolean;
  loan: LoanItem | null;
  onClose: () => void;
  onAddPayment: (loanId: string, paymentData: { amount: number; date: string; note?: string }) => void;
  currencySymbol: string;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  loan,
  onClose,
  onAddPayment,
  currencySymbol,
}) => {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => localDate());
  const [note, setNote] = useState('UPI repayment');
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const element = dialog.current;
    if (isOpen) { element?.showModal(); element?.querySelector('input')?.focus(); }
    return () => { element?.close(); previous?.focus(); };
  }, [isOpen]);

  if (!isOpen || !loan) return null;

  const paidSoFar = (loan.payments || []).reduce((s, p) => s + p.amount, 0);
  const remainingDue = Math.max(0, loan.originalAmount - paidSoFar);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!Number.isFinite(numAmount) || numAmount <= 0 || numAmount > remainingDue) return;

    sound.coin();
    onAddPayment(loan.id, {
      amount: numAmount,
      date,
      note: note.trim(),
    });

    onClose();
  };

  return (
    <dialog ref={dialog} className="personal-dialog loan-dialog" aria-labelledby="repayment-title" onCancel={onClose}>
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          aria-label="Close repayment form"
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-xl bg-slate-800/60"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <h2 id="repayment-title" className="text-base font-bold text-slate-100">Log Repayment</h2>
            <p className="text-xs text-slate-400">
              {loan.type === 'lent' ? `From ${loan.personName}` : `Paid to ${loan.personName}`}
            </p>
          </div>
        </div>

        {/* Current status pill */}
        <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 mb-4 flex justify-between items-center text-xs">
          <span className="text-slate-400">Remaining Balance:</span>
          <span className="font-mono font-bold text-emerald-400 text-sm">
            {currencySymbol}{remainingDue.toLocaleString()}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs text-slate-400 font-medium">Repayment Amount ({currencySymbol})</label>
              <button
                type="button"
                onClick={() => setAmount(String(remainingDue))}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium"
              >
                Full Settle ({currencySymbol}{remainingDue})
              </button>
            </div>
            <input
              type="number"
              aria-label="Repayment amount"
              inputMode="decimal"
              required
              min="0.01"
              max={remainingDue}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 100"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 font-medium block mb-1">Date</label>
            <input
              type="date"
              aria-label="Repayment date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 font-medium block mb-1">Note / Payment Method</label>
            <input
              type="text"
              aria-label="Note or payment method"
              maxLength={500}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Bank transfer / Cash"
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 rounded-2xl font-bold text-xs bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/20 transition-all"
            >
              Record Repayment
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
};


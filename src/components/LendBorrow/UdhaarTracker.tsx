import React, { useState } from 'react';
import {
  Users,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  CheckCircle2,
  Clock,
  MessageCircle,
  DollarSign,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

import { LoanItem, LoanType } from '../../types/finance';
import { localDate } from '../../utils/dates';
import { sound } from '../../utils/sound';

interface UdhaarTrackerProps {
  loans: LoanItem[];
  onOpenAddModal: (defaultType?: LoanType) => void;
  onOpenRepayModal: (loan: LoanItem) => void;
  onSettleLoan: (loanId: string) => void;
  onDeleteLoan: (loanId: string) => void;
  currencySymbol: string;
}

export const UdhaarTracker: React.FC<UdhaarTrackerProps> = ({
  loans,
  onOpenAddModal,
  onOpenRepayModal,
  onSettleLoan,
  onDeleteLoan,
  currencySymbol,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'lent' | 'borrowed'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'settled'>('active');
  const [expandedLoanId, setExpandedLoanId] = useState<string | null>(null);

  const todayStr = localDate();

  const filteredLoans = loans.filter((loan) => {
    if (activeTab !== 'all' && loan.type !== activeTab) return false;
    if (filterStatus === 'active' && loan.isSettled) return false;
    if (filterStatus === 'settled' && !loan.isSettled) return false;
    return true;
  });

  // Calculate totals
  let totalLentPending = 0;
  let totalBorrowedPending = 0;
  let overdueCount = 0;

  loans.forEach((loan) => {
    if (loan.isSettled) return;
    const paid = (loan.payments || []).reduce((s, p) => s + p.amount, 0);
    const rem = Math.max(0, loan.originalAmount - paid);

    if (loan.type === 'lent') {
      totalLentPending += rem;
    } else {
      totalBorrowedPending += rem;
    }

    if (new Date(loan.dueDate) < new Date(todayStr)) {
      overdueCount++;
    }
  });

  const handleSettle = (loan: LoanItem) => {
    sound.success();
    onSettleLoan(loan.id);
  };

  const generateWhatsAppReminder = (loan: LoanItem, remaining: number) => {
    sound.click();
    const text =
      loan.type === 'lent'
        ? `Hey ${loan.personName}! Hope you're doing great. Just a friendly reminder about the ${currencySymbol}${remaining} from our earlier split for "${loan.note}". You can UPI/GPay me whenever you get time. Thanks!`
        : `Hey ${loan.personName}! Just wanted to let you know I'm preparing to return the ${currencySymbol}${remaining} I borrowed for "${loan.note}". Please send your UPI ID or QR!`;

    const encoded = encodeURIComponent(text);
    const cleanPhone = (loan.personContact || '').replace(/[^0-9]/g, '');

    if (cleanPhone.length >= 10) {
      window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank', 'noopener,noreferrer');
    } else {
      // Copy to clipboard
      navigator.clipboard.writeText(text).then(() => alert('Reminder copied. Paste it to your friend.')).catch(() => alert('Clipboard unavailable. Please copy the reminder manually.'));
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Udhaar Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-2xl p-4 flex items-center justify-between backdrop-blur-xl">
          <div>
            <div className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
              Lent to Friends (To Collect)
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-300 mt-1">
              {currencySymbol}{totalLentPending.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Money coming back to you</div>
          </div>
          <button
            onClick={() => onOpenAddModal('lent')}
            className="p-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-xl transition-all"
            title="Add Lent Entry"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-rose-950/30 border border-rose-500/20 rounded-2xl p-4 flex items-center justify-between backdrop-blur-xl">
          <div>
            <div className="text-xs text-rose-400 font-medium flex items-center gap-1.5">
              <ArrowDownLeft className="w-4 h-4 text-rose-400" />
              Borrowed (You Must Repay)
            </div>
            <div className="text-2xl font-bold font-mono text-rose-300 mt-1">
              {currencySymbol}{totalBorrowedPending.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Debts to clear soon</div>
          </div>
          <button
            onClick={() => onOpenAddModal('borrowed')}
            className="p-2.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-xl transition-all"
            title="Add Borrowed Entry"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between backdrop-blur-xl">
          <div>
            <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
              <Users className="w-4 h-4 text-purple-400" />
              Net Udhaar Balance
            </div>
            <div className={`text-2xl font-bold font-mono mt-1 ${
              totalLentPending >= totalBorrowedPending ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {totalLentPending >= totalBorrowedPending ? '+' : '-'}
              {currencySymbol}{Math.abs(totalLentPending - totalBorrowedPending).toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {overdueCount > 0 ? (
                <span className="text-rose-400 font-medium">{overdueCount} overdue reminders!</span>
              ) : (
                'All debts up to date'
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 backdrop-blur-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => {
              sound.click();
              setActiveTab('all');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'all' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Khata
          </button>
          <button
            onClick={() => {
              sound.click();
              setActiveTab('lent');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'lent' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Lent (Owed to Me)
          </button>
          <button
            onClick={() => {
              sound.click();
              setActiveTab('borrowed');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'borrowed' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Borrowed (I Owe)
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => {
                sound.click();
                setFilterStatus('active');
              }}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                filterStatus === 'active' ? 'bg-slate-800 text-slate-200' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => {
                sound.click();
                setFilterStatus('settled');
              }}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                filterStatus === 'settled' ? 'bg-slate-800 text-slate-200' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Settled
            </button>
            <button
              onClick={() => {
                sound.click();
                setFilterStatus('all');
              }}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                filterStatus === 'all' ? 'bg-slate-800 text-slate-200' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Both
            </button>
          </div>

          <button
            onClick={() => {
              sound.click();
              onOpenAddModal();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium shadow-lg shadow-purple-600/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            + New Debt / Udhaar
          </button>
        </div>
      </div>

      {/* Debts List */}
      <div className="space-y-3">
        {filteredLoans.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-8 text-center">
            <Sparkles className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <h4 className="text-slate-300 font-medium text-sm">No Udhaar records in this view</h4>
            <p className="text-slate-500 text-xs mt-1">
              Keep your money relationships clear and stress-free by logging small splits and loans.
            </p>
          </div>
        ) : (
          filteredLoans.map((loan) => {
            const paidSoFar = (loan.payments || []).reduce((s, p) => s + p.amount, 0);
            const remaining = Math.max(0, loan.originalAmount - paidSoFar);
            const progressPercent = Math.min(100, Math.round((paidSoFar / loan.originalAmount) * 100));

            // Due date calculations
            const dueDate = new Date(loan.dueDate);
            const today = new Date(todayStr);
            const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            let dueStatusClass = 'bg-slate-800 text-slate-300 border-slate-700';
            let dueStatusText = `Due in ${diffDays} days`;

            if (loan.isSettled) {
              dueStatusClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
              dueStatusText = 'Fully Settled';
            } else if (diffDays < 0) {
              dueStatusClass = 'bg-rose-500/20 text-rose-300 border-rose-500/30';
              dueStatusText = `Overdue by ${Math.abs(diffDays)}d!`;
            } else if (diffDays === 0) {
              dueStatusClass = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
              dueStatusText = 'Due Today!';
            } else if (diffDays <= 2) {
              dueStatusClass = 'bg-amber-500/15 text-amber-400 border-amber-500/20';
              dueStatusText = `Due in ${diffDays}d`;
            }

            const isExpanded = expandedLoanId === loan.id;

            return (
              <div
                key={loan.id}
                className={`bg-slate-900/80 border rounded-2xl p-4 transition-all backdrop-blur-xl ${
                  loan.isSettled
                    ? 'border-slate-800/60 opacity-70'
                    : diffDays < 0
                    ? 'border-rose-500/30 bg-rose-950/10'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  {/* Left: Info */}
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2.5 rounded-xl border mt-0.5 ${
                        loan.type === 'lent'
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                      }`}
                    >
                      {loan.type === 'lent' ? (
                        <ArrowUpRight className="w-5 h-5" />
                      ) : (
                        <ArrowDownLeft className="w-5 h-5" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-100 text-sm">{loan.personName}</span>
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                            loan.type === 'lent'
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20'
                              : 'bg-rose-500/15 text-rose-300 border-rose-500/20'
                          }`}
                        >
                          {loan.type === 'lent' ? 'Lent (Owes you)' : 'Borrowed (You owe)'}
                        </span>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full border ${dueStatusClass}`}>
                          {dueStatusText}
                        </span>
                      </div>

                      <div className="text-xs text-slate-400 mt-1 flex items-center gap-3 flex-wrap">
                        <span>{loan.note}</span>
                        <span className="text-slate-600">•</span>
                        <span className="flex items-center gap-1 text-[11px] text-slate-500">
                          <Calendar className="w-3 h-3" />
                          Taken: {loan.dateTaken}
                        </span>
                        {loan.dueDate && (
                          <span className="flex items-center gap-1 text-[11px] text-slate-500">
                            <Clock className="w-3 h-3" />
                            Target: {loan.dueDate}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Amounts & Status */}
                  <div className="text-right flex flex-col items-end">
                    <div className="text-xs text-slate-400">
                      Total: <span className="font-mono text-slate-300">{currencySymbol}{loan.originalAmount}</span>
                    </div>
                    <div className="text-lg font-bold font-mono text-slate-100">
                      {remaining > 0 ? (
                        <span className={loan.type === 'lent' ? 'text-emerald-400' : 'text-rose-400'}>
                          {currencySymbol}{remaining.toLocaleString()} left
                        </span>
                      ) : (
                        <span className="text-emerald-400 flex items-center gap-1 text-sm font-semibold">
                          <CheckCircle2 className="w-4 h-4" /> Settled
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress bar of repayment */}
                <div className="mt-3 pt-3 border-t border-slate-800/80">
                  <div className="flex justify-between items-center text-[11px] text-slate-400 mb-1">
                    <span>
                      Repaid: {currencySymbol}{paidSoFar} of {currencySymbol}{loan.originalAmount}
                    </span>
                    <span className="font-mono font-medium text-slate-300">{progressPercent}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        loan.type === 'lent' ? 'bg-emerald-500' : 'bg-indigo-500'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Action buttons */}
                <div className="mt-3 flex items-center justify-between flex-wrap gap-2 pt-2">
                  <div className="flex items-center gap-2">
                    {!loan.isSettled && (
                      <>
                        <button
                          onClick={() => {
                            sound.click();
                            onOpenRepayModal(loan);
                          }}
                          className="text-xs px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 flex items-center gap-1 transition-all"
                        >
                          <DollarSign className="w-3.5 h-3.5 text-purple-400" />
                          Log Repayment
                        </button>
                        <button
                          onClick={() => handleSettle(loan)}
                          className="text-xs px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 transition-all"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Settle in Full
                        </button>
                        <button
                          onClick={() => generateWhatsAppReminder(loan, remaining)}
                          className="text-xs px-2.5 py-1.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/30 flex items-center gap-1 transition-all"
                          title="Generate polite WhatsApp reminder message"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          WhatsApp Reminder
                        </button>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {loan.payments && loan.payments.length > 0 && (
                      <button
                        onClick={() => setExpandedLoanId(isExpanded ? null : loan.id)}
                        className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
                      >
                        <span>{loan.payments.length} Payments</span>
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (confirm(`Delete debt record for ${loan.personName}?`)) {
                          onDeleteLoan(loan.id);
                        }
                      }}
                      className="text-[11px] text-slate-500 hover:text-rose-400 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Expanded Repayment History */}
                {isExpanded && loan.payments && (
                  <div className="mt-3 p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-1.5 text-xs font-mono">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">
                      Payment History:
                    </div>
                    {loan.payments.map((p) => (
                      <div key={p.id} className="flex justify-between items-center text-slate-300 py-0.5 border-b border-slate-800/40">
                        <span className="flex items-center gap-2">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>{p.date}</span>
                          <span className="text-slate-500">{p.note || 'Repayment'}</span>
                        </span>
                        <span className="text-emerald-400 font-bold">
                          +{currencySymbol}{p.amount}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};


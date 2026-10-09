import React, { useState } from 'react';
import { HelpCircle, AlertTriangle, CheckCircle, ShieldAlert, Zap } from 'lucide-react';
import { FinancialStats } from '../../utils/calculations';
import { sound } from '../../utils/sound';

interface WhatIfSimulatorProps {
  stats: FinancialStats;
  currencySymbol: string;
  onConfirmExpense: (amount: number, note: string) => void;
}

export const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({
  stats,
  currencySymbol,
  onConfirmExpense,
}) => {
  const [simulatedAmount, setSimulatedAmount] = useState<number>(350);
  const [purchaseNote, setPurchaseNote] = useState<string>('Zomato late night delivery');

  const currentBalance = stats.availableToSpend;
  const daysLeft = stats.daysRemainingInMonth || 1;
  const currentDailyLimit = stats.dailySafeLimit;

  const newBalance = Math.max(0, currentBalance - simulatedAmount);
  const newDailyLimit = Math.max(0, Math.floor(newBalance / daysLeft * 100) / 100);
  const dailyDrop = currentDailyLimit - newDailyLimit;

  // Impact level
  let level: 'safe' | 'caution' | 'danger' = 'safe';
  let message = '';

  if (simulatedAmount > currentBalance) {
    level = 'danger';
    message = 'You do not have enough funds! This purchase will push you into negative balance.';
  } else if (newDailyLimit < 100 || simulatedAmount > currentBalance * 0.4) {
    level = 'danger';
    message = `Critical impact! This drops your daily spending room to just ${currencySymbol}${newDailyLimit}/day. You will struggle to survive the remaining ${daysLeft} days.`;
  } else if (dailyDrop > 50 || newDailyLimit < 180) {
    level = 'caution';
    message = `Moderate squeeze. Your daily allowance drops by ${currencySymbol}${dailyDrop}/day. You will need to cut back on optional spending.`;
  } else {
    level = 'safe';
    message = `Easily affordable! Only trims ${currencySymbol}${dailyDrop}/day from your daily allowance. Safe to go ahead!`;
  }

  const handleApply = () => {
    sound.expense();
    onConfirmExpense(simulatedAmount, purchaseNote || 'Simulated Expense');
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-xl">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="p-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
          <HelpCircle className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-100 text-base">"What-If" Expense Impact Simulator</h3>
          <p className="text-xs text-slate-400">
            Test unplanned purchases before spending to see how they impact your month-end survival.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left: Input & Slider */}
        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 font-medium block mb-1">
              What do you want to spend on?
            </label>
            <input
              type="text"
              value={purchaseNote}
              onChange={(e) => setPurchaseNote(e.target.value)}
              placeholder="e.g. Swiggy order, Campus hoodie, Movie ticket"
              className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs text-slate-400 font-medium">Estimated Cost</label>
              <span className="font-mono text-base font-bold text-amber-400">
                {currencySymbol}
                {simulatedAmount}
              </span>
            </div>

            <input
              type="range"
              min="50"
              max={Math.max(2000, currentBalance)}
              step="50"
              value={simulatedAmount}
              onChange={(e) => {
                sound.calcButton();
                setSimulatedAmount(Number(e.target.value));
              }}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
              <span>{currencySymbol}50</span>
              <span>{currencySymbol}{Math.round(currentBalance * 0.5)}</span>
              <span>{currencySymbol}{Math.max(2000, currentBalance)}</span>
            </div>
          </div>

          {/* Quick preset buttons */}
          <div className="flex gap-2 flex-wrap">
            {[100, 250, 500, 800, 1200].map((preset) => (
              <button
                key={preset}
                onClick={() => {
                  sound.click();
                  setSimulatedAmount(preset);
                }}
                className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/70 transition-all font-mono"
              >
                {currencySymbol}{preset}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Simulation Impact Analysis */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              Impact on your {daysLeft} Days Runway
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                <div className="text-[11px] text-slate-400">Daily Allowance Now</div>
                <div className="text-lg font-bold font-mono text-slate-200">
                  {currencySymbol}{currentDailyLimit}
                  <span className="text-xs font-normal text-slate-500">/day</span>
                </div>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                <div className="text-[11px] text-slate-400">After This Spend</div>
                <div className={`text-lg font-bold font-mono ${
                  level === 'danger' ? 'text-rose-400' : level === 'caution' ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {currencySymbol}{newDailyLimit}
                  <span className="text-xs font-normal text-slate-500">/day</span>
                </div>
              </div>
            </div>

            {/* Verdict Card */}
            <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
              level === 'danger'
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                : level === 'caution'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            }`}>
              {level === 'danger' ? (
                <ShieldAlert className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
              ) : level === 'caution' ? (
                <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
              ) : (
                <CheckCircle className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
              )}
              <div className="text-xs leading-relaxed">
                <span className="font-semibold block mb-0.5">
                  {level === 'danger' ? 'High Risk Spending' : level === 'caution' ? 'Tight Squeeze' : 'Affordable Purchase'}
                </span>
                {message}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80">
            <button
              onClick={handleApply}
              disabled={simulatedAmount <= 0}
              className="w-full py-2.5 px-3 rounded-xl font-medium text-xs bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <Zap className="w-3.5 h-3.5" />
              Proceed & Log as Real Expense ({currencySymbol}{simulatedAmount})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


import React, { useState } from 'react';
import { Calculator as CalcIcon, Delete, History, ArrowDownToLine, Users, Share2 } from 'lucide-react';
import { sound } from '../../utils/sound';
import { arithmetic } from '../../utils/arithmetic';

interface TactileCalculatorProps {
  onPushToExpense: (amount: number) => void;
  onPushToIncome: (amount: number) => void;
  onPushToUdhaar: (amount: number) => void;
  currencySymbol: string;
}

export const TactileCalculator: React.FC<TactileCalculatorProps> = ({
  onPushToExpense,
  onPushToIncome,
  onPushToUdhaar,
  currencySymbol,
}) => {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const handleDigit = (digit: string) => {
    sound.calcButton();
    setDisplay((prev) => (prev === '0' ? digit : prev + digit));
  };

  const handleOperator = (op: string) => {
    sound.calcButton();
    if (expression && !['+', '-', '*', '/'].includes(expression.slice(-1))) {
      setExpression(`${expression} ${display} ${op}`);
    } else {
      setExpression(`${display} ${op}`);
    }
    setDisplay('0');
  };

  const handleClear = () => {
    sound.click();
    setDisplay('0');
    setExpression('');
  };

  const handleDelete = () => {
    sound.click();
    setDisplay((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'));
  };

  const handleEqual = () => {
    sound.click();
    if (!expression) return;
    try {
      const fullExpr = `${expression} ${display}`;
      // Clean safe expression
      const cleanExpr = fullExpr.replace(/[^0-9+\-*/().]/g, '');
      const result = arithmetic(cleanExpr);
      if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
        const rounded = Math.round(result * 100) / 100;
        setHistory((prev) => [`${fullExpr} = ${rounded}`, ...prev.slice(0, 7)]);
        setDisplay(String(rounded));
        setExpression('');
      }
    } catch {
      setDisplay('Error');
    }
  };

  const applyPercent = () => {
    sound.click();
    const val = parseFloat(display);
    if (!isNaN(val)) {
      setDisplay(String(val / 100));
    }
  };

  const applyModifier = (type: string) => {
    sound.click();
    const val = parseFloat(display);
    if (isNaN(val) || val === 0) return;

    if (type === 'gst5') {
      const res = Math.round(val * 1.05 * 100) / 100;
      setDisplay(String(res));
    } else if (type === 'gst18') {
      const res = Math.round(val * 1.18 * 100) / 100;
      setDisplay(String(res));
    } else if (type === 'disc10') {
      const res = Math.round(val * 0.9 * 100) / 100;
      setDisplay(String(res));
    } else if (type === 'split2') {
      const res = Math.round((val / 2) * 100) / 100;
      setDisplay(String(res));
    } else if (type === 'split3') {
      const res = Math.round((val / 3) * 100) / 100;
      setDisplay(String(res));
    }
  };

  const currentVal = parseFloat(display) || 0;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl backdrop-blur-xl max-w-md mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl">
            <CalcIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 text-base">Tactile Personal Calculator</h3>
            <p className="text-[11px] text-slate-400">Fancy keypad with haptics & 1-click expense transfer</p>
          </div>
        </div>
        <button
          onClick={() => {
            sound.click();
            setShowHistory(!showHistory);
          }}
          className={`p-2 rounded-xl border transition-all ${
            showHistory
              ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
              : 'bg-slate-800/80 border-slate-700/60 text-slate-400 hover:text-slate-200'
          }`}
          title="Toggle Calculation Tape / History"
        >
          <History className="w-4 h-4" />
        </button>
      </div>

      {/* History Tape Drawer */}
      {showHistory && (
        <div className="mb-3 p-3 bg-slate-950/80 border border-purple-500/30 rounded-xl text-xs font-mono max-h-36 overflow-y-auto space-y-1">
          <div className="text-[10px] text-purple-400 uppercase font-semibold mb-1">Calculation Tape</div>
          {history.length === 0 ? (
            <div className="text-slate-500 italic">No calculations yet</div>
          ) : (
            history.map((item, idx) => (
              <div key={idx} className="text-slate-300 flex justify-between py-0.5 border-b border-slate-800/40">
                <span>{item}</span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Screen / Display */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 mb-3 text-right">
        <div className="text-xs text-slate-500 font-mono h-4 overflow-hidden">{expression || '\u00A0'}</div>
        <div className="text-2xl font-bold font-mono text-slate-100 tracking-wider truncate">
          <span className="text-purple-400 text-lg mr-1">{currencySymbol}</span>
          {display}
        </div>
      </div>

      {/* Personal Quick Modifiers Bar */}
      <div className="grid grid-cols-5 gap-1.5 mb-3">
        <button
          onClick={() => applyModifier('disc10')}
          className="text-[10px] py-1 rounded-lg bg-slate-800/70 hover:bg-slate-700/80 text-emerald-300 font-medium border border-emerald-500/20"
        >
          -10% Off
        </button>
        <button
          onClick={() => applyModifier('gst5')}
          className="text-[10px] py-1 rounded-lg bg-slate-800/70 hover:bg-slate-700/80 text-blue-300 font-medium border border-blue-500/20"
        >
          +5% GST
        </button>
        <button
          onClick={() => applyModifier('gst18')}
          className="text-[10px] py-1 rounded-lg bg-slate-800/70 hover:bg-slate-700/80 text-indigo-300 font-medium border border-indigo-500/20"
        >
          +18% GST
        </button>
        <button
          onClick={() => applyModifier('split2')}
          className="text-[10px] py-1 rounded-lg bg-slate-800/70 hover:bg-slate-700/80 text-purple-300 font-medium border border-purple-500/20"
        >
          ½ Split
        </button>
        <button
          onClick={() => applyModifier('split3')}
          className="text-[10px] py-1 rounded-lg bg-slate-800/70 hover:bg-slate-700/80 text-pink-300 font-medium border border-pink-500/20"
        >
          ⅓ Split
        </button>
      </div>

      {/* Calculator Buttons Grid */}
      <div className="grid grid-cols-4 gap-2 mb-4 font-mono font-medium">
        <button
          onClick={handleClear}
          className="p-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all active:scale-95"
        >
          AC
        </button>
        <button
          onClick={handleDelete}
          className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all active:scale-95 flex items-center justify-center"
        >
          <Delete className="w-4 h-4" />
        </button>
        <button
          onClick={applyPercent}
          className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all active:scale-95"
        >
          %
        </button>
        <button
          onClick={() => handleOperator('/')}
          className="p-3 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 transition-all active:scale-95"
        >
          ÷
        </button>

        {['7', '8', '9'].map((d) => (
          <button
            key={d}
            onClick={() => handleDigit(d)}
            className="p-3 rounded-xl bg-slate-800/90 hover:bg-slate-750 text-slate-100 border border-slate-700/80 hover:border-slate-600 transition-all active:scale-95 text-base"
          >
            {d}
          </button>
        ))}
        <button
          onClick={() => handleOperator('*')}
          className="p-3 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 transition-all active:scale-95"
        >
          ×
        </button>

        {['4', '5', '6'].map((d) => (
          <button
            key={d}
            onClick={() => handleDigit(d)}
            className="p-3 rounded-xl bg-slate-800/90 hover:bg-slate-750 text-slate-100 border border-slate-700/80 hover:border-slate-600 transition-all active:scale-95 text-base"
          >
            {d}
          </button>
        ))}
        <button
          onClick={() => handleOperator('-')}
          className="p-3 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 transition-all active:scale-95"
        >
          −
        </button>

        {['1', '2', '3'].map((d) => (
          <button
            key={d}
            onClick={() => handleDigit(d)}
            className="p-3 rounded-xl bg-slate-800/90 hover:bg-slate-750 text-slate-100 border border-slate-700/80 hover:border-slate-600 transition-all active:scale-95 text-base"
          >
            {d}
          </button>
        ))}
        <button
          onClick={() => handleOperator('+')}
          className="p-3 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 transition-all active:scale-95"
        >
          +
        </button>

        <button
          onClick={() => handleDigit('0')}
          className="col-span-2 p-3 rounded-xl bg-slate-800/90 hover:bg-slate-750 text-slate-100 border border-slate-700/80 hover:border-slate-600 transition-all active:scale-95 text-base text-left pl-6"
        >
          0
        </button>
        <button
          onClick={() => {
            sound.calcButton();
            if (!display.includes('.')) setDisplay(display + '.');
          }}
          className="p-3 rounded-xl bg-slate-800/90 hover:bg-slate-750 text-slate-100 border border-slate-700/80 hover:border-slate-600 transition-all active:scale-95"
        >
          .
        </button>
        <button
          onClick={handleEqual}
          className="p-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold transition-all active:scale-95 shadow-lg shadow-purple-500/20"
        >
          =
        </button>
      </div>

      {/* 1-Click Action Hub: Send Result to Ledger */}
      <div className="pt-3 border-t border-slate-800/80 space-y-2">
        <div className="text-[11px] font-medium text-slate-400 text-center">
          Transfer Result ({currencySymbol}{currentVal}) Directly:
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            disabled={currentVal <= 0}
            onClick={() => {
              sound.click();
              onPushToExpense(currentVal);
            }}
            className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <ArrowDownToLine className="w-3.5 h-3.5" />
            + Expense
          </button>
          <button
            disabled={currentVal <= 0}
            onClick={() => {
              sound.click();
              onPushToIncome(currentVal);
            }}
            className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <Share2 className="w-3.5 h-3.5" />
            + Income
          </button>
          <button
            disabled={currentVal <= 0}
            onClick={() => {
              sound.click();
              onPushToUdhaar(currentVal);
            }}
            className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <Users className="w-3.5 h-3.5" />
            + Udhaar
          </button>
        </div>
      </div>
    </div>
  );
};


import React, { useState } from 'react';
import { FileCode, Calculator, Users, HelpCircle } from 'lucide-react';
import { SmartNoteCalc } from './SmartNoteCalc';
import { TactileCalculator } from './TactileCalculator';
import { BillSplitter } from './BillSplitter';
import { WhatIfSimulator } from './WhatIfSimulator';
import { ExpenseCategory } from '../../types/finance';
import { FinancialStats } from '../../utils/calculations';
import { sound } from '../../utils/sound';

interface CalculatorsHubProps {
  stats: FinancialStats;
  currencySymbol: string;
  onQuickAddExpense: (amount: number, note: string, category?: ExpenseCategory) => void;
  onPushToIncome: (amount: number) => void;
  onPushToUdhaar: (amount: number) => void;
  onAddLentLoans: (
    loans: { personName: string; amount: number; note: string; dueDate: string }[]
  ) => void;
  defaultSubTab?: string;
}

export const CalculatorsHub: React.FC<CalculatorsHubProps> = ({
  stats,
  currencySymbol,
  onQuickAddExpense,
  onPushToIncome,
  onPushToUdhaar,
  onAddLentLoans,
  defaultSubTab = 'smart-note',
}) => {
  const [subTab, setSubTab] = useState<'smart-note' | 'tactile' | 'split' | 'whatif'>(
    defaultSubTab as any || 'smart-note'
  );

  const subTabs = [
    {
      id: 'smart-note',
      label: 'Smart Note Calc',
      icon: FileCode,
      tag: 'Soulver & Numi',
    },
    {
      id: 'tactile',
      label: 'Tactile Keypad',
      icon: Calculator,
      tag: 'Tape & GST',
    },
    {
      id: 'split',
      label: 'Bill splitter',
      icon: Users,
      tag: 'Split & Udhaar',
    },
    {
      id: 'whatif',
      label: 'What-If Simulator',
      icon: HelpCircle,
      tag: 'Runway Impact',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Subtabs selector */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-2 backdrop-blur-xl flex items-center gap-1.5 overflow-x-auto">
        {subTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = subTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                sound.click();
                setSubTab(tab.id as any);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/25'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded-full font-medium ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {tab.tag}
              </span>
            </button>
          );
        })}
      </div>

      {/* Render active calculator component */}
      {subTab === 'smart-note' && (
        <SmartNoteCalc
          currencySymbol={currencySymbol}
          onQuickAddExpense={onQuickAddExpense}
        />
      )}

      {subTab === 'tactile' && (
        <TactileCalculator
          currencySymbol={currencySymbol}
          onPushToExpense={(amt) => onQuickAddExpense(amt, 'Calculator Expense')}
          onPushToIncome={onPushToIncome}
          onPushToUdhaar={onPushToUdhaar}
        />
      )}

      {subTab === 'split' && (
        <BillSplitter
          currencySymbol={currencySymbol}
          onAddLentLoans={onAddLentLoans}
        />
      )}

      {subTab === 'whatif' && (
        <WhatIfSimulator
          stats={stats}
          currencySymbol={currencySymbol}
          onConfirmExpense={(amt, note) => onQuickAddExpense(amt, note)}
        />
      )}
    </div>
  );
};


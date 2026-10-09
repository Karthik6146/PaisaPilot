import React, { useState, useMemo } from 'react';
import { Sparkles, PlusCircle, RotateCcw, FileText, CheckCircle2 } from 'lucide-react';
import { sound } from '../../utils/sound';
import { arithmetic } from '../../utils/arithmetic';
import { ExpenseCategory } from '../../types/finance';

interface SmartNoteCalcProps {
  onQuickAddExpense: (amount: number, note: string, category: ExpenseCategory) => void;
  currencySymbol: string;
}

interface ParsedLine {
  text: string;
  expression: string;
  result: number | null;
  label: string;
}

const TEMPLATES = [
  { name: 'Everyday spending', content: 'Groceries = 400\nCoffee 30 * 5\nTransport = 250' },
  { name: 'Weekend split', content: 'Dinner = 900\nTaxi = 240\nSplit between 3 friends' },
];

function parseNoteContent(noteContent: string): ParsedLine[] {
    const lines = noteContent.split('\n');
    let runningTotal = 0;

    return lines.map((line) => {
      const trimmed = line.trim();
      if (!trimmed) {
        return { text: line, expression: '', result: null, label: '' };
      }

      // Check for split keyword
      const splitMatch = trimmed.match(/split (?:between|among|by) (\d+)/i);
      if (splitMatch && runningTotal > 0) {
        const count = parseInt(splitMatch[1], 10) || 1;
        const perPerson = Math.round((runningTotal / count) * 100) / 100;
        return {
          text: line,
          expression: `Split between ${count}`,
          result: perPerson,
          label: `Per Person (${count})`,
        };
      }

      // Extract text label and mathematical part
      // E.g. "Chai 20 * 5", "Mess bill = 2400", "Books: 250 + 50"
      let exprPart = trimmed;
      let labelPart = '';

      if (trimmed.includes('=')) {
        const parts = trimmed.split('=');
        labelPart = parts[0].trim();
        exprPart = parts.slice(1).join('=').trim();
      } else if (trimmed.includes(':')) {
        const parts = trimmed.split(':');
        labelPart = parts[0].trim();
        exprPart = parts.slice(1).join(':').trim();
      } else {
        // Find where math symbols or digits begin
        const match = trimmed.match(/^([a-zA-Z\s&]+?)(\d.*)$/);
        if (match) {
          labelPart = match[1].trim();
          exprPart = match[2].trim();
        }
      }

      // Clean expression to only allow digits and basic math operators
      const sanitized = exprPart.replace(/[^0-9+\-*/().]/g, '');
      let calculatedResult: number | null = null;

      if (sanitized) {
        try {
          const res = arithmetic(sanitized);
          if (typeof res === 'number' && !isNaN(res) && isFinite(res)) {
            calculatedResult = Math.round(res * 100) / 100;
            runningTotal += calculatedResult;
          }
        } catch {
          calculatedResult = null;
        }
      }

      return {
        text: line,
        expression: exprPart,
        result: calculatedResult,
        label: labelPart || 'Expense',
      };
    });

}

export const SmartNoteCalc: React.FC<SmartNoteCalcProps> = ({
  onQuickAddExpense,
  currencySymbol,
}) => {
  const [noteContent, setNoteContent] = useState<string>(
    ''
  );
  const [addedLineIndex, setAddedLineIndex] = useState<number | null>(null);

  // Safe evaluation of mathematical expression inside note lines
  const parsedLines = useMemo(() => parseNoteContent(noteContent), [noteContent]);

  const grandTotal = useMemo(() => {
    return parsedLines.reduce((acc, curr) => (curr.result ? acc + curr.result : acc), 0);
  }, [parsedLines]);

  const handleAddLineToExpense = (line: ParsedLine, idx: number) => {
    if (!line.result) return;
    sound.expense();

    onQuickAddExpense(line.result, line.label || 'Notepad expense', 'Other');
    setAddedLineIndex(idx);
    setTimeout(() => setAddedLineIndex(null), 1800);
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-100 text-lg">Smart Note Calculator</h3>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-medium border border-indigo-500/30">
                Soulver & Numi Inspired
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Mix words and math naturally. Click any line to directly log it as an expense!
            </p>
          </div>
        </div>

        {/* Template Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.name}
              onClick={() => {
                sound.click();
                setNoteContent(tmpl.content);
              }}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/60 transition-all flex items-center gap-1.5"
            >
              <FileText className="w-3 h-3 text-indigo-400" />
              {tmpl.name}
            </button>
          ))}
          <button
            onClick={() => {
              sound.click();
              setNoteContent('');
            }}
            title="Clear notepad"
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Editor & Live Computation Columns */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-slate-950/60 border border-slate-800/90 rounded-xl p-3 min-h-[220px]">
        {/* Left: Input Textarea */}
        <div className="md:col-span-8 flex flex-col">
          <label className="text-[11px] font-medium text-slate-400 mb-1 flex items-center gap-1">
            <span>Personal scratchpad (Write notes & formulas freely)</span>
          </label>
          <textarea
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            placeholder="Type notes like:&#10;Mess fee = 2500&#10;Chai with friends 15 * 10&#10;Books 200 + 150"
            rows={7}
            className="w-full h-full min-h-[170px] bg-transparent text-slate-200 placeholder:text-slate-600 font-mono text-sm leading-6 resize-none focus:outline-none p-1"
          />
        </div>

        {/* Right: Real-time Evaluation Results */}
        <div className="md:col-span-4 border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-3 flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-medium text-slate-400 mb-1 flex justify-between">
              <span>Live Results</span>
              <span>Quick Log</span>
            </div>
            <div className="space-y-1.5 font-mono text-sm">
              {parsedLines.map((line, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between h-6 group text-xs px-1.5 rounded hover:bg-slate-800/50 transition-colors"
                >
                  <span className={line.result !== null ? 'text-emerald-400 font-semibold' : 'text-slate-600'}>
                    {line.result !== null ? `${currencySymbol}${line.result.toLocaleString()}` : '—'}
                  </span>

                  {line.result !== null && (
                    <button
                      onClick={() => handleAddLineToExpense(line, idx)}
                      title={`Log ${line.label}: ${currencySymbol}${line.result}`}
                      className={`text-[11px] flex items-center gap-1 px-1.5 py-0.5 rounded transition-all ${
                        addedLineIndex === idx
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 opacity-80 group-hover:opacity-100'
                      }`}
                    >
                      {addedLineIndex === idx ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Logged!</span>
                        </>
                      ) : (
                        <>
                          <PlusCircle className="w-3 h-3" />
                          <span>+ Expense</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Grand Total Footer */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between bg-slate-900/50 p-2.5 rounded-lg">
            <span className="text-xs text-slate-400 font-medium">Grand Total:</span>
            <span className="text-base font-bold text-indigo-400">
              {currencySymbol}{grandTotal.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};


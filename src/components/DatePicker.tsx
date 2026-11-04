import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { localDate } from '../utils/dates';
import { usePopover } from './popover';

interface Props {
  label: string; value: string; onChange: (value: string) => void;
  min?: string; max?: string; mode?: 'date' | 'month'; className?: string;
}
const pad = (n: number) => String(n).padStart(2, '0');
const iso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
const monthName = (m: number, month: 'short' | 'long') => new Date(2000, m, 1).toLocaleString('en-US', { month });
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

// Themed calendar replacing <input type="date|month">, whose native popup ignores the app's styles.
// Values keep the native formats: YYYY-MM-DD, or YYYY-MM in month mode.
export function DatePicker({ label, value, onChange, min, max, mode = 'date', className = '' }: Props) {
  const id = useId();
  const month = mode === 'month';
  const today = localDate();
  const toDate = (v: string) => new Date((month ? v + '-01' : v) + 'T12:00:00');
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<'days' | 'months'>('days');
  const [cursor, setCursor] = useState(() => toDate(value || today.slice(0, month ? 7 : 10)));
  const trigger = useRef<HTMLButtonElement>(null);
  const popup = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  const style = usePopover(open, close, trigger, popup, 272);
  const y = cursor.getFullYear(), m = cursor.getMonth();
  const daysIn = new Date(y, m + 1, 0).getDate();
  const allowed = (date: string) => !(min && date < min) && !(max && date > max);
  const monthAllowed = (mm: number) => month ? allowed(`${y}-${pad(mm + 1)}`) : !(min && iso(y, mm, new Date(y, mm + 1, 0).getDate()) < min) && !(max && iso(y, mm, 1) > max);
  const finish = (next?: string) => { if (next !== undefined) onChange(next); setOpen(false); trigger.current?.focus(); };
  const show = () => { setCursor(toDate(value || today.slice(0, month ? 7 : 10))); setView(month ? 'months' : 'days'); setOpen(true); };
  const move = (next: Date) => setCursor(next);
  useEffect(() => {
    if (!open) return;
    const target = view === 'days' ? `[data-date="${iso(y, m, cursor.getDate())}"]` : `[data-month="${m}"]`;
    popup.current?.querySelector<HTMLButtonElement>(target)?.focus({ preventScroll: true });
  }, [open, view, y, m, cursor, style]);
  const display = value ? toDate(value).toLocaleDateString('en-IN', month ? { month: 'long', year: 'numeric' } : { day: 'numeric', month: 'short', year: 'numeric' }) : 'Choose a date';
  const shift = (days: number, months = 0) => { const next = new Date(cursor); if (months) { next.setDate(1); next.setMonth(next.getMonth() + months); next.setDate(Math.min(cursor.getDate(), new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate())); } else next.setDate(next.getDate() + days); move(next); };
  return <div className={'date-picker ' + className}>
    <span id={id + '-label'} hidden>{label}</span>
    <button ref={trigger} type="button" role="combobox" aria-haspopup="dialog" aria-expanded={open} aria-controls={id + '-popup'}
      aria-labelledby={`${id}-label ${id}-value`} className="picker-trigger" onClick={() => open ? close() : show()}>
      <span id={id + '-value'} className="picker-value">{display}</span>
      <CalendarDays size={16} className="picker-icon" aria-hidden="true"/>
    </button>
    {open && <div ref={popup} id={id + '-popup'} role="dialog" aria-label={label} className="calendar popover" style={style}
      onKeyDown={e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); finish(); } }}>
      {view === 'days' ? <>
        <div className="calendar-header">
          <button type="button" className="calendar-title" aria-label="Choose month and year" onClick={() => setView('months')}>{monthName(m, 'long')} {y}</button>
          <div><button type="button" className="icon-button" aria-label="Show previous month" onClick={() => shift(0, -1)}><ChevronLeft size={17}/></button><button type="button" className="icon-button" aria-label="Show next month" onClick={() => shift(0, 1)}><ChevronRight size={17}/></button></div>
        </div>
        <div className="calendar-grid" role="grid" aria-label={`${monthName(m, 'long')} ${y}`}
          onKeyDown={e => {
            const keys: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [-7, 0], ArrowDown: [7, 0], PageUp: [0, -1], PageDown: [0, 1] };
            if (keys[e.key]) { e.preventDefault(); shift(...keys[e.key]); }
          }}>
          <div role="row" className="calendar-row">{WEEKDAYS.map(d => <span key={d} role="columnheader" className="calendar-weekday">{d}</span>)}</div>
          {Array.from({ length: Math.ceil((new Date(y, m, 1).getDay() + daysIn) / 7) }, (_, week) => <div role="row" className="calendar-row" key={week}>
            {Array.from({ length: 7 }, (_, col) => {
              const day = week * 7 + col - new Date(y, m, 1).getDay() + 1;
              if (day < 1 || day > daysIn) return <span key={col} role="gridcell"/>;
              const date = iso(y, m, day);
              return <span key={col} role="gridcell"><button type="button" data-date={date} tabIndex={day === cursor.getDate() ? 0 : -1} disabled={!allowed(date)}
                aria-label={new Date(y, m, day).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} aria-pressed={date === value} aria-current={date === today ? 'date' : undefined}
                className={'calendar-day' + (date === value ? ' selected' : '') + (date === today ? ' today' : '')} onClick={() => finish(date)}>{day}</button></span>;
            })}
          </div>)}
        </div>
        <div className="calendar-footer"><button type="button" className="text-button" disabled={!allowed(today)} onClick={() => finish(today)}>Today</button></div>
      </> : <>
        <div className="calendar-header">
          <span className="calendar-title static">{y}</span>
          <div><button type="button" className="icon-button" aria-label="Show previous year" onClick={() => move(new Date(y - 1, m, 1))}><ChevronLeft size={17}/></button><button type="button" className="icon-button" aria-label="Show next year" onClick={() => move(new Date(y + 1, m, 1))}><ChevronRight size={17}/></button></div>
        </div>
        <div className="calendar-months">{Array.from({ length: 12 }, (_, mm) => {
          const selected = value && toDate(value).getFullYear() === y && toDate(value).getMonth() === mm;
          return <button type="button" key={mm} data-month={mm} tabIndex={mm === m ? 0 : -1} disabled={!monthAllowed(mm)} aria-label={`${monthName(mm, 'long')} ${y}`} aria-pressed={!!selected}
            className={'calendar-month' + (selected ? ' selected' : '') + (`${y}-${pad(mm + 1)}` === today.slice(0, 7) ? ' today' : '')}
            onKeyDown={e => { const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -3, ArrowDown: 3 }[e.key]; if (step) { e.preventDefault(); move(new Date(y, m + step, 1)); } }}
            onClick={() => { if (month) finish(`${y}-${pad(mm + 1)}`); else { move(new Date(y, mm, Math.min(cursor.getDate(), new Date(y, mm + 1, 0).getDate()))); setView('days'); } }}>{monthName(mm, 'short')}</button>;
        })}</div>
        {month && <div className="calendar-footer"><button type="button" className="text-button" disabled={!allowed(today.slice(0, 7))} onClick={() => finish(today.slice(0, 7))}>This month</button></div>}
      </>}
    </div>}
  </div>;
}

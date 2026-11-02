import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { usePopover } from './popover';

type Option = string | { value: string; label: string };
interface Props {
  label: string; options: Option[]; value?: string; defaultValue?: string;
  onChange?: (value: string) => void; name?: string; className?: string;
}
// Themed replacement for <select>, whose native popup ignores the app's styles.
export function Select({ label, options, value, defaultValue, onChange, name, className = '' }: Props) {
  const id = useId();
  const items = options.map(o => typeof o === 'string' ? { value: o, label: o } : o);
  const [own, setOwn] = useState(defaultValue ?? items[0]?.value ?? '');
  const current = value ?? own;
  const selectedIndex = Math.max(0, items.findIndex(item => item.value === current));
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const button = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const close = useCallback(() => setOpen(false), []);
  const style = usePopover(open, close, button, list);
  const show = () => { setActive(selectedIndex); setOpen(true); };
  const choose = (i: number) => { setOwn(items[i].value); onChange?.(items[i].value); setOpen(false); };
  useEffect(() => {
    // Scroll only the list: scrollIntoView would also scroll the dialog behind it, which closes the popover.
    const option = document.getElementById(`${id}-${active}`), box = list.current;
    if (!open || !option || !box) return;
    if (option.offsetTop < box.scrollTop) box.scrollTop = option.offsetTop;
    else if (option.offsetTop + option.offsetHeight > box.scrollTop + box.clientHeight) box.scrollTop = option.offsetTop + option.offsetHeight - box.clientHeight;
  }, [open, active, id]);
  return <div className={'select ' + className}>
    <span id={id + '-label'} hidden>{label}</span>
    <button ref={button} type="button" role="combobox" aria-haspopup="listbox" aria-expanded={open} aria-controls={id + '-list'}
      aria-labelledby={`${id}-label ${id}-value`} aria-activedescendant={open ? `${id}-${active}` : undefined} className="picker-trigger"
      onClick={() => open ? close() : show()}
      onKeyUp={e => { if (e.key === ' ') e.preventDefault(); }}
      onKeyDown={e => {
        const last = items.length - 1;
        if (!open) { if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) { e.preventDefault(); show(); } return; }
        if (e.key === 'ArrowDown') { e.preventDefault(); setActive(i => Math.min(last, i + 1)); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(i => Math.max(0, i - 1)); }
        else if (e.key === 'Home' || e.key === 'End') { e.preventDefault(); setActive(e.key === 'Home' ? 0 : last); }
        else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(active); }
        else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
        else if (e.key === 'Tab') close();
        else if (e.key.length === 1) {
          const key = e.key.toLowerCase();
          const next = items.findIndex((item, i) => i > active && item.label.toLowerCase().startsWith(key));
          const match = next >= 0 ? next : items.findIndex(item => item.label.toLowerCase().startsWith(key));
          if (match >= 0) setActive(match);
        }
      }}>
      <span id={id + '-value'} className="picker-value">{items[selectedIndex]?.label}</span>
      <ChevronDown size={17} className="picker-icon" aria-hidden="true"/>
    </button>
    {name && <input type="hidden" name={name} value={current}/>}
    {open && <ul ref={list} id={id + '-list'} role="listbox" aria-labelledby={id + '-label'} className="combobox-list popover" style={style} onMouseDown={e => e.preventDefault()}>
      {items.map((item, i) => <li key={item.value} id={`${id}-${i}`} role="option" aria-selected={i === selectedIndex}
        className={'combobox-option' + (i === active ? ' active' : '')} onMouseEnter={() => setActive(i)} onClick={() => choose(i)}>
        {item.label}{i === selectedIndex && <Check size={15}/>}
      </li>)}
    </ul>}
  </div>;
}

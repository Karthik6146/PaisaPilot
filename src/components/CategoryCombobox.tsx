import { useId, useState } from 'react';
import { Check, ChevronDown, Plus } from 'lucide-react';

interface Props {
  label: string; categories: string[]; placeholder?: string; name?: string;
  value?: string; onChange?: (value: string) => void;
}
// Styled replacement for <datalist>, whose native popup cannot be themed.
export function CategoryCombobox({ label, categories, placeholder, name, value, onChange }: Props) {
  const id = useId();
  const [own, setOwn] = useState('');
  const text = value ?? own;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const query = text.trim().toLowerCase();
  const matches = [...new Set(categories)].filter(cat => cat.toLowerCase().includes(query));
  const create = query && !categories.some(cat => cat.toLowerCase() === query) ? text.trim() : '';
  const options = create ? [...matches, create] : matches;
  const set = (next: string) => { setOwn(next); onChange?.(next); };
  const choose = (option: string) => { set(option); setOpen(false); setActive(-1); };
  const visible = open && options.length > 0;
  return <div className="field category-combobox">
    <label htmlFor={id}>{label}</label>
    <div className="combobox-control">
      <input id={id} name={name} role="combobox" aria-autocomplete="list" aria-expanded={visible} aria-controls={id + '-list'}
        aria-activedescendant={visible && active >= 0 ? `${id}-${active}` : undefined} autoComplete="off" required maxLength={60}
        value={text} placeholder={placeholder}
        onChange={e => { set(e.target.value); setOpen(true); setActive(-1); }}
        onFocus={() => setOpen(true)} onClick={() => setOpen(true)} onBlur={() => setOpen(false)}
        onKeyDown={e => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); setOpen(true); setActive(i => (i + (e.key === 'ArrowDown' ? 1 : -1) + options.length) % Math.max(1, options.length)); }
          else if (e.key === 'Enter' && visible && active >= 0) { e.preventDefault(); choose(options[active]); }
          else if (e.key === 'Escape' && visible) { e.preventDefault(); e.stopPropagation(); setOpen(false); }
        }}/>
      <ChevronDown size={17} className="combobox-chevron" aria-hidden="true"/>
    </div>
    {visible && <ul id={id + '-list'} role="listbox" aria-label={label} className="combobox-list" onMouseDown={e => e.preventDefault()}>
      {options.map((option, i) => {
        const isCreate = option === create && i === options.length - 1;
        return <li key={(isCreate ? 'new:' : '') + option} id={`${id}-${i}`} role="option" aria-selected={i === active}
          className={'combobox-option' + (i === active ? ' active' : '') + (isCreate ? ' create' : '')}
          onMouseEnter={() => setActive(i)} onClick={() => choose(option)}>
          {isCreate ? <><Plus size={15}/>Create “{option}”</> : <>{option}{option.toLowerCase() === query && <Check size={15}/>}</>}
        </li>;
      })}
    </ul>}
  </div>;
}

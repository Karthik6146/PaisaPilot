import { useState } from 'react';
import { Pin, Plus, Trash2, StickyNote } from 'lucide-react';
import { BudgetNote } from '../../types/finance';
interface Props { notes: BudgetNote[]; month: string; onChange: (notes: BudgetNote[]) => void; }
export function Notes({ notes, month, onChange }: Props) {
  const [text, setText] = useState('');
  const monthNotes = notes.filter(n => n.month === month).sort((a, b) => Number(b.pinned) - Number(a.pinned));
  return <section className="panel notes-panel"><div className="section-heading"><div><h2><StickyNote size={18}/>Notes to self</h2><p>A little space to think ahead.</p></div>{monthNotes.length > 0 && <span className="small-count">{monthNotes.length} {monthNotes.length === 1 ? 'note' : 'notes'}</span>}</div>
    <form className="note-composer" onSubmit={e => { e.preventDefault(); if (!text.trim()) return; onChange([...notes, { id: crypto.randomUUID(), month, text: text.trim(), pinned: false }]); setText(''); }}><label className="sr-only" htmlFor="budget-note">New budget note</label><textarea id="budget-note" rows={1} maxLength={1000} value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.currentTarget.form?.requestSubmit(); } }} placeholder="Write a reminder and press Enter"/><button type="submit" className="icon-button note-add" aria-label="Add note" disabled={!text.trim()}><Plus size={18}/></button></form>
    <div className="notes-list">{monthNotes.length === 0 && <p className="empty-note">Your reminders will live here.</p>}{monthNotes.map(note => <article key={note.id} className={'note-card ' + (note.pinned ? 'pinned' : '')}><p>{note.pinned && <span className="note-pinned">Pinned</span>}{note.text}</p><div><button className="icon-button" aria-label={(note.pinned ? 'Unpin' : 'Pin') + ' note: ' + note.text} aria-pressed={note.pinned} onClick={() => onChange(notes.map(n => n.id === note.id ? { ...n, pinned: !n.pinned } : n))}><Pin size={14}/></button><button className="icon-button" aria-label={'Delete note: ' + note.text} onClick={() => onChange(notes.filter(n => n.id !== note.id))}><Trash2 size={14}/></button></div></article>)}</div>
  </section>;
}

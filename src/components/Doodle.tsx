// Small hand-drawn style illustrations for empty states. Decorative only; the surrounding text carries the meaning.
const art = {
  sprout: <><path d="M26 54h20l-3 12H29z" /><path d="M36 54V34" /><path d="M36 42c-8 0-12-6-12-12 7 0 12 5 12 12z" /><path d="M36 36c8 0 12-6 12-12-7 0-12 5-12 12z" /><ellipse cx="36" cy="54" rx="12" ry="3" /></>,
  coins: <><ellipse cx="30" cy="48" rx="14" ry="5" /><path d="M16 48v6c0 3 6 5 14 5s14-2 14-5v-6" /><ellipse cx="42" cy="34" rx="14" ry="5" /><path d="M28 34v6c0 3 6 5 14 5s14-2 14-5v-6" /><path d="M39 31l3 6 3-6" /></>,
  repeat: <><path d="M22 40a14 14 0 0 1 24-10l4 4" /><path d="M50 26v8h-8" /><path d="M50 40a14 14 0 0 1-24 10l-4-4" /><path d="M22 54v-8h8" /></>,
  flag: <><path d="M26 60V20" /><path d="M26 22h22l-5 9 5 9H26" /><ellipse cx="26" cy="60" rx="10" ry="3" /></>,
};
export function Doodle({ kind }: { kind: keyof typeof art }) {
  return <svg className="doodle" viewBox="0 0 72 72" width="72" height="72" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{art[kind]}</svg>;
}

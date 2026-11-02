import { useEffect, useId, useRef } from 'react';
import { createRoot } from 'react-dom/client';

interface Options { title?: string; confirmLabel?: string; danger?: boolean; alert?: boolean }
// Themed, promise-based replacement for window.confirm/alert, whose native popups ignore the app's styles.
export function confirmAction(message: string, options: Options = {}): Promise<boolean> {
  return new Promise(resolve => {
    const host = document.body.appendChild(document.createElement('div'));
    const root = createRoot(host);
    const done = (result: boolean) => { root.unmount(); host.remove(); resolve(result); };
    root.render(<ConfirmDialog message={message} {...options} onDone={done}/>);
  });
}
export const notify = (message: string) => confirmAction(message, { alert: true, title: 'Heads up' }).then(() => undefined);

// eslint-disable-next-line react/only-export-components -- Internal component, rendered only through confirmAction.
function ConfirmDialog({ message, title = 'Are you sure?', confirmLabel = 'Confirm', danger, alert, onDone }: Options & { message: string; onDone: (result: boolean) => void }) {
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { const previous = document.activeElement as HTMLElement | null; dialog.current?.showModal(); return () => previous?.focus(); }, []);
  return <dialog ref={dialog} role="alertdialog" className="personal-dialog confirm-dialog" aria-labelledby={id + '-title'} aria-describedby={id + '-message'}
    onCancel={e => { e.preventDefault(); onDone(false); }}>
    <h2 id={id + '-title'}>{title}</h2>
    <p id={id + '-message'}>{message}</p>
    <div className="confirm-actions">
      {!alert && <button type="button" className="secondary-button" onClick={() => onDone(false)}>Cancel</button>}
      <button type="button" className={danger ? 'danger-button solid' : 'primary-button'} onClick={() => onDone(true)}>{alert ? 'OK' : confirmLabel}</button>
    </div>
  </dialog>;
}

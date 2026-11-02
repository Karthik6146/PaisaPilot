import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';

// Fixed positioning escapes scrolling dialogs; the popup flips upward when there is no room below.
export function usePopover(open: boolean, close: () => void, anchor: RefObject<HTMLElement | null>, popup: RefObject<HTMLElement | null>, width?: number) {
  const [style, setStyle] = useState<CSSProperties>({ visibility: 'hidden' });
  const onClose = useRef(close);
  useLayoutEffect(() => { onClose.current = close; });
  useLayoutEffect(() => {
    if (!open || !anchor.current) return;
    const rect = anchor.current.getBoundingClientRect();
    const w = Math.min(width ?? Math.max(rect.width, 200), innerWidth - 16);
    // Apply the final width before measuring, since narrower popups wrap and grow taller.
    // eslint-disable-next-line react/immutability -- Direct DOM write so the measurement below sees the final width.
    if (popup.current) popup.current.style.width = w + 'px';
    const height = popup.current?.offsetHeight ?? 0;
    const below = innerHeight - rect.bottom;
    const up = below < height + 12 && rect.top > below;
    // eslint-disable-next-line react/set-state-in-effect -- Position depends on layout measured after the popup mounts.
    setStyle({ position: 'fixed', left: Math.max(8, Math.min(rect.left, innerWidth - w - 8)), width: w, transformOrigin: up ? 'bottom' : 'top', ...(up ? { top: 'auto', bottom: innerHeight - rect.top + 6 } : { top: rect.bottom + 6, bottom: 'auto' }) });
  }, [open, anchor, popup, width]);
  useEffect(() => {
    if (!open) return;
    const outside = (e: PointerEvent) => { const target = e.target as Node; if (!anchor.current?.contains(target) && !popup.current?.contains(target)) onClose.current(); };
    const moved = (e: Event) => { if (!popup.current?.contains(e.target as Node)) onClose.current(); };
    const resized = () => onClose.current();
    document.addEventListener('pointerdown', outside);
    addEventListener('scroll', moved, true);
    addEventListener('resize', resized);
    return () => { document.removeEventListener('pointerdown', outside); removeEventListener('scroll', moved, true); removeEventListener('resize', resized); setStyle({ visibility: 'hidden' }); };
  }, [open, anchor, popup]);
  return style;
}

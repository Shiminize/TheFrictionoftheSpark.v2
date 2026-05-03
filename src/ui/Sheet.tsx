import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { IconButton } from './Button';
import { cx } from './classes';

const SHEET_CLOSE_DELAY_MS = 190;
const SHEET_ICON_SIZE = 16;

type SheetChildren = ReactNode | ((requestClose: () => void) => ReactNode);

interface SheetProps {
  children: SheetChildren;
  title: string;
  titleId: string;
  className?: string;
  closeLabel?: string;
  onClose: () => void;
}

export function Sheet({ children, title, titleId, className, closeLabel = 'Close', onClose }: SheetProps) {
  const [closing, setClosing] = useState(false);
  const closeTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (closeTimer.current) {
        window.clearTimeout(closeTimer.current);
      }
    };
  }, []);

  function requestClose() {
    if (closing) return;

    if (prefersReducedMotion()) {
      onClose();
      return;
    }

    setClosing(true);
    closeTimer.current = window.setTimeout(() => {
      closeTimer.current = null;
      onClose();
    }, SHEET_CLOSE_DELAY_MS);
  }

  return (
    <div className={cx('sheet-backdrop ui-sheet-backdrop', closing && 'closing')} role="presentation" onMouseDown={requestClose}>
      <section className={cx('bottom-sheet ui-sheet', closing && 'closing', className)} role="dialog" aria-modal="true" aria-labelledby={titleId} onMouseDown={(event) => event.stopPropagation()}>
        <header className="sheet-header ui-sheet-header">
          <h2 id={titleId}>{title}</h2>
          <IconButton label={closeLabel} variant="soft" onClick={requestClose}>
            <X size={SHEET_ICON_SIZE} />
          </IconButton>
        </header>
        {typeof children === 'function' ? children(requestClose) : children}
      </section>
    </div>
  );
}

function prefersReducedMotion() {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

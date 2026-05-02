import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { IconButton } from './Button';
import { cx } from './classes';

interface SheetProps {
  children: ReactNode;
  title: string;
  titleId: string;
  className?: string;
  closeLabel?: string;
  onClose: () => void;
}

export function Sheet({ children, title, titleId, className, closeLabel = 'Close', onClose }: SheetProps) {
  return (
    <div className="sheet-backdrop ui-sheet-backdrop" role="presentation" onMouseDown={onClose}>
      <section className={cx('bottom-sheet ui-sheet', className)} role="dialog" aria-labelledby={titleId} onMouseDown={(event) => event.stopPropagation()}>
        <header className="sheet-header ui-sheet-header">
          <h2 id={titleId}>{title}</h2>
          <IconButton label={closeLabel} variant="soft" onClick={onClose}>
            <X size={22} />
          </IconButton>
        </header>
        {children}
      </section>
    </div>
  );
}

import { cx } from './classes';

interface ChipRailItem {
  id: string;
  label: string;
}

interface ChipRailProps {
  activeId: string;
  ariaLabel: string;
  className?: string;
  items: ChipRailItem[];
  onSelect: (id: string) => void;
}

export function ChipRail({ activeId, ariaLabel, className, items, onSelect }: ChipRailProps) {
  return (
    <div className={cx('collection-rail ui-chip-rail', className)} aria-label={ariaLabel}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={cx('collection-pill ui-chip', item.id === activeId && 'active')}
          onClick={() => onSelect(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

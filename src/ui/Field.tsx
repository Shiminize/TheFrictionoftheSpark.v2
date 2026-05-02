import type { ReactNode } from 'react';
import { cx } from './classes';

interface FieldProps {
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export function Field({ children, icon, className }: FieldProps) {
  return (
    <label className={cx('search-field ui-field', className)}>
      {icon}
      {children}
    </label>
  );
}

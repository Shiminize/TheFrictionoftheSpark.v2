import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from './classes';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'plain' | 'filled' | 'soft' | 'chip';
  active?: boolean;
}

export function Button({ children, variant = 'plain', active = false, className, ...props }: ButtonProps) {
  return (
    <button className={cx('ui-button', `ui-button-${variant}`, active && 'active', className)} type="button" {...props}>
      {children}
    </button>
  );
}

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  children: ReactNode;
  variant?: 'plain' | 'filled' | 'soft';
}

export function IconButton({ label, children, variant = 'plain', className, ...props }: IconButtonProps) {
  return (
    <button
      className={cx('ui-icon-button', 'icon-button', `icon-button-${variant}`, className)}
      type="button"
      aria-label={label}
      title={label}
      {...props}
    >
      {children}
    </button>
  );
}

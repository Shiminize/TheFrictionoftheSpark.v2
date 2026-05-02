import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from './classes';

interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: 'article' | 'div' | 'section';
  children: ReactNode;
  interactive?: boolean;
  tone?: 'default' | 'accent' | 'danger';
}

export function Card({ as: Element = 'div', children, className, interactive = false, tone = 'default', ...props }: CardProps) {
  return (
    <Element className={cx('ui-card', `ui-card-${tone}`, interactive && 'ui-card-interactive', className)} {...props}>
      {children}
    </Element>
  );
}

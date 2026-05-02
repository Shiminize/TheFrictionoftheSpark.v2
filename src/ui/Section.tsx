import type { ReactNode } from 'react';
import { cx } from './classes';

interface SectionProps {
  children: ReactNode;
  title: string;
  titleId: string;
  action?: ReactNode;
  className?: string;
  description?: string;
}

export function Section({ children, title, titleId, action, className, description }: SectionProps) {
  return (
    <section className={cx('section-block ui-section', className)} aria-labelledby={titleId}>
      <div className="section-title-row ui-section-title-row">
        <div>
          <h2 id={titleId}>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

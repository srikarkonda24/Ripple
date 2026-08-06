// Wraps children in a fade-and-slide animation when they enter the viewport.

'use client';

import { useInView } from '@/hooks/useInView';

type AnimateInProps = {
  children: React.ReactNode;
  className?: string;
};

/**
 * Fades and slides content into view once the user scrolls to it.
 */
export function AnimateIn({ children, className = '' }: AnimateInProps) {
  const { ref, isInView } = useInView();
  const classes = `animate-in-wrapper ${isInView ? 'animate-in' : ''} ${className}`.trim();

  return (
    <div ref={ref as React.RefObject<HTMLDivElement>} className={classes}>
      {children}
    </div>
  );
}

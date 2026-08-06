// Reusable button with explicit primary, secondary, and ghost styles.

import type { ButtonVariant } from '@/types/landing';

type ButtonProps = {
  variant?: ButtonVariant;
  href?: string;
  type?: 'button' | 'submit';
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
};

/**
 * Renders a styled button or link with visible background and text colors.
 */
export function Button({
  variant = 'primary',
  href,
  type = 'button',
  disabled = false,
  className = '',
  children,
  onClick,
}: ButtonProps) {
  const classes = `btn btn-${variant} ${className}`.trim();

  if (href) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

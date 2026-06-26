import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  icon?: ReactNode;
}

export function Button({ variant = 'ghost', size = 'md', icon, children, className = '', ...props }: ButtonProps) {
  const base = 'btn';
  const variantClass = `btn-${variant}`;
  const sizeClass = `btn-${size}`;
  return (
    <button className={`${base} ${variantClass} ${sizeClass} ${className}`} {...props}>
      {icon && <span className="btn-icon">{icon}</span>}
      {children}
    </button>
  );
}

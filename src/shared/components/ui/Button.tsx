import { useState } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export function Button({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  ...props
}: ButtonProps) {
  const baseStyle = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 disabled:pointer-events-none cursor-pointer';

  const variants = {
    primary: 'bg-primary text-white hover:bg-primary/90 shadow-sm active:scale-98 transition-all',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 active:scale-98 transition-all',
    outline: 'border border-border bg-background hover:bg-muted hover:text-accent-foreground',
    ghost: 'hover:bg-muted hover:text-accent-foreground',
    destructive: 'bg-destructive text-white hover:bg-destructive/90 active:scale-98 transition-all',
  };

  const sizes = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 py-2 text-sm',
    lg: 'h-12 px-6 text-base',
    icon: 'h-10 w-10',
  };

  const variantClass = variants[variant];
  const sizeClass = sizes[size];

  return (
    <button
      className={`${baseStyle} ${variantClass} ${sizeClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

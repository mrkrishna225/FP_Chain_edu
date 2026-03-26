import { type ReactNode } from 'react';
import { cn } from '@/utils/lib_utils';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function GlassCard({ children, className, hover = false, onClick }: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        hover ? 'glass-card-hover cursor-pointer' : 'glass-card',
        'p-6',
        className
      )}
    >
      {children}
    </div>
  );
}

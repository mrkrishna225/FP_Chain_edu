import { cn } from '@/utils/lib_utils';
import type { Role } from '@/context/WalletContext';

const roleConfig: Record<string, { label: string; className: string }> = {
  STUDENT: { label: 'Student', className: 'bg-secondary/20 text-secondary border-secondary/30' },
  TEACHER: { label: 'Instructor', className: 'bg-primary/20 text-primary border-primary/30' },
  ADMIN: { label: 'Admin', className: 'bg-warning/20 text-warning border-warning/30' },
  instructor: { label: 'Instructor', className: 'bg-primary/20 text-primary border-primary/30' }, // fallback
  student: { label: 'Student', className: 'bg-secondary/20 text-secondary border-secondary/30' },
  admin: { label: 'Admin', className: 'bg-warning/20 text-warning border-warning/30' },
};

export function RoleBadge({ role, className }: { role: Role; className?: string }) {
  const config = roleConfig[role as string] || { label: role, className: '' };
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border', config.className, className)}>
      {config.label}
    </span>
  );
}

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'default';
const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-success/20 text-success border-success/30',
  warning: 'bg-warning/20 text-warning border-warning/30',
  error: 'bg-destructive/20 text-destructive border-destructive/30',
  info: 'bg-secondary/20 text-secondary border-secondary/30',
  default: 'bg-muted text-muted-foreground border-border',
};

export function StatusBadge({ children, variant = 'default', pulse, className }: {
  children: React.ReactNode; variant?: BadgeVariant; pulse?: boolean; className?: string;
}) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border',
      variantStyles[variant],
      pulse && variant === 'success' && 'pulse-glow-green',
      pulse && variant === 'warning' && 'pulse-glow-amber',
      pulse && variant === 'error' && 'pulse-glow-red',
      className
    )}>
      {pulse && <span className={cn('w-1.5 h-1.5 rounded-full', {
        'bg-success': variant === 'success',
        'bg-warning': variant === 'warning',
        'bg-destructive': variant === 'error',
      })} />}
      {children}
    </span>
  );
}

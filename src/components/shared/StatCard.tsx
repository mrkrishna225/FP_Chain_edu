import { type LucideIcon } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { cn } from '@/utils/lib_utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  accent?: 'primary' | 'secondary' | 'success' | 'warning';
  className?: string;
}

const accentColors = {
  primary: 'text-primary bg-primary/10',
  secondary: 'text-secondary bg-secondary/10',
  success: 'text-success bg-success/10',
  warning: 'text-warning bg-warning/10',
};

export function StatCard({ title, value, icon: Icon, accent = 'primary', className }: StatCardProps) {
  return (
    <GlassCard className={cn('flex items-center gap-4', className)}>
      <div className={cn('p-3 rounded-xl', accentColors[accent])}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </GlassCard>
  );
}

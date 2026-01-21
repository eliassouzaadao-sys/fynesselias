/**
 * Empty State Component
 * Display when there's no data to show
 */

import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex min-h-[400px] flex-col items-center justify-center p-8 text-center',
        className
      )}
    >
      <div className="w-full max-w-md space-y-4">
        {Icon && (
          <div className="flex justify-center">
            <div className="rounded-full bg-muted p-4">
              <Icon className="h-10 w-10 text-muted-foreground" />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>

        {action && (
          <Button onClick={action.onClick} variant="default">
            {action.label}
          </Button>
        )}
      </div>
    </div>
  );
}

import React from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderResponsiveProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  leading?: React.ReactNode;
  className?: string;
}

/**
 * Cabecera adaptable: a lo angosto apila título/descripción arriba y botones abajo
 * para no aplastar el texto ni cortar botones (Orden 312 Bloque 4).
 */
export function PageHeaderResponsive({
  title,
  description,
  actions,
  leading,
  className,
}: PageHeaderResponsiveProps) {
  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between min-w-0', className)}>
      <div className="flex items-start gap-3 min-w-0">
        {leading && <div className="shrink-0">{leading}</div>}
        <div className="min-w-0 space-y-1">
          <div className="min-w-0 break-words">{title}</div>
          {description && <div className="min-w-0 break-words">{description}</div>}
        </div>
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}

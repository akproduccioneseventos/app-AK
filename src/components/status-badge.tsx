import type { InvoiceStatus } from '@/types/invoice';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: InvoiceStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const statusColors: Record<InvoiceStatus, string> = {
    Draft: 'bg-gray-500 hover:bg-gray-500/90 text-white',
    Sent: 'bg-blue-500 hover:bg-blue-500/90 text-white',
    Viewed: 'bg-yellow-500 hover:bg-yellow-500/90 text-black',
    Paid: 'bg-accent hover:bg-accent/90 text-accent-foreground',
    Overdue: 'bg-destructive hover:bg-destructive/90 text-destructive-foreground',
  };

  const statusDisplay: Record<InvoiceStatus, string> = {
    Draft: 'Borrador',
    Sent: 'Enviada',
    Viewed: 'Vista',
    Paid: 'Pagada',
    Overdue: 'Vencida',
  };

  return (
    <Badge className={cn('text-xs font-semibold', statusColors[status])}>
      {statusDisplay[status] || status}
    </Badge>
  );
}

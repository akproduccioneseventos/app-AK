import type { InvoiceStatus } from '@/types/invoice';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: InvoiceStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const statusColors: Record<InvoiceStatus, string> = {
    Draft: 'bg-gray-500 hover:bg-gray-500/90 text-white', // Custom color for Draft
    Sent: 'bg-blue-500 hover:bg-blue-500/90 text-white', // Custom color for Sent
    Viewed: 'bg-yellow-500 hover:bg-yellow-500/90 text-black', // Custom color for Viewed
    Paid: 'bg-accent hover:bg-accent/90 text-accent-foreground', // Uses theme accent
    Overdue: 'bg-destructive hover:bg-destructive/90 text-destructive-foreground', // Uses theme destructive
  };

  return (
    <Badge className={cn('text-xs font-semibold', statusColors[status])}>
      {status}
    </Badge>
  );
}

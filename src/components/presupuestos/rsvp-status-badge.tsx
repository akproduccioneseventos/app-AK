
'use client';

import type { RsvpStatus } from '@/types/invitado';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface RsvpStatusBadgeProps {
  status?: RsvpStatus;
  className?: string;
}

export function RsvpStatusBadge({ status, className }: RsvpStatusBadgeProps) {
  if (!status) {
    return <Badge className={cn('text-xs font-semibold', 'bg-gray-400 hover:bg-gray-400/90 text-white', className)}>Sin Estado</Badge>;
  }

  const statusColors: Record<RsvpStatus, string> = {
    Pendiente: 'bg-yellow-500 hover:bg-yellow-500/90 text-black',
    Confirmado: 'bg-green-500 hover:bg-green-500/90 text-white',
    Rechazado: 'bg-red-600 hover:bg-red-600/90 text-white',
    'Tal vez': 'bg-blue-500 hover:bg-blue-500/90 text-white',
  };

  return (
    <Badge className={cn('text-xs font-semibold', statusColors[status], className)}>
      {status}
    </Badge>
  );
}


import type { Presupuesto } from '@/types/presupuesto';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PresupuestoStatusBadgeProps {
  status?: Presupuesto['estado']; 
}

export function PresupuestoStatusBadge({ status }: PresupuestoStatusBadgeProps) {
  if (!status) {
    return <Badge className={cn('text-xs font-semibold', 'bg-gray-400 hover:bg-gray-400/90 text-white')}>No Definido</Badge>;
  }

  const statusColors: Record<NonNullable<Presupuesto['estado']>, string> = {
    Borrador: 'bg-yellow-500 hover:bg-yellow-500/90 text-black',
    Enviado: 'bg-blue-500 hover:bg-blue-500/90 text-white',
    Aceptado: 'bg-green-500 hover:bg-green-500/90 text-white', // Similar a 'Paid' en facturas
    Rechazado: 'bg-red-600 hover:bg-red-600/90 text-white', // Más cercano a 'destructive'
  };

  const statusDisplay: Record<NonNullable<Presupuesto['estado']>, string> = {
    Borrador: 'Borrador',
    Enviado: 'Enviado',
    Aceptado: 'Aceptado',
    Rechazado: 'Rechazado',
  };

  return (
    <Badge className={cn('text-xs font-semibold', statusColors[status])}>
      {statusDisplay[status]}
    </Badge>
  );
}

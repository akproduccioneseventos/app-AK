
import type { Presupuesto } from '@/types/presupuesto';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PresupuestoStatusBadgeProps {
  status?: Presupuesto['estado']; 
  className?: string;
}

export function PresupuestoStatusBadge({ status, className }: PresupuestoStatusBadgeProps) {
  if (!status) {
    return <Badge className={cn('text-xs font-semibold', 'bg-gray-400 hover:bg-gray-400/90 text-white', className)}>No Definido</Badge>;
  }

  const statusColors: Record<NonNullable<Presupuesto['estado']>, string> = {
    Borrador: 'bg-yellow-500 hover:bg-yellow-500/90 text-black',
    'Pendiente Verificación': 'bg-orange-500 hover:bg-orange-500/90 text-white',
    Enviado: 'bg-blue-500 hover:bg-blue-500/90 text-white',
    Aceptado: 'bg-green-500 hover:bg-green-500/90 text-white', 
    Rechazado: 'bg-red-600 hover:bg-red-600/90 text-white',
    Facturado: 'bg-purple-500 hover:bg-purple-500/90 text-white',
  };

  const statusDisplay: Record<NonNullable<Presupuesto['estado']>, string> = {
    Borrador: 'Borrador',
    'Pendiente Verificación': '⏳ Pendiente Verificación',
    Enviado: 'Enviado',
    Aceptado: 'Aceptado',
    Rechazado: 'Rechazado',
    Facturado: 'Facturado',
  };

  return (
    <Badge className={cn('text-xs font-semibold', statusColors[status], className)}>
      {statusDisplay[status]}
    </Badge>
  );
}

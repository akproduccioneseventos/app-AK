
import type { Presupuesto } from '@/types/presupuesto';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, Edit, LinkIcon, Link2Off, Loader2, FileSignature } from 'lucide-react';
import Link from 'next/link';
import { PresupuestoStatusBadge } from './presupuesto-status-badge';

interface PresupuestoCardProps {
  presupuesto: Presupuesto;
  isAssignedToCurrentFiesta?: boolean;
  onToggleAssign?: () => void;
  isAssigning?: boolean;
}

const formatCurrency = (amount: number) => {
  if (isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-UY', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
};

export default function PresupuestoCard({ 
  presupuesto, 
  isAssignedToCurrentFiesta, 
  onToggleAssign,
  isAssigning 
}: PresupuestoCardProps) {
  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow flex flex-col justify-between">
      <CardHeader>
        <CardTitle className="font-headline text-xl text-primary">{presupuesto.clienteNombre}</CardTitle>
        <CardDescription>
          {presupuesto.eventoTipo} - {formatDate(presupuesto.eventoFecha)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">Invitados: {presupuesto.invitadosCantidad}</p>
            {presupuesto.estado && <PresupuestoStatusBadge status={presupuesto.estado} />}
        </div>
        <p className="text-lg font-semibold">{formatCurrency(presupuesto.costoTotalEstimado)}</p>
        {presupuesto.estado === 'Facturado' && presupuesto.invoiceId && (
          <p className="text-xs text-green-600">Factura Nº: {presupuesto.invoiceId.split('_').pop()}</p>
        )}
      </CardContent>
      <CardFooter className="flex flex-col items-stretch gap-2 pt-4">
        {onToggleAssign && presupuesto.estado !== 'Facturado' && (
          <Button 
            variant={isAssignedToCurrentFiesta ? "secondary" : "default"} 
            size="sm" 
            onClick={onToggleAssign}
            disabled={isAssigning}
            className="w-full"
          >
            {isAssigning ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : isAssignedToCurrentFiesta ? (
              <Link2Off className="w-4 h-4 mr-1" />
            ) : (
              <LinkIcon className="w-4 h-4 mr-1" />
            )}
            {isAssigning ? (isAssignedToCurrentFiesta ? 'Quitando...' : 'Asignando...') : (isAssignedToCurrentFiesta ? 'Quitar de Fiesta' : 'Asignar a Fiesta')}
          </Button>
        )}
        {presupuesto.estado === 'Facturado' && presupuesto.invoiceId && (
          <Link href={`/invoices/${presupuesto.invoiceId}`} passHref className="w-full">
            <Button variant="outline" size="sm" className="w-full border-green-500 text-green-600 hover:bg-green-50">
              <FileSignature className="w-4 h-4 mr-2" /> Ver Factura Vinculada
            </Button>
          </Link>
        )}
        <div className="flex justify-end gap-2">
          <Link href={`/presupuestos/${presupuesto.id}/ver`} passHref>
            <Button variant="outline" size="sm" aria-label={`Ver presupuesto de ${presupuesto.clienteNombre}`}>
              <Eye className="w-4 h-4 mr-1" /> Ver
            </Button>
          </Link>
          {/* Permite editar incluso si está facturado, según la solicitud de poder modificar. 
              La lógica de sincronización con factura NO está implementada. */}
          <Link href={`/presupuestos/${presupuesto.id}/editar`} passHref>
            <Button variant="outline" size="sm" aria-label={`Editar presupuesto de ${presupuesto.clienteNombre}`}>
              <Edit className="w-4 h-4 mr-1" /> Editar
            </Button>
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}

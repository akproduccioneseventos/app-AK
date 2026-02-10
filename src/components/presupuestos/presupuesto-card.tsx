

'use client';

import type { Presupuesto } from '@/types/presupuesto';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, Edit, Link as LinkIcon, Link2Off, Loader2, FileSignature, Percent, FileText as FileTextIcon, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { PresupuestoStatusBadge } from './presupuesto-status-badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deletePresupuesto } from '@/app/actions/presupuestos';
import { useToast } from '@/hooks/use-toast';
import { useState, useMemo } from 'react';
import { FiestaEnPlanificacion } from '@/types/fiesta';
import { Badge } from '@/components/ui/badge';

interface PresupuestoCardProps {
  presupuesto: Presupuesto;
  isAssignedToCurrentFiesta?: boolean;
  onToggleAssign?: () => void;
  isAssigning?: boolean;
  onDeleteSuccess?: () => void; // Callback to refresh the list
}

const formatCurrency = (amount?: number) => {
  if (amount === undefined || isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "Fecha no definida";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        return "Fecha no definida";
    }
    return date.toLocaleDateString('es-UY', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  } catch (e) {
    return "Fecha inválida";
  }
};

export default function PresupuestoCard({ 
  presupuesto, 
  isAssignedToCurrentFiesta, 
  onToggleAssign,
  isAssigning,
  onDeleteSuccess
}: PresupuestoCardProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const totalFinal = presupuesto.totalConDescuento ?? presupuesto.costoTotalEstimado;
  const displayId = presupuesto.numero ? `#${presupuesto.numero}` : `#${presupuesto.id.split('_').pop()?.substring(0,5)}`;
  
  const budgetSource = useMemo(() => {
    if (presupuesto.source === 'simulator') {
      return { text: 'Simulador', className: 'bg-blue-100 text-blue-800' };
    }
    if (presupuesto.source === 'manual') {
      return { text: 'Manual', className: 'bg-gray-200 text-gray-800' };
    }
    // Fallback for older leads/budgets that might not have the source property
    if (presupuesto.notas?.toLowerCase().includes('simulador')) {
        return { text: 'Simulador', className: 'bg-blue-100 text-blue-800' };
    }
    // If there's a budget but no source, assume manual.
    return { text: 'Manual', className: 'bg-gray-200 text-gray-800' };
  }, [presupuesto.source, presupuesto.notas]);


  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deletePresupuesto(presupuesto.id);
      if (result.success) {
        toast({ title: "Presupuesto Eliminado", variant: "destructive" });
        if (onDeleteSuccess) onDeleteSuccess();
      } else {
        throw new Error(result.error);
      }
    } catch (e: any) {
      toast({ title: "Error al eliminar", description: e.message, variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };


  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow flex flex-col justify-between">
      <CardHeader>
        <div className="flex justify-between items-start">
            <CardTitle className="font-headline text-xl text-primary">{presupuesto.clienteNombre}</CardTitle>
            <span className="text-xs font-mono text-muted-foreground">{displayId}</span>
        </div>
        <CardDescription>
          {presupuesto.eventoTipo} - {formatDate(presupuesto.eventoFecha)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">Invitados: {presupuesto.invitadosCantidad}</p>
                {budgetSource && <Badge variant="secondary" className={`${budgetSource.className} px-1.5 py-0 text-[10px]`}>{budgetSource.text}</Badge>}
            </div>
            {presupuesto.estado && <PresupuestoStatusBadge status={presupuesto.estado} />}
        </div>
        <p className="text-lg font-semibold">{formatCurrency(totalFinal)}</p>
        {presupuesto.descuentoValor && presupuesto.descuentoValor > 0 && (
          <p className="text-xs text-green-600 flex items-center gap-1">
            <Percent className="w-3 h-3"/>
            {presupuesto.nombrePromocion || 'Descuento Aplicado'}
            {presupuesto.vigenciaPromocion && ` (hasta ${presupuesto.vigenciaPromocion})`}
          </p>
        )}
        {presupuesto.estado === 'Facturado' && presupuesto.invoiceId && (
          <Link href={`/invoices/${presupuesto.invoiceId}`} passHref>
            <p className="text-xs text-blue-600 hover:underline">Factura Nº: {presupuesto.invoiceId.split('_').pop()?.substring(0,8)}</p>
          </Link>
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
            {isAssigning ? ( <Loader2 className="w-4 h-4 mr-1 animate-spin" /> ) : 
             isAssignedToCurrentFiesta ? ( <Link2Off className="w-4 h-4 mr-1" /> ) : 
             ( <LinkIcon className="w-4 h-4 mr-1" /> )}
            {isAssigning ? (isAssignedToCurrentFiesta ? 'Quitando...' : 'Asignando...') : (isAssignedToCurrentFiesta ? 'Quitar de Fiesta' : 'Asignar a Fiesta')}
          </Button>
        )}
        
        {presupuesto.estado === 'Aceptado' && !presupuesto.invoiceId && (
          <Link href={`/invoices/new?fromPresupuesto=${presupuesto.id}`} passHref className="w-full">
            <Button variant="default" size="sm" className="w-full">
              <FileTextIcon className="w-4 h-4 mr-2" /> Crear Factura
            </Button>
          </Link>
        )}

        {presupuesto.estado === 'Facturado' && presupuesto.invoiceId && (
          <Link href={`/invoices/${presupuesto.invoiceId}`} passHref className="w-full">
            <Button variant="outline" size="sm" className="w-full border-green-500 text-green-600 hover:bg-green-50">
              <FileSignature className="w-4 h-4 mr-2" /> Ver Factura
            </Button>
          </Link>
        )}
        <div className="flex justify-end gap-2 pt-2 border-t w-full">
          <Link href={`/presupuestos/${presupuesto.id}/ver`} passHref>
            <Button variant="outline" size="sm"><Eye className="mr-1"/> Ver</Button>
          </Link>
          <Link href={`/presupuestos/${presupuesto.id}/editar`} passHref>
            <Button variant="outline" size="sm"><Edit className="mr-1"/> Editar</Button>
          </Link>
           <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="icon" className="h-8 w-8" disabled={isDeleting}>
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Trash2 className="w-4 h-4"/>}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Se eliminará el presupuesto para "{presupuesto.clienteNombre}". Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
        </div>
      </CardFooter>
    </Card>
  );
}


'use client';

import type { Presupuesto } from '@/types/presupuesto';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, Edit, Link as LinkIcon, Link2Off, Loader2, FileSignature, Percent, FileText as FileTextIcon, Trash2, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { isBefore, addDays } from 'date-fns';

interface PresupuestoCardProps {
  presupuesto: Presupuesto;
  isAssignedToCurrentFiesta?: boolean;
  onToggleAssign?: () => void;
  isAssigning?: boolean;
  onDeleteSuccess?: () => void;
  onHire?: () => void;
}

const formatCurrency = (amount?: number) => {
  if (amount === undefined || isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', maximumFractionDigits: 0 }).format(amount);
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "Fecha no definida";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-UY', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch (e) { return "N/A"; }
};

export default function PresupuestoCard({ 
  presupuesto, 
  isAssignedToCurrentFiesta, 
  onToggleAssign,
  isAssigning,
  onDeleteSuccess,
  onHire
}: PresupuestoCardProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const totalFinal = presupuesto.totalConDescuento ?? presupuesto.costoTotalEstimado;
  const displayId = presupuesto.numero ? `#${presupuesto.numero}` : `#${presupuesto.id.split('_').pop()?.substring(0,5)}`;
  
  const budgetSource = useMemo(() => {
    if (presupuesto.source === 'simulator') {
      return { text: 'Simulador', className: 'bg-blue-100 text-blue-800 border-blue-200' };
    }
    return { text: 'Manual', className: 'bg-gray-100 text-gray-700 border-gray-200' };
  }, [presupuesto.source]);

  const isExpired = useMemo(() => {
    if (presupuesto.estado === 'Aceptado' || presupuesto.estado === 'Facturado') return false;
    const createdDate = new Date(presupuesto.timestamp);
    const expiryDate = addDays(createdDate, 30);
    return isBefore(expiryDate, new Date());
  }, [presupuesto]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deletePresupuesto(presupuesto.id);
      if (result.success) {
        toast({ title: "Presupuesto Eliminado", variant: "destructive" });
        if (onDeleteSuccess) onDeleteSuccess();
      } else throw new Error(result.error);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className={cn(
        "shadow-md hover:shadow-lg transition-all flex flex-col justify-between border-primary/10",
        isExpired && "border-destructive/30"
    )}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-2">
            <div className="min-w-0 flex-grow">
                <CardTitle className="text-lg font-headline text-primary truncate" title={presupuesto.clienteNombre}>
                    {presupuesto.clienteNombre}
                </CardTitle>
                <CardDescription className="text-xs truncate">
                    {presupuesto.eventoTipo} • {formatDate(presupuesto.eventoFecha)}
                </CardDescription>
            </div>
            <div className='flex flex-col gap-1 items-end'>
                <Badge variant="outline" className={cn("text-[10px] px-1.5 h-5 font-bold uppercase", budgetSource.className)}>
                    {budgetSource.text}
                </Badge>
                {isExpired && (
                    <Badge variant="destructive" className="text-[9px] h-4 px-1.5 animate-pulse">
                        VENCIDO
                    </Badge>
                )}
            </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Invitados: {presupuesto.invitadosCantidad}</span>
            <PresupuestoStatusBadge status={presupuesto.estado} />
        </div>
        <div>
            <p className="text-xl font-bold tracking-tight">{formatCurrency(totalFinal)}</p>
            {presupuesto.descuentoValor && presupuesto.descuentoValor > 0 && (
                <p className="text-[10px] text-green-600 font-medium flex items-center gap-1 mt-0.5">
                    <Percent className="w-3 h-3"/> Descuento Aplicado
                </p>
            )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 pt-4 bg-muted/10 p-3">
        {presupuesto.estado === 'Enviado' && onHire && (
          <Button onClick={onHire} variant="default" size="sm" className="w-full bg-green-600 hover:bg-green-700 text-white gap-2 font-bold h-9">
            <CheckCircle className="w-4 h-4"/> CONTRATAR
          </Button>
        )}

        {presupuesto.estado === 'Aceptado' && !presupuesto.invoiceId && (
          <Link href={`/invoices/new?fromPresupuesto=${presupuesto.id}`} passHref className="w-full">
            <Button variant="default" size="sm" className="w-full gap-2 h-9 font-bold">
              <FileTextIcon className="w-4 h-4" /> GENERAR FACTURA
            </Button>
          </Link>
        )}

        {presupuesto.estado === 'Facturado' && presupuesto.invoiceId && (
          <Link href={`/invoices/${presupuesto.invoiceId}`} passHref className="w-full">
            <Button variant="outline" size="sm" className="w-full border-green-500 text-green-700 hover:bg-green-50 h-9 font-bold uppercase text-[10px] gap-2">
              <FileSignature className="w-4 h-4" /> Ver Factura #{presupuesto.invoiceId.split('_').pop()?.substring(0,6)}
            </Button>
          </Link>
        )}

        {isExpired && (
            <div className="bg-destructive/10 p-2 rounded flex items-center gap-2 mb-1">
                <AlertTriangle className="w-3.5 h-3.5 text-destructive"/>
                <span className="text-[10px] text-destructive leading-tight font-medium">Este presupuesto superó los 30 días de validez. Se recomienda actualizar precios.</span>
            </div>
        )}

        <div className="flex gap-2 w-full mt-1">
          <Link href={`/presupuestos/${presupuesto.id}/ver`} passHref className="flex-grow">
            <Button variant="outline" size="sm" className="w-full h-8 text-xs">RESUMEN</Button>
          </Link>
          <Link href={`/presupuestos/${presupuesto.id}/editar`} passHref className="flex-grow">
            <Button variant="outline" size="sm" className="w-full h-8 text-xs">EDITAR</Button>
          </Link>
           <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" disabled={isDeleting}>
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Trash2 className="w-4 h-4"/>}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>¿Eliminar Presupuesto?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
        </div>
      </CardFooter>
    </Card>
  );
}

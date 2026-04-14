
'use client';

import type { Presupuesto } from '@/types/presupuesto';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, Edit, Link as LinkIcon, Link2Off, Loader2, FileSignature, Percent, FileText as FileTextIcon, Trash2, CheckCircle, Clock, AlertTriangle, Archive } from 'lucide-react';
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
import { deletePresupuesto, archivePresupuesto } from '@/app/actions/presupuestos';
import { useToast } from '@/hooks/use-toast';
import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { isBefore, addDays } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const [isArchiving, setIsArchiving] = useState(false);
  const [showHardDeleteDialog, setShowHardDeleteDialog] = useState(false);

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

  const handleArchive = async () => {
    setIsArchiving(true);
    try {
      const result = await archivePresupuesto(presupuesto.id);
      if (result.success) {
        toast({ title: "Presupuesto Archivado", description: "No aparecerá en el listado activo." });
        if (onDeleteSuccess) onDeleteSuccess();
      } else throw new Error(result.error);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsArchiving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deletePresupuesto(presupuesto.id);
      if (result.success) {
        toast({ title: "Presupuesto Eliminado Definitivamente", variant: "destructive" });
        if (onDeleteSuccess) onDeleteSuccess();
      } else throw new Error(result.error);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsDeleting(false);
      setShowHardDeleteDialog(false);
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
          <Link href={`/invoices/new?fromPresupuesto=${presupuesto.id}`} className="w-full">
            <Button variant="default" size="sm" className="w-full gap-2 h-9 font-bold">
              <FileTextIcon className="w-4 h-4" /> GENERAR FACTURA
            </Button>
          </Link>
        )}

        {presupuesto.estado === 'Facturado' && presupuesto.invoiceId && (
          <Link href={`/invoices/${presupuesto.invoiceId}`} className="w-full">
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
          <Link href={`/presupuestos/${presupuesto.id}/ver`} className="flex-grow">
            <Button variant="outline" size="sm" className="w-full h-8 text-xs">RESUMEN</Button>
          </Link>
          <Link href={`/presupuestos/${presupuesto.id}/editar`} className="flex-grow">
            <Button variant="outline" size="sm" className="w-full h-8 text-xs">EDITAR</Button>
          </Link>

          {/* Archive / Delete dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" disabled={isDeleting || isArchiving}>
                {(isDeleting || isArchiving) ? <Loader2 className="w-4 h-4 animate-spin"/> : <Trash2 className="w-4 h-4"/>}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem
                className="gap-2 cursor-pointer"
                onClick={handleArchive}
                disabled={isArchiving}
              >
                <Archive className="w-4 h-4 text-amber-500" />
                <div>
                  <div className="font-medium">Archivar</div>
                  <div className="text-[10px] text-muted-foreground">Se oculta del listado activo</div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                onClick={() => setShowHardDeleteDialog(true)}
              >
                <Trash2 className="w-4 h-4" />
                <div>
                  <div className="font-medium">Eliminar definitivamente</div>
                  <div className="text-[10px] text-muted-foreground">No se puede deshacer</div>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Hard-delete confirmation dialog */}
          <AlertDialog open={showHardDeleteDialog} onOpenChange={setShowHardDeleteDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar definitivamente?</AlertDialogTitle>
                <AlertDialogDescription>
                  Se eliminará el presupuesto de <strong>{presupuesto.clienteNombre}</strong> de forma permanente y se limpiará el vínculo en el CRM. Esta acción <strong>no se puede deshacer</strong>.
                  <br /><br />
                  Si querés conservar el historial, usá <strong>Archivar</strong> en su lugar.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90" disabled={isDeleting}>
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Eliminar definitivamente
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardFooter>
    </Card>
  );
}

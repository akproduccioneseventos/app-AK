'use client';

import type { Presupuesto } from '@/types/presupuesto';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  Archive,
  CalendarDays,
  CheckCircle,
  Edit,
  Eye,
  FileSignature,
  FileText,
  Loader2,
  MoreVertical,
  Percent,
  Trash2,
  Users,
} from 'lucide-react';
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
} from '@/components/ui/alert-dialog';
import { archivePresupuesto, deletePresupuesto } from '@/app/actions/presupuestos';
import { useToast } from '@/hooks/use-toast';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { addDays, isBefore } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface PresupuestoCardProps {
  presupuesto: Presupuesto;
  isAssignedToCurrentFiesta?: boolean;
  onToggleAssign?: () => void;
  isAssigning?: boolean;
  onDeleteSuccess?: (id: string, action: 'archive' | 'delete') => void | Promise<void>;
  onHire?: () => void;
}

const formatCurrency = (amount?: number) => {
  if (amount === undefined || Number.isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', {
    style: 'currency',
    currency: 'UYU',
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString?: string) => {
  if (!dateString) return 'Sin definir';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'Fecha inválida';
  return date.toLocaleDateString('es-UY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export default function PresupuestoCard({
  presupuesto,
  onDeleteSuccess,
  onHire,
}: PresupuestoCardProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [showHardDeleteDialog, setShowHardDeleteDialog] = useState(false);

  const totalFinal = presupuesto.totalConDescuento ?? presupuesto.costoTotalEstimado;
  const displayId = presupuesto.numero
    ? `#${presupuesto.numero}`
    : `#${presupuesto.id.split('_').pop()?.substring(0, 5)}`;

  const budgetSource = useMemo(() => {
    if (presupuesto.source === 'simulator_assistant') return { text: 'Sim. asistido', className: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
    if (presupuesto.source === 'simulator_common') return { text: 'Sim. común', className: 'bg-blue-100 text-blue-800 border-blue-200' };
    if (presupuesto.source === 'portal_led') return { text: 'Portal LED', className: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200' };
    if (presupuesto.source === 'simulator') return { text: 'Simulador', className: 'bg-blue-100 text-blue-800 border-blue-200' };
    return { text: 'Manual', className: 'bg-gray-100 text-gray-700 border-gray-200' };
  }, [presupuesto.source]);

  const isExpired = useMemo(() => {
    if (presupuesto.estado === 'Aceptado' || presupuesto.estado === 'Facturado') return false;
    const createdDate = new Date(presupuesto.timestamp);
    if (Number.isNaN(createdDate.getTime())) return false;
    return isBefore(addDays(createdDate, 30), new Date());
  }, [presupuesto.estado, presupuesto.timestamp]);

  const handleArchive = async () => {
    setIsArchiving(true);
    try {
      const result = await archivePresupuesto(presupuesto.id);
      if (!result.success) throw new Error(result.error);
      toast({ title: 'Presupuesto archivado', description: 'Ya no aparece en el listado activo.' });
      if (onDeleteSuccess) await onDeleteSuccess(presupuesto.id, 'archive');
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo archivar.',
        variant: 'destructive',
      });
    } finally {
      setIsArchiving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deletePresupuesto(presupuesto.id);
      if (!result.success) throw new Error(result.error);
      toast({ title: 'Presupuesto eliminado definitivamente', variant: 'destructive' });
      if (onDeleteSuccess) await onDeleteSuccess(presupuesto.id, 'delete');
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo eliminar.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setShowHardDeleteDialog(false);
    }
  };

  return (
    <div
      className={cn(
        'rounded-md border bg-card p-4 transition-colors hover:bg-muted/20',
        isExpired && 'border-destructive/30',
        presupuesto.archived && 'bg-muted/20',
      )}
    >
      <div className="grid min-w-0 gap-4 md:grid-cols-[minmax(190px,1.35fr)_minmax(180px,1fr)_minmax(150px,.8fr)_auto] md:items-center">
        <div className="min-w-0 space-y-2">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h4 className="min-w-0 truncate font-semibold text-foreground" title={presupuesto.clienteNombre}>
              {presupuesto.clienteNombre}
            </h4>
            <span className="text-xs font-medium text-muted-foreground">{displayId}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <PresupuestoStatusBadge status={presupuesto.estado} />
            <Badge variant="outline" className={cn('h-5 px-1.5 text-[10px] font-bold uppercase', budgetSource.className)}>
              {budgetSource.text}
            </Badge>
            {presupuesto.archived ? <Badge variant="secondary">Archivado</Badge> : null}
            {isExpired ? <Badge variant="destructive">Vencido</Badge> : null}
          </div>
          <p className="truncate text-xs text-muted-foreground">{presupuesto.eventoTipo}</p>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-[11px] uppercase text-muted-foreground">Fecha del presupuesto</p>
              <p className="font-medium">{formatDate(presupuesto.timestamp)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 shrink-0 text-primary" />
            <div>
              <p className="text-[11px] uppercase text-muted-foreground">Fecha de la fiesta</p>
              <p className="font-medium">{formatDate(presupuesto.eventoFecha)}</p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xl font-bold tracking-tight">{formatCurrency(totalFinal)}</p>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            {presupuesto.invitadosCantidad} invitados
          </p>
          {presupuesto.descuentoValor && presupuesto.descuentoValor > 0 ? (
            <p className="flex items-center gap-1 text-[11px] font-medium text-green-700">
              <Percent className="h-3 w-3" />
              Descuento aplicado
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-2 md:justify-end">
          <Button asChild variant="outline" size="sm">
            <Link href={`/presupuestos/${presupuesto.id}/ver`}>
              <Eye className="mr-2 h-4 w-4" />
              Ver
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/presupuestos/${presupuesto.id}/editar`}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                aria-label="Más acciones del presupuesto"
                disabled={isDeleting || isArchiving}
              >
                {isDeleting || isArchiving
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <MoreVertical className="h-4 w-4" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {!presupuesto.archived ? (
                <>
                  <DropdownMenuItem className="cursor-pointer gap-2" onClick={handleArchive} disabled={isArchiving}>
                    <Archive className="h-4 w-4 text-amber-600" />
                    Archivar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              ) : null}
              <DropdownMenuItem
                className="cursor-pointer gap-2 text-destructive focus:text-destructive"
                onClick={() => setShowHardDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4" />
                Eliminar definitivamente
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {isExpired ? (
        <div className="mt-3 flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Superó los 30 días de validez. Conviene actualizar precios antes de enviarlo nuevamente.
        </div>
      ) : null}

      {presupuesto.estado === 'Enviado' && onHire ? (
        <Button onClick={onHire} size="sm" className="mt-3 bg-green-700 hover:bg-green-800">
          <CheckCircle className="mr-2 h-4 w-4" />
          Contratar
        </Button>
      ) : null}

      {presupuesto.estado === 'Aceptado' && !presupuesto.invoiceId ? (
        <Button asChild size="sm" className="mt-3">
          <Link href={`/invoices/new?fromPresupuesto=${presupuesto.id}`}>
            <FileText className="mr-2 h-4 w-4" />
            Generar factura
          </Link>
        </Button>
      ) : null}

      {presupuesto.estado === 'Facturado' && presupuesto.invoiceId ? (
        <Button asChild variant="outline" size="sm" className="mt-3 border-green-600 text-green-700">
          <Link href={`/invoices/${presupuesto.invoiceId}`}>
            <FileSignature className="mr-2 h-4 w-4" />
            Ver factura
          </Link>
        </Button>
      ) : null}

      <AlertDialog open={showHardDeleteDialog} onOpenChange={setShowHardDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar definitivamente?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará el presupuesto de {presupuesto.clienteNombre} y su vínculo con el CRM. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Eliminar definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

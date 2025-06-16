
import type { Invoice } from '@/types/invoice';
import { TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { StatusBadge } from './status-badge';
import Link from 'next/link';
import { Eye, Edit, Trash2, Loader2, Link as LinkIcon, Link2Off } from 'lucide-react';
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

interface InvoiceListItemProps {
  invoice: Invoice;
  onDelete: (id: string, invoiceNumber?:string) => void;
  isDeleting: boolean;
  isAssignedToCurrentFiesta?: boolean;
  onToggleAssign?: () => void;
  isAssigning?: boolean;
}

export function InvoiceListItem({ 
  invoice, 
  onDelete, 
  isDeleting,
  isAssignedToCurrentFiesta,
  onToggleAssign,
  isAssigning 
}: InvoiceListItemProps) {
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch(e) { return "Fecha inválida"; }
  };

  const formatCurrency = (amount: number, currency: string = 'UYU') => {
    if (isNaN(amount)) return 'N/A';
    return new Intl.NumberFormat('es-UY', { style: 'currency', currency: currency }).format(amount);
  };


  return (
    <TableRow className={isAssignedToCurrentFiesta ? 'bg-primary/5 hover:bg-primary/10' : ''}>
      <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
      <TableCell>{invoice.customer.companyName || invoice.customer.name}</TableCell>
      <TableCell>{formatDate(invoice.issueDate)}</TableCell>
      <TableCell>{formatDate(invoice.dueDate)}</TableCell>
      <TableCell className="text-right font-semibold">
        {formatCurrency(invoice.totalAmount, invoice.currency)}
      </TableCell>
      <TableCell>
        <StatusBadge status={invoice.status} />
      </TableCell>
      <TableCell className="text-center">
        {onToggleAssign && (
          <Button 
            variant={isAssignedToCurrentFiesta ? "secondary" : "outline"} 
            size="sm" 
            onClick={onToggleAssign}
            disabled={isAssigning}
            className="w-full max-w-[120px] text-xs h-8" // Adjusted width and height
            title={isAssignedToCurrentFiesta ? "Desasignar de fiesta actual" : "Asignar a fiesta actual"}
          >
            {isAssigning ? (
              <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
            ) : isAssignedToCurrentFiesta ? (
              <Link2Off className="w-3.5 h-3.5 mr-1" />
            ) : (
              <LinkIcon className="w-3.5 h-3.5 mr-1" />
            )}
            {isAssigning ? (isAssignedToCurrentFiesta ? '...' : '...') : (isAssignedToCurrentFiesta ? 'Quitar' : 'Asignar')}
          </Button>
        )}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1.5">
          <Link href={`/invoices/${invoice.id}`} passHref>
            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Ver Factura ${invoice.invoiceNumber}`} title="Ver Detalle">
              <Eye className="w-4 h-4" />
            </Button>
          </Link>
          <Link href={`/invoices/${invoice.id}/edit`} passHref>
            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Editar Factura ${invoice.invoiceNumber}`} title="Editar Factura">
              <Edit className="w-4 h-4" />
            </Button>
          </Link>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 h-8 w-8" aria-label={`Eliminar Factura ${invoice.invoiceNumber}`} title="Eliminar Factura" disabled={isDeleting}>
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Confirmas la eliminación?</AlertDialogTitle>
                <AlertDialogDescription>La factura "{invoice.invoiceNumber}" será eliminada. Esta acción no se puede deshacer.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(invoice.id, invoice.invoiceNumber)} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                  {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Sí, eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </TableCell>
    </TableRow>
  );
}

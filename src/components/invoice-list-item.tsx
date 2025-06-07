import type { Invoice } from '@/types/invoice';
import { TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { StatusBadge } from './status-badge';
import Link from 'next/link';
import { Eye, Edit, Trash2 } from 'lucide-react';

interface InvoiceListItemProps {
  invoice: Invoice;
}

export function InvoiceListItem({ invoice }: InvoiceListItemProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <TableRow>
      <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
      <TableCell>{invoice.customer.name}</TableCell>
      <TableCell>{formatDate(invoice.issueDate)}</TableCell>
      <TableCell>{formatDate(invoice.dueDate)}</TableCell>
      <TableCell className="text-right">
        {invoice.totalAmount.toLocaleString('es-ES', { style: 'currency', currency: invoice.currency || 'EUR' })}
      </TableCell>
      <TableCell>
        <StatusBadge status={invoice.status} />
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <Link href={`/invoices/${invoice.id}`} passHref>
            <Button variant="outline" size="icon" aria-label="View Invoice">
              <Eye className="w-4 h-4" />
            </Button>
          </Link>
          <Link href={`/invoices/${invoice.id}/edit`} passHref>
            <Button variant="outline" size="icon" aria-label="Edit Invoice">
              <Edit className="w-4 h-4" />
            </Button>
          </Link>
          <Button variant="destructive" size="icon" aria-label="Delete Invoice">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FilePlus2 } from 'lucide-react';
import { InvoiceListItem } from '@/components/invoice-list-item';
import type { Invoice, Customer } from '@/types/invoice';

// Mock data for demonstration - ideally fetched from a DB/API
const mockCustomers: Customer[] = [
  { id: 'cust_1', name: 'Cliente Ejemplo S.L.', email: 'contacto@cliente.es' },
  { id: 'cust_2', name: 'Diseños Creativos Co.', email: 'hola@disenos.com' },
  { id: 'cust_3', name: 'Eventos AKM', email: 'info@eventosakm.com' },
];

const mockInvoices: Invoice[] = [
  {
    id: 'inv_001',
    invoiceNumber: 'FACT2024-001',
    customer: mockCustomers[0],
    issueDate: '2024-07-15',
    dueDate: '2024-08-14',
    items: [{ id: 'item_1', description: 'Servicio de Diseño Web', quantity: 1, unitPrice: 1200, total: 1200 }],
    subtotal: 1200,
    taxRate: 21,
    taxAmount: 252,
    totalAmount: 1452,
    status: 'Paid',
    currency: 'EUR',
  },
  {
    id: 'inv_002',
    invoiceNumber: 'FACT2024-002',
    customer: mockCustomers[1],
    issueDate: '2024-07-20',
    dueDate: '2024-08-19',
    items: [{ id: 'item_2', description: 'Consultoría de Marca', quantity: 10, unitPrice: 80, total: 800 }],
    subtotal: 800,
    totalAmount: 800,
    status: 'Sent',
    currency: 'EUR',
  },
  {
    id: 'inv_003',
    invoiceNumber: 'FACT2024-003',
    customer: mockCustomers[0],
    issueDate: '2024-06-10',
    dueDate: '2024-07-10',
    items: [{ id: 'item_3', description: 'Mantenimiento Web Mensual', quantity: 1, unitPrice: 150, total: 150 }],
    subtotal: 150,
    totalAmount: 150,
    status: 'Overdue',
    currency: 'EUR',
  },
   {
    id: 'inv_004',
    invoiceNumber: 'FACT2024-004',
    customer: mockCustomers[2],
    issueDate: '2024-07-25',
    dueDate: '2024-08-24',
    items: [{ id: 'item_4', description: 'Producción Audiovisual Evento', quantity: 1, unitPrice: 2500, total: 2500 }],
    subtotal: 2500,
    taxRate: 21,
    taxAmount: 525,
    totalAmount: 3025,
    status: 'Draft',
    currency: 'EUR',
  },
];


export default function InvoicesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Todas las Facturas
        </h1>
        <Link href="/invoices/new" passHref>
          <Button>
            <FilePlus2 className="w-5 h-5 mr-2" />
            Nueva Factura
          </Button>
        </Link>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Listado de Facturas</CardTitle>
          <CardDescription>Gestiona y haz seguimiento de todas tus facturas.</CardDescription>
        </CardHeader>
        <CardContent>
          {mockInvoices.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº Factura</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Fecha Emisión</TableHead>
                  <TableHead>Fecha Vencimiento</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockInvoices.map((invoice) => (
                  <InvoiceListItem key={invoice.id} invoice={invoice} />
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-10 text-center">
              <p className="text-muted-foreground">No has creado ninguna factura todavía.</p>
              <Link href="/invoices/new" passHref>
                <Button className="mt-4">Crear Primera Factura</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCaption, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FilePlus2, ScanLine } from 'lucide-react';
import { ReceiptProcessor } from '@/components/receipt-processor';
import { InvoiceListItem } from '@/components/invoice-list-item';
import type { Invoice, Customer } from '@/types/invoice'; // Assuming Customer is also in invoice.ts or imported there

// Mock data for demonstration
const mockCustomers: Customer[] = [
  { id: 'cust_1', name: 'Cliente Ejemplo S.L.', email: 'contacto@cliente.es' },
  { id: 'cust_2', name: 'Diseños Creativos Co.', email: 'hola@disenos.com' },
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
    vendorName: 'AK Producciones',
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
    vendorName: 'AK Producciones',
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
    vendorName: 'AK Producciones',
  },
];


export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight font-headline text-foreground">
          Panel Principal
        </h1>
        <Link href="/invoices/new" passHref>
          <Button size="lg">
            <FilePlus2 className="w-5 h-5 mr-2" />
            Crear Factura
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-headline">Facturas Recientes</CardTitle>
            <CardDescription>Un vistazo rápido a tus últimas facturas.</CardDescription>
          </CardHeader>
          <CardContent>
            {mockInvoices.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº Factura</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockInvoices.slice(0, 5).map((invoice) => ( // Show top 5
                    <InvoiceListItem key={invoice.id} invoice={invoice} />
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground">No hay facturas recientes para mostrar.</p>
            )}
             {mockInvoices.length > 5 && (
                <div className="mt-4 text-center">
                    <Link href="/invoices" passHref>
                        <Button variant="outline">Ver Todas las Facturas</Button>
                    </Link>
                </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="font-headline">
              <ScanLine className="inline w-6 h-6 mr-2 align-text-bottom" />
              Auto-Completar Recibo
            </CardTitle>
            <CardDescription>Sube un recibo para extraer detalles automáticamente.</CardDescription>
          </CardHeader>
          <CardContent>
            <ReceiptProcessor />
          </CardContent>
        </Card>
      </div>

      {/* Placeholder for more dashboard widgets, e.g., stats, charts */}
      {/*
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Estadísticas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Próximamente: gráficos de ingresos, facturas pendientes, etc.</p>
            <img src="https://placehold.co/600x300.png" alt="Placeholder chart" className="w-full mt-4 rounded-md" data-ai-hint="financial chart" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Actividad Reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Próximamente: un feed de actividad reciente.</p>
          </CardContent>
        </Card>
      </div>
      */}
    </div>
  );
}

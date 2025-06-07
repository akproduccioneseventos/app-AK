
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FilePlus2 } from 'lucide-react';
import { InvoiceListItem } from '@/components/invoice-list-item';
import type { Invoice } from '@/types/invoice';

// Mock data based on the user-provided image
const mockInvoices: Invoice[] = [
  {
    id: 'inv_img_1',
    invoiceNumber: '2342',
    customer: { id: 'cust_img_1', name: 'INTERNACIONAL DE RECURSOS HUM. SOLUC. S.L.' },
    issueDate: '2022-01-01',
    dueDate: '2022-01-01',
    items: [{ id: 'item_img_1_1', description: 'ALQUILER EQUIPO AUDIOVISUAL', quantity: 1, unitPrice: 300.00, total: 300.00 }],
    subtotal: 300.00,
    taxRate: 21,
    taxAmount: 63.00,
    totalAmount: 363.00,
    status: 'Paid',
    currency: 'EUR',
    vendorName: 'Presupuestador AK Producciones',
    vendorAddress: 'Calle de Ejemplo 456, Oficina 7A, 28002 Madrid, España',
    vendorTaxId: 'A08123456',
  },
  {
    id: 'inv_img_2',
    invoiceNumber: '2343',
    customer: { id: 'cust_img_2', name: 'A SHOT OF ENTERTAINMENT S.L.' },
    issueDate: '2022-01-03',
    dueDate: '2022-01-03',
    items: [{ id: 'item_img_2_1', description: 'SERVICIOS POSTPRODUCCION VIDEO', quantity: 1, unitPrice: 1800.00, total: 1800.00 }],
    subtotal: 1800.00,
    taxRate: 21,
    taxAmount: 378.00,
    totalAmount: 2178.00,
    status: 'Paid',
    currency: 'EUR',
    vendorName: 'Presupuestador AK Producciones',
    vendorAddress: 'Calle de Ejemplo 456, Oficina 7A, 28002 Madrid, España',
    vendorTaxId: 'A08123456',
  },
  {
    id: 'inv_img_3',
    invoiceNumber: '2344',
    customer: { id: 'cust_img_3', name: 'VIAJES EL CORTE INGLES S.A.' },
    issueDate: '2022-01-03',
    dueDate: '2022-01-03',
    items: [{ id: 'item_img_3_1', description: 'GRABACION Y EDICION VIDEO EVENTO MADRID', quantity: 1, unitPrice: 2450.00, total: 2450.00 }],
    subtotal: 2450.00,
    taxRate: 21,
    taxAmount: 514.50,
    totalAmount: 2964.50,
    status: 'Paid',
    currency: 'EUR',
    vendorName: 'Presupuestador AK Producciones',
    vendorAddress: 'Calle de Ejemplo 456, Oficina 7A, 28002 Madrid, España',
    vendorTaxId: 'A08123456',
  },
  {
    id: 'inv_img_4',
    invoiceNumber: '2345',
    customer: { id: 'cust_img_4', name: 'ACCENTURE S.L.U.' },
    issueDate: '2022-01-04',
    dueDate: '2022-01-04',
    items: [{ id: 'item_img_4_1', description: 'SERVICIO STREAMING JORNADA INTERNA ACCENTURE', quantity: 1, unitPrice: 950.00, total: 950.00 }],
    subtotal: 950.00,
    taxRate: 21,
    taxAmount: 199.50,
    totalAmount: 1149.50,
    status: 'Paid',
    currency: 'EUR',
    vendorName: 'Presupuestador AK Producciones',
    vendorAddress: 'Calle de Ejemplo 456, Oficina 7A, 28002 Madrid, España',
    vendorTaxId: 'A08123456',
  },
  {
    id: 'inv_img_5',
    invoiceNumber: '2346',
    customer: { id: 'cust_img_5', name: '11 ONCE MARKETING Y COMUNICACION S.L.' },
    issueDate: '2022-01-05',
    dueDate: '2022-01-05',
    items: [{ id: 'item_img_5_1', description: 'ALQUILER MATERIAL TECNICO', quantity: 1, unitPrice: 420.00, total: 420.00 }],
    subtotal: 420.00,
    taxRate: 21,
    taxAmount: 88.20,
    totalAmount: 508.20,
    status: 'Paid',
    currency: 'EUR',
    vendorName: 'Presupuestador AK Producciones',
    vendorAddress: 'Calle de Ejemplo 456, Oficina 7A, 28002 Madrid, España',
    vendorTaxId: 'A08123456',
  },
  {
    id: 'inv_img_6',
    invoiceNumber: '2361',
    customer: { id: 'cust_img_6', name: 'DIVERTIA INNOVA S.A.' },
    issueDate: '2022-01-28',
    dueDate: '2022-02-28',
    items: [{ id: 'item_img_6_1', description: 'SERVICIOS AUDIOVISUALES EVENTO', quantity: 1, unitPrice: 1200.00, total: 1200.00 }],
    subtotal: 1200.00,
    taxRate: 21,
    taxAmount: 252.00,
    totalAmount: 1452.00,
    status: 'Overdue', // Estado VENCIDA
    currency: 'EUR',
    vendorName: 'Presupuestador AK Producciones',
    vendorAddress: 'Calle de Ejemplo 456, Oficina 7A, 28002 Madrid, España',
    vendorTaxId: 'A08123456',
  },
  {
    id: 'inv_img_7',
    invoiceNumber: '2377',
    customer: { id: 'cust_img_7', name: 'NEW HORIZON AUDITORES S.L.' },
    issueDate: '2022-02-15',
    dueDate: '2022-02-15',
    items: [{ id: 'item_img_7_1', description: 'ALQUILER EQUIPO STREAMING', quantity: 1, unitPrice: 250.00, total: 250.00 }],
    subtotal: 250.00,
    taxRate: 21,
    taxAmount: 52.50,
    totalAmount: 302.50,
    status: 'Paid',
    currency: 'EUR',
    vendorName: 'Presupuestador AK Producciones',
    vendorAddress: 'Calle de Ejemplo 456, Oficina 7A, 28002 Madrid, España',
    vendorTaxId: 'A08123456',
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

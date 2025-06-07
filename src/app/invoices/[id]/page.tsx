
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Send, Edit } from 'lucide-react';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/status-badge';
import type { Invoice, Customer, InvoiceItem } from '@/types/invoice'; 

// Mock data for a single invoice
const mockCustomer: Customer = {
  id: 'cust_1',
  name: 'Cliente Ejemplo S.L.',
  email: 'contacto@cliente.es',
  address: {
    street: 'Calle Falsa 123',
    city: 'Madrid',
    zipCode: '28001',
    country: 'España',
  },
  taxId: 'B12345678',
};

const mockItems: InvoiceItem[] = [
  { id: 'item_1', description: 'Servicio de Diseño Web Completo', quantity: 1, unitPrice: 1200, total: 1200 },
  { id: 'item_2', description: 'Dominio y Hosting Anual', quantity: 1, unitPrice: 75, total: 75 },
  { id: 'item_3', description: 'Soporte Técnico (5 horas)', quantity: 5, unitPrice: 50, total: 250 },
];

const mockInvoice: Invoice = {
  id: 'inv_001',
  invoiceNumber: 'FACT2024-001',
  customer: mockCustomer,
  issueDate: '2024-07-15',
  dueDate: '2024-08-14',
  items: mockItems,
  subtotal: 1525,
  taxRate: 21,
  taxAmount: 320.25,
  totalAmount: 1845.25,
  status: 'Paid',
  currency: 'EUR',
  notes: 'Pago mediante transferencia bancaria. Gracias por su confianza.',
  vendorName: 'Presupuestador AK Producciones',
  vendorAddress: 'Calle de Ejemplo 456, Oficina 7A, 28002 Madrid, España',
  vendorTaxId: 'A08123456',
};

// Helper function for formatting currency
const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: currency }).format(amount);
};

// Helper function for formatting date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
};

export default function ViewInvoicePage({ params }: { params: { id: string } }) {
  // In a real app, you would fetch invoice data based on params.id
  const invoice = mockInvoice; // Using mock data

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/invoices" passHref>
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Facturas
          </Button>
        </Link>
        <div className="flex gap-2">
          <Button variant="outline">
            <Send className="w-4 h-4 mr-2" />
            Enviar por Email
          </Button>
          <Button>
            <Download className="w-4 h-4 mr-2" />
            Descargar PDF
          </Button>
           <Link href={`/invoices/${invoice.id}/edit`} passHref>
            <Button variant="secondary">
                <Edit className="w-4 h-4 mr-2" />
                Editar
            </Button>
          </Link>
        </div>
      </div>

      <Card className="overflow-hidden shadow-lg">
        <CardHeader className="p-6 bg-muted/30">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold font-headline text-primary">{invoice.vendorName}</h1>
              {invoice.vendorAddress && <p className="text-sm text-muted-foreground">{invoice.vendorAddress}</p>}
              {invoice.vendorTaxId && <p className="text-sm text-muted-foreground">NIF: {invoice.vendorTaxId}</p>}
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-semibold font-headline text-foreground">FACTURA</h2>
              <p className="text-lg text-muted-foreground">{invoice.invoiceNumber}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <h3 className="mb-2 text-sm font-semibold tracking-wider uppercase text-muted-foreground">Facturar a:</h3>
              <p className="font-medium text-foreground">{invoice.customer.companyName || invoice.customer.name}</p>
              {invoice.customer.address && (
                <>
                  <p className="text-sm text-muted-foreground">{invoice.customer.address.street}</p>
                  <p className="text-sm text-muted-foreground">
                    {invoice.customer.address.zipCode} {invoice.customer.address.city}
                  </p>
                  <p className="text-sm text-muted-foreground">{invoice.customer.address.country}</p>
                </>
              )}
              {invoice.customer.email && <p className="text-sm text-muted-foreground">Email: {invoice.customer.email}</p>}
              {invoice.customer.taxId && <p className="text-sm text-muted-foreground">NIF/CIF: {invoice.customer.taxId}</p>}
            </div>
            <div className="md:text-right">
              <h3 className="mb-1 text-sm font-semibold tracking-wider uppercase text-muted-foreground">Fecha Emisión:</h3>
              <p className="mb-3 text-foreground">{formatDate(invoice.issueDate)}</p>
              <h3 className="mb-1 text-sm font-semibold tracking-wider uppercase text-muted-foreground">Fecha Vencimiento:</h3>
              <p className="mb-3 text-foreground">{formatDate(invoice.dueDate)}</p>
              <h3 className="mb-1 text-sm font-semibold tracking-wider uppercase text-muted-foreground">Estado:</h3>
              <StatusBadge status={invoice.status} />
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="mb-4 text-lg font-semibold font-headline text-foreground">Conceptos</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-2 py-3 font-semibold text-left text-muted-foreground">Descripción</th>
                    <th className="px-2 py-3 font-semibold text-right text-muted-foreground">Cant.</th>
                    <th className="px-2 py-3 font-semibold text-right text-muted-foreground">Precio Unit.</th>
                    <th className="px-2 py-3 font-semibold text-right text-muted-foreground">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item) => (
                    <tr key={item.id} className="border-b">
                      <td className="px-2 py-3 text-foreground">{item.description}</td>
                      <td className="px-2 py-3 text-right text-muted-foreground">{item.quantity}</td>
                      <td className="px-2 py-3 text-right text-muted-foreground">{formatCurrency(item.unitPrice, invoice.currency)}</td>
                      <td className="px-2 py-3 text-right text-foreground">{formatCurrency(item.total, invoice.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <Separator />

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-0">
            <div className="md:col-span-2">
             {invoice.notes && (
                <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-1">Notas:</h4>
                    <p className="text-sm text-muted-foreground">{invoice.notes}</p>
                </div>
             )}
            </div>
            <div className="space-y-2 text-right">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-medium text-foreground">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
              </div>
              {invoice.taxAmount !== undefined && invoice.taxRate !== undefined && (
                 <div className="flex justify-between">
                    <span className="text-muted-foreground">IVA ({invoice.taxRate}%):</span>
                    <span className="font-medium text-foreground">{formatCurrency(invoice.taxAmount, invoice.currency)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between">
                <span className="text-lg font-semibold text-foreground">Total:</span>
                <span className="text-lg font-semibold text-primary">{formatCurrency(invoice.totalAmount, invoice.currency)}</span>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="p-6 text-center bg-muted/30">
            <p className="text-xs text-muted-foreground">
                Si tienes alguna pregunta sobre esta factura, por favor contacta con {invoice.vendorName}.
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}

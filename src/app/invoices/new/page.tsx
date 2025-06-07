import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DatePickerDemo } from '@/components/date-picker-demo'; // Placeholder for a date picker component

export default function NewInvoicePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold tracking-tight font-headline">
        Crear Nueva Factura
      </h1>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Detalles de la Factura</CardTitle>
          <CardDescription>Completa la información para generar una nueva factura.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form className="space-y-8">
            {/* Customer Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium font-headline">Información del Cliente</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="customer-name">Nombre del Cliente</Label>
                  <Input id="customer-name" placeholder="Ej: Empresa S.L." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer-email">Email del Cliente</Label>
                  <Input id="customer-email" type="email" placeholder="contacto@empresa.com" />
                </div>
              </div>
              {/* Add more customer fields as needed: address, phone, tax ID */}
            </div>

            {/* Invoice Details Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium font-headline">Detalles de Factura</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="invoice-number">Número de Factura</Label>
                  <Input id="invoice-number" placeholder="Ej: FACT2024-010" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="issue-date">Fecha de Emisión</Label>
                  <DatePickerDemo /> {/* Replace with actual DatePicker */}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="due-date">Fecha de Vencimiento</Label>
                  <DatePickerDemo /> {/* Replace with actual DatePicker */}
                </div>
              </div>
            </div>

            {/* Invoice Items Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium font-headline">Conceptos de la Factura</h3>
              {/* Placeholder for dynamic item list */}
              <div className="p-4 border rounded-md bg-muted">
                <p className="text-sm text-muted-foreground">Aquí se añadirán los conceptos (descripción, cantidad, precio unitario).</p>
                <Button variant="outline" type="button" className="mt-2">Añadir Concepto</Button>
              </div>
            </div>
            
            {/* Totals Section */}
            <div className="space-y-4 pt-4 border-t">
                 <div className="flex justify-end items-center">
                    <p className="text-lg font-semibold">Total: 0.00 EUR</p>
                 </div>
            </div>

            {/* Notes Section */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notas Adicionales</Label>
              <Textarea id="notes" placeholder="Añade cualquier nota o término adicional aquí." />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" type="button">Guardar Borrador</Button>
              <Button type="submit">Crear y Enviar Factura</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

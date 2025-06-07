import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NewCustomerPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Añadir Nuevo Cliente
        </h1>
        <Link href="/customers" passHref>
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Clientes
          </Button>
        </Link>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Información del Cliente</CardTitle>
          <CardDescription>Completa los datos para registrar un nuevo cliente.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customer-name">Nombre Completo</Label>
                <Input id="customer-name" placeholder="Ej: Ana García Pérez" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-name">Nombre de la Empresa (Opcional)</Label>
                <Input id="company-name" placeholder="Ej: Soluciones Creativas S.L." />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customer-email">Email</Label>
                <Input id="customer-email" type="email" placeholder="contacto@empresa.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer-phone">Teléfono</Label>
                <Input id="customer-phone" type="tel" placeholder="+34 600 000 000" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer-taxid">NIF/CIF</Label>
              <Input id="customer-taxid" placeholder="Ej: B12345678" />
            </div>
            
            <h3 className="text-lg font-medium pt-4 border-t font-headline">Dirección</h3>
            <div className="space-y-2">
              <Label htmlFor="street">Calle y Número</Label>
              <Input id="street" placeholder="Ej: Calle de la Innovación 123" />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="city">Ciudad</Label>
                <Input id="city" placeholder="Ej: Madrid" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zip-code">Código Postal</Label>
                <Input id="zip-code" placeholder="Ej: 28001" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">País</Label>
                <Input id="country" placeholder="Ej: España" />
              </div>
            </div>

            <div className="flex justify-end pt-6">
              <Button type="submit">Guardar Cliente</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

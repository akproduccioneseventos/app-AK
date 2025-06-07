import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';

export default function CompanySettingsPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Información de la Empresa
        </h1>
        <Link href="/settings" passHref>
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Configuración
          </Button>
        </Link>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Datos de tu Empresa</CardTitle>
          <CardDescription>Esta información aparecerá en tus facturas y presupuestos.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="company-name">Nombre de la Empresa</Label>
              <Input id="company-name" placeholder="Ej: AK Producciones S.L." defaultValue="Presupuestador AK Producciones" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company-taxid">NIF/CIF</Label>
              <Input id="company-taxid" placeholder="Ej: B12345678" defaultValue="A08123456" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="company-address">Dirección Completa</Label>
              <Textarea 
                id="company-address" 
                placeholder="Ej: Calle Falsa 123, Piso 2, Oficina A..." 
                rows={3} 
                defaultValue="Calle de Ejemplo 456, Oficina 7A, 28002 Madrid, España" 
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="company-email">Email de Contacto</Label>
                <Input id="company-email" type="email" placeholder="contacto@tuempresa.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-phone">Teléfono de Contacto</Label>
                <Input id="company-phone" type="tel" placeholder="+34 900 000 000" />
              </div>
            </div>
            
            {/* Podrías añadir campos para IBAN, logo, etc. más adelante */}

            <div className="flex justify-end pt-6">
              <Button type="submit">
                <Save className="w-4 h-4 mr-2" />
                Guardar Información
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

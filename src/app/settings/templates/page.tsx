import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UploadCloud, Palette, Save } from 'lucide-react';
import Image from 'next/image';

export default function TemplateCustomizationPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold tracking-tight font-headline">
        Personalizar Plantilla de Factura
      </h1>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Apariencia de la Factura</CardTitle>
          <CardDescription>
            Ajusta el logo y los colores para que tus facturas reflejen tu marca.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="space-y-4">
            <h3 className="text-lg font-medium font-headline">Logotipo</h3>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 border rounded-md flex items-center justify-center bg-muted overflow-hidden">
                {/* Placeholder for current logo */}
                <Image 
                  src="https://placehold.co/100x100.png?text=Logo" 
                  alt="Logo" 
                  width={96} 
                  height={96} 
                  className="object-contain"
                  data-ai-hint="company logo" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="logo-upload">Subir nuevo logo (PNG, JPG)</Label>
                <div className="flex gap-2">
                  <Input id="logo-upload" type="file" accept="image/png, image/jpeg" className="max-w-xs" />
                  <Button variant="outline">
                    <UploadCloud className="w-4 h-4 mr-2" />
                    Subir
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Recomendado: 200x200px, máx 1MB.</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium font-headline">Esquema de Colores</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="primary-color">Color Principal</Label>
                <div className="flex items-center gap-2">
                  <Input id="primary-color" type="color" defaultValue="#FF0000" className="w-12 h-10 p-1" />
                  <Input type="text" defaultValue="#FF0000" className="flex-1" />
                </div>
                <p className="text-xs text-muted-foreground">Usado para encabezados y elementos destacados.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="accent-color">Color de Acento</Label>
                 <div className="flex items-center gap-2">
                  <Input id="accent-color" type="color" defaultValue="#FF0000" className="w-12 h-10 p-1" />
                  <Input type="text" defaultValue="#FF0000" className="flex-1" />
                </div>
                <p className="text-xs text-muted-foreground">Usado para detalles y llamadas a la acción.</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium font-headline">Previsualización de Plantilla</h3>
            <div className="p-4 border rounded-md aspect-[210/297] bg-muted flex items-center justify-center">
               <Image 
                  src="https://placehold.co/420x594.png?text=Factura+Ejemplo" 
                  alt="Vista Previa de Factura" 
                  width={210} 
                  height={297}
                  className="object-contain border shadow-md"
                  data-ai-hint="invoice template" 
                />
            </div>
          </div>


          <div className="flex justify-end pt-6 border-t">
            <Button size="lg">
              <Save className="w-5 h-5 mr-2" />
              Guardar Cambios
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

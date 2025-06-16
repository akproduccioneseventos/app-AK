
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UploadCloud, Palette, Save, ArrowLeft, Info } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

// Placeholder function for future save logic
async function saveTemplateSettings(settings: any) {
  console.log("Simulating save for template settings:", settings);
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
  return { success: true };
}


export default function TemplateCustomizationPage() {
  const { toast } = useToast();
  const [logoPreview, setLogoPreview] = useState<string | null>("https://placehold.co/150x60.png?text=Mi+Logo");
  const [primaryColor, setPrimaryColor] = useState("#EF4444"); // Default a nuestro rojo
  const [accentColor, setAccentColor] = useState("#F97316"); // Default a un naranja
  const [isSaving, setIsSaving] = useState(false);

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    // In a real app, you'd send this data to a backend
    const settings = { logo: logoPreview, primaryColor, accentColor };
    const result = await saveTemplateSettings(settings);
    if (result.success) {
      toast({ title: "Configuración Guardada", description: "Los cambios en la plantilla se han guardado (simulado)." });
    } else {
      toast({ title: "Error", description: "No se pudo guardar la configuración (simulado).", variant: "destructive" });
    }
    setIsSaving(false);
  };


  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Personalizar Plantilla de Documentos
        </h1>
        <Link href="/settings" passHref>
          <Button variant="outline" disabled={isSaving}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </Link>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Apariencia de Facturas y Presupuestos</CardTitle>
          <CardDescription>
            Define el logo y los colores para que tus documentos reflejen tu marca. Los cambios aquí afectarán cómo se generan los PDFs (funcionalidad futura).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Logotipo de la Empresa</h3>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-32 h-32 border rounded-md flex items-center justify-center bg-muted overflow-hidden flex-shrink-0">
                {logoPreview ? (
                  <Image 
                    src={logoPreview} 
                    alt="Logo Actual" 
                    width={120} 
                    height={120} 
                    className="object-contain"
                    data-ai-hint="company logo placeholder"
                  />
                ) : (
                  <span className="text-xs text-muted-foreground">Sin logo</span>
                )}
              </div>
              <div className="space-y-2 flex-grow">
                <Label htmlFor="logo-upload">Subir nuevo logo (PNG, JPG)</Label>
                <div className="flex gap-2">
                  <Input id="logo-upload" type="file" accept="image/png, image/jpeg" onChange={handleLogoChange} className="max-w-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" disabled={isSaving} />
                </div>
                <p className="text-xs text-muted-foreground">Recomendado: 300x100px (horizontal), máx 1MB.</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Colores de la Plantilla</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="primary-color">Color Principal</Label>
                <div className="flex items-center gap-2">
                  <Input id="primary-color" type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-12 h-10 p-1 aspect-square" disabled={isSaving}/>
                  <Input type="text" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="flex-1 h-10" disabled={isSaving}/>
                </div>
                <p className="text-xs text-muted-foreground">Usado para encabezados y elementos destacados.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="accent-color">Color de Acento</Label>
                 <div className="flex items-center gap-2">
                  <Input id="accent-color" type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="w-12 h-10 p-1 aspect-square" disabled={isSaving}/>
                  <Input type="text" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="flex-1 h-10" disabled={isSaving}/>
                </div>
                <p className="text-xs text-muted-foreground">Usado para detalles y líneas.</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Previsualización Estimada de Plantilla</h3>
            <div className="p-4 border rounded-md aspect-[210/297] bg-white flex items-center justify-center shadow-inner">
               <div className="w-full h-full border border-dashed border-gray-300 p-4 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    {logoPreview ? <Image src={logoPreview} alt="Logo" width={100} height={40} className="object-contain" data-ai-hint="company logo sample" /> : <div className="h-10 w-24 bg-gray-200 rounded text-xs flex items-center justify-center text-gray-500">Logo Aquí</div>}
                    <div className="text-right">
                      <h2 className="text-xl font-bold" style={{color: primaryColor}}>FACTURA</h2>
                      <p className="text-xs text-gray-500">Nº: 2024-001</p>
                    </div>
                  </div>
                  <div className="h-1 w-full rounded-full mb-4" style={{backgroundColor: accentColor}}></div>
                  <div className="flex-grow text-xs text-gray-600 space-y-1">
                    <p>Cliente: Nombre Cliente Ejemplo</p>
                    <p>Fecha: DD/MM/AAAA</p>
                    <div className="mt-3 border-t border-b border-dashed py-2">
                        <p>Item 1 .......................... $XX.XX</p>
                        <p>Item 2 .......................... $YY.YY</p>
                    </div>
                    <p className="text-right font-bold mt-2">Total: <span style={{color: primaryColor}}>$ZZ.ZZ</span></p>
                  </div>
                  <div className="mt-auto text-center text-[8px] text-gray-400 pt-2 border-t">
                    Pie de página personalizado aquí. Datos fiscales.
                  </div>
               </div>
            </div>
             <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2"><Info className="w-3 h-3"/>La previsualización es una simulación. La generación de PDF con estos estilos es una funcionalidad futura.</p>
          </div>


          <div className="flex justify-end pt-6 border-t">
            <Button size="lg" onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin"/> : <Save className="w-5 h-5 mr-2" />}
              {isSaving ? "Guardando..." : "Guardar Personalización"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

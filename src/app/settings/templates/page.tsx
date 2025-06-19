
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UploadCloud, Palette, Save, ArrowLeft, Info, Image as ImageIconLucide, AlertTriangle, Loader2 } from 'lucide-react';
import NextImage from 'next/image'; 
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import React, { useState, type ChangeEvent, useEffect, useCallback } from 'react';
import { Separator } from '@/components/ui/separator';
import type { InvoiceTemplateSettings } from '@/types/settings';
import { defaultInvoiceTemplateSettings } from '@/types/settings';
import { getInvoiceTemplateSettings, saveInvoiceTemplateSettings } from '@/app/actions/settings';


type LogoPosition = 'left' | 'center' | 'right';

export default function InvoiceTemplateCustomizationPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<InvoiceTemplateSettings>(defaultInvoiceTemplateSettings);
  const [logoPreview, setLogoPreview] = useState<string | null>(defaultInvoiceTemplateSettings.logoUrl);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedSettings = await getInvoiceTemplateSettings();
      setSettings(fetchedSettings);
      setLogoPreview(fetchedSettings.logoUrl || null);
    } catch (err: any) {
      setError("No se pudieron cargar las configuraciones de plantilla.");
      toast({ title: "Error al Cargar", description: err.message, variant: "destructive" });
      setSettings(defaultInvoiceTemplateSettings); // Fallback to defaults on error
      setLogoPreview(defaultInvoiceTemplateSettings.logoUrl);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);


  const handleSettingChange = (key: keyof Omit<InvoiceTemplateSettings, 'logoUrl'>, value: string | LogoPosition) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };
  
  const handleLogoFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setLogoPreview(dataUrl); // Update preview
        setSettings(prev => ({ ...prev, logoUrl: dataUrl })); // Update setting to be saved
      };
      reader.readAsDataURL(file);
    } else {
      setLogoPreview(null);
      setSettings(prev => ({...prev, logoUrl: null}));
    }
  };
  
  const handleLogoUrlChange = (event: ChangeEvent<HTMLInputElement>) => {
    const url = event.target.value;
    setLogoPreview(url || null); // Update preview immediately if it's a URL
    setSettings(prev => ({...prev, logoUrl: url || null}));
  }


  const handleSave = async () => {
    setIsSaving(true);
    const settingsToSave: InvoiceTemplateSettings = {
      ...settings,
      logoUrl: logoPreview // logoPreview will hold the Data URL or the direct URL
    };
    
    try {
        const result = await saveInvoiceTemplateSettings(settingsToSave);
        if (result.success && result.settings) {
          setSettings(result.settings); // Update state with potentially cleaned/defaulted data from server
          setLogoPreview(result.settings.logoUrl || null);
          toast({ title: "Configuración Guardada", description: "La apariencia de las facturas ha sido actualizada." });
        } else {
          throw new Error(result.error || "No se pudo guardar la configuración.");
        }
    } catch (err: any) {
        toast({ title: "Error", description: err.message || "No se pudo guardar la configuración.", variant: "destructive" });
    }
    setIsSaving(false);
  };
  
  const getLogoAlignmentClass = () => {
    switch (settings.logoPosition) {
      case 'center': return 'mx-auto';
      case 'right': return 'ml-auto';
      case 'left':
      default:
        return 'mr-auto';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="ml-3 text-lg">Cargando...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-destructive py-10">
        <AlertTriangle className="w-12 h-12 mx-auto mb-3" />
        <p className="font-semibold text-lg">{error}</p>
        <Button onClick={loadSettings} className="mt-4" variant="outline">Reintentar</Button>
      </div>
    );
  }


  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Palette className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Apariencia de Facturas
          </h1>
        </div>
        <Link href="/invoices" passHref>
          <Button variant="outline" disabled={isSaving}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </Link>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Personalización Visual</CardTitle>
          <CardDescription>
            Define el logo, colores y disposición para tus facturas. Estos ajustes se aplicarán al generar los documentos PDF.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Logo Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium font-headline text-primary border-b pb-1">Logotipo</h3>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-36 h-20 border rounded-md flex items-center justify-center bg-muted overflow-hidden flex-shrink-0 p-1">
                {logoPreview ? (
                  <NextImage 
                    src={logoPreview} 
                    alt="Logo Actual" 
                    width={140} 
                    height={70} 
                    className="object-contain"
                    data-ai-hint="company invoice logo"
                    onError={() => {
                        toast({variant: 'destructive', title: 'Error al cargar imagen', description: 'La URL del logo no es válida.'});
                        setLogoPreview(defaultInvoiceTemplateSettings.logoUrl); // Revert to placeholder on error
                    }}
                  />
                ) : (
                  <span className="text-xs text-muted-foreground">Sin logo</span>
                )}
              </div>
              <div className="space-y-2 flex-grow">
                <Label htmlFor="logo-upload">Subir nuevo logo (PNG, JPG)</Label>
                <Input 
                  id="logo-upload" 
                  type="file" 
                  accept="image/png, image/jpeg" 
                  onChange={handleLogoFileChange} 
                  className="max-w-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" 
                  disabled={isSaving} 
                />
                <p className="text-xs text-muted-foreground">O pega una URL directa al logo:</p>
                 <Input 
                  id="logo-url" 
                  type="url" 
                  value={settings.logoUrl || ''}
                  onChange={handleLogoUrlChange}
                  placeholder="https://ejemplo.com/logo.png"
                  className="max-w-xs text-sm"
                  disabled={isSaving}
                />
                <p className="text-xs text-muted-foreground">Recomendado: hasta 300px de ancho, máx 1MB.</p>
              </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="logo-position">Posición del Logo en el Documento</Label>
                <Select value={settings.logoPosition} onValueChange={(value) => handleSettingChange('logoPosition', value as LogoPosition)} disabled={isSaving}>
                    <SelectTrigger id="logo-position" className="max-w-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="left">Izquierda</SelectItem>
                        <SelectItem value="center">Centro</SelectItem>
                        <SelectItem value="right">Derecha</SelectItem>
                    </SelectContent>
                </Select>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-medium font-headline text-primary border-b pb-1">Colores para Documentos</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="primary-color-doc">Color Principal (Documento)</Label>
                <div className="flex items-center gap-2">
                  <Input id="primary-color-doc" type="color" value={settings.primaryColor} onChange={(e) => handleSettingChange('primaryColor', e.target.value)} className="w-12 h-10 p-1 aspect-square" disabled={isSaving}/>
                  <Input type="text" value={settings.primaryColor} onChange={(e) => handleSettingChange('primaryColor', e.target.value)} className="flex-1 h-10" placeholder="#RRGGBB" disabled={isSaving}/>
                </div>
                <p className="text-xs text-muted-foreground">Para títulos y elementos principales.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="accent-color-doc">Color de Acento (Documento)</Label>
                 <div className="flex items-center gap-2">
                  <Input id="accent-color-doc" type="color" value={settings.accentColor} onChange={(e) => handleSettingChange('accentColor', e.target.value)} className="w-12 h-10 p-1 aspect-square" disabled={isSaving}/>
                  <Input type="text" value={settings.accentColor} onChange={(e) => handleSettingChange('accentColor', e.target.value)} className="flex-1 h-10" placeholder="#RRGGBB" disabled={isSaving}/>
                </div>
                <p className="text-xs text-muted-foreground">Para líneas, detalles o fondos sutiles.</p>
              </div>
            </div>
          </div>
          
          <Separator />

           <div className="space-y-2">
            <h3 className="text-lg font-medium font-headline text-primary border-b pb-1">Pie de Página</h3>
            <div className="flex items-start gap-2 p-3 border rounded-md bg-muted/50">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"/>
              <p className="text-sm text-muted-foreground">
                El texto del pie de página personalizado para las facturas se gestiona en la sección <Link href="/settings/company" className="text-primary underline hover:text-primary/80">Información de la Empresa</Link>.
              </p>
            </div>
          </div>

          <Separator />
          
          <div className="space-y-2">
            <h3 className="text-lg font-medium font-headline text-primary border-b pb-1">Próximas Opciones</h3>
            <div className="p-3 border border-dashed rounded-md text-sm text-muted-foreground space-y-1">
                <p>☑️ Selección de Fuente Tipográfica.</p>
                <p>☑️ Ajuste del Tamaño General del Texto.</p>
                <p>☑️ Configuración de Márgenes y Espaciado.</p>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-medium font-headline text-primary border-b pb-1">Previsualización Estimada de Factura</h3>
            <div className="p-4 border rounded-md aspect-[210/297] bg-white flex items-center justify-center shadow-inner">
               <div className="w-full h-full border border-dashed border-gray-300 p-4 flex flex-col">
                  <div className={`flex items-start mb-4 ${settings.logoPosition === 'center' ? 'justify-center' : settings.logoPosition === 'right' ? 'justify-end' : 'justify-start'}`}>
                    {logoPreview ? <NextImage src={logoPreview} alt="Logo Previsualización" width={100} height={40} className={`object-contain ${getLogoAlignmentClass()}`} data-ai-hint="company invoice logo" /> : <div className={`h-10 w-24 bg-gray-200 rounded text-xs flex items-center justify-center text-gray-500 ${getLogoAlignmentClass()}`}>Logo Aquí</div>}
                  </div>
                  <div className={`flex ${settings.logoPosition === 'center' ? 'justify-center' : 'justify-between'} items-center mb-4`}>
                    {settings.logoPosition !== 'center' && <div className="w-1/3"></div>} 
                    <h2 className="text-xl font-bold text-center flex-grow" style={{color: settings.primaryColor}}>FACTURA</h2>
                    {settings.logoPosition !== 'center' && <div className="w-1/3 text-right"><p className="text-xs text-gray-500">Nº: 2024-001</p></div>}
                  </div>
                  {settings.logoPosition === 'center' && <p className="text-xs text-gray-500 text-center mb-2">Nº: 2024-001</p>}

                  <div className="h-0.5 w-full rounded-full mb-4" style={{backgroundColor: settings.accentColor}}></div>
                  <div className="flex-grow text-xs text-gray-700 space-y-1">
                    <p><span className="font-medium">Cliente:</span> Nombre Cliente Ejemplo</p>
                    <p><span className="font-medium">Fecha:</span> DD/MM/AAAA</p>
                    <div className="mt-3 border-t border-b border-dashed py-2">
                        <p>Servicio Ejemplo 1 .......................... <span style={{color: settings.primaryColor}}>$XX.XX</span></p>
                        <p>Producto Ejemplo 2 .......................... <span style={{color: settings.primaryColor}}>$YY.YY</span></p>
                    </div>
                    <p className="text-right font-bold mt-2">Total: <span style={{color: settings.primaryColor}}>$ZZ.ZZ</span></p>
                  </div>
                  <div className="mt-auto text-center text-[8px] text-gray-500 pt-2 border-t">
                    Pie de página simulado. El contenido real se define en "Información de la Empresa".
                  </div>
               </div>
            </div>
             <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2"><Info className="w-3 h-3"/>La previsualización es una simulación. La aplicación real de estos estilos a la generación de PDF es una funcionalidad futura.</p>
          </div>
        </CardContent>
         <CardFooter className="border-t pt-6">
            <Button size="lg" onClick={handleSave} disabled={isSaving || isLoading}>
                {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin"/> : <Save className="w-5 h-5 mr-2" />}
                {isSaving ? "Guardando..." : "Guardar Personalización"}
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}


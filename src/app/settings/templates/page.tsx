
'use client';

import React, { useState, type ChangeEvent, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Palette, Save, ArrowLeft, Info, AlertTriangle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import type { InvoiceTemplateSettings } from '@/types/settings';
import { defaultInvoiceTemplateSettings } from '@/types/settings';
import { getInvoiceTemplateSettings, saveInvoiceTemplateSettings } from '@/app/actions/settings';


type LogoPosition = 'left' | 'center' | 'right';

export default function TemplatesSettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<InvoiceTemplateSettings>(defaultInvoiceTemplateSettings);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedSettings = await getInvoiceTemplateSettings();
      setSettings(fetchedSettings);
    } catch (err: any) {
      setError("No se pudieron cargar las configuraciones de plantilla.");
      toast({ title: "Error al Cargar", description: err.message, variant: "destructive" });
      setSettings(defaultInvoiceTemplateSettings); // Fallback to defaults on error
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
  
  const handleSave = async () => {
    setIsSaving(true);
    try {
        const result = await saveInvoiceTemplateSettings(settings);
        if (result.success && result.settings) {
          setSettings(result.settings);
          toast({ title: "Configuración Guardada", description: "La apariencia de las facturas ha sido actualizada." });
        } else {
          throw new Error(result.error || "No se pudo guardar la configuración.");
        }
    } catch (err: any) {
        toast({ title: "Error", description: err.message || "No se pudo guardar la configuración.", variant: "destructive" });
    }
    setIsSaving(false);
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
            Apariencia de Documentos
          </h1>
        </div>
        <Link href="/settings" passHref>
          <Button variant="outline" disabled={isSaving}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </Link>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Personalización Visual de Facturas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
           <div className="space-y-2">
            <h3 className="text-lg font-medium font-headline text-primary border-b pb-1">Logotipo</h3>
            <div className="flex items-start gap-2 p-3 border rounded-md bg-muted/50">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"/>
              <p className="text-sm text-muted-foreground">
                El logotipo de la empresa ahora se gestiona desde la sección <Link href="/settings/company" className="text-primary underline hover:text-primary/80">Información de la Empresa</Link> para unificar la marca.
              </p>
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
          
        </CardContent>
         <CardFooter className="border-t pt-6">
                 <Button onClick={handleSave} disabled={isSaving || isLoading}>
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Save className="w-4 h-4 mr-2" />}
                    {isSaving ? "Guardando..." : "Guardar Colores"}
                </Button>
            </CardFooter>
      </Card>
    </div>
  );
}

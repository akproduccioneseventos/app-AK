
'use client';

import React, { useState, useEffect, useCallback, type FormEvent } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, Settings as SettingsIcon, Loader2, AlertTriangle, Percent, Info, Tag, Package, Bot, Sparkles, Code2, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { BudgetDisplaySettings } from '@/types/settings';
import { defaultBudgetDisplaySettings } from '@/types/settings';
import { getBudgetDisplaySettings, saveBudgetDisplaySettings } from '@/app/actions/settings';
import { Separator } from '@/components/ui/separator';

export default function BudgetDisplaySettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<BudgetDisplaySettings>(defaultBudgetDisplaySettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedSettings = await getBudgetDisplaySettings();
      setSettings(fetchedSettings);
    } catch (err: any) {
      setError("No se pudieron cargar las configuraciones.");
      toast({ title: "Error al Cargar", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSettingChange = (key: keyof BudgetDisplaySettings, value: boolean | number | undefined | any[]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const result = await saveBudgetDisplaySettings(settings);
      if (result.success && result.settings) {
        setSettings(result.settings);
        toast({ title: "Configuración Guardada", description: "Las preferencias de visualización del presupuesto han sido actualizadas." });
      } else {
        throw new Error(result.error || "No se pudo guardar la configuración.");
      }
    } catch (err: any) {
      toast({ title: "Error al Guardar", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="ml-3 text-lg">Cargando configuración...</p>
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
  
  const settingsOptions = [
    { id: "showCompanyLogo", label: "Mostrar logo de la empresa", description: "Incluye el logo de tu empresa en la parte superior." },
    { id: "showClientData", label: "Mostrar datos del cliente", description: "Incluye el nombre y detalles del cliente." },
    { id: "showEventTypeAndDate", label: "Mostrar tipo y fecha de la fiesta", description: "Muestra la información básica del evento." },
    { id: "showPriceBreakdown", label: "Mostrar desglose de precios por servicio", description: "Detalla los precios de cada plato y servicio adicional." },
    { id: "showPaymentMethodNotes", label: "Incluir observaciones o notas finales", description: "Muestra la sección de notas y condiciones (donde podría ir la forma de pago)." },
  ] as const;


  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SettingsIcon className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Configuración de Presupuestos y Cotizaciones
          </h1>
        </div>
        <Link href="/settings" passHref>
          <Button variant="outline" disabled={isSaving}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </Link>
      </div>
      
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="font-headline text-xl flex items-center gap-2"><Wand2 className="text-primary"/>Simulador de Presupuesto</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Configura los paquetes predefinidos que los clientes pueden usar para obtener una cotización instantánea.
                </p>
                <Link href="/settings/simulador-config" passHref className="w-full">
                     <Button variant="outline" className="w-full">Configurar Paquetes</Button>
                </Link>
            </CardContent>
          </Card>
        </div>


      <form onSubmit={handleSubmit}>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-xl">Opciones de Contenido del PDF</CardTitle>
            <CardDescription>
              Selecciona qué elementos quieres que aparezcan al imprimir o compartir tus presupuestos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {settingsOptions.map((option, index) => (
              <React.Fragment key={option.id}>
                {index > 0 && <Separator />}
                <div className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/20 transition-colors">
                  <div>
                    <Label htmlFor={option.id} className="text-base font-medium">{option.label}</Label>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </div>
                  <Switch
                    id={option.id}
                    checked={settings[option.id]}
                    onCheckedChange={(value) => handleSettingChange(option.id, value)}
                    disabled={isSaving}
                  />
                </div>
              </React.Fragment>
            ))}
            <Separator />
             <div className="space-y-3 p-3 border rounded-md hover:bg-muted/20 transition-colors">
                <Label htmlFor="annualAdjustmentPercentage" className="text-base font-medium flex items-center gap-2">
                    <Percent className="w-5 h-5 text-primary/80"/> Ajuste Anual Automático (%)
                </Label>
                <p className="text-sm text-muted-foreground">
                    Define un porcentaje de ajuste que se podría aplicar a presupuestos para eventos en años futuros. Se indicará en el presupuesto si aplica y se calcularía al momento de facturar.
                </p>
                <Input
                    id="annualAdjustmentPercentage"
                    type="number"
                    value={settings.annualAdjustmentPercentage ?? ''}
                    onChange={(e) => handleSettingChange('annualAdjustmentPercentage', e.target.value === '' ? undefined : parseFloat(e.target.value))}
                    placeholder="Ej: 15 para 15%"
                    min="0"
                    max="100"
                    step="0.1"
                    disabled={isSaving}
                    className="max-w-xs"
                />
            </div>
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button type="submit" disabled={isSaving || isLoading}>
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {isSaving ? "Guardando..." : "Guardar Configuración de Visualización"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}

'use client';

import React, { useState, useEffect, useCallback, type FormEvent } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
    ArrowLeft, Save, Loader2, Wand2, PlusCircle, Trash2, 
    Percent, Tag, MessageSquare, ListPlus, ShieldCheck, Zap, Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveBudgetDisplaySettings, getBudgetDisplaySettings } from '@/app/actions/settings';
import type { BudgetDisplaySettings } from '@/types/settings';
import { Separator } from '@/components/ui/separator';

export default function BudgetDisplaySettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<BudgetDisplaySettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      setIsLoading(true);
      try {
        const data = await getBudgetDisplaySettings();
        setSettings(data);
      } catch (e) {
        toast({ title: "Error", description: "No se pudo cargar la configuración.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, [toast]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setIsSaving(true);
    try {
      const result = await saveBudgetDisplaySettings(settings);
      if (result.success) {
        toast({ title: "Configuración Actualizada", description: "Los cambios se aplicarán en el simulador y presupuestos." });
      } else throw new Error(result.error);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const addValueProp = () => {
    setSettings(prev => prev ? { ...prev, valuePropositions: [...(prev.valuePropositions || []), "Nueva ventaja competitiva"] } : null);
  };

  const removeValueProp = (index: number) => {
    setSettings(prev => prev ? { ...prev, valuePropositions: (prev.valuePropositions || []).filter((_, i) => i !== index) } : null);
  };

  const updateValueProp = (index: number, value: string) => {
    setSettings(prev => {
        if (!prev) return null;
        const updated = [...(prev.valuePropositions || [])];
        updated[index] = value;
        return { ...prev, valuePropositions: updated };
    });
  };

  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary w-12 h-12"/></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-32">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
            <div className="p-3 bg-primary rounded-2xl shadow-xl shadow-primary/20 text-white">
                <Wand2 className="w-8 h-8" />
            </div>
            <div>
                <h1 className="text-3xl font-black tracking-tight font-headline uppercase">Estrategia de Venta</h1>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Configuración de Mensajes y Conversión</p>
            </div>
        </div>
        <Link href="/settings" passHref><Button variant="outline" className="rounded-xl"><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button></Link>
      </header>

      <form onSubmit={handleSave} className="space-y-8">
        {/* PANEL DE MENSAJES PERSUASIVOS */}
        <Card className="shadow-2xl border-none rounded-[2rem] overflow-hidden bg-white">
            <CardHeader className="bg-slate-50 border-b border-slate-100 p-8">
                <CardTitle className="font-headline text-xl text-slate-800 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-primary"/> Mensajes de Cierre
                </CardTitle>
                <CardDescription>Configura los textos que guían al cliente a la contratación final.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mensaje de Éxito (Paso Final)</Label>
                    <Textarea 
                        value={settings?.successMessage || ''} 
                        onChange={e => setSettings(s => s ? { ...s, successMessage: e.target.value } : null)}
                        className="rounded-xl bg-slate-50 border-none shadow-inner min-h-[100px] font-medium"
                        placeholder="Mensaje persuasivo después de generar el presupuesto..."
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Condiciones de Reserva y Seña</Label>
                    <Textarea 
                        value={settings?.bookingTerms || ''} 
                        onChange={e => setSettings(s => s ? { ...s, bookingTerms: e.target.value } : null)}
                        className="rounded-xl bg-slate-50 border-none shadow-inner min-h-[100px] font-medium"
                        placeholder="Ej: Se requiere seña de $5.000 para reservar..."
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Plantilla Mensaje WhatsApp</Label>
                    <Textarea 
                        value={settings?.whatsappMessageTemplate || ''} 
                        onChange={e => setSettings(s => s ? { ...s, whatsappMessageTemplate: e.target.value } : null)}
                        className="rounded-xl bg-slate-50 border-none shadow-inner min-h-[80px] font-medium"
                        placeholder="Texto automático que se enviará al organizador..."
                    />
                    <p className="text-[10px] text-muted-foreground italic">El sistema añadirá automáticamente el link al presupuesto al final de este texto.</p>
                </div>
            </CardContent>
        </Card>

        {/* PROPUESTA DE VALOR */}
        <Card className="shadow-2xl border-none rounded-[2rem] overflow-hidden bg-white">
            <CardHeader className="bg-slate-50 border-b border-slate-100 p-8">
                <CardTitle className="font-headline text-xl text-slate-800 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary"/> Por qué elegirnos (Sales Booster)
                </CardTitle>
                <CardDescription>Lista de ventajas competitivas que aparecerán junto al presupuesto.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-4">
                {(settings?.valuePropositions || []).map((prop, index) => (
                    <div key={index} className="flex gap-2 group">
                        <div className="flex-grow">
                            <Input 
                                value={prop} 
                                onChange={e => updateValueProp(index, e.target.value)}
                                className="rounded-xl bg-slate-50 border-none h-11"
                            />
                        </div>
                        <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="h-11 w-11 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeValueProp(index)}
                        >
                            <Trash2 className="w-4 h-4"/>
                        </Button>
                    </div>
                ))}
                <Button type="button" variant="outline" onClick={addValueProp} className="w-full h-12 rounded-xl border-dashed border-primary/30 text-primary font-bold">
                    <PlusCircle className="w-4 h-4 mr-2"/> Añadir Beneficio
                </Button>
            </CardContent>
        </Card>

        {/* AJUSTES TÉCNICOS */}
        <Card className="shadow-2xl border-none rounded-[2rem] overflow-hidden bg-slate-900 text-white">
            <CardHeader className="p-8 border-b border-white/5">
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-primary"/> Ajustes Financieros
                </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Porcentaje de Ajuste Anual (%)</Label>
                    <div className="flex items-center gap-4">
                        <Input 
                            type="number" 
                            value={settings?.annualAdjustmentPercentage ?? ''} 
                            onChange={e => setSettings(s => s ? { ...s, annualAdjustmentPercentage: Number(e.target.value) } : null)}
                            className="h-12 rounded-xl bg-white/10 border-none text-white font-bold text-lg w-32" 
                        />
                        <p className="text-xs text-slate-400">Se aplica automáticamente si el evento pasa a un año posterior al presupuesto.</p>
                    </div>
                </div>
            </CardContent>
        </Card>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-xl border-t border-slate-100 z-50">
            <div className="max-w-3xl mx-auto flex justify-end">
                <Button type="submit" disabled={isSaving} size="lg" className="rounded-2xl px-12 h-14 font-black text-base shadow-2xl shadow-primary/30">
                    {isSaving ? <Loader2 className="animate-spin mr-3"/> : <Save className="w-5 h-5 mr-3"/>}
                    {isSaving ? 'GUARDANDO...' : 'GUARDAR ESTRATEGIA'}
                </Button>
            </div>
        </div>
      </form>
    </div>
  );
}

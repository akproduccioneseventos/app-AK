'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Loader2, Bot, Info, Lightbulb } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getAIAssistantSettings, saveAIAssistantSettings } from '@/app/actions/settings';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const EXAMPLES = [
  'Cuando el cliente consulte por precios, siempre ofrecer un 5% de descuento si pagan al contado.',
  'Hablar siempre de manera muy formal con los clientes.',
  'Si el cliente pide DJ, recomendar también el paquete de iluminación.',
  'No confirmar fechas sin antes verificar disponibilidad con Alexander.',
  'Para eventos en el Salón Diamante, mencionar que tiene capacidad máxima de 150 personas.',
];

export default function AIAssistantSettingsPage() {
  const { toast } = useToast();
  const [customInstructions, setCustomInstructions] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [updatedAt, setUpdatedAt] = useState('');

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const settings = await getAIAssistantSettings();
      setCustomInstructions(settings.customInstructions || '');
      setUpdatedAt(settings.updatedAt || '');
    } catch {
      toast({ title: 'Error', description: 'No se pudieron cargar las configuraciones.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const result = await saveAIAssistantSettings({ customInstructions });
      if (result.success) {
        toast({ title: '¡Guardado!', description: 'Las instrucciones del Asistente AK fueron actualizadas.' });
        setUpdatedAt(new Date().toISOString());
      } else {
        toast({ title: 'Error', description: result.error || 'No se pudo guardar.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Error inesperado al guardar.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-2xl">
            <Bot className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">Asistente IA — Personalidad</h1>
            <p className="text-sm text-muted-foreground">
              Configurá las instrucciones y reglas personalizadas que seguirá el Asistente AK.
            </p>
          </div>
        </div>
        <Link href="/settings">
          <Button variant="outline" disabled={isSaving}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </Link>
      </div>

      {/* Info card */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="flex gap-3 pt-4 pb-4">
          <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800 space-y-1">
            <p className="font-semibold">¿Cómo funciona?</p>
            <p>
              Las instrucciones que escribas acá se agregan al contexto del Asistente AK cada vez que el usuario
              interactúa con él. Usá este espacio para darle reglas de negocio, personalidad personalizada,
              descuentos habituales, restricciones o cualquier información que quieras que el asistente siempre tenga en cuenta.
            </p>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSave} className="space-y-6">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="font-headline text-xl flex items-center gap-2">
              <Bot className="w-5 h-5" />
              Instrucciones Personalizadas
            </CardTitle>
            <CardDescription>
              Escribí las reglas, comportamientos y datos extra que debe seguir el Asistente AK.
              Dejalo en blanco para usar el comportamiento predeterminado.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder={`Escribí tus instrucciones personalizadas, por ejemplo:\nSiempre ofrecer un 5% de descuento si el cliente paga al contado.\nHablar de manera formal con los clientes.\nPara eventos en Salón Diamante, mencionar capacidad máxima de 150 personas.`}
              className="min-h-[200px] font-mono text-sm resize-y"
              disabled={isSaving}
            />
            {updatedAt && (
              <p className="text-xs text-muted-foreground">
                Última actualización: {new Date(updatedAt).toLocaleString('es-UY', { timeZone: 'America/Montevideo' })}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Examples */}
        <Card className="shadow-sm border-dashed">
          <CardHeader className="pb-3">
            <CardTitle className="font-headline text-base flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              Ejemplos de instrucciones útiles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {EXAMPLES.map((example, i) => (
              <div key={i} className="flex items-start gap-2">
                <Badge variant="secondary" className="text-xs shrink-0 mt-0.5">
                  Ejemplo {i + 1}
                </Badge>
                <button
                  type="button"
                  className="text-sm text-left text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => {
                    const current = customInstructions.trim();
                    setCustomInstructions(current ? `${current}\n${example}` : example);
                  }}
                >
                  {example}
                  <span className="ml-1 text-xs text-primary underline">(agregar)</span>
                </button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Separator />

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={loadSettings}
            disabled={isSaving}
          >
            Descartar cambios
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Guardar Instrucciones
          </Button>
        </div>
      </form>
    </div>
  );
}

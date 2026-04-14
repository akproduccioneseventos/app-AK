'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Bot, Save, Loader2, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getAiAssistantSettings, saveAiAssistantSettings } from '@/app/actions/settings';

export default function AiAssistantSettingsPage() {
  const [customInstructions, setCustomInstructions] = useState('');
  const [updatedAt, setUpdatedAt] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    getAiAssistantSettings().then((data) => {
      setCustomInstructions(data.customInstructions || '');
      setUpdatedAt(data.updatedAt || '');
      setIsLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    const result = await saveAiAssistantSettings({ customInstructions });
    setIsSaving(false);
    if (result.success) {
      setUpdatedAt(new Date().toISOString());
      toast({ title: 'Guardado', description: 'Instrucciones del Asistente AK actualizadas.' });
    } else {
      toast({ title: 'Error', description: result.error || 'No se pudo guardar.', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/settings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="p-2 bg-violet-100 rounded-lg">
          <Bot className="w-6 h-6 text-violet-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Asistente IA — Configuración</h1>
          <p className="text-sm text-muted-foreground">
            Personalizá el comportamiento del Asistente AK con instrucciones propias.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Instrucciones personalizadas</CardTitle>
          <CardDescription>
            Escribí reglas, preferencias o comportamientos específicos que el Asistente debe seguir
            en cada conversación. Por ejemplo: &ldquo;Siempre ofrecé un 10% de descuento si pagan
            contado&rdquo;, o &ldquo;Hablá siempre de manera muy formal&rdquo;.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Cargando configuración...</span>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="customInstructions">Instrucciones para el Asistente</Label>
                <Textarea
                  id="customInstructions"
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="Ej: Siempre saludá al cliente por su nombre. Ofrecé descuento del 10% si el cliente menciona que viene recomendado. No presiones con ventas, respondé con paciencia..."
                  rows={10}
                  className="resize-y font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Estas instrucciones se inyectan en cada conversación del Asistente AK y del Simulador Chat.
                </p>
              </div>
              {updatedAt && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                  <span>
                    Última actualización:{' '}
                    {new Date(updatedAt).toLocaleString('es-UY', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              )}
              <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Guardar instrucciones
                  </>
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="bg-violet-50 border-violet-200">
        <CardContent className="pt-5 pb-4">
          <div className="flex gap-3">
            <Bot className="w-5 h-5 text-violet-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-violet-800">Ejemplos de instrucciones útiles</p>
              <ul className="text-xs text-violet-700 space-y-1 list-disc list-inside">
                <li>Ofrecé siempre un 5% de descuento si el cliente paga el 50% de seña.</li>
                <li>Si el cliente pregunta por precios, explicá que son orientativos y que el presupuesto final se envía por escrito.</li>
                <li>Nunca confirmes fechas sin antes verificar disponibilidad con el equipo.</li>
                <li>Si el cliente menciona más de 200 invitados, sugerí el Salón Principal.</li>
                <li>Siempre terminá con una pregunta para avanzar en la venta.</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

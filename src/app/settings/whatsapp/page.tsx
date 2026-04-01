'use client';

import React, { useState, useEffect, useCallback, type FormEvent } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, MessageCircle, Save, Loader2, Bot, Hand, AlertTriangle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { getWhatsAppSettings, saveWhatsAppSettings } from '@/app/actions/settings';
import type { WhatsAppSettings } from '@/types/settings';

export default function WhatsAppSettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<WhatsAppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getWhatsAppSettings();
      setSettings(data);
    } catch {
      toast({ title: 'Error', description: 'No se pudieron cargar las configuraciones.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setIsSaving(true);
    try {
      const result = await saveWhatsAppSettings(settings);
      if (result.success) {
        toast({ title: 'Configuración Guardada', description: 'Las opciones de WhatsApp han sido actualizadas.' });
      } else {
        toast({ title: 'Error', description: result.error || 'No se pudo guardar.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Error inesperado al guardar.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !settings) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageCircle className="w-8 h-8 text-green-500" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">Integración WhatsApp</h1>
        </div>
        <Link href="/settings">
          <Button variant="outline" disabled={isSaving}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Configuración
          </Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Global toggle */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-xl flex items-center gap-2">
              <span>Estado General</span>
              {settings.enabled ? (
                <Badge className="bg-green-100 text-green-700 border-green-300">Activo</Badge>
              ) : (
                <Badge variant="secondary">Inactivo</Badge>
              )}
            </CardTitle>
            <CardDescription>
              Interruptor principal. Apagarlo desactiva todas las funciones de WhatsApp en la app.
              Útil si WhatsApp bloquea temporalmente tu número.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 border rounded-md bg-muted/30">
              <Label htmlFor="wa-enabled" className="flex flex-col space-y-1 cursor-pointer">
                <span className="text-base font-medium">WhatsApp {settings.enabled ? 'Activado' : 'Desactivado'}</span>
                <span className="font-normal text-muted-foreground text-sm">
                  {settings.enabled
                    ? 'Los botones y funciones de WhatsApp están visibles y activos.'
                    : 'Los botones de WhatsApp están ocultos en toda la aplicación.'}
                </span>
              </Label>
              <Switch
                id="wa-enabled"
                checked={settings.enabled}
                onCheckedChange={(val) => setSettings(s => s ? { ...s, enabled: val } : s)}
                disabled={isSaving}
              />
            </div>
            {!settings.enabled && (
              <div className="mt-3 flex items-start gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>La integración está pausada. Los botones de envío por WhatsApp no aparecerán en el CRM ni en los presupuestos.</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sending mode */}
        <Card className={`shadow-lg transition-opacity ${!settings.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
          <CardHeader>
            <CardTitle className="font-headline text-xl">Modo de Envío</CardTitle>
            <CardDescription>
              Elegí cómo se envían los mensajes cuando WhatsApp está activo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div
              className={`flex items-start gap-4 p-4 border-2 rounded-md cursor-pointer transition-colors ${
                settings.sendingMode === 'manual'
                  ? 'border-green-500 bg-green-50'
                  : 'border-border hover:border-muted-foreground/40'
              }`}
              onClick={() => setSettings(s => s ? { ...s, sendingMode: 'manual' } : s)}
            >
              <Hand className={`w-6 h-6 mt-0.5 shrink-0 ${settings.sendingMode === 'manual' ? 'text-green-600' : 'text-muted-foreground'}`} />
              <div>
                <p className="font-semibold">Modo Manual (Seguro)</p>
                <p className="text-sm text-muted-foreground">
                  El sistema redacta el mensaje por vos y te muestra un botón verde. Al hacer clic, abre tu propio
                  WhatsApp (celular o PC) con el mensaje ya escrito. Solo tenés que apretar enviar.
                </p>
              </div>
              <div className="ml-auto shrink-0">
                <Switch
                  checked={settings.sendingMode === 'manual'}
                  onCheckedChange={() => setSettings(s => s ? { ...s, sendingMode: 'manual' } : s)}
                  disabled={isSaving}
                />
              </div>
            </div>

            <div
              className={`flex items-start gap-4 p-4 border-2 rounded-md cursor-pointer transition-colors ${
                settings.sendingMode === 'automatic'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-muted-foreground/40'
              }`}
              onClick={() => setSettings(s => s ? { ...s, sendingMode: 'automatic' } : s)}
            >
              <Bot className={`w-6 h-6 mt-0.5 shrink-0 ${settings.sendingMode === 'automatic' ? 'text-primary' : 'text-muted-foreground'}`} />
              <div>
                <p className="font-semibold">Modo Automático</p>
                <p className="text-sm text-muted-foreground">
                  El sistema intenta enviar los mensajes automáticamente en segundo plano (requiere bot configurado).
                  Si el bot no está disponible, se usa el modo manual como respaldo.
                </p>
              </div>
              <div className="ml-auto shrink-0">
                <Switch
                  checked={settings.sendingMode === 'automatic'}
                  onCheckedChange={() => setSettings(s => s ? { ...s, sendingMode: 'automatic' } : s)}
                  disabled={isSaving}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Message templates */}
        <Card className={`shadow-lg transition-opacity ${!settings.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
          <CardHeader>
            <CardTitle className="font-headline text-xl">Plantillas de Mensajes</CardTitle>
            <CardDescription>
              Personalizá el texto que se usa como base para cada tipo de mensaje.
              Usá las etiquetas entre {'{{'}dobles llaves{'}}'} para insertar datos dinámicos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="reminder-template" className="font-semibold">
                Recordatorio de Reunión (CRM)
              </Label>
              <p className="text-xs text-muted-foreground">
                Variables disponibles: <code className="bg-muted px-1 rounded">{'{{NOMBRE}}'}</code>{' '}
                <code className="bg-muted px-1 rounded">{'{{FECHA}}'}</code>{' '}
                <code className="bg-muted px-1 rounded">{'{{HORA}}'}</code>
              </p>
              <Textarea
                id="reminder-template"
                value={settings.reminderMessageTemplate}
                onChange={(e) => setSettings(s => s ? { ...s, reminderMessageTemplate: e.target.value } : s)}
                rows={3}
                disabled={isSaving}
                className="resize-none"
              />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="payment-template" className="font-semibold">
                Recordatorio de Pago Pendiente (Presupuestos)
              </Label>
              <p className="text-xs text-muted-foreground">
                Variables disponibles: <code className="bg-muted px-1 rounded">{'{{NOMBRE}}'}</code>{' '}
                <code className="bg-muted px-1 rounded">{'{{SALDO}}'}</code>{' '}
                <code className="bg-muted px-1 rounded">{'{{FECHA_EVENTO}}'}</code>{' '}
                <code className="bg-muted px-1 rounded">{'{{LINK}}'}</code>
              </p>
              <Textarea
                id="payment-template"
                value={settings.paymentReminderTemplate}
                onChange={(e) => setSettings(s => s ? { ...s, paymentReminderTemplate: e.target.value } : s)}
                rows={3}
                disabled={isSaving}
                className="resize-none"
              />
            </div>
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {isSaving ? 'Guardando...' : 'Guardar Configuración'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}

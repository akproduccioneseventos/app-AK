'use client';

import React, { useState, useEffect, useCallback, type FormEvent } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, MessageCircle, Save, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { getWhatsAppTemplates, saveWhatsAppTemplates } from '@/app/actions/settings';
import type { WhatsAppTemplates } from '@/types/settings';

interface TemplateFieldProps {
  id: string;
  label: string;
  description: string;
  variables: string[];
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}

function TemplateField({ id, label, description, variables, value, onChange, disabled }: TemplateFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="font-semibold">{label}</Label>
      <p className="text-xs text-muted-foreground">{description}</p>
      <p className="text-xs text-muted-foreground">
        Variables disponibles:{' '}
        {variables.map(v => (
          <code key={v} className="bg-muted px-1 rounded mr-1">{`{{${v}}}`}</code>
        ))}
      </p>
      <Textarea
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={3}
        disabled={disabled}
        className="resize-none"
      />
    </div>
  );
}

export default function WhatsAppTemplatesPage() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<WhatsAppTemplates | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getWhatsAppTemplates();
      setTemplates(data);
    } catch {
      toast({ title: 'Error', description: 'No se pudieron cargar las plantillas.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const set = <K extends keyof WhatsAppTemplates>(key: K, value: WhatsAppTemplates[K]) =>
    setTemplates(prev => prev ? { ...prev, [key]: value } : prev);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!templates) return;
    setIsSaving(true);
    try {
      const result = await saveWhatsAppTemplates(templates);
      if (result.success) {
        toast({ title: 'Plantillas Guardadas', description: 'Las plantillas de WhatsApp han sido actualizadas.' });
      } else {
        toast({ title: 'Error', description: result.error || 'No se pudo guardar.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Error inesperado al guardar.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !templates) {
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
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">Plantillas de Mensajes WhatsApp</h1>
            <p className="text-sm text-muted-foreground">
              Personalizá los mensajes usados en presupuestos, contratos y confirmaciones de eventos.
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

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-xl">Plantillas de Documentos</CardTitle>
            <CardDescription>
              Estos mensajes se usan cuando compartís presupuestos y contratos por WhatsApp, y en las
              reglas de automatización. Usá las variables entre {'{{'}dobles llaves{'}}'} para insertar datos dinámicos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <TemplateField
              id="budget-share"
              label="Compartir Presupuesto"
              description="Enviado cuando se comparte un presupuesto al cliente."
              variables={['NOMBRE', 'FECHA_EVENTO', 'LINK']}
              value={templates.budgetShareTemplate}
              onChange={v => set('budgetShareTemplate', v)}
              disabled={isSaving}
            />

            <Separator />

            <TemplateField
              id="contract-share"
              label="Compartir Contrato"
              description="Enviado cuando se envía un contrato al cliente para revisar y firmar."
              variables={['NOMBRE', 'FECHA_EVENTO', 'LINK']}
              value={templates.contractShareTemplate}
              onChange={v => set('contractShareTemplate', v)}
              disabled={isSaving}
            />

            <Separator />

            <TemplateField
              id="welcome"
              label="Bienvenida"
              description="Mensaje de bienvenida para nuevos prospectos o confirmaciones iniciales."
              variables={['NOMBRE']}
              value={templates.welcomeTemplate}
              onChange={v => set('welcomeTemplate', v)}
              disabled={isSaving}
            />

            <Separator />

            <TemplateField
              id="event-confirmation"
              label="Confirmación de Evento"
              description="Enviado al confirmar la reserva de un evento."
              variables={['NOMBRE', 'FECHA_EVENTO', 'SALON']}
              value={templates.eventConfirmationTemplate}
              onChange={v => set('eventConfirmationTemplate', v)}
              disabled={isSaving}
            />
          </CardContent>
          <CardFooter className="border-t pt-6 flex items-center gap-3">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {isSaving ? 'Guardando...' : 'Guardar Plantillas'}
            </Button>
            <p className="text-xs text-muted-foreground">
              Los cambios se aplican inmediatamente a los nuevos mensajes programados.
            </p>
          </CardFooter>
        </Card>

        <Card className="shadow-sm bg-muted/30 border-dashed">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">¿Dónde se usan estas plantillas?</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-1">
            <p>• <strong>Compartir Presupuesto</strong>: botón de WhatsApp en el resumen de presupuesto (Paso 4).</p>
            <p>• <strong>Compartir Contrato</strong>: reglas de automatización con disparador &quot;Contrato firmado&quot;.</p>
            <p>• <strong>Bienvenida</strong>: reglas de automatización con tipo &quot;Bienvenida&quot; o &quot;Simulador completado&quot;.</p>
            <p>• <strong>Confirmación de Evento</strong>: reglas de automatización con disparador &quot;Fiesta creada&quot;.</p>
          </CardContent>
          <CardFooter className="pt-0">
            <Link href="/settings/whatsapp">
              <Button variant="link" size="sm" className="p-0 h-auto text-primary">
                Configurar reglas de automatización →
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}

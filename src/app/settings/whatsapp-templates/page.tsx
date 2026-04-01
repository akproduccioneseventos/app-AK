'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Save,
  Loader2,
  MessageCircle,
  Eye,
  EyeOff,
  RotateCcw,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getWhatsAppTemplates, saveWhatsAppTemplates } from '@/app/actions/settings';
import { defaultWhatsAppTemplates } from '@/types/settings';
import type { WhatsAppTemplates } from '@/types/settings';

// ---------------------------------------------------------------------------
// Placeholder definitions
// ---------------------------------------------------------------------------
const PLACEHOLDERS = [
  { tag: '{clienteNombre}', desc: 'Nombre del cliente' },
  { tag: '{eventoTipo}', desc: 'Tipo de evento (XV Años, Casamiento…)' },
  { tag: '{eventoFecha}', desc: 'Fecha del evento' },
  { tag: '{totalEvento}', desc: 'Monto total del evento' },
  { tag: '{totalPagado}', desc: 'Total ya pagado por el cliente' },
  { tag: '{saldoPendiente}', desc: 'Saldo pendiente de pago' },
  { tag: '{linkEstadoCuenta}', desc: 'Enlace al estado de cuenta' },
  { tag: '{tareaNombre}', desc: 'Nombre de la tarea pendiente' },
  { tag: '{empresaNombre}', desc: 'Nombre de tu empresa' },
  { tag: '{whatsappLink}', desc: 'Enlace compartido (presupuesto / portal)' },
];

// Sample data used for the live preview
const SAMPLE_DATA: Record<string, string> = {
  clienteNombre: 'María García',
  eventoTipo: 'XV Años',
  eventoFecha: '15 de agosto de 2025',
  totalEvento: '$150.000',
  totalPagado: '$50.000',
  saldoPendiente: '$100.000',
  linkEstadoCuenta: 'https://app.akproducciones.com/presupuestos/123/estado-de-cuenta',
  tareaNombre: 'Confirmar menú de catering',
  empresaNombre: 'AK Producciones',
  whatsappLink: 'https://app.akproducciones.com/presupuestos/123/ver',
};

import { renderWhatsAppTemplate } from '@/lib/whatsapp-templates';

function renderTemplate(template: string): string {
  return renderWhatsAppTemplate(template, SAMPLE_DATA);
}

// ---------------------------------------------------------------------------
// Template editor sub-component
// ---------------------------------------------------------------------------
interface TemplateEditorProps {
  label: string;
  description: string;
  value: string;
  defaultValue: string;
  onChange: (val: string) => void;
}

function TemplateEditor({
  label,
  description,
  value,
  defaultValue,
  onChange,
}: TemplateEditorProps) {
  const [showPreview, setShowPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertPlaceholder = (tag: string) => {
    const el = textareaRef.current;
    if (!el) {
      onChange(value + tag);
      return;
    }
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const newText = value.slice(0, start) + tag + value.slice(end);
    onChange(newText);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + tag.length, start + tag.length);
    });
  };

  const preview = renderTemplate(value);

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="font-headline text-base">{label}</CardTitle>
            <CardDescription className="text-xs mt-1">{description}</CardDescription>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPreview((p: boolean) => !p)}
              title={showPreview ? 'Ocultar vista previa' : 'Ver vista previa'}
            >
              {showPreview ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
              <span className="ml-1 text-xs hidden sm:inline">
                {showPreview ? 'Ocultar' : 'Preview'}
              </span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onChange(defaultValue)}
              title="Restaurar plantilla original"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="ml-1 text-xs hidden sm:inline">Restaurar</span>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Placeholders */}
        <div className="flex flex-wrap gap-1.5">
          {PLACEHOLDERS.map(({ tag, desc }) => (
            <Badge
              key={tag}
              variant="secondary"
              className="cursor-pointer hover:bg-primary/20 transition-colors text-xs font-mono"
              title={`Insertar: ${desc}`}
              onClick={() => insertPlaceholder(tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>

        {/* Editor / Preview toggle */}
        {showPreview ? (
          <div className="rounded-lg border bg-muted/40 p-4 text-sm whitespace-pre-wrap font-mono min-h-[120px]">
            {preview}
          </div>
        ) : (
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={6}
            className="font-mono text-sm resize-y"
            placeholder="Escribe el mensaje aquí…"
          />
        )}

        {/* Validation hint */}
        {!value.trim() && (
          <p className="text-xs text-destructive">La plantilla no puede estar vacía.</p>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function WhatsAppTemplatesPage() {
  const { toast } = useToast();

  const [templates, setTemplates] = useState<WhatsAppTemplates>(defaultWhatsAppTemplates);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getWhatsAppTemplates();
      setTemplates(data);
    } catch {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las plantillas.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleSave = async () => {
    if (
      !templates.crmFollowUp.trim() ||
      !templates.paymentReminder.trim() ||
      !templates.taskReminder.trim()
    ) {
      toast({
        title: 'Plantillas incompletas',
        description: 'Ninguna plantilla puede estar vacía.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const result = await saveWhatsAppTemplates(templates);
      if (result.success) {
        toast({
          title: '✅ Plantillas Guardadas',
          description: 'Los mensajes de WhatsApp usarán estas plantillas.',
        });
      } else {
        throw new Error(result.error);
      }
    } catch (e: any) {
      toast({ title: 'Error al Guardar', description: e.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/settings">
          <Button variant="outline" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <MessageCircle className="w-8 h-8 text-green-500" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-headline">
              Plantillas de WhatsApp
            </h1>
            <p className="text-sm text-muted-foreground">
              Personaliza los mensajes que se envían desde CRM, pagos y tareas.
            </p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Info banner */}
      <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
        <CardContent className="pt-4 pb-3">
          <p className="text-sm text-green-800 dark:text-green-300">
            <strong>¿Cómo funciona?</strong> Hacé clic en cualquier{' '}
            <Badge variant="secondary" className="font-mono text-xs">
              {'{placeholder}'}
            </Badge>{' '}
            para insertarlo en el cursor. El sistema reemplazará automáticamente cada variable con
            los datos reales del cliente o evento al momento del envío.
          </p>
        </CardContent>
      </Card>

      {/* Template tabs */}
      <Tabs defaultValue="crm">
        <TabsList className="w-full">
          <TabsTrigger value="crm" className="flex-1">
            Seguimiento CRM
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex-1">
            Recordatorio de Pago
          </TabsTrigger>
          <TabsTrigger value="task" className="flex-1">
            Recordatorio de Tarea
          </TabsTrigger>
        </TabsList>

        <TabsContent value="crm" className="mt-4">
          <TemplateEditor
            label="Seguimiento CRM / Presupuesto"
            description="Se usa al compartir un presupuesto por WhatsApp desde el paso de resumen."
            value={templates.crmFollowUp}
            defaultValue={defaultWhatsAppTemplates.crmFollowUp}
            onChange={(val) => setTemplates((p) => ({ ...p, crmFollowUp: val }))}
          />
        </TabsContent>

        <TabsContent value="payment" className="mt-4">
          <TemplateEditor
            label="Recordatorio de Pago (Estado de Cuenta)"
            description="Se usa al enviar el estado de cuenta con el saldo pendiente por WhatsApp."
            value={templates.paymentReminder}
            defaultValue={defaultWhatsAppTemplates.paymentReminder}
            onChange={(val) => setTemplates((p) => ({ ...p, paymentReminder: val }))}
          />
        </TabsContent>

        <TabsContent value="task" className="mt-4">
          <TemplateEditor
            label="Recordatorio de Tarea / Portal"
            description="Se usa al compartir el portal del cliente o recordar tareas pendientes."
            value={templates.taskReminder}
            defaultValue={defaultWhatsAppTemplates.taskReminder}
            onChange={(val) => setTemplates((p) => ({ ...p, taskReminder: val }))}
          />
        </TabsContent>
      </Tabs>

      {/* Placeholder reference */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Variables disponibles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PLACEHOLDERS.map(({ tag, desc }) => (
              <div key={tag} className="flex items-center gap-2 text-xs">
                <Badge variant="outline" className="font-mono shrink-0">
                  {tag}
                </Badge>
                <span className="text-muted-foreground">{desc}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex justify-end pb-8">
        <Button onClick={handleSave} disabled={isSaving} className="min-w-[160px]">
          {isSaving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Guardar Plantillas
        </Button>
      </div>
    </div>
  );
}

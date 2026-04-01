'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  MessageCircle,
  Eye,
  Save,
  Loader2,
  RotateCcw,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import type { WhatsAppTemplates } from '@/types/settings';
import { defaultWhatsAppTemplates } from '@/types/settings';
import { getWhatsAppTemplates, saveWhatsAppTemplates } from '@/app/actions/settings';
import { AVAILABLE_PLACEHOLDERS, previewTemplate } from '@/lib/whatsapp-templates';

// ─── Template card ────────────────────────────────────────────────────────────

interface TemplateEditorCardProps {
  title: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
  defaultValue: string;
}

function TemplateEditorCard({
  title,
  description,
  value,
  onChange,
  defaultValue,
}: TemplateEditorCardProps) {
  const [showPreview, setShowPreview] = useState(false);
  const preview = previewTemplate(value);

  const insertPlaceholder = (placeholder: string) => {
    onChange(value + placeholder);
  };

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Placeholder chips */}
        <div className="flex flex-wrap gap-1.5">
          {AVAILABLE_PLACEHOLDERS.map((p) => (
            <button
              key={p.key}
              type="button"
              title={p.description}
              onClick={() => insertPlaceholder(p.label)}
              className="text-xs px-2 py-0.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary transition-colors font-mono"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Text editor / preview toggle */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setShowPreview((v) => !v)}
          >
            <Eye className="w-3.5 h-3.5 mr-1" />
            {showPreview ? 'Editar' : 'Vista previa'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-muted-foreground"
            title="Restaurar plantilla predeterminada"
            onClick={() => onChange(defaultValue)}
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            Restaurar
          </Button>
        </div>

        {showPreview ? (
          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-md p-3 text-sm whitespace-pre-wrap font-mono text-emerald-900 dark:text-emerald-100">
            {preview}
          </div>
        ) : (
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={6}
            className="font-mono text-sm resize-y"
            placeholder="Escribe el mensaje aquí..."
          />
        )}
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

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
      toast({ title: 'Error', description: 'No se pudieron cargar las plantillas.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await saveWhatsAppTemplates(templates);
      if (result.success) {
        toast({ title: '¡Guardado!', description: 'Plantillas de WhatsApp actualizadas correctamente.' });
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Error inesperado al guardar.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = <K extends keyof WhatsAppTemplates>(key: K, value: WhatsAppTemplates[K]) => {
    setTemplates((prev) => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/settings">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-headline flex items-center gap-2">
              <MessageCircle className="w-6 h-6 text-emerald-500" />
              Plantillas de WhatsApp
            </h1>
            <p className="text-sm text-muted-foreground">
              Editá los mensajes que se usan para recordatorios automáticos y seguimientos.
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="shrink-0">
          {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Guardar
        </Button>
      </div>

      {/* Global settings */}
      <Card className="shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Configuración Global</CardTitle>
          <CardDescription className="text-xs">
            Controla si los mensajes de WhatsApp están activos y cómo se envían.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="wa-enabled" className="font-medium">Activar mensajes de WhatsApp</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Muestra los botones de WhatsApp en el CRM, pagos y tareas.
              </p>
            </div>
            <Switch
              id="wa-enabled"
              checked={templates.enabled}
              onCheckedChange={(checked) => updateField('enabled', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="wa-mode" className="font-medium">Modo de envío</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                <strong>Manual:</strong> abre un modal para editar antes de enviar.{' '}
                <strong>Automático:</strong> abre WhatsApp directamente con el mensaje renderizado.
              </p>
            </div>
            <Select
              value={templates.mode}
              onValueChange={(v) => updateField('mode', v as WhatsAppTemplates['mode'])}
            >
              <SelectTrigger id="wa-mode" className="w-40 shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="automatic">Automático</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Placeholder legend */}
      <Card className="bg-muted/40 border-dashed shadow-none">
        <CardContent className="pt-4 pb-3">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">
                Variables disponibles — hacé clic en un chip para insertarlo en la plantilla activa:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {AVAILABLE_PLACEHOLDERS.map((p) => (
                  <Badge key={p.key} variant="secondary" className="text-xs font-mono">
                    {p.label}
                    <span className="ml-1 text-muted-foreground font-sans normal-case">— {p.description}</span>
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Template editors */}
      <TemplateEditorCard
        title="1. Seguimiento CRM / Recordatorio de reunión"
        description="Se usa al enviar un recordatorio de reunión a un prospecto desde el CRM."
        value={templates.crmFollowUp}
        onChange={(v) => updateField('crmFollowUp', v)}
        defaultValue={defaultWhatsAppTemplates.crmFollowUp}
      />

      <TemplateEditorCard
        title="2. Recordatorio de pago (Estado de cuenta)"
        description="Se usa al enviar el estado de cuenta o recordatorio de saldo pendiente desde un presupuesto."
        value={templates.paymentReminder}
        onChange={(v) => updateField('paymentReminder', v)}
        defaultValue={defaultWhatsAppTemplates.paymentReminder}
      />

      <TemplateEditorCard
        title="3. Recordatorio de tarea / Checklist del cliente"
        description="Se usa al recordarle a un cliente una tarea pendiente de su checklist de evento."
        value={templates.taskReminder}
        onChange={(v) => updateField('taskReminder', v)}
        defaultValue={defaultWhatsAppTemplates.taskReminder}
      />

      {/* Bottom save */}
      <div className="flex justify-end pb-6">
        <Button onClick={handleSave} disabled={isSaving} size="lg">
          {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Guardar plantillas
        </Button>
      </div>
    </div>
  );
}

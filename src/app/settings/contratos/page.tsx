'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Loader2, FileSignature, Info, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getContractTemplate, saveContractTemplate } from '@/app/actions/settings';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const PLACEHOLDERS = [
  { tag: '{{CLIENTE_NOMBRE}}', desc: 'Nombre completo del cliente' },
  { tag: '{{CLIENTE_CI}}', desc: 'Cédula de identidad / RUT del cliente' },
  { tag: '{{CLIENTE_DIRECCION}}', desc: 'Domicilio del cliente' },
  { tag: '{{CLIENTE_TELEFONO}}', desc: 'Teléfono de contacto del cliente' },
  { tag: '{{EVENTO_FECHA}}', desc: 'Fecha del evento (día/mes/año)' },
  { tag: '{{EVENTO_SALON}}', desc: 'Nombre del salón / lugar del evento' },
  { tag: '{{PRESUPUESTO_TOTAL}}', desc: 'Monto total del servicio (con descuento)' },
  { tag: '{{SENIA}}', desc: 'Monto de la seña / anticipo inicial' },
  { tag: '{{FECHA_HOY}}', desc: 'Fecha de firma del contrato (hoy)' },
  { tag: '{{EMPRESA_NOMBRE}}', desc: 'Nombre de tu empresa' },
  { tag: '{{EMPRESA_RUT}}', desc: 'RUT fiscal de tu empresa' },
  { tag: '{{EMPRESA_DIRECCION}}', desc: 'Domicilio de tu empresa' },
  { tag: '{{EMPRESA_EMAIL}}', desc: 'Email de contacto de tu empresa' },
];

const SENIA_HINT =
  'Usá {{SENIA}} en el texto. El sistema completará el monto del primer pago registrado del cliente. Si aún no hay pagos, el campo quedará en blanco para completar a mano.';

export default function ContratosSettingsPage() {
  const { toast } = useToast();
  const [template, setTemplate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const loadTemplate = useCallback(async () => {
    setIsLoading(true);
    try {
      const text = await getContractTemplate();
      setTemplate(text);
    } catch {
      toast({ title: 'Error', description: 'No se pudo cargar la plantilla.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadTemplate();
  }, [loadTemplate]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await saveContractTemplate(template);
      if (result.success) {
        toast({
          title: '✅ Plantilla Guardada',
          description: 'Todos los nuevos contratos usarán este texto base.',
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

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const insertPlaceholder = (tag: string) => {
    const el = textareaRef.current;
    if (!el) {
      setTemplate((prev) => prev + tag);
      return;
    }
    const start = el.selectionStart ?? template.length;
    const end = el.selectionEnd ?? template.length;
    const newText = template.slice(0, start) + tag + template.slice(end);
    setTemplate(newText);
    // Restore focus and move caret after the inserted tag
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + tag.length, start + tag.length);
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-2xl">
            <FileSignature className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">Plantilla Maestra de Contrato</h1>
            <p className="text-sm text-muted-foreground">
              Definí el texto legal base que se completará automáticamente con los datos de cada evento.
            </p>
          </div>
        </div>
        <Link href="/settings">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Editor / Preview */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="shadow-lg border-none bg-white">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
              <div>
                <CardTitle className="text-lg font-black">Editor de Texto</CardTitle>
                <CardDescription className="text-xs">
                  Escribí o pegá el contrato legal y usá las etiquetas dinámicas para las variables.
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="text-xs font-bold"
              >
                {showPreview ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5 mr-1.5" /> Editar
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5 mr-1.5" /> Vista Previa
                  </>
                )}
              </Button>
            </CardHeader>
            <CardContent>
              {showPreview ? (
                <div className="min-h-[600px] font-serif text-base leading-relaxed p-4 bg-slate-50 rounded-xl border whitespace-pre-wrap text-slate-800">
                  {template || (
                    <span className="text-slate-400 italic">El contrato aparecerá aquí...</span>
                  )}
                </div>
              ) : (
                <Textarea
                  ref={textareaRef}
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  className="min-h-[600px] font-serif text-base leading-relaxed resize-y"
                  placeholder="Pegá aquí el cuerpo del contrato legal..."
                />
              )}
            </CardContent>
            <CardFooter className="border-t pt-4 gap-3 flex-col sm:flex-row">
              <Button onClick={handleSave} disabled={isSaving || showPreview} className="w-full sm:flex-1">
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Guardar Plantilla
              </Button>
              <Button
                variant="outline"
                onClick={loadTemplate}
                disabled={isSaving}
                className="w-full sm:w-auto text-xs"
              >
                Recargar
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Sidebar: Placeholders + Instructions */}
        <div className="space-y-4">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-primary text-sm flex items-center gap-2">
                <Info className="w-4 h-4" /> Etiquetas Dinámicas
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-primary/80 space-y-3">
              <p>
                Hacé clic en una etiqueta para insertarla al final del texto. Se reemplazarán con los
                datos reales del cliente y el evento al generar el contrato.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {PLACEHOLDERS.map((p) => (
                  <Badge
                    key={p.tag}
                    variant="secondary"
                    className="cursor-pointer hover:bg-primary hover:text-white transition-colors text-[10px] font-mono py-1"
                    onClick={() => insertPlaceholder(p.tag)}
                    title={p.desc}
                  >
                    {p.tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-black">Descripción de Variables</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {PLACEHOLDERS.map((p) => (
                <div key={p.tag} className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-mono font-bold text-primary">{p.tag}</span>
                  <span className="text-[10px] text-muted-foreground">{p.desc}</span>
                  <Separator className="mt-1" />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-amber-800 text-xs flex items-center gap-2">
                <Info className="w-3.5 h-3.5" /> Sobre la Seña
              </CardTitle>
            </CardHeader>
            <CardContent className="text-[11px] text-amber-700">{SENIA_HINT}</CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-black">Instrucciones</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2">
              <p>1. Dejá los bloques de firma al final del documento.</p>
              <p>2. No modifiques los corchetes de las etiquetas dinámicas.</p>
              <p>
                3. Los cambios aquí <strong>no afectan</strong> contratos ya guardados en eventos
                específicos.
              </p>
              <p>4. Generá el contrato desde el Panel de cada evento usando el botón «Generar Contrato».</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

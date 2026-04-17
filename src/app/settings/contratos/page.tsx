'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Loader2, FileSignature, Info, Trash2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getContractTemplates, saveContractTemplate, deleteContractTemplate } from '@/app/actions/settings';
import type { ContractTemplateItem, ContractType } from '@/types/settings';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const BASE_PLACEHOLDERS = [
  { tag: '{{CLIENTE_NOMBRE}}', desc: 'Nombre completo del cliente' },
  { tag: '{{CLIENTE_CI}}', desc: 'Cédula de identidad / RUT del cliente' },
  { tag: '{{CLIENTE_DIRECCION}}', desc: 'Domicilio del cliente' },
  { tag: '{{CLIENTE_TELEFONO}}', desc: 'Teléfono del cliente' },
  { tag: '{{EVENTO_FECHA}}', desc: 'Fecha del evento' },
  { tag: '{{EVENTO_SALON}}', desc: 'Salón / lugar del evento' },
  { tag: '{{PRESUPUESTO_TOTAL}}', desc: 'Total presupuestado' },
  { tag: '{{SENIA}}', desc: 'Monto de seña' },
  { tag: '{{FECHA_HOY}}', desc: 'Fecha actual' },
  { tag: '{{EMPRESA_NOMBRE}}', desc: 'Nombre de empresa' },
  { tag: '{{EMPRESA_RUT}}', desc: 'RUT de empresa' },
  { tag: '{{EMPRESA_DIRECCION}}', desc: 'Dirección de empresa' },
  { tag: '{{EMPRESA_EMAIL}}', desc: 'Email de empresa' },
];

const EXTRA_PLACEHOLDERS = [
  { tag: '{{MOTIVO_CANCELACION}}', desc: 'Motivo de cancelación/cambio' },
  { tag: '{{NUEVA_FECHA}}', desc: 'Nueva fecha acordada' },
  { tag: '{{PENALIZACION_PORCENTAJE}}', desc: 'Porcentaje de penalización' },
  { tag: '{{NOMBRE_SALON}}', desc: 'Nombre del salón' },
];

const EXTRA_BY_TYPE: Record<string, string[]> = {
  cancelacion: ['{{MOTIVO_CANCELACION}}', '{{PENALIZACION_PORCENTAJE}}'],
  'cancelacion-servicios': ['{{MOTIVO_CANCELACION}}', '{{PENALIZACION_PORCENTAJE}}'],
  'cambio-fecha': ['{{MOTIVO_CANCELACION}}', '{{NUEVA_FECHA}}', '{{PENALIZACION_PORCENTAJE}}'],
  salon: ['{{NOMBRE_SALON}}', '{{PENALIZACION_PORCENTAJE}}'],
};

export default function ContratosSettingsPage() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<ContractTemplateItem[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [editorText, setEditorText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const selected = templates.find(t => t.id === selectedId) || null;
  const selectedType = selected?.type || 'servicios';

  const visiblePlaceholders = [
    ...BASE_PLACEHOLDERS,
    ...EXTRA_PLACEHOLDERS.filter(p => (EXTRA_BY_TYPE[selectedType] || []).includes(p.tag)),
  ];

  const loadTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await getContractTemplates();
      setTemplates(list);
      setSelectedId((prevSelectedId) => {
        const nextSelectedId = prevSelectedId && list.some((t) => t.id === prevSelectedId)
          ? prevSelectedId
          : (list[0]?.id || '');
        setEditorText(list.find((t) => t.id === nextSelectedId)?.template || '');
        return nextSelectedId;
      });
    } catch {
      toast({ title: 'Error', description: 'No se pudieron cargar las plantillas.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const selectTemplate = (template: ContractTemplateItem) => {
    setSelectedId(template.id);
    setEditorText(template.template);
  };

  const handleSave = async () => {
    if (!selected) return;
    setIsSaving(true);
    try {
      const result = await saveContractTemplate({ ...selected, template: editorText });
      if (!result.success) throw new Error(result.error);
      toast({ title: '✅ Plantilla guardada', description: `"${selected.name}" se actualizó correctamente.` });
      await loadTemplates();
    } catch (e: any) {
      toast({ title: 'Error al guardar', description: e.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateCustom = async () => {
    const name = window.prompt('Nombre de la nueva plantilla personalizada:');
    if (!name?.trim()) return;
    const id = `custom-${Date.now()}`;
    const type = `custom:${id}` as ContractType;
    const createdAt = new Date().toISOString();
    const item: ContractTemplateItem = {
      id,
      type,
      name: name.trim(),
      template: 'Escribe aquí tu plantilla personalizada...',
      isDefault: false,
      createdAt,
      updatedAt: createdAt,
    };
    const res = await saveContractTemplate(item);
    if (res.success) {
      toast({ title: 'Plantilla creada', description: 'Ya puedes editar la nueva plantilla.' });
      await loadTemplates();
      setSelectedId(id);
      setEditorText(item.template);
    } else {
      toast({ title: 'Error', description: res.error || 'No se pudo crear la plantilla.', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!selected || selected.isDefault) return;
    if (!window.confirm(`¿Eliminar la plantilla "${selected.name}"?`)) return;
    setIsDeleting(true);
    try {
      const res = await deleteContractTemplate(selected.id);
      if (!res.success) throw new Error(res.error);
      toast({ title: 'Plantilla eliminada' });
      await loadTemplates();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  const insertPlaceholder = (tag: string) => {
    const el = textareaRef.current;
    if (!el) return setEditorText(prev => prev + tag);
    const start = el.selectionStart ?? editorText.length;
    const end = el.selectionEnd ?? editorText.length;
    const text = editorText.slice(0, start) + tag + editorText.slice(end);
    setEditorText(text);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + tag.length, start + tag.length);
    });
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-2xl"><FileSignature className="w-7 h-7 text-primary" /></div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-headline">Plantillas de Contratos</h1>
            <p className="text-sm text-muted-foreground">Gestiona contratos de servicios, cancelación, cambio de fecha, salón y plantillas personalizadas.</p>
          </div>
        </div>
        <Link href="/settings"><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button></Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Plantillas</CardTitle>
              <CardDescription>Selecciona una plantilla para editar.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {templates.map((item) => (
                <button
                  key={item.id}
                  onClick={() => selectTemplate(item)}
                  className={`w-full text-left p-3 rounded-xl border transition ${selectedId === item.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-sm">{item.name}</span>
                    <Badge variant={item.isDefault ? 'secondary' : 'outline'} className="text-[10px]">
                      {item.isDefault ? 'Default' : 'Personalizada'}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">{item.type}</p>
                </button>
              ))}
            </CardContent>
            <CardFooter>
              <Button onClick={handleCreateCustom} className="w-full" variant="outline">
                <Plus className="w-4 h-4 mr-2" /> Nueva plantilla personalizada
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{selected?.name || 'Sin plantilla'}</CardTitle>
              <CardDescription>Edita el texto legal y usa placeholders dinámicos.</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                ref={textareaRef}
                value={editorText}
                onChange={(e) => setEditorText(e.target.value)}
                className="min-h-[520px] font-serif text-base leading-relaxed resize-y"
                placeholder="Escribe aquí la plantilla..."
              />
            </CardContent>
            <CardFooter className="border-t pt-4 gap-3 flex-col sm:flex-row">
              <Button onClick={handleSave} disabled={!selected || isSaving} className="w-full sm:flex-1">
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Guardar plantilla
              </Button>
              {!selected?.isDefault && (
                <Button onClick={handleDelete} disabled={isDeleting} variant="destructive" className="w-full sm:w-auto">
                  {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                  Eliminar
                </Button>
              )}
            </CardFooter>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-primary text-sm flex items-center gap-2"><Info className="w-4 h-4" /> Etiquetas dinámicas</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-primary/80 space-y-3">
              <p>Haz clic en una etiqueta para insertarla en el texto.</p>
              <div className="flex flex-wrap gap-1.5">
                {visiblePlaceholders.map((p) => (
                  <Badge key={p.tag} variant="secondary" className="cursor-pointer hover:bg-primary hover:text-white transition-colors text-[10px] font-mono py-1" onClick={() => insertPlaceholder(p.tag)} title={p.desc}>
                    {p.tag}
                  </Badge>
                ))}
              </div>
              <Separator />
              <div className="space-y-1">
                {visiblePlaceholders.map((p) => (
                  <p key={p.tag} className="text-[11px]"><span className="font-mono font-semibold">{p.tag}</span> — {p.desc}</p>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

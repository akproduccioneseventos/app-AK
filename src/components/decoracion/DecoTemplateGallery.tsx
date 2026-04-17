'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { deleteDecoCanvasTemplate, getDecoCanvasTemplates, saveDecoCanvasTemplate } from '@/app/actions/deco-canvas-templates';
import { DecoElementSvg } from './deco-svg-elements';
import type { DecoCanvasTemplate, ElementoDecorativo } from '@/types/fiesta';

interface DecoTemplateGalleryProps {
  currentElementos: ElementoDecorativo[];
  currentFondoColor: string;
  currentFondoImagenUrl?: string;
  onApplyTemplate: (template: DecoCanvasTemplate) => void;
  fiestaId?: string;
  allowSaveCurrent?: boolean;
}

const SAFE_DATA_IMAGE_REGEX = /^data:image\/(?:png|jpeg|jpg|webp|gif);base64,[a-zA-Z0-9+/=\s]+$/i;

function getSafeDataImageUri(value?: string): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  return SAFE_DATA_IMAGE_REGEX.test(trimmed) ? trimmed : undefined;
}

function DecoTemplateMiniPreview({
  elementos,
  fondoColor,
  fondoImagenUrl,
}: {
  elementos: ElementoDecorativo[];
  fondoColor: string;
  fondoImagenUrl?: string;
}) {
  return (
    <div
      className="relative w-full h-[120px] rounded-lg overflow-hidden border bg-slate-50"
      style={{
        backgroundColor: fondoColor,
        backgroundImage: fondoImagenUrl ? `url(${fondoImagenUrl})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {elementos.map(el => {
        const safeImageDataUri = getSafeDataImageUri(el.imageDataUri);
        return (
        <div
          key={el.id}
          className="absolute pointer-events-none"
          style={{
            left: el.x * 0.2,
            top: el.y * 0.2,
            transform: `translate(-50%,-50%) rotate(${el.rotacion ?? 0}deg) scale(${(el.escala ?? 1) * 0.2})`,
            transformOrigin: 'center center',
            opacity: el.opacity ?? 1,
            zIndex: el.zIndex ?? 1,
          }}
        >
          {safeImageDataUri ? (
            <div style={{ position: 'relative', display: 'inline-block' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={safeImageDataUri}
                alt={el.etiqueta || el.tipo}
                style={{ width: (el.width ?? 80) * 0.2, height: (el.height ?? 80) * 0.2, objectFit: 'contain', display: 'block' }}
                draggable={false}
              />
              {el.tintColor && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: el.tintColor,
                    opacity: el.tintOpacity ?? 0,
                    mixBlendMode: 'multiply',
                    pointerEvents: 'none',
                    borderRadius: 4,
                  }}
                />
              )}
            </div>
          ) : (
            <DecoElementSvg tipo={el.tipo} colores={el.colores} size={12} />
          )}
        </div>
        );
      })}
    </div>
  );
}

export default function DecoTemplateGallery({
  currentElementos,
  currentFondoColor,
  currentFondoImagenUrl,
  onApplyTemplate,
  allowSaveCurrent = true,
}: DecoTemplateGalleryProps) {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<DecoCanvasTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [templateName, setTemplateName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<DecoCanvasTemplate | null>(null);

  const canSaveCurrent = useMemo(() => currentElementos.length > 0 && !!templateName.trim(), [currentElementos.length, templateName]);

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getDecoCanvasTemplates();
      setTemplates(data);
    } catch {
      toast({ title: 'Error', description: 'No se pudieron cargar las plantillas.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleSaveTemplate = useCallback(async () => {
    if (!templateName.trim() || currentElementos.length === 0) return;
    setIsSaving(true);
    try {
      const result = await saveDecoCanvasTemplate(
        templateName,
        currentElementos,
        currentFondoColor,
        currentFondoImagenUrl || undefined,
      );
      if (!result.success) throw new Error(result.error);
      toast({ title: 'Plantilla guardada', description: `"${templateName.trim()}" quedó guardada.` });
      setTemplateName('');
      await fetchTemplates();
    } catch (error: any) {
      toast({ title: 'Error al guardar', description: error?.message || 'No se pudo guardar la plantilla.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  }, [templateName, currentElementos, currentFondoColor, currentFondoImagenUrl, fetchTemplates, toast]);

  const handleDeleteTemplate = useCallback(async (template: DecoCanvasTemplate) => {
    setDeletingId(template.id);
    try {
      const result = await deleteDecoCanvasTemplate(template.id);
      if (!result.success) throw new Error(result.error);
      setTemplates(prev => prev.filter(t => t.id !== template.id));
      toast({ title: 'Plantilla eliminada' });
    } catch (error: any) {
      toast({ title: 'Error', description: error?.message || 'No se pudo eliminar la plantilla.', variant: 'destructive' });
    } finally {
      setDeletingId(null);
      setTemplateToDelete(null);
    }
  }, [toast]);

  const handleDeleteDialogChange = useCallback((open: boolean) => {
    if (!open) {
      setTemplateToDelete(null);
    }
  }, []);

  return (
    <div className="space-y-5">
      {allowSaveCurrent && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Guardar diseño actual</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              value={templateName}
              onChange={e => setTemplateName(e.target.value)}
              placeholder="Ej: Decoración XV años rosa"
              className="h-10"
            />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-block w-full">
                    <Button
                      type="button"
                      className="w-full"
                      onClick={handleSaveTemplate}
                      disabled={!canSaveCurrent || isSaving}
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                      Guardar diseño como plantilla
                    </Button>
                  </span>
                </TooltipTrigger>
                {currentElementos.length === 0 && (
                  <TooltipContent>Agregá elementos al canvas primero</TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </CardContent>
        </Card>
      )}

      <div>
        <h3 className="font-semibold text-sm mb-3">Galería de plantillas</h3>
        {isLoading ? (
          <div className="h-24 flex items-center justify-center text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Cargando plantillas...
          </div>
        ) : templates.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no guardaste ningún diseño como plantilla.</p>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {templates.map(template => {
              const safeMiniatura = getSafeDataImageUri(template.miniatura);
              return (
              <Card key={template.id} className="overflow-hidden">
                <CardContent className="p-3 space-y-2">
                  {safeMiniatura ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={safeMiniatura} alt={template.nombre} className="w-full h-[120px] rounded-lg object-cover border" />
                  ) : (
                    <DecoTemplateMiniPreview
                      elementos={template.elementos}
                      fondoColor={template.fondoColor}
                      fondoImagenUrl={template.fondoImagenUrl}
                    />
                  )}
                  <div>
                    <p className="font-semibold text-sm leading-tight">{template.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(template.creadoEn).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                    <p className="text-xs text-muted-foreground">{template.elementos.length} elementos</p>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" size="sm" className="flex-1" onClick={() => onApplyTemplate(template)}>
                      Usar esta plantilla
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="h-8 w-8"
                      onClick={() => setTemplateToDelete(template)}
                      disabled={deletingId === template.id}
                    >
                      {deletingId === template.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
              );
            })}
          </div>
        )}
      </div>

      <AlertDialog open={templateToDelete !== null} onOpenChange={handleDeleteDialogChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar plantilla?</AlertDialogTitle>
            <AlertDialogDescription>
              {templateToDelete ? `Se eliminará "${templateToDelete.nombre}". Esta acción no se puede deshacer.` : 'Esta acción no se puede deshacer.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!deletingId}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              disabled={!templateToDelete || !!deletingId}
              onClick={e => {
                e.preventDefault();
                if (templateToDelete) {
                  void handleDeleteTemplate(templateToDelete);
                }
              }}
            >
              {deletingId ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

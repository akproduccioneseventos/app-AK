'use client';

import { useCallback, useEffect, useState } from 'react';
import NextImage from 'next/image';
import { Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { deleteDecoCanvasTemplate, getDecoCanvasTemplates, saveDecoCanvasTemplate } from '@/app/actions/deco-canvas-templates';
import type { DecoCanvasTemplate, ElementoDecorativo } from '@/types/fiesta';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface DecoTemplateGalleryProps {
  currentElementos: ElementoDecorativo[];
  currentFondoColor: string;
  currentFondoImagenUrl?: string;
  onApplyTemplate: (template: DecoCanvasTemplate) => void;
  fiestaId?: string;
  allowSaveCurrent?: boolean;
}

export default function DecoTemplateGallery({
  currentElementos,
  currentFondoColor,
  currentFondoImagenUrl,
  onApplyTemplate,
  fiestaId,
  allowSaveCurrent = true,
}: DecoTemplateGalleryProps) {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<DecoCanvasTemplate[]>([]);
  const [templateName, setTemplateName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getDecoCanvasTemplates();
      setTemplates(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleSave = async () => {
    const nombre = templateName.trim();
    if (!nombre || currentElementos.length === 0) return;
    setIsSaving(true);
    const result = await saveDecoCanvasTemplate(
      nombre,
      currentElementos,
      currentFondoColor,
      currentFondoImagenUrl || undefined
    );
    setIsSaving(false);

    if (!result.success) {
      toast({
        title: 'No se pudo guardar la plantilla',
        description: result.error,
        variant: 'destructive',
      });
      return;
    }

    setTemplateName('');
    toast({ title: 'Plantilla guardada' });
    await loadTemplates();
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const result = await deleteDecoCanvasTemplate(id);
    setDeletingId(null);

    if (!result.success) {
      toast({
        title: 'No se pudo eliminar la plantilla',
        description: result.error,
        variant: 'destructive',
      });
      return;
    }

    setTemplates(prev => prev.filter(t => t.id !== id));
    toast({ title: 'Plantilla eliminada' });
  };

  return (
    <div className="space-y-4" data-fiesta-id={fiestaId}>
      {allowSaveCurrent && (
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="Nombre de la plantilla"
            value={templateName}
            onChange={e => setTemplateName(e.target.value)}
            className="sm:max-w-sm"
          />
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving || currentElementos.length === 0 || !templateName.trim()}
          >
            {isSaving ? 'Guardando...' : 'Guardar diseño como plantilla'}
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Cargando plantillas...</div>
      ) : templates.length === 0 ? (
        <p className="text-sm text-muted-foreground">Todavía no guardaste ningún diseño como plantilla.</p>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {templates.map(template => {
            const hasMiniatura = typeof template.miniatura === 'string' && /^data:image\//.test(template.miniatura);
            const fecha = Number.isNaN(new Date(template.creadoEn).getTime())
              ? 'Fecha inválida'
              : new Date(template.creadoEn).toLocaleDateString('es-AR');

            return (
              <Card key={template.id} className="overflow-hidden">
                <div className="h-24 relative" style={{ backgroundColor: template.fondoColor || '#f8f9fa' }}>
                  {hasMiniatura && (
                    <NextImage
                      src={template.miniatura as string}
                      alt={template.nombre}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  )}
                </div>
                <CardContent className="p-3 space-y-2">
                  <p className="font-bold text-sm line-clamp-2">{template.nombre}</p>
                  <p className="text-xs text-muted-foreground">{fecha}</p>
                  <p className="text-xs text-muted-foreground">{template.elementos.length} elementos</p>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      className="flex-1"
                      onClick={() => onApplyTemplate(template)}
                    >
                      Usar esta plantilla
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button type="button" size="icon" variant="ghost" className="text-red-600 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar plantilla?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(template.id)}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={deletingId === template.id}
                          >
                            {deletingId === template.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Eliminar'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

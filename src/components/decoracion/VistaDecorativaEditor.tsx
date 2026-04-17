'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Download, Save, Loader2, FolderUp, FolderDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { ElementoDecorativo, ColorPalette } from '@/types/fiesta';
import { UploadButton } from '@/components/invitacion/edit/UploadButton';
import DecoCanvas from '@/components/decoracion/DecoCanvas';
import { TIPOS_ELEMENTOS, type TipoElemento, getMaxColoresByTipo } from '@/components/decoracion/deco-element-types';
import DecoTemplateGallery from '@/components/decoracion/DecoTemplateGallery';
import { saveDecoCanvasTemplate } from '@/app/actions/deco-canvas-templates';
import { useToast } from '@/hooks/use-toast';

const VISTA_TIPOS_ELEMENTOS = TIPOS_ELEMENTOS.filter(t =>
  ['globo', 'globosMacizos', 'flor', 'centroMesa', 'arco', 'lazo', 'candelabro', 'mesaTorta', 'tela'].includes(t.tipo)
);
const CANVAS_W = 900;
const CANVAS_H = 550;
// Spawn zone centered in the visible canvas area.
const NEW_ELEMENT_POSITION = {
  minX: CANVAS_W * 0.3,
  rangeX: CANVAS_W * 0.4,
  minY: CANVAS_H * 0.3,
  rangeY: CANVAS_H * 0.4,
};

interface VistaDecorativaData {
  elementos: ElementoDecorativo[];
  fondoColor?: string;
  fondoImagenUrl?: string;
}

interface Props {
  vistaDecorativa: VistaDecorativaData;
  paletaColores: ColorPalette;
  fiestaId: string;
  onSave: (data: VistaDecorativaData) => Promise<void>;
  isSaving?: boolean;
}

export default function VistaDecorativaEditor({
  vistaDecorativa,
  paletaColores,
  fiestaId,
  onSave,
  isSaving = false,
}: Props) {
  const { toast } = useToast();
  const [elementos, setElementos] = useState<ElementoDecorativo[]>(vistaDecorativa.elementos ?? []);
  const [fondoColor, setFondoColor] = useState(vistaDecorativa.fondoColor ?? '#f0f0f0');
  const [fondoImagenUrl, setFondoImagenUrl] = useState(vistaDecorativa.fondoImagenUrl ?? '');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  const canvasContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setElementos(vistaDecorativa.elementos ?? []);
    setFondoColor(vistaDecorativa.fondoColor ?? '#f0f0f0');
    setFondoImagenUrl(vistaDecorativa.fondoImagenUrl ?? '');
    setSelectedId(null);
  }, [vistaDecorativa]);

  const selectedEl = elementos.find(e => e.id === selectedId) ?? null;
  const maxColores = getMaxColoresByTipo(selectedEl?.tipo, selectedEl?.colores.length ? selectedEl.colores.length : 1);

  const agregarElemento = useCallback((tipo: TipoElemento) => {
    const defaultColors = [paletaColores.primary, paletaColores.secondary, paletaColores.accent];
    const maxC = getMaxColoresByTipo(tipo, 1);
    const colores = defaultColors.slice(0, maxC);
    const el: ElementoDecorativo = {
      id: crypto.randomUUID(),
      tipo,
      x: NEW_ELEMENT_POSITION.minX + Math.random() * NEW_ELEMENT_POSITION.rangeX,
      y: NEW_ELEMENT_POSITION.minY + Math.random() * NEW_ELEMENT_POSITION.rangeY,
      escala: 1,
      colores,
      rotacion: 0,
      opacity: 1,
    };
    setElementos(prev => [...prev, el]);
    setSelectedId(el.id);
  }, [paletaColores]);

  const eliminarElemento = useCallback((id: string) => {
    setElementos(prev => prev.filter(e => e.id !== id));
    setSelectedId(prev => (prev === id ? null : prev));
  }, []);

  const updateElemento = useCallback((id: string, patch: Partial<ElementoDecorativo>) => {
    setElementos(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e));
  }, []);

  const updateColor = useCallback((idx: number, color: string) => {
    if (!selectedEl) return;
    const newColores = [...selectedEl.colores];
    while (newColores.length <= idx) newColores.push('#888888');
    newColores[idx] = color;
    updateElemento(selectedEl.id, { colores: newColores });
  }, [selectedEl, updateElemento]);

  const limpiarTodo = useCallback(() => {
    setElementos([]);
    setSelectedId(null);
  }, []);

  const handleGuardar = useCallback(async () => {
    await onSave({ elementos, fondoColor, fondoImagenUrl: fondoImagenUrl || undefined });
  }, [onSave, elementos, fondoColor, fondoImagenUrl]);

  const handleExportar = useCallback(async () => {
    const exportRoot = canvasContainerRef.current?.querySelector('[data-deco-canvas]') as HTMLElement | null;
    if (!exportRoot) return;
    setIsExporting(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(exportRoot, {
        backgroundColor: fondoColor,
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement('a');
      link.download = `decoracion-${fiestaId}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Error al exportar:', err);
    } finally {
      setIsExporting(false);
    }
  }, [fondoColor, fiestaId]);

  const handleSaveAsTemplate = useCallback(async () => {
    if (!templateName.trim()) return;
    setIsSavingTemplate(true);
    try {
      const result = await saveDecoCanvasTemplate(templateName.trim(), elementos, fondoColor, fondoImagenUrl || undefined);
      if (!result.success) {
        toast({
          title: 'No se pudo guardar la plantilla',
          description: result.error,
          variant: 'destructive',
        });
        return;
      }
      toast({ title: 'Plantilla guardada', description: 'Tu diseño ha sido guardado como plantilla.' });
      setTemplateName('');
    } finally {
      setIsSavingTemplate(false);
    }
  }, [templateName, elementos, fondoColor, fondoImagenUrl, toast]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-xl border">
        {VISTA_TIPOS_ELEMENTOS.map(({ tipo, emoji, label }) => (
          <Button
            key={tipo}
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5 text-sm"
            onClick={() => agregarElemento(tipo)}
          >
            <span role="img" aria-label={label}>{emoji}</span>
            {label}
          </Button>
        ))}
      </div>

      <div className="flex flex-col xl:flex-row gap-4">
        <div className="flex-1" ref={canvasContainerRef}>
          <DecoCanvas
            elementos={elementos}
            onChange={setElementos}
            selectedId={selectedId}
            onSelectId={setSelectedId}
            fondoColor={fondoColor}
            fondoImagenUrl={fondoImagenUrl || undefined}
          />
        </div>

        <div className="xl:w-72 flex-shrink-0">
          <AnimatePresence mode="wait">
            {selectedEl ? (
              <motion.div
                key="props"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.2 }}
                className="space-y-4 p-4 border rounded-xl bg-card shadow-sm"
              >
                <h3 className="font-bold text-base">Propiedades</h3>

                {Array.from({ length: maxColores }).map((_, idx) => (
                  <div key={idx} className="space-y-1">
                    <Label className="text-xs">
                      {idx === 0 ? 'Color principal' : idx === 1 ? 'Color secundario' : 'Color terciario'}
                    </Label>
                    <div className="flex gap-2 items-center flex-wrap">
                      {[paletaColores.primary, paletaColores.secondary, paletaColores.accent].map((c, pi) => (
                        <button
                          key={pi}
                          type="button"
                          title={`Color paleta ${pi + 1}`}
                          className="w-7 h-7 rounded-full border-2 border-white shadow hover:scale-110 transition-transform"
                          style={{ background: c, outlineOffset: 2, outline: selectedEl.colores[idx] === c ? '2px solid #3B82F6' : 'none' }}
                          onClick={() => updateColor(idx, c)}
                        />
                      ))}
                      <input
                        type="color"
                        value={selectedEl.colores[idx] ?? paletaColores.primary}
                        onChange={e => updateColor(idx, e.target.value)}
                        className="w-8 h-8 cursor-pointer rounded border p-0.5"
                        title="Color personalizado"
                      />
                    </div>
                  </div>
                ))}

                {selectedEl.imageDataUri && (
                  <>
                    <div className="space-y-1">
                      <Label className="text-xs">Tinte</Label>
                      <input
                        type="color"
                        value={selectedEl.tintColor ?? '#ffffff'}
                        onChange={e => updateElemento(selectedEl.id, { tintColor: e.target.value })}
                        className="h-9 w-full rounded-lg border border-slate-200 bg-white p-1 cursor-pointer"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Intensidad tinte ({Math.round((selectedEl.tintOpacity ?? 0) * 100)}%)</Label>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={selectedEl.tintOpacity ?? 0}
                        onChange={e => updateElemento(selectedEl.id, { tintOpacity: Number(e.target.value) })}
                        className="w-full h-2 accent-primary"
                      />
                    </div>
                  </>
                )}

                <div className="space-y-1">
                  <Label className="text-xs">Tamaño</Label>
                  <div className="flex gap-1">
                    {([['S', 0.7], ['M', 1], ['L', 1.5], ['XL', 2]] as [string, number][]).map(([lbl, val]) => (
                      <Button
                        key={lbl}
                        type="button"
                        size="sm"
                        variant={selectedEl.escala === val ? 'default' : 'outline'}
                        className="flex-1 text-xs px-1"
                        onClick={() => updateElemento(selectedEl.id, { escala: val })}
                      >
                        {lbl}
                      </Button>
                    ))}
                  </div>
                  <input
                    type="range"
                    min={0.2}
                    max={3}
                    step={0.05}
                    value={selectedEl.escala ?? 1}
                    onChange={e => updateElemento(selectedEl.id, { escala: Number(e.target.value) })}
                    className="w-full h-2 accent-primary"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Rotación ({Math.round(selectedEl.rotacion ?? 0)}°)</Label>
                  <input
                    type="range"
                    min={-180}
                    max={180}
                    step={1}
                    value={selectedEl.rotacion ?? 0}
                    onChange={e => updateElemento(selectedEl.id, { rotacion: Number(e.target.value) })}
                    className="w-full h-2 accent-primary"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Opacidad ({Math.round((selectedEl.opacity ?? 1) * 100)}%)</Label>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={selectedEl.opacity ?? 1}
                    onChange={e => updateElemento(selectedEl.id, { opacity: Number(e.target.value) })}
                    className="w-full h-2 accent-primary"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Etiqueta (opcional)</Label>
                  <Input
                    value={selectedEl.etiqueta ?? ''}
                    onChange={e => updateElemento(selectedEl.id, { etiqueta: e.target.value })}
                    placeholder="Ej: Entrada, Mesa 1..."
                    className="h-8 text-sm"
                  />
                </div>

                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  onClick={() => eliminarElemento(selectedEl.id)}
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="global"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.2 }}
                className="space-y-4 p-4 border rounded-xl bg-card shadow-sm"
              >
                <h3 className="font-bold text-base">Fondo del Canvas</h3>
                <div className="space-y-1">
                  <Label className="text-xs">Color de fondo</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={fondoColor}
                      onChange={e => setFondoColor(e.target.value)}
                      className="w-10 h-10 cursor-pointer rounded border p-0.5"
                    />
                    <span className="text-xs text-muted-foreground">{fondoColor}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Imagen de fondo (foto del salón)</Label>
                  <UploadButton
                    currentUrl={fondoImagenUrl || undefined}
                    onUrlChange={url => setFondoImagenUrl(url)}
                    fiestaId={fiestaId}
                    accept="image/*"
                  />
                  {fondoImagenUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs text-destructive mt-1"
                      onClick={() => setFondoImagenUrl('')}
                    >
                      <Trash2 className="w-3 h-3 mr-1" /> Quitar imagen
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Hacé clic en un elemento del canvas para editar sus propiedades.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pt-2 border-t">
        <Button type="button" onClick={handleGuardar} disabled={isSaving} className="gap-2">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isSaving ? 'Guardando...' : 'Guardar'}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={handleExportar}
          disabled={isExporting || elementos.length === 0}
          className="gap-2"
        >
          {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {isExporting ? 'Exportando...' : 'Exportar como PNG'}
        </Button>

        <Input
          value={templateName}
          onChange={e => setTemplateName(e.target.value)}
          placeholder="Nombre de plantilla"
          className="h-9 w-[220px]"
        />

        <Button
          type="button"
          variant="outline"
          onClick={handleSaveAsTemplate}
          disabled={isSavingTemplate || elementos.length === 0 || !templateName.trim()}
          className="gap-2"
        >
          <FolderDown className="w-4 h-4" />
          {isSavingTemplate ? 'Guardando...' : 'Guardar como plantilla'}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => setIsTemplateDialogOpen(true)}
          className="gap-2"
        >
          <FolderUp className="w-4 h-4" /> Cargar plantilla
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="ghost" className="gap-2 text-destructive hover:text-destructive" disabled={elementos.length === 0}>
              <Trash2 className="w-4 h-4" /> Limpiar todo
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Limpiar el diseño?</AlertDialogTitle>
              <AlertDialogDescription>
                Se eliminarán todos los elementos del canvas. Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={limpiarTodo} className="bg-destructive hover:bg-destructive/90">
                Limpiar todo
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Plantillas de Diseño</DialogTitle>
          </DialogHeader>
          <DecoTemplateGallery
            currentElementos={elementos}
            currentFondoColor={fondoColor}
            currentFondoImagenUrl={fondoImagenUrl || undefined}
            onApplyTemplate={(template) => {
              setElementos(template.elementos);
              setFondoColor(template.fondoColor);
              setFondoImagenUrl(template.fondoImagenUrl ?? '');
              setIsTemplateDialogOpen(false);
            }}
            allowSaveCurrent={false}
            fiestaId={fiestaId}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

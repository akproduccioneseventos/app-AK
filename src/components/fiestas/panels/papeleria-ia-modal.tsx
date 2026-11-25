'use client';

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertTriangle,
  Check,
  Download,
  Loader2,
  Printer,
  RefreshCw,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  disenarPapeleriaConIAAction,
  guardarPapeleriaIAAction,
  quitarPapeleriaIAAction,
} from '@/app/actions/fiesta/papeleria-ia.actions';
import {
  descargarPdfArchivo,
  generarPdfA4Entero,
  generarPdfCuadritos10x15,
  imprimirPdfEnNavegador,
} from '@/lib/papeleria/pdf-impresion';
import { asegurarDataUrl, imagenUrlADataUrl } from '@/lib/papeleria/imagen-a-data-url';
import type { PapeleriaIAPieza, ProgramaEventoItem } from '@/types/fiesta';

export interface PapeleriaIAModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fiestaId: string;
  pieza: 'cartaTragos' | 'menuMesa' | 'cronograma' | 'afiche' | 'marcoFotocabina' | 'fondoMesas';
  tituloPieza: string;
  esA4Entero?: boolean;
  imagenGuardadaUrl?: string | null;
  platosMenu?: Array<{ nombre: string; categoria?: string; type?: string; imageUrl?: string }>;
  itemsItinerario?: ProgramaEventoItem[];
  printLayout?: 'strip_3' | 'single_photo' | 'strip_4';
  onGuardado?: (
    pieza: PapeleriaIAPieza,
    meta?: { usarFondoEnPlantilla?: boolean; fondoBase64?: string },
  ) => void;
  onVolverPlantilla?: () => void;
}

interface GeneratedMetaState {
  modelo?: string;
  bajaResolucion?: boolean;
  avisoResolucion?: string;
  anchoPx?: number;
  altoPx?: number;
}

interface PlantillaConFondoState {
  aviso: string;
  mejorFondoBase64?: string | null;
  bajaResolucion?: boolean;
  avisoResolucion?: string;
  anchoPx?: number;
  altoPx?: number;
  modelo?: string;
}

export function PapeleriaIAModal({
  open,
  onOpenChange,
  fiestaId,
  pieza,
  tituloPieza,
  esA4Entero = false,
  imagenGuardadaUrl,
  platosMenu,
  itemsItinerario,
  printLayout,
  onGuardado,
  onVolverPlantilla,
}: PapeleriaIAModalProps) {
  const { toast } = useToast();

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const [generatedDataUrl, setGeneratedDataUrl] = useState<string | null>(null);
  const [generatedMeta, setGeneratedMeta] = useState<GeneratedMetaState | null>(null);
  const [topeAlcanzado, setTopeAlcanzado] = useState(false);
  const [errorMensaje, setErrorMensaje] = useState<string | null>(null);
  const [plantillaConFondo, setPlantillaConFondo] = useState<PlantillaConFondoState | null>(null);

  useEffect(() => {
    if (!open) {
      setErrorMensaje(null);
      setPlantillaConFondo(null);
      setGeneratedDataUrl(null);
      setGeneratedMeta(null);
      setTopeAlcanzado(false);
    }
  }, [open, fiestaId, pieza]);

  const imagenActual = generatedDataUrl || imagenGuardadaUrl || null;
  const admiteImpresionPdf = pieza !== 'marcoFotocabina' && pieza !== 'fondoMesas';
  const resolucionActiva = generatedMeta || plantillaConFondo;
  const mostrarAlertaResolucion = Boolean(
    resolucionActiva?.bajaResolucion || resolucionActiva?.avisoResolucion,
  );
  const ocupado = isGenerating || isSaving || isRemoving || isExportingPdf;

  const handleGenerar = async () => {
    if (isGenerating || topeAlcanzado) return;
    setIsGenerating(true);
    setErrorMensaje(null);
    setPlantillaConFondo(null);

    try {
      const res = await disenarPapeleriaConIAAction({
        fiestaId,
        pieza,
        platosMenu,
        itemsItinerario,
        printLayout,
      });

      if (res.ok) {
        const dataUrl = asegurarDataUrl(res.base64, res.mimeType || 'image/png');
        setGeneratedDataUrl(dataUrl);
        setGeneratedMeta({
          modelo: res.modelo,
          bajaResolucion: res.bajaResolucion,
          avisoResolucion: res.avisoResolucion,
          anchoPx: res.anchoPx,
          altoPx: res.altoPx,
        });
        return;
      }

      if ('topeAlcanzado' in res && res.topeAlcanzado) {
        setTopeAlcanzado(true);
        setErrorMensaje('Se llegó al tope de IA del mes');
        return;
      }

      if ('usarPlantillaConFondo' in res && res.usarPlantillaConFondo) {
        setPlantillaConFondo({
          aviso:
            res.aviso ||
            'La IA no escribió bien estos textos; usamos la plantilla',
          mejorFondoBase64: res.mejorFondoBase64,
          bajaResolucion: res.bajaResolucion,
          avisoResolucion: res.avisoResolucion,
          anchoPx: res.anchoPx,
          altoPx: res.altoPx,
          modelo: res.modelo,
        });
        return;
      }

      const msg = res.error || 'No se pudo diseñar la pieza con IA.';
      setErrorMensaje(msg);
      toast({
        title: 'No se pudo diseñar con IA',
        description: msg,
        variant: 'destructive',
      });
    } catch (error: any) {
      const msg = error?.message || 'Error inesperado al diseñar con IA.';
      setErrorMensaje(msg);
      toast({
        title: 'Error al diseñar con IA',
        description: msg,
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUsarEsta = async () => {
    if (!imagenActual || isSaving) return;
    setIsSaving(true);
    setErrorMensaje(null);

    try {
      const imageDataUrl = await imagenUrlADataUrl(imagenActual);
      const res = await guardarPapeleriaIAAction({
        fiestaId,
        pieza,
        imageDataUrl,
        ...(generatedMeta?.modelo ? { modelo: generatedMeta.modelo } : {}),
        ...(generatedMeta?.bajaResolucion !== undefined
          ? { bajaResolucion: generatedMeta.bajaResolucion }
          : {}),
        ...(generatedMeta?.anchoPx !== undefined ? { anchoPx: generatedMeta.anchoPx } : {}),
        ...(generatedMeta?.altoPx !== undefined ? { altoPx: generatedMeta.altoPx } : {}),
      });

      if (res.success && res.pieza) {
        toast({
          title: 'Diseño guardado',
          description: `${tituloPieza} quedó guardado en la fiesta.`,
        });
        onGuardado?.(res.pieza);
        onOpenChange(false);
        return;
      }

      const msg = res.error || 'No se pudo guardar el diseño en la fiesta.';
      setErrorMensaje(msg);
      toast({
        title: 'No se pudo guardar',
        description: msg,
        variant: 'destructive',
      });
    } catch (error: any) {
      const msg = error?.message || 'Error al guardar el diseño.';
      setErrorMensaje(msg);
      toast({
        title: 'Error al guardar',
        description: msg,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAplicarFondoEnPlantilla = () => {
    if (!plantillaConFondo?.mejorFondoBase64) return;
    onGuardado?.(
      {
        url: imagenGuardadaUrl || '',
        ...(plantillaConFondo.modelo ? { modelo: plantillaConFondo.modelo } : {}),
        ...(plantillaConFondo.bajaResolucion !== undefined
          ? { bajaResolucion: plantillaConFondo.bajaResolucion }
          : {}),
        ...(plantillaConFondo.anchoPx !== undefined
          ? { anchoPx: plantillaConFondo.anchoPx }
          : {}),
        ...(plantillaConFondo.altoPx !== undefined
          ? { altoPx: plantillaConFondo.altoPx }
          : {}),
      },
      {
        usarFondoEnPlantilla: true,
        fondoBase64: plantillaConFondo.mejorFondoBase64,
      },
    );
    onOpenChange(false);
  };

  const handleVolverPlantilla = async () => {
    if (isRemoving) return;
    setIsRemoving(true);
    setErrorMensaje(null);

    try {
      const res = await quitarPapeleriaIAAction({ fiestaId, pieza });
      if (res.success) {
        setGeneratedDataUrl(null);
        setGeneratedMeta(null);
        setPlantillaConFondo(null);
        toast({
          title: 'Volviste a la plantilla',
          description: `Se quitó el diseño de IA de ${tituloPieza}.`,
        });
        onVolverPlantilla?.();
        onOpenChange(false);
        return;
      }

      const msg = res.error || 'No se pudo volver a la plantilla.';
      setErrorMensaje(msg);
      toast({
        title: 'Error al volver a la plantilla',
        description: msg,
        variant: 'destructive',
      });
    } catch (error: any) {
      const msg = error?.message || 'No se pudo volver a la plantilla.';
      setErrorMensaje(msg);
      toast({
        title: 'Error al volver a la plantilla',
        description: msg,
        variant: 'destructive',
      });
    } finally {
      setIsRemoving(false);
    }
  };

  const generarPdfDesdeImagenActual = async () => {
    if (!imagenActual) {
      throw new Error('No hay imagen para generar el PDF.');
    }
    const dataUrl = await imagenUrlADataUrl(imagenActual);
    return esA4Entero ? generarPdfA4Entero(dataUrl) : generarPdfCuadritos10x15(dataUrl);
  };

  const handleImprimirPdf = async () => {
    if (!imagenActual || isExportingPdf) return;
    setIsExportingPdf(true);
    setErrorMensaje(null);

    try {
      const pdf = await generarPdfDesdeImagenActual();
      imprimirPdfEnNavegador(pdf);
    } catch (error: any) {
      const msg = error?.message || 'No se pudo preparar el PDF para imprimir.';
      setErrorMensaje(msg);
      toast({
        title: 'Error al imprimir PDF',
        description: msg,
        variant: 'destructive',
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleDescargarPdf = async () => {
    if (!imagenActual || isExportingPdf) return;
    setIsExportingPdf(true);
    setErrorMensaje(null);

    try {
      const pdf = await generarPdfDesdeImagenActual();
      descargarPdfArchivo(pdf, `${pieza}-${fiestaId}.pdf`);
      toast({
        title: 'Descarga iniciada',
        description: 'El PDF listo para imprimir se está descargando.',
      });
    } catch (error: any) {
      const msg = error?.message || 'No se pudo descargar el PDF.';
      setErrorMensaje(msg);
      toast({
        title: 'Error al descargar PDF',
        description: msg,
        variant: 'destructive',
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Diseñar con IA — {tituloPieza}
          </DialogTitle>
          <DialogDescription>
            Armá la pieza con los datos reales de la fiesta y revisala antes de guardar o imprimir.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {topeAlcanzado && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Se llegó al tope de IA del mes</AlertTitle>
              <AlertDescription>
                Se llegó al tope de IA del mes. Podés seguir usando la plantilla de respaldo o imprimir el diseño ya guardado.
              </AlertDescription>
            </Alert>
          )}

          {!topeAlcanzado && errorMensaje && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Hubo un inconveniente</AlertTitle>
              <AlertDescription>{errorMensaje}</AlertDescription>
            </Alert>
          )}

          {mostrarAlertaResolucion && (
            <Alert className="border-amber-300 bg-amber-50 text-amber-950">
              <AlertTriangle className="h-4 w-4 text-amber-700" />
              <AlertTitle>Resolución por debajo de lo recomendado</AlertTitle>
              <AlertDescription>
                {resolucionActiva?.avisoResolucion || 'La imagen salió con resolución menor a la ideal para imprimir.'}
                {resolucionActiva?.anchoPx && resolucionActiva?.altoPx
                  ? ` (${resolucionActiva.anchoPx} × ${resolucionActiva.altoPx} px)`
                  : ''}
              </AlertDescription>
            </Alert>
          )}

          {plantillaConFondo && (
            <Alert className="border-amber-300 bg-amber-50 text-amber-950">
              <AlertTriangle className="h-4 w-4 text-amber-700" />
              <AlertTitle>Usamos la plantilla de respaldo</AlertTitle>
              <AlertDescription className="space-y-3">
                <p>{plantillaConFondo.aviso}</p>
                {plantillaConFondo.mejorFondoBase64 && (
                  <div className="space-y-2 pt-1">
                    <div className="flex justify-center bg-white/80 rounded-md p-2 border border-amber-200">
                      <img
                        src={asegurarDataUrl(plantillaConFondo.mejorFondoBase64)}
                        alt="Fondo sugerido por IA"
                        className="max-h-48 object-contain rounded"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAplicarFondoEnPlantilla}
                      disabled={ocupado}
                    >
                      Aplicar este fondo en la plantilla
                    </Button>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {isGenerating && (
            <div className="flex flex-col items-center justify-center gap-3 py-12 border rounded-lg bg-muted/30">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm font-medium">Diseñando {tituloPieza} y verificando los textos...</p>
              <p className="text-xs text-muted-foreground">Esto puede demorar unos segundos.</p>
            </div>
          )}

          {!isGenerating && imagenActual && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <Badge variant={generatedDataUrl ? 'default' : 'secondary'}>
                  {generatedDataUrl ? 'Nueva versión generada' : 'Diseño guardado actualmente'}
                </Badge>
                {generatedMeta?.anchoPx && generatedMeta?.altoPx && (
                  <span className="text-xs text-muted-foreground">
                    {generatedMeta.anchoPx} × {generatedMeta.altoPx} px
                  </span>
                )}
              </div>

              <div className="flex justify-center rounded-lg border bg-slate-50 p-4">
                <img
                  src={imagenActual}
                  alt={`Vista previa de ${tituloPieza}`}
                  className="max-h-[420px] w-auto object-contain rounded shadow-sm"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button type="button" onClick={handleUsarEsta} disabled={ocupado}>
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  Usar esta
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGenerar}
                  disabled={ocupado || topeAlcanzado}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {topeAlcanzado ? 'Se llegó al tope de IA del mes' : 'Otra versión'}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleVolverPlantilla}
                  disabled={ocupado}
                >
                  {isRemoving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RotateCcw className="w-4 h-4 mr-2" />
                  )}
                  Volver a la plantilla
                </Button>

                {admiteImpresionPdf && (
                  <div className="flex items-center gap-2 ml-auto">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleImprimirPdf}
                      disabled={ocupado}
                    >
                      {isExportingPdf ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Printer className="w-4 h-4 mr-2" />
                      )}
                      Imprimir
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleDescargarPdf}
                      disabled={ocupado}
                    >
                      {isExportingPdf ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4 mr-2" />
                      )}
                      Descargar PDF
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {!isGenerating && !imagenActual && !plantillaConFondo && (
            <div className="flex flex-col items-center justify-center gap-4 py-10 px-4 border border-dashed rounded-lg text-center bg-muted/20">
              <Sparkles className="w-8 h-8 text-primary" />
              <div className="space-y-1 max-w-md">
                <p className="text-sm font-medium">Todavía no generaste un diseño con IA para {tituloPieza}.</p>
                <p className="text-xs text-muted-foreground">
                  La IA toma el nombre, temática, colores, foto y elementos reales de la fiesta. No se consume cupo hasta que toques el botón.
                </p>
              </div>
              <Button
                type="button"
                onClick={handleGenerar}
                disabled={ocupado || topeAlcanzado}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {topeAlcanzado ? 'Se llegó al tope de IA del mes' : 'Diseñar con IA'}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}


'use client';

import { useState, type FormEvent, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Palette, Save, Loader2, Image as ImageIcon, AlertTriangle, ImageOff } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import NextImage from 'next/image';
import type { ColorPalette, DecoracionData } from '@/types/fiesta';
import { getFiestaActual, updateDecoracionFiestaActual } from '@/app/actions/fiesta-actual';

const defaultColorPalette: ColorPalette = {
  primary: '#FFFFFF',
  secondary: '#FFFFFF',
  accent: '#FFFFFF',
};

const defaultNotasDecoracion = "Detalles pendientes de definir: colores de la fiesta, cubre mantel, decoración de torta, centros de mesa, zona de regalos, cuadro de firmas, gigantografía, alfombra roja, globos, telas, paneles shimmer, flores, tipo de mesas de torta, mobiliario, arreglos florales, números y letras.";


export default function DecoracionEventoPage() {
  const { toast } = useToast();
  const [decoracionData, setDecoracionData] = useState<DecoracionData>({
    tema: '',
    paletaColores: { ...defaultColorPalette },
    moodboardImageUrl: '',
    notas: defaultNotasDecoracion,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDecoracionData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fiestaData = await getFiestaActual();
      if (fiestaData.decoracion) {
        setDecoracionData({
          tema: fiestaData.decoracion.tema || '',
          paletaColores: fiestaData.decoracion.paletaColores || { ...defaultColorPalette },
          moodboardImageUrl: fiestaData.decoracion.moodboardImageUrl || '',
          notas: fiestaData.decoracion.notas || defaultNotasDecoracion,
        });
      } else {
        setDecoracionData({
            tema: 'Boda Noelia Damaceno', 
            paletaColores: { ...defaultColorPalette },
            moodboardImageUrl: '',
            notas: defaultNotasDecoracion,
        });
      }
    } catch (err: any) {
      console.error("Error loading decoration data:", err);
      setError("No se pudo cargar la configuración de decoración.");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadDecoracionData();
  }, [loadDecoracionData]);

  const handleInputChange = (field: keyof DecoracionData, value: string) => {
    setDecoracionData(prev => ({ ...prev, [field]: value }));
  };

  const handleColorChange = (colorName: keyof ColorPalette, value: string) => {
    setDecoracionData(prev => ({
      ...prev,
      paletaColores: {
        ...(prev.paletaColores || defaultColorPalette),
        [colorName]: value,
      },
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const result = await updateDecoracionFiestaActual(decoracionData);
      if (result.success && result.updatedData) {
        toast({
          title: "¡Decoración Guardada!",
          description: "Los detalles de diseño y decoración se han guardado.",
        });
        setDecoracionData(result.updatedData); 
      } else {
        throw new Error(result.error || "Error desconocido al guardar la decoración.");
      }
    } catch (err: any) {
      toast({ title: "Error al Guardar", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="ml-3 text-lg">Cargando datos de decoración...</p>
      </div>
    );
  }

  if (error) {
     return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Error al Cargar Decoración</h2>
        <p className="text-muted-foreground">{error}</p>
         <Button onClick={loadDecoracionData} className="mt-4">Intentar de Nuevo</Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Diseño y Decoración del Evento
        </h1>
        <Link href="/fiestas/nueva" passHref>
          <Button variant="outline" disabled={isSaving}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Planificador
          </Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Palette className="w-8 h-8 text-primary" />
              <div>
                <CardTitle className="font-headline text-xl">Define la Estética de tu Evento</CardTitle>
                <CardDescription>Establece el tema, colores y una URL de imagen de inspiración.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="tema-evento" className="text-base">Tema del Evento</Label>
              <Input
                id="tema-evento"
                value={decoracionData.tema || ''}
                onChange={(e) => handleInputChange('tema', e.target.value)}
                placeholder="Ej: Fiesta Tropical, Noche de Gala, Años 80"
                className="text-base p-3"
                disabled={isSaving}
              />
            </div>

            <div className="space-y-3">
              <Label className="text-base">Paleta de Colores Principal</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {(['primary', 'secondary', 'accent'] as const).map(colorKey => (
                  <div key={colorKey} className="space-y-1">
                    <Label htmlFor={`color-${colorKey}`} className="text-sm capitalize">{colorKey}</Label>
                    <div className="flex items-center gap-2">
                       <Input
                        id={`color-${colorKey}`}
                        type="color"
                        value={decoracionData.paletaColores?.[colorKey] || '#FFFFFF'}
                        onChange={(e) => handleColorChange(colorKey, e.target.value)}
                        className="w-12 h-10 p-1"
                        disabled={isSaving}
                      />
                      <Input
                        type="text"
                        value={decoracionData.paletaColores?.[colorKey] || '#FFFFFF'}
                        onChange={(e) => handleColorChange(colorKey, e.target.value)}
                        className="text-sm p-2 h-10"
                        placeholder="#RRGGBB"
                        disabled={isSaving}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="moodboard-url" className="text-base">URL de Imagen de Inspiración / Moodboard</Label>
              <Input
                id="moodboard-url"
                type="url"
                value={decoracionData.moodboardImageUrl || ''}
                onChange={(e) => handleInputChange('moodboardImageUrl', e.target.value)}
                placeholder="Pega aquí la URL de una imagen (ej: https://.../moodboard.jpg)"
                className="text-base p-3"
                disabled={isSaving}
              />
              <p className="text-xs text-muted-foreground">
                Sube tu imagen a un servicio como Imgur o Google Photos y pega el enlace directo aquí.
              </p>
              {decoracionData.moodboardImageUrl && (
                <div className="mt-3 p-2 border rounded-md inline-block bg-muted/50 max-w-full overflow-hidden">
                  <NextImage
                    src={decoracionData.moodboardImageUrl}
                    alt="Vista previa del Moodboard"
                    width={300}
                    height={200}
                    className="rounded object-contain max-h-[200px] w-auto"
                    data-ai-hint="moodboard preview event"
                    onError={(e) => { e.currentTarget.style.display = 'none'; /* Hide broken image icon */ }}
                  />
                </div>
              )}
              {!decoracionData.moodboardImageUrl && (
                <div className="mt-3 p-4 border border-dashed rounded-md flex flex-col items-center justify-center text-muted-foreground h-[150px] bg-muted/30">
                    <ImageOff className="w-10 h-10 mb-2" />
                    <p className="text-sm">Pega una URL para ver la imagen de inspiración.</p>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notas-decoracion" className="text-base">Notas Adicionales de Decoración</Label>
              <Textarea
                id="notas-decoracion"
                value={decoracionData.notas || ''}
                onChange={(e) => handleInputChange('notas', e.target.value)}
                placeholder="Detalles sobre flores, iluminación, centros de mesa, etc."
                rows={5}
                className="text-base p-3"
                disabled={isSaving}
              />
            </div>
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button type="submit" className="w-full sm:w-auto" disabled={isSaving || isLoading}>
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {isSaving ? 'Guardando...' : 'Guardar Diseño y Decoración'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}

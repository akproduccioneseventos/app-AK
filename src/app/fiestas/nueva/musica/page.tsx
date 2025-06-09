
'use client';

import { useState, type FormEvent, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Loader2, AlertTriangle, Music2, ListMusic, Ban } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import type { MusicaFiesta } from '@/types/fiesta';
import { getFiestaActual, updateMusicaFiestaActual } from '@/app/actions/fiesta-actual';

export default function MusicaFiestaPage() {
  const { toast } = useToast();
  const [musicaData, setMusicaData] = useState<MusicaFiesta>({
    cancionEntrada: '',
    cancionVals: '',
    playlistFiesta: '',
    listaNoReproducir: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMusicaData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fiestaData = await getFiestaActual();
      if (fiestaData.musica) {
        setMusicaData(fiestaData.musica);
      } else {
        // Si no hay datos de música, inicializa con valores por defecto
        setMusicaData({
          cancionEntrada: '',
          cancionVals: '',
          playlistFiesta: '',
          listaNoReproducir: '',
        });
      }
    } catch (err: any) {
      console.error("Error loading music data:", err);
      setError("No se pudo cargar la configuración de música.");
      toast({ title: "Error al Cargar", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadMusicaData();
  }, [loadMusicaData]);

  const handleInputChange = (field: keyof MusicaFiesta, value: string) => {
    setMusicaData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const result = await updateMusicaFiestaActual(musicaData);
      if (result.success && result.updatedData) {
        toast({
          title: "¡Música Guardada!",
          description: "Las preferencias musicales para la fiesta han sido guardadas.",
        });
        setMusicaData(result.updatedData);
      } else {
        throw new Error(result.error || "Error desconocido al guardar la música.");
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
        <p className="ml-3 text-lg">Cargando configuración musical...</p>
      </div>
    );
  }

  if (error) {
     return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Error al Cargar Música</h2>
        <p className="text-muted-foreground">{error}</p>
         <Button onClick={loadMusicaData} className="mt-4">Intentar de Nuevo</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-3">
          <Music2 className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Música de la Fiesta
          </h1>
        </div>
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
            <CardTitle className="font-headline text-xl">Preferencias Musicales</CardTitle>
            <CardDescription>Define las canciones clave y el ambiente musical para tu evento.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="cancion-entrada" className="text-base flex items-center gap-2">
                <Music2 className="w-5 h-5 text-primary/80" /> Canción de Entrada
              </Label>
              <Input
                id="cancion-entrada"
                value={musicaData.cancionEntrada || ''}
                onChange={(e) => handleInputChange('cancionEntrada', e.target.value)}
                placeholder="Ej: 'Marry You' - Bruno Mars (o enlace a YouTube/Spotify)"
                className="text-base p-3"
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cancion-vals" className="text-base flex items-center gap-2">
                <Music2 className="w-5 h-5 text-primary/80" /> Canción para el Vals (o momento especial)
              </Label>
              <Input
                id="cancion-vals"
                value={musicaData.cancionVals || ''}
                onChange={(e) => handleInputChange('cancionVals', e.target.value)}
                placeholder="Ej: 'Danubio Azul' (o enlace)"
                className="text-base p-3"
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="playlist-fiesta" className="text-base flex items-center gap-2">
                <ListMusic className="w-5 h-5 text-primary/80" /> Lista de Canciones para la Fiesta
              </Label>
              <Textarea
                id="playlist-fiesta"
                value={musicaData.playlistFiesta || ''}
                onChange={(e) => handleInputChange('playlistFiesta', e.target.value)}
                placeholder="Escribe aquí una lista de canciones, géneros preferidos, o pega un enlace a una playlist (Spotify, YouTube Music, etc.)"
                rows={6}
                className="text-base p-3"
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lista-no-reproducir" className="text-base flex items-center gap-2">
                <Ban className="w-5 h-5 text-destructive" /> Música a NO Reproducir (Lista de Exclusión)
              </Label>
              <Textarea
                id="lista-no-reproducir"
                value={musicaData.listaNoReproducir || ''}
                onChange={(e) => handleInputChange('listaNoReproducir', e.target.value)}
                placeholder="Canciones o artistas específicos que no quieres que suenen en la fiesta."
                rows={4}
                className="text-base p-3"
                disabled={isSaving}
              />
            </div>
             <img 
                src="https://placehold.co/600x300.png" 
                alt="Ambiente musical de fiesta" 
                className="mt-6 rounded-md shadow-md mx-auto"
                data-ai-hint="party music dj"
            />
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button type="submit" className="w-full sm:w-auto" disabled={isSaving || isLoading}>
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Save className="w-4 h-4 mr-2" />}
              {isSaving ? 'Guardando...' : 'Guardar Preferencias Musicales'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}

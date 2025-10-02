'use client';

import { useState, type FormEvent, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Loader2, AlertTriangle, Music2, ListMusic, Ban, CakeSlice, PlusCircle, Trash2, Printer } from 'lucide-react'; // Added Printer
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import type { MusicaFiesta } from '@/types/fiesta';
import { getFiestaActual, updateMusicaFiestaActual } from '@/app/actions/fiesta-actual';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge'; // Para mostrar las canciones
import { ScrollArea } from '@/components/ui/scroll-area';

const cancionesSugeridasTortaBrindis = [
  "Llego la hora de cortar la torta",
  "Quince primaveras",
  "Brindis",
  "Amigos",
  "Feliz cumpleaños"
];

export default function MusicaFiestaPage() {
  const { toast } = useToast();
  const [musicaData, setMusicaData] = useState<MusicaFiesta>({
    cancionEntrada: '',
    cancionVals: '',
    cancionesTortaBrindis: [],
    playlistFiesta: '',
    listaNoReproducir: '',
    sugerenciasInvitados: '',
  });
  const [nuevaCancionTorta, setNuevaCancionTorta] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMusicaData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fiestaData = await getFiestaActual();
      if (fiestaData.musica) {
        setMusicaData({
          ...fiestaData.musica,
          cancionesTortaBrindis: fiestaData.musica.cancionesTortaBrindis || [], // Asegurar que sea un array
        });
      } else {
        setMusicaData({
          cancionEntrada: '',
          cancionVals: '',
          cancionesTortaBrindis: [],
          playlistFiesta: '',
          listaNoReproducir: '',
          sugerenciasInvitados: '',
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

  const handleInputChange = (field: Exclude<keyof MusicaFiesta, 'cancionesTortaBrindis'>, value: string) => {
    setMusicaData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddCancionTortaBrindis = (songName: string) => {
    if (songName.trim() === '') return;
    setMusicaData(prev => {
      const currentSongs = prev.cancionesTortaBrindis || [];
      if (!currentSongs.includes(songName.trim())) {
        return { ...prev, cancionesTortaBrindis: [...currentSongs, songName.trim()] };
      }
      return prev;
    });
    setNuevaCancionTorta(''); // Limpiar input después de añadir
  };

  const handleRemoveCancionTortaBrindis = (songToRemove: string) => {
    setMusicaData(prev => ({
      ...prev,
      cancionesTortaBrindis: (prev.cancionesTortaBrindis || []).filter(song => song !== songToRemove),
    }));
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
        setMusicaData({
            ...result.updatedData,
            cancionesTortaBrindis: result.updatedData.cancionesTortaBrindis || [],
        });
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
        <div className="flex gap-2">
            <Link href="/fiestas/nueva/musica/pdf" passHref>
              <Button variant="secondary"><Printer className="w-4 h-4 mr-2"/>Imprimir para DJ</Button>
            </Link>
            <Link href="/fiestas/nueva" passHref>
              <Button variant="outline" disabled={isSaving}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al Planificador
              </Button>
            </Link>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-xl">Preferencias Musicales Generales</CardTitle>
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

            <Separator />

            <div className="space-y-4">
              <h3 className="text-lg font-medium font-headline text-primary flex items-center gap-2">
                <CakeSlice className="w-5 h-5"/> Música para el Corte de la Torta y Brindis
              </h3>
              <div className="space-y-2">
                <Label htmlFor="nueva-cancion-torta" className="text-sm">Añadir canción manualmente:</Label>
                <div className="flex gap-2">
                  <Input
                    id="nueva-cancion-torta"
                    value={nuevaCancionTorta}
                    onChange={(e) => setNuevaCancionTorta(e.target.value)}
                    placeholder="Nombre de la canción - Artista"
                    className="text-sm p-2"
                    disabled={isSaving}
                  />
                  <Button type="button" size="sm" onClick={() => handleAddCancionTortaBrindis(nuevaCancionTorta)} disabled={isSaving || !nuevaCancionTorta.trim()}>
                    <PlusCircle className="w-4 h-4 mr-1"/> Añadir
                  </Button>
                </div>
              </div>
              <div>
                <p className="text-sm mb-2 text-muted-foreground">Sugerencias (haz clic para añadir):</p>
                <div className="flex flex-wrap gap-2">
                  {cancionesSugeridasTortaBrindis.map(song => (
                    <Button
                      key={song}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddCancionTortaBrindis(song)}
                      disabled={isSaving || musicaData.cancionesTortaBrindis?.includes(song)}
                      className="text-xs"
                    >
                      {song}
                    </Button>
                  ))}
                </div>
              </div>
              {musicaData.cancionesTortaBrindis && musicaData.cancionesTortaBrindis.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-sm font-medium">Canciones seleccionadas para Torta/Brindis:</p>
                  <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-muted/50">
                    {musicaData.cancionesTortaBrindis.map(song => (
                      <Badge key={song} variant="secondary" className="text-sm py-1 px-2">
                        {song}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 ml-1.5 text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemoveCancionTortaBrindis(song)}
                          disabled={isSaving}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
                <Label htmlFor="sugerencias-invitados" className="text-base flex items-center gap-2">
                <ListMusic className="w-5 h-5 text-primary/80" /> Sugerencias de Invitados
                </Label>
                <Textarea
                id="sugerencias-invitados"
                value={musicaData.sugerenciasInvitados || ''}
                readOnly
                placeholder="Las sugerencias de los invitados aparecerán aquí automáticamente."
                rows={4}
                className="text-sm p-3 bg-muted/70"
                />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="playlist-fiesta" className="text-base flex items-center gap-2">
                <ListMusic className="w-5 h-5 text-primary/80" /> Playlist General para la Fiesta
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

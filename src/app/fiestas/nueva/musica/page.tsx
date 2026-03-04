
'use client';

import { useState, type FormEvent, useEffect, useCallback, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Loader2, AlertTriangle, Music2, ListMusic, Ban, CakeSlice, PlusCircle, Trash2, Printer } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import type { MusicaFiesta } from '@/types/fiesta';
import { getFiestaById, updateMusicaFiestaActual } from '@/app/actions/fiesta-actual';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useSearchParams, useRouter } from 'next/navigation';

const cancionesSugeridasTortaBrindis = [
  "Llego la hora de cortar la torta",
  "Quince primaveras",
  "Brindis",
  "Amigos",
  "Feliz cumpleaños"
];

function MusicaContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const fiestaId = searchParams.get('fiestaId');

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
    if (!fiestaId) return;
    setIsLoading(true);
    setError(null);
    try {
      const fiestaData = await getFiestaById(fiestaId);
      if (!fiestaData) throw new Error("Fiesta no encontrada");
      if (fiestaData.musica) {
        setMusicaData({
          ...fiestaData.musica,
          cancionesTortaBrindis: fiestaData.musica.cancionesTortaBrindis || [],
        });
      }
    } catch (err: any) {
      setError("No se pudo cargar la configuración de música.");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast, fiestaId]);

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
    setNuevaCancionTorta('');
  };

  const handleRemoveCancionTortaBrindis = (songToRemove: string) => {
    setMusicaData(prev => ({
      ...prev,
      cancionesTortaBrindis: (prev.cancionesTortaBrindis || []).filter(song => song !== songToRemove),
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!fiestaId) return;
    setIsSaving(true);
    try {
      const result = await updateMusicaFiestaActual(fiestaId, musicaData);
      if (result.success) {
        toast({ title: "¡Música Guardada!" });
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      toast({ title: "Error al Guardar", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary"/></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-3">
          <Music2 className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">Música de la Fiesta</h1>
        </div>
        <div className="flex gap-2">
            <Link href={`/fiestas/nueva/musica/pdf?fiestaId=${fiestaId}`} passHref>
              <Button variant="secondary"><Printer className="w-4 h-4 mr-2"/>Imprimir para DJ</Button>
            </Link>
            <Link href={`/fiestas/nueva?fiestaId=${fiestaId}`} passHref>
              <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button>
            </Link>
        </div>
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
                placeholder="Ej: 'Marry You' - Bruno Mars"
                className="text-base p-3"
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cancion-vals" className="text-base flex items-center gap-2">
                <Music2 className="w-5 h-5 text-primary/80" /> Canción para el Vals
              </Label>
              <Input
                id="cancion-vals"
                value={musicaData.cancionVals || ''}
                onChange={(e) => handleInputChange('cancionVals', e.target.value)}
                placeholder="Ej: 'Danubio Azul'"
                className="text-base p-3"
                disabled={isSaving}
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-lg font-medium font-headline text-primary flex items-center gap-2">
                <CakeSlice className="w-5 h-5"/> Torta y Brindis
              </h3>
              <div className="flex gap-2">
                <Input
                  value={nuevaCancionTorta}
                  onChange={(e) => setNuevaCancionTorta(e.target.value)}
                  placeholder="Canción para la torta..."
                  className="p-2"
                  disabled={isSaving}
                />
                <Button type="button" onClick={() => handleAddCancionTortaBrindis(nuevaCancionTorta)} disabled={isSaving || !nuevaCancionTorta.trim()}>
                  <PlusCircle className="w-4 h-4 mr-1"/> Añadir
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {musicaData.cancionesTortaBrindis?.map(song => (
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

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="playlist-fiesta" className="text-base flex items-center gap-2">
                <ListMusic className="w-5 h-5 text-primary/80" /> Playlist y Estilos
              </Label>
              <Textarea
                id="playlist-fiesta"
                value={musicaData.playlistFiesta || ''}
                onChange={(e) => handleInputChange('playlistFiesta', e.target.value)}
                placeholder="Escribe géneros, artistas o pega enlaces a Spotify/YouTube..."
                rows={6}
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lista-no-reproducir" className="text-base flex items-center gap-2">
                <Ban className="w-5 h-5 text-destructive" /> Lista de "NO REPRODUCIR"
              </Label>
              <Textarea
                id="lista-no-reproducir"
                value={musicaData.listaNoReproducir || ''}
                onChange={(e) => handleInputChange('listaNoReproducir', e.target.value)}
                placeholder="Canciones que NO quieres que suenen bajo ningún motivo..."
                rows={4}
                disabled={isSaving}
              />
            </div>
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button type="submit" className="w-full sm:w-auto" disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Save className="w-4 h-4 mr-2" />}
              Guardar Preferencias
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}

export default function MusicaFiestaPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary"/></div>}>
            <MusicaContent />
        </Suspense>
    );
}

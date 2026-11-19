'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Video, Save, Trash2, ExternalLink, Loader2, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  LUGARES_CON_VIDEO,
  idDeYoutube,
  type VideoAyudaItem,
} from '@/lib/videos-de-ayuda';
import {
  getVideosDeAyudaParaAjustes,
  guardarVideoDeAyuda,
  quitarVideoDeAyuda,
} from '@/app/actions/videos-de-ayuda';

export default function VideosDeAyudaSettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [savingLugar, setSavingLugar] = useState<string | null>(null);
  const [videos, setVideos] = useState<Record<string, { url: string; titulo: string }>>({});

  const cargarVideos = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getVideosDeAyudaParaAjustes();
      const map: Record<string, { url: string; titulo: string }> = {};
      data.forEach((item) => {
        map[item.lugar] = {
          url: item.youtubeUrl || '',
          titulo: item.titulo || '',
        };
      });
      setVideos(map);
    } catch {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los videos de ayuda.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    cargarVideos();
  }, [cargarVideos]);

  const handleChange = (lugar: string, campo: 'url' | 'titulo', valor: string) => {
    setVideos((prev) => ({
      ...prev,
      [lugar]: {
        url: campo === 'url' ? valor : prev[lugar]?.url || '',
        titulo: campo === 'titulo' ? valor : prev[lugar]?.titulo || '',
      },
    }));
  };

  const handleGuardar = async (lugar: string) => {
    const item = videos[lugar];
    if (!item?.url?.trim()) {
      toast({
        title: 'Falta el enlace',
        description: 'Ingresá un enlace de YouTube válido.',
        variant: 'destructive',
      });
      return;
    }

    const videoId = idDeYoutube(item.url);
    if (!videoId) {
      toast({
        title: 'Enlace no válido',
        description: 'El enlace debe ser de YouTube (youtube.com, youtu.be o shorts).',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSavingLugar(lugar);
      const res = await guardarVideoDeAyuda(lugar, item.url, item.titulo);
      if (!res.success) {
        toast({
          title: 'Error al guardar',
          description: res.error || 'No se pudo guardar el video de ayuda.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Video guardado',
        description: 'El video de ayuda quedó configurado y visible en la pantalla.',
      });
      await cargarVideos();
    } catch (e: any) {
      toast({
        title: 'Error',
        description: e.message || 'Ocurrió un error al guardar.',
        variant: 'destructive',
      });
    } finally {
      setSavingLugar(null);
    }
  };

  const handleQuitar = async (lugar: string) => {
    try {
      setSavingLugar(lugar);
      const res = await quitarVideoDeAyuda(lugar);
      if (!res.success) {
        toast({
          title: 'Error',
          description: res.error || 'No se pudo quitar el video.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Video quitado',
        description: 'El video de ayuda fue eliminado de esta pantalla.',
      });
      setVideos((prev) => {
        const next = { ...prev };
        delete next[lugar];
        return next;
      });
    } catch (e: any) {
      toast({
        title: 'Error',
        description: e.message || 'Ocurrió un error al quitar el video.',
        variant: 'destructive',
      });
    } finally {
      setSavingLugar(null);
    }
  };

  return (
    <div className="container max-w-5xl py-8 space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/settings">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Video className="h-6 w-6 text-red-500" />
            Videos de Ayuda por Pantalla
          </h1>
          <p className="text-sm text-muted-foreground">
            Configurá un video de YouTube para cada pantalla clave de la app. Los invitados y clientes podrán ver una explicación de cómo usar cada panel.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-6">
          {LUGARES_CON_VIDEO.map((lugar) => {
            const videoActual = videos[lugar.clave] || { url: '', titulo: '' };
            const videoId = idDeYoutube(videoActual.url);
            const isSaving = savingLugar === lugar.clave;
            const tieneVideoGuardado = Boolean(videoId);

            return (
              <Card key={lugar.clave} className="border-border/60">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      {lugar.nombre}
                      {tieneVideoGuardado && (
                        <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Activo
                        </Badge>
                      )}
                    </CardTitle>
                    <Badge variant="secondary" className="font-mono text-xs">
                      {lugar.clave}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs text-muted-foreground">
                    Aparece en: <code className="bg-muted px-1 py-0.5 rounded">{lugar.pantalla}</code>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`url-${lugar.clave}`} className="text-xs font-medium">
                        Enlace de YouTube (watch, youtu.be o shorts)
                      </Label>
                      <Input
                        id={`url-${lugar.clave}`}
                        placeholder="https://www.youtube.com/watch?v=..."
                        value={videoActual.url}
                        onChange={(e) => handleChange(lugar.clave, 'url', e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`titulo-${lugar.clave}`} className="text-xs font-medium">
                        Título o descripción breve (opcional)
                      </Label>
                      <Input
                        id={`titulo-${lugar.clave}`}
                        placeholder="Ej. ¿Cómo confirmar tu asistencia y ver las fotos?"
                        value={videoActual.titulo}
                        onChange={(e) => handleChange(lugar.clave, 'titulo', e.target.value)}
                        className="text-sm"
                      />
                    </div>
                  </div>

                  {videoId && (
                    <div className="mt-3 p-3 rounded-lg border bg-muted/30">
                      <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center justify-between">
                        <span>Vista previa del video (ID: <code className="text-foreground">{videoId}</code>):</span>
                        <a
                          href={`https://www.youtube.com/watch?v=${videoId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          Ver en YouTube <ExternalLink className="h-3 w-3" />
                        </a>
                      </p>
                      <div className="relative aspect-video max-w-md rounded-md overflow-hidden bg-black/40 border">
                        <iframe
                          src={`https://www.youtube-nocookie.com/embed/${videoId}`}
                          title={`Vista previa - ${lugar.nombre}`}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2">
                    {tieneVideoGuardado && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={isSaving}
                        onClick={() => handleQuitar(lugar.clave)}
                      >
                        <Trash2 className="h-4 w-4 mr-1.5" />
                        Quitar
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      disabled={isSaving}
                      onClick={() => handleGuardar(lugar.clave)}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-1.5" />
                          Guardar Video
                        </>
                      )}
                    </Button>
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

'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Loader2, Play, Save, Trash2, Video, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { getTutorialesSettings, saveTutorialesSettings } from '@/app/actions/settings';
import {
  GRUPOS_TUTORIAL,
  TEMAS_TUTORIAL,
  validarEnlaceYoutubeTutorial,
} from '@/lib/tutoriales/temas';
import type { TutorialesSettings } from '@/types/settings';
import { invalidarCacheTutoriales } from '@/components/tutorial/BotonComoFunciona';

export default function TutorialesSettingsPanel() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [savingAll, setSavingAll] = useState(false);
  const [savingClave, setSavingClave] = useState<string | null>(null);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [savedMap, setSavedMap] = useState<TutorialesSettings>({});
  const [errorsByClave, setErrorsByClave] = useState<Record<string, string>>({});
  const [previewTema, setPreviewTema] = useState<{ titulo: string; videoId: string } | null>(null);

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getTutorialesSettings();
      const inicialUrls: Record<string, string> = {};
      for (const tema of TEMAS_TUTORIAL) {
        const entry = data?.[tema.clave];
        inicialUrls[tema.clave] =
          entry?.youtubeUrl || (entry?.videoId ? `https://youtu.be/${entry.videoId}` : '');
      }
      setSavedMap(data || {});
      setUrls(inicialUrls);
      setErrorsByClave({});
    } catch {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los tutoriales en video.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const totalConVideo = useMemo(
    () => TEMAS_TUTORIAL.filter((t) => Boolean(savedMap?.[t.clave]?.videoId)).length,
    [savedMap],
  );

  const handleChangeUrl = (clave: string, value: string) => {
    setUrls((prev) => ({ ...prev, [clave]: value }));
    if (errorsByClave[clave]) {
      setErrorsByClave((prev) => {
        const copia = { ...prev };
        delete copia[clave];
        return copia;
      });
    }
  };

  const construirPayloadDesdeEstado = (clavesFiltradas?: Set<string>) => {
    const nextSettings: TutorialesSettings = {};
    const nuevosErrores: Record<string, string> = {};

    for (const tema of TEMAS_TUTORIAL) {
      if (clavesFiltradas && !clavesFiltradas.has(tema.clave)) {
        if (savedMap[tema.clave]?.videoId) {
          nextSettings[tema.clave] = savedMap[tema.clave];
        }
        continue;
      }

      const raw = (urls[tema.clave] ?? '').trim();
      if (!raw) continue;

      const parsed = validarEnlaceYoutubeTutorial(raw);
      if (!parsed.ok || !parsed.videoId) {
        nuevosErrores[tema.clave] = parsed.error || 'Pegá un enlace de YouTube';
        continue;
      }

      nextSettings[tema.clave] = {
        youtubeUrl: parsed.youtubeUrl,
        videoId: parsed.videoId,
      };
    }

    return { nextSettings, nuevosErrores };
  };

  const handleSaveOne = async (clave: string) => {
    const raw = (urls[clave] ?? '').trim();
    const parsed = validarEnlaceYoutubeTutorial(raw);
    if (!parsed.ok) {
      setErrorsByClave((prev) => ({ ...prev, [clave]: parsed.error || 'Pegá un enlace de YouTube' }));
      return;
    }

    const { nextSettings } = construirPayloadDesdeEstado(new Set([clave]));
    try {
      setSavingClave(clave);
      const res = await saveTutorialesSettings(nextSettings);
      if (!res.success) {
        setErrorsByClave((prev) => ({ ...prev, [clave]: res.error || 'No se pudo guardar.' }));
        toast({
          title: 'Error al guardar',
          description: res.error || 'Revisá el enlace ingresado.',
          variant: 'destructive',
        });
        return;
      }
      setSavedMap(res.settings || nextSettings);
      invalidarCacheTutoriales();
      toast({
        title: parsed.videoId ? 'Tutorial guardado' : 'Tutorial quitado',
        description: parsed.videoId
          ? 'El botón "¿Cómo funciona?" ya está activo en esa pantalla.'
          : 'Se quitó el video de esa pantalla.',
      });
    } finally {
      setSavingClave(null);
    }
  };

  const handleRemoveOne = async (clave: string) => {
    setUrls((prev) => ({ ...prev, [clave]: '' }));
    setErrorsByClave((prev) => {
      const copia = { ...prev };
      delete copia[clave];
      return copia;
    });
    const nextSettings: TutorialesSettings = {};
    for (const tema of TEMAS_TUTORIAL) {
      if (tema.clave !== clave && savedMap[tema.clave]?.videoId) {
        nextSettings[tema.clave] = savedMap[tema.clave];
      }
    }
    try {
      setSavingClave(clave);
      const res = await saveTutorialesSettings(nextSettings);
      if (res.success) {
        setSavedMap(res.settings || nextSettings);
        invalidarCacheTutoriales();
        toast({ title: 'Tutorial quitado', description: 'El botón dejó de mostrarse en esa pantalla.' });
      } else {
        toast({
          title: 'Error al quitar',
          description: res.error || 'No se pudo actualizar.',
          variant: 'destructive',
        });
      }
    } finally {
      setSavingClave(null);
    }
  };

  const handleSaveAll = async () => {
    const { nextSettings, nuevosErrores } = construirPayloadDesdeEstado();
    if (Object.keys(nuevosErrores).length > 0) {
      setErrorsByClave(nuevosErrores);
      toast({
        title: 'Revisá los enlaces marcados',
        description: 'Pegá un enlace de YouTube válido en cada casilla marcada en rojo.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSavingAll(true);
      const res = await saveTutorialesSettings(nextSettings);
      if (!res.success) {
        toast({
          title: 'Error al guardar',
          description: res.error || 'No se pudieron guardar los tutoriales.',
          variant: 'destructive',
        });
        return;
      }
      setSavedMap(res.settings || nextSettings);
      invalidarCacheTutoriales();
      toast({
        title: 'Tutoriales guardados',
        description: `Quedaron configurados ${Object.keys(res.settings || nextSettings).length} de ${TEMAS_TUTORIAL.length} tutoriales.`,
      });
    } finally {
      setSavingAll(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Video className="w-6 h-6 text-rose-600" />
            Tutoriales en video
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Pegá enlaces ocultos o públicos de YouTube para mostrar el botón &ldquo;¿Cómo funciona?&rdquo; en cada pantalla externa.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="secondary" className="text-xs font-bold px-3 py-1.5">
            {totalConVideo} de {TEMAS_TUTORIAL.length} con video
          </Badge>
          <Button onClick={handleSaveAll} disabled={loading || savingAll}>
            {savingAll ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Guardar todos
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Cargando tutoriales…
        </div>
      ) : (
        <div className="space-y-6">
          {GRUPOS_TUTORIAL.map((grupo) => {
            const temasGrupo = TEMAS_TUTORIAL.filter((t) => t.grupo === grupo);
            const cargadosGrupo = temasGrupo.filter((t) => Boolean(savedMap?.[t.clave]?.videoId)).length;

            return (
              <Card key={grupo}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-lg">{grupo}</CardTitle>
                    <Badge variant="outline" className="text-xs">
                      {cargadosGrupo} / {temasGrupo.length}
                    </Badge>
                  </div>
                  <CardDescription>
                    Pantallas visibles para {grupo.toLowerCase()}. Sin enlace cargado, el botón no se muestra.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {temasGrupo.map((tema) => {
                    const currentUrl = urls[tema.clave] ?? '';
                    const validacionActual = currentUrl.trim() ? validarEnlaceYoutubeTutorial(currentUrl) : null;
                    const activeVideoId = validacionActual?.videoId || savedMap?.[tema.clave]?.videoId;
                    const errorMsg = errorsByClave[tema.clave];
                    const isBusy = savingClave === tema.clave;

                    return (
                      <div
                        key={tema.clave}
                        className="flex flex-col md:flex-row md:items-center gap-3 p-3.5 rounded-xl border bg-card"
                      >
                        {activeVideoId && (
                          <div className="w-full md:w-32 shrink-0 overflow-hidden rounded-lg border bg-black aspect-video">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={`https://i.ytimg.com/vi/${activeVideoId}/hqdefault.jpg`}
                              alt={`Miniatura ${tema.titulo}`}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        )}

                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-sm text-foreground">{tema.titulo}</span>
                            {savedMap?.[tema.clave]?.videoId && (
                              <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-0 text-[11px]">
                                <CheckCircle2 className="w-3 h-3 mr-1" /> Activo
                              </Badge>
                            )}
                          </div>
                          {tema.descripcion && (
                            <p className="text-xs text-muted-foreground">{tema.descripcion}</p>
                          )}
                          <Input
                            value={currentUrl}
                            onChange={(e) => handleChangeUrl(tema.clave, e.target.value)}
                            placeholder="https://youtu.be/... o https://www.youtube.com/watch?v=..."
                            aria-label={`Enlace de YouTube para ${tema.titulo}`}
                            className={errorMsg ? 'border-destructive focus-visible:ring-destructive' : ''}
                          />
                          {errorMsg && (
                            <p className="text-xs font-medium text-destructive">{errorMsg}</p>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          {activeVideoId && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => setPreviewTema({ titulo: tema.titulo, videoId: activeVideoId })}
                            >
                              <Play className="w-3.5 h-3.5 mr-1.5" />
                              Probar
                            </Button>
                          )}
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleSaveOne(tema.clave)}
                            disabled={isBusy}
                          >
                            {isBusy ? (
                              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                            ) : (
                              <Save className="w-3.5 h-3.5 mr-1.5" />
                            )}
                            Guardar
                          </Button>
                          {(currentUrl || savedMap?.[tema.clave]?.videoId) && (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleRemoveOne(tema.clave)}
                              disabled={isBusy}
                              aria-label={`Quitar tutorial de ${tema.titulo}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {previewTema && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Vista previa: ${previewTema.titulo}`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 sm:p-4"
          onClick={() => setPreviewTema(null)}
        >
          <div
            className="w-full max-w-3xl overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 text-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3">
              <h3 className="truncate text-sm font-bold">{previewTema.titulo}</h3>
              <button
                type="button"
                onClick={() => setPreviewTema(null)}
                aria-label="Cerrar vista previa"
                className="inline-flex h-11 min-h-[44px] w-11 min-w-[44px] items-center justify-center rounded-xl bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="relative aspect-video w-full bg-black">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(previewTema.videoId)}?rel=0`}
                title={`Vista previa: ${previewTema.titulo}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full border-0"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

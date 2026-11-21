'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  Star,
  MessageSquare,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Send,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  cargarResenasGoogleAction,
  publicarRespuestaResenaAction,
} from '@/app/actions/google-business-resenas';
import type { GoogleBusinessReview } from '@/lib/social-media/google-business-resenas';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ResenasGooglePage() {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<GoogleBusinessReview[]>([]);
  const [averageRating, setAverageRating] = useState<number | undefined>();
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorCriollo, setErrorCriollo] = useState<string | null>(null);

  // Estado para los borradores editables por reviewId
  const [borradores, setBorradores] = useState<Record<string, string>>({});
  const [publicandoId, setPublicandoId] = useState<string | null>(null);

  const cargarDatos = useCallback(async () => {
    setIsLoading(true);
    setErrorCriollo(null);
    try {
      const res = await cargarResenasGoogleAction();
      if (res.success) {
        setReviews(res.reviews);
        setAverageRating(res.averageRating);
        setTotalCount(res.totalReviewCount ?? res.reviews.length);

        // Inicializar borradores sugeridos
        const iniciales: Record<string, string> = {};
        for (const r of res.reviews) {
          if (!r.reviewReply && r.borradorSugerido) {
            iniciales[r.reviewId] = r.borradorSugerido;
          }
        }
        setBorradores(iniciales);
      } else {
        setErrorCriollo(
          res.errorCriollo ||
            'Google no tiene habilitado el acceso a las reseñas con esta cuenta conectada. Verificá los permisos de Google Business en Ajustes.'
        );
      }
    } catch (err: any) {
      setErrorCriollo(
        'Hubo un problema al conectar con Google. Por favor verificá la conexión en Ajustes.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const handlePublicar = async (reviewId: string) => {
    const texto = (borradores[reviewId] || '').trim();
    if (!texto) {
      toast({
        title: 'Borrador vacío',
        description: 'Escribí o editá una respuesta antes de publicar.',
        variant: 'destructive',
      });
      return;
    }

    setPublicandoId(reviewId);
    try {
      const res = await publicarRespuestaResenaAction(reviewId, texto);
      if (res.success) {
        toast({
          title: 'Respuesta publicada',
          description: 'Se publicó la respuesta oficial en Google Maps con éxito.',
        });
        // Actualizar localmente la reseña como respondida
        setReviews((prev) =>
          prev.map((r) =>
            r.reviewId === reviewId
              ? {
                  ...r,
                  reviewReply: res.reply || {
                    comment: texto,
                    updateTime: new Date().toISOString(),
                  },
                }
              : r
          )
        );
      } else {
        toast({
          title: 'No se pudo publicar',
          description:
            res.errorCriollo ||
            res.error ||
            'Google rechazó la publicación. Intentá más tarde.',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      toast({
        title: 'Error de conexión',
        description: err.message || 'No se pudo contactar con los servidores de Google.',
        variant: 'destructive',
      });
    } finally {
      setPublicandoId(null);
    }
  };

  const formatearEstrellas = (starRating: string | number) => {
    let count = 5;
    if (typeof starRating === 'number') count = starRating;
    else if (starRating === 'FOUR') count = 4;
    else if (starRating === 'THREE') count = 3;
    else if (starRating === 'TWO') count = 2;
    else if (starRating === 'ONE') count = 1;

    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < count
            ? 'fill-amber-400 text-amber-400'
            : 'text-slate-300 dark:text-slate-700'
        }`}
      />
    ));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Cabezal de Navegación */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Button asChild variant="ghost" size="sm" className="h-8 px-2 -ml-2 text-slate-500">
              <Link href="/empresa">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Volver a Empresa
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <span className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">⭐</span>
            Reseñas de Google
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gestión y respuestas a clientes en tu ficha de Google Business Profile y Google Maps.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/empresa/redes-sociales">
              Ver Ajustes de Redes
            </Link>
          </Button>
          <Button onClick={cargarDatos} variant="outline" size="sm" disabled={isLoading}>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Actualizar'}
          </Button>
        </div>
      </div>

      {/* Cartel de Error o Falta de Permiso en Criollo */}
      {errorCriollo && (
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800/40">
          <CardContent className="p-5 flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h3 className="font-bold text-amber-900 dark:text-amber-200">
                Aviso sobre la cuenta de Google
              </h3>
              <p className="text-sm text-amber-800 dark:text-amber-300">
                {errorCriollo}
              </p>
              <div className="pt-2">
                <Button asChild size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">
                  <Link href="/empresa/redes-sociales">
                    Ir a Ajustes de Conexión
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Métricas Generales */}
      {!isLoading && !errorCriollo && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4 flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 text-amber-600 rounded-2xl">
              <Star className="w-6 h-6 fill-amber-500 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                Calificación Media
              </p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                {averageRating ? averageRating.toFixed(1) : '5.0'} / 5.0
              </p>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 text-blue-600 rounded-2xl">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                Total de Reseñas
              </p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                {totalCount}
              </p>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                Sin Responder
              </p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                {reviews.filter((r) => !r.reviewReply).length}
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Lista de Reseñas */}
      {isLoading ? (
        <div className="p-12 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-amber-600 mx-auto" />
          <p className="text-sm text-slate-500">Buscando reseñas en Google Business...</p>
        </div>
      ) : !errorCriollo && reviews.length === 0 ? (
        <Card className="p-8 text-center text-slate-500">
          <p className="text-base font-semibold">No se encontraron reseñas registradas en esta ubicación.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => {
            const yaRespondida = Boolean(r.reviewReply);
            const borradorActual = borradores[r.reviewId] || '';

            return (
              <Card
                key={r.reviewId}
                className={`transition-all ${
                  yaRespondida
                    ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                    : 'border-amber-300/80 bg-amber-50/10 shadow-sm'
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-sm overflow-hidden">
                        {r.reviewer.profilePhotoUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={r.reviewer.profilePhotoUrl}
                            alt={r.reviewer.displayName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          r.reviewer.displayName.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                          {r.reviewer.displayName}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {r.createTime
                            ? format(new Date(r.createTime), "d 'de' MMMM, yyyy", { locale: es })
                            : 'Reciente'}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        {formatearEstrellas(r.starRating)}
                      </div>
                      <Badge
                        variant={yaRespondida ? 'outline' : 'default'}
                        className={
                          yaRespondida
                            ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                            : 'bg-amber-600 text-white'
                        }
                      >
                        {yaRespondida ? 'Respondida' : 'Pendiente'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Comentario del cliente */}
                  {r.comment ? (
                    <p className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                      "{r.comment}"
                    </p>
                  ) : (
                    <p className="text-xs italic text-slate-400">
                      (El cliente dejó calificación con estrellas sin texto)
                    </p>
                  )}

                  {/* Si ya tiene respuesta oficial */}
                  {yaRespondida && r.reviewReply && (
                    <div className="rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3.5 space-y-1.5">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Respuesta de AK Producciones
                      </p>
                      <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                        {r.reviewReply.comment}
                      </p>
                    </div>
                  )}

                  {/* Si NO está respondida: Borrador sugerido + botón de publicar */}
                  {!yaRespondida && (
                    <div className="pt-2 space-y-3 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                          Borrador sugerido por IA (amable y en criollo):
                        </label>
                        <span className="text-[11px] text-slate-400">
                          Podés editarlo antes de enviar
                        </span>
                      </div>

                      <Textarea
                        value={borradorActual}
                        onChange={(e) =>
                          setBorradores((prev) => ({
                            ...prev,
                            [r.reviewId]: e.target.value,
                          }))
                        }
                        rows={3}
                        className="text-sm bg-white dark:bg-slate-900 border-slate-300 focus:border-amber-500"
                        placeholder="Escribí una respuesta amable..."
                      />

                      <div className="flex justify-end gap-2">
                        <Button
                          onClick={() => handlePublicar(r.reviewId)}
                          disabled={publicandoId === r.reviewId || !borradorActual.trim()}
                          className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
                          size="sm"
                        >
                          {publicandoId === r.reviewId ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                              Publicando...
                            </>
                          ) : (
                            <>
                              <Send className="w-3.5 h-3.5 mr-1.5" />
                              Publicar respuesta
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ArrowLeft, Heart, Sparkles, MessageSquare, CheckCircle2, Palette, Layers, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { enviarOpinionDecoracion } from '@/app/actions/fiesta/decoracion.actions';
import type { FiestaEnPlanificacion } from '@/types/fiesta';

export default function ClientDecoracionPage() {
  const resolvedParams = useParams<{ fiestaId: string }>();
  const fiestaId = resolvedParams.fiestaId;
  const { toast } = useToast();

  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [comentario, setComentario] = useState('');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(false);
    try {
      const data = await getFiestaById(fiestaId);
      if (!data) throw new Error('Fiesta no encontrada');
      setFiesta(data);
      if (data.decoracion?.opinionCliente?.comentario) {
        setComentario(data.decoracion.opinionCliente.comentario);
      }
    } catch {
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  }, [fiestaId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpinion = async (leGusta: boolean) => {
    setIsSubmitting(true);
    try {
      const res = await enviarOpinionDecoracion(fiestaId, leGusta, leGusta ? undefined : comentario);
      if (res.success) {
        toast({
          title: leGusta ? '¡Qué bueno que te guste!' : 'Comentario enviado',
          description: leGusta
            ? 'Registramos tu conformidad con la propuesta de ambientación.'
            : 'El equipo de diseño revisará tus sugerencias para ajustar la propuesta.',
        });
        setFiesta((prev) => {
          if (!prev) return prev;
          const deco = prev.decoracion || {};
          return {
            ...prev,
            decoracion: {
              ...deco,
              opinionCliente: {
                leGusta,
                comentario: leGusta ? undefined : comentario,
                fecha: new Date().toISOString(),
              },
            },
          };
        });
        if (leGusta) setShowFeedbackForm(false);
      } else {
        toast({ title: 'Error', description: res.error || 'No se pudo guardar tu respuesta.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Ocurrió un error al enviar la respuesta.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="flex flex-col items-center gap-4 text-white">
          <Loader2 className="w-10 h-10 animate-spin text-purple-400" />
          <p className="text-sm uppercase tracking-widest text-slate-300">Cargando propuesta de decoración...</p>
        </div>
      </div>
    );
  }

  if (loadError || !fiesta) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 p-6">
        <Card className="max-w-md w-full text-center bg-slate-900 border-slate-800 text-white">
          <CardHeader>
            <CardTitle>No pudimos cargar la propuesta</CardTitle>
            <CardDescription className="text-slate-400">Verificá tu enlace o consultá al equipo de AK.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="text-slate-900">
              <Link href={`/portal-cliente/${fiestaId}`}>Volver al portal</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const deco = fiesta.decoracion || {};
  const palette = deco.colorPalette || { primary: '#9333ea', secondary: '#111827', accent: '#f59e0b' };
  const items = deco.itemsDecoracion || [];
  const fotosAi = deco.fotosGeneradasAi || [];
  const moodboard = deco.moodboardItems || [];
  const opinion = deco.opinionCliente;

  return (
    <div className="min-h-screen bg-slate-950 text-white font-body pb-16">
      {/* Header Bar */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/90 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Button asChild variant="ghost" size="sm" className="text-slate-300 hover:text-white">
            <Link href={`/portal-cliente/${fiestaId}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Portal
            </Link>
          </Button>
          <div className="text-right">
            <p className="text-xs text-slate-400 font-medium">Ambientación y Estilo</p>
            <p className="text-sm font-bold text-slate-100">{fiesta.configuracion.nombreEvento}</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-8 space-y-8">
        {/* Hero Section */}
        <section className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-purple-300">
            <Sparkles className="w-3.5 h-3.5" />
            Propuesta de Decoración
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white">Así va a quedar tu fiesta</h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto">
            Diseñamos la ambientación especialmente para vos, cuidando los colores, la iluminación y cada rincón del salón.
          </p>
        </section>

        {/* Client Feedback Card */}
        <section>
          <Card className="border-purple-500/40 bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-900 shadow-xl">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <CardTitle className="text-lg text-white font-bold flex items-center gap-2">
                  <Heart className="w-5 h-5 text-pink-400" />
                  ¿Qué te parece la propuesta?
                </CardTitle>
                {opinion && (
                  <Badge className={opinion.leGusta ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'}>
                    {opinion.leGusta ? '✓ Te gustó la propuesta' : 'Sugerencia enviada'}
                  </Badge>
                )}
              </div>
              <CardDescription className="text-slate-300 text-xs sm:text-sm">
                Tu opinión nos ayuda a afinar los detalles de montaje antes de la fecha.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => handleOpinion(true)}
                  disabled={isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                  Me gusta así
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowFeedbackForm(!showFeedbackForm)}
                  className="border-white/20 text-slate-200 hover:bg-white/10 text-xs font-semibold"
                >
                  <MessageSquare className="w-4 h-4 mr-2 text-purple-400" />
                  Quiero cambiar algo
                </Button>
              </div>

              {showFeedbackForm && (
                <div className="space-y-3 pt-3 border-t border-white/10">
                  <p className="text-xs text-slate-300 font-medium">Contanos qué te gustaría ajustar (ej. colores, tipo de flores, centros de mesa):</p>
                  <Textarea
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                    placeholder="Escribí acá tu comentario o pedido de cambio..."
                    className="bg-slate-950 border-white/20 text-white text-sm"
                    rows={3}
                  />
                  <Button
                    onClick={() => handleOpinion(false)}
                    disabled={isSubmitting || !comentario.trim()}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs uppercase"
                  >
                    {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Enviar sugerencia
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* AI Visualizations & Salón Render */}
        {fotosAi.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-purple-400" />
              Visualización del Salón Decorado
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fotosAi.map((foto, idx) => (
                <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border border-white/15 shadow-2xl bg-slate-900">
                  <Image src={foto} alt={`Visualización de decoración ${idx + 1}`} fill className="object-cover" />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Color Palette */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Palette className="w-5 h-5 text-purple-400" />
            Paleta de Colores de tu Evento
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-xl border border-white/10 bg-slate-900 flex flex-col items-center gap-2 text-center">
              <div className="w-12 h-12 rounded-full border-2 border-white/30 shadow-inner" style={{ backgroundColor: palette.primary }} />
              <p className="text-xs font-black uppercase tracking-wider text-slate-300">Principal</p>
              <p className="text-[11px] font-mono text-slate-400">{palette.primary}</p>
            </div>
            <div className="p-4 rounded-xl border border-white/10 bg-slate-900 flex flex-col items-center gap-2 text-center">
              <div className="w-12 h-12 rounded-full border-2 border-white/30 shadow-inner" style={{ backgroundColor: palette.secondary }} />
              <p className="text-xs font-black uppercase tracking-wider text-slate-300">Secundario</p>
              <p className="text-[11px] font-mono text-slate-400">{palette.secondary}</p>
            </div>
            <div className="p-4 rounded-xl border border-white/10 bg-slate-900 flex flex-col items-center gap-2 text-center">
              <div className="w-12 h-12 rounded-full border-2 border-white/30 shadow-inner" style={{ backgroundColor: palette.accent }} />
              <p className="text-xs font-black uppercase tracking-wider text-slate-300">Acento</p>
              <p className="text-[11px] font-mono text-slate-400">{palette.accent}</p>
            </div>
          </div>
        </section>

        {/* Elements by Zone */}
        {items.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-400" />
              Elementos de Ambientación
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {items.map((item) => (
                <div key={item.id} className="p-4 rounded-xl border border-white/10 bg-slate-900/80 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-bold text-sm text-slate-100">{item.nombre}</p>
                    <p className="text-xs text-slate-400 uppercase tracking-wider">{item.categoria}</p>
                  </div>
                  <Badge variant="outline" className="border-purple-500/40 text-purple-300 font-mono text-xs">
                    x{item.cantidad}
                  </Badge>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Moodboard / Inspiration Photos */}
        {moodboard.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Heart className="w-5 h-5 text-pink-400" />
                Tablero de Inspiración
              </h2>
              <Button asChild variant="outline" size="sm" className="border-white/20 text-xs text-slate-200">
                <Link href={`/portal/${fiestaId}/moodboard`}>Ver tablero completo</Link>
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {moodboard.slice(0, 8).map((item) => (
                <div key={item.id} className="relative aspect-square rounded-lg overflow-hidden border border-white/10 bg-slate-900 group">
                  <Image src={item.url} alt={item.description || 'Inspiración'} fill className="object-cover transition-transform group-hover:scale-105" />
                  {item.likedByClient && (
                    <div className="absolute top-2 right-2 p-1.5 rounded-full bg-pink-600 text-white shadow">
                      <Heart className="w-3.5 h-3.5 fill-current" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

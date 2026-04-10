'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft, Star, TrendingUp, Users, Gift, Camera, CheckCircle2,
  Send, Loader2, BarChart3, Heart, MessageSquare, Share2,
} from 'lucide-react';
import { getFiestaById, updateFiestaPostEvento } from '@/app/actions/fiesta/fiesta.actions';
import type { FiestaEnPlanificacion } from '@/types/fiesta';

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', minimumFractionDigits: 0 }).format(n);

function getNpsLabel(score: number): { label: string; color: string } {
  if (score >= 9) return { label: 'Promotor 🌟', color: 'text-green-600' };
  if (score >= 7) return { label: 'Neutro 😐', color: 'text-yellow-600' };
  return { label: 'Detractor ⚠️', color: 'text-red-600' };
}

function PostEventoContent() {
  const searchParams = useSearchParams();
  const fiestaId = searchParams.get('fiestaId');
  const { toast } = useToast();

  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [galeriaUrl, setGaleriaUrl] = useState('');
  const [galeriaEntregada, setGaleriaEntregada] = useState(false);
  const [npsScore, setNpsScore] = useState<number | null>(null);
  const [referidoPor, setReferidoPor] = useState('');
  const [nuevoReferido, setNuevoReferido] = useState('');

  const load = useCallback(async () => {
    if (!fiestaId) { setLoading(false); return; }
    setLoading(true);
    try {
      const data = await getFiestaById(fiestaId);
      if (data) {
        setFiesta(data);
        setGaleriaUrl(data.galeriaUrl ?? '');
        setGaleriaEntregada(data.galeriaEntregada ?? false);
        setNpsScore(data.npsScore ?? null);
        setReferidoPor(data.referidoPor ?? '');
      }
    } catch {
      toast({ title: 'Error', description: 'No se pudo cargar el evento.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [fiestaId, toast]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!fiestaId) return;
    setSaving(true);
    try {
      const result = await updateFiestaPostEvento(fiestaId, {
        galeriaUrl: galeriaUrl.trim() || undefined,
        galeriaEntregada,
        npsScore: npsScore ?? undefined,
        referidoPor: referidoPor.trim() || undefined,
      });
      if (result.success) {
        toast({ title: '✅ Guardado', description: 'Post-evento actualizado.' });
        load();
      } else {
        toast({ title: 'Error', description: result.error ?? 'No se pudo guardar.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Ocurrió un error inesperado.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddReferido = async () => {
    if (!fiestaId || !nuevoReferido.trim()) return;
    setSaving(true);
    try {
      const currentReferidos = fiesta?.referidosGenerados ?? [];
      const result = await updateFiestaPostEvento(fiestaId, {
        referidosGenerados: [...currentReferidos, nuevoReferido.trim()],
      });
      if (result.success) {
        toast({ title: '✅ Referido agregado' });
        setNuevoReferido('');
        load();
      }
    } catch {
      toast({ title: 'Error', description: 'No se pudo agregar el referido.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (!fiestaId) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <p>Seleccioná un evento para gestionar el post-evento.</p>
            <Link href="/eventos" className="mt-4 inline-block">
              <Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4 mr-2" />Ir a Eventos</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!fiesta) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <p>Evento no encontrado.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const config = fiesta.configuracion;
  const invitados = fiesta.invitados ?? [];
  const confirmados = invitados.filter(i => i.rsvp === 'Confirmado').length;
  const vips = invitados.filter(i => i.segmento === 'VIP').length;
  const familia = invitados.filter(i => i.segmento === 'Familia').length;
  const conAlergias = invitados.filter(i => i.alergias || (i.dietaryRestriction && i.dietaryRestriction !== 'Ninguna') || i.isCeliac).length;
  const cuotas = fiesta.planDePagos?.cuotas ?? [];
  const totalCobrado = cuotas.filter(c => c.estado === 'pagado').reduce((acc, c) => acc + c.monto, 0);
  const totalPresupuesto = config.presupuestoEstimado ?? 0;
  const referidos = fiesta.referidosGenerados ?? [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Link href={`/fiestas/nueva?id=${fiestaId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1" /> Volver
            </Button>
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-100">
            <Star className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Post-Evento Premium</h1>
            <p className="text-muted-foreground text-sm">{config.nombreEvento}</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Event Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Confirmados', value: confirmados, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'VIPs', value: vips, icon: Star, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Familia', value: familia, icon: Heart, color: 'text-pink-600', bg: 'bg-pink-50' },
            { label: 'Alergias', value: conAlergias, icon: CheckCircle2, color: 'text-orange-600', bg: 'bg-orange-50' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <Card key={label}>
              <CardContent className="pt-4 pb-4 text-center">
                <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mx-auto mb-1`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <p className={`text-2xl font-black ${color}`}>{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Financial Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Análisis de Rentabilidad Real
            </CardTitle>
            <CardDescription>Resumen financiero post-evento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-3 rounded-xl bg-green-50 border border-green-200">
                <p className="text-xs text-green-700 font-semibold">Total Cobrado</p>
                <p className="text-xl font-black text-green-800">{formatCurrency(totalCobrado)}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-xs text-slate-600 font-semibold">Presupuesto Original</p>
                <p className="text-xl font-black text-slate-800">{formatCurrency(totalPresupuesto)}</p>
              </div>
            </div>
            {totalPresupuesto > 0 && (
              <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200">
                <p className="text-xs text-indigo-700 font-semibold">Variación vs Presupuesto</p>
                <p className={`text-lg font-black ${totalCobrado >= totalPresupuesto ? 'text-green-700' : 'text-red-700'}`}>
                  {totalCobrado >= totalPresupuesto ? '+' : '-'}
                  {formatCurrency(Math.abs(totalCobrado - totalPresupuesto))}
                  {' '}
                  ({totalPresupuesto > 0 ? Math.round(((totalCobrado - totalPresupuesto) / totalPresupuesto) * 100) : 0}%)
                </p>
              </div>
            )}
            <div className="mt-3">
              <Link href={`/fiestas/nueva/gestion-costos-rentabilidad/reporte?id=${fiestaId}`}>
                <Button variant="outline" size="sm" className="w-full">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Ver Reporte Completo de Rentabilidad
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Gallery Delivery */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-purple-600" />
              Entrega de Galería
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">URL de la Galería</label>
              <Input
                placeholder="https://drive.google.com/... o enlace de fotos"
                value={galeriaUrl}
                onChange={e => setGaleriaUrl(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setGaleriaEntregada(!galeriaEntregada)}
                className={`w-10 h-6 rounded-full transition-colors ${galeriaEntregada ? 'bg-green-500' : 'bg-slate-300'}`}
              >
                <span className={`block w-4 h-4 bg-white rounded-full shadow transition-transform mx-1 ${galeriaEntregada ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
              <span className="text-sm font-medium">
                {galeriaEntregada ? '✅ Galería entregada al cliente' : 'Galería pendiente de entrega'}
              </span>
            </div>
            {fiesta.galeriaEntregada && fiesta.galeriaUrl && (
              <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                <p className="text-sm text-green-700 font-semibold mb-1">✅ Galería entregada</p>
                <a href={fiesta.galeriaUrl} target="_blank" rel="noopener noreferrer"
                  className="text-blue-600 underline text-sm break-all">{fiesta.galeriaUrl}</a>
              </div>
            )}
          </CardContent>
        </Card>

        {/* NPS Score */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              Satisfacción del Cliente (NPS)
            </CardTitle>
            <CardDescription>¿Cuánto recomendaría el cliente nuestros servicios del 0 al 10?</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap mb-3">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(score => (
                <button
                  key={score}
                  onClick={() => setNpsScore(score)}
                  className={`w-10 h-10 rounded-lg font-bold text-sm transition-all border-2 ${
                    npsScore === score
                      ? score >= 9 ? 'bg-green-500 text-white border-green-600'
                        : score >= 7 ? 'bg-yellow-500 text-white border-yellow-600'
                        : 'bg-red-500 text-white border-red-600'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-primary'
                  }`}
                >
                  {score}
                </button>
              ))}
            </div>
            {npsScore !== null && (
              <div className={`p-3 rounded-lg ${npsScore >= 9 ? 'bg-green-50 border-green-200' : npsScore >= 7 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'} border`}>
                <p className={`text-sm font-semibold ${getNpsLabel(npsScore).color}`}>
                  Puntaje {npsScore}/10 — {getNpsLabel(npsScore).label}
                </p>
              </div>
            )}
            <div className="mt-3">
              <Link href={`/feedback/${fiestaId}`}>
                <Button variant="outline" size="sm">
                  <Share2 className="w-4 h-4 mr-2" />
                  Ver encuesta de satisfacción
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Referral Tracking */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-rose-600" />
              Tracking de Referidos
            </CardTitle>
            <CardDescription>Registrá quién recomendó a este cliente y los nuevos clientes que generó este evento.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">¿Cómo llegó este cliente?</label>
              <Input
                placeholder="Nombre del cliente o fuente que lo refirió"
                value={referidoPor}
                onChange={e => setReferidoPor(e.target.value)}
              />
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium mb-2">Nuevos referidos generados por este evento ({referidos.length})</p>
              {referidos.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {referidos.map((ref, i) => (
                    <Badge key={i} variant="secondary">👤 {ref}</Badge>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  placeholder="Nombre del nuevo cliente referido"
                  value={nuevoReferido}
                  onChange={e => setNuevoReferido(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddReferido()}
                />
                <Button
                  variant="outline"
                  onClick={handleAddReferido}
                  disabled={saving || !nuevoReferido.trim()}
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button onClick={handleSave} disabled={saving} className="w-full" size="lg">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
          Guardar Post-Evento
        </Button>
      </div>
    </div>
  );
}

export default function PostEventoPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <PostEventoContent />
    </Suspense>
  );
}

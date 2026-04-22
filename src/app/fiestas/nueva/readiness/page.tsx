'use client';

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Activity, AlertTriangle, CheckCircle2, ArrowLeft, RefreshCw, ShieldAlert, Target, Loader2 } from 'lucide-react';
import { getFiestaById } from '@/app/actions/fiesta-actual';
import { calculateReadinessScore, getReadinessColor, getReadinessLabel } from '@/lib/readiness-score';
import type { ReadinessReport, NivelRiesgo } from '@/types/readiness';
import type { FiestaEnPlanificacion } from '@/types/fiesta';

const nivelRiesgoConfig: Record<NivelRiesgo, { label: string; className: string; badgeClass: string }> = {
  Critico: { label: 'Crítico', className: 'border-l-red-500 bg-red-50', badgeClass: 'bg-red-100 text-red-800' },
  Alto: { label: 'Alto', className: 'border-l-orange-500 bg-orange-50', badgeClass: 'bg-orange-100 text-orange-800' },
  Medio: { label: 'Medio', className: 'border-l-yellow-500 bg-yellow-50', badgeClass: 'bg-yellow-100 text-yellow-800' },
  Bajo: { label: 'Bajo', className: 'border-l-blue-500 bg-blue-50', badgeClass: 'bg-blue-100 text-blue-800' },
};

const NIVEL_ORDER: NivelRiesgo[] = ['Critico', 'Alto', 'Medio', 'Bajo'];

function getScoreBgColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-600';
}

function getProgressColor(score: number): string {
  if (score >= 80) return '[&>div]:bg-green-500';
  if (score >= 60) return '[&>div]:bg-yellow-500';
  return '[&>div]:bg-red-500';
}

function ReadinessContent() {
  const searchParams = useSearchParams();
  const fiestaId = searchParams.get('fiestaId');
  const { toast } = useToast();

  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [report, setReport] = useState<ReadinessReport | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!fiestaId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getFiestaById(fiestaId);
      if (!data) {
        toast({ title: 'Error', description: 'Evento no encontrado.', variant: 'destructive' });
        setLoading(false);
        return;
      }
      setFiesta(data);
      const r = calculateReadinessScore(data);
      setReport(r);
    } catch {
      toast({ title: 'Error', description: 'No se pudo calcular el readiness score.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [fiestaId, toast]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!fiestaId) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-2 mb-6">
          <Link href="/eventos">
            <Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4 mr-2" />Volver</Button>
          </Link>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <AlertTriangle className="h-10 w-10 mb-3 opacity-40" />
            <p>No se especificó un evento. Usá el parámetro <code>?fiestaId=...</code> en la URL.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <AlertTriangle className="h-10 w-10 mb-3 opacity-40" />
            <p>No se pudo generar el reporte de readiness.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const score = report.porcentajeReadiness;
  const scoreColorClass = getScoreBgColor(score);
  const progressColorClass = getProgressColor(score);
  const label = getReadinessLabel(score);

  const riesgosPorNivel = NIVEL_ORDER.reduce<Record<NivelRiesgo, typeof report.riesgos[0][]>>((acc, nivel) => {
    acc[nivel] = report.riesgos.filter(r => r.nivelRiesgo === nivel);
    return acc;
  }, { Critico: [], Alto: [], Medio: [], Bajo: [] });

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Link href={`/fiestas/nueva?fiestaId=${fiestaId}`}>
          <Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4 mr-2" />Volver al Evento</Button>
        </Link>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Recalcular
        </Button>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Activity className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Readiness Score</h1>
        </div>
        <p className="text-muted-foreground">
          Evaluación del estado de preparación del evento.
          {fiesta?.configuracion?.nombreEvento && (
            <span className="ml-1 font-medium">{fiesta.configuracion.nombreEvento}</span>
          )}
        </p>
      </div>

      {/* Score Card */}
      <Card className="mb-6 overflow-hidden">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Big Score */}
            <div className="flex flex-col items-center justify-center w-36 h-36 rounded-full border-4 border-muted shrink-0" style={{ borderColor: score >= 80 ? '#16a34a' : score >= 60 ? '#ca8a04' : '#dc2626' }}>
              <span className={`text-4xl font-bold ${scoreColorClass}`}>{score}%</span>
              <span className={`text-sm font-medium ${scoreColorClass}`}>{label}</span>
            </div>

            <div className="flex-1 w-full">
              <Progress value={score} className={`h-4 mb-4 ${progressColorClass}`} />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="bg-muted/50 rounded p-2">
                  <p className="text-2xl font-bold text-red-600">{report.detalles.tareasVencidas}</p>
                  <p className="text-xs text-muted-foreground">Tareas vencidas</p>
                </div>
                <div className="bg-muted/50 rounded p-2">
                  <p className="text-2xl font-bold text-orange-600">{report.detalles.pagosPendientes}</p>
                  <p className="text-xs text-muted-foreground">Pagos pendientes</p>
                </div>
                <div className="bg-muted/50 rounded p-2">
                  <p className="text-2xl font-bold text-yellow-600">{report.detalles.docsAusentes}</p>
                  <p className="text-xs text-muted-foreground">Docs ausentes</p>
                </div>
                <div className="bg-muted/50 rounded p-2">
                  <p className="text-2xl font-bold text-blue-600">{report.detalles.proveedoresNoConfirmados}</p>
                  <p className="text-xs text-muted-foreground">Proveedores sin confirmar</p>
                </div>
              </div>
              {report.detalles.cateringStatus && (
                <p className="text-xs text-muted-foreground mt-2">Catering: {report.detalles.cateringStatus}</p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Calculado: {new Date(report.calculadoEn).toLocaleString('es-AR')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Riesgos */}
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-3">
            <ShieldAlert className="h-5 w-5 text-primary" /> Riesgos Identificados
          </h2>
          {report.riesgos.length === 0 ? (
            <Card>
              <CardContent className="flex items-center gap-2 py-4 text-green-700">
                <CheckCircle2 className="h-5 w-5" />
                <span>¡Sin riesgos identificados!</span>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {NIVEL_ORDER.map((nivel) => {
                const riesgos = riesgosPorNivel[nivel];
                if (riesgos.length === 0) return null;
                const config = nivelRiesgoConfig[nivel];
                return (
                  <div key={nivel}>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={`text-xs ${config.badgeClass}`}>{config.label}</Badge>
                      <span className="text-xs text-muted-foreground">{riesgos.length} riesgo(s)</span>
                    </div>
                    <div className="space-y-2">
                      {riesgos.map((riesgo) => (
                        <div key={riesgo.id} className={`border-l-4 rounded-r p-3 ${config.className}`}>
                          <p className="text-sm font-medium">{riesgo.descripcion}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            <span className="font-medium">Módulo:</span> {riesgo.modulo}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            <span className="font-medium">Acción:</span> {riesgo.accionSugerida}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Prioridades y acciones */}
        <div className="space-y-4">
          {report.prioridades.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" /> Prioridades
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-2">
                  {report.prioridades.map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">{i + 1}</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}

          {report.accionesSugeridas.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" /> Acciones Sugeridas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {report.accionesSugeridas.map((accion, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <span>{accion}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {score >= 80 && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="flex items-center gap-3 py-4">
                <CheckCircle2 className="h-8 w-8 text-green-600 shrink-0" />
                <div>
                  <p className="font-semibold text-green-800">¡Evento listo!</p>
                  <p className="text-sm text-green-700">El evento está en excelente estado de preparación.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ReadinessPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <ReadinessContent />
    </Suspense>
  );
}

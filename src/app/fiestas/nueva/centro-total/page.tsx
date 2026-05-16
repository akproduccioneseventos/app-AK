'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ElementType } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  Bot,
  CheckCircle2,
  ClipboardCheck,
  Download,
  Loader2,
  MonitorPlay,
  QrCode,
  RefreshCw,
  Rocket,
  ShieldCheck,
  Sparkles,
  WifiOff,
} from 'lucide-react';

import { activateUltimateEventSystem, getExperienceTotalReport } from '@/app/actions/experience-total';
import type { UltimateEventSystemReport, UltimateFeature } from '@/lib/experience-ak/ultimate-event-system';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const featureIcon: Record<UltimateFeature['id'], ElementType> = {
  'test-drive': ClipboardCheck,
  health: Activity,
  'smart-qr': QrCode,
  'post-event': Sparkles,
  'sales-demo': MonitorPlay,
  'party-agent': Bot,
  offline: WifiOff,
};

const statusStyle: Record<UltimateFeature['status'], string> = {
  ready: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  partial: 'border-amber-200 bg-amber-50 text-amber-700',
  missing: 'border-red-200 bg-red-50 text-red-700',
};

function absoluteUrl(path: string) {
  if (typeof window === 'undefined') return path;
  if (path.startsWith('http')) return path;
  return `${window.location.origin}${path}`;
}

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function MissingState({ fiestaId }: { fiestaId: string | null }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <Card className="max-w-xl rounded-[2rem] border-slate-200 bg-white shadow-xl">
        <CardContent className="p-8 text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-amber-500" />
          <h1 className="mt-4 text-2xl font-black text-slate-950">No pude abrir el Centro Total</h1>
          <p className="mt-2 text-sm text-slate-500">
            {fiestaId ? 'No encontre esa fiesta.' : 'Falta elegir una fiesta para revisar.'}
          </p>
          <Button asChild className="mt-6 rounded-2xl bg-red-600 font-black hover:bg-red-700">
            <Link href="/eventos">Volver a eventos</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}

export default function CentroTotalPage() {
  const searchParams = useSearchParams();
  const fiestaId = searchParams.get('fiestaId');
  const { toast } = useToast();
  const [report, setReport] = useState<UltimateEventSystemReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!fiestaId) {
      setLoading(false);
      setError('Falta fiestaId.');
      return;
    }
    setLoading(true);
    setError(null);
    const result = await getExperienceTotalReport(fiestaId);
    if (!result.success || !result.report) {
      setError(result.error || 'No se pudo cargar.');
      setReport(null);
    } else {
      setReport(result.report);
    }
    setLoading(false);
  }, [fiestaId]);

  useEffect(() => {
    load();
  }, [load]);

  const smartQrUrl = useMemo(() => (report ? absoluteUrl(`/q/${encodeURIComponent(report.fiestaId)}`) : ''), [report]);

  const handleActivate = async () => {
    if (!fiestaId) return;
    setActivating(true);
    const result = await activateUltimateEventSystem(fiestaId);
    setActivating(false);
    if (!result.success || !result.report) {
      toast({ title: 'No se pudo activar', description: result.error || 'Intenta nuevamente.', variant: 'destructive' });
      return;
    }
    setReport(result.report);
    toast({ title: 'Sistema total activado', description: 'Portal, QR, social, zona digital, offline y tareas quedaron conectados.' });
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </main>
    );
  }

  if (!report) return <MissingState fiestaId={fiestaId} />;

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_48%,#ffffff_100%)] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="outline" className="rounded-2xl bg-white font-bold">
            <Link href={`/fiestas/nueva?fiestaId=${encodeURIComponent(report.fiestaId)}`}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Volver a la fiesta
            </Link>
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="rounded-2xl bg-white font-bold" onClick={load}>
              <RefreshCw className="mr-2 h-4 w-4" /> Recalcular
            </Button>
            <Button className="rounded-2xl bg-red-600 font-black hover:bg-red-700" onClick={handleActivate} disabled={activating}>
              {activating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Rocket className="mr-2 h-4 w-4" />}
              Activar todo
            </Button>
          </div>
        </div>

        {error && (
          <Card className="rounded-2xl border-amber-200 bg-amber-50">
            <CardContent className="p-4 text-sm font-semibold text-amber-800">{error}</CardContent>
          </Card>
        )}

        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-950/10">
          <div className="grid gap-0 lg:grid-cols-[1fr_380px]">
            <div className="p-6 sm:p-8">
              <Badge className="bg-slate-950 text-white">Centro Total AK</Badge>
              <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">{report.eventName}</h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">{report.headline}</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">Funciones</p>
                  <p className="mt-1 text-2xl font-black">{report.features.length}/7</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">Bloqueos</p>
                  <p className="mt-1 text-2xl font-black">{report.blockers.length}</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">Agente</p>
                  <p className="mt-1 text-2xl font-black">{report.agentBrief.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-slate-950 p-6 text-white sm:p-8">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-red-100">Estado total</p>
              <p className="mt-4 text-7xl font-black">{report.score}%</p>
              <Progress value={report.score} className="mt-5 h-3 bg-white/10 [&>div]:bg-red-500" />
              <p className="mt-4 text-sm leading-6 text-slate-300">
                Esto junta prueba, salud, QR, post-fiesta, demo, agente y offline en un solo tablero.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {report.features.map((item) => {
            const Icon = featureIcon[item.id];
            return (
              <Card key={item.id} className="rounded-[1.5rem] border-slate-200 bg-white shadow-lg shadow-slate-950/5">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="rounded-2xl bg-red-50 p-3 text-red-600">
                      <Icon className="h-5 w-5" />
                    </div>
                    <Badge variant="outline" className={cn('font-black', statusStyle[item.status])}>
                      {item.score}%
                    </Badge>
                  </div>
                  <h2 className="mt-4 text-lg font-black text-slate-950">{item.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{item.promise}</p>
                  <div className="mt-4 space-y-1 text-xs text-slate-500">
                    {item.missing.slice(0, 2).map((missing) => (
                      <p key={missing}>Falta: {missing}</p>
                    ))}
                    {item.missing.length === 0 && <p className="font-semibold text-emerald-700">Sin faltantes principales.</p>}
                  </div>
                  <Button asChild variant="outline" className="mt-4 w-full rounded-2xl bg-white font-bold">
                    <Link href={item.href}>
                      Abrir <ArrowUpRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <Tabs defaultValue="qr" className="space-y-4">
          <TabsList className="h-auto flex-wrap justify-start rounded-2xl bg-slate-100 p-1">
            <TabsTrigger value="qr">QR unico</TabsTrigger>
            <TabsTrigger value="test">Prueba fiesta</TabsTrigger>
            <TabsTrigger value="agent">Agente</TabsTrigger>
            <TabsTrigger value="offline">Offline</TabsTrigger>
            <TabsTrigger value="analytics">Analitica</TabsTrigger>
            <TabsTrigger value="sales">Venta</TabsTrigger>
            <TabsTrigger value="post">Post-fiesta</TabsTrigger>
          </TabsList>

          <TabsContent value="qr">
            <Card className="rounded-[2rem] border-slate-200 bg-white shadow-lg">
              <CardContent className="grid gap-6 p-6 lg:grid-cols-[280px_1fr]">
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 text-center">
                  <QRCodeSVG value={smartQrUrl} size={210} includeMargin />
                  <p className="mt-3 break-all text-xs font-semibold text-slate-500">{smartQrUrl}</p>
                  <Button asChild className="mt-4 w-full rounded-2xl bg-red-600 font-black hover:bg-red-700">
                    <Link href={`/q/${encodeURIComponent(report.fiestaId)}`}>Abrir QR unico</Link>
                  </Button>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {report.smartQrTargets.map((target) => (
                    <Link key={target.id} href={target.href} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-red-200 hover:bg-white">
                      <p className="text-xs font-black uppercase tracking-widest text-red-600">{target.audience}</p>
                      <h3 className="mt-1 font-black text-slate-950">{target.label}</h3>
                      <p className="mt-1 text-sm leading-5 text-slate-500">{target.description}</p>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="test">
            <Card className="rounded-[2rem] border-slate-200 bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-black">Modo Prueba de Fiesta</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 lg:grid-cols-2">
                {report.testDriveSteps.map((step) => (
                  <Link key={step.id} href={step.href} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-red-200 hover:bg-white">
                    <div className="flex items-start gap-3">
                      {step.required ? <ShieldCheck className="mt-0.5 h-5 w-5 text-red-600" /> : <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />}
                      <div>
                        <h3 className="font-black text-slate-950">{step.label}</h3>
                        <p className="mt-1 text-sm leading-5 text-slate-500">{step.goal}</p>
                        <p className="mt-2 text-xs font-semibold text-slate-400">{step.expectedResult}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="agent">
            <Card className="rounded-[2rem] border-slate-200 bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-black">Briefing del Agente de Fiesta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {report.agentBrief.length === 0 ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800">
                    <p className="font-black">El agente no detecta alertas principales.</p>
                    <p className="mt-1 text-sm">Puede dedicarse a confirmar detalles finos y seguimiento.</p>
                  </div>
                ) : (
                  report.agentBrief.map((item) => (
                    <Link key={item.id} href={item.href} className="block rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-red-200 hover:bg-white">
                      <Badge variant="outline" className={cn('font-black', item.severity === 'alta' ? 'border-red-200 bg-red-50 text-red-700' : item.severity === 'media' ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-slate-200 bg-white text-slate-600')}>
                        {item.severity}
                      </Badge>
                      <h3 className="mt-2 font-black text-slate-950">{item.title}</h3>
                      <p className="mt-1 text-sm leading-5 text-slate-500">{item.message}</p>
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
              <Card className="rounded-[2rem] border-slate-200 bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl font-black">
                    <BarChart3 className="h-6 w-6 text-red-600" />
                    Analitica de experiencia
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-[1.5rem] bg-slate-950 p-5 text-white">
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-red-100">Score estimado</p>
                    <p className="mt-2 text-6xl font-black">{report.experienceAnalytics.estimatedExperienceScore}%</p>
                    <Progress value={report.experienceAnalytics.estimatedExperienceScore} className="mt-4 h-3 bg-white/10 [&>div]:bg-red-500" />
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {[
                      ['Invitados', report.experienceAnalytics.invitedGuests],
                      ['Confirmados', report.experienceAnalytics.confirmedGuests],
                      ['RSVP', `${report.experienceAnalytics.rsvpRate}%`],
                      ['Funciones activas', report.experienceAnalytics.activeDigitalFeatures],
                      ['Portal cliente', report.experienceAnalytics.visibleClientPortalModules],
                      ['Fotos social', report.experienceAnalytics.socialPosts],
                    ].map(([label, value]) => (
                      <div key={String(label)} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</p>
                        <p className="mt-1 text-2xl font-black text-slate-950">{value}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-[2rem] border-slate-200 bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl font-black">Salud real de la app</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">Estado general</p>
                    <p className="mt-1 text-3xl font-black text-slate-950">{report.appHealth.score}%</p>
                    <p className="mt-1 text-sm text-slate-500">Backup, Firebase, mails, Calendar/Gmail, rutas publicas, PWA y analitica.</p>
                  </div>
                  {report.appHealth.checks.map((check) => (
                    <Link key={check.id} href={check.href || '#'} className="block rounded-2xl border border-slate-100 bg-white p-4 transition hover:border-red-200 hover:bg-slate-50">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-black text-slate-950">{check.label}</p>
                        <Badge variant="outline" className={cn('font-black', check.status === 'ok' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : check.status === 'warning' ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-red-200 bg-red-50 text-red-700')}>
                          {check.status}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm leading-5 text-slate-500">{check.detail}</p>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            </section>
          </TabsContent>

          <TabsContent value="offline">
            <Card className="rounded-[2rem] border-slate-200 bg-white shadow-lg">
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-2xl font-black">Modo Offline para Evento</CardTitle>
                <Button
                  variant="outline"
                  className="rounded-2xl bg-white font-bold"
                  onClick={() => downloadJson(`pack-offline-${report.fiestaId}.json`, { report, downloadedAt: new Date().toISOString() })}
                >
                  <Download className="mr-2 h-4 w-4" /> Descargar pack
                </Button>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                {report.offlinePack.map((item) => (
                  <Link key={item.id} href={item.href} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-red-200 hover:bg-white">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">{item.critical ? 'critico' : 'respaldo'}</p>
                    <h3 className="mt-1 font-black text-slate-950">{item.label}</h3>
                    <p className="mt-1 text-sm leading-5 text-slate-500">{item.description}</p>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sales">
            <Card className="rounded-[2rem] border-slate-200 bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-black">Modo Vendedor / Presentacion Comercial</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {report.salesDemoScript.map((line, index) => (
                  <div key={line} className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-600 text-sm font-black text-white">{index + 1}</div>
                    <p className="text-sm font-semibold leading-6 text-slate-700">{line}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="post">
            <Card className="rounded-[2rem] border-slate-200 bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-black">Post-fiesta Automatico</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                {report.postEventPlan.map((line, index) => (
                  <div key={line} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase tracking-widest text-red-600">Paso {index + 1}</p>
                    <p className="mt-1 text-sm font-semibold leading-6 text-slate-700">{line}</p>
                  </div>
                ))}
                <Button asChild className="rounded-2xl bg-red-600 font-black hover:bg-red-700 md:col-span-2">
                  <Link href={`/post-fiesta/${encodeURIComponent(report.fiestaId)}`}>Abrir pagina post-fiesta</Link>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

import Link from 'next/link';
import { ArrowLeft, CheckCircle2, DatabaseBackup, Download, ShieldCheck, AlertTriangle, Clock, RefreshCw } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { buildBackupReadinessReport, evaluarInformeBackupFinal } from '@/lib/backup/backup-health';
import { getBackupStatus } from '@/app/actions/backup';

export default async function BackupFinalPage() {
  const readiness = buildBackupReadinessReport();
  const backupStatus = await getBackupStatus().catch(() => null);

  const report = evaluarInformeBackupFinal({
    readiness,
    status: backupStatus || {
      lastSuccessfulBackup: null,
      consecutiveFailures: 1,
      lastError: 'No se pudo consultar el estado del respaldo',
    },
  });

  const { cobertura, estadoRespaldo, ready } = report;

  const fechaUltimaCopia = estadoRespaldo.lastSuccessfulBackup
    ? new Date(estadoRespaldo.lastSuccessfulBackup).toLocaleString('es-UY', {
        dateStyle: 'short',
        timeStyle: 'short',
      })
    : 'Nunca';

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="ghost">
            <Link href="/settings">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Link>
          </Button>
          <Badge
            className={
              ready
                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100'
                : 'bg-rose-100 text-rose-800 hover:bg-rose-100'
            }
          >
            {ready ? 'Listo' : 'Revisar: Respaldo incompleto o desactualizado'}
          </Badge>
        </div>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardContent className="space-y-5 p-6 sm:p-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm text-slate-700 shadow-sm">
                <DatabaseBackup className="h-4 w-4 text-emerald-700" />
                Guardado final AK
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Control de backup y restauracion</h1>
              <p className="max-w-3xl text-base text-muted-foreground">
                Esta pantalla confirma que los datos importantes de la app entran en el backup y que las copias se ejecutan sin fallas periódicamente.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <Link href="/api/backup/download">
                    <Download className="mr-2 h-4 w-4" />
                    Descargar backup ahora
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/settings/backup">
                    Abrir backup manual
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resumen simple</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-md bg-slate-100 p-3">
                <span>Archivos registrados</span>
                <strong>{cobertura.totalFiles}</strong>
              </div>
              <div className="flex items-center justify-between rounded-md bg-slate-100 p-3">
                <span>Areas criticas cubiertas</span>
                <strong>{cobertura.areas.filter((a) => a.ready).length} / {cobertura.areas.length}</strong>
              </div>
              <div className="flex items-center justify-between rounded-md bg-slate-100 p-3">
                <span>Estado de ejecucion</span>
                <strong className={estadoRespaldo.ok ? 'text-emerald-700' : 'text-rose-700'}>
                  {estadoRespaldo.ok ? 'Al dia (<24h)' : 'Falla o atrasado'}
                </strong>
              </div>
              <div className="flex items-center justify-between rounded-md bg-slate-100 p-3">
                <span>Cartel general</span>
                <strong className={ready ? 'text-emerald-700' : 'text-rose-700'}>
                  {ready ? 'Listo' : 'Revisar'}
                </strong>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* SECCIÓN 1: Cómo viene el respaldo */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Cómo viene el respaldo</h2>
            <Badge
              variant="outline"
              className={
                estadoRespaldo.ok
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                  : 'border-rose-300 bg-rose-50 text-rose-800'
              }
            >
              {estadoRespaldo.ok ? 'Al día y sin fallos' : 'Atención con el respaldo'}
            </Badge>
          </div>

          <Card
            className={
              estadoRespaldo.ok
                ? 'border-emerald-200 bg-emerald-50/40'
                : 'border-rose-200 bg-rose-50/50'
            }
          >
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start gap-4">
                <div
                  className={`rounded-full p-2.5 ${
                    estadoRespaldo.ok ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {estadoRespaldo.ok ? (
                    <CheckCircle2 className="h-6 w-6" />
                  ) : (
                    <AlertTriangle className="h-6 w-6" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className="text-lg font-semibold text-slate-900">
                    {estadoRespaldo.ok
                      ? 'Las copias automáticas están al día y protegidas'
                      : 'Se detectaron problemas en las copias automáticas'}
                  </h3>
                  {estadoRespaldo.motivo && (
                    <p className="text-sm font-medium text-rose-700">
                      Motivo: {estadoRespaldo.motivo}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    El sistema exige que la última copia exitosa tenga menos de 24 horas y que no haya fallos seguidos.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 pt-2 text-sm border-t border-slate-200/60">
                <div className="rounded-lg bg-white p-3 shadow-sm">
                  <span className="text-xs text-muted-foreground block">Última copia exitosa</span>
                  <span className="font-semibold text-slate-900 flex items-center gap-1.5 mt-0.5">
                    <Clock className="h-3.5 w-3.5 text-slate-500" />
                    {fechaUltimaCopia}
                  </span>
                </div>
                <div className="rounded-lg bg-white p-3 shadow-sm">
                  <span className="text-xs text-muted-foreground block">Fallos consecutivos</span>
                  <span
                    className={`font-semibold flex items-center gap-1.5 mt-0.5 ${
                      estadoRespaldo.consecutiveFailures > 0 ? 'text-rose-600' : 'text-slate-900'
                    }`}
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    {estadoRespaldo.consecutiveFailures}
                  </span>
                </div>
                <div className="rounded-lg bg-white p-3 shadow-sm">
                  <span className="text-xs text-muted-foreground block">Resultado de salud</span>
                  <span
                    className={`font-semibold block mt-0.5 ${
                      estadoRespaldo.ok ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {estadoRespaldo.ok ? 'Verde (Válido)' : 'Rojo (Atención requerida)'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* SECCIÓN 2: Qué cubre el respaldo */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Qué cubre el respaldo</h2>
            <Badge
              variant="outline"
              className={
                cobertura.ready
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                  : 'border-amber-300 bg-amber-50 text-amber-800'
              }
            >
              {cobertura.ready ? 'Todas las áreas cubiertas' : 'Áreas incompletas'}
            </Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {cobertura.areas.map((area) => (
              <Card key={area.id}>
                <CardHeader className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="rounded-lg bg-white p-3 text-slate-900 shadow-sm">
                      {area.ready ? <CheckCircle2 className="h-5 w-5 text-emerald-700" /> : <ShieldCheck className="h-5 w-5 text-amber-700" />}
                    </div>
                    <Badge variant="outline">{area.requiredFiles.length} archivos</Badge>
                  </div>
                  <CardTitle className="text-lg">{area.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{area.simpleGoal}</p>
                  {area.ready ? (
                    <div className="rounded-lg bg-emerald-50 p-3 text-sm font-medium text-emerald-800">Cubierto por backup</div>
                  ) : (
                    <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Falta: {area.missingFiles.join(', ')}</div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Card>
          <CardContent className="p-5 text-sm text-muted-foreground">
            El ZIP ahora incluye un archivo interno llamado <strong>_backup-readiness.json</strong>. Sirve para revisar que el backup descargado llevaba el mapa de cobertura de la app.
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
